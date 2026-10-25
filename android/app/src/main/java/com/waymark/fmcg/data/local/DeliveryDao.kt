package com.waymark.fmcg.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.waymark.fmcg.data.model.Delivery
import com.waymark.fmcg.data.model.Payment
import com.waymark.fmcg.data.model.Region
import kotlinx.coroutines.flow.Flow

@Dao
interface DeliveryDao {
    @Query("SELECT * FROM deliveries WHERE shopId = :shopId ORDER BY deliveredAt DESC")
    fun getDeliveriesForShop(shopId: String): Flow<List<Delivery>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDelivery(delivery: Delivery)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDeliveries(deliveries: List<Delivery>)
}

@Dao
interface PaymentDao {
    @Query("SELECT * FROM payments WHERE shopId = :shopId ORDER BY collectedAt DESC")
    fun getPaymentsForShop(shopId: String): Flow<List<Payment>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPayment(payment: Payment)
}

@Dao
interface RegionDao {
    @Query("SELECT * FROM regions ORDER BY sortOrder ASC")
    fun getAllRegions(): Flow<List<Region>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRegions(regions: List<Region>)
}
