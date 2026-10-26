"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Truck,
  Plus,
  IndianRupee,
  Clock,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
  Sparkles,
  MapPin,
  Calendar,
  Store,
  Compass,
  FileText,
  ChevronRight,
  ShieldCheck,
  Check,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export const LandingShowcase: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  // Interactive Walk-to-Car Simulator State
  const [cratesDelivered, setCratesDelivered] = useState(3);
  const [selectedOutcome, setSelectedOutcome] = useState<"delivered_paid" | "delivered_unpaid" | "no_order" | "shop_closed">("delivered_paid");
  const [paymentAmount, setPaymentAmount] = useState("1450");
  const [reminderDays, setReminderDays] = useState<number>(3);
  const [reminderNote, setReminderNote] = useState("Check Frooti stock & collect ₹1,450 cheque from manager before 11 AM");
  const [isSaved, setIsSaved] = useState(false);

  const handleSimulateSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3500);
  };

  return (
    <div className="min-h-screen bg-[#F4F5F8] dark:bg-[#0C0D12] text-zinc-950 dark:text-white flex flex-col font-sans selection:bg-[#D4F638] selection:text-[#0A0D02] transition-colors duration-200">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0C0D12]/90 backdrop-blur-md border-b border-black/[0.08] dark:border-white/[0.08] px-4 md:px-8 h-16 flex items-center justify-between transition-colors duration-200">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-zinc-950 dark:text-white font-sans">
              WAYMARK
            </span>
          </Link>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-[#181924] border border-black/[0.06] dark:border-white/[0.06] text-[11px] font-mono text-zinc-700 dark:text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-[#D4F638] animate-pulse" />
            <span>Supplier Field System</span>
            <span className="text-zinc-400 dark:text-zinc-600">·</span>
            <span className="text-zinc-500 dark:text-zinc-400">Fort Kochi Run</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-[#181924] hover:bg-zinc-200 dark:hover:bg-[#202230] border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center text-zinc-700 dark:text-zinc-300 transition-all active:scale-90"
          >
            {theme === "dark" ? (
              <Sun size={16} className="text-[#D4F638]" />
            ) : (
              <Moon size={16} className="text-indigo-600" />
            )}
          </button>

          <Link
            href="/login"
            className="px-3.5 py-1.5 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white rounded-full border border-black/[0.08] dark:border-white/[0.08] transition-all"
          >
            Sign In
          </Link>

          <Link
            href="/signup"
            className="px-4 py-2 bg-[#D4F638] hover:bg-[#C2E426] text-[#0A0D02] font-bold text-xs font-mono rounded-full flex items-center gap-1.5 shadow-md transition-all active:scale-95"
          >
            <span>Create Account</span>
            <ArrowRight size={14} strokeWidth={2.5} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl w-full mx-auto px-4 md:px-8 pt-12 pb-16 space-y-12">
        {/* Indigo Glow CDNX Hero Banner */}
        <div className="rounded-3xl p-6 md:p-10 bg-gradient-to-r from-[#1C1938] via-[#16172B] to-[#10111F] border border-purple-500/20 shadow-2xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181924] border border-white/[0.08] text-[11px] font-mono text-[#D4F638]">
              <Sparkles size={13} />
              <span>THE SUPPLIER WALK-TO-CAR FIELD PLAYBOOK</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Supplying 50 Kirana stores today?{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-[#D4F638]">
                Log updates in 10 seconds
              </span>{" "}
              while walking back to your vehicle.
            </h1>

            <p className="text-sm md:text-base text-zinc-300 leading-relaxed max-w-2xl">
              No paper diaries. No forgotten phone calls. Unload the crates at the shop counter, pull out your phone while walking to your tempo, and tap four buttons.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/signup"
                className="px-6 py-3.5 bg-[#D4F638] hover:bg-[#C2E426] text-[#0A0D02] font-bold text-xs font-mono rounded-2xl flex items-center gap-2 shadow-lg transition-all active:scale-95"
              >
                <span>Create Agency Account</span>
                <ArrowRight size={15} strokeWidth={2.5} />
              </Link>
              <Link
                href="/login"
                className="px-5 py-3.5 bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-white font-semibold text-xs font-mono rounded-2xl transition-colors flex items-center gap-1.5"
              >
                <span>Sign In to Terminal</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#13141C] border border-black/[0.08] dark:border-white/[0.08] space-y-3 shadow-sm transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-[#D4F638] flex items-center justify-center font-mono font-bold text-sm">
              01
            </div>
            <h3 className="text-lg font-bold text-zinc-950 dark:text-white tracking-tight">
              Named Corridors, No GPS Clutter
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Every shop is grouped into its natural trading route (Fort Kochi, Mattancherry, Marine Drive). Forget GPS map failures in narrow wholesale alleys.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-[#13141C] border border-black/[0.08] dark:border-white/[0.08] space-y-3 shadow-sm transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-[#D4F638] flex items-center justify-center font-mono font-bold text-sm">
              02
            </div>
            <h3 className="text-lg font-bold text-zinc-950 dark:text-white tracking-tight">
              One-Tap Scheduled Reminders
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Kirana keeper says "come back in 3 days with 2 crates and collect ₹1450 cheque"? Tap "In 3 Days", write note, and the shop automatically re-appears on Home on that date.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-[#13141C] border border-black/[0.08] dark:border-white/[0.08] space-y-3 shadow-sm transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-[#D4F638] flex items-center justify-center font-mono font-bold text-sm">
              03
            </div>
            <h3 className="text-lg font-bold text-zinc-950 dark:text-white tracking-tight">
              New Shop On The Road
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Spotted a new provision store on Beach Road? Tap the neon "+ Add Shop" button. Corridor is pre-selected as Fort Kochi; save once and it's permanently logged in offline database.
            </p>
          </div>
        </div>

        {/* Interactive Walk-to-Car Simulator Section */}
        <div id="simulator" className="p-6 md:p-10 rounded-3xl bg-white dark:bg-[#13141C] border border-black/[0.08] dark:border-white/[0.08] space-y-8 shadow-sm transition-colors">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-purple-600 dark:text-[#D4F638]" />
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-[#D4F638]">
                Interactive Simulator
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
              Try the 10-Second Walk-to-Car Slip
            </h2>
            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Imagine you just walked out of <strong className="text-zinc-950 dark:text-white">St. Antony&apos;s Bakers &amp; Provisions</strong> in Princess Street, Fort Kochi. Practice how fast you can record the delivery before reaching your car:
            </p>
          </div>

          {/* Simulator Mock Cockpit */}
          <div className="max-w-md mx-auto rounded-3xl bg-zinc-50 dark:bg-[#161722] border border-black/[0.1] dark:border-white/[0.1] p-5 space-y-5 shadow-2xl transition-colors">
            {/* Store Header */}
            <div className="flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-purple-700 dark:text-[#D4F638] uppercase tracking-wider">
                  Stop #1 · Fort Kochi Beat
                </span>
                <h4 className="font-bold text-zinc-950 dark:text-white text-base">St. Antony&apos;s Bakers &amp; Provisions</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Princess Street, near Basilica</p>
              </div>
              <div className="text-right">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-mono text-[10px] font-bold">
                  ₹1,450 Due
                </span>
              </div>
            </div>

            {/* Step 1: Outcome chips */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 uppercase font-bold">
                1. Visit Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "delivered_paid", label: "Delivered & Paid" },
                  { id: "delivered_unpaid", label: "Delivered (Credit)" },
                  { id: "no_order", label: "No Order / Full" },
                  { id: "shop_closed", label: "Shop Closed" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedOutcome(opt.id as any)}
                    className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold transition-all text-left ${
                      selectedOutcome === opt.id
                        ? "bg-[#D4F638] text-[#0A0D02] border-[#D4F638] shadow-sm"
                        : "bg-white dark:bg-[#1A1B24] border-black/[0.08] dark:border-white/[0.06] text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Crates */}
            <div className="space-y-2 p-3 bg-white dark:bg-[#1A1B24] rounded-2xl border border-black/[0.06] dark:border-white/[0.06] shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 font-bold">
                  2. Crates Supplied
                </span>
                <span className="font-mono text-sm font-bold text-emerald-700 dark:text-[#D4F638]">
                  {cratesDelivered} Crates
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[+1, +2, +5, +10].map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => setCratesDelivered((prev) => prev + inc)}
                    className="py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-[#232532] dark:hover:bg-[#2C2E3E] text-zinc-900 dark:text-white font-mono font-bold rounded-lg border border-black/[0.06] dark:border-white/[0.06] text-xs transition-all active:scale-95 shadow-sm"
                  >
                    +{inc}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Scheduled Reminder Preset */}
            <div className="space-y-2 p-3 bg-purple-50/50 dark:bg-[#1C182E] rounded-2xl border border-purple-200 dark:border-purple-500/20 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-purple-900 dark:text-purple-300 font-bold">
                  3. Set Scheduled Return
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                  {reminderDays} Days later
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { d: 1, label: "Tomorrow" },
                  { d: 2, label: "2 Days" },
                  { d: 3, label: "3 Days" },
                  { d: 7, label: "1 Week" },
                ].map((preset) => (
                  <button
                    key={preset.d}
                    type="button"
                    onClick={() => setReminderDays(preset.d)}
                    className={`py-1.5 text-center font-mono text-[11px] font-bold rounded-xl border transition-all ${
                      reminderDays === preset.d
                        ? "bg-[#D4F638] text-[#0A0D02] border-[#D4F638] shadow-sm"
                        : "bg-white dark:bg-[#232532] text-zinc-700 dark:text-zinc-300 border-black/[0.08] dark:border-white/[0.06]"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={reminderNote}
                onChange={(e) => setReminderNote(e.target.value)}
                className="w-full bg-white dark:bg-[#13141C] border border-black/[0.1] dark:border-white/[0.1] rounded-xl px-2.5 py-1.5 text-xs text-zinc-950 dark:text-white font-medium focus:outline-none focus:border-indigo-500 dark:focus:border-[#D4F638] shadow-sm"
              />
            </div>

            {/* CTA */}
            <div>
              <button
                type="button"
                onClick={handleSimulateSave}
                className="w-full py-4 bg-[#D4F638] hover:bg-[#C2E426] text-[#0A0D02] rounded-2xl font-bold font-sans text-sm flex items-center justify-center gap-2 shadow-xl transition-all active:scale-[0.98]"
              >
                {isSaved ? (
                  <>
                    <Check size={18} strokeWidth={3} />
                    <span>Saved! Next Shop in Fort Kochi Auto-Cued!</span>
                  </>
                ) : (
                  <>
                    <span>Save &amp; Complete Stop &rarr;</span>
                  </>
                )}
              </button>

              {isSaved && (
                <div className="mt-2 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-mono text-center animate-in fade-in">
                  ✓ Recorded 3 Crates · S1 marked complete · Reminder set for 3 days · Cochin Spice Traders auto-opened!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Markdown Guide Announcement Box */}
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#13141C] border border-black/[0.08] dark:border-white/[0.08] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm transition-colors">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-purple-600 dark:text-[#D4F638]" />
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-[#D4F638]">
                Complete Field Documentation
              </span>
            </div>
            <h3 className="text-xl font-bold text-zinc-950 dark:text-white tracking-tight">
              Looking for the full routes &amp; packaging guide?
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed">
              We have compiled a complete field reference covering corridor boundaries (Fort Kochi, Mattancherry, Marine Drive), product crate specifications, the 7 visit outcomes, and khata dues settlement.
            </p>
          </div>

          <Link
            href="/"
            className="px-6 py-3.5 bg-[#D4F638] hover:bg-[#C2E426] text-[#0A0D02] font-bold text-xs font-mono rounded-2xl flex items-center gap-2 shadow-lg transition-all active:scale-95 flex-shrink-0"
          >
            <span>Launch Live Dashboard</span>
            <ArrowRight size={15} strokeWidth={2.5} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/[0.08] dark:border-white/[0.08] py-8 text-center text-xs font-mono text-zinc-500">
        <p>Waymark FMCG Wholesale Line · Fort Kochi &amp; Regional Beats · Offline IndexedDB Engine</p>
      </footer>
    </div>
  );
};
