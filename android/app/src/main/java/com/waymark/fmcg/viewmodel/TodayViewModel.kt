package com.waymark.fmcg.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.waymark.fmcg.data.model.EnrichedTodayStop
import com.waymark.fmcg.data.model.Region
import com.waymark.fmcg.data.model.Shop
import com.waymark.fmcg.data.model.VisitOutcome
import com.waymark.fmcg.data.repository.WaymarkRepository
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

@OptIn(ExperimentalCoroutinesApi::class)
class TodayViewModel(
    private val repository: WaymarkRepository
) : ViewModel() {

    val allRegions: StateFlow<List<Region>> = repository.getAllRegions()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _selectedRouteId = MutableStateFlow("all")
    val selectedRouteId: StateFlow<String> = _selectedRouteId.asStateFlow()

    private val _rawTodayStops = repository.getTodayStops()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Filtered by selected route pill
    val filteredTodayStops: StateFlow<List<EnrichedTodayStop>> = combine(
        _rawTodayStops,
        _selectedRouteId
    ) { stops, routeId ->
        if (routeId == "all") stops
        else stops.filter { it.shop.regionId == routeId }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Search Query & Search Results
    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    val searchResults: StateFlow<List<Shop>> = _searchQuery
        .flatMapLatest { q ->
            if (q.isBlank()) flowOf(emptyList())
            else repository.searchShops(q.trim())
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Visit Outcome Modal State
    private val _selectedOutcomeStop = MutableStateFlow<EnrichedTodayStop?>(null)
    val selectedOutcomeStop: StateFlow<EnrichedTodayStop?> = _selectedOutcomeStop.asStateFlow()

    fun onRouteSelected(routeId: String) {
        _selectedRouteId.value = routeId
    }

    fun onSearchQueryChanged(q: String) {
        _searchQuery.value = q
    }

    fun clearSearch() {
        _searchQuery.value = ""
    }

    fun onQuickDelivered(stop: EnrichedTodayStop) {
        viewModelScope.launch {
            repository.recordVisitOutcome(
                shopId = stop.shop.id,
                outcome = VisitOutcome.DELIVERED_PAID,
                paymentAmount = stop.shop.balanceDue,
                notes = "Quick delivered at counter"
            )
        }
    }

    fun onOpenOutcomeSheet(stop: EnrichedTodayStop) {
        _selectedOutcomeStop.value = stop
    }

    fun onCloseOutcomeSheet() {
        _selectedOutcomeStop.value = null
    }

    fun onSubmitOutcome(
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
        viewModelScope.launch {
            repository.recordVisitOutcome(
                shopId = shopId,
                outcome = outcome,
                quantities = quantities,
                paymentAmount = paymentAmount,
                paymentMode = paymentMode,
                billNumber = billNumber,
                billAmount = billAmount,
                previousBillSettled = previousBillSettled,
                followUpDays = followUpDays,
                notes = notes
            )
            onCloseOutcomeSheet()
            clearSearch()
        }
    }

    fun onToggleUrgent(shopId: String) {
        viewModelScope.launch {
            repository.toggleUrgent(shopId)
        }
    }

    fun getShop(shopId: String): kotlinx.coroutines.flow.Flow<Shop?> = repository.getShopFlow(shopId)
}

class TodayViewModelFactory(
    private val repository: WaymarkRepository
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(TodayViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return TodayViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
