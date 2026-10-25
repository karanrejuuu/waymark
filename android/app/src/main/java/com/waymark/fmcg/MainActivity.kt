package com.waymark.fmcg

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import com.waymark.fmcg.ui.navigation.WaymarkNavGraph
import com.waymark.fmcg.ui.theme.WaymarkTheme
import com.waymark.fmcg.viewmodel.TodayViewModel
import com.waymark.fmcg.viewmodel.TodayViewModelFactory

class MainActivity : ComponentActivity() {

    private val viewModel: TodayViewModel by viewModels {
        val app = application as WaymarkApplication
        TodayViewModelFactory(app.repository)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            WaymarkTheme {
                WaymarkNavGraph(viewModel = viewModel)
            }
        }
    }
}
