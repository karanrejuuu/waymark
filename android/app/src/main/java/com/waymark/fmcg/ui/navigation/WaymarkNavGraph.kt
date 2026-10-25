package com.waymark.fmcg.ui.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.waymark.fmcg.ui.components.Screen
import com.waymark.fmcg.ui.components.WaymarkBottomBar
import com.waymark.fmcg.ui.screens.onboarding.OnboardingComposeScreen
import com.waymark.fmcg.ui.screens.routes.RoutesSectorsScreen
import com.waymark.fmcg.ui.screens.shop.ShopDetailScreen
import com.waymark.fmcg.ui.screens.today.TodayDispatchScreen
import com.waymark.fmcg.ui.theme.CanvasDark
import com.waymark.fmcg.viewmodel.TodayViewModel

@Composable
fun WaymarkNavGraph(
    viewModel: TodayViewModel,
    startDestination: String = Screen.Today.route,
    navController: NavHostController = rememberNavController()
) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route ?: startDestination

    val showBottomBar = currentRoute in listOf(
        Screen.Today.route,
        Screen.Routes.route,
        Screen.Settings.route
    )

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .background(CanvasDark),
        containerColor = CanvasDark,
        bottomBar = {
            if (showBottomBar) {
                WaymarkBottomBar(
                    currentRoute = currentRoute,
                    onNavigate = { targetRoute ->
                        if (targetRoute != currentRoute) {
                            navController.navigate(targetRoute) {
                                popUpTo(Screen.Today.route) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    }
                )
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = startDestination,
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            composable(Screen.Today.route) {
                TodayDispatchScreen(
                    viewModel = viewModel,
                    onNavigateToShop = { shopId ->
                        navController.navigate("shop_detail/$shopId")
                    }
                )
            }

            composable(Screen.Routes.route) {
                RoutesSectorsScreen(
                    viewModel = viewModel,
                    onNavigateToRouteDetail = { regionId ->
                        viewModel.onRouteSelected(regionId)
                        navController.navigate(Screen.Today.route)
                    }
                )
            }

            composable(Screen.Settings.route) {
                OnboardingComposeScreen(
                    onComplete = {
                        navController.navigate(Screen.Today.route) {
                            popUpTo(Screen.Today.route) { inclusive = true }
                        }
                    }
                )
            }

            composable("onboarding") {
                OnboardingComposeScreen(
                    onComplete = {
                        navController.navigate(Screen.Today.route) {
                            popUpTo("onboarding") { inclusive = true }
                        }
                    }
                )
            }

            composable(
                route = "shop_detail/{shopId}",
                arguments = listOf(navArgument("shopId") { type = NavType.StringType })
            ) { backStackEntry ->
                val shopId = backStackEntry.arguments?.getString("shopId") ?: ""
                ShopDetailScreen(
                    shopId = shopId,
                    viewModel = viewModel,
                    onBack = { navController.popBackStack() }
                )
            }
        }
    }
}
