"use client";

import React, { useState } from "react";
import {
  IndianRupee,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Store,
  Filter,
} from "lucide-react";
import { LocalShop } from "@/lib/db/dexie";
import { recordPayment } from "@/lib/actions/paymentActions";

interface CdnxLedgerViewProps {
  shops: LocalShop[];
  routeName: string;
  onRefresh: () => void;
  onSelectShopForLog: (shop: LocalShop) => void;
}

export const CdnxLedgerView: React.FC<CdnxLedgerViewProps> = ({
  shops,
  routeName,
  onRefresh,
  onSelectShopForLog,
}) => {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "dues_only" | "cleared">("dues_only");
  const [selectedShop, setSelectedShop] = useState<LocalShop | null>(null);
  const [quickAmount, setQuickAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalDues = shops.reduce((sum, s) => sum + (s.balance_due || 0), 0);
  const shopsWithDues = shops.filter((s) => (s.balance_due || 0) > 0);

  const filteredShops = shops.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.contact && s.contact.includes(search)) ||
      (s.notes && s.notes.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterType === "dues_only") return (s.balance_due || 0) > 0;
    if (filterType === "cleared") return (s.balance_due || 0) <= 0;
    return true;
  });

  const handleQuickPaymentSubmit = async () => {
    if (!selectedShop || !quickAmount) return;
    const num = parseFloat(quickAmount);
    if (isNaN(num) || num <= 0) return;

    setIsSubmitting(true);
    try {
      await recordPayment({
        shopId: selectedShop.id,
        amount: num,
        paymentMode: "cash",
        notes: "Direct ledger collection",
      });
      setSelectedShop(null);
      setQuickAmount("");
      onRefresh();
    } catch (err) {
      console.error(err);
      alert("Error recording payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Title (Matching Image 2: "Your wallet" -> "Your ledger") */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Your <span className="text-zinc-500 font-normal">ledger</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          {routeName} Corridor · {shopsWithDues.length} stores with pending credit balances
        </p>
      </div>

      {/* Main Indigo Gradient Balance Card (Matching Image 2 CDNX Wallet Card) */}
      <div className="rounded-3xl p-6 bg-gradient-to-r from-[#1C1938] via-[#16172B] to-[#10111F] border border-purple-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
            <span>Route Ledger</span>
            <span>·</span>
            <span className="text-purple-300 font-bold">{routeName} Beat</span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-[11px]">
            {shopsWithDues.length} Pending Counters
          </span>
        </div>

        <div className="mb-6">
          <div className="text-4xl md:text-5xl font-extrabold text-white font-mono tracking-tight flex items-baseline gap-1">
            <span className="text-2xl md:text-3xl text-zinc-400">₹</span>
            <span>{totalDues.toLocaleString("en-IN")}</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            Total active khata credit outstanding in {routeName}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              if (shopsWithDues.length > 0) {
                setSelectedShop(shopsWithDues[0]);
                setQuickAmount(String(shopsWithDues[0].balance_due));
              }
            }}
            className="py-3 px-6 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-white font-bold text-xs font-mono flex items-center gap-2 transition-all active:scale-95"
          >
            <ArrowDownLeft size={16} className="text-[#D4F638]" />
            <span>Collect Cash</span>
          </button>
          <button
            onClick={() => {
              const csv = shops
                .map((s) => `"${s.name}","${s.contact || ""}","${s.balance_due}"`)
                .join("\n");
              const blob = new Blob([`Shop,Contact,Balance Due\n${csv}`], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `ledger-${routeName.toLowerCase().replace(/\s+/g, "-")}.csv`;
              a.click();
            }}
            className="py-3 px-6 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-300 font-bold text-xs font-mono flex items-center gap-2 transition-all active:scale-95"
          >
            <ArrowUpRight size={16} className="text-zinc-400" />
            <span>Export Route Dues</span>
          </button>
        </div>
      </div>

      {/* Quick Collection Modal / Drawer if shop is selected */}
      {selectedShop && (
        <div className="p-5 rounded-3xl bg-[#161722] border border-[#D4F638]/40 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D4F638]">
                Log Payment On The Go
              </span>
              <h4 className="text-base font-bold text-white mt-0.5">{selectedShop.name}</h4>
              <p className="text-xs text-zinc-400">
                Outstanding: ₹{selectedShop.balance_due.toLocaleString("en-IN")}
              </p>
            </div>
            <button
              onClick={() => setSelectedShop(null)}
              className="text-zinc-400 hover:text-white text-xs font-mono"
            >
              Cancel
            </button>
          </div>

          {/* Quick Increment Chips like CDNX Wallet */}
          <div className="grid grid-cols-4 gap-2">
            {["500", "1000", "2000", String(selectedShop.balance_due)].map((amt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setQuickAmount(amt)}
                className="py-2 px-2 bg-[#232532] hover:bg-[#2C2E3E] text-white font-mono font-bold rounded-xl border border-white/[0.06] text-center transition-all active:scale-95 text-xs"
              >
                {idx === 3 ? `Full ₹${amt}` : `+ ₹${amt}`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center bg-[#13141C] border border-white/[0.1] rounded-xl px-3 py-2">
              <span className="text-zinc-500 font-mono mr-1">₹</span>
              <input
                type="number"
                value={quickAmount}
                onChange={(e) => setQuickAmount(e.target.value)}
                placeholder="Amount collected"
                className="w-full bg-transparent text-white font-mono font-bold focus:outline-none text-sm"
              />
            </div>
            <button
              type="button"
              disabled={isSubmitting || !quickAmount}
              onClick={handleQuickPaymentSubmit}
              className="py-2.5 px-5 bg-[#D4F638] hover:bg-[#C2E426] text-[#0A0D02] rounded-xl font-bold font-mono text-xs transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Apply & Clear"}
            </button>
          </div>
        </div>
      )}

      {/* Ledger Stores List */}
      <div className="space-y-4">
        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center bg-[#13141C] border border-white/[0.08] rounded-2xl px-3 py-2 flex-1 max-w-sm">
            <Search size={15} className="text-zinc-500 mr-2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search store name, contact..."
              className="w-full bg-transparent text-white placeholder:text-zinc-600 focus:outline-none text-xs"
            />
          </div>

          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-[#13141C] border border-white/[0.08] rounded-2xl">
            {[
              { id: "dues_only", label: "Pending Dues" },
              { id: "cleared", label: "Cleared" },
              { id: "all", label: "All Stores" },
            ].map((tab) => {
              const isSelected = filterType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-[#D4F638] text-[#0A0D02]"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Store Rows */}
        <div className="space-y-2.5">
          {filteredShops.length === 0 ? (
            <div className="p-8 text-center bg-[#13141C] border border-white/[0.06] rounded-3xl text-zinc-500 text-xs font-mono">
              No matching stores in this ledger view.
            </div>
          ) : (
            filteredShops.map((shop) => (
              <div
                key={shop.id}
                className="p-4 bg-[#13141C] hover:bg-[#161724] border border-white/[0.06] rounded-2xl flex items-center justify-between gap-4 transition-all"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm truncate">{shop.name}</h4>
                    {shop.is_urgent && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 font-mono text-[10px] font-bold">
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">
                    {shop.notes || "Main road counter"} · {shop.contact || "No phone"}
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div
                      className={`font-mono font-bold text-sm ${
                        (shop.balance_due || 0) > 0 ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      ₹{(shop.balance_due || 0).toLocaleString("en-IN")}
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {(shop.balance_due || 0) > 0 ? "Outstanding" : "Settled"}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedShop(shop);
                      setQuickAmount(String(shop.balance_due || 500));
                    }}
                    className="py-1.5 px-3 bg-[#232532] hover:bg-[#2D2F40] text-[#D4F638] border border-white/[0.08] font-mono font-bold text-xs rounded-xl transition-all active:scale-95"
                  >
                    Collect
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
