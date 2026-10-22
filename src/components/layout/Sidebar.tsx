"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  Compass,
  Store,
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
    { href: "/", label: "Today", icon: CalendarCheck },
    { href: "/routes", label: "Routes", icon: Compass },
    { href: "/regions", label: "Manage Routes", icon: Map },
    ...(userRole === "owner" ? [{ href: "/team", label: "Team", icon: Users }] : []),
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-60 bg-bg-subtle border-r border-border h-screen sticky top-0 flex-shrink-0 flex flex-col justify-between hidden md:flex select-none">
      <div className="p-4">
        {/* Brand header */}
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent flex-shrink-0" />
            <span className="font-semibold text-sm tracking-tight text-text-primary">
              Waymark
            </span>
          </div>
          <span className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-bg border border-border">
            FMCG
          </span>
        </div>

        {/* Quick Add Shop Button */}
        <Link
          href="/shops/new"
          className="w-full mb-4 py-1.5 px-2.5 bg-bg border border-border hover:border-text-secondary rounded-md text-xs font-medium text-text-primary flex items-center justify-center gap-1.5 transition-colors shadow-sm"
        >
          <PlusCircle size={14} className="text-accent" />
          <span>New Shop</span>
        </Link>

        {/* Nav Links */}
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-bg text-text-primary border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] font-semibold"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                }`}
              >
                <Icon
                  size={16}
                  className={isActive ? "text-accent" : "text-text-secondary"}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Sign Out */}
      <div className="p-4 border-t border-border/80 text-[11px] text-text-tertiary">
        <div className="flex items-center justify-between mb-2">
          <div className="truncate max-w-[130px]">
            <div className="truncate font-semibold text-text-primary text-xs">
              {user?.user_metadata?.name || user?.email?.split("@")[0] || "Distributor"}
            </div>
            <div className="truncate text-[10px] text-text-tertiary">
              {user?.email || "Offline Account"}
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            title="Sign out of account"
            className="p-1.5 text-text-tertiary hover:text-[#D64545] rounded-md hover:bg-bg transition-colors"
          >
            <LogOut size={14} />
          </button>
        </div>
        <div className="flex items-center justify-between text-[10px] text-text-tertiary pt-1 border-t border-border/50">
          <span>PWA Sync Ready</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#1F9D6B]" />
        </div>
      </div>
    </aside>
  );
};
