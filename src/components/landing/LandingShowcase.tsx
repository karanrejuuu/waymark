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
} from "lucide-react";

export const LandingShowcase: React.FC = () => {
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
    <div className="min-h-screen bg-[#0C0D12] text-white flex flex-col font-sans selection:bg-[#D4F638] selection:text-[#0A0D02]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0C0D12]/90 backdrop-blur-md border-b border-white/[0.08] px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-white font-sans">
              WAYMARK
            </span>
          </Link>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#181924] border border-white/[0.06] text-[11px] font-mono text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-[#D4F638] animate-pulse" />
            <span>Supplier Field System</span>
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-400">Fort Kochi Run</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 bg-[#D4F638] hover:bg-[#C2E426] text-[#0A0D02] font-bold text-xs font-mono rounded-full flex items-center gap-1.5 shadow-md transition-all active:scale-95"
          >
            <span>Launch Cockpit</span>
            <ArrowRight size={14} strokeWidth={2.5} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl w-full mx-auto px-4 md:px-8 pt-12 pb-16 space-y-12">
        {/* Indigo Glow CDNX Hero Banner */}
        <div className="rounded-3xl p-6 md:p-10 bg-gradient-to-r from-[#1C1938] via-[#16172B] to-[#10111F] border border-purple-500/20 shadow-2xl relative overflow-hidden">
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

            <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
              No paper diaries. No forgotten store requests. When you deliver to a shop in Fort Kochi, tap crates, record cash/credit, and schedule your next visit reminder right on your phone.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="px-6 py-3.5 bg-[#D4F638] hover:bg-[#C2E426] text-[#0A0D02] font-bold text-xs font-mono rounded-full flex items-center gap-2 shadow-lg transition-all active:scale-95"
              >
                <Truck size={16} strokeWidth={2.5} />
                <span>Open Fort Kochi Cockpit</span>
              </Link>

              <a
                href="#interactive-demo"
                className="px-5 py-3.5 bg-[#181924] hover:bg-[#202230] text-zinc-300 hover:text-white font-bold text-xs font-mono rounded-full border border-white/[0.08] transition-all"
              >
                Try Interactive Simulator &darr;
              </a>
            </div>
          </div>
        </div>

        {/* 4 Core Pillars of the Field Experience */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              icon: Compass,
              title: "Named Area Corridors",
              desc: "No broken GPS maps. Clean routes like Fort Kochi & Mattancherry that you and your driver already know.",
            },
            {
              icon: Truck,
              title: "10-Sec Walk-to-Car Slip",
              desc: "Drop the stock, walk to the car, tap +1, +2, +5 crate chips, and hit Save. Next shop cues up automatically.",
            },
            {
              icon: Clock,
              title: "Scheduled Reminders",
              desc: "Owner says 'come back in 3 days with extra stock'? Tap 3 Days — the shop auto-appears on Home on that exact date.",
            },
            {
              icon: Plus,
              title: "New Shop on the Road",
              desc: "Spot an unlisted shop while driving down Beach Road? Tap Add Shop with Fort Kochi pre-filled for 5-sec entry.",
            },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className="p-5 rounded-2xl bg-[#13141C] border border-white/[0.06] space-y-3 hover:border-white/[0.12] transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-[#181924] border border-white/[0.08] flex items-center justify-center text-[#D4F638]">
                  <Icon size={18} />
                </div>
                <h3 className="font-bold text-white text-sm tracking-tight">{card.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{card.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Interactive Walk-to-Car Simulator */}
        <div id="interactive-demo" className="pt-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D4F638]" />
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#D4F638]">
                  Interactive Simulator
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5">
                Experience the 10-Second Walk-to-Car Update
              </h2>
            </div>
            <span className="text-xs text-zinc-400 font-mono">
              Live interactive preview
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Kirana Stop Context Card */}
            <div className="lg:col-span-5 p-6 rounded-3xl bg-[#13141C] border border-white/[0.08] space-y-5">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono text-[10px] font-bold">
                  Stop #1 on Fort Kochi Beat
                </span>
                <span className="font-mono text-xs font-bold text-amber-400">
                  ₹1,450 Outstanding
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">St. Antony&apos;s Bakers &amp; Provisions</h3>
                <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
                  <MapPin size={13} className="text-[#D4F638]" />
                  Princess Street, near Santa Cruz Basilica · Fort Kochi
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#181924] border border-white/[0.06] space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
                  Scheduled Crate Replenishment
                </span>
                <div className="flex flex-wrap gap-2 text-xs font-mono">
                  <span className="px-2.5 py-1 rounded-lg bg-[#232532] text-zinc-300">
                    <span className="text-[#D4F638] font-bold mr-1">3</span> Parle-G Glucose (Cases)
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#232532] text-zinc-300">
                    <span className="text-[#D4F638] font-bold mr-1">2</span> Frooti Mango 200ml (Crates)
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-purple-300 font-bold font-mono text-[11px]">
                  <Clock size={13} className="text-[#D4F638]" />
                  <span>The Real-World Kirana Request:</span>
                </div>
                <p className="text-zinc-300 italic text-[11px] leading-relaxed">
                  &ldquo;Bhaiya, come back in 3 days on Friday before 11 AM with 2 extra Frooti crates, and I will hand you ₹1,450 by cheque.&rdquo;
                </p>
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed font-mono">
                &rarr; While walking back to your car, configure the slip on the right and tap Save!
              </p>
            </div>

            {/* Right: The Walk-to-Car Quick Slip Simulator */}
            <div className="lg:col-span-7 p-6 rounded-3xl bg-[#161722] border border-white/[0.1] shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D4F638] animate-pulse" />
                  <span className="font-mono text-xs font-bold uppercase text-[#D4F638]">
                    Live Walk-to-Car Slip
                  </span>
                </div>
                <span className="text-[11px] font-mono text-zinc-400">
                  Step-by-step
                </span>
              </div>

              {/* Outcome Selection */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                  1. Visit Status
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: "delivered_paid", label: "Delivered & Paid" },
                    { id: "delivered_unpaid", label: "Delivered (Credit)" },
                    { id: "no_order", label: "No Order / Full Stock" },
                    { id: "shop_closed", label: "Shop Closed" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedOutcome(opt.id as any)}
                      className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                        selectedOutcome === opt.id
                          ? "bg-[#1E1B38] border-[#D4F638] text-white"
                          : "bg-[#1A1B24] border-white/[0.06] text-zinc-400 hover:text-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Crates Increments (+1, +2, +5, +10) */}
              <div className="p-3.5 rounded-2xl bg-[#1A1B24] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-zinc-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Package size={13} className="text-[#D4F638]" />
                    2. Crates Supplied
                  </span>
                  <span className="font-mono font-bold text-[#D4F638] text-sm">
                    {cratesDelivered} Crates
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[+1, +2, +5, +10].map((inc) => (
                    <button
                      key={inc}
                      type="button"
                      onClick={() => setCratesDelivered((prev) => Math.max(0, prev + inc))}
                      className="py-1.5 px-2 bg-[#232532] hover:bg-[#2C2E3E] text-white font-mono font-bold rounded-lg border border-white/[0.06] text-center text-xs transition-transform active:scale-95"
                    >
                      +{inc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash Collection */}
              <div className="p-3.5 rounded-2xl bg-[#1A1B24] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-zinc-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <IndianRupee size={13} className="text-emerald-400" />
                    3. Payment Collected
                  </span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    ₹{paymentAmount}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentAmount("1450")}
                    className="py-1.5 px-2 bg-[#232532] text-[#D4F638] font-mono font-bold rounded-lg border border-white/[0.06] text-center"
                  >
                    Full (₹1,450)
                  </button>
                  {["500", "1000"].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setPaymentAmount(amt)}
                      className="py-1.5 px-2 bg-[#232532] text-white font-mono font-bold rounded-lg border border-white/[0.06] text-center"
                    >
                      ₹{amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPaymentAmount("0")}
                    className="py-1.5 px-2 bg-[#232532] text-zinc-400 font-mono font-bold rounded-lg border border-white/[0.06] text-center"
                  >
                    ₹0 (Credit)
                  </button>
                </div>
              </div>

              {/* Scheduled Reminder Preset (Core Feature) */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-[#1C1938] to-[#1A1B24] border border-purple-500/25 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-purple-300 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Clock size={13} className="text-[#D4F638]" />
                    4. Next Visit Reminder Preset
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    Auto-shows on Home on that date
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { days: 1, label: "Tomorrow" },
                    { days: 2, label: "In 2 Days" },
                    { days: 3, label: "In 3 Days" },
                    { days: 7, label: "In 1 Week" },
                  ].map((p) => (
                    <button
                      key={p.days}
                      type="button"
                      onClick={() => setReminderDays(p.days)}
                      className={`py-2 px-1 text-center font-mono text-xs font-bold rounded-xl border transition-all ${
                        reminderDays === p.days
                          ? "bg-[#D4F638] text-[#0A0D02] border-[#D4F638]"
                          : "bg-[#232532] text-zinc-300 border-white/[0.06] hover:bg-[#2C2E3E]"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={reminderNote}
                  onChange={(e) => setReminderNote(e.target.value)}
                  className="w-full bg-[#13141C] border border-white/[0.1] rounded-xl px-3 py-2 text-white placeholder:text-zinc-600 text-xs focus:outline-none focus:border-[#D4F638]"
                />
              </div>

              {/* Action Button */}
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
              </div>

              {isSaved && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono text-center animate-in fade-in">
                  ✓ Recorded 3 Crates · S1 marked complete · Reminder set for 3 days · Cochin Spice Traders auto-opened!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Markdown Guide Announcement Box */}
        <div className="p-6 md:p-8 rounded-3xl bg-[#13141C] border border-white/[0.08] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-[#D4F638]" />
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#D4F638]">
                Complete Field Documentation
              </span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Looking for the full routes &amp; packaging guide?
            </h3>
            <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
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
      <footer className="border-t border-white/[0.08] py-8 text-center text-xs font-mono text-zinc-500">
        <p>Waymark FMCG Wholesale Line · Fort Kochi &amp; Regional Beats · Offline IndexedDB Engine</p>
      </footer>
    </div>
  );
};
