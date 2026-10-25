package com.waymark.fmcg.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.waymark.fmcg.data.model.Product
import com.waymark.fmcg.data.model.Shop
import com.waymark.fmcg.data.model.ShopProduct
import kotlinx.coroutines.flow.Flow

@Dao
interface ShopDao {
    @Query("SELECT * FROM shops WHERE isArchived = 0 ORDER BY sortOrder ASC")
    fun getAllActiveShops(): Flow<List<Shop>>

    @Query("SELECT * FROM shops WHERE id = :shopId")
    suspend fun getShopById(shopId: String): Shop?

    @Query("SELECT * FROM shops WHERE id = :shopId")
    fun getShopFlow(shopId: String): Flow<Shop?>

    @Query("""
        SELECT * FROM shops 
        WHERE isArchived = 0 AND (
            name LIKE '%' || :query || '%' OR 
            contact LIKE '%' || :query || '%' OR 
            notes LIKE '%' || :query || '%'
        )
        LIMIT 15
    """)
    fun searchShops(query: String): Flow<List<Shop>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertShop(shop: Shop)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertShops(shops: List<Shop>)

    @Update
    suspend fun updateShop(shop: Shop)

    @Query("UPDATE shops SET balanceDue = :newBalance, updatedAt = :updatedAt WHERE id = :shopId")
    suspend fun updateBalanceDue(shopId: String, newBalance: Double, updatedAt: String)

    @Query("UPDATE shops SET isUrgent = 0, updatedAt = :updatedAt WHERE id = :shopId")
    suspend fun clearUrgent(shopId: String, updatedAt: String)

    @Query("UPDATE shops SET isUrgent = 1, updatedAt = :updatedAt WHERE id = :shopId")
    suspend fun setUrgent(shopId: String, updatedAt: String)

    @Query("UPDATE shops SET notes = :notes, updatedAt = :updatedAt WHERE id = :shopId")
    suspend fun updateNotes(shopId: String, notes: String, updatedAt: String)

    // Shop Products
    @Query("SELECT * FROM shop_products WHERE shopId = :shopId")
    suspend fun getShopProductsForShop(shopId: String): List<ShopProduct>

    @Query("SELECT * FROM shop_products")
    fun getAllShopProducts(): Flow<List<ShopProduct>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertShopProducts(shopProducts: List<ShopProduct>)

    @Update
    suspend fun updateShopProduct(shopProduct: ShopProduct)

    // Products
    @Query("SELECT * FROM products")
    fun getAllProducts(): Flow<List<Product>>

    @Query("SELECT * FROM products WHERE id = :productId")
    suspend fun getProductById(productId: String): Product?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProducts(products: List<Product>)
}
