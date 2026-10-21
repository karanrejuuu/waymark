"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ChevronRight, Plus } from "lucide-react";
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

      // Index deliveries by shop_id to get latest delivery date
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
          .filter((s) => s.region_id === r.id)
          .map((s) => browseItemsByShop.get(s.id)!)
          .filter(Boolean);

        regionGroups.push({
          region: r,
          shops: shopsInRegion,
        });
        expState[r.id] = true;
      }

      const unassigned = allShops
        .filter((s) => !s.region_id)
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

  // Filter groups and shops
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header and Add Shop shortcut */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-text-primary">
            Routes
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Browse all shops by route or search directly.
          </p>
        </div>
        <Link
          href="/shops/new"
          className="text-xs font-medium text-accent hover:underline inline-flex items-center gap-1 py-1"
        >
          <Plus size={14} />
          <span>Add shop</span>
        </Link>
      </div>

      {/* Pinned search input */}
      <div className="relative mb-5">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
          <Search size={15} />
        </div>
        <input
          type="text"
          placeholder="Search by shop name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs pl-9 pr-4 py-2 border border-border rounded-lg bg-bg focus:outline-none focus:border-accent placeholder:text-text-tertiary"
        />
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-text-tertiary">
          Loading routes...
        </div>
      ) : filteredGroups.length === 0 && filteredUnassigned.length === 0 ? (
        <div className="py-12 text-center text-xs text-text-tertiary border border-border rounded-lg">
          No shops match &quot;{search}&quot;
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map(({ region, shops }) => {
            const isExp = expanded[region.id] ?? true;

            return (
              <div
                key={region.id}
                className="border border-border rounded-lg bg-bg overflow-hidden"
              >
                {/* Region toggle header */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleRegion(region.id)}
                  className="py-2.5 px-3 flex items-center justify-between hover:bg-bg-subtle cursor-pointer select-none bg-bg"
                >
                  <div className="flex items-center gap-2">
                    <ChevronRight
                      size={15}
                      className={`text-text-tertiary transition-transform duration-150 ${
                        isExp ? "rotate-90 text-text-primary" : ""
                      }`}
                    />
                    <span className="font-semibold text-sm text-text-primary">
                      {region.name}
                    </span>
                  </div>
                  <span className="text-xs text-text-tertiary">
                    {shops.length} {shops.length === 1 ? "shop" : "shops"}
                  </span>
                </div>

                {/* Shop list */}
                {isExp && (
                  <div className="border-t border-border divide-y divide-border">
                    {shops.length === 0 ? (
                      <div className="py-3 text-center text-xs text-text-tertiary">
                        No shops found in this route.
                      </div>
                    ) : (
                      shops.map(({ shop, lastDeliveredStr, statusVariant, statusLabel }) => (
                        <Link
                          key={shop.id}
                          href={`/shops/${shop.id}`}
                          className="py-2.5 px-3 flex items-center justify-between hover:bg-bg-subtle/70 transition-colors text-xs"
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                            <StatusDot variant={statusVariant} label={statusLabel} />
                            <span className="font-medium text-text-primary truncate">
                              {shop.name}
                            </span>
                          </div>

                          <div className="text-text-tertiary text-right text-[11px] flex-shrink-0">
                            {lastDeliveredStr ? `Delivered ${lastDeliveredStr}` : "Never delivered"}
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Unassigned section if any */}
          {filteredUnassigned.length > 0 && (
            <div className="border border-border rounded-lg bg-bg overflow-hidden">
              <div className="py-2.5 px-3 font-semibold text-sm text-text-secondary border-b border-border bg-bg-subtle/30">
                Unassigned Shops ({filteredUnassigned.length})
              </div>
              <div className="divide-y divide-border">
                {filteredUnassigned.map(({ shop, lastDeliveredStr, statusVariant, statusLabel }) => (
                  <Link
                    key={shop.id}
                    href={`/shops/${shop.id}`}
                    className="py-2.5 px-3 flex items-center justify-between hover:bg-bg-subtle/70 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                      <StatusDot variant={statusVariant} label={statusLabel} />
                      <span className="font-medium text-text-primary truncate">
                        {shop.name}
                      </span>
                    </div>
                    <div className="text-text-tertiary text-right text-[11px] flex-shrink-0">
                      {lastDeliveredStr ? `Delivered ${lastDeliveredStr}` : "Never delivered"}
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
