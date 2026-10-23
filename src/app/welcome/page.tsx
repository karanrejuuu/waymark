"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Check,
  MapPin,
  Truck,
  IndianRupee,
  WifiOff,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Clock,
  ShieldCheck,
  Calendar,
} from "lucide-react";

interface Stop {
  id: string;
  name: string;
  lane: string;
  order: string;
  status: "urgent" | "due" | "overdue";
  statusText: string;
  dues: number;
  delivered: boolean;
}

export default function WelcomePage() {
  const [stops, setStops] = useState<Stop[]>([
    {
      id: "s1",
      name: "Gupta Kirana & General Store",
      lane: "North Bazaar, Gali 3",
      order: "3 cases Parle-G · 2 crates Frooti",
      status: "urgent",
      statusText: "Rack empty · Urgent restock",
      dues: 1450,
      delivered: false,
    },
    {
      id: "s2",
      name: "Laxmi Supermarket",
      lane: "Station Road, Opp. Platform 1",
      order: "4 boxes Maggi 48s · 2 crates Maaza",
      status: "overdue",
      statusText: "Carried over from yesterday",
      dues: 3200,
      delivered: false,
    },
    {
      id: "s3",
      name: "Anand Chai & Provision Depot",
      lane: "Old Vegetable Market",
      order: "5 packs Tata Tea Gold 250g",
      status: "due",
      statusText: "Cycle due today (Day 7)",
      dues: 850,
      delivered: false,
    },
    {
      id: "s4",
      name: "Bharat Daily Needs",
      lane: "East Ring Road, Shop 14",
      order: "6 boxes Good Day · 3 cases Marie",
      status: "due",
      statusText: "Cycle due today (Day 5)",
      dues: 0,
      delivered: false,
    },
  ]);

  const [activeScenario, setActiveScenario] = useState<"standard" | "lowstock" | "snooze">("standard");

  const handleToggle = (id: string) => {
    setStops((prev) =>
      prev.map((s) => (s.id === id ? { ...s, delivered: !s.delivered } : s))
    );
  };

  const handleReset = () => {
    setStops((prev) => prev.map((s) => ({ ...s, delivered: false })));
  };

  const deliveredCount = stops.filter((s) => s.delivered).length;
  const collectedAmount = stops
    .filter((s) => s.delivered)
    .reduce((acc, s) => acc + s.dues, 0);

  const pendingDues = stops
    .filter((s) => !s.delivered)
    .reduce((acc, s) => acc + s.dues, 0);

  return (
    <div className="min-h-screen bg-[#F6F5F0] text-[#111625] selection:bg-[#E68A00]/25 antialiased">
      {/* Top Navigation */}
      <header className="border-b border-[#E2DFD7] bg-[#F6F5F0]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/welcome" className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-[#C87400] text-white flex items-center justify-center font-bold text-sm font-heading">
              W
            </span>
            <span className="font-heading font-extrabold text-lg tracking-tight text-[#111625]">
              Waymark
            </span>
            <span className="hidden sm:inline-block text-[11px] font-medium text-[#736E65] pl-2 border-l border-[#E2DFD7]">
              FMCG Distribution Route System
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-[#545048] hover:text-[#111625] px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="text-xs font-bold bg-[#111625] text-white hover:bg-[#C87400] px-4 py-2 rounded-lg transition-colors"
            >
              Start Free
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="max-w-5xl mx-auto px-5 pt-12 sm:pt-16 pb-24">
        {/* Editorial Heading Block */}
        <div className="max-w-3xl mb-12">
          <div className="text-xs font-semibold text-[#8C5D00] uppercase tracking-wider mb-3">
            The wholesale replenishment gap
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-[#111625] tracking-tight leading-[1.12] mb-5">
            Every day a kirana shelf stays empty, another brand takes your space.
          </h1>
          <p className="text-base sm:text-lg text-[#545048] leading-relaxed max-w-2xl font-normal">
            Indian FMCG distributors lose over 15% of monthly orders because restock rounds rely on paper diaries and memory. Waymark turns your store rounds into an offline, self-adjusting daily dispatch line with instant dues settlement.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3.5">
            <Link
              href="/login"
              className="px-6 py-3 rounded-lg bg-[#C87400] text-white font-bold text-xs sm:text-sm hover:bg-[#B06600] transition-colors shadow-sm"
            >
              Build Today's Route Line
            </Link>
            <Link
              href="/login"
              className="px-5 py-3 rounded-lg border border-[#D5D2C9] bg-white text-[#111625] font-semibold text-xs sm:text-sm hover:bg-[#EFECE5] transition-colors"
            >
              Try Live Demo
            </Link>
          </div>
        </div>

        {/* The Physical Dispatch Sheet (The Hero Instrument) */}
        <section className="mb-20">
          <div className="bg-white border border-[#D5D2C9] rounded-2xl p-5 sm:p-7 shadow-[0_2px_8px_rgba(17,22,37,0.04)]">
            {/* Sheet Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E2DFD7] gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C87400]" />
                  <span className="text-xs font-bold font-heading uppercase tracking-wide text-[#111625]">
                    Active Dispatch Line · Route 04 (North Bazaar)
                  </span>
                </div>
                <div className="text-xs text-[#736E65] mt-0.5">
                  Tap stop circles to log delivery in real-time. Notice how interval and cash ledger adjust.
                </div>
              </div>

              {/* Status summary */}
              <div className="flex items-center gap-3 text-xs tabular-nums">
                <span className="px-2.5 py-1 rounded bg-[#F6F5F0] border border-[#E2DFD7] font-semibold text-[#111625]">
                  {deliveredCount} of {stops.length} completed
                </span>
                <span className="px-2.5 py-1 rounded bg-[#EBF5EE] border border-[#C6E6D1] font-semibold text-[#1B7340]">
                  ₹{collectedAmount.toLocaleString("en-IN")} collected
                </span>
                {deliveredCount > 0 && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="p-1 text-[#736E65] hover:text-[#111625] transition-colors"
                    title="Reset simulation"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Vertical Stops Route Line */}
            <div className="py-6 space-y-4 relative">
              {stops.map((stop, idx) => {
                const isNext = !stop.delivered && (idx === 0 || stops[idx - 1].delivered);

                return (
                  <div
                    key={stop.id}
                    onClick={() => handleToggle(stop.id)}
                    className={`relative flex items-start gap-3.5 p-3 sm:p-4 rounded-xl border transition-all cursor-pointer ${
                      stop.delivered
                        ? "bg-[#FAF9F5] border-[#E2DFD7] opacity-65"
                        : isNext
                        ? "bg-[#FFF9EE] border-[#E5B566] shadow-[0_1px_4px_rgba(200,116,0,0.08)]"
                        : "bg-white border-[#E2DFD7] hover:border-[#C4C0B5]"
                    }`}
                  >
                    {/* Vertical connector line */}
                    {idx < stops.length - 1 && (
                      <div
                        className={`absolute left-[27px] sm:left-[31px] top-10 w-[2px] h-[calc(100%+8px)] transition-colors ${
                          stop.delivered ? "bg-[#1B7340]" : "bg-[#E2DFD7]"
                        }`}
                      />
                    )}

                    {/* Transit stop indicator */}
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold transition-all z-10 ${
                        stop.delivered
                          ? "bg-[#1B7340] text-white"
                          : stop.status === "urgent"
                          ? "border-2 border-[#C23829] bg-[#FBEBE9] text-[#C23829]"
                          : isNext
                          ? "border-2 border-[#C87400] bg-[#FFF3D6] text-[#8C5D00]"
                          : "border border-[#C4C0B5] bg-[#F6F5F0] text-[#736E65]"
                      }`}
                    >
                      {stop.delivered ? (
                        <Check size={14} strokeWidth={3} />
                      ) : stop.status === "urgent" ? (
                        "!"
                      ) : (
                        idx + 1
                      )}
                    </div>

                    {/* Content details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs sm:text-sm font-bold font-heading truncate ${
                              stop.delivered ? "line-through text-[#736E65]" : "text-[#111625]"
                            }`}
                          >
                            {stop.name}
                          </span>
                          {stop.status === "urgent" && !stop.delivered && (
                            <span className="text-[10px] font-bold text-[#C23829] bg-[#FBEBE9] px-2 py-0.5 rounded border border-[#F5C2BC]">
                              Chilli urgent
                            </span>
                          )}
                          {isNext && (
                            <span className="text-[10px] font-bold text-[#8C5D00] bg-[#FFF3D6] px-2 py-0.5 rounded border border-[#F2D18D]">
                              Next stop
                            </span>
                          )}
                        </div>

                        {/* Balance due */}
                        <div className="text-right shrink-0">
                          {stop.dues > 0 ? (
                            <span
                              className={`text-xs font-semibold tabular-nums ${
                                stop.delivered ? "text-[#1B7340]" : "text-[#736E65]"
                              }`}
                            >
                              {stop.delivered
                                ? `₹${stop.dues.toLocaleString("en-IN")} collected`
                                : `₹${stop.dues.toLocaleString("en-IN")} pending`}
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#736E65]">No dues</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] text-[#736E65]">
                        <span>{stop.lane}</span>
                        <span>·</span>
                        <span className="text-[#111625] font-medium">{stop.order}</span>
                        <span>·</span>
                        <span className={stop.status === "urgent" ? "text-[#C23829] font-medium" : ""}>
                          {stop.statusText}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interactive Field Scenarios Tab */}
            <div className="mt-4 pt-5 border-t border-[#E2DFD7]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#736E65] mb-2.5">
                Test real distribution scenarios
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveScenario("standard")}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    activeScenario === "standard"
                      ? "bg-[#F6F5F0] border-[#111625] text-[#111625]"
                      : "bg-white border-[#E2DFD7] text-[#545048] hover:border-[#C4C0B5]"
                  }`}
                >
                  <div className="text-xs font-bold mb-0.5">1. Routine Restock</div>
                  <div className="text-[11px] text-[#736E65] leading-relaxed">
                    Stock verified normal. Interval holds at default 7 days.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveScenario("lowstock")}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    activeScenario === "lowstock"
                      ? "bg-[#FFF9EE] border-[#C87400] text-[#111625]"
                      : "bg-white border-[#E2DFD7] text-[#545048] hover:border-[#C4C0B5]"
                  }`}
                >
                  <div className="text-xs font-bold mb-0.5 text-[#8C5D00]">2. Low Stock Alert</div>
                  <div className="text-[11px] text-[#736E65] leading-relaxed">
                    Retailer almost ran out. Waymark tightens cycle from 7 to 6 days.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveScenario("snooze")}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    activeScenario === "snooze"
                      ? "bg-[#FBEBE9] border-[#C23829] text-[#111625]"
                      : "bg-white border-[#E2DFD7] text-[#545048] hover:border-[#C4C0B5]"
                  }`}
                >
                  <div className="text-xs font-bold mb-0.5 text-[#C23829]">3. Shopkeeper at Temple</div>
                  <div className="text-[11px] text-[#736E65] leading-relaxed">
                    Snooze to Thursday without corrupting the store's baseline interval.
                  </div>
                </button>
              </div>

              {/* Scenario Explanation Box */}
              <div className="mt-3 p-3 rounded-lg bg-[#FAF9F5] border border-[#E2DFD7] text-xs text-[#545048] leading-relaxed">
                {activeScenario === "standard" && (
                  <span>
                    <strong>Standard Delivery:</strong> Marking delivered logs the quantity, clears the urgent state, and schedules the next restock date cleanly.
                  </span>
                )}
                {activeScenario === "lowstock" && (
                  <span>
                    <strong>Self-Correcting Intervals:</strong> In FMCG, consumption spikes during festivals or heat waves. When you tap "Low Stock", Waymark automatically adapts future due dates so shelves never stay bare.
                  </span>
                )}
                {activeScenario === "snooze" && (
                  <span>
                    <strong>Non-destructive Snoozing:</strong> In field distribution, shops close or owners are away. Snoozing carries the visit forward without destroying the shop's historical order frequency.
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* The 48-Hour Reality Comparison */}
        <section className="mb-20">
          <div className="mb-8">
            <div className="text-xs font-semibold text-[#8C5D00] uppercase tracking-wider mb-2">
              The root cause of lost agency sales
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-[#111625] tracking-tight">
              The 48-hour shelf gap that kills distributor margins
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* The Notebook Way */}
            <div className="p-6 rounded-2xl border border-[#E2DFD7] bg-white">
              <div className="text-xs font-bold uppercase tracking-wider text-[#C23829] mb-3">
                The Notebook & Memory Way
              </div>
              <div className="space-y-3.5 text-xs text-[#545048]">
                <div className="flex items-start gap-2.5">
                  <span className="font-bold text-[#111625] shrink-0 w-12">Day 01</span>
                  <span>Full crate of biscuits delivered to retailer counter.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="font-bold text-[#111625] shrink-0 w-12">Day 05</span>
                  <span>Stock burns down to last 3 packets.</span>
                </div>
                <div className="flex items-start gap-2.5 text-[#C23829]">
                  <span className="font-bold shrink-0 w-12">Day 07</span>
                  <span>
                    <strong>Shelf is empty.</strong> Retailer waits, distributor has no reminder.
                  </span>
                </div>
                <div className="flex items-start gap-2.5 text-[#C23829]">
                  <span className="font-bold shrink-0 w-12">Day 08</span>
                  <span>
                    Competitor agency driver walks in with discount packets. Retailer fills your empty rack.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="font-bold text-[#111625] shrink-0 w-12">Day 10</span>
                  <span>You arrive. Retailer says: "Stock is full, come back next week." <strong>Lost sale.</strong></span>
                </div>
              </div>
            </div>

            {/* The Waymark Way */}
            <div className="p-6 rounded-2xl border border-[#C6E6D1] bg-[#F4F9F6]">
              <div className="text-xs font-bold uppercase tracking-wider text-[#1B7340] mb-3">
                The Waymark Cycle Way
              </div>
              <div className="space-y-3.5 text-xs text-[#2A4B36]">
                <div className="flex items-start gap-2.5">
                  <span className="font-bold text-[#111625] shrink-0 w-12">Day 01</span>
                  <span>Delivery logged. 6-day consumption cycle recorded.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="font-bold text-[#111625] shrink-0 w-12">Day 05</span>
                  <span>Waymark applies 1-day safety offset before runout.</span>
                </div>
                <div className="flex items-start gap-2.5 text-[#1B7340]">
                  <span className="font-bold shrink-0 w-12">Day 06</span>
                  <span>
                    <strong>Stop appears on Today's dispatch line.</strong> Driver sees exact crate count.
                  </span>
                </div>
                <div className="flex items-start gap-2.5 text-[#1B7340]">
                  <span className="font-bold shrink-0 w-12">Day 06</span>
                  <span>Fresh crates loaded before rack ever empties. Competitor gets zero shelf space.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="font-bold text-[#111625] shrink-0 w-12">Result</span>
                  <span><strong>100% retailer retention and predictable weekly cashflow.</strong></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Three Physical Realities */}
        <section className="mb-20">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-[#111625] tracking-tight">
              Built for the physical reality of Indian markets
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-2xl border border-[#E2DFD7] bg-white">
              <div className="w-10 h-10 rounded-xl bg-[#F6F5F0] border border-[#E2DFD7] flex items-center justify-center text-[#111625] mb-4">
                <WifiOff size={18} />
              </div>
              <h3 className="text-sm font-bold font-heading text-[#111625] mb-2">
                100% Offline in Mandi Basements
              </h3>
              <p className="text-xs text-[#545048] leading-relaxed">
                Wholesale markets and underground godowns rarely have reliable cell connectivity. Waymark persists everything to local device storage first. Deliveries, dues, and snoozes sync silently when signal returns.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-[#E2DFD7] bg-white">
              <div className="w-10 h-10 rounded-xl bg-[#F6F5F0] border border-[#E2DFD7] flex items-center justify-center text-[#111625] mb-4">
                <IndianRupee size={18} />
              </div>
              <h3 className="text-sm font-bold font-heading text-[#111625] mb-2">
                Dues Collection on the Same Screen
              </h3>
              <p className="text-xs text-[#545048] leading-relaxed">
                In FMCG distribution, collecting payment is half the work. See outstanding credit balances directly on the route stop and log cash or UPI collections in one tap without switching between ledger apps.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-[#E2DFD7] bg-white">
              <div className="w-10 h-10 rounded-xl bg-[#F6F5F0] border border-[#E2DFD7] flex items-center justify-center text-[#111625] mb-4">
                <Truck size={18} />
              </div>
              <h3 className="text-sm font-bold font-heading text-[#111625] mb-2">
                Vehicle Mileage & Petrol Burn
              </h3>
              <p className="text-xs text-[#545048] leading-relaxed">
                Set your vehicle mileage (km/l) and local petrol price. Waymark calculates trip distance from your central godown, giving you the real fuel cost per delivery stop.
              </p>
            </div>
          </div>
        </section>

        {/* Final Plain CTA */}
        <section className="border border-[#D5D2C9] rounded-2xl bg-white p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#111625] tracking-tight mb-3">
            Ready to organize your agency routes?
          </h2>
          <p className="text-xs sm:text-sm text-[#545048] max-w-md mx-auto mb-6">
            Setup takes three minutes. Add your shops with rapid entry, paste an Excel sheet, or add stores as you ride.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="w-full sm:w-auto px-7 py-3 rounded-lg bg-[#111625] text-white font-bold text-xs sm:text-sm hover:bg-[#C87400] transition-colors"
            >
              Start Free Account
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-lg border border-[#D5D2C9] text-[#111625] font-semibold text-xs sm:text-sm hover:bg-[#FAF9F5] transition-colors"
            >
              Sign In to Existing Agency
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E2DFD7] bg-[#F6F5F0] py-8 text-xs text-[#736E65]">
        <div className="max-w-5xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C87400]" />
            <span className="font-semibold text-[#111625]">Waymark FMCG</span>
            <span>· Offline-First Route OS for Indian Distribution</span>
          </div>
          <div>Production Hardened PWA · Local-First Architecture</div>
        </div>
      </footer>
    </div>
  );
}