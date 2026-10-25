"use client";

import React, { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
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
    <div className="bg-[#131316] border-b border-white/[0.08] py-2 px-4 text-xs flex items-center justify-between gap-3 text-zinc-200">
      <div className="flex items-center gap-2 min-w-0">
        <Download size={14} className="text-[#B5F23D] shrink-0" />
        <span className="truncate">
          Install Waymark app on your mobile device for offline godown & route access
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleInstall}
          className="px-3 py-1 bg-[#B5F23D] text-[#0C1004] font-semibold text-xs rounded-lg hover:bg-[#c4f84c] transition-colors"
        >
          Install App
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 text-zinc-500 hover:text-zinc-200"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
