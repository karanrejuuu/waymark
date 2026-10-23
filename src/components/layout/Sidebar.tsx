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
  PlusCircle,
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
    { href: "/routes", label: "Routes", icon: Compass },
    { href: "/regions", label: "Manage Sectors", icon: Map },
    ...(userRole === "owner" ? [{ href: "/team", label: "Team", icon: Users }] : []),
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#CBD5E1] h-screen sticky top-0 flex-shrink-0 flex flex-col justify-between hidden md:flex select-none z-30">
      <div className="p-5">
        {/* Brand header */}
        <div className="flex items-center justify-between mb-6 px-1">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-[#92400E] text-white flex items-center justify-center font-bold text-sm font-heading shadow-xs">
              W
            </span>
            <span className="font-heading font-extrabold text-base tracking-tight text-[#0F172A]">
              Waymark
            </span>
          </Link>
          <span className="text-xs font-bold text-[#92400E] px-2 py-0.5 rounded bg-[#FEF3C7] border border-[#FDE68A]">
            FMCG
          </span>
        </div>

        {/* Quick Add Shop Button */}
        <Link
          href="/shops/new"
          className="w-full mb-5 py-2.5 px-3 bg-[#0F172A] hover:bg-[#92400E] rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          <PlusCircle size={15} />
          <span>New Kirana Shop</span>
        </Link>

        {/* Nav Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] shadow-xs"
                    : "text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                }`}
              >
                <Icon
                  size={16}
                  className={isActive ? "text-[#92400E]" : "text-[#475569]"}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Sign Out */}
      <div className="p-4 border-t border-[#E2E8F0] bg-[#FAF8F5] text-xs text-[#475569]">
        <div className="flex items-center justify-between mb-2">
          <div className="truncate max-w-[150px]">
            <div className="truncate font-bold text-[#0F172A]">
              {user?.user_metadata?.name || user?.email?.split("@")[0] || "Agency Dispatcher"}
            </div>
            <div className="truncate text-xs text-[#475569]">
              {user?.email || "Offline Account"}
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            title="Sign out of account"
            className="p-1.5 text-[#475569] hover:text-[#DC2626] rounded-lg hover:bg-white transition-colors"
          >
            <LogOut size={15} />
          </button>
        </div>
        <div className="flex items-center justify-between text-xs text-[#475569] pt-2 border-t border-[#E2E8F0]">
          <span className="font-medium">IndexedDB Offline Sync</span>
          <span className="w-2 h-2 rounded-full bg-[#065F46]" />
        </div>
      </div>
    </aside>
  );
};
