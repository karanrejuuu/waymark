"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, Compass, PlusCircle, Settings } from "lucide-react";

export const BottomTabBar: React.FC = () => {
  const pathname = usePathname();

  const tabs = [
    { href: "/", label: "Today", icon: CalendarCheck },
    { href: "/routes", label: "Routes", icon: Compass },
    { href: "/shops/new", label: "Add Shop", icon: PlusCircle },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav
      role="tablist"
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#CBD5E1] flex items-center justify-around h-14 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_8px_rgba(15,23,42,0.04)] select-none"
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
            className={`flex-1 flex flex-col items-center justify-center h-full min-h-[44px] gap-0.5 text-xs transition-colors ${
              isActive
                ? "text-[#92400E] font-bold"
                : "text-[#475569] hover:text-[#0F172A]"
            }`}
          >
            <Icon size={19} className={isActive ? "text-[#92400E]" : "text-[#475569]"} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
