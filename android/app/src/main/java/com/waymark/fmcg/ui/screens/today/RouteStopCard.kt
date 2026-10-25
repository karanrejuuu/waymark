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
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.waymark.fmcg.data.model.EnrichedTodayStop
import com.waymark.fmcg.ui.components.StatusBadge
import com.waymark.fmcg.ui.theme.BorderSubtle
import com.waymark.fmcg.ui.theme.ElectricLime
import com.waymark.fmcg.ui.theme.OnElectricLime
import com.waymark.fmcg.ui.theme.StatusDownRose
import com.waymark.fmcg.ui.theme.StatusDownSubtle
import com.waymark.fmcg.ui.theme.SurfaceCard
import com.waymark.fmcg.ui.theme.SurfaceVariantDark
import com.waymark.fmcg.ui.theme.TextPrimary
import com.waymark.fmcg.ui.theme.TextSecondary

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun RouteStopCard(
    stopNumber: Int,
    stop: EnrichedTodayStop,
    onQuickDelivered: () -> Unit,
    onOpenOutcomeSheet: () -> Unit,
    onCardClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(SurfaceCard, shape = RoundedCornerShape(20.dp))
            .border(
                width = 1.dp,
                color = if (stop.isUrgent) StatusDownRose.copy(alpha = 0.4f) else BorderSubtle,
                shape = RoundedCornerShape(20.dp)
            )
            .clickable { onCardClick() }
            .padding(14.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // LIFO sequence badge
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .background(
                            color = if (stop.isUrgent) StatusDownSubtle else SurfaceVariantDark,
                            shape = CircleShape
                        )
                        .border(
                            width = 1.dp,
                            color = if (stop.isUrgent) StatusDownRose else BorderSubtle,
                            shape = CircleShape
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = if (stopNumber < 10) "0$stopNumber" else "$stopNumber",
                        color = if (stop.isUrgent) StatusDownRose else ElectricLime,
                        fontSize = 12.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold
                    )
                }

                Column {
                    Text(
                        text = stop.shop.name,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    stop.region?.let { reg ->
                        Text(
                            text = reg.name,
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace,
                            color = TextSecondary
                        )
                    }
                }
            }

            // Status badges
            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                if (stop.isUrgent) {
                    StatusBadge(status = "Urgent")
                } else if (stop.isOverdue) {
                    StatusBadge(status = "Overdue")
                }
            }
        }

        // Crate manifest items
        if (stop.dueProducts.isNotEmpty()) {
            FlowRow(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 10.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                stop.dueProducts.forEach { item ->
                    Box(
                        modifier = Modifier
                            .background(SurfaceVariantDark, shape = RoundedCornerShape(8.dp))
                            .border(1.dp, BorderSubtle, shape = RoundedCornerShape(8.dp))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = "${item.product.name.split(" ")[0]}: ${item.shopProduct.defaultQty} cases",
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace,
                            color = TextPrimary
                        )
                    }
                }
            }
        }

        // Bottom row: Dues & Quick Actions
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                if (stop.shop.balanceDue > 0) {
                    Text(
                        text = "Khata Dues: ₹${stop.shop.balanceDue.toInt()}",
                        fontSize = 12.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        color = StatusDownRose
                    )
                } else {
                    Text(
                        text = "Zero Dues",
                        fontSize = 12.sp,
                        fontFamily = FontFamily.Monospace,
                        color = TextSecondary
                    )
                }
            }

            Row(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Quick Delivered Button
                Button(
                    onClick = onQuickDelivered,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = ElectricLime,
                        contentColor = OnElectricLime
                    ),
                    shape = RoundedCornerShape(12.dp),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = "Delivered",
                        modifier = Modifier.size(14.dp)
                    )
                    Text(
                        text = "Delivered",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(start = 4.dp)
                    )
                }

                // Options / Outcome Button
                IconButton(
                    onClick = onOpenOutcomeSheet,
                    modifier = Modifier
                        .size(34.dp)
                        .background(SurfaceVariantDark, shape = RoundedCornerShape(10.dp))
                        .border(1.dp, BorderSubtle, shape = RoundedCornerShape(10.dp))
                ) {
                    Icon(
                        imageVector = Icons.Default.MoreHoriz,
                        contentDescription = "Options",
                        tint = TextSecondary,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
    }
}
