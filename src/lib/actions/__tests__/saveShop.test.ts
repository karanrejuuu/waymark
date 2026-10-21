import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { db } from "../../db/dexie";
import { saveShop } from "../saveShop";
import { formatDateOnly } from "../../scheduling";

describe("saveShop Action", () => {
  beforeEach(async () => {
    await db.shops.clear();
    await db.shop_products.clear();
    await db.sync_queue.clear();
  });

  it("new shop: shop_products next_due_date defaults to today", async () => {
    const today = formatDateOnly(new Date());

    const shopId = await saveShop({
      name: "Modern Provision Store",
      regionId: "reg-1",
      contact: "9988776655",
      products: [
        {
          productId: "prod-tea",
          intervalDays: 7,
          defaultQty: 3,
          remindOffsetDays: 1,
        },
      ],
    });

    const savedShop = await db.shops.get(shopId);
    expect(savedShop?.name).toBe("Modern Provision Store");

    const sp = await db.shop_products
      .where({ shop_id: shopId, product_id: "prod-tea" })
      .first();

    expect(sp).toBeDefined();
    expect(sp?.next_due_date).toBe(today);
    expect(sp?.remind_offset_days).toBe(1);
  });
});
