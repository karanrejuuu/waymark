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
  Layers,
  Fuel,
  ShieldCheck,
  Smartphone,
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

export const LandingShowcase: React.FC = () => {
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

  const playTactileAudio = (type: "tick" | "stamp" | "switch") => {
    if (typeof window === "undefined" || !soundEnabled) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "tick") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(550, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.05);
      } else if (type === "stamp") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.14);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.14);
      } else {
        osc.type = "sine";
        osc.frequency.setValueAtTime(360, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.04);
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
    <div className="min-h-screen bg-[#0A0A0C] text-[#F4F4F6] selection:bg-[#B5F23D] selection:text-[#0C1004] antialiased">
      {/* Offline Simulation Banner */}
      {offlineSimulated && (
        <div className="bg-[#1B1B20] text-[#B5F23D] border-b border-[#B5F23D]/30 px-4 py-2 text-xs font-mono flex items-center justify-between sticky top-0 z-50">
          <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WifiOff size={15} className="text-[#B5F23D]" />
              <span>Mandi Basement Mode: Zero cellular signal. All dispatch records buffered in local IndexedDB.</span>
            </div>
            <button
              onClick={() => {
                setOfflineSimulated(false);
                playTactileAudio("switch");
              }}
              className="text-xs bg-[#B5F23D] text-[#0C1004] px-2.5 py-0.5 rounded font-bold transition-transform active:scale-95"
            >
              Restore 4G
            </button>
          </div>
        </div>
      )}

      {/* Cadnex Glass Header */}
      <header className="border-b border-white/[0.08] bg-[#0A0A0C]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#B5F23D] text-[#0C1004] flex items-center justify-center font-bold text-sm font-mono shadow-sm">
              W
            </span>
            <div>
              <span className="font-sans font-bold text-base tracking-tight text-[#F4F4F6] block leading-tight">
                WAYMARK
              </span>
              <span className="text-xs font-mono tracking-wider uppercase text-[#8C8C96] block">
                FMCG Wholesale Dispatch Line
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playTactileAudio("tick");
              }}
              title={soundEnabled ? "Disable tactile audio" : "Enable tactile audio"}
              className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded-xl border border-white/[0.08] bg-[#131316] text-[#8C8C96] hover:text-[#F4F4F6] transition-colors"
            >
              {soundEnabled ? (
                <>
                  <Volume2 size={14} className="text-[#B5F23D]" />
                  <span className="hidden sm:inline">Tactile Audio</span>
                </>
              ) : (
                <>
                  <VolumeX size={14} />
                  <span className="hidden sm:inline">Muted</span>
                </>
              )}
            </button>

            <Link
              href="/login"
              className="text-xs font-semibold text-[#8C8C96] hover:text-[#F4F4F6] px-2.5 py-1.5 transition-colors"
            >
              Sign In
            </Link>

            <Link
              href="/login"
              className="text-xs font-bold bg-[#B5F23D] text-[#0C1004] hover:bg-[#A3DE30] px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
            >
              Start Free Round
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-5 pt-12 sm:pt-16 pb-24">
        <div className="max-w-3xl mb-12">
          {/* Micro status badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#131316] border border-white/[0.08] mb-6">
            <span className="w-2 h-2 rounded-full bg-[#B5F23D]" />
            <span className="text-xs font-mono uppercase tracking-wider text-[#8C8C96]">
              Indian Wholesale Distribution Engine
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F4F4F6] leading-[1.08] mb-5">
            Every day a kirana shelf stays empty, another brand takes your space.
          </h1>
          <p className="text-base sm:text-lg text-[#8C8C96] leading-relaxed max-w-2xl">
            Indian FMCG distributors lose over 15% of repeat volume when shop replenishment relies on diaries and driver memory. Waymark turns your store rounds into an offline, self-adjusting daily dispatch line with instant cash settlement at the tempo door.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="px-6 py-3.5 rounded-xl bg-[#B5F23D] text-[#0C1004] font-bold text-xs hover:bg-[#A3DE30] transition-all shadow-float flex items-center gap-2 active:scale-95"
            >
              <span>Build Today&apos;s Dispatch Route</span>
              <ArrowRight size={15} />
            </Link>
            <button
              type="button"
              onClick={() => {
                setOfflineSimulated(!offlineSimulated);
                playTactileAudio("switch");
              }}
              className="px-5 py-3.5 rounded-xl border border-white/[0.1] bg-[#131316] text-[#F4F4F6] font-semibold text-xs hover:bg-[#1B1B20] transition-colors flex items-center gap-2"
            >
              {offlineSimulated ? (
                <>
                  <Wifi size={15} className="text-[#22C55E]" />
                  <span>Offline Active (Click to Restore)</span>
                </>
              ) : (
                <>
                  <WifiOff size={15} className="text-[#8C8C96]" />
                  <span>Test Mandi Basement Mode</span>
                </>
              )}
            </button>
          </div>

          {/* Authentic Tempo Loading Visual */}
          <div className="mt-8 rounded-2xl overflow-hidden border border-white/[0.08] shadow-lift relative">
            <img
              src="/images/wholesale-tempo-loading.jpg"
              alt="Indian FMCG delivery tempo loading outside a wholesale godown at dawn"
              className="w-full h-48 sm:h-72 object-cover object-center"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#0A0A0C] via-[#0A0A0C]/70 to-transparent p-4 sm:p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#B5F23D] block">
                  6:30 AM Wholesale Godown Loading Dock
                </span>
                <span className="text-xs text-[#8C8C96] font-medium hidden sm:inline">
                  LIFO crate sequence packing · First delivery loaded right at the rear door
                </span>
              </div>
              <span className="text-xs font-mono font-bold bg-[#1B1B20] text-[#F4F4F6] border border-white/[0.1] px-2.5 py-1 rounded-lg">
                Route 04 Dispatch
              </span>
            </div>
          </div>
        </div>

        {/* The Kinetic Dispatch Instrument */}
        <section className="mb-24 pt-6 border-t border-white/[0.08]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B5F23D]" />
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#F4F4F6]">
                  Active Dispatch Line · Route 04 (North Bazaar)
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#8C8C96] mt-1">
                Tap any kirana stop to review crates and collect dues. Watch the tempo advance and cash tally adjust live.
              </p>
            </div>

            {/* Metrics Tally */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono tabular-nums">
              <div className="px-3.5 py-1.5 rounded-xl bg-[#131316] border border-white/[0.08] text-[#F4F4F6]">
                <span className="text-[#8C8C96] mr-1.5">Progress:</span>
                {deliveredCount} of {stops.length} completed
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/25 text-[#4ADE80] font-bold">
                <span className="text-zinc-400 mr-1.5">Collected:</span>
                ₹{collectedDues.toLocaleString("en-IN")}
              </div>
              {pendingDues > 0 && (
                <div className="px-3.5 py-1.5 rounded-xl bg-[#F43F5E]/10 border border-[#F43F5E]/25 text-[#FDA4AF] font-bold">
                  <span className="text-zinc-400 mr-1.5">Outstanding:</span>
                  ₹{pendingDues.toLocaleString("en-IN")}
                </div>
              )}
              {deliveredCount > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-1.5 text-[#8C8C96] hover:text-[#F4F4F6] rounded-lg border border-white/[0.08] bg-[#131316] transition-all"
                  title="Reset simulation to morning route start"
                >
                  <RotateCcw size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Split Dispatch Display */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            {/* Left: Route Stops */}
            <div className="lg:col-span-7 space-y-3 relative">
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
                    className={`relative flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${
                      stop.delivered
                        ? "bg-[#131316]/60 border-white/[0.04] opacity-75"
                        : isSelected
                        ? "bg-[#18181E] border-[#B5F23D]/50 shadow-float ring-1 ring-[#B5F23D]/20"
                        : "bg-[#131316] border-white/[0.08] hover:border-white/[0.18]"
                    }`}
                  >
                    {/* Vertical spine */}
                    {idx < stops.length - 1 && (
                      <div
                        className={`absolute left-[31px] top-12 w-[2px] h-[calc(100%+6px)] transition-colors ${
                          stop.delivered ? "bg-[#22C55E]" : "bg-white/[0.08]"
                        }`}
                      />
                    )}

                    {/* Marker */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleDelivery(stop.id);
                      }}
                      className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-mono font-bold transition-all z-10 ${
                        stop.delivered
                          ? "bg-[#B5F23D] text-[#0C1004] shadow-sm"
                          : stop.status === "urgent"
                          ? "border-2 border-[#F43F5E] bg-[#F43F5E]/20 text-[#FDA4AF]"
                          : isCurrentTempoTarget
                          ? "border-2 border-[#B5F23D] bg-[#B5F23D]/10 text-[#B5F23D]"
                          : "border border-white/[0.16] bg-[#1B1B20] text-[#8C8C96]"
                      }`}
                    >
                      {stop.delivered ? (
                        <Check size={14} strokeWidth={3} />
                      ) : stop.status === "urgent" ? (
                        "!"
                      ) : (
                        idx + 1
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-sm font-bold truncate ${
                            stop.delivered ? "line-through text-[#8C8C96]" : "text-[#F4F4F6]"
                          }`}
                        >
                          {stop.name}
                        </span>

                        <div className="shrink-0 flex items-center gap-1.5">
                          {stop.status === "urgent" && !stop.delivered && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#F43F5E]/15 text-[#FDA4AF] border border-[#F43F5E]/40">
                              Urgent
                            </span>
                          )}
                          {stop.status === "overdue" && !stop.delivered && (
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#F59E0B]/15 text-[#FCD34D] border border-[#F59E0B]/40">
                              Overdue
                            </span>
                          )}
                          {stop.delivered && (
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#22C55E]/15 text-[#4ADE80] border border-[#22C55E]/40">
                              Delivered {stop.stampedAt && `· ${stop.stampedAt}`}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-[#8C8C96] flex items-center gap-1 mt-0.5">
                        <MapPin size={12} className="shrink-0 text-[#54545E]" />
                        <span className="truncate">{stop.lane}</span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {stop.crates.map((c, i) => (
                          <span
                            key={i}
                            className="text-xs font-mono px-2 py-0.5 rounded-lg bg-[#1B1B20] text-[#F4F4F6] border border-white/[0.06]"
                          >
                            {c.name}: <span className="text-[#B5F23D] font-bold">{c.count} {c.unit.split(" ")[0]}</span>
                          </span>
                        ))}
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-[#F4F4F6]">
                          Dues: ₹{stop.dues.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[#8C8C96]">{stop.statusText}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Challan Drawer */}
            <div className="lg:col-span-5">
              <div className="bg-[#131316] border border-white/[0.08] rounded-2xl p-5 shadow-lift relative">
                <div className="border-b border-white/[0.08] pb-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8C8C96]">
                      Waymark Challan #WM-4092
                    </span>
                    <span className="text-xs font-mono font-bold text-[#B5F23D] bg-[#B5F23D]/10 px-2 py-0.5 rounded border border-[#B5F23D]/20">
                      Driver Copy
                    </span>
                  </div>
                  <div className="font-bold text-base text-[#F4F4F6] mt-2">
                    {selectedStop.name}
                  </div>
                  <div className="text-xs text-[#8C8C96]">{selectedStop.lane}</div>
                </div>

                {/* Itemized Crate Manifest */}
                <div className="space-y-2 mb-4">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#8C8C96]">
                    Crate Manifest
                  </div>
                  {selectedStop.crates.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs py-1.5 border-b border-white/[0.04]"
                    >
                      <div className="flex items-center gap-2">
                        <Package size={14} className="text-[#B5F23D]" />
                        <span className="font-semibold text-[#F4F4F6]">{c.name}</span>
                      </div>
                      <span className="font-mono text-[#8C8C96]">
                        {c.count} {c.unit}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Financial Settlement */}
                <div className="border-y border-white/[0.08] py-3.5 space-y-2 mb-5 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#8C8C96]">Delivery Value:</span>
                    <span className="font-bold text-[#F4F4F6]">₹4,280</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8C8C96]">Previous Ledger Dues:</span>
                    <span className="font-bold text-[#F43F5E]">
                      +₹{selectedStop.dues.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="border-t border-white/[0.08] pt-2 flex justify-between text-sm font-bold">
                    <span className="text-[#F4F4F6]">Net Cash to Collect:</span>
                    <span className="text-[#B5F23D]">
                      ₹{(4280 + selectedStop.dues).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Stamp Action */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleToggleDelivery(selectedStop.id)}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm ${
                      selectedStop.delivered
                        ? "bg-[#22C55E]/15 text-[#4ADE80] border border-[#22C55E]/40 hover:bg-[#22C55E]/25"
                        : "bg-[#B5F23D] text-[#0C1004] hover:bg-[#A3DE30] active:scale-95"
                    }`}
                  >
                    {selectedStop.delivered ? (
                      <>
                        <Check size={16} strokeWidth={3} className="text-[#22C55E]" />
                        <span>Stamped & Delivered (Click to Undo)</span>
                      </>
                    ) : (
                      <>
                        <IndianRupee size={15} />
                        <span>Collect Cash & Stamp Delivery</span>
                      </>
                    )}
                  </button>
                  <div className="text-xs font-mono text-center text-[#8C8C96]">
                    Logs timestamp, records cash in driver tally, and shifts cycle interval.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 48-Hour Kirana Shelf Battle */}
        <section className="mb-24 pt-8 border-t border-white/[0.08]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8">
            <div className="lg:col-span-7">
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#F4F4F6] mb-3">
                The 48-Hour Shelf Gap
              </h2>
              <p className="text-sm sm:text-base text-[#8C8C96] leading-relaxed">
                When a kirana rack runs dry, the storekeeper doesn&apos;t wait for your salesman. A competitor salesman walks in, sees the void, and pays ₹500 for the front counter facing.
              </p>
            </div>
            <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-white/[0.08] shadow-lift relative">
              <img
                src="/images/kirana-stocked-rack.jpg"
                alt="Neat kirana counter rack stocked with biscuits and FMCG goods"
                className="w-full h-44 object-cover object-center"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#0A0A0C] to-transparent p-3 text-[#F4F4F6] flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-[#B5F23D]">Front Counter Facing</span>
                <span className="text-[#8C8C96]">Prime Kirana Real Estate</span>
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                shelfStep === 0
                  ? "bg-[#B5F23D] text-[#0C1004] shadow-sm"
                  : "bg-[#131316] border border-white/[0.08] text-[#8C8C96] hover:text-[#F4F4F6]"
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                shelfStep === 1
                  ? "bg-[#B5F23D] text-[#0C1004] shadow-sm"
                  : "bg-[#131316] border border-white/[0.08] text-[#8C8C96] hover:text-[#F4F4F6]"
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                shelfStep === 2
                  ? "bg-[#B5F23D] text-[#0C1004] shadow-sm"
                  : "bg-[#131316] border border-white/[0.08] text-[#8C8C96] hover:text-[#F4F4F6]"
              }`}
            >
              Day 7: The Outcome
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* The Notebook Way */}
            <div className="bg-[#131316] border border-[#F43F5E]/30 rounded-2xl p-6 relative">
              <div className="text-xs font-mono font-bold text-[#FDA4AF] uppercase tracking-wider mb-2">
                Without Waymark · Memory & Notebooks
              </div>
              <div className="font-bold text-lg text-[#F4F4F6] mb-3">
                {shelfStep === 0 && "Cases delivered. Salesman writes date in a paper register."}
                {shelfStep === 1 && "Biscuits sell out on Thursday 4 PM. Shelf stays completely empty."}
                {shelfStep === 2 && "Competitor van arrives Friday morning. Your rack facing is gone."}
              </div>
              <p className="text-sm text-[#8C8C96] leading-relaxed">
                {shelfStep === 0 &&
                  "Salesman plans to return in 10 days, but doesn't track that this store's turnover increased 40% due to local school re-opening."}
                {shelfStep === 1 &&
                  "Storekeeper is busy with retail customers and forgets to phone the distributor. Two days of prime weekend sales are permanently lost."}
                {shelfStep === 2 &&
                  "A rival brand's driver offers a 12-case deal with free display strip. When your driver finally shows up Monday, the storekeeper cancels the order."}
              </p>
              <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono font-semibold text-[#FDA4AF]">
                <span>Result: Account lost or downsized</span>
                <span className="font-bold">-₹18,500 monthly GMV</span>
              </div>
            </div>

            {/* The Waymark Way */}
            <div className="bg-[#131316] border border-[#22C55E]/40 rounded-2xl p-6 relative">
              <div className="text-xs font-mono font-bold text-[#B5F23D] uppercase tracking-wider mb-2">
                With Waymark · Self-Correcting Interval
              </div>
              <div className="font-bold text-lg text-[#F4F4F6] mb-3">
                {shelfStep === 0 && "First drop logs automatically. Interval set to 6-day baseline."}
                {shelfStep === 1 && "Waymark detects stock cycle velocity and alerts for early drop."}
                {shelfStep === 2 && "Tempo drops 3 fresh crates on Day 5 at 8:15 AM. 100% shelf dominance."}
              </div>
              <p className="text-sm text-[#8C8C96] leading-relaxed">
                {shelfStep === 0 &&
                  "Every stop records historical replenishment cadence in local IndexedDB. No manual memory needed."}
                {shelfStep === 1 &&
                  "Waymark notices high weekend velocity and schedules the stop for Friday morning before the shelf runs dry."}
                {shelfStep === 2 &&
                  "Fresh cases arrive before competitor salesmen can even pitch. The storekeeper relies exclusively on your dependable schedule."}
              </p>
              <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono font-semibold text-[#B5F23D]">
                <span>Result: Permanent counter dominance</span>
                <span className="font-bold">+18% repeat order retention</span>
              </div>
            </div>
          </div>
        </section>

        {/* Operating Pillars */}
        <section className="mb-20 pt-8 border-t border-white/[0.08]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8">
            <div className="lg:col-span-7">
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#F4F4F6] mb-3">
                Built for the Physical Realities of Indian Wholesale
              </h2>
              <p className="text-sm sm:text-base text-[#8C8C96]">
                Engineered for dusty mandi basements, one-handed phone use in moving auto-tempos, and end-of-day cash reconciliation.
              </p>
            </div>
            <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-white/[0.08] shadow-lift relative">
              <img
                src="/images/kirana-store-dawn.jpg"
                alt="Kirana grocery store in early morning bazaar with crates on display"
                className="w-full h-44 object-cover object-center"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#0A0A0C] to-transparent p-3 text-[#F4F4F6] flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-[#B5F23D]">Bazaar Dawn Deliveries</span>
                <span className="text-[#8C8C96]">Drop-offs before shutters roll up</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#131316] border border-white/[0.08] rounded-2xl p-6">
              <div className="text-xs font-mono font-bold text-[#B5F23D] uppercase tracking-wider mb-2">
                Pillar 01 · Signal Independence
              </div>
              <h3 className="font-bold text-lg text-[#F4F4F6] mb-2">
                100% Offline in Mandi Basements
              </h3>
              <p className="text-xs sm:text-sm text-[#8C8C96] leading-relaxed">
                Underground godowns and dense mandi alleys have zero cell connectivity. Waymark runs locally inside browser IndexedDB, logging deliveries, challans, and cash tallies instantly with zero loading spinners.
              </p>
            </div>

            <div className="bg-[#131316] border border-white/[0.08] rounded-2xl p-6">
              <div className="text-xs font-mono font-bold text-[#4ADE80] uppercase tracking-wider mb-2">
                Pillar 02 · Cash Ledger
              </div>
              <h3 className="font-bold text-lg text-[#F4F4F6] mb-2">
                Doorstep Dues & UPI Settlement
              </h3>
              <p className="text-xs sm:text-sm text-[#8C8C96] leading-relaxed">
                Collect old dues right as fresh crates are unloaded. Drivers see credit limits, take partial cash or dynamic UPI QR payments, and reconcile physical cash notes at warehouse return.
              </p>
            </div>

            <div className="bg-[#131316] border border-white/[0.08] rounded-2xl p-6">
              <div className="text-xs font-mono font-bold text-[#FCD34D] uppercase tracking-wider mb-2">
                Pillar 03 · Dispatch Logic
              </div>
              <h3 className="font-bold text-lg text-[#F4F4F6] mb-2">
                LIFO Crate Sequence & Petrol Burn
              </h3>
              <p className="text-xs sm:text-sm text-[#8C8C96] leading-relaxed">
                Stops are ordered so crates for your first stop sit right at the tempo&apos;s back door. Drivers never unpack 30 crates in a narrow alley just to find one box of biscuits, cutting route duration by 45 minutes daily.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA Bar */}
        <section className="bg-[#131316] border border-white/[0.08] rounded-3xl p-8 sm:p-12 shadow-float relative overflow-hidden">
          <div className="max-w-2xl relative z-10">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-4 text-[#F4F4F6]">
              Stop losing shelf space to competitors. Start your first route today.
            </h2>
            <p className="text-sm sm:text-base text-[#8C8C96] leading-relaxed mb-8">
              Zero software installation required. Works on any smartphone or tablet. Import your shop ledger via CSV or start adding stores one by one.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="px-6 py-3.5 rounded-xl bg-[#B5F23D] text-[#0C1004] font-bold text-xs hover:bg-[#A3DE30] transition-all shadow-md active:scale-95"
              >
                Launch Free Waymark Account
              </Link>
              <Link
                href="/login"
                className="px-5 py-3.5 rounded-xl border border-white/[0.1] bg-[#1B1B20] text-[#F4F4F6] font-semibold text-xs hover:bg-[#26262D] transition-colors"
              >
                Sign In to Existing Agency
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-[#0A0A0C] py-10">
        <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#8C8C96]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#F4F4F6]">Waymark</span>
            <span>· FMCG Wholesale Delivery & Shelf Replenishment System</span>
          </div>
          <div>Built for Indian FMCG Distributors, Agencies, and Wholesale Routes</div>
        </div>
      </footer>
    </div>
  );
};
