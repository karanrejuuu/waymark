"use client";

import React, { useEffect, useState } from "react";
import { useTodayList } from "@/hooks/useTodayList";
import { VerticalRouteStop } from "@/components/today/VerticalRouteStop";
import { UrgentButton } from "@/components/today/UrgentButton";
import { db } from "@/lib/db/dexie";
import { drainQueue } from "@/lib/db/sync";
import { formatDateOnly } from "@/lib/scheduling";
import { CloudOff, RefreshCw, AlertTriangle, IndianRupee, MapPin } from "lucide-react";
import Link from "next/link";

export default function TodayPage() {
  const todayItems = useTodayList();
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [totalShopCount, setTotalShopCount] = useState<number | null>(null);
  const [completedShopIds, setCompletedShopIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);

    const handleOnline = () => {
      setIsOnline(true);
      drainQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    async function checkShopStats() {
      const count = await db.shops.count();
      setTotalShopCount(count);
      setHasInitialized(true);
    }
    checkShopStats();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [todayItems]);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await drainQueue();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLoadDemoData = async () => {
    await seedDemoData();
    const count = await db.shops.count();
    setTotalShopCount(count);
  };

  const handleShopDelivered = (shopId: string) => {
    setCompletedShopIds((prev) => new Set([...prev, shopId]));
  };

  // Derive counts & metrics
  const activeItems = todayItems?.filter((i) => !completedShopIds.has(i.shop.id)) ?? [];
  const urgentCount = activeItems.filter((i) => i.isUrgent).length;
  const overdueCount = activeItems.filter((i) => (i.daysOverdue ?? 0) > 0).length;
  const totalBalanceDue = activeItems.reduce((acc, i) => acc + (i.shop.balance_due || 0), 0);
  const totalDueCount = activeItems.length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Network / Sync status line if offline */}
      {!isOnline && (
        <div className="mb-4 py-2.5 px-3.5 bg-[#FEF3C7] border border-[#FDE68A] rounded-xl text-xs text-[#78350F] flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2 font-semibold">
            <CloudOff size={15} className="text-[#92400E]" />
            Working offline. All restock & payment records will sync when reconnected.
          </span>
        </div>
      )}

      {/* Header section with warm tone and clear typography */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] font-heading">
              Today's Route
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] tabular-nums">
              {todayItems === undefined ? "..." : `${totalDueCount} stops`}
            </span>
          </div>
          
          <p className="text-xs text-[#475569] mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            {todayItems === undefined || !hasInitialized ? (
              <span>Loading route...</span>
            ) : totalDueCount === 0 ? (
              <span className="font-semibold text-[#065F46]">All stops completed for today! 🎉</span>
            ) : (
              <>
                <span className="tabular-nums font-bold text-[#0F172A]">
                  {totalDueCount} {totalDueCount === 1 ? "shop" : "shops"} due
                </span>
                {urgentCount > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-[#DC2626] font-bold flex items-center gap-0.5">
                      🌶️ {urgentCount} urgent
                    </span>
                  </>
                )}
                {overdueCount > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-[#DC2626] font-semibold flex items-center gap-0.5 tabular-nums">
                      <AlertTriangle size={12} /> {overdueCount} carried over
                    </span>
                  </>
                )}
                {totalBalanceDue > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-[#065F46] font-bold flex items-center gap-0.5 tabular-nums">
                      <IndianRupee size={12} /> {totalBalanceDue.toLocaleString("en-IN")} pending dues
                    </span>
                  </>
                )}
              </>
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
              className="p-2 text-[#475569] hover:text-[#0F172A] rounded-xl hover:bg-white border border-transparent hover:border-[#CBD5E1] transition-all"
            >
              <RefreshCw size={15} className={isSyncing ? "animate-spin text-[#92400E]" : ""} />
            </button>
          )}
        </div>
      </div>

      {/* Due route container */}
      <div className="border border-[#CBD5E1] rounded-2xl bg-white overflow-hidden shadow-xs">
        {todayItems === undefined || !hasInitialized ? (
          <div className="py-16 text-center text-xs text-[#475569]">
            <RefreshCw size={18} className="animate-spin text-[#92400E] mx-auto mb-2" />
            Loading today's delivery stops...
          </div>
        ) : totalShopCount === 0 ? (
          /* SaaS First-Run Clean State (Zero Mock Data) */
          <div className="py-16 px-6 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] text-[#92400E] flex items-center justify-center mx-auto mb-3 shadow-xs">
              <MapPin size={24} className="text-[#92400E]" />
            </div>
            <div className="text-xl font-extrabold text-[#0F172A] font-heading">
              Ready to start your rounds?
            </div>
            <div className="text-xs text-[#475569] mt-2 leading-relaxed">
              Your account is clean with zero shops. Add your shops via rapid entry, paste an Excel sheet, or complete onboarding to build today's route.
            </div>
            <div className="mt-5 flex flex-col sm:flex-row justify-center gap-2.5">
              <Link
                href="/onboarding"
                className="px-5 py-2.5 text-xs font-bold bg-[#92400E] text-white rounded-xl hover:bg-[#78350F] transition-all shadow-sm"
              >
                Start Guided Setup →
              </Link>
              <Link
                href="/shops/new"
                className="px-4 py-2.5 text-xs font-semibold border border-[#CBD5E1] bg-white text-[#0F172A] rounded-xl hover:bg-[#F8FAFC]"
              >
                + Add Single Shop
              </Link>
            </div>
            <div className="mt-6 pt-4 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={handleLoadDemoData}
                className="text-xs text-[#475569] hover:text-[#0F172A] underline decoration-dashed transition-colors"
              >
                Load 4 sample FMCG shops (for testing demo)
              </button>
            </div>
          </div>
        ) : activeItems.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] flex items-center justify-center mx-auto mb-3 font-bold text-lg">
              ✓
            </div>
            <div className="text-lg font-bold text-[#0F172A] font-heading">
              Nothing due today
            </div>
            <div className="text-xs text-[#475569] mt-1 max-w-xs mx-auto">
              All scheduled delivery cycles are satisfied. Check the routes or shops view to review pending inventory.
            </div>
            <div className="mt-4 flex justify-center gap-2">
              <Link
                href="/routes"
                className="px-4 py-2 text-xs font-bold bg-[#92400E] text-white rounded-xl hover:bg-[#78350F] transition-all shadow-xs"
              >
                Browse All Routes
              </Link>
              <Link
                href="/shops/new"
                className="px-4 py-2 text-xs font-semibold border border-[#CBD5E1] text-[#0F172A] rounded-xl hover:bg-[#F8FAFC]"
              >
                + Add Shop
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5">
            {activeItems.map((item, index) => (
              <VerticalRouteStop
                key={item.shop.id}
                item={item}
                isFirst={index === 0}
                isLast={index === activeItems.length - 1}
                isNextUp={index === 0}
                onDelivered={handleShopDelivered}
              />
            ))}
          </div>
        )}
      </div>

      {/* Route footer quick navigation */}
      {activeItems.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-xs text-[#475569] px-1 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#92400E] inline-block" />
            First stop highlighted as next-up
          </span>
          <Link href="/routes" className="text-[#0F172A] font-bold hover:underline flex items-center gap-1">
            <MapPin size={13} className="text-[#92400E]" /> View on Map
          </Link>
        </div>
      )}
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

  const demoOrgId = "org-waymark-demo";

  // 0. Organisation
  await db.organisations.put({
    id: demoOrgId,
    name: "Apex FMCG Distributors",
    currency: "INR",
    created_at: now.toISOString(),
  });

  // 1. Regions
  const rNorth = { id: "reg-north", organisation_id: demoOrgId, owner_id: "demo-user", name: "North Market", sort_order: 1, created_at: now.toISOString() };
  const rStation = { id: "reg-station", organisation_id: demoOrgId, owner_id: "demo-user", name: "Station Road", sort_order: 2, created_at: now.toISOString() };
  await db.regions.bulkPut([rNorth, rStation]);

  // 2. Godown (Central Warehouse)
  await db.godowns.put({
    id: "godown-1",
    organisation_id: demoOrgId,
    owner_id: "demo-user",
    lat: 19.0760,
    lng: 72.8777,
    vehicle_mileage_kmpl: 25.0,
    petrol_price_per_l: 104.5,
    created_at: now.toISOString(),
  });

  // 3. Products
  const p1 = { id: "p-parle", organisation_id: demoOrgId, owner_id: "demo-user", name: "Parle-G Glucose (Case of 24)", default_interval: 5, created_at: now.toISOString() };
  const p2 = { id: "p-frooti", organisation_id: demoOrgId, owner_id: "demo-user", name: "Frooti Mango 200ml (Crate)", default_interval: 7, created_at: now.toISOString() };
  const p3 = { id: "p-maggi", organisation_id: demoOrgId, owner_id: "demo-user", name: "Maggi 2-Minute Noodles (Box of 48)", default_interval: 6, created_at: now.toISOString() };
  const p4 = { id: "p-tata-tea", organisation_id: demoOrgId, owner_id: "demo-user", name: "Tata Tea Gold 250g (Pack of 12)", default_interval: 10, created_at: now.toISOString() };
  await db.products.bulkPut([p1, p2, p3, p4]);

  // 4. Shops with dues and coordinates
  const s1 = {
    id: "shop-gupta",
    organisation_id: demoOrgId,
    owner_id: "demo-user",
    region_id: rNorth.id,
    name: "Gupta Kirana & General Store",
    contact: "9820011223",
    lat: 19.0820,
    lng: 72.8830,
    notes: "Prefers morning delivery before 11 AM. Cash on delivery.",
    is_urgent: true,
    sort_order: 1,
    balance_due: 1450.00,
    is_archived: false,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  const s2 = {
    id: "shop-laxmi",
    organisation_id: demoOrgId,
    owner_id: "demo-user",
    region_id: rNorth.id,
    name: "Laxmi Supermarket",
    contact: "9820044556",
    lat: 19.0890,
    lng: 72.8890,
    notes: "Counter in rear lane. Key is with cashier.",
    is_urgent: false,
    sort_order: 2,
    balance_due: 3200.00,
    is_archived: false,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  const s3 = {
    id: "shop-anand",
    organisation_id: demoOrgId,
    owner_id: "demo-user",
    region_id: rStation.id,
    name: "Anand Tea Depot",
    contact: "9820077889",
    lat: 19.0710,
    lng: 72.8720,
    notes: "High tea consumption. Check stock every Friday.",
    is_urgent: false,
    sort_order: 3,
    balance_due: 0,
    is_archived: false,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  const s4 = {
    id: "shop-bharat",
    organisation_id: demoOrgId,
    owner_id: "demo-user",
    region_id: rStation.id,
    name: "Bharat Daily Needs",
    contact: "9820099001",
    lat: 19.0680,
    lng: 72.8650,
    notes: "Closed on Tuesdays.",
    is_urgent: false,
    sort_order: 4,
    balance_due: 850.00,
    is_archived: false,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  await db.shops.bulkPut([s1, s2, s3, s4]);

  // 5. Shop Products with scheduling dates
  await db.shop_products.bulkPut([
    // Gupta: due today + urgent
    {
      id: "sp-g-1",
      organisation_id: demoOrgId,
      shop_id: s1.id,
      product_id: p1.id,
      default_qty: 3,
      interval_days: 5,
      remind_offset_days: 0,
      next_due_date: todayStr,
      snooze_until: null,
      created_at: now.toISOString(),
    },
    {
      id: "sp-g-2",
      organisation_id: demoOrgId,
      shop_id: s1.id,
      product_id: p2.id,
      default_qty: 2,
      interval_days: 7,
      remind_offset_days: 1,
      next_due_date: todayStr,
      snooze_until: null,
      created_at: now.toISOString(),
    },

    // Laxmi: overdue by 3 days (escalated carry-over)
    {
      id: "sp-l-1",
      organisation_id: demoOrgId,
      shop_id: s2.id,
      product_id: p3.id,
      default_qty: 4,
      interval_days: 6,
      remind_offset_days: 0,
      next_due_date: threeDaysAgoStr,
      snooze_until: null,
      created_at: now.toISOString(),
    },

    // Anand: due today
    {
      id: "sp-a-1",
      organisation_id: demoOrgId,
      shop_id: s3.id,
      product_id: p4.id,
      default_qty: 5,
      interval_days: 10,
      remind_offset_days: 2,
      next_due_date: todayStr,
      snooze_until: null,
      created_at: now.toISOString(),
    },

    // Bharat: due in 5 days (NOT due today, browse in routes)
    {
      id: "sp-b-1",
      organisation_id: demoOrgId,
      shop_id: s4.id,
      product_id: p1.id,
      default_qty: 2,
      interval_days: 7,
      remind_offset_days: 0,
      next_due_date: formatDateOnly(new Date(now.getTime() + 5 * 86400000)),
      snooze_until: null,
      created_at: now.toISOString(),
    },
  ]);
}
