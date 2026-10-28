"use client";

import React from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Sun,
  Moon,
  Clock,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

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
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0C0D12]/90 backdrop-blur-md border-b border-black/[0.08] dark:border-white/[0.08] px-4 md:px-6 h-16 flex items-center justify-between select-none transition-colors duration-200">
      {/* Left: Brand + Corridor Status Pill */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-black tracking-tight text-zinc-950 dark:text-white font-sans">
            WAYMARK
          </span>
        </Link>

        {/* Live Route Dot Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-[#181924] border border-black/[0.06] dark:border-white/[0.06] text-[11px] font-mono text-zinc-700 dark:text-zinc-300">
          <span className="w-2 h-2 rounded-full bg-[#D4F638] animate-pulse" />
          <span className="font-semibold">{activeRouteName} Beat</span>
          <span className="text-zinc-400 dark:text-zinc-600">·</span>
          <span className="text-zinc-500 dark:text-zinc-400">Offline Active</span>
        </div>
      </div>

      {/* Center Tabs: Today's Run | All Shops | Dues & Ledger */}
      <nav className="flex items-center gap-1 bg-zinc-100 dark:bg-[#13141C] border border-black/[0.06] dark:border-white/[0.06] p-1 rounded-full">
        <button
          type="button"
          onClick={() => onTabChange("today")}
          className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
            activeTab === "today"
              ? "bg-[#D4F638] text-[#0A0D02] shadow-sm"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
          }`}
        >
          Today&apos;s Run
        </button>

        <button
          type="button"
          onClick={() => onTabChange("all_shops")}
          className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
            activeTab === "all_shops"
              ? "bg-[#D4F638] text-[#0A0D02] shadow-sm"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
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
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
          }`}
        >
          Dues &amp; Ledger
        </button>
      </nav>

      {/* Right Actions: Search + Dues Badge + Light/Dark Toggle + Lime "+ Add Shop" */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search input (⌘K) */}
        <div className="hidden lg:flex items-center bg-white dark:bg-[#13141C] border border-black/[0.08] dark:border-white/[0.08] rounded-full px-3 py-1.5 w-56 shadow-sm">
          <Search size={14} className="text-zinc-400 dark:text-zinc-500 mr-2 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search 50 shops (⌘K)..."
            className="w-full bg-transparent text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none text-xs"
          />
        </div>

        {/* Route Dues Pill */}
        <div className="hidden md:flex items-center px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-[#181924] border border-black/[0.08] dark:border-white/[0.08] font-mono text-xs font-bold text-zinc-900 dark:text-white">
          <span className="text-zinc-500 text-[10px] mr-1.5">DUES:</span>
          <span className="text-amber-600 dark:text-amber-400">₹{totalDue.toLocaleString("en-IN")}</span>
        </div>

        {/* Theme Toggle Button (Light Mode / Dark Mode) */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-[#181924] hover:bg-zinc-200 dark:hover:bg-[#202230] border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center text-zinc-700 dark:text-zinc-300 transition-all active:scale-90"
        >
          {theme === "dark" ? (
            <Sun size={16} className="text-[#D4F638]" />
          ) : (
            <Moon size={16} className="text-indigo-600" />
          )}
        </button>

        {/* The CDNX Electric Lime Action Pill Button */}
        <button
          type="button"
          onClick={onOpenAddShop}
          className="px-3.5 sm:px-4 py-2 bg-[#D4F638] hover:bg-[#C2E426] text-[#0A0D02] font-bold text-xs font-mono rounded-full flex items-center gap-1.5 shadow-md transition-all active:scale-95"
        >
          <Plus size={15} strokeWidth={3} />
          <span className="hidden sm:inline">Add Shop</span>
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-[#1F202D] border border-black/[0.1] dark:border-white/[0.1] flex items-center justify-center font-bold text-xs text-zinc-900 dark:text-white font-mono">
          K
        </div>
      </div>
    </header>
  );
};
