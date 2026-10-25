package com.waymark.fmcg

import android.app.Application
import com.waymark.fmcg.data.local.WaymarkRoomDatabase
import com.waymark.fmcg.data.repository.WaymarkRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob

class WaymarkApplication : Application() {

    private val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    val database by lazy {
        WaymarkRoomDatabase.getDatabase(this, applicationScope)
    }

    val repository by lazy {
        WaymarkRepository(
            shopDao = database.shopDao(),
            deliveryDao = database.deliveryDao(),
            paymentDao = database.paymentDao(),
            regionDao = database.regionDao()
        )
    }

    override fun onCreate() {
        super.onCreate()
    }
}
