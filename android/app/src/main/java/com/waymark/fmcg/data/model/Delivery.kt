package com.waymark.fmcg.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "deliveries")
data class Delivery(
    @PrimaryKey
    val id: String,
    val clientId: String,
    val organisationId: String = "org-waymark-demo",
    val shopId: String,
    val productId: String,
    val deliveredBy: String? = null,
    val qty: Int,
    val deliveredAt: String,
    val stockFeedback: String? = null,
    val notes: String? = null,
    val skipReason: String? = null,
    val synced: Boolean = false,
    val createdAt: String
)

@Entity(tableName = "payments")
data class Payment(
    @PrimaryKey
    val id: String,
    val clientId: String,
    val organisationId: String = "org-waymark-demo",
    val shopId: String,
    val collectedBy: String? = null,
    val amount: Double,
    val paymentMode: String = "cash",
    val notes: String? = null,
    val collectedAt: String,
    val createdAt: String
)

@Entity(tableName = "regions")
data class Region(
    @PrimaryKey
    val id: String,
    val organisationId: String = "org-waymark-demo",
    val ownerId: String = "demo-user",
    val name: String,
    val description: String = "High-density retail corridor",
    val sortOrder: Int = 0,
    val createdAt: String
)
