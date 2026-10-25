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
    <aside className="w-64 bg-[#0B0F19] border-r border-white/[0.08] h-screen sticky top-0 flex-shrink-0 flex flex-col justify-between hidden md:flex select-none z-30">
      <div className="p-5">
        {/* Brand header */}
        <div className="flex items-center justify-between mb-6 px-1">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs font-mono shadow-sm">
              W
            </span>
            <span className="font-sans font-bold text-base tracking-tight text-[#F8FAFC]">
              WAYMARK
            </span>
          </Link>
          <span className="text-xs font-mono font-bold text-[#3B82F6] px-2 py-0.5 rounded-full bg-[#2563EB]/15 border border-[#3B82F6]/30">
            FMCG
          </span>
        </div>

        {/* Quick Add Store Button (Cadnex Lime CTA) */}
        <Link
          href="/shops/new"
          className="w-full mb-5 py-2.5 px-3 bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
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
                    ? "bg-[#2563EB] text-white shadow-sm"
                    : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]"
                }`}
              >
                <Icon
                  size={16}
                  className={isActive ? "text-white" : "text-[#94A3B8]"}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Sign Out */}
      <div className="p-4 border-t border-white/[0.08] bg-[#0B0F19] text-xs font-mono text-[#94A3B8]">
        <div className="flex items-center justify-between mb-2">
          <div className="truncate max-w-[150px]">
            <div className="truncate font-bold text-[#F8FAFC]">
              {user?.user_metadata?.name || user?.email?.split("@")[0] || "Agency Dispatcher"}
            </div>
            <div className="truncate text-xs text-zinc-400">
              {user?.email || "Offline Account"}
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            title="Sign out of agency"
            className="p-1.5 text-[#94A3B8] hover:text-[#FDA4AF] rounded-lg hover:bg-[#1E293B] transition-colors"
          >
            <LogOut size={15} />
          </button>
        </div>
        <div className="flex items-center justify-between text-xs pt-2 border-t border-white/[0.06]">
          <span className="text-[#94A3B8]">IndexedDB Offline Engine</span>
          <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
        </div>
      </div>
    </aside>
  );
};
