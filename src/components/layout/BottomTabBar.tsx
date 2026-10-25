"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, Compass, Plus, Settings } from "lucide-react";

export const BottomTabBar: React.FC = () => {
  const pathname = usePathname();

  const tabs = [
    { href: "/", label: "Dispatch", icon: CalendarCheck },
    { href: "/routes", label: "Routes", icon: Compass },
    { href: "/shops/new", label: "New Store", icon: Plus },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav
      role="tablist"
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F19]/90 backdrop-blur-xl border-t border-white/[0.08] flex items-center justify-around h-16 pb-[env(safe-area-inset-bottom)] shadow-float select-none"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={isActive}
            className={`flex-1 flex flex-col items-center justify-center h-full min-h-[44px] gap-1 text-[11px] font-mono transition-colors ${
              isActive
                ? "text-[#3B82F6] font-bold"
                : "text-[#94A3B8] hover:text-[#F8FAFC]"
            }`}
          >
            <Icon size={18} className={isActive ? "text-[#3B82F6]" : "text-[#94A3B8]"} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
