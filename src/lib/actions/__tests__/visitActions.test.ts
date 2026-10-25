import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { db } from "../../db/dexie";
import { recordShopVisitOutcome, updateShopNote } from "../visitActions";
import { formatDateOnly } from "../../scheduling";

describe("recordShopVisitOutcome Action", () => {
  beforeEach(async () => {
    await db.shops.clear();
    await db.products.clear();
    await db.shop_products.clear();
    await db.deliveries.clear();
    await db.payments.clear();
    await db.sync_queue.clear();
  });

  const setupBaseShop = async (initialBalanceDue = 1000) => {
    const todayStr = formatDateOnly(new Date());

    await db.shops.put({
      id: "shop-test",
      owner_id: "demo-user",
      organisation_id: "org-1",
      name: "Gupta Kirana Mandi",
      contact: "9820011223",
      region_id: "route-1",
      lat: 19.07,
      lng: 72.87,
      notes: "Preferred morning drops",
      is_urgent: true,
      sort_order: 1,
      balance_due: initialBalanceDue,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await db.products.put({
      id: "prod-biscuits",
      owner_id: "demo-user",
      organisation_id: "org-1",
      name: "Parle-G 100g Case",
      default_interval: 7,
      created_at: new Date().toISOString(),
    });

    await db.shop_products.put({
      id: "sp-test",
      organisation_id: "org-1",
      shop_id: "shop-test",
      product_id: "prod-biscuits",
      default_qty: 4,
      interval_days: 7,
      remind_offset_days: 0,
      next_due_date: todayStr,
      snooze_until: null,
      created_at: new Date().toISOString(),
    });
  };

  it("handles 'delivered_paid': stamps delivery, collects payment, and deducts from dues", async () => {
    await setupBaseShop(1500);

    const res = await recordShopVisitOutcome({
      shopId: "shop-test",
      outcome: "delivered_paid",
      productDeliveries: [{ productId: "prod-biscuits", qty: 4 }],
      paymentCollected: 1500,
      paymentMode: "cash",
      notes: "Full payment received at counter",
    });

    expect(res.success).toBe(true);

    const updatedShop = await db.shops.get("shop-test");
    expect(updatedShop?.balance_due).toBe(0);
    expect(updatedShop?.is_urgent).toBe(false);

    const deliveries = await db.deliveries.where({ shop_id: "shop-test" }).toArray();
    expect(deliveries.length).toBe(1);
    expect(deliveries[0].qty).toBe(4);

    const payments = await db.payments.where({ shop_id: "shop-test" }).toArray();
    expect(payments.length).toBe(1);
    expect(payments[0].amount).toBe(1500);
  });

  it("handles 'delivered_unpaid': stamps delivery, adds new invoice amount to khata, notes bill details", async () => {
    await setupBaseShop(500);

    const res = await recordShopVisitOutcome({
      shopId: "shop-test",
      outcome: "delivered_unpaid",
      productDeliveries: [{ productId: "prod-biscuits", qty: 5 }],
      billAmount: 1200,
      billNumber: "INV-891",
      notes: "Owner says will clear next Tuesday",
    });

    expect(res.success).toBe(true);

    const updatedShop = await db.shops.get("shop-test");
    // Initial 500 + 1200 new bill = 1700
    expect(updatedShop?.balance_due).toBe(1700);
    expect(updatedShop?.notes).toContain("INV-891");

    const deliveries = await db.deliveries.where({ shop_id: "shop-test" }).toArray();
    expect(deliveries.length).toBe(1);
  });

  it("handles 'bill_to_bill': settles previous bill and issues new invoice", async () => {
    await setupBaseShop(2000);

    const res = await recordShopVisitOutcome({
      shopId: "shop-test",
      outcome: "bill_to_bill",
      productDeliveries: [{ productId: "prod-biscuits", qty: 3 }],
      previousBillSettled: 2000,
      billAmount: 2400,
      billNumber: "INV-902",
      notes: "Previous bill paid via UPI QR",
      paymentMode: "upi",
    });

    expect(res.success).toBe(true);

    const updatedShop = await db.shops.get("shop-test");
    // Settled 2000 (reaches 0), new bill 2400 added -> balance is 2400
    expect(updatedShop?.balance_due).toBe(2400);

    const payments = await db.payments.where({ shop_id: "shop-test" }).toArray();
    expect(payments.length).toBe(1);
    expect(payments[0].amount).toBe(2000);
  });

  it("handles 'follow_up': snoozes shop to follow-up date and stores update note", async () => {
    await setupBaseShop(800);

    const res = await recordShopVisitOutcome({
      shopId: "shop-test",
      outcome: "follow_up",
      followUpDate: "2026-10-28",
      notes: "Owner at wholesale mandi, visit Wednesday morning",
    });

    expect(res.success).toBe(true);

    const sp = await db.shop_products.where({ shop_id: "shop-test" }).first();
    expect(sp?.snooze_until).toBe("2026-10-28");

    const updatedShop = await db.shops.get("shop-test");
    expect(updatedShop?.notes).toContain("Owner at wholesale mandi");
  });

  it("handles 'shop_closed': snoozes shop to tomorrow and logs notice", async () => {
    await setupBaseShop(800);

    const res = await recordShopVisitOutcome({
      shopId: "shop-test",
      outcome: "shop_closed",
      notes: "Shutter pulled down for afternoon rest",
    });

    expect(res.success).toBe(true);

    const sp = await db.shop_products.where({ shop_id: "shop-test" }).first();
    expect(sp?.snooze_until).not.toBeNull();
  });

  it("updates shop note independently via updateShopNote", async () => {
    await setupBaseShop(300);

    await updateShopNote("shop-test", "Added second contact number: 9811223344");

    const updatedShop = await db.shops.get("shop-test");
    expect(updatedShop?.notes).toContain("9811223344");
  });
});
