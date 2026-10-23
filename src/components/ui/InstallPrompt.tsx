"use client";

import React, { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if dismissed before in this session
    const isDismissed = sessionStorage.getItem("pwa_dismissed");
    if (isDismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem("pwa_dismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <div className="bg-bg-subtle border-b border-border py-2 px-4 text-xs flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-text-primary min-w-0">
        <Download size={14} className="text-accent flex-shrink-0" />
        <span className="truncate">
          Install Waymark for offline use on your phone
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={handleInstall}
          className="px-2.5 py-1 bg-[#0F172A] text-white font-semibold rounded hover:bg-[#1E293B]"
        >
          Install
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 text-text-tertiary hover:text-text-primary"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
