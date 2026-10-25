package com.waymark.fmcg.ui.screens.today

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.waymark.fmcg.ui.theme.BorderSubtle
import com.waymark.fmcg.ui.theme.ElectricLime
import com.waymark.fmcg.ui.theme.StatusDownRose
import com.waymark.fmcg.ui.theme.StatusUpGreen
import com.waymark.fmcg.ui.theme.SurfaceCard
import com.waymark.fmcg.ui.theme.SurfaceVariantDark
import com.waymark.fmcg.ui.theme.TextPrimary
import com.waymark.fmcg.ui.theme.TextSecondary

@Composable
fun RouteCockpitHeader(
    totalStops: Int,
    totalCrates: Int,
    totalDues: Double,
    urgentCount: Int,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(SurfaceCard, shape = RoundedCornerShape(24.dp))
            .border(1.dp, BorderSubtle, shape = RoundedCornerShape(24.dp))
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "TODAY'S ROUTE COCKPIT",
                fontSize = 11.sp,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Bold,
                color = ElectricLime
            )
            Text(
                text = "LIFO Loading Sequence Active",
                fontSize = 11.sp,
                fontFamily = FontFamily.Monospace,
                color = TextSecondary
            )
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Stops
            Column(
                modifier = Modifier
                    .weight(1f)
                    .background(SurfaceVariantDark, shape = RoundedCornerShape(14.dp))
                    .padding(10.dp)
            ) {
                Text(
                    text = "STOPS",
                    fontSize = 10.sp,
                    fontFamily = FontFamily.Monospace,
                    color = TextSecondary
                )
                Text(
                    text = "$totalStops stores",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary,
                    modifier = Modifier.padding(top = 2.dp)
                )
            }

            // Crates
            Column(
                modifier = Modifier
                    .weight(1f)
                    .background(SurfaceVariantDark, shape = RoundedCornerShape(14.dp))
                    .padding(10.dp)
            ) {
                Text(
                    text = "CRATES",
                    fontSize = 10.sp,
                    fontFamily = FontFamily.Monospace,
                    color = TextSecondary
                )
                Text(
                    text = "$totalCrates cases",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = ElectricLime,
                    modifier = Modifier.padding(top = 2.dp)
                )
            }

            // Dues
            Column(
                modifier = Modifier
                    .weight(1f)
                    .background(SurfaceVariantDark, shape = RoundedCornerShape(14.dp))
                    .padding(10.dp)
            ) {
                Text(
                    text = "TARGET DUES",
                    fontSize = 10.sp,
                    fontFamily = FontFamily.Monospace,
                    color = TextSecondary
                )
                Text(
                    text = "₹${totalDues.toInt()}",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = StatusDownRose,
                    modifier = Modifier.padding(top = 2.dp)
                )
            }

            // Status
            Column(
                modifier = Modifier
                    .weight(1f)
                    .background(SurfaceVariantDark, shape = RoundedCornerShape(14.dp))
                    .padding(10.dp)
            ) {
                Text(
                    text = "STATUS",
                    fontSize = 10.sp,
                    fontFamily = FontFamily.Monospace,
                    color = TextSecondary
                )
                Text(
                    text = if (urgentCount > 0) "$urgentCount Urgent" else "On Tempo",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (urgentCount > 0) StatusDownRose else StatusUpGreen,
                    modifier = Modifier.padding(top = 2.dp)
                )
            }
        }
    }
}
