"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ChevronRight, Plus, Truck, MapPin, CheckCircle2, ArrowRight } from "lucide-react";
import { db, LocalRegion, LocalShop, LocalShopProduct, LocalDelivery } from "@/lib/db/dexie";
import { StatusDot, StatusDotVariant } from "@/components/ui/StatusDot";
import { isDueToday, isEscalated } from "@/lib/scheduling";

interface ShopBrowseItem {
  shop: LocalShop;
  lastDeliveredStr: string | null;
  statusVariant: StatusDotVariant;
  statusLabel?: string;
}

interface RegionBrowseGroup {
  region: LocalRegion;
  shops: ShopBrowseItem[];
  dueCount: number;
}

export default function RoutesPage() {
  const [search, setSearch] = useState("");
  const [groups, setGroups] = useState<RegionBrowseGroup[]>([]);
  const [unassignedShops, setUnassignedShops] = useState<ShopBrowseItem[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBrowseData() {
      const [allRegions, allShops, allShopProducts, allDeliveries] = await Promise.all([
        db.regions.orderBy("sort_order").toArray(),
        db.shops.orderBy("sort_order").toArray(),
        db.shop_products.toArray(),
        db.deliveries.toArray(),
      ]);

      const now = new Date();

      // Index deliveries by shop_id
      const latestDeliveryByShop = new Map<string, Date>();
      for (const del of allDeliveries) {
        const dDate = new Date(del.delivered_at);
        const existing = latestDeliveryByShop.get(del.shop_id);
        if (!existing || dDate.getTime() > existing.getTime()) {
          latestDeliveryByShop.set(del.shop_id, dDate);
        }
      }

      // Group shop_products by shop_id
      const spByShop = new Map<string, LocalShopProduct[]>();
      for (const sp of allShopProducts) {
        const list = spByShop.get(sp.shop_id) || [];
        list.push(sp);
        spByShop.set(sp.shop_id, list);
      }

      // Build browse items
      const browseItemsByShop = new Map<string, ShopBrowseItem>();

      for (const shop of allShops) {
        if (shop.is_archived) continue;

        const lastDel = latestDeliveryByShop.get(shop.id);
        let lastDelStr: string | null = null;
        if (lastDel) {
          const diffDays = Math.floor((now.getTime() - lastDel.getTime()) / 86400000);
          lastDelStr = diffDays === 0 ? "Today" : `${diffDays}d ago`;
        }

        const sps = spByShop.get(shop.id) || [];
        const isUrgent = shop.is_urgent;
        const isOverdue = sps.some((sp) => isEscalated(sp.next_due_date));
        const isDue = sps.some((sp) => isDueToday(sp.next_due_date));

        let statusVariant: StatusDotVariant = "neutral";
        let statusLabel: string | undefined = undefined;

        if (isUrgent) {
          statusVariant = "urgent";
          statusLabel = "Urgent";
        } else if (isOverdue) {
          statusVariant = "escalated";
          statusLabel = "Overdue";
        } else if (isDue) {
          statusVariant = "fine";
          statusLabel = "Due";
        }

        browseItemsByShop.set(shop.id, {
          shop,
          lastDeliveredStr: lastDelStr,
          statusVariant,
          statusLabel,
        });
      }

      // Group by region
      const regionGroups: RegionBrowseGroup[] = [];
      const expState: Record<string, boolean> = {};

      for (const r of allRegions) {
        const shopsInRegion = allShops
          .filter((s) => s.region_id === r.id && !s.is_archived)
          .map((s) => browseItemsByShop.get(s.id)!)
          .filter(Boolean);

        const dueCount = shopsInRegion.filter(
          (s) => s.statusVariant === "urgent" || s.statusVariant === "escalated" || s.statusVariant === "fine"
        ).length;

        regionGroups.push({
          region: r,
          shops: shopsInRegion,
          dueCount,
        });
        expState[r.id] = true;
      }

      const unassigned = allShops
        .filter((s) => !s.region_id && !s.is_archived)
        .map((s) => browseItemsByShop.get(s.id)!)
        .filter(Boolean);

      setGroups(regionGroups);
      setUnassignedShops(unassigned);
      setExpanded(expState);
      setLoading(false);
    }

    loadBrowseData();
  }, []);

  const toggleRegion = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const query = search.toLowerCase().trim();

  const filteredGroups = groups
    .map((g) => ({
      ...g,
      shops: g.shops.filter(
        (item) =>
          !query ||
          item.shop.name.toLowerCase().includes(query) ||
          g.region.name.toLowerCase().includes(query)
      ),
    }))
    .filter((g) => !query || g.shops.length > 0);

  const filteredUnassigned = unassignedShops.filter(
    (item) => !query || item.shop.name.toLowerCase().includes(query)
  );

  const totalShops = groups.reduce((acc, g) => acc + g.shops.length, 0) + unassignedShops.length;
  const totalDueAcrossRoutes = groups.reduce((acc, g) => acc + g.dueCount, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      {/* Header and Add Shop shortcut */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#94A3B8]">
              Fleet Route Logistics & Territory Sectors
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC]">
            Routes & Sectors
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/regions"
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-[#111827] text-[#94A3B8] hover:text-[#F8FAFC] border border-white/[0.08] transition-all"
          >
            Manage Sectors
          </Link>
          <Link
            href="/shops/new"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2563EB] text-white hover:bg-[#1D4ED8] inline-flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <Plus size={15} />
            <span>Add Store</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-3 gap-3 mb-5 font-mono text-xs">
        <div className="bg-[#111827] border border-white/[0.08] p-3 rounded-2xl shadow-lift">
          <span className="text-[10px] text-[#94A3B8] uppercase block">Active Routes</span>
          <span className="text-lg font-bold text-[#F8FAFC] tabular-nums mt-0.5 block">
            {groups.length} sectors
          </span>
        </div>
        <div className="bg-[#111827] border border-white/[0.08] p-3 rounded-2xl shadow-lift">
          <span className="text-[10px] text-[#94A3B8] uppercase block">Total Kiranas</span>
          <span className="text-lg font-bold text-[#F8FAFC] tabular-nums mt-0.5 block">
            {totalShops} stores
          </span>
        </div>
        <div className="bg-[#111827] border border-white/[0.08] p-3 rounded-2xl shadow-lift">
          <span className="text-[10px] text-[#94A3B8] uppercase block">Due Dispatch</span>
          <span className="text-lg font-bold text-[#3B82F6] tabular-nums mt-0.5 block">
            {totalDueAcrossRoutes} due today
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-5">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
          <Search size={15} />
        </div>
        <input
          type="text"
          placeholder="Search by store name, road, or sector..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs pl-10 pr-4 py-2.5 border border-white/[0.08] rounded-xl bg-[#111827] text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB] shadow-sm"
        />
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-[#94A3B8] bg-[#111827] border border-white/[0.08] rounded-2xl font-mono">
          Loading fleet routes...
        </div>
      ) : filteredGroups.length === 0 && filteredUnassigned.length === 0 ? (
        <div className="py-16 text-center text-xs text-[#94A3B8] border border-white/[0.08] rounded-2xl bg-[#111827]">
          No stores match &quot;{search}&quot;
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map(({ region, shops, dueCount }) => {
            const isExp = expanded[region.id] ?? true;

            return (
              <div
                key={region.id}
                className="bg-[#111827] border border-white/[0.08] rounded-2xl shadow-lift overflow-hidden"
              >
                {/* Route Header */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] bg-[#16161B]">
                  <div
                    onClick={() => toggleRegion(region.id)}
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                  >
                    <button
                      type="button"
                      className="p-1 text-[#94A3B8] hover:text-[#F8FAFC]"
                    >
                      <ChevronRight
                        size={16}
                        className={`transform transition-transform ${isExp ? "rotate-90" : ""}`}
                      />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#F8FAFC]">
                          {region.name}
                        </span>
                        {dueCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#2563EB]/15 text-[#3B82F6] border border-[#3B82F6]/35 tabular-nums">
                            {dueCount} Due Today
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-[#94A3B8] mt-0.5">
                        {shops.length} {shops.length === 1 ? "store" : "stores"} on this line
                      </div>
                    </div>
                  </div>

                  {/* Dispatch This Route Action */}
                  <div className="flex items-center gap-2">
                    <Link
                      href="/"
                      className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#2563EB] text-white hover:bg-[#1D4ED8] inline-flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Truck size={13} />
                      <span>Dispatch Today</span>
                    </Link>
                  </div>
                </div>

                {/* Collapsible Shops List */}
                {isExp && (
                  <div className="divide-y divide-white/[0.04]">
                    {shops.length === 0 ? (
                      <div className="py-6 text-center text-xs text-[#94A3B8] font-mono">
                        No stores assigned to this sector yet.
                      </div>
                    ) : (
                      shops.map(({ shop, lastDeliveredStr, statusVariant, statusLabel }) => (
                        <Link
                          key={shop.id}
                          href={`/shops/${shop.id}`}
                          className="p-3.5 sm:px-5 flex items-center justify-between hover:bg-[#1E293B]/60 transition-colors text-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <StatusDot variant={statusVariant} size="sm" />
                            <div className="truncate">
                              <span className="font-bold text-[#F8FAFC] truncate block">
                                {shop.name}
                              </span>
                              <span className="text-[11px] font-mono text-[#94A3B8]">
                                Last restock: {lastDeliveredStr || "Never"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 font-mono text-[11px]">
                            {statusLabel && (
                              <span
                                className={`px-2 py-0.5 rounded font-bold ${
                                  statusVariant === "urgent"
                                    ? "bg-[#F43F5E]/20 text-[#F43F5E]"
                                    : statusVariant === "escalated"
                                    ? "bg-[#F59E0B]/20 text-[#F59E0B]"
                                    : "bg-[#2563EB]/20 text-[#3B82F6]"
                                }`}
                              >
                                {statusLabel}
                              </span>
                            )}
                            <ChevronRight size={14} className="text-[#64748B]" />
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Unassigned Stores */}
          {filteredUnassigned.length > 0 && (
            <div className="bg-[#111827] border border-white/[0.08] rounded-2xl shadow-lift overflow-hidden">
              <div className="p-4 bg-[#16161B] border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-[#F8FAFC]">
                    Unassigned Stores ({filteredUnassigned.length})
                  </div>
                  <div className="text-[11px] font-mono text-[#94A3B8] mt-0.5">
                    Stores awaiting route or territory allocation
                  </div>
                </div>
              </div>

              <div className="divide-y divide-white/[0.04]">
                {filteredUnassigned.map(({ shop, lastDeliveredStr, statusVariant, statusLabel }) => (
                  <Link
                    key={shop.id}
                    href={`/shops/${shop.id}`}
                    className="p-3.5 sm:px-5 flex items-center justify-between hover:bg-[#1E293B]/60 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <StatusDot variant={statusVariant} size="sm" />
                      <div className="truncate">
                        <span className="font-bold text-[#F8FAFC] truncate block">
                          {shop.name}
                        </span>
                        <span className="text-[11px] font-mono text-[#94A3B8]">
                          Last restock: {lastDeliveredStr || "Never"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 font-mono text-[11px]">
                      {statusLabel && (
                        <span className="px-2 py-0.5 rounded font-bold bg-white/[0.06] text-[#94A3B8]">
                          {statusLabel}
                        </span>
                      )}
                      <ChevronRight size={14} className="text-[#64748B]" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
