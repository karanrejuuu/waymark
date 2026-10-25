package com.waymark.fmcg.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "shops")
data class Shop(
    @PrimaryKey
    val id: String,
    val organisationId: String = "org-waymark-demo",
    val ownerId: String = "demo-user",
    val regionId: String? = null,
    val name: String,
    val contact: String? = null,
    val address: String? = null,
    val ownerName: String? = null,
    val preferredPaymentMode: String = "cash",
    val lat: Double? = null,
    val lng: Double? = null,
    val notes: String? = null,
    val isUrgent: Boolean = false,
    val sortOrder: Int = 0,
    val balanceDue: Double = 0.0,
    val isArchived: Boolean = false,
    val createdAt: String,
    val updatedAt: String
)
