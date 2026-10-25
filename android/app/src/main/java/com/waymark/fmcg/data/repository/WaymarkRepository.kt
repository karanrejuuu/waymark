package com.waymark.fmcg.data.repository

import com.waymark.fmcg.data.local.DeliveryDao
import com.waymark.fmcg.data.local.PaymentDao
import com.waymark.fmcg.data.local.RegionDao
import com.waymark.fmcg.data.local.ShopDao
import com.waymark.fmcg.data.model.Delivery
import com.waymark.fmcg.data.model.DueProductItem
import com.waymark.fmcg.data.model.EnrichedTodayStop
import com.waymark.fmcg.data.model.Payment
import com.waymark.fmcg.data.model.Region
import com.waymark.fmcg.data.model.Shop
import com.waymark.fmcg.data.model.VisitOutcome
import com.waymark.fmcg.domain.SchedulingEngine
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

class WaymarkRepository(
    private val shopDao: ShopDao,
    private val deliveryDao: DeliveryDao,
    private val paymentDao: PaymentDao,
    private val regionDao: RegionDao
) {
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)
    private val timeFormat = SimpleDateFormat("dd MMM, hh:mm a", Locale.US)

    fun getAllActiveShops(): Flow<List<Shop>> = shopDao.getAllActiveShops()

    fun getAllRegions(): Flow<List<Region>> = regionDao.getAllRegions()

    fun searchShops(query: String): Flow<List<Shop>> = shopDao.searchShops(query)

    suspend fun getShopById(shopId: String): Shop? = shopDao.getShopById(shopId)

    fun getShopFlow(shopId: String): Flow<Shop?> = shopDao.getShopFlow(shopId)

    fun getDeliveriesForShop(shopId: String): Flow<List<Delivery>> = deliveryDao.getDeliveriesForShop(shopId)

    /**
     * Combine Shops, ShopProducts, Products, and Regions to produce reactive Today's Dispatch Stops!
     */
    fun getTodayStops(): Flow<List<EnrichedTodayStop>> {
        val todayStr = SchedulingEngine.getTodayString()

        return combine(
            shopDao.getAllActiveShops(),
            shopDao.getAllShopProducts(),
            shopDao.getAllProducts(),
            regionDao.getAllRegions()
        ) { shops, shopProducts, products, regions ->
            val productMap = products.associateBy { it.id }
            val regionMap = regions.associateBy { it.id }
            val shopProductsByShop = shopProducts.groupBy { it.shopId }

            val enrichedList = mutableListOf<EnrichedTodayStop>()

            for (shop in shops) {
                val spList = shopProductsByShop[shop.id] ?: emptyList()
                val dueProducts = mutableListOf<DueProductItem>()

                for (sp in spList) {
                    if (SchedulingEngine.isDueToday(sp, shop.isUrgent, todayStr)) {
                        productMap[sp.productId]?.let { prod ->
                            dueProducts.add(DueProductItem(prod, sp))
                        }
                    }
                }

                if (dueProducts.isNotEmpty() || shop.isUrgent) {
                    val totalCrates = dueProducts.sumOf { it.shopProduct.defaultQty }
                    val earliestDueDate = spList.minOfOrNull { it.nextDueDate } ?: todayStr
                    val isOverdue = earliestDueDate < todayStr

                    enrichedList.add(
                        EnrichedTodayStop(
                            shop = shop,
                            region = regionMap[shop.regionId],
                            dueProducts = dueProducts,
                            totalCrates = totalCrates,
                            isUrgent = shop.isUrgent,
                            isOverdue = isOverdue
                        )
                    )
                }
            }

            SchedulingEngine.sortLIFOSequence(enrichedList)
        }
    }

    /**
     * Record visit outcome with rich business states
     */
    suspend fun recordVisitOutcome(
        shopId: String,
        outcome: VisitOutcome,
        quantities: Map<String, Int> = emptyMap(),
        paymentAmount: Double = 0.0,
        paymentMode: String = "cash",
        billNumber: String? = null,
        billAmount: Double = 0.0,
        previousBillSettled: Double = 0.0,
        followUpDays: Int = 1,
        notes: String? = null
    ) {
        val shop = shopDao.getShopById(shopId) ?: return
        val nowIso = Date().toString()
        val nowTimeStr = timeFormat.format(Date())

        fun appendNote(tag: String, text: String?): String {
            val entry = "[$tag · $nowTimeStr] ${text ?: ""}".trim()
            return if (!shop.notes.isNullOrBlank()) "$entry\n${shop.notes}" else entry
        }

        when (outcome) {
            VisitOutcome.DELIVERED_PAID -> {
                // 1. Deliver products
                val spList = shopDao.getShopProductsForShop(shopId)
                for (sp in spList) {
                    val qty = quantities[sp.productId] ?: sp.defaultQty
                    deliveryDao.insertDelivery(
                        Delivery(
                            id = UUID.randomUUID().toString(),
                            clientId = UUID.randomUUID().toString(),
                            shopId = shopId,
                            productId = sp.productId,
                            qty = qty,
                            deliveredAt = nowIso,
                            notes = notes,
                            createdAt = nowIso
                        )
                    )
                    // Advance cycle
                    val nextDue = SchedulingEngine.computeNextDueDate(sp.intervalDays, sp.remindOffsetDays)
                    shopDao.updateShopProduct(sp.copy(nextDueDate = nextDue, snoozeUntil = null))
                }

                // 2. Record payment if collected
                if (paymentAmount > 0.0) {
                    paymentDao.insertPayment(
                        Payment(
                            id = UUID.randomUUID().toString(),
                            clientId = UUID.randomUUID().toString(),
                            shopId = shopId,
                            amount = paymentAmount,
                            paymentMode = paymentMode,
                            notes = notes ?: "Collected at delivery",
                            collectedAt = nowIso,
                            createdAt = nowIso
                        )
                    )
                    val newBalance = maxOf(0.0, shop.balanceDue - paymentAmount)
                    shopDao.updateBalanceDue(shopId, newBalance, nowIso)
                }

                shopDao.clearUrgent(shopId, nowIso)
                val billText = if (!billNumber.isNullOrBlank()) "Bill #$billNumber · " else ""
                val payText = if (paymentAmount > 0.0) "₹$paymentAmount paid via $paymentMode" else "Delivered"
                shopDao.updateNotes(shopId, appendNote("Delivered & Paid", "$billText$payText · ${notes ?: ""}"), nowIso)
            }

            VisitOutcome.DELIVERED_UNPAID -> {
                val spList = shopDao.getShopProductsForShop(shopId)
                for (sp in spList) {
                    val qty = quantities[sp.productId] ?: sp.defaultQty
                    deliveryDao.insertDelivery(
                        Delivery(
                            id = UUID.randomUUID().toString(),
                            clientId = UUID.randomUUID().toString(),
                            shopId = shopId,
                            productId = sp.productId,
                            qty = qty,
                            deliveredAt = nowIso,
                            notes = "Cash pending · ${notes ?: ""}",
                            createdAt = nowIso
                        )
                    )
                    val nextDue = SchedulingEngine.computeNextDueDate(sp.intervalDays, sp.remindOffsetDays)
                    shopDao.updateShopProduct(sp.copy(nextDueDate = nextDue, snoozeUntil = null))
                }

                val newBalance = shop.balanceDue + billAmount
                shopDao.updateBalanceDue(shopId, newBalance, nowIso)
                shopDao.clearUrgent(shopId, nowIso)
                val billRef = if (!billNumber.isNullOrBlank()) "Bill #$billNumber" else "Invoice"
                shopDao.updateNotes(shopId, appendNote("Cash Not Received", "$billRef added ₹$billAmount to dues · ${notes ?: ""}"), nowIso)
            }

            VisitOutcome.BILL_TO_BILL -> {
                val spList = shopDao.getShopProductsForShop(shopId)
                for (sp in spList) {
                    val qty = quantities[sp.productId] ?: sp.defaultQty
                    deliveryDao.insertDelivery(
                        Delivery(
                            id = UUID.randomUUID().toString(),
                            clientId = UUID.randomUUID().toString(),
                            shopId = shopId,
                            productId = sp.productId,
                            qty = qty,
                            deliveredAt = nowIso,
                            notes = "Bill to bill clearance",
                            createdAt = nowIso
                        )
                    )
                    val nextDue = SchedulingEngine.computeNextDueDate(sp.intervalDays, sp.remindOffsetDays)
                    shopDao.updateShopProduct(sp.copy(nextDueDate = nextDue, snoozeUntil = null))
                }

                if (previousBillSettled > 0.0) {
                    paymentDao.insertPayment(
                        Payment(
                            id = UUID.randomUUID().toString(),
                            clientId = UUID.randomUUID().toString(),
                            shopId = shopId,
                            amount = previousBillSettled,
                            paymentMode = paymentMode,
                            notes = "Bill to bill cleared prior balance",
                            collectedAt = nowIso,
                            createdAt = nowIso
                        )
                    )
                }

                val newBalance = maxOf(0.0, shop.balanceDue - previousBillSettled) + billAmount
                shopDao.updateBalanceDue(shopId, newBalance, nowIso)
                shopDao.clearUrgent(shopId, nowIso)
                shopDao.updateNotes(shopId, appendNote("Bill-to-Bill Credit", "Cleared ₹$previousBillSettled | New Bill #${billNumber ?: "N/A"}: ₹$billAmount · ${notes ?: ""}"), nowIso)
            }

            VisitOutcome.FOLLOW_UP -> {
                val snoozeTarget = SchedulingEngine.computeSnoozeDate(followUpDays)
                val spList = shopDao.getShopProductsForShop(shopId)
                for (sp in spList) {
                    shopDao.updateShopProduct(sp.copy(snoozeUntil = snoozeTarget))
                }
                shopDao.clearUrgent(shopId, nowIso)
                shopDao.updateNotes(shopId, appendNote("Follow-Up", "Rescheduled to $snoozeTarget · ${notes ?: "Storekeeper requested return"}"), nowIso)
            }

            VisitOutcome.SHOP_CLOSED -> {
                val snoozeTarget = SchedulingEngine.computeSnoozeDate(1)
                val spList = shopDao.getShopProductsForShop(shopId)
                for (sp in spList) {
                    shopDao.updateShopProduct(sp.copy(snoozeUntil = snoozeTarget))
                }
                shopDao.clearUrgent(shopId, nowIso)
                shopDao.updateNotes(shopId, appendNote("Shop Closed", notes ?: "Shutter down / Closed on arrival"), nowIso)
            }

            VisitOutcome.NO_ORDER -> {
                val snoozeTarget = SchedulingEngine.computeSnoozeDate(3)
                val spList = shopDao.getShopProductsForShop(shopId)
                for (sp in spList) {
                    val adjusted = SchedulingEngine.adjustInterval(sp.intervalDays, "high")
                    shopDao.updateShopProduct(sp.copy(intervalDays = adjusted, snoozeUntil = snoozeTarget))
                }
                shopDao.clearUrgent(shopId, nowIso)
                shopDao.updateNotes(shopId, appendNote("Overstocked", notes ?: "Full rack on counter"), nowIso)
            }

            VisitOutcome.UPDATE_NOTE -> {
                shopDao.updateNotes(shopId, appendNote("Update Mention", notes ?: ""), nowIso)
            }
        }
    }

    suspend fun toggleUrgent(shopId: String) {
        val shop = shopDao.getShopById(shopId) ?: return
        val nowIso = Date().toString()
        if (shop.isUrgent) {
            shopDao.clearUrgent(shopId, nowIso)
        } else {
            shopDao.setUrgent(shopId, nowIso)
        }
    }
}
