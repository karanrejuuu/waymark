package com.waymark.fmcg.ui.screens.today

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocalShipping
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.waymark.fmcg.data.model.EnrichedTodayStop
import com.waymark.fmcg.ui.theme.BorderSubtle
import com.waymark.fmcg.ui.theme.CanvasDark
import com.waymark.fmcg.ui.theme.ElectricLime
import com.waymark.fmcg.ui.theme.OnElectricLime
import com.waymark.fmcg.ui.theme.SurfaceCard
import com.waymark.fmcg.ui.theme.SurfaceVariantDark
import com.waymark.fmcg.ui.theme.TextMuted
import com.waymark.fmcg.ui.theme.TextPrimary
import com.waymark.fmcg.ui.theme.TextSecondary
import com.waymark.fmcg.viewmodel.TodayViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TodayDispatchScreen(
    viewModel: TodayViewModel,
    onNavigateToShop: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val stops by viewModel.filteredTodayStops.collectAsState()
    val regions by viewModel.allRegions.collectAsState()
    val selectedRouteId by viewModel.selectedRouteId.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val searchResults by viewModel.searchResults.collectAsState()
    val outcomeStop by viewModel.selectedOutcomeStop.collectAsState()

    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    val todayDateFormatted = remember {
        val sdf = SimpleDateFormat("EEEE, d MMMM", Locale.getDefault())
        sdf.format(Date())
    }

    val totalCrates = remember(stops) { stops.sumOf { it.totalCrates } }
    val totalDues = remember(stops) { stops.sumOf { it.shop.balanceDue } }
    val completedCount = remember(stops) { 0 } // Active pending stops in flow

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(CanvasDark)
    ) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 96.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // App Branding & Date Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = "WAYMARK",
                                color = TextPrimary,
                                fontSize = 20.sp,
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 2.sp
                            )
                            Box(
                                modifier = Modifier
                                    .size(6.dp)
                                    .background(ElectricLime, shape = CircleShape)
                            )
                            Text(
                                text = "DISPATCH",
                                color = ElectricLime,
                                fontSize = 11.sp,
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp
                            )
                        }
                        Text(
                            text = todayDateFormatted,
                            color = TextSecondary,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(top = 2.dp)
                        )
                    }

                    Box(
                        modifier = Modifier
                            .background(SurfaceVariantDark, shape = RoundedCornerShape(10.dp))
                            .border(1.dp, BorderSubtle, shape = RoundedCornerShape(10.dp))
                            .padding(horizontal = 10.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = "OFFLINE ACTIVE",
                            color = ElectricLime,
                            fontSize = 10.sp,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            // Global Shop Search Bar
            item {
                GlobalShopSearchBar(
                    query = searchQuery,
                    onQueryChanged = viewModel::onSearchQueryChanged,
                    searchResults = searchResults,
                    onShopSelected = { shop ->
                        viewModel.clearSearch()
                        onNavigateToShop(shop.id)
                    },
                    onShopActionClick = { shop ->
                        // Open outcome modal for searched shop
                        val dummyStop = EnrichedTodayStop(
                            shop = shop,
                            region = regions.find { it.id == shop.regionId },
                            dueProducts = emptyList(),
                            totalCrates = 0,
                            isUrgent = shop.isUrgent,
                            isOverdue = false
                        )
                        viewModel.onOpenOutcomeSheet(dummyStop)
                    }
                )
            }

            // Route Cockpit Metrics Card
            item {
                RouteCockpitHeader(
                    totalStops = stops.size,
                    totalCrates = totalCrates,
                    totalDues = totalDues,
                    urgentCount = stops.count { it.isUrgent }
                )
            }

            // Route Sector Filter Pills
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    RouteFilterPill(
                        label = "All Routes",
                        count = stops.size,
                        isSelected = selectedRouteId == "all",
                        onClick = { viewModel.onRouteSelected("all") }
                    )
                    regions.forEach { region ->
                        RouteFilterPill(
                            label = region.name,
                            count = null,
                            isSelected = selectedRouteId == region.id,
                            onClick = { viewModel.onRouteSelected(region.id) }
                        )
                    }
                }
            }

            // LIFO Crate Loading Notice
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(SurfaceVariantDark, shape = RoundedCornerShape(12.dp))
                        .border(1.dp, BorderSubtle, shape = RoundedCornerShape(12.dp))
                        .padding(horizontal = 14.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.LocalShipping,
                        contentDescription = null,
                        tint = ElectricLime,
                        modifier = Modifier.size(18.dp)
                    )
                    Text(
                        text = "LIFO CRATE ORDER: Stop #1 sits at tempo door. First in = Last out.",
                        color = TextSecondary,
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }

            // Stops Section Title
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "DISPATCH SEQUENCE (${stops.size} STOPS)",
                        color = TextMuted,
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                }
            }

            // List of Stops
            if (stops.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(SurfaceCard, shape = RoundedCornerShape(16.dp))
                            .border(1.dp, BorderSubtle, shape = RoundedCornerShape(16.dp))
                            .padding(vertical = 40.dp, horizontal = 20.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = "ALL STOPS COMPLETED",
                                color = ElectricLime,
                                fontSize = 14.sp,
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Zero pending Kirana visits remaining for this route sector.",
                                color = TextSecondary,
                                fontSize = 12.sp
                            )
                        }
                    }
                }
            } else {
                itemsIndexed(stops, key = { _, stop -> stop.shop.id }) { index, stop ->
                    RouteStopCard(
                        stopNumber = index + 1,
                        stop = stop,
                        onQuickDelivered = { viewModel.onQuickDelivered(stop) },
                        onOpenOutcomeSheet = { viewModel.onOpenOutcomeSheet(stop) },
                        onCardClick = { onNavigateToShop(stop.shop.id) }
                    )
                }
            }
        }

        // Bottom Sheet for Visit Outcome
        outcomeStop?.let { stop ->
            VisitOutcomeBottomSheet(
                stop = stop,
                sheetState = sheetState,
                onDismiss = viewModel::onCloseOutcomeSheet,
                onSubmit = { outcome, quantities, paymentAmount, paymentMode, billNumber, billAmount, previousBillSettled, followUpDays, notes ->
                    viewModel.onSubmitOutcome(
                        shopId = stop.shop.id,
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
                }
            )
        }
    }
}

@Composable
private fun RouteFilterPill(
    label: String,
    count: Int?,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .background(
                if (isSelected) ElectricLime else SurfaceVariantDark,
                shape = RoundedCornerShape(20.dp)
            )
            .border(
                1.dp,
                if (isSelected) ElectricLime else BorderSubtle,
                shape = RoundedCornerShape(20.dp)
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Text(
            text = label,
            color = if (isSelected) OnElectricLime else TextPrimary,
            fontSize = 12.sp,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
        )
        if (count != null) {
            Box(
                modifier = Modifier
                    .background(
                        if (isSelected) OnElectricLime else SurfaceCard,
                        shape = CircleShape
                    )
                    .padding(horizontal = 6.dp, vertical = 2.dp)
            ) {
                Text(
                    text = "$count",
                    color = if (isSelected) ElectricLime else TextSecondary,
                    fontSize = 10.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
