"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useTodayList, TodayShopItem } from "@/hooks/useTodayList";
import { db, LocalRegion, LocalShop, LocalShopProduct, LocalProduct } from "@/lib/db/dexie";
import { drainQueue } from "@/lib/db/sync";
import { formatDateOnly } from "@/lib/scheduling";
import { markDelivered } from "@/lib/actions/markDelivered";
import { seedDemoData } from "@/lib/db/seedDemoData";
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

  // Initial Data Load & Auto-seed Fort Kochi
  useEffect(() => {
    async function initData() {
      const count = await db.shops.count();
      if (count === 0) {
        await seedDemoData();
      }
      const [allRegs, shops] = await Promise.all([
        db.regions.orderBy("sort_order").toArray(),
        db.shops.filter((s) => !s.is_archived).toArray(),
      ]);
      setRegions(allRegs);
      setAllDbShops(shops);

      // Default to Fort Kochi if present
      const fk = allRegs.find((r) => r.name.toLowerCase().includes("fort kochi") || r.id === "reg-fortkochi");
      if (fk) {
        setSelectedRouteId(fk.id);
      } else if (allRegs.length > 0) {
        setSelectedRouteId(allRegs[0].id);
      }
    }
    initData();
  }, [todayItems]);

  const refreshData = async () => {
    const [allRegs, shops] = await Promise.all([
      db.regions.orderBy("sort_order").toArray(),
      db.shops.filter((s) => !s.is_archived).toArray(),
    ]);
    setRegions(allRegs);
    setAllDbShops(shops);
  };

  // Route Name
  const activeRouteObj = useMemo(() => {
    if (selectedRouteId === "all") return null;
    return regions.find((r) => r.id === selectedRouteId) || null;
  }, [selectedRouteId, regions]);

  const activeRouteName = activeRouteObj ? activeRouteObj.name : "Fort Kochi";

  // Filter all shops by selected route
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

  // Today items filtered by selected route and sub-filter
  const filteredTodayItems = useMemo(() => {
    if (!todayItems) return [];
    let list = todayItems;

    // Filter by route
    if (selectedRouteId !== "all") {
      list = list.filter((i) => i.shop.region_id === selectedRouteId);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.shop.name.toLowerCase().includes(q) ||
          (i.shop.contact && i.shop.contact.includes(q)) ||
          (i.shop.notes && i.shop.notes.toLowerCase().includes(q))
      );
    }

    // Filter by sub-filter
    if (activeSubFilter === "reminders") {
      list = list.filter((i) => i.hasReminderToday);
    } else if (activeSubFilter === "completed") {
      list = list.filter((i) => completedShopIds.has(i.shop.id));
    } else if (activeSubFilter === "dues") {
      list = list.filter((i) => (i.shop.balance_due || 0) > 0);
    }

    return list;
  }, [todayItems, selectedRouteId, searchQuery, activeSubFilter, completedShopIds]);

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

  // Urgent count
  const urgentCount = useMemo(() => {
    return filteredTodayItems.filter((i) => i.isUrgent).length;
  }, [filteredTodayItems]);

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
    const pending = filteredTodayItems.filter((i) => !completedShopIds.has(i.shop.id));
    const currentIndex = pending.findIndex((i) => i.shop.id === slipShop.id);
    if (currentIndex >= 0 && currentIndex + 1 < pending.length) {
      return pending[currentIndex + 1].shop;
    }
    return null;
  }, [slipShop, filteredTodayItems, completedShopIds]);

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
    <div className="min-h-screen bg-[#0C0D12] text-white flex flex-col font-sans selection:bg-[#D4F638] selection:text-[#0A0D02]">
      {/* 1. CDNX Top Navigation Bar */}
      <CdnxTopNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === "today") setActiveSegment("due");
          if (tab === "all_shops") setActiveSegment("all");
        }}
        activeRouteName={activeRouteName}
        totalDue={routeTotalDue}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAddShop={() => setIsAddShopModalOpen(true)}
        urgentCount={urgentCount}
      />

      {/* 2. Main 3-Column CDNX Workspace Layout (Matching Images 1 & 2) */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Left Sidebar: Routes & Corridor list with counts */}
        <CdnxRouteSidebar
          regions={regions}
          selectedRegionId={selectedRouteId}
          onSelectRegion={(id) => {
            setSelectedRouteId(id);
            setActiveSubFilter("all");
          }}
          routeShopCounts={routeShopCounts}
          activeSubFilter={activeSubFilter}
          onSubFilterChange={setActiveSubFilter}
          totalShopsCount={allDbShops.length}
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
              shopsDue={filteredTodayItems}
              allShopsInRoute={shopsInCurrentRoute}
              completedShopIds={completedShopIds}
              onSelectShopForLog={handleSelectShopForLog}
              onQuickDeliver={handleQuickDeliver}
              onOpenAddShop={() => setIsAddShopModalOpen(true)}
              onOpenLedger={() => setActiveTab("ledger")}
              selectedShopId={slipShop?.id}
              activeSegment={activeSegment}
              onSegmentChange={setActiveSegment}
              onFilterRemindersOnly={() => setActiveSubFilter("reminders")}
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
            <div className="h-full bg-[#13141C] border-l border-white/[0.08] p-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#181924] border border-white/[0.06] flex items-center justify-center text-zinc-500">
                <span className="text-2xl font-mono text-[#D4F638]">🚚</span>
              </div>
              <h4 className="text-base font-bold text-white tracking-tight">
                Walk-to-Car Quick Logger
              </h4>
              <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                Tap <span className="text-[#D4F638] font-bold">"Log Visit &amp; Set Reminder"</span> on any store while walking back to your vehicle to record crates, dues, and scheduled reminders.
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
