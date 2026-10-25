package com.waymark.fmcg.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.CompassCalibration
import androidx.compose.material.icons.filled.FormatListNumbered
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.waymark.fmcg.ui.theme.BorderSubtle
import com.waymark.fmcg.ui.theme.CanvasDark
import com.waymark.fmcg.ui.theme.ElectricLime
import com.waymark.fmcg.ui.theme.TextSecondary

sealed class Screen(val route: String, val label: String, val icon: ImageVector) {
    data object Today : Screen("today", "Today", Icons.Default.CalendarToday)
    data object Routes : Screen("routes", "Routes", Icons.Default.CompassCalibration)
    data object Settings : Screen("settings", "Settings", Icons.Default.Settings)
}

@Composable
fun WaymarkBottomBar(
    currentRoute: String,
    onNavigate: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val items = listOf(Screen.Today, Screen.Routes, Screen.Settings)

    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(CanvasDark)
            .border(width = 1.dp, color = BorderSubtle)
            .navigationBarsPadding()
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceAround,
        verticalAlignment = Alignment.CenterVertically
    ) {
        items.forEach { screen ->
            val isSelected = currentRoute == screen.route
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier
                    .clickable { onNavigate(screen.route) }
                    .padding(horizontal = 16.dp, vertical = 4.dp)
            ) {
                Icon(
                    imageVector = screen.icon,
                    contentDescription = screen.label,
                    tint = if (isSelected) ElectricLime else TextSecondary
                )
                Text(
                    text = screen.label,
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace,
                    color = if (isSelected) ElectricLime else TextSecondary,
                    modifier = Modifier.padding(top = 2.dp)
                )
            }
        }
    }
}
