package com.waymark.fmcg.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "products")
data class Product(
    @PrimaryKey
    val id: String,
    val organisationId: String = "org-waymark-demo",
    val ownerId: String = "demo-user",
    val name: String,
    val defaultInterval: Int = 7,
    val createdAt: String
)

@Entity(tableName = "shop_products")
data class ShopProduct(
    @PrimaryKey
    val id: String,
    val organisationId: String = "org-waymark-demo",
    val shopId: String,
    val productId: String,
    val defaultQty: Int = 1,
    val intervalDays: Int = 7,
    val remindOffsetDays: Int = 0,
    val nextDueDate: String,
    val snoozeUntil: String? = null,
    val createdAt: String
)
