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
      <div className="mb-5">
        <Link
          href="/"
          className="text-xs font-semibold text-[#475569] hover:text-[#0F172A] inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft size={14} />
          <span>Back to Today's Route</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] font-heading">
          Manage Route Sectors
        </h1>
        <p className="text-xs text-[#475569] mt-1 font-medium">
          Organize delivery routes, assign driver sectors, and drag shops to set visitation sequence.
        </p>
      </div>

      <div className="space-y-4">
        {regions.map((reg) => {
          const isExpanded = expandedRegions[reg.id] ?? true;
          const shops = shopsByRegion.get(reg.id) || [];

          return (
            <div key={reg.id} className="border border-[#CBD5E1] rounded-2xl bg-white overflow-hidden shadow-xs">
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleRegion(reg.id)}
                className="py-3 px-4 flex items-center justify-between hover:bg-[#FAF8F5] cursor-pointer select-none bg-white transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ChevronRight
                    size={16}
                    className={`text-[#64748B] transition-transform duration-150 ${
                      isExpanded ? "rotate-90 text-[#0F172A]" : ""
                    }`}
                  />
                  <span className="font-heading font-extrabold text-sm sm:text-base text-[#0F172A]">
                    {reg.name}
                  </span>
                </div>
                <span className="text-xs font-bold text-[#92400E] px-2.5 py-0.5 rounded-full bg-[#FEF3C7] border border-[#FDE68A]">
                  {shops.length} {shops.length === 1 ? "shop" : "shops"}
                </span>
              </div>

              {isExpanded && (
                <div className="border-t border-[#E2E8F0] divide-y divide-[#E2E8F0] bg-white">
                  {shops.length === 0 ? (
                    <div className="py-4 text-center text-xs text-[#64748B]">
                      No shops in this sector yet.
                    </div>
                  ) : (
                    shops.map((shop) => (
                      <div
                        key={shop.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, shop.id, reg.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, shop.id, reg.id)}
                        className={`py-2.5 px-4 flex items-center justify-between hover:bg-[#F8FAFC] text-xs transition-colors cursor-grab active:cursor-grabbing ${
                          draggedShopId === shop.id ? "opacity-40" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <GripVertical size={14} className="text-[#94A3B8] flex-shrink-0" />
                          <Link
                            href={`/shops/${shop.id}`}
                            className="font-bold text-[#0F172A] hover:underline truncate"
                          >
                            {shop.name}
                          </Link>
                        </div>
                        {shop.contact && (
                          <span className="text-xs text-[#475569] font-medium">
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

        {/* Add new region pattern */}
        {!isAddingRegion ? (
          <button
            type="button"
            onClick={() => setIsAddingRegion(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F172A] text-white hover:bg-[#92400E] inline-flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Plus size={15} />
            <span>New Route Sector</span>
          </button>
        ) : (
          <form onSubmit={handleCreateRegion} className="flex items-center gap-2 mt-2 bg-white p-3 border border-[#CBD5E1] rounded-2xl shadow-xs">
            <input
              type="text"
              autoFocus
              placeholder="Sector name (e.g. Sector 4 North Bazaar)..."
              value={newRegionName}
              onChange={(e) => setNewRegionName(e.target.value)}
              className="text-xs px-3.5 py-2 border border-[#CBD5E1] rounded-xl bg-[#FAF8F5] text-[#0F172A] font-medium focus:outline-none focus:border-[#92400E] flex-1"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#92400E] hover:bg-[#78350F] text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Add Sector
            </button>
            <button
              type="button"
              onClick={() => setIsAddingRegion(false)}
              className="px-3 py-2 text-xs font-semibold text-[#475569] hover:text-[#0F172A] rounded-xl"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
