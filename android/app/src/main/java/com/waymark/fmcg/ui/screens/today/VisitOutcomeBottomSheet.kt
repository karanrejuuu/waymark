package com.waymark.fmcg.ui.screens.today

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.EventRepeat
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.MoneyOff
import androidx.compose.material.icons.filled.NoMeetingRoom
import androidx.compose.material.icons.filled.Notes
import androidx.compose.material.icons.filled.ReceiptLong
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.SheetState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableDoubleStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.waymark.fmcg.data.model.EnrichedTodayStop
import com.waymark.fmcg.data.model.VisitOutcome
import com.waymark.fmcg.ui.theme.BorderSubtle
import com.waymark.fmcg.ui.theme.ElectricLime
import com.waymark.fmcg.ui.theme.OnElectricLime
import com.waymark.fmcg.ui.theme.StatusDownRose
import com.waymark.fmcg.ui.theme.StatusUpGreen
import com.waymark.fmcg.ui.theme.StatusWarnAmber
import com.waymark.fmcg.ui.theme.SurfaceCard
import com.waymark.fmcg.ui.theme.SurfaceVariantDark
import com.waymark.fmcg.ui.theme.TextMuted
import com.waymark.fmcg.ui.theme.TextPrimary
import com.waymark.fmcg.ui.theme.TextSecondary

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun VisitOutcomeBottomSheet(
    stop: EnrichedTodayStop,
    sheetState: SheetState,
    onDismiss: () -> Unit,
    onSubmit: (
        outcome: VisitOutcome,
        quantities: Map<String, Int>,
        paymentAmount: Double,
        paymentMode: String,
        billNumber: String?,
        billAmount: Double,
        previousBillSettled: Double,
        followUpDays: Int,
        notes: String?
    ) -> Unit
) {
    var selectedOutcome by remember { mutableStateOf(VisitOutcome.DELIVERED_PAID) }
    var notesText by remember { mutableStateOf("") }
    var paymentAmountText by remember { mutableStateOf(if (stop.shop.balanceDue > 0) stop.shop.balanceDue.toInt().toString() else "0") }
    var paymentMode by remember { mutableStateOf("cash") }
    var billNumberText by remember { mutableStateOf("") }
    var billAmountText by remember { mutableStateOf("") }
    var prevBillSettledText by remember { mutableStateOf("") }
    var followUpDays by remember { mutableIntStateOf(2) }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = SurfaceCard,
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
        dragHandle = {
            Box(
                modifier = Modifier
                    .padding(vertical = 12.dp)
                    .size(width = 40.dp, height = 4.dp)
                    .background(BorderSubtle, shape = RoundedCornerShape(2.dp))
            )
        }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 8.dp)
                .verticalScroll(rememberScrollState())
        ) {
            // Header
            Text(
                text = "LOG VISIT OUTCOME",
                color = ElectricLime,
                fontSize = 11.sp,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.2.sp
            )
            Text(
                text = stop.shop.name,
                color = TextPrimary,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(top = 2.dp)
            )
            Text(
                text = "${stop.shop.address ?: "Store Location"} • Balance Due: ₹${stop.shop.balanceDue.toInt()}",
                color = TextSecondary,
                fontSize = 12.sp,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            // Outcome Option Grid
            Text(
                text = "SELECT OUTCOME TYPE",
                color = TextMuted,
                fontSize = 10.sp,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.padding(bottom = 8.dp)
            )

            FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutcomeOptionChip(
                    title = "Delivered & Paid",
                    icon = Icons.Default.CheckCircle,
                    isSelected = selectedOutcome == VisitOutcome.DELIVERED_PAID,
                    accentColor = ElectricLime,
                    onClick = { selectedOutcome = VisitOutcome.DELIVERED_PAID }
                )
                OutcomeOptionChip(
                    title = "Cash Not Recv'd",
                    icon = Icons.Default.MoneyOff,
                    isSelected = selectedOutcome == VisitOutcome.DELIVERED_UNPAID,
                    accentColor = StatusDownRose,
                    onClick = { selectedOutcome = VisitOutcome.DELIVERED_UNPAID }
                )
                OutcomeOptionChip(
                    title = "Bill to Bill",
                    icon = Icons.Default.ReceiptLong,
                    isSelected = selectedOutcome == VisitOutcome.BILL_TO_BILL,
                    accentColor = ElectricLime,
                    onClick = { selectedOutcome = VisitOutcome.BILL_TO_BILL }
                )
                OutcomeOptionChip(
                    title = "Follow-Up",
                    icon = Icons.Default.EventRepeat,
                    isSelected = selectedOutcome == VisitOutcome.FOLLOW_UP,
                    accentColor = StatusWarnAmber,
                    onClick = { selectedOutcome = VisitOutcome.FOLLOW_UP }
                )
                OutcomeOptionChip(
                    title = "Shop Closed",
                    icon = Icons.Default.NoMeetingRoom,
                    isSelected = selectedOutcome == VisitOutcome.SHOP_CLOSED,
                    accentColor = StatusDownRose,
                    onClick = { selectedOutcome = VisitOutcome.SHOP_CLOSED }
                )
                OutcomeOptionChip(
                    title = "Overstocked",
                    icon = Icons.Default.Inventory2,
                    isSelected = selectedOutcome == VisitOutcome.NO_ORDER,
                    accentColor = TextSecondary,
                    onClick = { selectedOutcome = VisitOutcome.NO_ORDER }
                )
                OutcomeOptionChip(
                    title = "Mention Note",
                    icon = Icons.Default.Notes,
                    isSelected = selectedOutcome == VisitOutcome.UPDATE_NOTE,
                    accentColor = TextPrimary,
                    onClick = { selectedOutcome = VisitOutcome.UPDATE_NOTE }
                )
            }

            Spacer(modifier = Modifier.height(18.dp))

            // Dynamic Form based on Outcome
            when (selectedOutcome) {
                VisitOutcome.DELIVERED_PAID -> {
                    Text(
                        text = "PAYMENT DETAILS",
                        color = TextMuted,
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    OutlinedTextField(
                        value = paymentAmountText,
                        onValueChange = { paymentAmountText = it },
                        label = { Text("Amount Collected (₹)", color = TextSecondary) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                        colors = getDarkTextFieldColors()
                    )

                    Spacer(modifier = Modifier.height(10.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf("cash", "upi", "cheque").forEach { mode ->
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .background(
                                        if (paymentMode == mode) ElectricLime else SurfaceVariantDark,
                                        shape = RoundedCornerShape(8.dp)
                                    )
                                    .border(1.dp, BorderSubtle, shape = RoundedCornerShape(8.dp))
                                    .clickable { paymentMode = mode }
                                    .padding(vertical = 10.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = mode.uppercase(),
                                    color = if (paymentMode == mode) OnElectricLime else TextSecondary,
                                    fontSize = 11.sp,
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }

                VisitOutcome.DELIVERED_UNPAID -> {
                    Text(
                        text = "UNPAID DISPATCH REASON",
                        color = StatusDownRose,
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    OutlinedTextField(
                        value = notesText,
                        onValueChange = { notesText = it },
                        placeholder = { Text("e.g. Owner absent, promised payment by Friday evening", color = TextMuted) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = getDarkTextFieldColors()
                    )
                }

                VisitOutcome.BILL_TO_BILL -> {
                    Text(
                        text = "BILL TO BILL RECONCILIATION",
                        color = TextMuted,
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = billNumberText,
                            onValueChange = { billNumberText = it },
                            label = { Text("New Bill #", color = TextSecondary) },
                            modifier = Modifier.weight(1f),
                            colors = getDarkTextFieldColors()
                        )
                        OutlinedTextField(
                            value = billAmountText,
                            onValueChange = { billAmountText = it },
                            label = { Text("Amount (₹)", color = TextSecondary) },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.weight(1f),
                            colors = getDarkTextFieldColors()
                        )
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    OutlinedTextField(
                        value = prevBillSettledText,
                        onValueChange = { prevBillSettledText = it },
                        label = { Text("Previous Bill Cleared (₹)", color = TextSecondary) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                        colors = getDarkTextFieldColors()
                    )
                }

                VisitOutcome.FOLLOW_UP -> {
                    Text(
                        text = "FOLLOW UP SCHEDULE",
                        color = TextMuted,
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf(1, 2, 3, 7).forEach { days ->
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .background(
                                        if (followUpDays == days) StatusWarnAmber else SurfaceVariantDark,
                                        shape = RoundedCornerShape(8.dp)
                                    )
                                    .border(1.dp, BorderSubtle, shape = RoundedCornerShape(8.dp))
                                    .clickable { followUpDays = days }
                                    .padding(vertical = 10.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = if (days == 7) "1 WEEK" else "$days DAYS",
                                    color = if (followUpDays == days) Color.Black else TextSecondary,
                                    fontSize = 11.sp,
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }

                VisitOutcome.SHOP_CLOSED -> {
                    Text(
                        text = "SHOP CLOSED DETAILS",
                        color = TextMuted,
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    OutlinedTextField(
                        value = notesText,
                        onValueChange = { notesText = it },
                        placeholder = { Text("e.g. Shutter down for holiday, will retry tomorrow beat", color = TextMuted) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = getDarkTextFieldColors()
                    )
                }

                VisitOutcome.NO_ORDER -> {
                    Text(
                        text = "OVERSTOCKED / NO ORDER",
                        color = TextMuted,
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    OutlinedTextField(
                        value = notesText,
                        onValueChange = { notesText = it },
                        placeholder = { Text("e.g. 14 crates still stacked in backroom, visit next cycle", color = TextMuted) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = getDarkTextFieldColors()
                    )
                }

                VisitOutcome.UPDATE_NOTE -> {
                    Text(
                        text = "STORE VISIT NOTE / REMARK",
                        color = TextMuted,
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    OutlinedTextField(
                        value = notesText,
                        onValueChange = { notesText = it },
                        placeholder = { Text("Enter remark, counter feedback, or competitor pricing note...", color = TextMuted) },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 3,
                        colors = getDarkTextFieldColors()
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Common Notes field if not already displayed
            if (selectedOutcome == VisitOutcome.DELIVERED_PAID || selectedOutcome == VisitOutcome.BILL_TO_BILL || selectedOutcome == VisitOutcome.FOLLOW_UP) {
                OutlinedTextField(
                    value = notesText,
                    onValueChange = { notesText = it },
                    placeholder = { Text("Additional notes or observations (optional)", color = TextMuted, fontSize = 12.sp) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = getDarkTextFieldColors()
                )
                Spacer(modifier = Modifier.height(16.dp))
            }

            // Confirm Submit Button
            Button(
                onClick = {
                    val pAmount = paymentAmountText.toDoubleOrNull() ?: 0.0
                    val bAmount = billAmountText.toDoubleOrNull() ?: 0.0
                    val pBillSettled = prevBillSettledText.toDoubleOrNull() ?: 0.0
                    onSubmit(
                        selectedOutcome,
                        emptyMap(),
                        pAmount,
                        paymentMode,
                        billNumberText.ifBlank { null },
                        bAmount,
                        pBillSettled,
                        followUpDays,
                        notesText.ifBlank { null }
                    )
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
                Text(
                    text = "Confirm & Save Outcome",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(30.dp))
        }
    }
}

@Composable
private fun OutcomeOptionChip(
    title: String,
    icon: ImageVector,
    isSelected: Boolean,
    accentColor: Color,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .background(
                if (isSelected) SurfaceVariantDark else SurfaceVariantDark.copy(alpha = 0.5f),
                shape = RoundedCornerShape(10.dp)
            )
            .border(
                1.dp,
                if (isSelected) accentColor else BorderSubtle,
                shape = RoundedCornerShape(10.dp)
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = if (isSelected) accentColor else TextSecondary,
            modifier = Modifier.size(16.dp)
        )
        Text(
            text = title,
            color = if (isSelected) TextPrimary else TextSecondary,
            fontSize = 12.sp,
            fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal
        )
    }
}

@Composable
private fun getDarkTextFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedContainerColor = SurfaceVariantDark,
    unfocusedContainerColor = SurfaceVariantDark,
    focusedBorderColor = ElectricLime,
    unfocusedBorderColor = BorderSubtle,
    focusedTextColor = TextPrimary,
    unfocusedTextColor = TextPrimary,
    cursorColor = ElectricLime
)
