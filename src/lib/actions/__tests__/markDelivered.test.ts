import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { db } from "../../db/dexie";
import { markDelivered } from "../markDelivered";
import { formatDateOnly } from "../../scheduling";

describe("markDelivered Action", () => {
  beforeEach(async () => {
    await db.shops.clear();
    await db.products.clear();
    await db.shop_products.clear();
    await db.deliveries.clear();
    await db.sync_queue.clear();
  });

  it("updates intervals, schedules next_due_date, records delivery, and clears is_urgent", async () => {
    // Setup shop
    await db.shops.put({
      id: "shop-1",
      owner_id: "owner-1",
      organisation_id: "org-1",
      name: "Gupta General Store",
      contact: "9876543210",
      region_id: null,
      lat: null,
      lng: null,
      notes: null,
      is_urgent: true,
      sort_order: 0,
      balance_due: 0,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Setup product
    await db.products.put({
      id: "prod-1",
      owner_id: "owner-1",
      organisation_id: "org-1",
      name: "Parle-G 100g",
      default_interval: 7,
      created_at: new Date().toISOString(),
    });

    // Setup shop_product with interval 7 and offset 1
    const todayStr = formatDateOnly(new Date());
    await db.shop_products.put({
      id: "sp-1",
      organisation_id: "org-1",
      shop_id: "shop-1",
      product_id: "prod-1",
      default_qty: 10,
      interval_days: 7,
      remind_offset_days: 1,
      next_due_date: todayStr,
      snooze_until: null,
      created_at: new Date().toISOString(),
    });

    // Mark delivered with stock_feedback: 'low'
    await markDelivered("shop-1", [
      {
        productId: "prod-1",
        qty: 12,
        feedback: "low",
      },
    ]);

    // Check delivery record created
    const deliveries = await db.deliveries.toArray();
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0].qty).toBe(12);
    expect(deliveries[0].stock_feedback).toBe("low");
    expect(deliveries[0].client_id).toBeDefined();

    // Check interval self-corrected: 7 - 1 = 6
    const updatedSp = await db.shop_products.get("sp-1");
    expect(updatedSp?.interval_days).toBe(6);

    // Check next_due_date: today + 6 - 1 = today + 5 days
    const expectedDue = new Date();
    expectedDue.setDate(expectedDue.getDate() + 5);
    expect(updatedSp?.next_due_date).toBe(formatDateOnly(expectedDue));

    // Check shop urgent cleared
    const updatedShop = await db.shops.get("shop-1");
    expect(updatedShop?.is_urgent).toBe(false);
  });

  it("handles fallback to default_qty when qty is invalid or cleared (Review Focus #3)", async () => {
    await db.shops.put({
      id: "shop-2",
      owner_id: "owner-1",
      organisation_id: "org-1",
      name: "Sharma Kirana",
      contact: null,
      region_id: null,
      lat: null,
      lng: null,
      notes: null,
      is_urgent: false,
      sort_order: 0,
      balance_due: 0,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await db.shop_products.put({
      id: "sp-2",
      organisation_id: "org-1",
      shop_id: "shop-2",
      product_id: "prod-2",
      default_qty: 5,
      interval_days: 5,
      remind_offset_days: 0,
      next_due_date: "2026-10-22",
      snooze_until: null,
      created_at: new Date().toISOString(),
    });

    // Pass NaN or 0 qty
    await markDelivered("shop-2", [
      {
        productId: "prod-2",
        qty: NaN,
        feedback: "fine",
      },
    ]);

    const deliveries = await db.deliveries.toArray();
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0].qty).toBe(5); // fell back to default_qty: 5
  });
});
