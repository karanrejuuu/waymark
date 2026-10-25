package com.waymark.fmcg.data.model

enum class VisitOutcome(val displayName: String) {
    DELIVERED_PAID("Delivered & Paid"),
    DELIVERED_UNPAID("Cash Not Received"),
    BILL_TO_BILL("Bill to Bill"),
    FOLLOW_UP("Follow Up"),
    SHOP_CLOSED("Shop Closed"),
    NO_ORDER("Overstocked"),
    UPDATE_NOTE("Mention Note")
}

data class EnrichedTodayStop(
    val shop: Shop,
    val region: Region?,
    val dueProducts: List<DueProductItem>,
    val totalCrates: Int,
    val isUrgent: Boolean,
    val isOverdue: Boolean,
    val daysOverdue: Int = 0
)

data class DueProductItem(
    val product: Product,
    val shopProduct: ShopProduct
)
