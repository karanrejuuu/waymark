"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useTodayList, TodayShopItem } from "@/hooks/useTodayList";
import { db, LocalRegion, LocalShop, LocalShopProduct, LocalProduct } from "@/lib/db/dexie";
import { drainQueue } from "@/lib/db/sync";
import { formatDateOnly } from "@/lib/scheduling";
import { markDelivered } from "@/lib/actions/markDelivered";
import { seedDemoData } from "@/lib/db/seedDemoData";
import { createDatabaseBackup } from "@/lib/db/backup";
import { CdnxTopNav } from "@/components/cdnx/CdnxTopNav";
import { CdnxRouteSidebar } from "@/components/cdnx/CdnxRouteSidebar";
import { CdnxCenterStage } from "@/components/cdnx/CdnxCenterStage";
import { CdnxWalkToCarSlip } from "@/components/cdnx/CdnxWalkToCarSlip";
import { CdnxAddShopModal } from "@/components/cdnx/CdnxAddShopModal";
import { CdnxLedgerView } from "@/components/cdnx/CdnxLedgerView";

export default function SupplierDashboardPage() {
  const todayItems = useTodayList();
  const [regions, setRegions] = useState<LocalRegion[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>("reg-fortkochi");
  const [activeTab, setActiveTab] = useState<"today" | "all_shops" | "ledger">("today");
  const [activeSegment, setActiveSegment] = useState<"due" | "completed" | "all">("due");
  const [activeSubFilter, setActiveSubFilter] = useState<"all" | "reminders" | "completed" | "dues">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [completedShopIds, setCompletedShopIds] = useState<Set<string>>(new Set());
  const [allDbShops, setAllDbShops] = useState<LocalShop[]>([]);

  // Slip (Walk-to-Car logger) State
  const [slipShop, setSlipShop] = useState<LocalShop | null>(null);
  const [slipProducts, setSlipProducts] = useState<Array<{ shopProduct: LocalShopProduct; product?: LocalProduct }>>([]);

  // Add Shop Modal State
  const [isAddShopModalOpen, setIsAddShopModalOpen] = useState(false);

  // Initial Data Load & Client Territory Beat Resolution
  useEffect(() => {
    async function initData() {
      let allRegs = await db.regions.orderBy("sort_order").toArray();
      const shops = await db.shops.filter((s) => !s.is_archived).toArray();

      setRegions(allRegs);
      setAllDbShops(shops);

      // Restore today's completed deliveries from offline db
      const todayDateStr = formatDateOnly(new Date());
      const deliveries = await db.deliveries.toArray();
      const completedToday = new Set(
        deliveries
          .filter((d) => d.delivered_at && d.delivered_at.startsWith(todayDateStr))
          .map((d) => d.shop_id)
      );
      setCompletedShopIds(completedToday);

      // Auto-select corridor matching today's scheduled day of the week (Sun=0, Mon=1, etc.)
      const currentDayOfWeek = new Date().getDay();
      const scheduledTodayRoute = allRegs.find((r) => r.active_days?.includes(currentDayOfWeek));

      if (scheduledTodayRoute) {
        setSelectedRouteId(scheduledTodayRoute.id);
      } else if (allRegs.length > 0) {
        setSelectedRouteId(allRegs[0].id);
      } else {
        setSelectedRouteId("all");
      }

      // Automated Local Audit Snapshot (Zero Data Loss Protection)
      try {
        const backup = await createDatabaseBackup();
        localStorage.setItem("waymark_audit_snapshot", JSON.stringify(backup));
      } catch {}
    }
    initData();
  }, [todayItems]);

  const handleLoadDemoData = async () => {
    await seedDemoData();
    await refreshData();
  };

  const refreshData = async () => {
    const [allRegs, shops] = await Promise.all([
      db.regions.orderBy("sort_order").toArray(),
      db.shops.filter((s) => !s.is_archived).toArray(),
    ]);
    setRegions(allRegs);
    setAllDbShops(shops);

    const todayDateStr = formatDateOnly(new Date());
    const deliveries = await db.deliveries.toArray();
    const completedToday = new Set(
      deliveries
        .filter((d) => d.delivered_at && d.delivered_at.startsWith(todayDateStr))
        .map((d) => d.shop_id)
    );
    setCompletedShopIds(completedToday);
  };

  // Route Name
  const activeRouteObj = useMemo(() => {
    if (selectedRouteId === "all") return null;
    return regions.find((r) => r.id === selectedRouteId) || null;
  }, [selectedRouteId, regions]);

  const activeRouteName = activeRouteObj ? activeRouteObj.name : "Fort Kochi";

  // Filter all shops by selected route and search query
  const shopsInCurrentRoute = useMemo(() => {
    let list = allDbShops;
    if (selectedRouteId !== "all") {
      list = list.filter((s) => s.region_id === selectedRouteId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.contact && s.contact.includes(q)) ||
          (s.notes && s.notes.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allDbShops, selectedRouteId, searchQuery]);

  // Map of TodayShopItems for fast enrichment
  const todayItemMap = useMemo(() => {
    const map = new Map<string, TodayShopItem>();
    for (const item of todayItems || []) {
      map.set(item.shop.id, item);
    }
    return map;
  }, [todayItems]);

  // Shop Counts per Route
  const routeShopCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const shop of allDbShops) {
      if (shop.region_id) {
        map.set(shop.region_id, (map.get(shop.region_id) || 0) + 1);
      }
    }
    return map;
  }, [allDbShops]);

  // Route-level Dues total
  const routeTotalDue = useMemo(() => {
    return shopsInCurrentRoute.reduce((sum, s) => sum + (s.balance_due || 0), 0);
  }, [shopsInCurrentRoute]);

  // Dynamic filter counts for status filter buttons in sidebar
  const filterCounts = useMemo(() => {
    const current = shopsInCurrentRoute;
    const dueCount = current.filter(
      (s) => !completedShopIds.has(s.id) && (todayItemMap.has(s.id) || s.is_urgent)
    ).length;
    const remindersCount = current.filter(
      (s) => Boolean((s as any).reminder_date || (s as any).reminder_note)
    ).length;
    const duesCount = current.filter((s) => (s.balance_due || 0) > 0).length;
    const completedCount = current.filter((s) => completedShopIds.has(s.id)).length;

    return {
      all: dueCount > 0 ? dueCount : current.length,
      reminders: remindersCount,
      dues: duesCount,
      completed: completedCount,
    };
  }, [shopsInCurrentRoute, todayItemMap, completedShopIds]);

  // Final display list matching the selected sub-filter and segment
  const displayList = useMemo(() => {
    let list = shopsInCurrentRoute;

    if (activeSubFilter === "reminders") {
      // 1. Scheduled Reminders: Show ALL stores with a reminder date or note
      list = list.filter(
        (s) => Boolean((s as any).reminder_date || (s as any).reminder_note)
      );
    } else if (activeSubFilter === "dues") {
      // 2. Pending Dues: Show ALL stores with outstanding khata balance > 0
      list = list.filter((s) => (s.balance_due || 0) > 0);
    } else if (activeSubFilter === "completed") {
      // 3. Completed Stops: Show stores completed today
      list = list.filter((s) => completedShopIds.has(s.id));
    } else {
      // 4. "Scheduled Today" (activeSubFilter === "all"):
      if (activeSegment === "due") {
        const dueOnly = list.filter(
          (s) => !completedShopIds.has(s.id) && (todayItemMap.has(s.id) || s.is_urgent)
        );
        list = dueOnly.length > 0 ? dueOnly : list.filter((s) => !completedShopIds.has(s.id));
      } else if (activeSegment === "completed") {
        list = list.filter((s) => completedShopIds.has(s.id));
      }
      // If activeSegment === "all", list remains all shops on beat
    }

    return list.map((s) => ({
      shop: s,
      todayItem: todayItemMap.get(s.id),
      isCompleted: completedShopIds.has(s.id),
    }));
  }, [shopsInCurrentRoute, activeSubFilter, activeSegment, completedShopIds, todayItemMap]);

  // Urgent count
  const urgentCount = useMemo(() => {
    return shopsInCurrentRoute.filter((s) => s.is_urgent).length;
  }, [shopsInCurrentRoute]);

  // Open Walk-to-Car Slip for a shop
  const handleSelectShopForLog = async (shop: LocalShop) => {
    const [spList, prodList] = await Promise.all([
      db.shop_products.where({ shop_id: shop.id }).toArray(),
      db.products.toArray(),
    ]);
    const prodMap = new Map(prodList.map((p) => [p.id, p]));
    const enriched = spList.map((sp) => ({
      shopProduct: sp,
      product: prodMap.get(sp.product_id),
    }));

    setSlipShop(shop);
    setSlipProducts(enriched);
  };

  // Next shop in sequence
  const nextShopInSequence = useMemo(() => {
    if (!slipShop) return null;
    const pending = displayList.filter((entry) => !entry.isCompleted);
    const currentIndex = pending.findIndex((entry) => entry.shop.id === slipShop.id);
    if (currentIndex >= 0 && currentIndex + 1 < pending.length) {
      return pending[currentIndex + 1].shop;
    }
    return null;
  }, [slipShop, displayList]);

  // Quick 1-tap Deliver action
  const handleQuickDeliver = async (item: TodayShopItem) => {
    try {
      const deliveries = item.dueProducts.map((p) => ({
        shopProductId: p.shopProduct.id,
        productId: p.shopProduct.product_id,
        qty: p.shopProduct.default_qty || 2,
      }));

      await markDelivered(item.shop.id, deliveries, "demo-supplier", {
        notes: "Quick delivered on foot",
      });

      setCompletedShopIds((prev) => new Set([...prev, item.shop.id]));
      refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Slip submission success
  const handleSlipSuccess = (completedShopId: string, nextId?: string) => {
    setCompletedShopIds((prev) => new Set([...prev, completedShopId]));
    refreshData();

    // Auto-advance to next shop if available
    if (nextId) {
      const nextShop = allDbShops.find((s) => s.id === nextId);
      if (nextShop) {
        handleSelectShopForLog(nextShop);
        return;
      }
    }
    setSlipShop(null);
  };

  return (
    <div className="min-h-screen bg-[#F4F5F8] dark:bg-[#0C0D12] text-zinc-950 dark:text-white flex flex-col font-sans selection:bg-[#D4F638] selection:text-[#0A0D02] transition-colors duration-200">
      {/* 1. CDNX Top Navigation Bar */}
      <CdnxTopNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === "today") {
            setActiveSubFilter("all");
            setActiveSegment("due");
          }
          if (tab === "all_shops") {
            setActiveSubFilter("all");
            setActiveSegment("all");
          }
        }}
        activeRouteName={activeRouteName}
        totalDue={routeTotalDue}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAddShop={() => setIsAddShopModalOpen(true)}
        urgentCount={urgentCount}
      />

      {/* 2. Main 3-Column CDNX Workspace Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Left Sidebar: Routes & Status Filters with live counts */}
        <CdnxRouteSidebar
          regions={regions}
          selectedRegionId={selectedRouteId}
          onSelectRegion={(id) => {
            setSelectedRouteId(id);
            setActiveSubFilter("all");
            setActiveSegment("due");
          }}
          routeShopCounts={routeShopCounts}
          activeSubFilter={activeSubFilter}
          onSubFilterChange={(filter) => {
            setActiveSubFilter(filter);
            if (filter === "completed") {
              setActiveSegment("completed");
            }
          }}
          totalShopsCount={allDbShops.length}
          filterCounts={filterCounts}
        />

        {/* Center Main Stage */}
        <main className="flex-1 p-4 md:p-6 min-w-0 max-w-3xl">
          {activeTab === "ledger" ? (
            <CdnxLedgerView
              shops={shopsInCurrentRoute}
              routeName={activeRouteName}
              onRefresh={refreshData}
              onSelectShopForLog={handleSelectShopForLog}
            />
          ) : (
            <CdnxCenterStage
              routeName={activeRouteName}
              displayList={displayList}
              allShopsInRoute={shopsInCurrentRoute}
              completedShopIds={completedShopIds}
              onSelectShopForLog={handleSelectShopForLog}
              onQuickDeliver={handleQuickDeliver}
              onOpenAddShop={() => setIsAddShopModalOpen(true)}
              onOpenLedger={() => setActiveTab("ledger")}
              selectedShopId={slipShop?.id}
              activeSegment={activeSegment}
              onSegmentChange={(seg) => {
                setActiveSegment(seg);
                setActiveSubFilter("all");
              }}
              activeSubFilter={activeSubFilter}
              onSubFilterChange={setActiveSubFilter}
              pendingDueCount={filterCounts.dues}
              totalDueAmount={routeTotalDue}
              remindersCount={filterCounts.reminders}
              onLoadDemoData={handleLoadDemoData}
            />
          )}
        </main>

        {/* Right Column: CDNX Walk-to-Car Shop Slip (Pinned on Desktop) */}
        <aside className="w-80 lg:w-96 hidden xl:block flex-shrink-0 h-[calc(100vh-4rem)] sticky top-16">
          {slipShop ? (
            <CdnxWalkToCarSlip
              shop={slipShop}
              shopProducts={slipProducts}
              routeName={activeRouteName}
              onClose={() => setSlipShop(null)}
              onSuccess={handleSlipSuccess}
              nextShopId={nextShopInSequence?.id}
              nextShopName={nextShopInSequence?.name}
            />
          ) : (
            <div className="h-full bg-white dark:bg-[#13141C] border-l border-black/[0.08] dark:border-white/[0.08] p-6 flex flex-col items-center justify-center text-center space-y-4 transition-colors">
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-[#181924] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-center text-zinc-500">
                <span className="text-2xl font-mono text-[#D4F638]">🚚</span>
              </div>
              <h4 className="text-base font-bold text-zinc-950 dark:text-white tracking-tight">
                Walk-to-Car Quick Logger
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
                Tap <span className="text-emerald-600 dark:text-[#D4F638] font-bold">"Log Visit &amp; Set Reminder"</span> on any store while walking back to your vehicle to record crates, dues, and scheduled reminders.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Mobile Slide-Up Drawer for Walk-to-Car Slip */}
      {slipShop && (
        <div className="xl:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="max-h-[90vh] h-full flex flex-col rounded-t-3xl overflow-hidden">
            <CdnxWalkToCarSlip
              shop={slipShop}
              shopProducts={slipProducts}
              routeName={activeRouteName}
              onClose={() => setSlipShop(null)}
              onSuccess={handleSlipSuccess}
              nextShopId={nextShopInSequence?.id}
              nextShopName={nextShopInSequence?.name}
            />
          </div>
        </div>
      )}

      {/* Quick Add Shop Modal */}
      <CdnxAddShopModal
        isOpen={isAddShopModalOpen}
        onClose={() => setIsAddShopModalOpen(false)}
        regions={regions}
        defaultRegionId={selectedRouteId !== "all" ? selectedRouteId : regions[0]?.id}
        onShopAdded={(newShop) => {
          refreshData();
          handleSelectShopForLog(newShop);
        }}
      />
    </div>
  );
}
