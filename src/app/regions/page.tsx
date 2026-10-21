"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, GripVertical, Plus, ChevronRight } from "lucide-react";
import { db, LocalRegion, LocalShop } from "@/lib/db/dexie";
import { saveRegion, reorderShops } from "@/lib/actions/regionActions";

export default function RegionsPage() {
  const [regions, setRegions] = useState<LocalRegion[]>([]);
  const [shopsByRegion, setShopsByRegion] = useState<Map<string, LocalShop[]>>(new Map());
  const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>({});
  const [newRegionName, setNewRegionName] = useState("");
  const [isAddingRegion, setIsAddingRegion] = useState(false);

  // Drag and drop state
  const [draggedShopId, setDraggedShopId] = useState<string | null>(null);
  const [draggedRegionId, setDraggedRegionId] = useState<string | null>(null);

  const loadData = async () => {
    const [allRegs, allShops] = await Promise.all([
      db.regions.orderBy("sort_order").toArray(),
      db.shops.orderBy("sort_order").toArray(),
    ]);

    setRegions(allRegs);

    const map = new Map<string, LocalShop[]>();
    for (const r of allRegs) {
      map.set(r.id, []);
    }
    map.set("unassigned", []);

    for (const s of allShops) {
      const regId = s.region_id || "unassigned";
      const list = map.get(regId) || [];
      list.push(s);
      map.set(regId, list);
    }

    setShopsByRegion(map);

    // Expand all by default
    const expanded: Record<string, boolean> = {};
    allRegs.forEach((r) => (expanded[r.id] = true));
    setExpandedRegions(expanded);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRegionName.trim()) return;

    await saveRegion(newRegionName.trim());
    setNewRegionName("");
    setIsAddingRegion(false);
    loadData();
  };

  const toggleRegion = (id: string) => {
    setExpandedRegions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Drag-and-drop reordering within a region
  const handleDragStart = (e: React.DragEvent, shopId: string, regionId: string) => {
    setDraggedShopId(shopId);
    setDraggedRegionId(regionId);
    e.dataTransfer.setData("text/plain", shopId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetShopId: string, targetRegionId: string) => {
    e.preventDefault();
    if (!draggedShopId || draggedShopId === targetShopId || draggedRegionId !== targetRegionId) {
      return;
    }

    const currentShops = shopsByRegion.get(targetRegionId) || [];
    const fromIndex = currentShops.findIndex((s) => s.id === draggedShopId);
    const toIndex = currentShops.findIndex((s) => s.id === targetShopId);

    if (fromIndex < 0 || toIndex < 0) return;

    const newOrder = [...currentShops];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);

    // Persist new order
    await reorderShops(targetRegionId, newOrder.map((s) => s.id));
    setDraggedShopId(null);
    setDraggedRegionId(null);
    loadData();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Link
          href="/"
          className="text-xs text-text-secondary hover:text-text-primary inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft size={14} />
          <span>Back to Today</span>
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-text-primary">
          Regions & Routes
        </h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Organize delivery routes and drag shops to set visitation sequence.
        </p>
      </div>

      <div className="space-y-4">
        {regions.map((reg) => {
          const isExpanded = expandedRegions[reg.id] ?? true;
          const shops = shopsByRegion.get(reg.id) || [];

          return (
            <div key={reg.id} className="border border-border rounded-lg bg-bg overflow-hidden">
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleRegion(reg.id)}
                className="py-2.5 px-3 flex items-center justify-between hover:bg-bg-subtle cursor-pointer select-none bg-bg"
              >
                <div className="flex items-center gap-2">
                  <ChevronRight
                    size={15}
                    className={`text-text-tertiary transition-transform duration-150 ${
                      isExpanded ? "rotate-90 text-text-primary" : ""
                    }`}
                  />
                  <span className="font-semibold text-sm text-text-primary">
                    {reg.name}
                  </span>
                </div>
                <span className="text-xs text-text-tertiary">
                  {shops.length} {shops.length === 1 ? "shop" : "shops"}
                </span>
              </div>

              {isExpanded && (
                <div className="border-t border-border divide-y divide-border bg-bg-subtle/20">
                  {shops.length === 0 ? (
                    <div className="py-4 text-center text-xs text-text-tertiary">
                      No shops in this region yet.
                    </div>
                  ) : (
                    shops.map((shop) => (
                      <div
                        key={shop.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, shop.id, reg.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, shop.id, reg.id)}
                        className={`py-2 px-3 flex items-center justify-between hover:bg-bg-subtle/60 text-xs transition-colors cursor-grab active:cursor-grabbing ${
                          draggedShopId === shop.id ? "opacity-40" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <GripVertical size={14} className="text-text-tertiary flex-shrink-0" />
                          <Link
                            href={`/shops/${shop.id}`}
                            className="font-medium text-text-primary hover:underline truncate"
                          >
                            {shop.name}
                          </Link>
                        </div>
                        {shop.contact && (
                          <span className="text-[11px] text-text-tertiary">
                            {shop.contact}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Add new region pattern (Notion-style "+ New page" text button) */}
        {!isAddingRegion ? (
          <button
            type="button"
            onClick={() => setIsAddingRegion(true)}
            className="text-xs text-text-secondary hover:text-text-primary font-medium py-1.5 px-2 rounded hover:bg-bg-subtle inline-flex items-center gap-1 transition-colors"
          >
            <Plus size={14} />
            <span>New region</span>
          </button>
        ) : (
          <form onSubmit={handleCreateRegion} className="flex items-center gap-2 mt-2">
            <input
              type="text"
              autoFocus
              placeholder="Region name (e.g. West Market)..."
              value={newRegionName}
              onChange={(e) => setNewRegionName(e.target.value)}
              className="text-xs px-3 py-1.5 border border-border rounded bg-bg focus:outline-none focus:border-accent flex-1"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-accent text-white text-xs font-medium rounded hover:opacity-90"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsAddingRegion(false)}
              className="px-2.5 py-1.5 text-xs text-text-secondary hover:text-text-primary rounded"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
