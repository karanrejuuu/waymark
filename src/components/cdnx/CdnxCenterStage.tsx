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
  Package,
  Layers,
  ArrowRight,
  Sparkles,
  MapPin,
  Calendar,
  X,
  Filter,
} from "lucide-react";
import { LocalShop } from "@/lib/db/dexie";
import { TodayShopItem } from "@/hooks/useTodayList";
import { formatDateOnly } from "@/lib/scheduling";

interface CdnxCenterStageProps {
  routeName: string;
  displayList: Array<{ shop: LocalShop; todayItem?: TodayShopItem; isCompleted: boolean }>;
  allShopsInRoute: LocalShop[];
  completedShopIds: Set<string>;
  onSelectShopForLog: (shop: LocalShop) => void;
  onQuickDeliver: (item: TodayShopItem) => void;
  onOpenAddShop: () => void;
  onOpenLedger: () => void;
  selectedShopId?: string;
  activeSegment: "due" | "completed" | "all";
  onSegmentChange: (seg: "due" | "completed" | "all") => void;
  activeSubFilter: "all" | "reminders" | "completed" | "dues";
  onSubFilterChange: (filter: "all" | "reminders" | "completed" | "dues") => void;
  pendingDueCount: number;
  totalDueAmount: number;
  remindersCount: number;
  onLoadDemoData?: () => void;
}

