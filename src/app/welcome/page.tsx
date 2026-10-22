"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  MapPin,
  Truck,
  IndianRupee,
  WifiOff,
  Clock,
  Sparkles,
  Zap,
  ShieldCheck,
  Layers,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

interface StopSimulation {
  id: string;
  name: string;
  locality: string;
  dueStatus: "urgent" | "due" | "overdue";
  items: string;
  dues: number;
  delivered: boolean;
  timeEstimate: string;
}

export default function WelcomePage() {
  // 3D Card Tilt State
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(-2);
  const [rotateY, setRotateY] = useState(4);
  const [lightX, setLightX] = useState(50);
  const [lightY, setLightY] = useState(50);

  // Interactive Live Cockpit Simulator State
  const [stops, setStops] = useState<StopSimulation[]>([
    {
      id: "s1",
      name: "Gupta Kirana & General Store",
      locality: "North Market, Lane 3",
      dueStatus: "urgent",
      items: "3x Parle-G · 2x Frooti Crates",
      dues: 1450,
      delivered: true,
      timeEstimate: "09:40 AM",
    },
    {
      id: "s2",
      name: "Laxmi Supermarket",
      locality: "Station Road, Rear Gate",
      dueStatus: "overdue",
      items: "4x Maggi 48s · 2x Tata Tea",
      dues: 3200,
      delivered: false,
      timeEstimate: "10:15 AM",
    },
    {
      id: "s3",
      name: "Anand Chai & Provision Depot",
      locality: "Old Mandi, Crossroad 2",
      dueStatus: "due",
      items: "5x Tata Tea Gold (Pack of 12)",
      dues: 850,
      delivered: false,
      timeEstimate: "10:50 AM",
    },
    {
      id: "s4",
      name: "Bharat Daily Essentials",
      locality: "East Bypass, Shop #12",
      dueStatus: "due",
      items: "6x Good Day Butter · 3x Frooti",
      dues: 1100,
      delivered: false,
      timeEstimate: "11:30 AM",
    },
  ]);

  const [activeTab, setActiveTab] = useState<"route" | "burn" | "ledger">("route");

  // Handle 3D Mouse Parallax
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = -((y - centerY) / centerY) * 9;
    const rotY = ((x - centerX) / centerX) * 9;

    setRotateX(rotX);
    setRotateY(rotY);
    setLightX((x / rect.width) * 100);
    setLightY((y / rect.height) * 100);
  };

  const handleMouseLeave = () => {
    setRotateX(-2);
    setRotateY(4);
    setLightX(50);
    setLightY(50);
  };

  const handleToggleDelivery = (id: string) => {
    setStops((prev) =>
      prev.map((stop) => (stop.id === id ? { ...stop, delivered: !stop.delivered } : stop))
    );
  };

  const completedCount = stops.filter((s) => s.delivered).length;
  const collectedDues = stops
    .filter((s) => s.delivered)
    .reduce((acc, s) => acc + s.dues, 0);

  return (
    <div className="min-h-screen bg-[#0A0D14] text-[#E6E9EF] selection:bg-[#F2A900] selection:text-black overflow-x-hidden font-body">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-[#F2A900]/12 blur-[130px] rounded-full" />
        <div className="absolute top-[600px] -left-32 w-[450px] h-[450px] bg-[#1F9D6B]/8 blur-[140px] rounded-full" />
        <div className="absolute top-[800px] -right-32 w-[500px] h-[500px] bg-[#3B82F6]/6 blur-[150px] rounded-full" />
        {/* Subtle grid mesh */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/* Top Navbar */}
      <header className="relative z-30 border-b border-white/[0.08] bg-[#0A0D14]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/welcome" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-[#F2A900] flex items-center justify-center font-bold text-black text-sm shadow-[0_0_20px_rgba(242,169,0,0.4)] group-hover:scale-105 transition-transform">
              W
            </div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-xl tracking-tight text-white">
                Waymark
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-[#F2A900]">
                FMCG OS
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs font-semibold text-[#8C9BAE] hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-[#F2A900] hover:text-black transition-all shadow-[0_2px_12px_rgba(255,255,255,0.15)] flex items-center gap-1.5"
            >
              Get Started <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 sm:pt-24 pb-20 px-5 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/[0.04] border border-white/[0.12] text-white/90 shadow-inner mb-6 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#F2A900] animate-ping" />
            <span className="text-[#F2A900] font-bold">Autonomous Route Intelligence</span>
            <span className="text-white/40">·</span>
            <span>Zero Lost Sales</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight font-heading text-white leading-[1.08] mb-6">
            Never let a distributor rack run out of stock.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#8C9BAE] leading-relaxed max-w-2xl mx-auto mb-8 font-normal">
            Waymark calculates burn intervals per retail shop, builds today's high-priority delivery
            vector, and collects payments in the field — with or without internet.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#F2A900] text-black font-extrabold text-sm hover:opacity-95 transition-all shadow-[0_0_30px_rgba(242,169,0,0.35)] flex items-center justify-center gap-2 group"
            >
              Launch Live Route
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
            <a
              href="#interactive-demo"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl border border-white/[0.12] bg-white/[0.04] text-white font-medium text-sm hover:bg-white/[0.08] transition-colors flex items-center justify-center gap-2 backdrop-blur-md"
            >
              Explore 3D Cockpit
            </a>
          </div>
        </div>

        {/* 3D Interactive Cockpit Preview */}
        <div
          id="interactive-demo"
          className="relative max-w-4xl mx-auto perspective-[1200px]"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Glowing pedestal beneath */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#F2A900]/20 via-[#1F9D6B]/15 to-[#3B82F6]/20 rounded-3xl blur-xl opacity-70 transform transition-all duration-300" />

          {/* 3D Tilt Card */}
          <div
            ref={cardRef}
            className="relative bg-[#10141E]/90 border border-white/[0.14] rounded-2xl shadow-[0_24px_70px_rgba(0,0,0,0.8)] overflow-hidden transition-transform duration-150 ease-out backdrop-blur-2xl"
            style={{
              transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
              transformStyle: "preserve-3d",
            }}
          >
            {/* Dynamic Cursor Light Glare */}
            <div
              className="pointer-events-none absolute inset-0 opacity-25 transition-opacity"
              style={{
                background: `radial-gradient(circle 350px at ${lightX}% ${lightY}%, rgba(255,255,255,0.18), transparent 75%)`,
              }}
            />

            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#D64545]" />
                  <span className="w-3 h-3 rounded-full bg-[#F2A900]" />
                  <span className="w-3 h-3 rounded-full bg-[#1F9D6B]" />
                </div>
                <div className="h-4 w-[1px] bg-white/[0.1] mx-1" />
                <span className="text-xs font-mono text-[#8C9BAE] font-medium flex items-center gap-1.5">
                  <MapPin size={13} className="text-[#F2A900]" />
                  Sector 4 — Central Godown Route Line
                </span>
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/[0.06] text-[11px] font-semibold mt-2 sm:mt-0">
                <button
                  type="button"
                  onClick={() => setActiveTab("route")}
                  className={`px-3 py-1 rounded-md transition-all ${
                    activeTab === "route"
                      ? "bg-[#F2A900] text-black font-bold shadow-xs"
                      : "text-[#8C9BAE] hover:text-white"
                  }`}
                >
                  Live Route
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("burn")}
                  className={`px-3 py-1 rounded-md transition-all ${
                    activeTab === "burn"
                      ? "bg-[#F2A900] text-black font-bold shadow-xs"
                      : "text-[#8C9BAE] hover:text-white"
                  }`}
                >
                  Burn Forecast
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("ledger")}
                  className={`px-3 py-1 rounded-md transition-all ${
                    activeTab === "ledger"
                      ? "bg-[#F2A900] text-black font-bold shadow-xs"
                      : "text-[#8C9BAE] hover:text-white"
                  }`}
                >
                  Dues Ledger
                </button>
              </div>
            </div>

            {/* Metric Strip */}
            <div className="grid grid-cols-3 border-b border-white/[0.08] bg-black/30 divide-x divide-white/[0.06] text-center py-3.5 px-4">
              <div>
                <div className="text-[10px] uppercase font-bold text-[#8C9BAE] tracking-wider">
                  Deliveries
                </div>
                <div className="text-lg font-extrabold text-white font-heading mt-0.5 tabular-nums">
                  {completedCount} / {stops.length} <span className="text-xs font-normal text-white/50">Stops</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-[#8C9BAE] tracking-wider">
                  Cash Collected
                </div>
                <div className="text-lg font-extrabold text-[#1F9D6B] font-heading mt-0.5 tabular-nums flex items-center justify-center gap-0.5">
                  <IndianRupee size={15} /> {collectedDues.toLocaleString("en-IN")}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-[#8C9BAE] tracking-wider">
                  Sync Status
                </div>
                <div className="text-xs font-bold text-[#F2A900] font-heading mt-1 flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#1F9D6B]" />
                  Offline Resilient
                </div>
              </div>
            </div>

            {/* TAB 1: Interactive Live Route Stops */}
            {activeTab === "route" && (
              <div className="p-6 space-y-4">
                <div className="text-xs text-[#8C9BAE] flex items-center justify-between">
                  <span>Interactive stops · Tap a stop dot to complete delivery live:</span>
                  <span className="text-[11px] text-[#F2A900] font-semibold">200ms Tally Feedback</span>
                </div>

                <div className="space-y-3 relative">
                  {stops.map((stop, idx) => {
                    const isNext = !stop.delivered && (idx === 0 || stops[idx - 1].delivered);

                    return (
                      <div
                        key={stop.id}
                        className="relative flex items-start gap-4 group cursor-pointer"
                        onClick={() => handleToggleDelivery(stop.id)}
                      >
                        {/* Vertical line connection */}
                        {idx < stops.length - 1 && (
                          <div
                            className={`absolute left-[17px] top-8 w-[2px] h-[calc(100%+14px)] transition-colors duration-300 ${
                              stop.delivered ? "bg-[#1F9D6B]" : "bg-white/[0.12]"
                            }`}
                          />
                        )}

                        {/* Interactive Dot */}
                        <div
                          className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-xs font-bold transition-all duration-200 z-10 ${
                            stop.delivered
                              ? "bg-[#1F9D6B] text-black shadow-[0_0_15px_rgba(31,157,107,0.5)] scale-105"
                              : stop.dueStatus === "urgent"
                              ? "border-2 border-[#D64545] bg-[#D64545]/20 text-[#D64545] shadow-[0_0_12px_rgba(214,69,69,0.3)] animate-pulse"
                              : isNext
                              ? "border-2 border-[#F2A900] bg-[#F2A900]/20 text-[#F2A900] shadow-[0_0_15px_rgba(242,169,0,0.4)]"
                              : "border border-white/20 bg-white/[0.04] text-white/50"
                          }`}
                        >
                          {stop.delivered ? (
                            <Check size={16} strokeWidth={3} />
                          ) : stop.dueStatus === "urgent" ? (
                            "🌶️"
                          ) : (
                            idx + 1
                          )}
                        </div>

                        {/* Stop Card */}
                        <div
                          className={`flex-1 p-3.5 rounded-xl border transition-all duration-200 ${
                            stop.delivered
                              ? "bg-[#1F9D6B]/5 border-[#1F9D6B]/30 opacity-70"
                              : isNext
                              ? "bg-[#F2A900]/10 border-[#F2A900]/50 shadow-[0_4px_20px_rgba(242,169,0,0.1)]"
                              : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06]"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-bold font-heading ${
                                  stop.delivered ? "line-through text-white/60" : "text-white"
                                }`}
                              >
                                {stop.name}
                              </span>
                              {stop.dueStatus === "urgent" && !stop.delivered && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D64545]/20 text-[#D64545] font-bold border border-[#D64545]/30">
                                  Critical Runout
                                </span>
                              )}
                              {isNext && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F2A900]/20 text-[#F2A900] font-bold border border-[#F2A900]/30">
                                  Next Up
                                </span>
                              )}
                            </div>

                            <span className="text-xs font-mono font-bold text-[#1F9D6B] tabular-nums">
                              ₹{stop.dues.toLocaleString("en-IN")}
                            </span>
                          </div>

                          <div className="text-xs text-[#8C9BAE] flex items-center justify-between">
                            <span>{stop.items}</span>
                            <span className="font-mono text-[11px] text-white/40">{stop.timeEstimate}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: Burn Rate Prediction */}
            {activeTab === "burn" && (
              <div className="p-6 space-y-4">
                <div className="p-4 rounded-xl border border-[#D64545]/30 bg-[#D64545]/10">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#D64545] mb-1">
                    <AlertTriangle size={15} />
                    Stockout Risk Detected: Gupta Kirana
                  </div>
                  <div className="text-xs text-white/80 leading-relaxed">
                    Parle-G Glucose 100g burn cycle is 5.2 days. Last restock was 5 days ago. If not delivered
                    by 11:30 AM, rack empties and retailer restocks from competing agency.
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-[#1F9D6B]/30 bg-[#1F9D6B]/10">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#1F9D6B] mb-1">
                    <ShieldCheck size={15} />
                    Self-Correcting Interval Model
                  </div>
                  <div className="text-xs text-white/80 leading-relaxed">
                    When you report "Low Stock" upon delivery, Waymark shortens the shop's replenishment cycle
                    from 7 days down to 6 days automatically.
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Dues Ledger */}
            {activeTab === "ledger" && (
              <div className="p-6 space-y-3">
                <div className="text-xs text-[#8C9BAE] mb-2">
                  Live credit ledger per retailer. One-tap settlement during round:
                </div>
                {stops.map((stop) => (
                  <div
                    key={stop.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-white/[0.08] bg-white/[0.02]"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{stop.name}</div>
                      <div className="text-[11px] text-[#8C9BAE]">{stop.locality}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-[#1F9D6B]">
                        ₹{stop.dues.toLocaleString("en-IN")} Pending
                      </div>
                      <div className="text-[10px] text-white/40">
                        {stop.delivered ? "Collected Cash" : "Uncollected"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tactile Capabilities Grid */}
      <section className="relative z-10 py-20 px-5 max-w-6xl mx-auto border-t border-white/[0.08]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold font-heading text-white tracking-tight mb-3">
            Engineered for wholesale distribution
          </h2>
          <p className="text-sm text-[#8C9BAE]">
            Built specifically for the physical realities of Indian FMCG logistics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="p-7 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-all hover:border-[#F2A900]/40 group">
            <div className="w-12 h-12 rounded-xl bg-[#F2A900]/15 text-[#F2A900] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <WifiOff size={22} />
            </div>
            <h3 className="text-base font-bold font-heading text-white mb-2">
              100% Offline in Mandi Basements
            </h3>
            <p className="text-xs text-[#8C9BAE] leading-relaxed">
              Wholesale markets and basement godowns have dead zones. Waymark persists all route mutations
              locally in IndexedDB and silently drains the sync queue when signal returns.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-7 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-all hover:border-[#1F9D6B]/40 group">
            <div className="w-12 h-12 rounded-xl bg-[#1F9D6B]/15 text-[#1F9D6B] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <IndianRupee size={22} />
            </div>
            <h3 className="text-base font-bold font-heading text-white mb-2">
              Integrated Payment Ledger
            </h3>
            <p className="text-xs text-[#8C9BAE] leading-relaxed">
              Collecting cash and reconciling credit is half the distributor's job. Log cash, UPI, or
              cheque right from the stop card without opening a secondary ledger app.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-7 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-all hover:border-[#3B82F6]/40 group">
            <div className="w-12 h-12 rounded-xl bg-[#3B82F6]/15 text-[#3B82F6] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Truck size={22} />
            </div>
            <h3 className="text-base font-bold font-heading text-white mb-2">
              Vehicle Mileage & Petrol Burn
            </h3>
            <p className="text-xs text-[#8C9BAE] leading-relaxed">
              Set mileage parameters (km/l) and live fuel prices. Waymark calculates fuel consumption
              and transport cost per stop so you know exact route margins.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Strip: Memory vs Waymark */}
      <section className="relative z-10 py-16 px-5 max-w-4xl mx-auto">
        <div className="p-8 sm:p-10 rounded-3xl border border-white/[0.1] bg-gradient-to-b from-white/[0.04] to-transparent backdrop-blur-xl">
          <div className="text-center max-w-md mx-auto mb-8">
            <h3 className="text-xl font-bold font-heading text-white mb-2">
              The 48-Hour Restock Penalty
            </h3>
            <p className="text-xs text-[#8C9BAE]">
              What happens when an FMCG distributor visits by memory vs calculated interval:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-[#D64545]/30 bg-[#D64545]/5">
              <div className="text-xs font-bold text-[#D64545] mb-2 flex items-center gap-1.5">
                <AlertTriangle size={14} /> Mental Memory & Diary
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                Shopkeeper sells out on Day 7. Distributor visits on Day 9. During those 48 hours, a
                competing salesman stocks their biscuits on your empty rack shelf.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-[#1F9D6B]/30 bg-[#1F9D6B]/5">
              <div className="text-xs font-bold text-[#1F9D6B] mb-2 flex items-center gap-1.5">
                <ShieldCheck size={14} /> Waymark Predictive Round
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                Waymark calculates burn rate and brings the stop to your Today list on Day 6 with a 24h
                safety margin. Fresh cases arrive just in time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="relative z-10 py-20 px-5 max-w-4xl mx-auto text-center">
        <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-r from-[#F2A900] via-[#E59E00] to-[#F2A900] text-black shadow-[0_10px_50px_rgba(242,169,0,0.3)]">
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading tracking-tight mb-3">
            Ready to upgrade your distribution rounds?
          </h2>
          <p className="text-xs sm:text-sm text-black/80 max-w-md mx-auto mb-8 font-medium">
            Setup takes 3 minutes. Upload your existing shop register or type in rapid entries.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-black text-white font-extrabold text-sm hover:bg-black/85 transition-colors flex items-center justify-center gap-2 shadow-lg"
            >
              Start Free Today <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-black/25 bg-black/5 text-black font-bold text-sm hover:bg-black/10 transition-colors"
            >
              Sign In Existing Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.08] py-8 text-center text-xs text-[#8C9BAE]">
        <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F2A900]" />
            <span className="font-semibold text-white">Waymark FMCG Distribution</span>
          </div>
          <div>Production Hardened PWA · Local-First Architecture</div>
        </div>
      </footer>
    </div>
  );
}