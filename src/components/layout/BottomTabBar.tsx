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
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg/95 backdrop-blur-md border-t border-border flex items-center justify-around h-14 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_3px_rgba(0,0,0,0.02)] select-none"
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
            className={`flex-1 flex flex-col items-center justify-center h-full min-h-[44px] gap-0.5 text-[11px] transition-colors ${
              isActive
                ? "text-accent font-semibold"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Icon size={18} className={isActive ? "text-accent" : "text-text-secondary"} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
