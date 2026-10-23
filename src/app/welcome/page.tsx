"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Check,
  MapPin,
  Truck,
  IndianRupee,
  WifiOff,
  Wifi,
  ArrowRight,
  RotateCcw,
  Volume2,
  VolumeX,
  Package,
} from "lucide-react";

interface Stop {
  id: string;
  name: string;
  lane: string;
  crates: { name: string; count: number; unit: string }[];
  status: "urgent" | "due" | "overdue";
  statusText: string;
  dues: number;
  delivered: boolean;
  stampedAt?: string;
}

export default function WelcomePage() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedStopId, setSelectedStopId] = useState<string>("s1");
  const [offlineSimulated, setOfflineSimulated] = useState(false);
  const [shelfStep, setShelfStep] = useState<0 | 1 | 2>(1);

  const [stops, setStops] = useState<Stop[]>([
    {
      id: "s1",
      name: "Gupta Kirana & General Store",
      lane: "North Bazaar, Gali 3",
      crates: [
        { name: "Parle-G 100g", count: 3, unit: "Cases (72 pkts)" },
        { name: "Frooti 200ml", count: 2, unit: "Crates (60 tetra)" },
      ],
      status: "urgent",
      statusText: "Rack empty · Shopkeeper phoned warehouse",
      dues: 1450,
      delivered: false,
    },
    {
      id: "s2",
      name: "Laxmi Supermarket",
      lane: "Station Road, Opp. Platform 1",
      crates: [
        { name: "Maggi 2-Min Noodles", count: 4, unit: "Boxes (192 pkts)" },
        { name: "Maaza 600ml", count: 2, unit: "Crates (48 btls)" },
      ],
      status: "overdue",
      statusText: "Carried over from yesterday's delayed route",
      dues: 3200,
      delivered: false,
    },
    {
      id: "s3",
      name: "Anand Chai & Provision Depot",
      lane: "Old Vegetable Mandi, Shop 18",
      crates: [
        { name: "Tata Tea Gold 250g", count: 5, unit: "Packs (60 boxes)" },
        { name: "Sugar S-30 1kg", count: 2, unit: "Bags (100 kg)" },
      ],
      status: "due",
      statusText: "Standard 7-day replenishment cycle",
      dues: 850,
      delivered: false,
    },
    {
      id: "s4",
      name: "Bharat Daily Needs",
      lane: "East Ring Road, Near Auto Stand",
      crates: [
        { name: "Britannia Good Day", count: 6, unit: "Boxes (144 pkts)" },
        { name: "Marie Gold 200g", count: 3, unit: "Cases (72 pkts)" },
      ],
      status: "due",
      statusText: "Standard 5-day cycle · High biscuit turnover",
      dues: 0,
      delivered: false,
    },
  ]);

  // Audio synthesis for tactile wholesale feedback (zero external audio dependencies)
  const playTactileAudio = (type: "tick" | "stamp" | "switch") => {
    if (typeof window === "undefined" || !soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "tick") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(550, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.06);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.06);
      } else if (type === "stamp") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.16);
        gain.gain.setValueAtTime(0.28, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.16);
      } else {
        osc.type = "sine";
        osc.frequency.setValueAtTime(380, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.05);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  };

  const handleToggleDelivery = (id: string) => {
    playTactileAudio("stamp");
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    setStops((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              delivered: !s.delivered,
              stampedAt: !s.delivered ? timeStr : undefined,
            }
          : s
      )
    );
  };

  const handleReset = () => {
    playTactileAudio("switch");
    setStops((prev) => prev.map((s) => ({ ...s, delivered: false, stampedAt: undefined })));
  };

  const deliveredCount = stops.filter((s) => s.delivered).length;
  const totalDues = stops.reduce((acc, s) => acc + s.dues, 0);
  const collectedDues = stops.filter((s) => s.delivered).reduce((acc, s) => acc + s.dues, 0);
  const pendingDues = totalDues - collectedDues;

  const selectedStop = stops.find((s) => s.id === selectedStopId) || stops[0];
  const nextPendingIndex = stops.findIndex((s) => !s.delivered);
  const tempoCurrentIndex = nextPendingIndex === -1 ? stops.length - 1 : nextPendingIndex;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#0F172A] selection:bg-[#FDE68A] selection:text-[#78350F] antialiased">
      {/* Top Banner & Offline Simulation Bar */}
      {offlineSimulated && (
        <div className="bg-[#78350F] text-[#FEF3C7] px-4 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-between transition-all sticky top-0 z-50 shadow-md">
          <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WifiOff size={16} className="text-[#FCD34D]" />
              <span>Mandi Basement Mode: Zero mobile signal. All dispatch actions buffering to local IndexedDB.</span>
            </div>
            <button
              onClick={() => {
                setOfflineSimulated(false);
                playTactileAudio("switch");
              }}
              className="text-xs bg-[#FEF3C7] text-[#78350F] hover:bg-white px-3 py-1 rounded font-bold transition-colors"
            >
              Restore 4G
            </button>
          </div>
        </div>
      )}

      {/* Primary Header */}
      <header className="border-b border-[#E7E5E0] bg-[#FAF8F5]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/welcome" className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-[#92400E] text-white flex items-center justify-center font-bold text-base font-heading shadow-sm">
              W
            </span>
            <div>
              <span className="font-heading font-extrabold text-xl tracking-tight text-[#0F172A] block leading-tight">
                Waymark
              </span>
              <span className="text-xs font-semibold text-[#475569] block">
                FMCG Wholesale Delivery Line
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playTactileAudio("tick");
              }}
              title={soundEnabled ? "Disable tactile audio" : "Enable tactile audio"}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] bg-white text-[#334155] hover:text-[#0F172A] transition-colors"
            >
              {soundEnabled ? (
                <>
                  <Volume2 size={15} className="text-[#92400E]" />
                  <span className="hidden sm:inline">Tactile Audio</span>
                </>
              ) : (
                <>
                  <VolumeX size={15} className="text-[#94A3B8]" />
                  <span className="hidden sm:inline">Muted</span>
                </>
              )}
            </button>

            <Link
              href="/login"
              className="text-xs sm:text-sm font-semibold text-[#334155] hover:text-[#0F172A] px-2 py-1 transition-colors"
            >
              Sign In
            </Link>

            <Link
              href="/login"
              className="text-xs sm:text-sm font-bold bg-[#0F172A] text-white hover:bg-[#92400E] px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              Start Free Round
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-5 pt-12 sm:pt-16 pb-24">
        {/* Editorial Headline (No Eyebrow Chip) */}
        <div className="max-w-3xl mb-12">
          <h1
            style={{ textWrap: "balance" }}
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-heading text-[#0F172A] tracking-tight leading-[1.1] mb-5"
          >
            Every day a kirana shelf stays empty, another brand takes your space.
          </h1>
          <p className="text-base sm:text-lg text-[#334155] leading-relaxed max-w-2xl font-normal">
            Indian FMCG distributors lose over 15% of repeat orders because shop restock intervals rely on paper diaries and memory. Waymark turns your store rounds into an offline, self-adjusting daily dispatch line with instant dues collection at the tempo door.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <Link
              href="/login"
              className="px-6 py-3.5 rounded-xl bg-[#92400E] text-white font-bold text-sm hover:bg-[#78350F] transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <span>Build Today&apos;s Dispatch Route</span>
              <ArrowRight size={16} />
            </Link>
            <button
              type="button"
              onClick={() => {
                setOfflineSimulated(!offlineSimulated);
                playTactileAudio("switch");
              }}
              className="px-5 py-3.5 rounded-xl border border-[#D1D5DB] bg-white text-[#0F172A] font-semibold text-sm hover:bg-[#F3F4F6] transition-colors flex items-center gap-2"
            >
              {offlineSimulated ? (
                <>
                  <Wifi size={16} className="text-[#065F46]" />
                  <span>Simulating Offline (Click to Restore)</span>
                </>
              ) : (
                <>
                  <WifiOff size={16} className="text-[#475569]" />
                  <span>Test Mandi Basement Mode</span>
                </>
              )}
            </button>
          </div>

          {/* Authentic Tempo Loading Visual */}
          <div className="mt-8 rounded-2xl overflow-hidden border border-[#CBD5E1] shadow-sm relative">
            <img
              src="/images/wholesale-tempo-loading.jpg"
              alt="Indian FMCG delivery tempo being loaded outside a wholesale godown at dawn"
              className="w-full h-48 sm:h-72 object-cover object-center"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#0F172A]/90 via-[#0F172A]/50 to-transparent p-4 sm:p-5 flex items-center justify-between text-white">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#FDE68A] block">
                  6:30 AM Wholesale Godown Loading Dock
                </span>
                <span className="text-xs text-[#E2E8F0] font-medium hidden sm:inline">
                  LIFO crate sequence packing · First stop loaded right at the rear door
                </span>
              </div>
              <span className="text-xs font-mono font-bold bg-[#92400E] px-2.5 py-1 rounded-lg">
                Route 04 Dispatch
              </span>
            </div>
          </div>
        </div>

        {/* The Kinetic Dispatch Instrument (Flattened Container — No Nested Cards) */}
        <section className="mb-24 pt-4 border-t border-[#E5E7EB]">
          {/* Cockpit Status Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#065F46]" />
                <span className="text-sm font-extrabold font-heading tracking-wide uppercase text-[#0F172A]">
                  Active Dispatch Line · Route 04 (North Bazaar)
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#475569] mt-1">
                Tap any kirana stop to review crates and collect dues. Watch the tempo advance and cash tally adjust live.
              </p>
            </div>

            {/* Tally Metrics Ledger */}
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm tabular-nums">
              <div className="px-3.5 py-1.5 rounded-lg bg-white border border-[#CBD5E1] font-bold text-[#0F172A]">
                <span className="text-[#475569] font-normal mr-1.5">Progress:</span>
                {deliveredCount} of {stops.length} completed
              </div>
              <div className="px-3.5 py-1.5 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] font-bold text-[#065F46]">
                <span className="text-[#047857] font-normal mr-1.5">Collected:</span>
                ₹{collectedDues.toLocaleString("en-IN")}
              </div>
              {pendingDues > 0 && (
                <div className="px-3.5 py-1.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] font-bold text-[#991B1B]">
                  <span className="text-[#B91C1C] font-normal mr-1.5">Outstanding:</span>
                  ₹{pendingDues.toLocaleString("en-IN")}
                </div>
              )}
              {deliveredCount > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-1.5 text-[#475569] hover:text-[#0F172A] rounded border border-transparent hover:border-[#CBD5E1] transition-all"
                  title="Reset simulation to morning route start"
                >
                  <RotateCcw size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Split Dispatch Display: Left = Vertical Route Spine, Right = Interactive Challan Receipt */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
            {/* Left Column: Vertical Route Stops (7 cols) */}
            <div className="lg:col-span-7 space-y-4 relative">
              {stops.map((stop, idx) => {
                const isSelected = stop.id === selectedStopId;
                const isCurrentTempoTarget = idx === tempoCurrentIndex;

                return (
                  <div
                    key={stop.id}
                    onClick={() => {
                      setSelectedStopId(stop.id);
                      handleToggleDelivery(stop.id);
                    }}
                    className={`relative flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer ${
                      stop.delivered
                        ? "bg-[#F8FAFC] border-[#E2E8F0] opacity-80"
                        : isSelected
                        ? "bg-[#FFFBEB] border-[#D97706] shadow-sm ring-1 ring-[#D97706]"
                        : "bg-white border-[#E2E8F0] hover:border-[#94A3B8]"
                    }`}
                  >
                    {/* Vertical Route Connector */}
                    {idx < stops.length - 1 && (
                      <div
                        className={`absolute left-[31px] top-12 w-[2px] h-[calc(100%+8px)] transition-colors ${
                          stop.delivered ? "bg-[#065F46]" : "bg-[#E2E8F0]"
                        }`}
                      />
                    )}

                    {/* Transit Stop Marker / Checkbox */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleDelivery(stop.id);
                      }}
                      className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold transition-all z-10 ${
                        stop.delivered
                          ? "bg-[#065F46] text-white shadow-sm"
                          : stop.status === "urgent"
                          ? "border-2 border-[#DC2626] bg-[#FEF2F2] text-[#DC2626]"
                          : isCurrentTempoTarget
                          ? "border-2 border-[#92400E] bg-[#FEF3D6] text-[#78350F]"
                          : "border border-[#CBD5E1] bg-[#F8FAFC] text-[#475569]"
                      }`}
                    >
                      {stop.delivered ? (
                        <Check size={16} strokeWidth={3} />
                      ) : stop.status === "urgent" ? (
                        "!"
                      ) : (
                        idx + 1
                      )}
                    </button>

                    {/* Stop Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className={`text-sm sm:text-base font-bold font-heading truncate ${
                              stop.delivered ? "line-through text-[#475569]" : "text-[#0F172A]"
                            }`}
                          >
                            {stop.name}
                          </span>
                        </div>

                        {/* Status Pill */}
                        <div className="shrink-0 flex items-center gap-1.5">
                          {stop.status === "urgent" && !stop.delivered && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
                              Urgent
                            </span>
                          )}
                          {stop.status === "overdue" && !stop.delivered && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#FFFBEB] text-[#78350F] border border-[#FDE68A]">
                              Overdue
                            </span>
                          )}
                          {stop.delivered && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                              Delivered {stop.stampedAt && `· ${stop.stampedAt}`}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Lane address */}
                      <div className="text-xs text-[#475569] flex items-center gap-1 mt-0.5">
                        <MapPin size={12} className="shrink-0 text-[#64748B]" />
                        <span className="truncate">{stop.lane}</span>
                      </div>

                      {/* Order SKU summaries */}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {stop.crates.map((c, i) => (
                          <span
                            key={i}
                            className="text-xs font-semibold px-2 py-0.5 rounded bg-[#F1F5F9] text-[#1E293B] border border-[#CBD5E1]"
                          >
                            {c.name}: {c.count} {c.unit.split(" ")[0]}
                          </span>
                        ))}
                      </div>

                      {/* Outstanding dues row */}
                      <div className="mt-2.5 flex items-center justify-between text-xs text-[#334155]">
                        <span className="font-bold text-[#0F172A]">
                          Dues: ₹{stop.dues.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[#475569]">{stop.statusText}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Physical Carbon Challan & Cash Settlement Drawer (5 cols) */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-[#CBD5E1] rounded-xl p-5 relative overflow-hidden shadow-sm">
                {/* Perforated receipt header */}
                <div className="border-b border-dashed border-[#CBD5E1] pb-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#475569]">
                      Waymark Challan #WM-4092
                    </span>
                    <span className="text-xs font-bold text-[#065F46] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
                      Driver Copy
                    </span>
                  </div>
                  <div className="font-heading font-extrabold text-base text-[#0F172A] mt-2">
                    {selectedStop.name}
                  </div>
                  <div className="text-xs text-[#475569]">{selectedStop.lane}</div>
                </div>

                {/* Itemized Crate Manifest */}
                <div className="space-y-2 mb-4">
                  <div className="text-xs font-bold text-[#334155] uppercase tracking-wider">
                    Crate Manifest
                  </div>
                  {selectedStop.crates.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs sm:text-sm py-1.5 border-b border-[#F1F5F9]"
                    >
                      <div className="flex items-center gap-2">
                        <Package size={14} className="text-[#92400E]" />
                        <span className="font-semibold text-[#0F172A]">{c.name}</span>
                      </div>
                      <span className="font-mono text-[#1E293B] font-semibold">
                        {c.count} {c.unit}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Financial Settlement */}
                <div className="border-y border-[#E2E8F0] py-3.5 space-y-2 mb-5">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-[#475569]">Delivery Value:</span>
                    <span className="font-bold text-[#0F172A]">₹4,280</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-[#475569]">Previous Ledger Dues:</span>
                    <span className="font-bold text-[#991B1B]">
                      +₹{selectedStop.dues.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="border-t border-[#CBD5E1] pt-2 flex justify-between text-sm sm:text-base font-extrabold">
                    <span className="text-[#0F172A]">Net Cash to Collect:</span>
                    <span className="text-[#065F46]">
                      ₹{(4280 + selectedStop.dues).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Interactive Stamp & Deliver Action */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleToggleDelivery(selectedStop.id)}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                      selectedStop.delivered
                        ? "bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] hover:bg-[#D1FAE5]"
                        : "bg-[#0F172A] text-white hover:bg-[#92400E] shadow-md hover:shadow-lg"
                    }`}
                  >
                    {selectedStop.delivered ? (
                      <>
                        <Check size={18} strokeWidth={3} className="text-[#065F46]" />
                        <span>Stamped & Delivered (Click to Undo)</span>
                      </>
                    ) : (
                      <>
                        <IndianRupee size={16} />
                        <span>Collect Cash & Stamp Delivery</span>
                      </>
                    )}
                  </button>
                  <div className="text-xs text-center text-[#475569]">
                    Logs timestamp, records cash in driver tally, and shifts cycle interval.
                  </div>
                </div>

                {/* Rubber Stamp Visual Overlay if delivered */}
                {selectedStop.delivered && (
                  <div className="mt-4 border-2 border-[#065F46] rounded-lg p-2 text-center transform -rotate-1 bg-[#F0FDF4]">
                    <div className="text-xs font-mono font-extrabold uppercase text-[#065F46] tracking-widest">
                      ✓ PAID & DELIVERED
                    </div>
                    <div className="text-xs font-mono text-[#047857]">
                      {selectedStop.stampedAt || "08:45 AM"} · CHAL-OK
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* The 48-Hour Kirana Rack Battle (Interactive Timeline Simulator) */}
        <section className="mb-24 pt-8 border-t border-[#E5E7EB]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8">
            <div className="lg:col-span-7">
              <h2
                style={{ textWrap: "balance" }}
                className="text-2xl sm:text-4xl font-extrabold font-heading text-[#0F172A] tracking-tight mb-3"
              >
                The 48-Hour Shelf Gap
              </h2>
              <p className="text-sm sm:text-base text-[#475569] leading-relaxed">
                When a kirana rack runs dry, the storekeeper doesn&apos;t wait for your salesman. A competitor salesman walks in, sees the void, and pays ₹500 for the front counter facing.
              </p>
            </div>
            <div className="lg:col-span-5 rounded-xl overflow-hidden border border-[#CBD5E1] shadow-sm relative">
              <img
                src="/images/kirana-stocked-rack.jpg"
                alt="Neat kirana counter rack stocked with biscuits and FMCG goods"
                className="w-full h-44 object-cover object-center"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#0F172A]/85 to-transparent p-2.5 text-white flex items-center justify-between text-xs">
                <span className="font-semibold text-[#FEF3C7]">Front Counter Facing</span>
                <span className="text-slate-300">Prime Kirana Real Estate</span>
              </div>
            </div>
          </div>

          {/* Interactive Step Switcher */}
          <div className="flex items-center gap-2 mb-6">
            <button
              type="button"
              onClick={() => {
                setShelfStep(0);
                playTactileAudio("tick");
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                shelfStep === 0
                  ? "bg-[#0F172A] text-white shadow-sm"
                  : "bg-white border border-[#CBD5E1] text-[#334155] hover:text-[#0F172A]"
              }`}
            >
              Day 0: Full Shelf
            </button>
            <button
              type="button"
              onClick={() => {
                setShelfStep(1);
                playTactileAudio("tick");
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                shelfStep === 1
                  ? "bg-[#0F172A] text-white shadow-sm"
                  : "bg-white border border-[#CBD5E1] text-[#334155] hover:text-[#0F172A]"
              }`}
            >
              Day 5: Shelf Empties
            </button>
            <button
              type="button"
              onClick={() => {
                setShelfStep(2);
                playTactileAudio("tick");
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                shelfStep === 2
                  ? "bg-[#0F172A] text-white shadow-sm"
                  : "bg-white border border-[#CBD5E1] text-[#334155] hover:text-[#0F172A]"
              }`}
            >
              Day 7: The Outcome
            </button>
          </div>

          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* The Notebook Way (Failure) */}
            <div className="bg-white border border-[#FECACA] rounded-xl p-6 relative">
              <div className="text-xs font-bold text-[#991B1B] uppercase tracking-wider mb-2">
                Without Waymark · Memory & Notebooks
              </div>
              <div className="font-heading font-extrabold text-lg text-[#0F172A] mb-3">
                {shelfStep === 0 && "Cases delivered. Salesman writes date in a paper register."}
                {shelfStep === 1 && "Biscuits sell out on Thursday 4 PM. Shelf stays completely empty."}
                {shelfStep === 2 && "Competitor van arrives Friday morning. Your rack facing is gone."}
              </div>
              <p className="text-sm text-[#475569] leading-relaxed">
                {shelfStep === 0 &&
                  "Salesman plans to return in 10 days, but doesn't track that this store's turnover increased 40% due to local school re-opening."}
                {shelfStep === 1 &&
                  "Storekeeper is busy with retail customers and forgets to phone the distributor. Two days of prime weekend sales are permanently lost."}
                {shelfStep === 2 &&
                  "A rival brand's driver offers a 12-case deal with free display strip. When your driver finally shows up Monday, the storekeeper cancels the order."}
              </p>
              <div className="mt-4 pt-4 border-t border-[#FEE2E2] flex items-center justify-between text-xs font-semibold text-[#991B1B]">
                <span>Result: Account lost or downsized</span>
                <span className="font-bold">-₹18,500 monthly GMV</span>
              </div>
            </div>

            {/* The Waymark Way (Success) */}
            <div className="bg-white border border-[#A7F3D0] rounded-xl p-6 relative">
              <div className="text-xs font-bold text-[#065F46] uppercase tracking-wider mb-2">
                With Waymark · Self-Correcting Interval
              </div>
              <div className="font-heading font-extrabold text-lg text-[#0F172A] mb-3">
                {shelfStep === 0 && "First drop logs automatically. Interval set to 6-day baseline."}
                {shelfStep === 1 && "Waymark detects stock cycle velocity and alerts for early drop."}
                {shelfStep === 2 && "Tempo drops 3 fresh crates on Day 5 at 8:15 AM. 100% shelf dominance."}
              </div>
              <p className="text-sm text-[#475569] leading-relaxed">
                {shelfStep === 0 &&
                  "Every stop records historical replenishment cadence in local IndexedDB. No manual memory needed."}
                {shelfStep === 1 &&
                  "Waymark notices high weekend velocity and schedules the stop for Friday morning before the shelf runs dry."}
                {shelfStep === 2 &&
                  "Fresh cases arrive before competitor salesmen can even pitch. The storekeeper relies exclusively on your dependable schedule."}
              </p>
              <div className="mt-4 pt-4 border-t border-[#D1FAE5] flex items-center justify-between text-xs font-semibold text-[#065F46]">
                <span>Result: Permanent counter dominance</span>
                <span className="font-bold">+18% repeat order retention</span>
              </div>
            </div>
          </div>
        </section>

        {/* Operating Pillars (Without AI Tells or Icon Tiles) */}
        <section className="mb-20 pt-8 border-t border-[#E5E7EB]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8">
            <div className="lg:col-span-7">
              <h2
                style={{ textWrap: "balance" }}
                className="text-2xl sm:text-4xl font-extrabold font-heading text-[#0F172A] tracking-tight mb-3"
              >
                Built for the Physical Realities of Indian Wholesale
              </h2>
              <p className="text-sm sm:text-base text-[#475569]">
                Engineered for dusty mandi basements, one-handed phone use in moving auto-tempos, and end-of-day cash reconciliation.
              </p>
            </div>
            <div className="lg:col-span-5 rounded-xl overflow-hidden border border-[#CBD5E1] shadow-sm relative">
              <img
                src="/images/kirana-store-dawn.jpg"
                alt="Kirana grocery store in early morning bazaar with crates on display"
                className="w-full h-44 object-cover object-center"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#0F172A]/85 to-transparent p-2.5 text-white flex items-center justify-between text-xs">
                <span className="font-semibold text-[#FEF3C7]">Bazaar Dawn Deliveries</span>
                <span className="text-slate-300">Deliveries before shutters roll up</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
              <div className="text-xs font-bold text-[#92400E] uppercase tracking-wider mb-2">
                Pillar 01 · Signal Independence
              </div>
              <h3 className="font-heading font-extrabold text-lg text-[#0F172A] mb-2">
                100% Offline in Mandi Basements
              </h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                Underground godowns and dense mandi alleys have zero cell connectivity. Waymark runs locally inside browser IndexedDB, logging deliveries, challans, and cash tallies instantly with zero loading spinners.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
              <div className="text-xs font-bold text-[#065F46] uppercase tracking-wider mb-2">
                Pillar 02 · Cash Ledger
              </div>
              <h3 className="font-heading font-extrabold text-lg text-[#0F172A] mb-2">
                Doorstep Dues & UPI Settlement
              </h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                Collect old dues right as fresh crates are unloaded. Drivers see exactly which stores have credit limits, take partial cash or dynamic UPI QR payments, and reconcile physical cash notes at warehouse return.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
              <div className="text-xs font-bold text-[#1E40AF] uppercase tracking-wider mb-2">
                Pillar 03 · Dispatch Logic
              </div>
              <h3 className="font-heading font-extrabold text-lg text-[#0F172A] mb-2">
                LIFO Crate Sequence & Petrol Burn
              </h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                Stops are ordered so crates for your first stop sit right at the tempo&apos;s back door. Drivers never unpack 30 crates in a narrow alley just to find one box of Maggi, cutting route duration by 45 minutes daily.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA Bar */}
        <section className="bg-[#0F172A] text-white rounded-2xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <div className="max-w-2xl relative z-10">
            <h2
              style={{ textWrap: "balance" }}
              className="text-2xl sm:text-4xl font-extrabold font-heading tracking-tight mb-4 text-white"
            >
              Stop losing shelf space to competitors. Start your first route today.
            </h2>
            <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed mb-8">
              No software installation required. Works on any Android phone or tablet. Import your shop ledger via CSV or start adding stores one by one.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/login"
                className="px-6 py-3.5 rounded-xl bg-[#92400E] text-white font-bold text-sm hover:bg-[#78350F] transition-all shadow-md"
              >
                Launch Free Waymark Account
              </Link>
              <Link
                href="/login"
                className="px-5 py-3.5 rounded-xl border border-[#334155] bg-transparent text-white font-semibold text-sm hover:bg-[#1E293B] transition-colors"
              >
                Sign In to Existing Agency
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E7EB] bg-white py-10">
        <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#475569]">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-[#0F172A]">Waymark</span>
            <span>· FMCG Wholesale Delivery & Shelf Replenishment System</span>
          </div>
          <div>Built for Indian FMCG Distributors, Agencies, and Wholesale Routes</div>
        </div>
      </footer>
    </div>
  );
}
