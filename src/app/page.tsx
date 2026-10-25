"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useTodayList } from "@/hooks/useTodayList";
import { VerticalRouteStop } from "@/components/today/VerticalRouteStop";
import { UrgentButton } from "@/components/today/UrgentButton";
import { db, LocalRegion, LocalShop, LocalShopProduct, LocalProduct } from "@/lib/db/dexie";
import { drainQueue } from "@/lib/db/sync";
import { formatDateOnly } from "@/lib/scheduling";
import {
  CloudOff,
  RefreshCw,
  AlertTriangle,
  IndianRupee,
  MapPin,
  CheckCircle2,
  Truck,
  Package,
  Layers,
  ArrowRight,
  Search,
  X,
  MessageSquare,
  FileCheck2,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LandingShowcase } from "@/components/landing/LandingShowcase";
import { VisitOutcomeModal } from "@/components/today/VisitOutcomeModal";
import { VisitOutcome } from "@/lib/actions/visitActions";
import { seedDemoData } from "@/lib/db/seedDemoData";

export default function RootOrTodayPage() {
  const { user, isLoading: authLoading } = useAuth();

  // If visitor is unauthenticated, render the full Landing Showcase right at root /
  if (!authLoading && !user) {
    return <LandingShowcase />;
  }

  return <TodayDispatchCockpit />;
}

