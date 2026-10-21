"use client";

import React, { useEffect, useState } from "react";
import { useTodayList } from "@/hooks/useTodayList";
import { ShopRow } from "@/components/today/ShopRow";
import { UrgentButton } from "@/components/today/UrgentButton";
import { db } from "@/lib/db/dexie";
import { drainQueue } from "@/lib/db/sync";
import { formatDateOnly } from "@/lib/scheduling";
import { CloudOff, RefreshCw } from "lucide-react";

export default function TodayPage() {
  const todayItems = useTodayList();
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);

    const handleOnline = () => {
      setIsOnline(true);
      drainQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check: if database is completely empty, populate sample FMCG shops & products
    async function checkSeedData() {
      const shopCount = await db.shops.count();
      if (shopCount === 0) {
        await seedDemoData();
      }
      setHasInitialized(true);
    }
    checkSeedData();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await drainQueue();
    } finally {
      setIsSyncing(false);
    }
  };

  const urgentCount = todayItems?.filter((i) => i.isUrgent).length ?? 0;
  const totalDueCount = todayItems?.length ?? 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Network / Sync status line if offline or pending */}
      {!isOnline && (
        <div className="mb-4 py-1.5 px-3 bg-bg-subtle border border-border rounded text-xs text-text-secondary flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CloudOff size={14} className="text-yellow-soft" />
            Working offline. Deliveries will sync when connected.
          </span>
        </div>
      )}

      {/* Header section */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-text-primary">
            Today
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            {todayItems === undefined ? (
              "Loading..."
            ) : totalDueCount === 0 ? (
              "0 shops due"
            ) : (
              `${totalDueCount} ${totalDueCount === 1 ? "shop" : "shops"} due · ${urgentCount} urgent`
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <UrgentButton />
          {isOnline && (
            <button
              type="button"
              onClick={handleManualSync}
              title="Sync now"
              className="p-1.5 text-text-tertiary hover:text-text-primary rounded hover:bg-bg-subtle"
            >
              <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
            </button>
          )}
        </div>
      </div>

      {/* Due list container */}
      <div className="border border-border rounded-lg bg-bg overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        {todayItems === undefined || !hasInitialized ? (
          <div className="py-12 text-center text-xs text-text-tertiary">
            Loading today's route...
          </div>
        ) : todayItems.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="text-sm font-medium text-text-primary">
              Nothing due today
            </div>
            <div className="text-xs text-text-secondary mt-1">
              Check the route view to browse all shops
            </div>
          </div>
        ) : (
          <div>
            {todayItems.map((item) => (
              <ShopRow key={item.shop.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Seed initial sample FMCG shops, products, and intervals
 * so the app is immediately demonstrative and useful on first run.
 */
async function seedDemoData() {
  const now = new Date();
  const todayStr = formatDateOnly(now);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateOnly(yesterday);

  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const threeDaysAgoStr = formatDateOnly(threeDaysAgo);

  // 1. Regions
  const rNorth = { id: "reg-north", owner_id: "demo-user", name: "North Market", sort_order: 1, created_at: now.toISOString() };
  const rStation = { id: "reg-station", owner_id: "demo-user", name: "Station Road", sort_order: 2, created_at: now.toISOString() };
  await db.regions.bulkPut([rNorth, rStation]);

  // 2. Godown (Central Warehouse)
  await db.godowns.put({
    id: "godown-1",
    owner_id: "demo-user",
    lat: 19.0760,
    lng: 72.8777,
    vehicle_mileage_kmpl: 25.0,
    petrol_price_per_l: 104.5,
    created_at: now.toISOString(),
  });

  // 3. Products
  const p1 = { id: "p-parle", owner_id: "demo-user", name: "Parle-G Glucose (Case of 24)", default_interval: 5, created_at: now.toISOString() };
  const p2 = { id: "p-frooti", owner_id: "demo-user", name: "Frooti Mango 200ml (Crate)", default_interval: 7, created_at: now.toISOString() };
  const p3 = { id: "p-maggi", owner_id: "demo-user", name: "Maggi 2-Minute Noodles (Box of 48)", default_interval: 6, created_at: now.toISOString() };
  const p4 = { id: "p-tata-tea", owner_id: "demo-user", name: "Tata Tea Gold 250g (Pack of 12)", default_interval: 10, created_at: now.toISOString() };
  await db.products.bulkPut([p1, p2, p3, p4]);

  // 4. Shops
  const s1 = {
    id: "shop-gupta",
    owner_id: "demo-user",
    region_id: rNorth.id,
    name: "Gupta Kirana & General Store",
    contact: "9820011223",
    lat: 19.0820,
    lng: 72.8830,
    notes: "Prefers morning delivery before 11 AM. Cash on delivery.",
    is_urgent: true,
    sort_order: 1,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  const s2 = {
    id: "shop-laxmi",
    owner_id: "demo-user",
    region_id: rNorth.id,
    name: "Laxmi Supermarket",
    contact: "9820044556",
    lat: 19.0890,
    lng: 72.8890,
    notes: "Counter in rear lane. Key is with cashier.",
    is_urgent: false,
    sort_order: 2,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  const s3 = {
    id: "shop-anand",
    owner_id: "demo-user",
    region_id: rStation.id,
    name: "Anand Tea Depot",
    contact: "9820077889",
    lat: 19.0710,
    lng: 72.8720,
    notes: "High tea consumption. Check stock every Friday.",
    is_urgent: false,
    sort_order: 3,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  const s4 = {
    id: "shop-bharat",
    owner_id: "demo-user",
    region_id: rStation.id,
    name: "Bharat Daily Needs",
    contact: "9820099001",
    lat: 19.0680,
    lng: 72.8650,
    notes: "Closed on Tuesdays.",
    is_urgent: false,
    sort_order: 4,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  await db.shops.bulkPut([s1, s2, s3, s4]);

  // 5. Shop Products with scheduling dates
  await db.shop_products.bulkPut([
    // Gupta: due today + urgent
    {
      id: "sp-g-1",
      shop_id: s1.id,
      product_id: p1.id,
      default_qty: 3,
      interval_days: 5,
      remind_offset_days: 0,
      next_due_date: todayStr,
      created_at: now.toISOString(),
    },
    {
      id: "sp-g-2",
      shop_id: s1.id,
      product_id: p2.id,
      default_qty: 2,
      interval_days: 7,
      remind_offset_days: 1,
      next_due_date: todayStr,
      created_at: now.toISOString(),
    },

    // Laxmi: overdue by 3 days (escalated)
    {
      id: "sp-l-1",
      shop_id: s2.id,
      product_id: p3.id,
      default_qty: 4,
      interval_days: 6,
      remind_offset_days: 0,
      next_due_date: threeDaysAgoStr,
      created_at: now.toISOString(),
    },

    // Anand: due today
    {
      id: "sp-a-1",
      shop_id: s3.id,
      product_id: p4.id,
      default_qty: 5,
      interval_days: 10,
      remind_offset_days: 2,
      next_due_date: todayStr,
      created_at: now.toISOString(),
    },

    // Bharat: due in 5 days (NOT due today, browse in routes)
    {
      id: "sp-b-1",
      shop_id: s4.id,
      product_id: p1.id,
      default_qty: 2,
      interval_days: 7,
      remind_offset_days: 0,
      next_due_date: formatDateOnly(new Date(now.getTime() + 5 * 86400000)),
      created_at: now.toISOString(),
    },
  ]);
}
