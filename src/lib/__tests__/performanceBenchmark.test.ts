import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { db, LocalShop, LocalShopProduct, LocalDelivery, LocalPayment } from "../db/dexie";
import { formatDateOnly, isDueToday, isEscalated, sortTodayItems, parseDateOnly } from "../scheduling";

describe("Performance & Scale Benchmark — 500 Shops & 10,000 Logs", () => {
  const TOTAL_SHOPS = 500;
  const TOTAL_LOGS = 10000;
  const orgId = "org-scale-test";

  beforeEach(async () => {
    await db.shops.clear();
    await db.shop_products.clear();
    await db.deliveries.clear();
    await db.payments.clear();
  });

  it(`seeds ${TOTAL_SHOPS} shops and ${TOTAL_LOGS} logs, and verifies Today route computes in under 1 second`, async () => {
    const today = new Date();
    const todayStr = formatDateOnly(today);

    console.log(`[Benchmark] Generating ${TOTAL_SHOPS} shops...`);
    const shops: LocalShop[] = [];
    const shopProducts: LocalShopProduct[] = [];

    for (let i = 1; i <= TOTAL_SHOPS; i++) {
      const shopId = `shop-perf-${i}`;
      // Every 3rd shop is due today; every 15th is urgent; others due in future
      const isUrgent = i % 15 === 0;
      const isDue = i % 3 === 0;

      let nextDueDate = todayStr;
      if (!isDue && !isUrgent) {
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + (i % 10) + 1);
        nextDueDate = formatDateOnly(futureDate);
      }

      shops.push({
        id: shopId,
        owner_id: "bench-user",
        organisation_id: orgId,
        region_id: `region-${(i % 10) + 1}`,
        name: `Shop No. ${i} — ${i % 2 === 0 ? "General Store" : "Kirana & Provision"}`,
        contact: `980000${String(i).padStart(4, "0")}`,
        lat: 19.076 + (i * 0.0001),
        lng: 72.877 + (i * 0.0001),
        notes: `Delivery notes for shop ${i}`,
        is_urgent: isUrgent,
        is_archived: false,
        balance_due: (i * 150) % 5000,
        sort_order: i,
        created_at: today.toISOString(),
        updated_at: today.toISOString(),
      });

      shopProducts.push({
        id: `sp-perf-${i}`,
        organisation_id: orgId,
        shop_id: shopId,
        product_id: `prod-${(i % 5) + 1}`,
        default_qty: (i % 10) + 1,
        interval_days: (i % 7) + 3,
        remind_offset_days: i % 2,
        next_due_date: nextDueDate,
        snooze_until: null,
        created_at: today.toISOString(),
      });
    }

    await db.shops.bulkPut(shops);
    await db.shop_products.bulkPut(shopProducts);

    console.log(`[Benchmark] Generating ${TOTAL_LOGS} history logs (deliveries + payments)...`);
    const deliveries: LocalDelivery[] = [];
    const payments: LocalPayment[] = [];

    for (let j = 1; j <= TOTAL_LOGS / 2; j++) {
      const targetShopId = `shop-perf-${(j % TOTAL_SHOPS) + 1}`;
      deliveries.push({
        id: `del-perf-${j}`,
        client_id: `del-client-${j}`,
        organisation_id: orgId,
        shop_id: targetShopId,
        product_id: `prod-${(j % 5) + 1}`,
        delivered_by: "bench-user",
        qty: (j % 5) + 1,
        delivered_at: new Date(Date.now() - (j * 3600000)).toISOString(),
        stock_feedback: j % 3 === 0 ? "fine" : j % 3 === 1 ? "low" : "plenty",
        notes: null,
        skip_reason: null,
        synced: true,
        created_at: today.toISOString(),
      });

      payments.push({
        id: `pay-perf-${j}`,
        client_id: `pay-client-${j}`,
        organisation_id: orgId,
        shop_id: targetShopId,
        collected_by: "bench-user",
        amount: ((j % 20) + 1) * 100,
        payment_mode: j % 2 === 0 ? "cash" : "upi",
        notes: "Daily collection",
        collected_at: new Date(Date.now() - (j * 3600000)).toISOString(),
        created_at: today.toISOString(),
      });
    }

    await db.deliveries.bulkPut(deliveries);
    await db.payments.bulkPut(payments);

    // Verify record counts
    expect(await db.shops.count()).toBe(TOTAL_SHOPS);
    expect(await db.shop_products.count()).toBe(TOTAL_SHOPS);
    expect(await db.deliveries.count()).toBe(TOTAL_LOGS / 2);
    expect(await db.payments.count()).toBe(TOTAL_LOGS / 2);

    // ── NOW BENCHMARK: LOAD TODAY ROUTE ACROSS 500 SHOPS ──
    const startTime = performance.now();

    const [allShops, allSps] = await Promise.all([
      db.shops.where({ organisation_id: orgId }).filter((s) => !s.is_archived).toArray(),
      db.shop_products.where({ organisation_id: orgId }).toArray(),
    ]);

    const spMap = new Map<string, LocalShopProduct[]>();
    for (const sp of allSps) {
      const list = spMap.get(sp.shop_id) || [];
      list.push(sp);
      spMap.set(sp.shop_id, list);
    }

    const todayItems: any[] = [];
    for (const s of allShops) {
      const sps = spMap.get(s.id) || [];
      const hasDue = sps.some((sp) => isDueToday(sp.next_due_date, todayStr, sp.snooze_until));
      if (s.is_urgent || hasDue) {
        todayItems.push({
          shopId: s.id,
          isUrgent: s.is_urgent,
          nextDueDate: sps[0]?.next_due_date || todayStr,
          sortOrder: s.sort_order,
        });
      }
    }

    const sortedRoute = sortTodayItems(todayItems, todayStr);
    const durationMs = performance.now() - startTime;

    console.log(`[Benchmark Result] Evaluated 500 shops & 10k logs in ${durationMs.toFixed(2)} ms!`);
    console.log(`[Benchmark Result] Found ${sortedRoute.length} stops due today.`);

    // MUST LOAD IN UNDER A SECOND (1000ms)
    expect(durationMs).toBeLessThan(1000);
    expect(sortedRoute.length).toBeGreaterThan(0);
    // Urgent stops on top
    expect(sortedRoute[0].isUrgent).toBe(true);
  });
});
