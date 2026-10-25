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
} from "lucide-react";
import { LocalShop, LocalShopProduct, LocalProduct } from "@/lib/db/dexie";
import { TodayShopItem } from "@/hooks/useTodayList";

interface CdnxCenterStageProps {
  routeName: string;
  shopsDue: TodayShopItem[];
  allShopsInRoute: LocalShop[];
  completedShopIds: Set<string>;
  onSelectShopForLog: (shop: LocalShop) => void;
  onQuickDeliver: (item: TodayShopItem) => void;
  onOpenAddShop: () => void;
  onOpenLedger: () => void;
  selectedShopId?: string;
  activeSegment: "due" | "completed" | "all";
  onSegmentChange: (seg: "due" | "completed" | "all") => void;
  onFilterRemindersOnly: () => void;
}

export const CdnxCenterStage: React.FC<CdnxCenterStageProps> = ({
  routeName,
  shopsDue,
  allShopsInRoute,
  completedShopIds,
  onSelectShopForLog,
  onQuickDeliver,
  onOpenAddShop,
  onOpenLedger,
  selectedShopId,
  activeSegment,
  onSegmentChange,
  onFilterRemindersOnly,
}) => {
  // Pending today's stops
  const pendingStops = shopsDue.filter((item) => !completedShopIds.has(item.shop.id));
  const completedStops = shopsDue.filter((item) => completedShopIds.has(item.shop.id));

  // Shops with reminder today
  const remindersCount = shopsDue.filter((i) => i.hasReminderToday).length;
  const totalDueAmount = shopsDue.reduce((sum, i) => sum + (i.shop.balance_due || 0), 0);

  // Cards to display based on segment
  let displayList: Array<{ shop: LocalShop; todayItem?: TodayShopItem; isCompleted: boolean }> = [];

  if (activeSegment === "due") {
    displayList = pendingStops.map((item) => ({
      shop: item.shop,
      todayItem: item,
      isCompleted: false,
    }));
  } else if (activeSegment === "completed") {
    displayList = completedStops.map((item) => ({
      shop: item.shop,
      todayItem: item,
      isCompleted: true,
    }));
  } else {
    // All shops in route
    const itemMap = new Map(shopsDue.map((i) => [i.shop.id, i]));
    displayList = allShopsInRoute.map((s) => ({
      shop: s,
      todayItem: itemMap.get(s.id),
      isCompleted: completedShopIds.has(s.id),
    }));
  }

  return (
    <div className="space-y-6 animate-in fade-in pb-16">
      {/* 1. CDNX Indigo Glow Hero Banner (Exact match to Image 1's hero banner) */}
      <div className="rounded-3xl p-6 bg-gradient-to-r from-[#1C1938] via-[#16172B] to-[#10111F] border border-purple-500/20 shadow-2xl relative overflow-hidden">
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
            {pendingStops.length} stops left on this beat · ₹{totalDueAmount.toLocaleString("en-IN")} pending collection
          </p>
        </div>

        {/* 4 Quick Action Circular Buttons (Matching Image 1: Deposit, Withdraw, Bet slip, History) */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/[0.08]">
          <button
            onClick={() => {
              if (pendingStops.length > 0) {
                onSelectShopForLog(pendingStops[0].shop);
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
            onClick={onFilterRemindersOnly}
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

      {/* 2. Scheduled Reminders Banner (Matching CDNX "Claim daily reward" banner) */}
      {remindersCount > 0 && (
        <div
          onClick={onFilterRemindersOnly}
          className="p-4 rounded-2xl bg-gradient-to-r from-[#1C182E] via-[#211A38] to-[#171424] border border-purple-500/30 flex items-center justify-between cursor-pointer hover:border-[#D4F638]/50 transition-all shadow-md group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-[#D4F638] flex items-center justify-center">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover:text-[#D4F638] transition-colors">
                {remindersCount} store follow-up reminder{remindersCount > 1 ? "s" : ""} scheduled for today in {routeName}
              </p>
              <p className="text-[11px] text-zinc-400">
                Tap to isolate shops requiring stock verification or payment pickup
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-[#D4F638] group-hover:underline">
            View &rarr;
          </span>
        </div>
      )}

      {/* 3. CDNX Segmented Filter Pill (Exact match to Image 1's Sports pill bar) */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center bg-[#13141C] border border-white/[0.08] p-1 rounded-full">
          <button
            type="button"
            onClick={() => onSegmentChange("due")}
            className={`px-5 py-2 rounded-full font-mono text-xs font-bold transition-all ${
              activeSegment === "due"
                ? "bg-[#D4F638] text-[#0A0D02] shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Due Today ({pendingStops.length})
          </button>

          <button
            type="button"
            onClick={() => onSegmentChange("completed")}
            className={`px-4 py-2 rounded-full font-mono text-xs font-bold transition-all ${
              activeSegment === "completed"
                ? "bg-[#D4F638] text-[#0A0D02] shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Completed ({completedStops.length})
          </button>

          <button
            type="button"
            onClick={() => onSegmentChange("all")}
            className={`px-4 py-2 rounded-full font-mono text-xs font-bold transition-all ${
              activeSegment === "all"
                ? "bg-[#D4F638] text-[#0A0D02] shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            All {routeName} ({allShopsInRoute.length})
          </button>
        </div>

        <span className="text-xs text-zinc-500 font-mono hidden sm:inline">
          {displayList.length} shops in view
        </span>
      </div>

      {/* 4. The Walk-to-Car Shop Cards */}
      <div className="space-y-3">
        {displayList.length === 0 ? (
          <div className="p-12 text-center bg-[#13141C] border border-white/[0.06] rounded-3xl space-y-3">
            <CheckCircle2 size={36} className="text-[#D4F638] mx-auto opacity-80" />
            <h4 className="text-base font-bold text-white">All Scheduled Deliveries Completed!</h4>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Zero pending shops remaining for {routeName} today. You can log additional shops or check dues.
            </p>
          </div>
        ) : (
          displayList.map((entry, index) => {
            const { shop, todayItem, isCompleted } = entry;
            const isSelected = selectedShopId === shop.id;

            // Products to deliver
            const dueProducts = todayItem?.dueProducts || [];
            const totalCrates = dueProducts.reduce((sum, p) => sum + (p.shopProduct.default_qty || 1), 0) || 2;
            const reminderNote = (shop as any).reminder_note || todayItem?.reminderNote;

            return (
              <div
                key={shop.id}
                className={`p-4 md:p-5 rounded-2xl border transition-all ${
                  isSelected
                    ? "bg-[#181728] border-[#D4F638] shadow-xl"
                    : isCompleted
                    ? "bg-[#101117] border-white/[0.04] opacity-75"
                    : "bg-[#13141C] hover:bg-[#161724] border-white/[0.08]"
                }`}
              >
                {/* Header Row: Number + Name + Dues */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-[#1B1D2A] text-zinc-400 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {isCompleted ? "✓" : index + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-white tracking-tight truncate">
                          {shop.name}
                        </h3>
                        {shop.is_urgent && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 font-mono text-[10px] font-bold">
                            Urgent Beat
                          </span>
                        )}
                        {isCompleted && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold">
                            Done
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">
                        {shop.notes || "Main bazaar counter"} · {routeName}
                      </p>
                    </div>
                  </div>

                  {/* Dues Pill */}
                  <div className="text-right flex-shrink-0">
                    {(shop.balance_due || 0) > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono font-bold text-xs">
                        ₹{(shop.balance_due || 0).toLocaleString("en-IN")} Due
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[11px]">
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
                        className="px-2.5 py-1 rounded-lg bg-[#181924] border border-white/[0.06] text-zinc-300 font-mono text-[11px]"
                      >
                        <span className="text-[#D4F638] font-bold mr-1">
                          {p.shopProduct.default_qty || 1}
                        </span>
                        {p.product.name}
                      </span>
                    ))
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-[#181924] border border-white/[0.06] text-zinc-400 font-mono text-[11px]">
                      Regular {totalCrates} Crates Drop
                    </span>
                  )}

                  {shop.contact && (
                    <a
                      href={`tel:${shop.contact}`}
                      className="ml-auto inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/[0.05]"
                    >
                      <Phone size={11} className="text-[#D4F638]" />
                      <span>{shop.contact}</span>
                    </a>
                  )}
                </div>

                {/* Reminder Alert Pill if set */}
                {reminderNote && (
                  <div className="mb-3 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-start gap-2 text-xs">
                    <Clock size={14} className="text-[#D4F638] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wide block">
                        Today's Scheduled Reminder:
                      </span>
                      <p className="text-white font-medium text-xs mt-0.5">{reminderNote}</p>
                    </div>
                  </div>
                )}

                {/* Footer Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
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
                      className="py-2.5 px-3 bg-[#1E202E] hover:bg-[#282B3E] text-zinc-300 hover:text-white rounded-xl font-mono text-xs font-semibold border border-white/[0.08] transition-all active:scale-[0.98]"
                      title="Quick mark default delivery"
                    >
                      ✓ Quick Deliver
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
