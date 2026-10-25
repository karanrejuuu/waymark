package com.waymark.fmcg.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import com.waymark.fmcg.data.model.Delivery
import com.waymark.fmcg.data.model.Payment
import com.waymark.fmcg.data.model.Product
import com.waymark.fmcg.data.model.Region
import com.waymark.fmcg.data.model.Shop
import com.waymark.fmcg.data.model.ShopProduct
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Database(
    entities = [
        Shop::class,
        Product::class,
        ShopProduct::class,
        Delivery::class,
        Payment::class,
        Region::class
    ],
    version = 1,
    exportSchema = false
)
abstract class WaymarkRoomDatabase : RoomDatabase() {

    abstract fun shopDao(): ShopDao
    abstract fun deliveryDao(): DeliveryDao
    abstract fun paymentDao(): PaymentDao
    abstract fun regionDao(): RegionDao

    companion object {
        @Volatile
        private var INSTANCE: WaymarkRoomDatabase? = null

        fun getDatabase(context: Context, scope: CoroutineScope): WaymarkRoomDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    WaymarkRoomDatabase::class.java,
                    "waymark_database"
                )
                    .addCallback(DatabaseCallback(scope))
                    .build()
                INSTANCE = instance
                instance
            }
        }

        private class DatabaseCallback(
            private val scope: CoroutineScope
        ) : RoomDatabase.Callback() {
            override fun onCreate(db: SupportSQLiteDatabase) {
                super.onCreate(db)
                INSTANCE?.let { database ->
                    scope.launch(Dispatchers.IO) {
                        seedInitialData(database)
                    }
                }
            }
        }

        suspend fun seedInitialData(database: WaymarkRoomDatabase) {
            val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)
            val todayStr = dateFormat.format(Date())
            val nowIso = Date().toString()

            // 1. Seed Regions
            val regNorth = Region("reg-north", name = "North Market", sortOrder = 1, createdAt = nowIso)
            val regStation = Region("reg-station", name = "Station Road", sortOrder = 2, createdAt = nowIso)
            database.regionDao().insertRegions(listOf(regNorth, regStation))

            // 2. Seed Products
            val p1 = Product("p-parle", name = "Parle-G Glucose (Case of 24)", defaultInterval = 5, createdAt = nowIso)
            val p2 = Product("p-frooti", name = "Frooti Mango 200ml (Crate of 30)", defaultInterval = 7, createdAt = nowIso)
            val p3 = Product("p-maggi", name = "Maggi 2-Minute Noodles (Box of 48)", defaultInterval = 6, createdAt = nowIso)
            val p4 = Product("p-tata-tea", name = "Tata Tea Gold 250g (Pack of 12)", defaultInterval = 10, createdAt = nowIso)
            database.shopDao().insertProducts(listOf(p1, p2, p3, p4))

            // 3. Seed Realistic Kirana Stores
            val s1 = Shop(
                id = "shop-gupta",
                regionId = regNorth.id,
                name = "Gupta Kirana & General Store",
                contact = "9820011223",
                address = "Shop 4, Station Road Market",
                ownerName = "Ramesh Gupta",
                lat = 19.0820,
                lng = 72.8830,
                notes = "Morning drop before 11 AM. Cash payment.",
                isUrgent = true,
                sortOrder = 1,
                balanceDue = 1450.0,
                createdAt = nowIso,
                updatedAt = nowIso
            )

            val s2 = Shop(
                id = "shop-laxmi",
                regionId = regNorth.id,
                name = "Laxmi Supermarket",
                contact = "9820044556",
                address = "Plot 12, Gandhi Chowk",
                ownerName = "Laxman Patel",
                lat = 19.0890,
                lng = 72.8890,
                notes = "Rear alley entry. Key with cashier.",
                isUrgent = false,
                sortOrder = 2,
                balanceDue = 3200.0,
                createdAt = nowIso,
                updatedAt = nowIso
            )

            val s3 = Shop(
                id = "shop-anand",
                regionId = regStation.id,
                name = "Anand Tea Depot",
                contact = "9820077889",
                address = "Cross Road No. 3",
                ownerName = "Anand Mohan",
                lat = 19.0710,
                lng = 72.8720,
                notes = "High tea turnover. Verify stock weekly.",
                isUrgent = false,
                sortOrder = 3,
                balanceDue = 0.0,
                createdAt = nowIso,
                updatedAt = nowIso
            )

            val s4 = Shop(
                id = "shop-bharat",
                regionId = regStation.id,
                name = "Bharat Daily Needs",
                contact = "9820099001",
                address = "Opp. Municipal School",
                ownerName = "Bharat Kumar",
                lat = 19.0680,
                lng = 72.8650,
                notes = "Closed on Tuesdays.",
                isUrgent = false,
                sortOrder = 4,
                balanceDue = 850.0,
                createdAt = nowIso,
                updatedAt = nowIso
            )
            database.shopDao().insertShops(listOf(s1, s2, s3, s4))

            // 4. Seed Shop Products (Replenishment Schedules)
            val sp1 = ShopProduct("sp-g-1", shopId = s1.id, productId = p1.id, defaultQty = 3, intervalDays = 5, nextDueDate = todayStr, createdAt = nowIso)
            val sp2 = ShopProduct("sp-g-2", shopId = s1.id, productId = p2.id, defaultQty = 2, intervalDays = 7, nextDueDate = todayStr, createdAt = nowIso)
            val sp3 = ShopProduct("sp-l-1", shopId = s2.id, productId = p3.id, defaultQty = 4, intervalDays = 6, nextDueDate = todayStr, createdAt = nowIso)
            val sp4 = ShopProduct("sp-a-1", shopId = s3.id, productId = p4.id, defaultQty = 5, intervalDays = 10, nextDueDate = todayStr, createdAt = nowIso)
            val sp5 = ShopProduct("sp-b-1", shopId = s4.id, productId = p1.id, defaultQty = 2, intervalDays = 7, nextDueDate = todayStr, createdAt = nowIso)
            database.shopDao().insertShopProducts(listOf(sp1, sp2, sp3, sp4, sp5))
        }
    }
}
