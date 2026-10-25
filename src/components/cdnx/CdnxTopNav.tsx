"use client";

import React from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Bell,
  CheckCircle2,
  MapPin,
  Calendar,
  Layers,
  ChevronDown,
  User,
} from "lucide-react";

interface CdnxTopNavProps {
  activeTab: "today" | "all_shops" | "ledger";
  onTabChange: (tab: "today" | "all_shops" | "ledger") => void;
  activeRouteName: string;
  totalDue: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenAddShop: () => void;
  urgentCount: number;
}

export const CdnxTopNav: React.FC<CdnxTopNavProps> = ({
  activeTab,
  onTabChange,
  activeRouteName,
  totalDue,
  searchQuery,
  onSearchChange,
  onOpenAddShop,
  urgentCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0C0D12]/90 backdrop-blur-md border-b border-white/[0.08] px-4 md:px-6 h-16 flex items-center justify-between select-none">
      {/* Left: Brand + Corridor Status Pill */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-black tracking-tight text-white font-sans">
            WAYMARK
          </span>
        </Link>

        {/* Live Route Dot Pill (Matching Image 1: "• Live scores · ESPN") */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#181924] border border-white/[0.06] text-[11px] font-mono text-zinc-300">
          <span className="w-2 h-2 rounded-full bg-[#D4F638] animate-pulse" />
          <span>{activeRouteName} Beat</span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-400">Offline Active</span>
        </div>
      </div>

      {/* Center Tabs: Today's Run | All Shops | Dues & Ledger */}
      <nav className="flex items-center gap-1 bg-[#13141C] border border-white/[0.06] p-1 rounded-full">
        <button
          type="button"
          onClick={() => onTabChange("today")}
          className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
            activeTab === "today"
              ? "bg-[#D4F638] text-[#0A0D02] shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Today's Run
        </button>

        <button
          type="button"
          onClick={() => onTabChange("all_shops")}
          className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
            activeTab === "all_shops"
              ? "bg-[#D4F638] text-[#0A0D02] shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          All Shops
        </button>

        <button
          type="button"
          onClick={() => onTabChange("ledger")}
          className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
            activeTab === "ledger"
              ? "bg-[#D4F638] text-[#0A0D02] shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Dues &amp; Ledger
        </button>
      </nav>

      {/* Right Actions: Search + Dues Badge + Lime "+ Add Shop" */}
      <div className="flex items-center gap-3">
        {/* Search input (⌘K) */}
        <div className="hidden lg:flex items-center bg-[#13141C] border border-white/[0.08] rounded-full px-3 py-1.5 w-60">
          <Search size={14} className="text-zinc-500 mr-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search 50 shops (⌘K)..."
            className="w-full bg-transparent text-white placeholder:text-zinc-600 focus:outline-none text-xs"
          />
        </div>

        {/* Route Dues Pill */}
        <div className="hidden md:flex items-center px-3 py-1.5 rounded-full bg-[#181924] border border-white/[0.08] font-mono text-xs font-bold text-white">
          <span className="text-zinc-500 text-[10px] mr-1.5">DUES:</span>
          <span className="text-amber-400">₹{totalDue.toLocaleString("en-IN")}</span>
        </div>

        {/* The CDNX Electric Lime Action Pill Button (Matching Image 1 "Deposit") */}
        <button
          type="button"
          onClick={onOpenAddShop}
          className="px-4 py-2 bg-[#D4F638] hover:bg-[#C2E426] text-[#0A0D02] font-bold text-xs font-mono rounded-full flex items-center gap-1.5 shadow-md transition-all active:scale-95"
        >
          <Plus size={15} strokeWidth={3} />
          <span>Add Shop</span>
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#1F202D] border border-white/[0.1] flex items-center justify-center font-bold text-xs text-white font-mono">
          K
        </div>
      </div>
    </header>
  );
};
