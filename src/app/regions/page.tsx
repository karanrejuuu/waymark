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
      if (s.is_archived) continue;
      const regId = s.region_id || "unassigned";
      const list = map.get(regId) || [];
      list.push(s);
      map.set(regId, list);
    }

    setShopsByRegion(map);

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

    await reorderShops(targetRegionId, newOrder.map((s) => s.id));
    setDraggedShopId(null);
    setDraggedRegionId(null);
    loadData();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6">
        <Link
          href="/"
          className="text-xs font-mono text-[#94A3B8] hover:text-[#F8FAFC] inline-flex items-center gap-1 mb-2 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Today&apos;s Dispatch</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC]">
          Manage Route Sectors
        </h1>
        <p className="text-xs text-[#94A3B8] mt-1 font-mono">
          Organize delivery routes, assign driver sectors, and drag shops to adjust LIFO visitation sequence.
        </p>
      </div>

      <div className="space-y-4">
        {regions.map((reg) => {
          const isExpanded = expandedRegions[reg.id] ?? true;
          const shops = shopsByRegion.get(reg.id) || [];

          return (
            <div key={reg.id} className="border border-white/[0.08] rounded-2xl bg-[#111827] overflow-hidden shadow-lift">
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleRegion(reg.id)}
                className="py-3 px-4 flex items-center justify-between hover:bg-[#1E293B]/60 cursor-pointer select-none bg-[#16161B] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ChevronRight
                    size={16}
                    className={`text-[#94A3B8] transition-transform duration-150 ${
                      isExpanded ? "rotate-90 text-[#F8FAFC]" : ""
                    }`}
                  />
                  <span className="font-bold text-sm text-[#F8FAFC]">
                    {reg.name}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-[#3B82F6] px-2.5 py-0.5 rounded-full bg-[#2563EB]/15 border border-[#3B82F6]/30 tabular-nums">
                  {shops.length} {shops.length === 1 ? "store" : "stores"}
                </span>
              </div>

              {isExpanded && (
                <div className="border-t border-white/[0.04] divide-y divide-white/[0.04] bg-[#111827]">
                  {shops.length === 0 ? (
                    <div className="py-5 text-center text-xs text-[#94A3B8] font-mono">
                      No stores assigned to this sector yet.
                    </div>
                  ) : (
                    shops.map((shop) => (
                      <div
                        key={shop.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, shop.id, reg.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, shop.id, reg.id)}
                        className={`py-2.5 px-4 flex items-center justify-between hover:bg-[#1E293B] text-xs transition-colors cursor-grab active:cursor-grabbing ${
                          draggedShopId === shop.id ? "opacity-30" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <GripVertical size={14} className="text-[#64748B] flex-shrink-0" />
                          <Link
                            href={`/shops/${shop.id}`}
                            className="font-bold text-[#F8FAFC] hover:text-[#3B82F6] truncate transition-colors"
                          >
                            {shop.name}
                          </Link>
                        </div>
                        {shop.contact && (
                          <span className="text-[11px] font-mono text-[#94A3B8]">
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

        {/* Add new sector */}
        {!isAddingRegion ? (
          <button
            type="button"
            onClick={() => setIsAddingRegion(true)}
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#2563EB] text-white hover:bg-[#1D4ED8] inline-flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <Plus size={15} />
            <span>New Route Sector</span>
          </button>
        ) : (
          <form onSubmit={handleCreateRegion} className="flex items-center gap-2 mt-2 bg-[#111827] p-3 border border-white/[0.08] rounded-2xl shadow-lift">
            <input
              type="text"
              autoFocus
              placeholder="Sector name (e.g. Sector 4 North Bazaar)..."
              value={newRegionName}
              onChange={(e) => setNewRegionName(e.target.value)}
              className="text-xs px-3.5 py-2 border border-white/[0.12] rounded-xl bg-[#1E293B] text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB] flex-1 font-medium"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-mono font-bold rounded-xl shadow-sm"
            >
              Add Sector
            </button>
            <button
              type="button"
              onClick={() => setIsAddingRegion(false)}
              className="px-3 py-2 text-xs font-mono font-semibold text-[#94A3B8] hover:text-[#F8FAFC] rounded-xl"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
