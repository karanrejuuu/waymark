package com.waymark.fmcg.ui.screens.onboarding

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.LocalShipping
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.Store
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.waymark.fmcg.ui.theme.BorderSubtle
import com.waymark.fmcg.ui.theme.CanvasDark
import com.waymark.fmcg.ui.theme.ElectricLime
import com.waymark.fmcg.ui.theme.OnElectricLime
import com.waymark.fmcg.ui.theme.SurfaceCard
import com.waymark.fmcg.ui.theme.SurfaceVariantDark
import com.waymark.fmcg.ui.theme.TextMuted
import com.waymark.fmcg.ui.theme.TextPrimary
import com.waymark.fmcg.ui.theme.TextSecondary

@Composable
fun OnboardingComposeScreen(
    onComplete: () -> Unit,
    modifier: Modifier = Modifier
) {
    var step by remember { mutableIntStateOf(1) }
    val totalSteps = 4

    var selectedCategory by remember { mutableStateOf("Biscuits & Confectionery") }
    var selectedFleetScale by remember { mutableStateOf("15–25 Kirana stores / day") }
    var selectedCreditPolicy by remember { mutableStateOf("Bill-to-Bill Credit") }
    var selectedLoadingOrder by remember { mutableStateOf("LIFO (Door = Stop #1)") }

    val progress = step.toFloat() / totalSteps.toFloat()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(CanvasDark)
            .padding(horizontal = 20.dp, vertical = 24.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // Top Progress Header
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "STEP $step OF $totalSteps",
                    color = ElectricLime,
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.2.sp
                )
                Text(
                    text = "WAYMARK SETUP",
                    color = TextMuted,
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.SemiBold
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp),
                color = ElectricLime,
                trackColor = SurfaceVariantDark,
                strokeCap = StrokeCap.Round
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Step Content Carousel
        AnimatedContent(
            targetState = step,
            transitionSpec = { fadeIn() togetherWith fadeOut() },
            label = "OnboardingStep"
        ) { currentStep ->
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                when (currentStep) {
                    1 -> {
                        StepHeader(
                            eyebrow = "CATEGORY SPECIALTY",
                            title = "What core FMCG lines do you distribute?",
                            description = "Waymark tunes crate volume metrics and auto-reorder intervals based on your inventory turnover speed."
                        )

                        OnboardingChoiceCard(
                            title = "Biscuits & Confectionery",
                            subtitle = "Britannia, Parle, ITC, Cadbury (Fast 3-day turnover)",
                            isSelected = selectedCategory == "Biscuits & Confectionery",
                            icon = Icons.Default.Store,
                            onClick = { selectedCategory = "Biscuits & Confectionery" }
                        )

                        OnboardingChoiceCard(
                            title = "Daily Staples & Cooking Oils",
                            subtitle = "Atta, Mustard Oil, Spices, Ghee (Weekly delivery tempo)",
                            isSelected = selectedCategory == "Daily Staples & Cooking Oils",
                            icon = Icons.Default.Store,
                            onClick = { selectedCategory = "Daily Staples & Cooking Oils" }
                        )

                        OnboardingChoiceCard(
                            title = "Dairy & Packaged Beverages",
                            subtitle = "Milk crates, Juices, Cold Drinks (Daily morning dispatch)",
                            isSelected = selectedCategory == "Dairy & Packaged Beverages",
                            icon = Icons.Default.Store,
                            onClick = { selectedCategory = "Dairy & Packaged Beverages" }
                        )

                        OnboardingChoiceCard(
                            title = "Soaps & Home Care Detergents",
                            subtitle = "Surf Excel, Lux, Detergent bars (Bi-weekly credit cycles)",
                            isSelected = selectedCategory == "Soaps & Home Care Detergents",
                            icon = Icons.Default.Store,
                            onClick = { selectedCategory = "Soaps & Home Care Detergents" }
                        )
                    }

                    2 -> {
                        StepHeader(
                            eyebrow = "DISTRIBUTION SCALE",
                            title = "How many Kirana stores does your tempo cover daily?",
                            description = "Determines sector clustering and maximum LIFO crate stack depth."
                        )

                        OnboardingChoiceCard(
                            title = "15–25 Kirana stores / day",
                            subtitle = "Single 3-wheeler tempo on high-density market beat",
                            isSelected = selectedFleetScale == "15–25 Kirana stores / day",
                            icon = Icons.Default.LocalShipping,
                            onClick = { selectedFleetScale = "15–25 Kirana stores / day" }
                        )

                        OnboardingChoiceCard(
                            title = "30–60 stores / day (2 Pickups)",
                            subtitle = "Multi-corridor beat spanning wholesale & residential markets",
                            isSelected = selectedFleetScale == "30–60 stores / day (2 Pickups)",
                            icon = Icons.Default.LocalShipping,
                            onClick = { selectedFleetScale = "30–60 stores / day (2 Pickups)" }
                        )

                        OnboardingChoiceCard(
                            title = "80+ stores (Regional Fleet)",
                            subtitle = "Multi-vehicle warehouse dispatch with automated LIFO slips",
                            isSelected = selectedFleetScale == "80+ stores (Regional Fleet)",
                            icon = Icons.Default.LocalShipping,
                            onClick = { selectedFleetScale = "80+ stores (Regional Fleet)" }
                        )
                    }

                    3 -> {
                        StepHeader(
                            eyebrow = "CREDIT & RECONCILIATION",
                            title = "What is your primary counter credit policy?",
                            description = "Waymark's dispatch cockpit prominently displays dues based on your settlement rules."
                        )

                        OnboardingChoiceCard(
                            title = "Strict Bill-to-Bill Credit",
                            subtitle = "Collect previous invoice cash before dropping fresh stock crates",
                            isSelected = selectedCreditPolicy == "Strict Bill-to-Bill Credit",
                            icon = Icons.Default.Payments,
                            onClick = { selectedCreditPolicy = "Strict Bill-to-Bill Credit" }
                        )

                        OnboardingChoiceCard(
                            title = "Weekly Settlement Beat",
                            subtitle = "Deliver on weekdays, clear outstanding balance on weekend run",
                            isSelected = selectedCreditPolicy == "Weekly Settlement Beat",
                            icon = Icons.Default.Payments,
                            onClick = { selectedCreditPolicy = "Weekly Settlement Beat" }
                        )

                        OnboardingChoiceCard(
                            title = "100% Cash on Counter Drop",
                            subtitle = "Zero balance carried over; instant cash/UPI collection",
                            isSelected = selectedCreditPolicy == "100% Cash on Counter Drop",
                            icon = Icons.Default.Payments,
                            onClick = { selectedCreditPolicy = "100% Cash on Counter Drop" }
                        )
                    }

                    4 -> {
                        StepHeader(
                            eyebrow = "READY FOR DISPATCH",
                            title = "Your wholesale cockpit is fully calibrated.",
                            description = "Database initialized with live demo Kirana stops and intelligent LIFO stacking rules."
                        )

                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(SurfaceCard, shape = RoundedCornerShape(16.dp))
                                .border(1.dp, BorderSubtle, shape = RoundedCornerShape(16.dp))
                                .padding(18.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Text(
                                text = "CALIBRATION SUMMARY",
                                color = TextMuted,
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.Bold
                            )

                            SummaryRow(label = "Category", value = selectedCategory)
                            SummaryRow(label = "Fleet Scale", value = selectedFleetScale)
                            SummaryRow(label = "Credit Policy", value = selectedCreditPolicy)
                            SummaryRow(label = "Loading Logic", value = selectedLoadingOrder)
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Bottom CTA Button
        Button(
            onClick = {
                if (step < totalSteps) {
                    step++
                } else {
                    onComplete()
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = ElectricLime,
                contentColor = OnElectricLime
            )
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = if (step < totalSteps) "Continue" else "Launch Dispatch Cockpit",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold
                )
                Icon(
                    imageVector = Icons.Default.ArrowForward,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}

@Composable
private fun StepHeader(
    eyebrow: String,
    title: String,
    description: String
) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(
            text = eyebrow,
            color = ElectricLime,
            fontSize = 11.sp,
            fontFamily = FontFamily.Monospace,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.2.sp
        )
        Text(
            text = title,
            color = TextPrimary,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            lineHeight = 26.sp
        )
        Text(
            text = description,
            color = TextSecondary,
            fontSize = 12.sp,
            lineHeight = 18.sp
        )
    }
}

@Composable
private fun OnboardingChoiceCard(
    title: String,
    subtitle: String,
    isSelected: Boolean,
    icon: ImageVector,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                if (isSelected) SurfaceVariantDark else SurfaceCard,
                shape = RoundedCornerShape(16.dp)
            )
            .border(
                1.dp,
                if (isSelected) ElectricLime else BorderSubtle,
                shape = RoundedCornerShape(16.dp)
            )
            .clickable(onClick = onClick)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .background(
                    if (isSelected) ElectricLime else SurfaceVariantDark,
                    shape = RoundedCornerShape(10.dp)
                ),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = if (isSelected) Icons.Default.Check else icon,
                contentDescription = null,
                tint = if (isSelected) OnElectricLime else TextSecondary,
                modifier = Modifier.size(20.dp)
            )
        }

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                color = TextPrimary,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = subtitle,
                color = TextSecondary,
                fontSize = 11.sp,
                modifier = Modifier.padding(top = 2.dp)
            )
        }
    }
}

@Composable
private fun SummaryRow(label: String, value: String) {
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
            color = ElectricLime,
            fontSize = 12.sp,
            fontFamily = FontFamily.Monospace,
            fontWeight = FontWeight.Medium
        )
    }
}
