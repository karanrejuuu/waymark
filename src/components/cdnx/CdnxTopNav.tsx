"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Sun,
  Moon,
  Clock,
  CheckCircle2,
  Calendar,
  Settings,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";

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
  const { user, signOut } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Supplier";
  const userInitial = userName.charAt(0).toUpperCase();
  const businessName = user?.user_metadata?.business_name || "Apex FMCG";

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0C0D12]/90 backdrop-blur-md border-b border-black/[0.08] dark:border-white/[0.08] px-3 sm:px-6 h-16 flex items-center justify-between select-none transition-colors duration-200">
      {/* Left: Brand + Corridor Status Pill */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-base sm:text-lg font-black tracking-tight text-zinc-950 dark:text-white font-sans">
            WAYMARK
          </span>
        </Link>

        {/* Live Route Dot Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-[#181924] border border-black/[0.06] dark:border-white/[0.06] text-[11px] font-mono text-zinc-700 dark:text-zinc-300">
          <span className="w-2 h-2 rounded-full bg-[#D4F638] animate-pulse" />
          <span className="font-semibold">{activeRouteName} Beat</span>
          <span className="text-zinc-400 dark:text-zinc-600">·</span>
          <span className="text-zinc-500 dark:text-zinc-400">Live</span>
        </div>
      </div>

      {/* Center Tabs: Today | All Shops | Dues & Ledger */}
      <nav className="flex items-center gap-0.5 sm:gap-1 bg-zinc-100 dark:bg-[#13141C] border border-black/[0.06] dark:border-white/[0.06] p-0.5 sm:p-1 rounded-full">
        <button
          type="button"
          onClick={() => onTabChange("today")}
          className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
            activeTab === "today"
              ? "bg-[#D4F638] text-[#0A0D02] shadow-sm"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
          }`}
        >
          <span className="sm:hidden">Today</span>
          <span className="hidden sm:inline">Today&apos;s Run</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("all_shops")}
          className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
            activeTab === "all_shops"
              ? "bg-[#D4F638] text-[#0A0D02] shadow-sm"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
          }`}
        >
          <span className="sm:hidden">Shops</span>
          <span className="hidden sm:inline">All Shops</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("ledger")}
          className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
            activeTab === "ledger"
              ? "bg-[#D4F638] text-[#0A0D02] shadow-sm"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
          }`}
        >
          <span className="sm:hidden">Dues</span>
          <span className="hidden sm:inline">Dues &amp; Ledger</span>
        </button>
      </nav>

      {/* Right Actions: Dues Badge + Light/Dark Toggle + Lime "+ Add Shop" + User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-3">
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
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-100 dark:bg-[#181924] hover:bg-zinc-200 dark:hover:bg-[#202230] border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center text-zinc-700 dark:text-zinc-300 transition-all active:scale-90"
        >
          {theme === "dark" ? (
            <Sun size={15} className="text-[#D4F638]" />
          ) : (
            <Moon size={15} className="text-indigo-600" />
          )}
        </button>

        {/* The CDNX Electric Lime Action Pill Button */}
        <button
          type="button"
          onClick={onOpenAddShop}
          className="px-3 sm:px-4 py-2 bg-[#D4F638] hover:bg-[#C2E426] text-[#0A0D02] font-bold text-xs font-mono rounded-full flex items-center gap-1.5 shadow-md transition-all active:scale-95"
        >
          <Plus size={14} strokeWidth={3} />
          <span className="hidden sm:inline">Add Shop</span>
        </button>

        {/* User Profile Avatar with Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setShowProfileMenu((prev) => !prev)}
            className="w-8 h-8 rounded-full bg-purple-600/20 dark:bg-[#1F202D] border border-purple-500/30 dark:border-white/[0.1] flex items-center justify-center font-bold text-xs text-purple-900 dark:text-[#D4F638] font-mono hover:scale-105 transition-all"
            title={userName}
          >
            {userInitial}
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#161724] border border-black/[0.08] dark:border-white/[0.08] shadow-2xl py-2 z-50 text-xs animate-in fade-in slide-in-from-top-2">
              <div className="px-3.5 py-2 border-b border-black/[0.06] dark:border-white/[0.06]">
                <p className="font-bold text-zinc-950 dark:text-white truncate">{userName}</p>
                <p className="text-[11px] text-zinc-500 font-mono truncate">{businessName}</p>
                {user?.email && (
                  <p className="text-[10px] text-zinc-400 font-mono truncate mt-0.5">{user.email}</p>
                )}
              </div>

              <div className="py-1">
                <Link
                  href="/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2 px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-white/[0.05] text-zinc-700 dark:text-zinc-200 font-mono"
                >
                  <Settings size={14} className="text-zinc-400" />
                  <span>Enterprise Settings</span>
                </Link>

                <button
                  type="button"
                  onClick={async () => {
                    setShowProfileMenu(false);
                    await signOut();
                  }}
                  className="w-full text-left flex items-center gap-2 px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-mono"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
