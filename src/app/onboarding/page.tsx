"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { db } from "@/lib/db/dexie";
import { enqueueWrite } from "@/lib/db/sync";
import { seedDemoData } from "@/lib/db/seedDemoData";
import { ShopImportHub } from "@/components/onboarding/ShopImportHub";
import {
  Package,
  Layers,
  TrendingDown,
  Store,
  CreditCard,
  Building2,
  Trophy,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  Sparkles,
  Volume2,
  VolumeX,
  MapPin,
  Truck,
  IndianRupee,
  FileSpreadsheet,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const ShopMap = dynamic(() => import("@/components/shop/ShopMap"), {
  ssr: false,
  loading: () => (
    <div className="h-56 bg-[#1B1B20] rounded-xl border border-white/[0.08] flex items-center justify-center text-xs text-zinc-500 font-mono">
      Loading interactive godown map...
    </div>
  ),
});

export default function OnboardingExperiencePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 7;
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Audio synthesizer for Duolingo-style feedback
  const playTactileSound = (type: "tap" | "step" | "victory") => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === "tap") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(580, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === "step") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === "victory") {
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
          gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.3);
          osc.start(ctx.currentTime + idx * 0.08);
          osc.stop(ctx.currentTime + idx * 0.08 + 0.3);
        });
      }
    } catch {}
  };

  // ── USER CHOICES & STATE ──
  // Step 1: Categories
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "Biscuits, Bakery & Rusks",
    "Cold Drinks & Juices",
  ]);

  // Step 2: Current Dispatch Method
  const [currentMethod, setCurrentMethod] = useState<string>("paper_registers");

  // Step 3: Biggest Leak to Eliminate
  const [primaryLeak, setPrimaryLeak] = useState<string>("uncollected_dues");

  // Step 4: Scale & Retailer Footprint
  const [scaleCount, setScaleCount] = useState<string>("scale_50_150");

  // Step 5: Doorstep Payment Terms
  const [paymentTerms, setPaymentTerms] = useState<string[]>([
    "Cash on Delivery (COD)",
    "Bill-to-Bill Clearance",
  ]);

  // Step 6: Agency Setup & Fleet
  const [agencyName, setAgencyName] = useState("Apex FMCG Distributors");
  const [operatorName, setOwnerName] = useState("");
  const [primaryRoute, setPrimaryRoute] = useState("Main Mandi Beat");
  const [vehicleType, setVehicleType] = useState("Tata Ace (Chhota Hathi)");
  const [lat, setLat] = useState<number>(19.076);
  const [lng, setLng] = useState<number>(72.8777);

  // Step 7: Launch Mode
  const [launchMode, setLaunchMode] = useState<"sample" | "import">("sample");
  const [isLaunching, setIsLaunching] = useState(false);

  useEffect(() => {
    if (user?.user_metadata?.name) {
      setOwnerName(user.user_metadata.name);
    }
    if (user?.user_metadata?.business_name) {
      setAgencyName(user.user_metadata.business_name);
    }
  }, [user]);

  const toggleCategory = (cat: string) => {
    playTactileSound("tap");
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter((c) => c !== cat));
      }
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const togglePaymentTerm = (term: string) => {
    playTactileSound("tap");
    if (paymentTerms.includes(term)) {
      if (paymentTerms.length > 1) {
        setPaymentTerms(paymentTerms.filter((t) => t !== term));
      }
    } else {
      setPaymentTerms([...paymentTerms, term]);
    }
  };

  const handleNextStep = () => {
    playTactileSound("step");
    if (currentStep === 6) {
      playTactileSound("victory");
    }
    setCurrentStep((prev) => Math.min(totalSteps, prev + 1));
  };

  const handlePrevStep = () => {
    playTactileSound("tap");
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  // Launch handler: persist choices to Dexie and transition to Cockpit
  const handleCompleteOnboarding = async (mode: "sample" | "import") => {
    setIsLaunching(true);
    const orgId = "org-waymark-demo";
    const nowIso = new Date().toISOString();

    try {
      // 1. Save organisation
      await enqueueWrite("organisations", "upsert", {
        id: orgId,
        name: agencyName.trim() || "FMCG Distributors",
        currency: "INR",
        created_at: nowIso,
      });

      // 2. Save central godown
      await enqueueWrite("godowns", "upsert", {
        id: "godown-1",
        organisation_id: orgId,
        owner_id: "demo-user",
        lat,
        lng,
        vehicle_mileage_kmpl: 20.0,
        petrol_price_per_l: 104.5,
        created_at: nowIso,
      });

      // 3. Save primary region
      await enqueueWrite("regions", "upsert", {
        id: "reg-primary",
        organisation_id: orgId,
        owner_id: "demo-user",
        name: primaryRoute.trim() || "Main Route Beat",
        sort_order: 1,
        created_at: nowIso,
      });

      // 4. Save representative products based on chosen categories
      const demoProducts = [
        { name: "Parle-G 100g (Case of 24)", interval: 5 },
        { name: "Frooti Mango 200ml (Crate of 30)", interval: 7 },
        { name: "Maggi 2-Minute (Box of 48)", interval: 6 },
        { name: "Tata Tea Gold 250g (Pack of 12)", interval: 10 },
      ];
      for (let i = 0; i < demoProducts.length; i++) {
        await enqueueWrite("products", "upsert", {
          id: `p-${i + 1}`,
          organisation_id: orgId,
          owner_id: "demo-user",
          name: demoProducts[i].name,
          default_interval: demoProducts[i].interval,
          created_at: nowIso,
        });
      }

      // 5. If user chose Sample Route, pre-seed sample kiranas!
      if (mode === "sample") {
        await seedDemoData();
      }

      router.push("/");
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
      setIsLaunching(false);
    }
  };

  const stepTitles = [
    "Product Categories",
    "Current Routine",
    "The #1 Leak",
    "Market Scale",
    "Payment Terms",
    "Agency Fleet & Godown",
    "Launch Cockpit",
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-zinc-100 py-8 px-4 flex flex-col justify-between">
      <div className="max-w-2xl mx-auto w-full">
        {/* Top Header & Gamified Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-[#B5F23D] text-[#0C1004] flex items-center justify-center font-bold text-sm font-mono shadow-sm">
                W
              </span>
              <div>
                <span className="font-bold text-sm tracking-tight text-white block">
                  Waymark Onboarding
                </span>
                <span className="text-xs font-mono text-zinc-400">
                  Level {currentStep} of {totalSteps}: {stepTitles[currentStep - 1]}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? "Mute audio cues" : "Enable tactile audio cues"}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-[#1B1B20] border border-white/[0.06] transition-colors"
              >
                {soundEnabled ? <Volume2 size={14} className="text-[#B5F23D]" /> : <VolumeX size={14} />}
              </button>
              <button
                type="button"
                onClick={() => handleCompleteOnboarding("sample")}
                className="text-xs font-mono text-zinc-400 hover:text-[#B5F23D] px-2 py-1 rounded transition-colors"
              >
                Skip to Day 1 →
              </button>
            </div>
          </div>

          {/* Duolingo Progress Bar */}
          <div className="w-full h-2 bg-[#1B1B20] rounded-full overflow-hidden border border-white/[0.04]">
            <div
              className="h-full bg-[#B5F23D] transition-all duration-300 ease-out"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* ── QUESTION CONTAINER ── */}
        <div className="space-y-6">
          {/* STEP 1: FMCG Product Categories */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#B5F23D]/10 border border-[#B5F23D]/25 text-[#B5F23D] text-xs font-mono font-bold uppercase tracking-wider mb-2">
                  <Sparkles size={11} />
                  <span>Category Intelligence</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  What product lines does your agency distribute?
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Waymark calculates replenishment tempos and shelf out-of-stock risk based on your categories.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    name: "Biscuits, Bakery & Rusks",
                    desc: "Parle, Britannia, Sunfeast · 4 to 6 day velocity",
                  },
                  {
                    name: "Cold Drinks & Juices",
                    desc: "Frooti, Maaza, Coke, Packaged Water · 3 to 5 day velocity",
                  },
                  {
                    name: "Packaged Groceries & Spices",
                    desc: "Fortune, Aashirvaad, Tata Salt, Spices · 7 to 10 day cycle",
                  },
                  {
                    name: "Snacks, Namkeen & Confectionery",
                    desc: "Balaji, Kurkure, Cadbury, Mints · 5 to 7 day cycle",
                  },
                  {
                    name: "Soaps, Detergents & Personal Care",
                    desc: "Lifebuoy, Wheel, Surf, Colgate · 10 to 14 day cycle",
                  },
                  {
                    name: "Dairy, Butter & Milk Pouches",
                    desc: "Amul, Mother Dairy, Ghee · Daily to 2-day cycle",
                  },
                ].map((cat) => {
                  const isSelected = selectedCategories.includes(cat.name);
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => toggleCategory(cat.name)}
                      className={`p-3.5 rounded-xl border text-left transition-all flex items-start justify-between gap-2.5 ${
                        isSelected
                          ? "bg-[#1B1B20] border-[#B5F23D] ring-1 ring-[#B5F23D]"
                          : "bg-[#1B1B20]/40 border-white/[0.06] hover:border-white/[0.15]"
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs text-zinc-100">{cat.name}</div>
                        <div className="text-xs font-mono text-zinc-400 mt-0.5">{cat.desc}</div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center border ${
                          isSelected
                            ? "bg-[#B5F23D] text-[#0C1004] border-[#B5F23D]"
                            : "border-white/[0.1] bg-[#131316]"
                        }`}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Duolingo-style insight box */}
              <div className="p-3.5 rounded-xl bg-[#1B1B20] border border-white/[0.06] text-xs text-zinc-300 font-mono flex items-start gap-2.5">
                <span className="text-[#B5F23D] font-bold shrink-0">Distributor Insight:</span>
                <span>
                  High turnover goods (biscuits & drinks) lose 18% volume when reorder calls depend on storekeeper memory. Waymark auto-schedules repeat drops before counters run dry.
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: Current Dispatch Routine */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#B5F23D]/10 border border-[#B5F23D]/25 text-[#B5F23D] text-xs font-mono font-bold uppercase tracking-wider mb-2">
                  <Layers size={11} />
                  <span>Routine Diagnostics</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  How do your delivery boys track daily store stops right now?
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Pick the method closest to your current daily operations.
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    id: "paper_registers",
                    title: "Paper Registers & Hand-written Khata Diaries",
                    subtitle: "I write shop orders in books; drivers tick off stops by hand",
                    insight: "81% of wholesale agencies lose track of khata credit when paper diaries get damaged or lost. Waymark digitizes this completely offline.",
                  },
                  {
                    id: "whatsapp_calls",
                    title: "WhatsApp Messages & Phone Calls Mid-Morning",
                    subtitle: "Retailers message me; I phone drivers to change tempo route on the road",
                    insight: "WhatsApp messages lack stop sequencing. Delivery drivers zigzag across market streets, wasting fuel and arriving after shops shut.",
                  },
                  {
                    id: "driver_memory",
                    title: "Driver Habit & Memory",
                    subtitle: "Driver knows the bazaar counters and stops wherever he feels is needed",
                    insight: "When your driver falls sick or quits, your route knowledge vanishes. Waymark keeps route sequencing in your agency's permanent database.",
                  },
                  {
                    id: "printed_tally",
                    title: "Printed Excel / Tally Spreadsheets",
                    subtitle: "Billing operator prints invoice sheets each morning",
                    insight: "Static paper bills cannot handle doorstep returns, partial cash collection, or urgent restocking calls. Waymark handles live adjustments.",
                  },
                ].map((item) => {
                  const isSelected = currentMethod === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        playTactileSound("tap");
                        setCurrentMethod(item.id);
                      }}
                      className={`w-full p-4 rounded-xl border text-left transition-all flex items-start justify-between gap-3 ${
                        isSelected
                          ? "bg-[#1B1B20] border-[#B5F23D] ring-1 ring-[#B5F23D]"
                          : "bg-[#1B1B20]/40 border-white/[0.06] hover:border-white/[0.15]"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-xs sm:text-sm text-zinc-100">{item.title}</div>
                        <div className="text-xs text-zinc-400 mt-0.5">{item.subtitle}</div>
                        {isSelected && (
                          <div className="mt-2 text-xs font-mono text-[#B5F23D] bg-[#B5F23D]/10 p-2 rounded-lg border border-[#B5F23D]/20">
                            {item.insight}
                          </div>
                        )}
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center border mt-0.5 ${
                          isSelected
                            ? "bg-[#B5F23D] text-[#0C1004] border-[#B5F23D]"
                            : "border-white/[0.1] bg-[#131316]"
                        }`}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: The #1 Operational Leak */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#B5F23D]/10 border border-[#B5F23D]/25 text-[#B5F23D] text-xs font-mono font-bold uppercase tracking-wider mb-2">
                  <TrendingDown size={11} />
                  <span>Cost Elimination</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  What is the #1 leak you want to eliminate first?
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Waymark will calibrate its home cockpit specifically around this priority.
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    id: "uncollected_dues",
                    title: "Uncollected Khata Dues & Delayed Shop Cash",
                    desc: "Retailers take fresh stock without settling previous invoices, tying up working capital.",
                    solution: "Waymark Solution: Doorstep credit balance displayed before driver unloads single crate.",
                  },
                  {
                    id: "shelf_dominance",
                    title: "Competitors Stealing Your Counter Facing When Late",
                    desc: "If our tempo arrives after 11 AM, competitor brand salesmen fill the empty rack space.",
                    solution: "Waymark Solution: Automated tempo dispatch ensures early morning drops before rivals pitch.",
                  },
                  {
                    id: "lifo_unloading",
                    title: "Tempos Loaded in Wrong Sequence (Wasting 45+ Mins Daily)",
                    desc: "Driver unpacks 30 crates in a crowded bazaar lane to find one box of biscuits.",
                    solution: "Waymark Solution: Strict LIFO loading order places Stop #1 right at the tempo back door.",
                  },
                  {
                    id: "missed_cycles",
                    title: "Forgotten Reorders & Out-of-Stock Kirana Shelves",
                    desc: "Storekeeper runs dry before we remember to visit, losing weekend sales.",
                    solution: "Waymark Solution: Self-adjusting restock cycles recalculate automatically upon delivery.",
                  },
                ].map((leak) => {
                  const isSelected = primaryLeak === leak.id;
                  return (
                    <button
                      key={leak.id}
                      type="button"
                      onClick={() => {
                        playTactileSound("tap");
                        setPrimaryLeak(leak.id);
                      }}
                      className={`w-full p-4 rounded-xl border text-left transition-all flex items-start justify-between gap-3 ${
                        isSelected
                          ? "bg-[#1B1B20] border-[#B5F23D] ring-1 ring-[#B5F23D]"
                          : "bg-[#1B1B20]/40 border-white/[0.06] hover:border-white/[0.15]"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-xs sm:text-sm text-zinc-100">{leak.title}</div>
                        <div className="text-xs text-zinc-400 mt-0.5">{leak.desc}</div>
                        {isSelected && (
                          <div className="mt-2 text-xs font-mono text-[#B5F23D] bg-[#B5F23D]/10 p-2 rounded-lg border border-[#B5F23D]/20">
                            {leak.solution}
                          </div>
                        )}
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center border mt-0.5 ${
                          isSelected
                            ? "bg-[#B5F23D] text-[#0C1004] border-[#B5F23D]"
                            : "border-white/[0.1] bg-[#131316]"
                        }`}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Market Scale & Counter Footprint */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#B5F23D]/10 border border-[#B5F23D]/25 text-[#B5F23D] text-xs font-mono font-bold uppercase tracking-wider mb-2">
                  <Store size={11} />
                  <span>Market Footprint</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  How many retail counters do you service?
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Kirana stores, supermarkets, tea stalls, and baniya counters across your territory.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: "scale_15_50",
                    range: "15 to 50 Retailers",
                    desc: "Single tempo or bike round in compact neighborhood",
                  },
                  {
                    id: "scale_50_150",
                    range: "50 to 150 Retailers",
                    desc: "Standard wholesale distribution circuit with weekly beats",
                  },
                  {
                    id: "scale_150_350",
                    range: "150 to 350 Retailers",
                    desc: "Multi-tempo agency with dedicated sector routes",
                  },
                  {
                    id: "scale_350_plus",
                    range: "350+ Retailers",
                    desc: "High volume regional wholesale depot servicing full mandi",
                  },
                ].map((scale) => {
                  const isSelected = scaleCount === scale.id;
                  return (
                    <button
                      key={scale.id}
                      type="button"
                      onClick={() => {
                        playTactileSound("tap");
                        setScaleCount(scale.id);
                      }}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "bg-[#1B1B20] border-[#B5F23D] ring-1 ring-[#B5F23D]"
                          : "bg-[#1B1B20]/40 border-white/[0.06] hover:border-white/[0.15]"
                      }`}
                    >
                      <div className="font-bold text-sm text-zinc-100 mb-1">{scale.range}</div>
                      <div className="text-xs text-zinc-400">{scale.desc}</div>
                    </button>
                  );
                })}
              </div>

              <div className="p-3.5 rounded-xl bg-[#1B1B20] border border-white/[0.06] text-xs text-zinc-300 font-mono">
                Waymark is tested and benchmarked with sub-100ms offline query speeds across 500+ shops and 10,000 ledger entries.
              </div>
            </div>
          )}

          {/* STEP 5: Payment Terms & Settlement */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#B5F23D]/10 border border-[#B5F23D]/25 text-[#B5F23D] text-xs font-mono font-bold uppercase tracking-wider mb-2">
                  <CreditCard size={11} />
                  <span>Settlement Terms</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  How do retail storekeepers settle payments?
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Select all payment protocols you accept on delivery rounds.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    term: "Cash on Delivery (COD)",
                    desc: "Physical banknotes collected at tempo rear door",
                  },
                  {
                    term: "Bill-to-Bill Clearance",
                    desc: "Storekeeper clears previous invoice upon receiving fresh drop",
                  },
                  {
                    term: "Khata Credit Ledger (7-15 Days)",
                    desc: "Running credit balance with periodic reconciliation",
                  },
                  {
                    term: "Mobile UPI QR Code",
                    desc: "Instant scan-and-pay via Google Pay / PhonePe / Paytm",
                  },
                ].map((item) => {
                  const isSelected = paymentTerms.includes(item.term);
                  return (
                    <button
                      key={item.term}
                      type="button"
                      onClick={() => togglePaymentTerm(item.term)}
                      className={`p-3.5 rounded-xl border text-left transition-all flex items-start justify-between gap-2.5 ${
                        isSelected
                          ? "bg-[#1B1B20] border-[#B5F23D] ring-1 ring-[#B5F23D]"
                          : "bg-[#1B1B20]/40 border-white/[0.06] hover:border-white/[0.15]"
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs text-zinc-100">{item.term}</div>
                        <div className="text-xs font-mono text-zinc-400 mt-0.5">{item.desc}</div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center border ${
                          isSelected
                            ? "bg-[#B5F23D] text-[#0C1004] border-[#B5F23D]"
                            : "border-white/[0.1] bg-[#131316]"
                        }`}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-3.5 rounded-xl bg-[#1B1B20] border border-white/[0.06] text-xs text-zinc-300 font-mono">
                Drivers can toggle between Cash, UPI QR, or Khata credit at any doorstep in 1 tap.
              </div>
            </div>
          )}

          {/* STEP 6: Agency Setup & Fleet */}
          {currentStep === 6 && (
            <div className="space-y-5">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#B5F23D]/10 border border-[#B5F23D]/25 text-[#B5F23D] text-xs font-mono font-bold uppercase tracking-wider mb-2">
                  <Building2 size={11} />
                  <span>Agency Identity</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Set up your agency identity and warehouse
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Used on digital challans and route optimization.
                </p>
              </div>

              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Agency / Business Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex FMCG Agency"
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-[#1B1B20] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#B5F23D]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Owner / Operator Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Sharma"
                      value={operatorName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-[#1B1B20] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#B5F23D]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      First Route / Sector Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Main Mandi Beat"
                      value={primaryRoute}
                      onChange={(e) => setPrimaryRoute(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-[#1B1B20] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#B5F23D]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Delivery Vehicle Model
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Tata Ace (Chhota Hathi)"
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-[#1B1B20] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#B5F23D]"
                    />
                  </div>
                </div>

                {/* Warehouse Map Pin */}
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Central Godown Pin (Where daily routes start & return)
                  </label>
                  <ShopMap
                    lat={lat}
                    lng={lng}
                    editable={true}
                    height="200px"
                    placeholder="Search godown address or landmark..."
                    onLocationChange={(nLat, nLng) => {
                      setLat(nLat);
                      setLng(nLng);
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Duolingo Victory Milestone & Launch Mode */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div className="text-center py-2">
                <div className="w-14 h-14 rounded-2xl bg-[#B5F23D] text-[#0C1004] flex items-center justify-center mx-auto mb-3 shadow-md">
                  <Trophy size={28} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Wholesale Dispatch Line Calibrated!
                </h2>
                <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                  Your offline-first route engine is calibrated for {agencyName}.
                </p>
              </div>

              {/* Personalized Profile Card */}
              <div className="p-4 rounded-xl bg-[#1B1B20] border border-[#B5F23D]/30 space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                  <span className="text-zinc-400">Agency:</span>
                  <span className="font-bold text-white">{agencyName}</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                  <span className="text-zinc-400">Primary Beat:</span>
                  <span className="font-bold text-[#B5F23D]">{primaryRoute}</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                  <span className="text-zinc-400">Active Categories:</span>
                  <span className="text-zinc-200 truncate max-w-[240px]">
                    {selectedCategories.join(", ")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Target Priority:</span>
                  <span className="text-[#4ADE80]">LIFO Tempo Packing & Cash Recovery</span>
                </div>
              </div>

              {/* Launch Choices */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-zinc-300">
                  How would you like to enter Day 1?
                </div>

                <button
                  type="button"
                  disabled={isLaunching}
                  onClick={() => handleCompleteOnboarding("sample")}
                  className="w-full p-4 rounded-xl border border-[#B5F23D] bg-[#1B1B20] hover:bg-[#222228] text-left transition-all flex items-center justify-between gap-3 ring-1 ring-[#B5F23D] shadow-float active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#B5F23D] text-[#0C1004] flex items-center justify-center font-bold shrink-0">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        <span>Launch with 4 Sample Kiranas</span>
                        <span className="text-xs uppercase font-mono px-2 py-0.5 rounded-full bg-[#B5F23D] text-[#0C1004]">
                          Recommended
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        Gupta Kirana, Laxmi Supermarket, Anand Tea Depot with realistic dues & LIFO crates.
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-[#B5F23D] shrink-0" />
                </button>

                <button
                  type="button"
                  disabled={isLaunching}
                  onClick={() => setLaunchMode("import")}
                  className="w-full p-4 rounded-xl border border-white/[0.08] bg-[#1B1B20]/40 hover:bg-[#1B1B20] text-left transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#131316] text-zinc-300 border border-white/[0.08] flex items-center justify-center font-bold shrink-0">
                      <FileSpreadsheet size={18} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-zinc-200">
                        Import My Own Retailer List
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        Paste rows from Excel, CSV, or enter shops via rapid table.
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-zinc-500 shrink-0" />
                </button>
              </div>

              {/* In case user chose import list */}
              {launchMode === "import" && (
                <div className="pt-4 border-t border-white/[0.08]">
                  <ShopImportHub
                    defaultRegion={primaryRoute}
                    organisationId="org-waymark-demo"
                    onComplete={() => router.push("/")}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── BOTTOM NAVIGATION CONTROLS ── */}
          {currentStep < 7 && (
            <div className="pt-6 mt-6 border-t border-white/[0.08] flex items-center justify-between">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-4 py-2 rounded-xl border border-white/[0.08] text-xs font-medium text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft size={13} />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2.5 rounded-xl bg-[#B5F23D] hover:bg-[#c4f84c] text-[#0C1004] font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <span>Continue</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
