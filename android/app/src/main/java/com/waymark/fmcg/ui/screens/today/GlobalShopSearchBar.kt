package com.waymark.fmcg.ui.screens.today

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.EditNote
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.waymark.fmcg.data.model.Shop
import com.waymark.fmcg.ui.theme.BorderSubtle
import com.waymark.fmcg.ui.theme.ElectricLime
import com.waymark.fmcg.ui.theme.SurfaceCard
import com.waymark.fmcg.ui.theme.SurfaceVariantDark
import com.waymark.fmcg.ui.theme.TextMuted
import com.waymark.fmcg.ui.theme.TextPrimary
import com.waymark.fmcg.ui.theme.TextSecondary

@Composable
fun GlobalShopSearchBar(
    query: String,
    onQueryChanged: (String) -> Unit,
    searchResults: List<Shop>,
    onShopSelected: (Shop) -> Unit,
    onShopActionClick: (Shop) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        OutlinedTextField(
            value = query,
            onValueChange = onQueryChanged,
            modifier = Modifier.fillMaxWidth(),
            placeholder = {
                Text(
                    text = "Search store by name, market, or owner...",
                    color = TextMuted,
                    fontSize = 13.sp
                )
            },
            leadingIcon = {
                Icon(
                    imageVector = Icons.Default.Search,
                    contentDescription = "Search",
                    tint = TextSecondary,
                    modifier = Modifier.size(20.dp)
                )
            },
            trailingIcon = {
                if (query.isNotEmpty()) {
                    IconButton(onClick = { onQueryChanged("") }) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Clear search",
                            tint = TextSecondary,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            },
            singleLine = true,
            shape = RoundedCornerShape(14.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = SurfaceVariantDark,
                unfocusedContainerColor = SurfaceVariantDark,
                focusedBorderColor = ElectricLime,
                unfocusedBorderColor = BorderSubtle,
                focusedTextColor = TextPrimary,
                unfocusedTextColor = TextPrimary,
                cursorColor = ElectricLime
            )
        )

        AnimatedVisibility(
            visible = query.isNotBlank() && searchResults.isNotEmpty(),
            enter = fadeIn(),
            exit = fadeOut()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(SurfaceCard, shape = RoundedCornerShape(16.dp))
                    .border(1.dp, BorderSubtle, shape = RoundedCornerShape(16.dp))
                    .padding(8.dp)
                    .heightIn(max = 260.dp)
            ) {
                Text(
                    text = "${searchResults.size} STORES FOUND IN DATABASE",
                    color = TextMuted,
                    fontSize = 10.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                )

                LazyColumn {
                    items(searchResults, key = { it.id }) { shop ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color.Transparent, shape = RoundedCornerShape(10.dp))
                                .clickable { onShopSelected(shop) }
                                .padding(horizontal = 12.dp, vertical = 10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = shop.name,
                                    color = TextPrimary,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = "${shop.address ?: "Store Location"} • ${shop.ownerName ?: "Store Manager"}",
                                    color = TextSecondary,
                                    fontSize = 11.sp
                                )
                                if (shop.balanceDue > 0) {
                                    Text(
                                        text = "Outstanding Due: ₹${shop.balanceDue.toInt()}",
                                        color = ElectricLime,
                                        fontSize = 11.sp,
                                        fontFamily = FontFamily.Monospace,
                                        fontWeight = FontWeight.Medium
                                    )
                                }
                            }

                            Box(
                                modifier = Modifier
                                    .background(SurfaceVariantDark, shape = RoundedCornerShape(8.dp))
                                    .border(1.dp, BorderSubtle, shape = RoundedCornerShape(8.dp))
                                    .clickable { onShopActionClick(shop) }
                                    .padding(horizontal = 10.dp, vertical = 6.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.EditNote,
                                        contentDescription = "Log Visit",
                                        tint = ElectricLime,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Text(
                                        text = "Log Visit",
                                        color = ElectricLime,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Medium
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
