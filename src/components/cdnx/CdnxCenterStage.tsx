"use client";

import React from "react";
import {
  Truck,
  Plus,
  IndianRupee,
  Clock,
  CheckCircle2,
  Phone,
  AlertTriangle,
  MapPin,
  Calendar,
  Search,
  X,
  ChevronRight,
  Filter,
} from "lucide-react";
import { LocalShop, LocalRegion } from "@/lib/db/dexie";
import { TodayShopItem } from "@/hooks/useTodayList";
import { formatDateOnly } from "@/lib/scheduling";

export type CdnxFilterType = "pending" | "reminders" | "completed" | "all";

interface CdnxCenterStageProps {
  routeName: string;
  regions: LocalRegion[];
  selectedRouteId: string;
  onSelectRoute: (id: string) => void;
  displayList: Array<{ shop: LocalShop; todayItem?: TodayShopItem; isCompleted: boolean }>;
  allShopsInRoute: LocalShop[];
  completedShopIds: Set<string>;
  onSelectShopForLog: (shop: LocalShop) => void;
  onQuickDeliver: (item: TodayShopItem) => void;
  onOpenAddShop: () => void;
  onOpenLedger: () => void;
  selectedShopId?: string;
  activeFilter: CdnxFilterType;
  onFilterChange: (filter: CdnxFilterType) => void;
  filterCounts: {
    pending: number;
    reminders: number;
    completed: number;
    all: number;
    dues: number;
  };
  totalDueAmount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const CdnxCenterStage: React.FC<CdnxCenterStageProps> = ({
  routeName,
  regions,
  selectedRouteId,
  onSelectRoute,
  displayList,
  allShopsInRoute,
  completedShopIds,
  onSelectShopForLog,
  onQuickDeliver,
  onOpenAddShop,
  onOpenLedger,
  selectedShopId,
  activeFilter,
  onFilterChange,
  filterCounts,
  totalDueAmount,
  searchQuery,
  onSearchChange,
}) => {
  const todayStr = formatDateOnly(new Date());
  const totalCount = allShopsInRoute.length;
  const completedCount = completedShopIds.size;
  const progressPercent = totalCount > 0 ? Math.min(100, Math.round((completedCount / totalCount) * 100)) : 0;

  return (
    <div className="space-y-4 animate-in fade-in pb-20">
      {/* ── 1. Fast Corridor / Beat Switcher (Mobile & Desktop) ── */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-0.5 select-none">
        <button
          type="button"
          onClick={() => onSelectRoute("all")}
          className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
            selectedRouteId === "all"
              ? "bg-[#D4F638] text-[#0A0D02] shadow-sm"
              : "bg-white dark:bg-[#13141C] border border-black/[0.08] dark:border-white/[0.08] text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white"
          }`}
        >
          <MapPin size={13} className={selectedRouteId === "all" ? "text-[#0A0D02]" : "text-zinc-400"} />
          <span>All Areas</span>
          <span className="text-[10px] opacity-75">({filterCounts.all})</span>
        </button>

        {regions.map((reg) => {
          const isSelected = selectedRouteId === reg.id;
          return (
            <button
              key={reg.id}
              type="button"
              onClick={() => onSelectRoute(reg.id)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                isSelected
                  ? "bg-[#D4F638] text-[#0A0D02] shadow-sm"
                  : "bg-white dark:bg-[#13141C] border border-black/[0.08] dark:border-white/[0.08] text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-[#0A0D02]" : "bg-[#D4F638]"}`} />
              <span>{reg.name}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onOpenAddShop}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-mono font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-[#181924] dark:hover:bg-[#202230] text-zinc-700 dark:text-zinc-300 border border-black/[0.06] dark:border-white/[0.06] flex items-center gap-1"
        >
          <Plus size={13} />
          <span>New Store</span>
        </button>
      </div>

      {/* ── 2. Compact High-Performance Progress & Metric Bar ── */}
      <div className="rounded-2xl p-4 bg-white dark:bg-[#13141C] border border-black/[0.08] dark:border-white/[0.08] shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-[#D4F638]">
                {routeName} Route
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">·</span>
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h2 className="text-xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
                {filterCounts.pending} Stops Remaining
              </h2>
              <span className="text-xs text-zinc-500 font-mono">
                ({completedCount} of {totalCount} completed · {progressPercent}%)
              </span>
            </div>
          </div>

          {/* Quick Metrics & Next Shop Action */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenLedger}
              className="text-left px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
              title="Open Khata Ledger"
            >
              <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 block uppercase">
                Khata Dues
              </span>
              <span className="text-xs font-mono font-extrabold text-amber-800 dark:text-amber-300">
                ₹{totalDueAmount.toLocaleString("en-IN")}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                const nextPending = displayList.find((e) => !e.isCompleted);
                if (nextPending) {
                  onSelectShopForLog(nextPending.shop);
                } else if (allShopsInRoute.length > 0) {
                  onSelectShopForLog(allShopsInRoute[0]);
                }
              }}
              className="py-2 px-3.5 bg-[#D4F638] hover:bg-[#C2E426] text-[#0A0D02] rounded-xl font-bold font-mono text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <Truck size={14} strokeWidth={2.5} />
              <span>Log Next</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-100 dark:bg-[#1A1C29] h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#D4F638] transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ── 3. Unified Single-Tier Filter Tabs ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-[#13141C] border border-black/[0.06] dark:border-white/[0.06] p-1 rounded-full text-xs overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => onFilterChange("pending")}
            className={`px-3.5 py-1.5 rounded-full font-mono text-xs font-bold transition-all whitespace-nowrap ${
              activeFilter === "pending"
                ? "bg-[#D4F638] text-[#0A0D02] shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
            }`}
          >
            Pending ({filterCounts.pending})
          </button>

          <button
            type="button"
            onClick={() => onFilterChange("reminders")}
            className={`px-3.5 py-1.5 rounded-full font-mono text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === "reminders"
                ? "bg-[#D4F638] text-[#0A0D02] shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
            }`}
          >
            <span>Follow-ups</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeFilter === "reminders" ? "bg-[#0A0D02] text-[#D4F638]" : "bg-purple-500/20 text-purple-600 dark:text-purple-400"
            }`}>
              {filterCounts.reminders}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onFilterChange("completed")}
            className={`px-3.5 py-1.5 rounded-full font-mono text-xs font-bold transition-all whitespace-nowrap ${
              activeFilter === "completed"
                ? "bg-[#D4F638] text-[#0A0D02] shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
            }`}
          >
            Completed ({filterCounts.completed})
          </button>

          <button
            type="button"
            onClick={() => onFilterChange("all")}
            className={`px-3.5 py-1.5 rounded-full font-mono text-xs font-bold transition-all whitespace-nowrap ${
              activeFilter === "all"
                ? "bg-[#D4F638] text-[#0A0D02] shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
            }`}
          >
            All Stores ({filterCounts.all})
          </button>
        </div>

        {/* ── 4. In-Stage Search Bar ── */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search stores, contact..."
            className="w-full pl-8 pr-7 py-1.5 rounded-full bg-white dark:bg-[#13141C] border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#D4F638]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── 5. Daylight-Optimized Walk-to-Car Shop Cards ── */}
      <div className="space-y-3">
        {displayList.length === 0 ? (
          <div className="p-10 text-center bg-white dark:bg-[#13141C] border border-black/[0.08] dark:border-white/[0.08] rounded-3xl space-y-3 shadow-sm transition-colors">
            <CheckCircle2 size={36} className="text-[#D4F638] mx-auto opacity-90" />
            <h4 className="text-base font-bold text-zinc-950 dark:text-white">
              {searchQuery
                ? `No stores matching "${searchQuery}"`
                : activeFilter === "reminders"
                ? "No Scheduled Reminders"
                : activeFilter === "completed"
                ? "No Visits Completed Yet Today"
                : activeFilter === "pending"
                ? "All Deliveries Completed on this Beat!"
                : "No Stores Registered on this Route Yet"}
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
              {searchQuery
                ? "Try clearing your search query or registering this new store."
                : activeFilter === "reminders"
                ? "Tap 'Log Visit' on any store while walking back to your car to set a callback reminder."
                : activeFilter === "completed"
                ? "Tap 'Log Visit' or '✓ Quick Drop' to record your first completed delivery today."
                : activeFilter === "pending"
                ? "All stops for today are done! You can review completed stops or check khata dues in the ledger."
                : "Get started by adding your retail counters along this corridor."}
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={onOpenAddShop}
                className="px-5 py-2.5 bg-[#D4F638] hover:bg-[#C2E426] text-[#0A0D02] rounded-full text-xs font-mono font-bold shadow-md transition-all active:scale-95 inline-flex items-center gap-1.5"
              >
                <Plus size={15} strokeWidth={3} />
                <span>+ Add Store on {routeName}</span>
              </button>
            </div>
          </div>
        ) : (
          displayList.map((entry, index) => {
            const { shop, todayItem, isCompleted } = entry;
            const isSelected = selectedShopId === shop.id;

            const dueProducts = todayItem?.dueProducts || [];
            const totalCrates = dueProducts.reduce((sum, p) => sum + (p.shopProduct.default_qty || 1), 0) || 2;
            const reminderNote = (shop as any).reminder_note || todayItem?.reminderNote;
            const reminderDate = (shop as any).reminder_date;

            let reminderDateLabel = "";
            if (reminderDate) {
              reminderDateLabel = reminderDate === todayStr ? "Today" : reminderDate;
            }

            return (
              <div
                key={shop.id}
                className={`p-4 md:p-5 rounded-2xl border transition-all ${
                  isSelected
                    ? "bg-purple-50/70 dark:bg-[#181728] border-2 border-[#D4F638] shadow-lg"
                    : isCompleted
                    ? "bg-zinc-50 dark:bg-[#101117] border-black/[0.04] dark:border-white/[0.04] opacity-80"
                    : "bg-white dark:bg-[#13141C] hover:bg-zinc-50 dark:hover:bg-[#161724] border-black/[0.08] dark:border-white/[0.08] shadow-sm"
                }`}
              >
                {/* Header: Sequence Number + Shop Name + Due Balance */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-[#1B1D2A] text-zinc-600 dark:text-zinc-400 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {isCompleted ? "✓" : index + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-zinc-950 dark:text-white tracking-tight truncate">
                          {shop.name}
                        </h3>
                        {shop.is_urgent && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-mono text-[10px] font-bold">
                            Urgent
                          </span>
                        )}
                        {isCompleted && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
                            Done
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                        {shop.notes || shop.billing_address || "Main bazaar counter"}
                      </p>
                    </div>
                  </div>

                  {/* Dues Badge */}
                  <div className="text-right flex-shrink-0">
                    {(shop.balance_due || 0) > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-mono font-bold text-xs">
                        ₹{(shop.balance_due || 0).toLocaleString("en-IN")} Due
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-[11px]">
                        Paid Up
                      </span>
                    )}
                  </div>
                </div>

                {/* Crates & Due Items Pills */}
                <div className="flex items-center gap-2 flex-wrap my-3">
                  {dueProducts.length > 0 ? (
                    dueProducts.map((p) => (
                      <span
                        key={p.shopProduct.id}
                        className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-[#181924] border border-black/[0.06] dark:border-white/[0.06] text-zinc-800 dark:text-zinc-300 font-mono text-[11px]"
                      >
                        <span className="text-emerald-600 dark:text-[#D4F638] font-bold mr-1">
                          {p.shopProduct.default_qty || 1}
                        </span>
                        {p.product.name}
                      </span>
                    ))
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-[#181924] border border-black/[0.06] dark:border-white/[0.06] text-zinc-600 dark:text-zinc-400 font-mono text-[11px]">
                      Standard {totalCrates} Crates Drop
                    </span>
                  )}

                  {shop.contact && (
                    <a
                      href={`tel:${shop.contact}`}
                      className="ml-auto inline-flex items-center gap-1 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white px-2 py-1 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                    >
                      <Phone size={11} className="text-emerald-600 dark:text-[#D4F638]" />
                      <span>{shop.contact}</span>
                    </a>
                  )}
                </div>

                {/* Scheduled Reminder Alert Banner if set */}
                {(reminderNote || reminderDate) && (
                  <div className="mb-3 p-2.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/25 flex items-start gap-2 text-xs">
                    <Clock size={14} className="text-purple-600 dark:text-[#D4F638] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-mono font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wide block">
                        Scheduled Reminder ({reminderDateLabel || "Pending"}):
                      </span>
                      <p className="text-zinc-900 dark:text-white font-medium text-xs mt-0.5">
                        {reminderNote || "Follow up on crate restock / dues"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Footer Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                  {/* Primary: Open Walk-to-Car Slip */}
                  <button
                    type="button"
                    onClick={() => onSelectShopForLog(shop)}
                    className="flex-1 py-2.5 px-4 bg-[#D4F638] hover:bg-[#C2E426] text-[#0A0D02] rounded-xl font-bold font-mono text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
                  >
                    <Truck size={14} strokeWidth={2.5} />
                    <span>Log Visit</span>
                  </button>

                  {/* Quick 1-tap Deliver */}
                  {todayItem && !isCompleted && (
                    <button
                      type="button"
                      onClick={() => onQuickDeliver(todayItem)}
                      className="py-2.5 px-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-[#1E202E] dark:hover:bg-[#282B3E] text-zinc-800 dark:text-zinc-300 rounded-xl font-mono text-xs font-semibold border border-black/[0.08] dark:border-white/[0.08] transition-all active:scale-[0.98] flex items-center gap-1.5"
                      title="Quick mark default delivery"
                    >
                      <CheckCircle2 size={15} className="text-emerald-600 dark:text-[#22C55E]" />
                      <span className="text-[11px] hidden sm:inline">Quick Drop</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
