import { db } from "../db/dexie";
import { enqueueWrite } from "../db/sync";
import {
  computeNextDueDate,
  adjustInterval,
  formatDateOnly,
} from "../scheduling";
import { StockFeedback } from "../supabase/types";

export interface ProductDeliveryInput {
  productId: string;
  qty: number;
  feedback?: StockFeedback;
}

/**
 * Mark a shop's products as delivered.
 * Updates intervals based on feedback, computes next due date,
 * records deliveries, and clears urgent status.
 */
export async function markDelivered(
  shopId: string,
  productDeliveries: ProductDeliveryInput[],
  deliveredBy: string | null = null
): Promise<void> {
  const shop = await db.shops.get(shopId);
  if (!shop) {
    throw new Error(`Shop with id ${shopId} not found`);
  }

  const now = new Date();
  const nowIso = now.toISOString();

  for (const item of productDeliveries) {
    // 1. Get current shop-product configuration
    const shopProduct = await db.shop_products
      .where({ shop_id: shopId, product_id: item.productId })
      .first();

    const currentInterval = shopProduct?.interval_days ?? 7;
    const remindOffset = shopProduct?.remind_offset_days ?? 0;
    const defaultQty = shopProduct?.default_qty ?? 1;

    // Review Focus #3: fallback to default_qty if qty is NaN or <= 0
    const qtyToRecord = Number.isFinite(item.qty) && item.qty > 0 ? item.qty : defaultQty;

    // 2. Self-correct interval
    const newInterval = adjustInterval(currentInterval, item.feedback);

    // 3. Compute next due date from today
    const nextDueDate = computeNextDueDate(now, newInterval, remindOffset);
    const nextDueDateStr = formatDateOnly(nextDueDate);

    // 4. Record delivery (client_id UUID is unique for idempotent sync)
    const clientId = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const deliveryRecord = {
      id: clientId,
      client_id: clientId,
      shop_id: shopId,
      product_id: item.productId,
      delivered_by: deliveredBy,
      qty: qtyToRecord,
      delivered_at: nowIso,
      stock_feedback: item.feedback || null,
      notes: null,
      synced: false,
      created_at: nowIso,
    };

    await enqueueWrite("deliveries", "upsert", deliveryRecord);

    // 5. Update shop_products in Dexie and queue
    if (shopProduct) {
      const updatedShopProduct = {
        ...shopProduct,
        interval_days: newInterval,
        next_due_date: nextDueDateStr,
      };
      await enqueueWrite("shop_products", "upsert", updatedShopProduct);
    }
  }

  // 6. If shop was marked urgent, reset urgent flag and update updated_at
  if (shop.is_urgent) {
    const updatedShop = {
      ...shop,
      is_urgent: false,
      updated_at: nowIso,
    };
    await enqueueWrite("shops", "upsert", updatedShop);
  }
}
