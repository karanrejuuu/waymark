import { db } from "../db/dexie";
import { enqueueWrite } from "../db/sync";
import { calculateSnoozeDate } from "../scheduling";

/**
 * Snooze a shop stop until a future date (e.g. "Shop closed today", "Visit on Thursday").
 * Sets snooze_until on shop_products without corrupting or changing the baseline interval_days!
 */
export async function snoozeShop(
  shopId: string,
  daysOrDate: number | Date | string,
  reason?: string
): Promise<string> {
  const shop = await db.shops.get(shopId);
  if (!shop) {
    throw new Error(`Shop with id ${shopId} not found`);
  }

  const snoozeTargetDate = calculateSnoozeDate(daysOrDate);
  const nowIso = new Date().toISOString();

  // Update all shop_products for this shop
  const spList = await db.shop_products.where({ shop_id: shopId }).toArray();
  for (const sp of spList) {
    const updated = {
      ...sp,
      snooze_until: snoozeTargetDate,
    };
    await enqueueWrite("shop_products", "upsert", updated);
  }

  // Also clear urgent flag if snoozed
  if (shop.is_urgent) {
    const updatedShop = {
      ...shop,
      is_urgent: false,
      notes: reason ? `${shop.notes ? shop.notes + " · " : ""}Snoozed: ${reason}` : shop.notes,
      updated_at: nowIso,
    };
    await enqueueWrite("shops", "upsert", updatedShop);
  }

  return snoozeTargetDate;
}

/**
 * Archive or unarchive a shop.
 * Inactive shops are archived, not deleted, so delivery history and balance dues survive.
 */
export async function archiveShop(shopId: string, isArchived: boolean = true): Promise<void> {
  const shop = await db.shops.get(shopId);
  if (!shop) {
    throw new Error(`Shop with id ${shopId} not found`);
  }

  const updated = {
    ...shop,
    is_archived: isArchived,
    updated_at: new Date().toISOString(),
  };

  await enqueueWrite("shops", "upsert", updated);
}
