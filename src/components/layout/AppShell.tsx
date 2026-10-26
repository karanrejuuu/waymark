"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { BottomTabBar } from "./BottomTabBar";
import { InstallPrompt } from "../ui/InstallPrompt";
import { requestPersistentStorage } from "@/lib/db/durability";
import { useAuth } from "@/context/AuthContext";

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const isStandalonePage =
    pathname === "/" ||
    pathname === "/welcome" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/onboarding";

  useEffect(() => {
    // 1. Request persistent storage from browser to prevent automatic cache/IndexedDB eviction
    requestPersistentStorage();

    // 2. Register service worker on mount in production/PWA mode
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("ServiceWorker registration failed:", err);
      });
    }
  }, []);

  if (isStandalonePage) {
    return (
      <div className="min-h-screen bg-bg">
        <InstallPrompt />
        <main className="min-w-0">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <InstallPrompt />
        <main className="flex-1 min-w-0 pb-20 md:pb-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <BottomTabBar />
    </div>
  );
};
