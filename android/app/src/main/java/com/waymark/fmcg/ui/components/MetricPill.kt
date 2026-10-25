package com.waymark.fmcg.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.waymark.fmcg.ui.theme.BorderSubtle
import com.waymark.fmcg.ui.theme.ElectricLime
import com.waymark.fmcg.ui.theme.OnElectricLime
import com.waymark.fmcg.ui.theme.StatusDownRose
import com.waymark.fmcg.ui.theme.StatusDownSubtle
import com.waymark.fmcg.ui.theme.StatusUpGreen
import com.waymark.fmcg.ui.theme.StatusUpSubtle
import com.waymark.fmcg.ui.theme.StatusWarnAmber
import com.waymark.fmcg.ui.theme.StatusWarnSubtle
import com.waymark.fmcg.ui.theme.SurfaceVariantDark
import com.waymark.fmcg.ui.theme.TextPrimary

@Composable
fun MetricPill(
    label: String,
    modifier: Modifier = Modifier,
    isSelected: Boolean = false
) {
    Box(
        modifier = modifier
            .background(
                color = if (isSelected) ElectricLime else SurfaceVariantDark,
                shape = RoundedCornerShape(100.dp)
            )
            .border(
                width = 1.dp,
                color = if (isSelected) ElectricLime else BorderSubtle,
                shape = RoundedCornerShape(100.dp)
            )
            .padding(horizontal = 12.dp, vertical = 6.dp)
    ) {
        Text(
            text = label,
            color = if (isSelected) OnElectricLime else TextPrimary,
            fontSize = 12.sp,
            fontFamily = FontFamily.Monospace,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
fun StatusBadge(
    status: String,
    modifier: Modifier = Modifier
) {
    val (bgColor, textColor, borderColor) = when (status.lowercase()) {
        "urgent" -> Triple(StatusDownSubtle, StatusDownRose, StatusDownRose.copy(alpha = 0.4f))
        "overdue" -> Triple(StatusWarnSubtle, StatusWarnAmber, StatusWarnAmber.copy(alpha = 0.4f))
        "delivered" -> Triple(StatusUpSubtle, StatusUpGreen, StatusUpGreen.copy(alpha = 0.4f))
        else -> Triple(SurfaceVariantDark, TextPrimary, BorderSubtle)
    }

    Box(
        modifier = modifier
            .background(color = bgColor, shape = RoundedCornerShape(6.dp))
            .border(width = 1.dp, color = borderColor, shape = RoundedCornerShape(6.dp))
            .padding(horizontal = 7.dp, vertical = 3.dp)
    ) {
        Text(
            text = status.uppercase(),
            color = textColor,
            fontSize = 10.sp,
            fontFamily = FontFamily.Monospace,
            fontWeight = FontWeight.Bold
        )
    }
}
