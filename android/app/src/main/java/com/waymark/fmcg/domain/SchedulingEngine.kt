package com.waymark.fmcg.domain

import com.waymark.fmcg.data.model.EnrichedTodayStop
import com.waymark.fmcg.data.model.ShopProduct
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

object SchedulingEngine {

    private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)

    fun getTodayString(): String = dateFormat.format(Date())

    /**
     * Determine if a shop product is due for delivery today.
     * Follows Waymark core rules:
     * - If shop is urgent -> ALWAYS due
     * - If snoozed until future date -> NOT due
     * - If nextDueDate <= today -> DUE
     */
    fun isDueToday(shopProduct: ShopProduct, isShopUrgent: Boolean, todayStr: String = getTodayString()): Boolean {
        if (isShopUrgent) return true

        // Check snooze
        shopProduct.snoozeUntil?.let { snooze ->
            if (snooze > todayStr) return false
        }

        return shopProduct.nextDueDate <= todayStr
    }

    /**
     * Self-correcting replenishment interval:
     * - empty / stockout -> shorten interval (arrive sooner)
     * - high / excess -> widen interval (arrive later)
     * - normal / ok -> keep baseline
     */
    fun adjustInterval(currentInterval: Int, stockFeedback: String?): Int {
        return when (stockFeedback?.lowercase()) {
            "empty", "stockout", "low" -> maxOf(2, currentInterval - 2)
            "high", "excess", "overstocked" -> minOf(30, currentInterval + 2)
            else -> currentInterval
        }
    }

    /**
     * Compute next due date formatted as YYYY-MM-DD
     */
    fun computeNextDueDate(intervalDays: Int, offsetDays: Int = 0): String {
        val cal = Calendar.getInstance()
        cal.add(Calendar.DAY_OF_YEAR, maxOf(1, intervalDays - offsetDays))
        return dateFormat.format(cal.time)
    }

    /**
     * Compute snooze target date formatted as YYYY-MM-DD
     */
    fun computeSnoozeDate(days: Int): String {
        val cal = Calendar.getInstance()
        cal.add(Calendar.DAY_OF_YEAR, days)
        return dateFormat.format(cal.time)
    }

    /**
     * Sorts stops into optimal tempo LIFO sequence:
     * Urgent stops first, then sorted by route sortOrder, then overdue stops.
     */
    fun sortLIFOSequence(stops: List<EnrichedTodayStop>): List<EnrichedTodayStop> {
        return stops.sortedWith(
            compareByDescending<EnrichedTodayStop> { it.isUrgent }
                .thenByDescending { it.isOverdue }
                .thenBy { it.shop.sortOrder }
        )
    }
}