export const CdnxCenterStage: React.FC<CdnxCenterStageProps> = ({
  routeName,
  displayList,
  allShopsInRoute,
  completedShopIds,
  onSelectShopForLog,
  onQuickDeliver,
  onOpenAddShop,
  onOpenLedger,
  selectedShopId,
  activeSegment,
  onSegmentChange,
  activeSubFilter,
  onSubFilterChange,
  pendingDueCount,
  totalDueAmount,
  remindersCount,
  onLoadDemoData,
}) => {
  const todayStr = formatDateOnly(new Date());
  const pendingCount = allShopsInRoute.filter((s) => !completedShopIds.has(s.id)).length;
  const completedCount = allShopsInRoute.filter((s) => completedShopIds.has(s.id)).length;

  return (
    <div className="space-y-6 animate-in fade-in pb-16">
      {/* 1. CDNX Indigo Glow Hero Banner */}
      <div className="rounded-3xl p-6 bg-gradient-to-r from-[#1C1938] via-[#16172B] to-[#10111F] border border-purple-500/20 shadow-2xl relative overflow-hidden text-white">
        {/* Violet ambient aura */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4F638]" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#D4F638]">
              Supplier Run · {routeName} Corridor
            </span>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
          </span>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Good day, <span className="text-purple-300">Supplier</span>
          </h2>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            {pendingCount} stops left on this beat · ₹{totalDueAmount.toLocaleString("en-IN")} pending collection
          </p>
        </div>

        {/* 4 Quick Action Circular Buttons */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/[0.08]">
          <button
            onClick={() => {
              const nextPending = displayList.find((e) => !e.isCompleted);
              if (nextPending) {
                onSelectShopForLog(nextPending.shop);
              } else if (allShopsInRoute.length > 0) {
                onSelectShopForLog(allShopsInRoute[0]);
              }
            }}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/[0.05] transition-all group"
          >
            <div className="w-10 h-10 rounded-full border border-white/[0.15] bg-[#181924] flex items-center justify-center text-zinc-300 group-hover:text-[#D4F638] group-hover:border-[#D4F638] transition-colors">
              <Truck size={17} />
            </div>
            <span className="text-[11px] font-mono font-semibold text-zinc-300 group-hover:text-white">
              Log Next
            </span>
          </button>

          <button
            onClick={onOpenAddShop}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/[0.05] transition-all group"
          >
            <div className="w-10 h-10 rounded-full border border-white/[0.15] bg-[#181924] flex items-center justify-center text-zinc-300 group-hover:text-[#D4F638] group-hover:border-[#D4F638] transition-colors">
              <Plus size={17} />
            </div>
            <span className="text-[11px] font-mono font-semibold text-zinc-300 group-hover:text-white">
              Add Store
            </span>
          </button>

          <button
            onClick={onOpenLedger}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/[0.05] transition-all group"
          >
            <div className="w-10 h-10 rounded-full border border-white/[0.15] bg-[#181924] flex items-center justify-center text-zinc-300 group-hover:text-[#D4F638] group-hover:border-[#D4F638] transition-colors">
              <IndianRupee size={17} />
            </div>
            <span className="text-[11px] font-mono font-semibold text-zinc-300 group-hover:text-white">
              Khata Dues
            </span>
          </button>

          <button
            onClick={() => onSubFilterChange(activeSubFilter === "reminders" ? "all" : "reminders")}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/[0.05] transition-all group"
          >
            <div className="w-10 h-10 rounded-full border border-white/[0.15] bg-[#181924] flex items-center justify-center text-zinc-300 group-hover:text-[#D4F638] group-hover:border-[#D4F638] transition-colors relative">
              <Clock size={17} />
              {remindersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#D4F638] text-[#0A0D02] rounded-full text-[9px] font-mono font-extrabold flex items-center justify-center">
                  {remindersCount}
                </span>
              )}
            </div>
            <span className="text-[11px] font-mono font-semibold text-zinc-300 group-hover:text-white">
              Reminders
            </span>
          </button>
        </div>
      </div>

      {/* 2. Active Filter Banner (when subfilter is selected) */}
      {activeSubFilter !== "all" && (
        <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-500/30 flex items-center justify-between transition-colors shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 dark:bg-[#D4F638]" />
            <div className="text-xs">
              <span className="font-mono font-bold text-purple-950 dark:text-white">
                Active Filter:{" "}
                {activeSubFilter === "reminders"
                  ? "Scheduled Reminders"
                  : activeSubFilter === "dues"
                  ? "Pending Dues"
                  : "Completed Stops"}
              </span>
              <span className="text-zinc-500 dark:text-zinc-400 ml-2 font-mono">
                ({displayList.length} store{displayList.length === 1 ? "" : "s"} found)
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSubFilterChange("all")}
            className="text-xs font-mono font-bold text-purple-700 dark:text-[#D4F638] hover:underline flex items-center gap-1"
          >
            <span>Show Today's Run</span>
            <X size={14} />
          </button>
        </div>
      )}

      {/* 3. Segmented Filter Bar (Shown when viewing all or standard schedule) */}
      {activeSubFilter === "all" && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-[#13141C] border border-black/[0.06] dark:border-white/[0.06] p-1 rounded-full text-xs">
            <button
              type="button"
              onClick={() => onSegmentChange("due")}
              className={`px-3.5 py-1.5 rounded-full font-mono text-xs font-bold transition-all ${
                activeSegment === "due"
                  ? "bg-[#D4F638] text-[#0A0D02] shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              }`}
            >
              Due Today ({pendingCount})
            </button>

            <button
              type="button"
              onClick={() => onSegmentChange("completed")}
              className={`px-3.5 py-1.5 rounded-full font-mono text-xs font-bold transition-all ${
                activeSegment === "completed"
                  ? "bg-[#D4F638] text-[#0A0D02] shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              }`}
            >
              Completed ({completedCount})
            </button>

            <button
              type="button"
              onClick={() => onSegmentChange("all")}
              className={`px-3.5 py-1.5 rounded-full font-mono text-xs font-bold transition-all ${
                activeSegment === "all"
                  ? "bg-[#D4F638] text-[#0A0D02] shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              }`}
            >
              All {routeName} ({allShopsInRoute.length})
            </button>
          </div>

          <span className="text-xs text-zinc-500 font-mono hidden sm:inline">
            {displayList.length} shops in view
          </span>
        </div>
      )}

      {/* 4. The Walk-to-Car Shop Cards */}
      <div className="space-y-3">
        {displayList.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#13141C] border border-black/[0.08] dark:border-white/[0.06] rounded-3xl space-y-3 shadow-sm transition-colors">
            <CheckCircle2 size={36} className="text-[#D4F638] mx-auto opacity-90" />
            <h4 className="text-base font-bold text-zinc-950 dark:text-white">
              {activeSubFilter === "reminders"
                ? "No Scheduled Reminders Found"
                : activeSubFilter === "dues"
                ? `Zero Pending Dues in ${routeName}`
                : activeSubFilter === "completed"
                ? `No Stops Completed in ${routeName} Yet Today`
                : `All Scheduled Deliveries Completed for ${routeName}!`}
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
              {activeSubFilter === "reminders"
                ? `No shops in ${routeName} have callback reminders set. Tap 'Log Visit & Set Reminder' on any store to schedule a return date.`
                : activeSubFilter === "dues"
                ? `All retail counters in ${routeName} have cleared their accounts. Zero pending credit balance!`
                : activeSubFilter === "completed"
                ? `0 stops recorded on this corridor today. Tap '✓ Quick Deliver' or 'Log Visit' on any shop to record a completed stop.`
                : `Zero pending deliveries remaining for ${routeName} today. You can log additional shops or review the ledger.`}
            </p>
            {allShopsInRoute.length === 0 ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={onOpenAddShop}
                  className="px-5 py-2.5 bg-[#D4F638] hover:bg-[#C2E426] text-[#0A0D02] rounded-full text-xs font-mono font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Plus size={15} strokeWidth={3} />
                  <span>Add First Store on Beat</span>
                </button>
                {onLoadDemoData && (
                  <button
                    type="button"
                    onClick={onLoadDemoData}
                    className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-[#181924] dark:hover:bg-[#202230] text-zinc-800 dark:text-zinc-200 border border-black/[0.08] dark:border-white/[0.08] rounded-full text-xs font-mono font-semibold transition-all"
                  >
                    <span>Load Sample Stores (Demo)</span>
                  </button>
                )}
              </div>
            ) : (
              activeSubFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => onSubFilterChange("all")}
                  className="mt-2 px-4 py-2 bg-[#D4F638] text-[#0A0D02] rounded-full text-xs font-mono font-bold hover:bg-[#C2E426] transition-all shadow-sm"
                >
                  Return to Today's Run
                </button>
              )
            )}
          </div>
        ) : (
          displayList.map((entry, index) => {
            const { shop, todayItem, isCompleted } = entry;
            const isSelected = selectedShopId === shop.id;

            // Products to deliver
            const dueProducts = todayItem?.dueProducts || [];
            const totalCrates = dueProducts.reduce((sum, p) => sum + (p.shopProduct.default_qty || 1), 0) || 2;
            const reminderNote = (shop as any).reminder_note || todayItem?.reminderNote;
            const reminderDate = (shop as any).reminder_date;

            // Format reminder badge
            let reminderDateLabel = "";
            if (reminderDate) {
              if (reminderDate === todayStr) {
                reminderDateLabel = "Today";
              } else {
                reminderDateLabel = reminderDate;
              }
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
                {/* Header Row: Number + Name + Dues */}
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
                            Urgent Beat
                          </span>
                        )}
                        {isCompleted && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
                            Done
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                        {shop.notes || "Main bazaar counter"} · {routeName}
                      </p>
                    </div>
                  </div>

                  {/* Dues Pill */}
                  <div className="text-right flex-shrink-0">
                    {(shop.balance_due || 0) > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-mono font-bold text-xs">
                        ₹{(shop.balance_due || 0).toLocaleString("en-IN")} Due
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-[11px]">
                        No Dues
                      </span>
                    )}
                  </div>
                </div>

                {/* Crates & Due FMCG Products */}
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

                {/* Scheduled Reminder Alert Pill if set */}
                {(reminderNote || reminderDate) && (
                  <div className="mb-3 p-2.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/25 flex items-start gap-2 text-xs">
                    <Clock size={14} className="text-purple-600 dark:text-[#D4F638] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-mono font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wide block">
                        Scheduled Reminder ({reminderDateLabel || "Pending"}):
                      </span>
                      <p className="text-zinc-900 dark:text-white font-medium text-xs mt-0.5">
                        {reminderNote || "Follow up on crate collection"}
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
                    <span>Log Visit &amp; Set Reminder</span>
                  </button>

                  {/* Quick 1-tap Deliver */}
                  {todayItem && !isCompleted && (
                    <button
                      type="button"
                      onClick={() => onQuickDeliver(todayItem)}
                      className="py-2.5 px-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-[#1E202E] dark:hover:bg-[#282B3E] text-zinc-800 dark:text-zinc-300 rounded-xl font-mono text-xs font-semibold border border-black/[0.08] dark:border-white/[0.08] transition-all active:scale-[0.98]"
                      title="Quick mark default delivery"
                    >
                      <CheckCircle2 size={15} className="text-emerald-600 dark:text-[#22C55E]" />
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