function TodayDispatchCockpit() {
  const todayItems = useTodayList();
  const [regions, setRegions] = useState<LocalRegion[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>("all");
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [totalShopCount, setTotalShopCount] = useState<number | null>(null);
  const [completedShopIds, setCompletedShopIds] = useState<Set<string>>(new Set());

  // Search & Global Visit Outcome State
  const [searchQuery, setSearchQuery] = useState("");
  const [allDbShops, setAllDbShops] = useState<LocalShop[]>([]);
  const [selectedModalShop, setSelectedModalShop] = useState<LocalShop | null>(null);
  const [selectedShopProducts, setSelectedShopProducts] = useState<
    Array<{ shopProduct: LocalShopProduct; product?: LocalProduct }>
  >([]);

  useEffect(() => {
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);

    const handleOnline = () => {
      setIsOnline(true);
      drainQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    async function checkStats() {
      const [count, allRegs, shops] = await Promise.all([
        db.shops.count(),
        db.regions.orderBy("sort_order").toArray(),
        db.shops.filter((s) => !s.is_archived).toArray(),
      ]);
      setTotalShopCount(count);
      setRegions(allRegs);
      setAllDbShops(shops);
      setHasInitialized(true);
    }
    checkStats();

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
    const [count, allRegs] = await Promise.all([
      db.shops.count(),
      db.regions.orderBy("sort_order").toArray(),
    ]);
    setTotalShopCount(count);
    setRegions(allRegs);
  };

  const handleShopDelivered = (shopId: string) => {
    setCompletedShopIds((prev) => new Set([...prev, shopId]));
  };

  // Derive active uncompleted items
  const activeItems = useMemo(
    () => todayItems?.filter((i) => !completedShopIds.has(i.shop.id)) ?? [],
    [todayItems, completedShopIds]
  );

  // Group active items by route/region
  const routeCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of activeItems) {
      const rId = item.shop.region_id || "unassigned";
      map.set(rId, (map.get(rId) || 0) + 1);
    }
    return map;
  }, [activeItems]);

  // Filter items by selected route
  const filteredItems = useMemo(() => {
    if (selectedRouteId === "all") return activeItems;
    if (selectedRouteId === "unassigned") {
      return activeItems.filter((i) => !i.shop.region_id);
    }
    return activeItems.filter((i) => i.shop.region_id === selectedRouteId);
  }, [activeItems, selectedRouteId]);

  // Selected route metadata
  const activeRouteObj = useMemo(() => {
    if (selectedRouteId === "all" || selectedRouteId === "unassigned") return null;
    return regions.find((r) => r.id === selectedRouteId) || null;
  }, [selectedRouteId, regions]);

  // Search Results across all shops in DB
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allDbShops
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.contact && s.contact.includes(q)) ||
          (s.notes && s.notes.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [allDbShops, searchQuery]);

  const handleOpenVisitModal = async (shop: LocalShop) => {
    const [spList, prodList] = await Promise.all([
      db.shop_products.where({ shop_id: shop.id }).toArray(),
      db.products.toArray(),
    ]);
    const prodMap = new Map(prodList.map((p) => [p.id, p]));
    const enriched = spList.map((sp) => ({
      shopProduct: sp,
      product: prodMap.get(sp.product_id),
    }));
    setSelectedModalShop(shop);
    setSelectedShopProducts(enriched);
  };

  // Metrics for active view
  const urgentCount = filteredItems.filter((i) => i.isUrgent).length;
  const overdueCount = filteredItems.filter((i) => (i.daysOverdue ?? 0) > 0).length;
  const totalBalanceDue = filteredItems.reduce((acc, i) => acc + (i.shop.balance_due || 0), 0);
  const totalCrates = filteredItems.reduce((acc, i) => {
    return acc + i.dueProducts.reduce((sum, p) => sum + p.shopProduct.default_qty, 0);
  }, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      {/* Offline Status Bar */}
      {!isOnline && (
        <div className="mb-4 py-2.5 px-3.5 bg-[#1B1B20] border border-[#F59E0B]/30 rounded-2xl text-xs text-[#F59E0B] flex items-center justify-between shadow-sm">
          <span className="flex items-center gap-2 font-mono font-medium">
            <CloudOff size={15} className="text-[#F59E0B]" />
            Working offline. All restock and payment records buffer safely in IndexedDB.
          </span>
        </div>
      )}

      {/* Header section with Cadnex dark aesthetic */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#B5F23D]" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8C8C96]">
              Daily Dispatch Line · {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F4F6]">
              Today&apos;s Dispatch
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#131316] text-[#B5F23D] border border-white/[0.08] tabular-nums">
              {todayItems === undefined ? "..." : `${filteredItems.length} stops`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <UrgentButton />
          {isOnline && (
            <button
              type="button"
              onClick={handleManualSync}
              title="Sync now"
              className="p-2 text-[#8C8C96] hover:text-[#F4F4F6] rounded-xl hover:bg-[#1B1B20] border border-transparent hover:border-white/[0.08] transition-all"
            >
              <RefreshCw size={15} className={isSyncing ? "animate-spin text-[#B5F23D]" : ""} />
            </button>
          )}
        </div>
      </div>

      {/* ── GLOBAL SHOP SEARCH & VISIT LOG BAR ── */}
      <div className="relative mb-5 z-20">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search any shop in database to mark visit, log bill, or add note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#131316] border border-white/[0.08] text-xs font-mono text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#B5F23D] transition-colors shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown Panel */}
        {searchQuery.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#131316] border border-white/[0.1] rounded-2xl p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.9)] max-h-96 overflow-y-auto space-y-1 z-30">
            <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-mono text-zinc-400 border-b border-white/[0.04]">
              <span>Matching Shops in Database ({searchResults.length})</span>
              <span>Tap to log visit or mention update</span>
            </div>

            {searchResults.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500 font-mono">
                No shops matching &quot;{searchQuery}&quot; found in database.
                <div className="mt-2">
                  <Link
                    href={`/shops/new?name=${encodeURIComponent(searchQuery)}`}
                    className="text-xs font-bold text-[#B5F23D] hover:underline"
                  >
                    + Add New Shop &quot;{searchQuery}&quot; →
                  </Link>
                </div>
              </div>
            ) : (
              searchResults.map((shop) => {
                const reg = regions.find((r) => r.id === shop.region_id);
                return (
                  <div
                    key={shop.id}
                    className="p-2.5 rounded-xl bg-[#1B1B20]/60 hover:bg-[#1B1B20] border border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-zinc-100 truncate">{shop.name}</span>
                        {reg && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-zinc-400">
                            {reg.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400 mt-0.5">
                        {shop.contact && <span>Ph: {shop.contact}</span>}
                        <span>
                          Dues:{" "}
                          <strong className={shop.balance_due > 0 ? "text-[#FDA4AF]" : "text-[#4ADE80]"}>
                            ₹{(shop.balance_due || 0).toLocaleString("en-IN")}
                          </strong>
                        </span>
                        {shop.notes && <span className="truncate max-w-[200px]">· {shop.notes}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          handleOpenVisitModal(shop);
                          setSearchQuery("");
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-[#B5F23D] hover:bg-[#c4f84c] text-[#0C1004] text-xs font-mono font-bold transition-all flex items-center gap-1 shadow-xs"
                      >
                        <FileCheck2 size={13} />
                        <span>Log Visit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleOpenVisitModal(shop);
                          setSearchQuery("");
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-[#1B1B20] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.08] text-xs font-mono font-medium transition-colors flex items-center gap-1"
                      >
                        <MessageSquare size={13} />
                        <span>Update Note</span>
                      </button>

                      <Link
                        href={`/shops/${shop.id}`}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                        title="View Full Ledger"
                      >
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ── ROUTE SEGMENTED PILL SELECTOR (Cadnex Pill Design) ── */}
      {regions.length > 0 && activeItems.length > 0 && (
        <div className="mb-5 overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-2 min-w-max">
            <button
              type="button"
              onClick={() => setSelectedRouteId("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
                selectedRouteId === "all"
                  ? "bg-[#B5F23D] text-[#0C1004] shadow-sm"
                  : "bg-[#131316] text-[#8C8C96] hover:text-[#F4F4F6] border border-white/[0.08]"
              }`}
            >
              All Routes ({activeItems.length})
            </button>

            {regions.map((reg) => {
              const count = routeCounts.get(reg.id) || 0;
              const isSelected = selectedRouteId === reg.id;
              return (
                <button
                  key={reg.id}
                  type="button"
                  onClick={() => setSelectedRouteId(reg.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-[#B5F23D] text-[#0C1004] shadow-sm"
                      : "bg-[#131316] text-[#8C8C96] hover:text-[#F4F4F6] border border-white/[0.08]"
                  }`}
                >
                  <span>{reg.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${isSelected ? "bg-[#0C1004]/20 text-[#0C1004]" : "bg-white/[0.08] text-zinc-300"}`}>
                    {count}
                  </span>
                </button>
              );
            })}

            {(routeCounts.get("unassigned") || 0) > 0 && (
              <button
                type="button"
                onClick={() => setSelectedRouteId("unassigned")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
                  selectedRouteId === "unassigned"
                    ? "bg-[#B5F23D] text-[#0C1004] shadow-sm"
                    : "bg-[#131316] text-[#8C8C96] hover:text-[#F4F4F6] border border-white/[0.08]"
                }`}
              >
                Unassigned ({routeCounts.get("unassigned")})
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── ROUTE COCKPIT CARD (Cadnex 24px Elevated Surface) ── */}
      {filteredItems.length > 0 && (
        <div className="mb-6 bg-[#131316] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-lift">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/[0.06] gap-2">
            <div className="flex items-center gap-2">
              <Truck size={16} className="text-[#B5F23D]" />
              <span className="font-bold text-sm text-[#F4F4F6]">
                {activeRouteObj ? `Route: ${activeRouteObj.name}` : "Master Fleet Dispatch · All Sectors"}
              </span>
            </div>
            <div className="text-xs font-mono text-[#8C8C96]">
              LIFO Loading Sequence Active
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3.5 text-xs font-mono">
            <div className="bg-[#1B1B20] p-2.5 rounded-xl border border-white/[0.04]">
              <span className="text-zinc-400 text-xs block uppercase">Stops Remaining</span>
              <span className="text-sm font-bold text-[#F4F4F6] tabular-nums mt-0.5 block">
                {filteredItems.length} stores
              </span>
            </div>
            <div className="bg-[#1B1B20] p-2.5 rounded-xl border border-white/[0.04]">
              <span className="text-zinc-400 text-xs block uppercase">Total Crate Load</span>
              <span className="text-sm font-bold text-[#B5F23D] tabular-nums mt-0.5 block">
                {totalCrates} crates / cases
              </span>
            </div>
            <div className="bg-[#1B1B20] p-2.5 rounded-xl border border-white/[0.04]">
              <span className="text-zinc-400 text-xs block uppercase">Target Cash Dues</span>
              <span className="text-sm font-bold text-[#FDA4AF] tabular-nums mt-0.5 block">
                ₹{totalBalanceDue.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="bg-[#1B1B20] p-2.5 rounded-xl border border-white/[0.04]">
              <span className="text-zinc-400 text-xs block uppercase">Route Status</span>
              <span className="text-sm font-bold text-[#4ADE80] tabular-nums mt-0.5 block">
                {urgentCount > 0 ? `${urgentCount} Urgent` : "On Schedule"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Due route container */}
      <div>
        {todayItems === undefined || !hasInitialized ? (
          <div className="py-20 text-center text-xs text-[#8C8C96] bg-[#131316] border border-white/[0.08] rounded-2xl">
            <RefreshCw size={18} className="animate-spin text-[#B5F23D] mx-auto mb-2" />
            Computing restock intervals & route sequence...
          </div>
        ) : totalShopCount === 0 ? (
          /* First-Run Clean State */
          <div className="py-16 px-6 text-center max-w-md mx-auto bg-[#131316] border border-white/[0.08] rounded-2xl shadow-lift">
            <div className="w-12 h-12 rounded-2xl bg-[#B5F23D]/10 text-[#B5F23D] border border-[#B5F23D]/20 flex items-center justify-center mx-auto mb-3">
              <MapPin size={22} className="text-[#B5F23D]" />
            </div>
            <div className="text-xl font-bold text-[#F4F4F6]">
              Ready to start your rounds?
            </div>
            <div className="text-xs text-[#8C8C96] mt-2 leading-relaxed">
              Your account is clean with zero shops. Add your shops via rapid entry, paste an Excel sheet, or load sample data to build today&apos;s route.
            </div>
            <div className="mt-5 flex flex-col sm:flex-row justify-center gap-2.5">
              <Link
                href="/onboarding"
                className="px-5 py-2.5 text-xs font-bold bg-[#B5F23D] text-[#0C1004] rounded-xl hover:bg-[#A3DE30] transition-all shadow-sm"
              >
                Start Guided Setup →
              </Link>
              <Link
                href="/shops/new"
                className="px-4 py-2.5 text-xs font-semibold border border-white/[0.12] bg-[#1B1B20] text-[#F4F4F6] rounded-xl hover:bg-[#26262D]"
              >
                + Add Single Shop
              </Link>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={handleLoadDemoData}
                className="text-xs font-mono text-[#8C8C96] hover:text-[#B5F23D] underline decoration-dashed transition-colors"
              >
                Load 4 sample FMCG shops (for testing demo)
              </button>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 px-4 text-center bg-[#131316] border border-white/[0.08] rounded-2xl shadow-lift">
            <div className="w-12 h-12 rounded-full bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30 flex items-center justify-center mx-auto mb-3 font-bold text-lg">
              <CheckCircle2 size={24} />
            </div>
            <div className="text-lg font-bold text-[#F4F4F6]">
              All stops satisfied on this line
            </div>
            <div className="text-xs text-[#8C8C96] mt-1 max-w-xs mx-auto">
              All scheduled replenishment cycles are complete. Check all routes to review upcoming restock days.
            </div>
            <div className="mt-5 flex justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedRouteId("all")}
                className="px-4 py-2 text-xs font-mono font-bold bg-[#B5F23D] text-[#0C1004] rounded-xl hover:bg-[#A3DE30] transition-all shadow-sm"
              >
                View All Routes
              </button>
              <Link
                href="/shops/new"
                className="px-4 py-2 text-xs font-semibold border border-white/[0.1] bg-[#1B1B20] text-[#F4F4F6] rounded-xl hover:bg-[#26262D]"
              >
                + Add Shop
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredItems.map((item, index) => (
              <VerticalRouteStop
                key={item.shop.id}
                item={item}
                stopNumber={index + 1}
                isFirst={index === 0}
                isLast={index === filteredItems.length - 1}
                isNextUp={index === 0}
                onDelivered={handleShopDelivered}
              />
            ))}
          </div>
        )}
      </div>

      {/* Route footer quick navigation */}
      {filteredItems.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-xs font-mono text-[#8C8C96] px-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#B5F23D] inline-block" />
            First stop loaded at rear door (LIFO)
          </span>
          <Link href="/routes" className="text-[#F4F4F6] font-bold hover:text-[#B5F23D] flex items-center gap-1 transition-colors">
            <MapPin size={13} className="text-[#B5F23D]" /> View All Route Maps →
          </Link>
        </div>
      )}

      {/* Global Visit Outcome Modal */}
      {selectedModalShop && (
        <VisitOutcomeModal
          shop={selectedModalShop}
          shopProducts={selectedShopProducts}
          onClose={() => setSelectedModalShop(null)}
          onSuccess={() => {
            // Refresh shop list in local state
            db.shops.filter((s) => !s.is_archived).toArray().then(setAllDbShops);
          }}
        />
      )}
    </div>
  );
}
