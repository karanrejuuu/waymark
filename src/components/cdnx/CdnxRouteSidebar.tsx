"use client";

import React, { useState } from "react";
import {
  MapPin,
  Plus,
  Compass,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
  ChevronRight,
} from "lucide-react";
import { LocalRegion } from "@/lib/db/dexie";
import { db } from "@/lib/db/dexie";
import { enqueueWrite } from "@/lib/db/sync";

interface CdnxRouteSidebarProps {
  regions: LocalRegion[];
  selectedRegionId: string;
  onSelectRegion: (id: string) => void;
  routeShopCounts: Map<string, number>;
  activeSubFilter: "all" | "reminders" | "completed" | "dues";
  onSubFilterChange: (filter: "all" | "reminders" | "completed" | "dues") => void;
  totalShopsCount: number;
  filterCounts?: {
    all: number;
    reminders: number;
    dues: number;
    completed: number;
  };
}

export const CdnxRouteSidebar: React.FC<CdnxRouteSidebarProps> = ({
  regions,
  selectedRegionId,
  onSelectRegion,
  routeShopCounts,
  activeSubFilter,
  onSubFilterChange,
  totalShopsCount,
  filterCounts,
}) => {
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [newRouteName, setNewRouteName] = useState("");

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRouteName.trim()) return;

    const newRegion: LocalRegion = {
      id: `reg-${Date.now()}`,
      organisation_id: "org-waymark-demo",
      owner_id: "demo-user",
      name: newRouteName.trim(),
      sort_order: regions.length + 1,
      created_at: new Date().toISOString(),
    };

    await db.regions.put(newRegion);
    await enqueueWrite("regions", "upsert", newRegion);
    setNewRouteName("");
    setShowAddRoute(false);
    onSelectRegion(newRegion.id);
  };

  return (
    <aside className="w-60 bg-[#F8F9FB] dark:bg-[#0C0D12] border-r border-black/[0.08] dark:border-white/[0.08] p-4 flex flex-col justify-between hidden md:flex select-none h-[calc(100vh-4rem)] sticky top-16 text-xs transition-colors duration-200">
      <div className="space-y-6">
        {/* Header (Corridors / Routes) */}
        <div>
          <div className="flex items-center justify-between px-2 mb-3">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
              <Compass size={14} className="text-[#D4F638]" />
              Routes &amp; Areas
            </span>
            <button
              onClick={() => setShowAddRoute(!showAddRoute)}
              className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-[#D4F638] transition-colors"
              title="Add New Area"
            >
              <Plus size={15} />
            </button>
          </div>

          {/* Quick Route Add Box */}
          {showAddRoute && (
            <form onSubmit={handleCreateRoute} className="mb-3 px-2">
              <input
                type="text"
                autoFocus
                value={newRouteName}
                onChange={(e) => setNewRouteName(e.target.value)}
                placeholder="New area (e.g. Edappally)..."
                className="w-full bg-white dark:bg-[#181924] border border-black/[0.1] dark:border-white/[0.1] rounded-xl px-2.5 py-1.5 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-xs focus:outline-none focus:border-[#D4F638] shadow-sm"
              />
            </form>
          )}

          {/* List of Corridors with Counts */}
          <div className="space-y-1">
            <button
              onClick={() => onSelectRegion("all")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-all ${
                selectedRegionId === "all"
                  ? "bg-white dark:bg-[#181924] text-zinc-950 dark:text-white font-bold border border-black/[0.08] dark:border-white/[0.08] shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
              }`}
            >
              <span className="truncate">All Areas</span>
              <span className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                {totalShopsCount}
              </span>
            </button>

            {regions.map((reg) => {
              const count = routeShopCounts.get(reg.id) || 0;
              const isSelected = selectedRegionId === reg.id;

              return (
                <button
                  key={reg.id}
                  onClick={() => onSelectRegion(reg.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-all ${
                    isSelected
                      ? "bg-white dark:bg-[#181924] text-zinc-950 dark:text-white font-bold border border-black/[0.08] dark:border-white/[0.08] shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                  }`}
                >
                  <span className="truncate">{reg.name}</span>
                  <span
                    className={`font-mono text-[11px] ${
                      isSelected ? "text-indigo-600 dark:text-[#D4F638] font-bold" : "text-zinc-400 dark:text-zinc-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-Filters / Run Status */}
        <div>
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 px-2 block mb-2">
            Status Filters
          </span>
          <div className="space-y-1">
            {[
              { id: "all", label: "Scheduled Today", icon: Calendar },
              { id: "reminders", label: "Scheduled Reminders", icon: Clock },
              { id: "dues", label: "Pending Dues", icon: IndianRupee },
              { id: "completed", label: "Completed Stops", icon: CheckCircle2 },
            ].map((f) => {
              const Icon = f.icon;
              const isSelected = activeSubFilter === f.id;
              const count = filterCounts ? filterCounts[f.id as keyof typeof filterCounts] : undefined;

              return (
                <button
                  key={f.id}
                  onClick={() => onSubFilterChange(f.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                    isSelected
                      ? "bg-purple-100 dark:bg-[#1E1B38] text-purple-950 dark:text-white font-bold border border-purple-500/30 shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon
                      size={14}
                      className={isSelected ? "text-purple-600 dark:text-[#D4F638]" : "text-zinc-400 dark:text-zinc-500"}
                    />
                    <span className="truncate">{f.label}</span>
                  </div>
                  {count !== undefined && (
                    <span
                      className={`font-mono text-[11px] px-1.5 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-purple-200 dark:bg-purple-900/40 text-purple-900 dark:text-[#D4F638] font-bold"
                          : "text-zinc-400 dark:text-zinc-500"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-white dark:bg-[#13141C] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl shadow-sm">
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
          <span>Supplier Mode</span>
          <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
        </div>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
          Dexie offline storage active. Updates save in real time.
        </p>
      </div>
    </aside>
  );
};
