package com.waymark.fmcg.ui.screens.shop

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.EditNote
import androidx.compose.material.icons.filled.PriorityHigh
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.waymark.fmcg.data.model.EnrichedTodayStop
import com.waymark.fmcg.ui.screens.today.VisitOutcomeBottomSheet
import com.waymark.fmcg.ui.theme.BorderSubtle
import com.waymark.fmcg.ui.theme.CanvasDark
import com.waymark.fmcg.ui.theme.ElectricLime
import com.waymark.fmcg.ui.theme.OnElectricLime
import com.waymark.fmcg.ui.theme.StatusDownRose
import com.waymark.fmcg.ui.theme.StatusDownSubtle
import com.waymark.fmcg.ui.theme.StatusUpGreen
import com.waymark.fmcg.ui.theme.StatusWarnAmber
import com.waymark.fmcg.ui.theme.SurfaceCard
import com.waymark.fmcg.ui.theme.SurfaceVariantDark
import com.waymark.fmcg.ui.theme.TextMuted
import com.waymark.fmcg.ui.theme.TextPrimary
import com.waymark.fmcg.ui.theme.TextSecondary
import com.waymark.fmcg.viewmodel.TodayViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShopDetailScreen(
    shopId: String,
    viewModel: TodayViewModel,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val shopState by viewModel.getShop(shopId).collectAsState(initial = null)
    val outcomeStop by viewModel.selectedOutcomeStop.collectAsState()
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val context = LocalContext.current

    val shop = shopState

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(CanvasDark)
    ) {
        if (shop == null) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Loading store record...",
                    color = TextSecondary,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 13.sp
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 96.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Header with Back button
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        IconButton(
                            onClick = onBack,
                            modifier = Modifier
                                .size(40.dp)
                                .background(SurfaceVariantDark, shape = RoundedCornerShape(10.dp))
                                .border(1.dp, BorderSubtle, shape = RoundedCornerShape(10.dp))
                        ) {
                            Icon(
                                imageVector = Icons.Default.ArrowBack,
                                contentDescription = "Back",
                                tint = TextPrimary,
                                modifier = Modifier.size(18.dp)
                            )
                        }

                        Column {
                            Text(
                                text = "KIRANA LEDGER",
                                color = ElectricLime,
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.2.sp
                            )
                            Text(
                                text = shop.name,
                                color = TextPrimary,
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                // Balance & Status Card
                item {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(SurfaceCard, shape = RoundedCornerShape(20.dp))
                            .border(1.dp, BorderSubtle, shape = RoundedCornerShape(20.dp))
                            .padding(20.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Top
                        ) {
                            Column {
                                Text(
                                    text = "OUTSTANDING BALANCE DUE",
                                    color = TextMuted,
                                    fontSize = 10.sp,
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = "₹${shop.balanceDue.toInt()}",
                                    color = if (shop.balanceDue > 0) StatusDownRose else StatusUpGreen,
                                    fontSize = 32.sp,
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(top = 4.dp)
                                )
                            }

                            if (shop.isUrgent) {
                                Box(
                                    modifier = Modifier
                                        .background(StatusDownSubtle, shape = RoundedCornerShape(8.dp))
                                        .border(1.dp, StatusDownRose, shape = RoundedCornerShape(8.dp))
                                        .padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Text(
                                        text = "URGENT BEAT",
                                        color = StatusDownRose,
                                        fontSize = 10.sp,
                                        fontFamily = FontFamily.Monospace,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            // Call Store Owner Intent
                            Button(
                                onClick = {
                                    val contactNum = shop.contact
                                    if (!contactNum.isNullOrBlank()) {
                                        val dialIntent = Intent(Intent.ACTION_DIAL).apply {
                                            data = Uri.parse("tel:$contactNum")
                                        }
                                        context.startActivity(dialIntent)
                                    }
                                },
                                modifier = Modifier.weight(1f).height(44.dp),
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = SurfaceVariantDark,
                                    contentColor = TextPrimary
                                )
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Call,
                                    contentDescription = "Call",
                                    tint = ElectricLime,
                                    modifier = Modifier.size(16.dp)
                                )
                                Text(
                                    text = " Call Owner",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }

                            // Toggle Urgent Priority
                            OutlinedButton(
                                onClick = { viewModel.onToggleUrgent(shop.id) },
                                modifier = Modifier.weight(1f).height(44.dp),
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.outlinedButtonColors(
                                    contentColor = if (shop.isUrgent) StatusDownRose else TextSecondary
                                )
                            ) {
                                Icon(
                                    imageVector = Icons.Default.PriorityHigh,
                                    contentDescription = "Urgent",
                                    tint = if (shop.isUrgent) StatusDownRose else TextSecondary,
                                    modifier = Modifier.size(16.dp)
                                )
                                Text(
                                    text = if (shop.isUrgent) "Urgent Set" else "Set Urgent",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    }
                }

                // Store Details Card
                item {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(SurfaceCard, shape = RoundedCornerShape(16.dp))
                            .border(1.dp, BorderSubtle, shape = RoundedCornerShape(16.dp))
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(
                            text = "STORE DIRECTORY INFO",
                            color = TextMuted,
                            fontSize = 10.sp,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.SemiBold
                        )

                        InfoRow(label = "Owner Name", value = shop.ownerName ?: "Store Manager")
                        InfoRow(label = "Contact Number", value = shop.contact ?: "N/A")
                        InfoRow(label = "Physical Address", value = shop.address ?: "Store Location")
                        InfoRow(label = "Preferred Payment", value = (shop.preferredPaymentMode ?: "cash").uppercase())
                    }
                }

                // Visit Notes & Observation History
                item {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(SurfaceCard, shape = RoundedCornerShape(16.dp))
                            .border(1.dp, BorderSubtle, shape = RoundedCornerShape(16.dp))
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "VISIT LOGS & REMARKS",
                            color = TextMuted,
                            fontSize = 10.sp,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.SemiBold
                        )

                        if (shop.notes.isNullOrBlank()) {
                            Text(
                                text = "No visit observations recorded yet.",
                                color = TextSecondary,
                                fontSize = 12.sp,
                                modifier = Modifier.padding(vertical = 4.dp)
                            )
                        } else {
                            Text(
                                text = shop.notes ?: "",
                                color = TextPrimary,
                                fontSize = 12.sp,
                                lineHeight = 18.sp,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(SurfaceVariantDark, shape = RoundedCornerShape(10.dp))
                                    .padding(12.dp)
                            )
                        }
                    }
                }

                // Action to Log Outcome for this shop
                item {
                    Button(
                        onClick = {
                            val dummyStop = EnrichedTodayStop(
                                shop = shop,
                                region = null,
                                dueProducts = emptyList(),
                                totalCrates = 0,
                                isUrgent = shop.isUrgent,
                                isOverdue = false
                            )
                            viewModel.onOpenOutcomeSheet(dummyStop)
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = ElectricLime,
                            contentColor = OnElectricLime
                        )
                    ) {
                        Icon(
                            imageVector = Icons.Default.EditNote,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            text = "  Log Visit Outcome",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
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
private fun InfoRow(
    label: String,
    value: String
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            color = TextSecondary,
            fontSize = 12.sp
        )
        Text(
            text = value,
            color = TextPrimary,
            fontSize = 13.sp,
            fontWeight = FontWeight.Medium
        )
    }
}
