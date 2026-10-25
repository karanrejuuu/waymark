"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  Compass,
  Map,
  Users,
  Settings,
  Plus,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  userRole?: "owner" | "delivery";
}

export const Sidebar: React.FC<SidebarProps> = ({ userRole = "owner" }) => {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const navItems = [
    { href: "/", label: "Today's Dispatch", icon: CalendarCheck },
    { href: "/routes", label: "Routes & Sectors", icon: Compass },
    { href: "/regions", label: "Manage Sectors", icon: Map },
    ...(userRole === "owner" ? [{ href: "/team", label: "Team & Drivers", icon: Users }] : []),
    { href: "/settings", label: "Agency Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0D0D11] border-r border-white/[0.08] h-screen sticky top-0 flex-shrink-0 flex flex-col justify-between hidden md:flex select-none z-30">
      <div className="p-5">
        {/* Brand header */}
        <div className="flex items-center justify-between mb-6 px-1">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-[#B5F23D] text-[#0C1004] flex items-center justify-center font-bold text-xs font-mono shadow-sm">
              W
            </span>
            <span className="font-sans font-bold text-base tracking-tight text-[#F4F4F6]">
              WAYMARK
            </span>
          </Link>
          <span className="text-[10px] font-mono font-bold text-[#B5F23D] px-2 py-0.5 rounded-full bg-[#B5F23D]/10 border border-[#B5F23D]/25">
            FMCG
          </span>
        </div>

        {/* Quick Add Store Button (Cadnex Lime CTA) */}
        <Link
          href="/shops/new"
          className="w-full mb-5 py-2.5 px-3 bg-[#B5F23D] hover:bg-[#A3DE30] rounded-xl text-xs font-bold text-[#0C1004] flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>New Kirana Store</span>
        </Link>

        {/* Nav Links */}
        <nav className="space-y-1 font-mono text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition-all ${
                  isActive
                    ? "bg-[#B5F23D] text-[#0C1004] shadow-sm"
                    : "text-[#8C8C96] hover:text-[#F4F4F6] hover:bg-[#1B1B20]"
                }`}
              >
                <Icon
                  size={16}
                  className={isActive ? "text-[#0C1004]" : "text-[#8C8C96]"}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Sign Out */}
      <div className="p-4 border-t border-white/[0.08] bg-[#0A0A0C] text-xs font-mono text-[#8C8C96]">
        <div className="flex items-center justify-between mb-2">
          <div className="truncate max-w-[150px]">
            <div className="truncate font-bold text-[#F4F4F6]">
              {user?.user_metadata?.name || user?.email?.split("@")[0] || "Agency Dispatcher"}
            </div>
            <div className="truncate text-[11px] text-[#54545E]">
              {user?.email || "Offline Account"}
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            title="Sign out of agency"
            className="p-1.5 text-[#8C8C96] hover:text-[#F43F5E] rounded-lg hover:bg-[#1B1B20] transition-colors"
          >
            <LogOut size={15} />
          </button>
        </div>
        <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/[0.06]">
          <span className="text-[#8C8C96]">IndexedDB Offline Engine</span>
          <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
        </div>
      </div>
    </aside>
  );
};
