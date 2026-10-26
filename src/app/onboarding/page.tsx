"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Compass,
  Calendar,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  ShieldCheck,
  Sun,
  Moon,
  Truck,
  Building2,
  Store,
  Layers,
  Clock,
  LogOut,
} from "lucide-react";
import { db, LocalRegion, LocalProduct } from "@/lib/db/dexie";
import { enqueueWrite } from "@/lib/db/sync";
import { seedDemoData } from "@/lib/db/seedDemoData";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

interface ConfiguredRoute {
  id: string;
  name: string;
  activeDays: number[]; // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
}

interface ConfiguredProduct {
  id: string;
  name: string;
  unit: string;
  defaultQty: number;
  intervalDays: number;
}

const DAYS_OF_WEEK = [
  { day: 0, label: "Sun" },
  { day: 1, label: "Mon" },
  { day: 2, label: "Tue" },
  { day: 3, label: "Wed" },
  { day: 4, label: "Thu" },
  { day: 5, label: "Fri" },
  { day: 6, label: "Sat" },
];

export default function OnboardingExperiencePage() {
  const router = useRouter();
  const { user, setOnboardingCompleted, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 5;

  // ── Step 1: Products ──
  const [products, setProducts] = useState<ConfiguredProduct[]>([
    { id: "p-parle", name: "Parle-G Glucose 100g", unit: "Case (24 pkts)", defaultQty: 3, intervalDays: 5 },
    { id: "p-frooti", name: "Frooti Mango 200ml", unit: "Crate (30 tetra)", defaultQty: 2, intervalDays: 7 },
    { id: "p-maggi", name: "Maggi 2-Minute Noodles", unit: "Box (48 pkts)", defaultQty: 3, intervalDays: 6 },
    { id: "p-tea", name: "Tata Tea Gold 250g", unit: "Pack (12 boxes)", defaultQty: 2, intervalDays: 10 },
  ]);
  const [newProductName, setNewProductName] = useState("");
  const [newProductUnit, setNewProductUnit] = useState("Crates");
  const [newProductInterval, setNewProductInterval] = useState(7);

  // ── Step 2 & 3: Corridors & Schedules ──
  const [routes, setRoutes] = useState<ConfiguredRoute[]>([
    { id: "reg-fortkochi", name: "Fort Kochi Beat", activeDays: [1, 3, 5] }, // Mon, Wed, Fri
    { id: "reg-mattancherry", name: "Mattancherry Beat", activeDays: [2, 4, 6] }, // Tue, Thu, Sat
    { id: "reg-marinedrive", name: "Marine Drive Beat", activeDays: [1, 4] }, // Mon, Thu
  ]);
  const [newRouteName, setNewRouteName] = useState("");

  // ── Step 4: Workers & Roles ──
  const [workerCount, setWorkerCount] = useState<string>("3-5");
  const [selectedRole, setSelectedRole] = useState<"admin" | "backoffice" | "driver">("admin");

  // ── Step 5: Launch Mode ──
  const [launchMode, setLaunchMode] = useState<"clean" | "sample">("clean");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Audio tactile sounds
  const playTactile = (type: "tap" | "success") => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "tap") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } else {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch {}
  };

  // Add Product
  const handleAddProduct = () => {
    if (!newProductName.trim()) return;
    playTactile("tap");
    const newP: ConfiguredProduct = {
      id: `p-${Date.now()}`,
      name: newProductName.trim(),
      unit: newProductUnit,
      defaultQty: 2,
      intervalDays: newProductInterval,
    };
    setProducts([...products, newP]);
    setNewProductName("");
  };

  const handleRemoveProduct = (id: string) => {
    playTactile("tap");
    if (products.length > 1) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  // Add Route
  const handleAddRoute = () => {
    if (!newRouteName.trim()) return;
    playTactile("tap");
    const newR: ConfiguredRoute = {
      id: `reg-${Date.now()}`,
      name: newRouteName.trim(),
      activeDays: [1, 3, 5],
    };
    setRoutes([...routes, newR]);
    setNewRouteName("");
  };

  const handleRemoveRoute = (id: string) => {
    playTactile("tap");
    if (routes.length > 1) {
      setRoutes(routes.filter((r) => r.id !== id));
    }
  };

  // Toggle Day on Route
  const toggleRouteDay = (routeId: string, dayNum: number) => {
    playTactile("tap");
    setRoutes((prev) =>
      prev.map((r) => {
        if (r.id !== routeId) return r;
        const exists = r.activeDays.includes(dayNum);
        const updated = exists
          ? r.activeDays.filter((d) => d !== dayNum)
          : [...r.activeDays, dayNum].sort((a, b) => a - b);
        return { ...r, activeDays: updated };
      })
    );
  };

  // Complete and save to Dexie database
  const handleCompleteOnboarding = async (chosenLaunchMode: "clean" | "sample") => {
    setIsSubmitting(true);
    playTactile("success");

    const orgId = "org-waymark-primary";
    const nowIso = new Date().toISOString();

    try {
      // 1. Save or update Organisation
      await db.organisations.put({
        id: orgId,
        name: user?.user_metadata?.business_name || "Apex FMCG Distributors",
        currency: "INR",
        created_at: nowIso,
      });

      // 2. Save configured Regions with active_days
      // Only keep routes that have at least 1 active day scheduled
      const activeRoutes = routes.filter((r) => r.activeDays && r.activeDays.length > 0);

      // Clean out obsolete/deleted regions from Dexie
      await db.regions.clear();

      const regionRecords: LocalRegion[] = activeRoutes.map((r, idx) => ({
        id: r.id,
        organisation_id: orgId,
        owner_id: user?.id || "demo-user",
        name: r.name,
        sort_order: idx + 1,
        active_days: r.activeDays,
        created_at: nowIso,
      }));
      await db.regions.bulkPut(regionRecords);

      // 3. Save configured Products
      const productRecords: LocalProduct[] = products.map((p) => ({
        id: p.id,
        organisation_id: orgId,
        owner_id: user?.id || "demo-user",
        name: p.name,
        default_interval: p.intervalDays,
        created_at: nowIso,
      }));
      await db.products.bulkPut(productRecords);

      // 4. Update Profile
      const userRole: "owner" | "staff" | "delivery" =
        selectedRole === "driver" ? "delivery" : selectedRole === "backoffice" ? "staff" : "owner";

      if (user?.id) {
        await db.profiles.put({
          id: user.id,
          name: user.user_metadata?.name || "Proprietor",
          email: user.email || "",
          phone: null,
          role: userRole,
          push_subscription: null,
          onboarding_completed: true,
          business_name: user.user_metadata?.business_name || "Apex FMCG Distributors",
          created_at: nowIso,
        });
      }

      // 5. If user chose Sample data, seed sample kiranas
      if (chosenLaunchMode === "sample") {
        await seedDemoData();
      }

      // Mark onboarding completed in AuthContext & localStorage
      await setOnboardingCompleted(true);

      router.push("/");
    } catch (err) {
      console.error("Failed to save onboarding configuration:", err);
      setIsSubmitting(false);
    }
  };

  // Fast skip directly to cockpit
  const handleSkip = async () => {
    await handleCompleteOnboarding("clean");
  };

  return (
    <div className="min-h-screen bg-[#F4F5F8] dark:bg-[#0C0D12] text-zinc-950 dark:text-white flex flex-col font-sans selection:bg-[#D4F638] selection:text-[#0A0D02] transition-colors duration-200">
      {/* Top Header */}
      <header className="px-4 sm:px-8 py-4 flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#0C0D12]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="text-lg font-black tracking-tight text-zinc-950 dark:text-white font-sans">
            WAYMARK
          </span>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-[#181924] border border-black/[0.06] dark:border-white/[0.06] text-zinc-500">
            Agency Setup Wizard
          </span>
        </div>

        <div className="flex items-center gap-3">
          {user?.email && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-[#181924] border border-black/[0.06] dark:border-white/[0.06] text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4F638]" />
              <span>{user.email}</span>
            </span>
          )}

          <button
            type="button"
            onClick={signOut}
            title="Log in with another account"
            className="flex items-center gap-1 text-[11px] font-mono text-zinc-500 hover:text-zinc-950 dark:hover:text-white px-2.5 py-1 rounded-full border border-black/[0.08] dark:border-white/[0.08] hover:bg-zinc-100 dark:hover:bg-[#181924] transition-all"
          >
            <LogOut size={12} />
            <span className="hidden sm:inline">Switch / Sign In</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-[#181924] hover:bg-zinc-200 dark:hover:bg-[#202230] border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center text-zinc-700 dark:text-zinc-300 transition-all"
          >
            {theme === "dark" ? <Sun size={15} className="text-[#D4F638]" /> : <Moon size={15} className="text-indigo-600" />}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-mono font-bold text-zinc-500 hover:text-zinc-950 dark:hover:text-white px-3 py-1.5 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-all"
          >
            Skip to Cockpit &rarr;
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-200 dark:bg-[#181924] h-1.5">
        <div
          className="bg-[#D4F638] h-1.5 transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      {/* Main Wizard Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-8 space-y-8">
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-500/30 font-mono text-[11px] font-bold text-purple-900 dark:text-[#D4F638]">
              STEP {currentStep} OF {totalSteps}
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {currentStep === 1 && "Product Catalog & Crate Units"}
              {currentStep === 2 && "Delivery Corridors & Trading Beats"}
              {currentStep === 3 && "Beat Schedule (Days Clicker)"}
              {currentStep === 4 && "Fleet Size & Team Roles"}
              {currentStep === 5 && "Launch Mode Decision"}
            </span>
          </div>

          <div className="text-xs font-mono text-zinc-500">
            {Math.round((currentStep / totalSteps) * 100)}% Complete
          </div>
        </div>

        {/* ── STEP 1: Product Catalog & Crates ── */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                What products do your tempos supply?
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Wholesale distribution relies on crate and case packaging. Set up your main products, packaging units, and standard replenishment turnaround cycle.
              </p>
            </div>

            {/* Configured Products List */}
            <div className="space-y-2.5">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="p-4 bg-white dark:bg-[#13141C] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-[#181924] flex items-center justify-center text-zinc-600 dark:text-[#D4F638]">
                      <Package size={17} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-950 dark:text-white">{p.name}</h4>
                      <p className="text-xs text-zinc-500 font-mono">
                        {p.unit} · Every {p.intervalDays} days standard
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(p.id)}
                    className="p-2 text-zinc-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Add Product Form */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#161722] border border-black/[0.06] dark:border-white/[0.06] space-y-3">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                + Add Another Wholesale Product
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="Product name (e.g. Britannia 50-50)"
                  className="sm:col-span-1 bg-white dark:bg-[#13141C] border border-black/[0.1] dark:border-white/[0.1] rounded-xl px-3 py-2 text-xs text-zinc-950 dark:text-white placeholder:text-zinc-400 focus:outline-none"
                />
                <input
                  type="text"
                  value={newProductUnit}
                  onChange={(e) => setNewProductUnit(e.target.value)}
                  placeholder="Unit (e.g. Case of 24)"
                  className="bg-white dark:bg-[#13141C] border border-black/[0.1] dark:border-white/[0.1] rounded-xl px-3 py-2 text-xs text-zinc-950 dark:text-white placeholder:text-zinc-400 focus:outline-none"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    value={newProductInterval}
                    onChange={(e) => setNewProductInterval(parseInt(e.target.value) || 7)}
                    placeholder="Days (e.g. 7)"
                    className="w-20 bg-white dark:bg-[#13141C] border border-black/[0.1] dark:border-white/[0.1] rounded-xl px-3 py-2 text-xs font-mono text-center text-zinc-950 dark:text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    className="flex-1 py-2 bg-[#D4F638] text-[#0A0D02] font-mono font-bold text-xs rounded-xl shadow-sm hover:bg-[#C2E426] transition-all"
                  >
                    Add Item
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Delivery Corridors / Territory Beats ── */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Define your delivery corridors
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Rather than dealing with GPS navigation glitches in market alleys, Waymark groups your shops into named territory corridors.
              </p>
            </div>

            {/* Corridors List */}
            <div className="space-y-2.5">
              {routes.map((r) => (
                <div
                  key={r.id}
                  className="p-4 bg-white dark:bg-[#13141C] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-[#D4F638] flex items-center justify-center">
                      <Compass size={17} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-950 dark:text-white">{r.name}</h4>
                      <p className="text-xs text-zinc-500 font-mono">
                        Active beat area
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveRoute(r.id)}
                    className="p-2 text-zinc-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Add Corridor Form */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#161722] border border-black/[0.06] dark:border-white/[0.06] space-y-3">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                + Add Another Delivery Beat / Area
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRouteName}
                  onChange={(e) => setNewRouteName(e.target.value)}
                  placeholder="New corridor (e.g. Edappally Beat, Broadway Market)"
                  className="flex-1 bg-white dark:bg-[#13141C] border border-black/[0.1] dark:border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-zinc-950 dark:text-white placeholder:text-zinc-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddRoute}
                  className="px-5 py-2.5 bg-[#D4F638] text-[#0A0D02] font-mono font-bold text-xs rounded-xl shadow-sm hover:bg-[#C2E426] transition-all"
                >
                  Add Beat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Beat Schedule (Sun to Sat Visual Clicker) ── */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Which days do you service each route?
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Click Sunday through Saturday to set the delivery beat schedule. When your drivers open the app on that day, this route automatically loads on Home!
              </p>
            </div>

            {/* Day Clickers for Each Route */}
            <div className="space-y-4">
              {routes.map((r) => (
                <div
                  key={r.id}
                  className="p-5 bg-white dark:bg-[#13141C] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#D4F638]" />
                      <h4 className="font-bold text-base text-zinc-950 dark:text-white">
                        {r.name}
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-500">
                      {r.activeDays.length} day{r.activeDays.length === 1 ? "" : "s"} selected
                    </span>
                  </div>

                  {/* Visual 7-day pill strip */}
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {DAYS_OF_WEEK.map((d) => {
                      const isSelected = r.activeDays.includes(d.day);
                      return (
                        <button
                          key={d.day}
                          type="button"
                          onClick={() => toggleRouteDay(r.id, d.day)}
                          className={`py-2.5 text-center font-mono text-xs font-bold rounded-xl border transition-all ${
                            isSelected
                              ? "bg-[#D4F638] text-[#0A0D02] border-[#D4F638] shadow-sm scale-[1.02]"
                              : "bg-zinc-50 dark:bg-[#181924] text-zinc-600 dark:text-zinc-400 border-black/[0.06] dark:border-white/[0.06] hover:bg-zinc-100 dark:hover:bg-[#202230]"
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-500/30 flex items-center gap-3 text-xs">
              <Calendar size={16} className="text-purple-700 dark:text-[#D4F638] flex-shrink-0" />
              <p className="text-purple-950 dark:text-zinc-300">
                Today is{" "}
                <strong className="text-purple-900 dark:text-white font-mono">
                  {new Date().toLocaleDateString("en-IN", { weekday: "long" })}
                </strong>
                . Stores on beats scheduled for today will automatically appear on your main screen.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 4: Fleet & Team Roles ── */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                How many workers are on your wholesale beat?
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Future-proof your agency. Administrators have superuser access to manage all routes, dues, and deliveries.
              </p>
            </div>

            {/* Fleet Size Grid */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-2 font-bold">
                Fleet / Workforce Scale
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: "1-2", label: "1–2 Workers", desc: "Proprietor + Driver" },
                  { id: "3-5", label: "3–5 Workers", desc: "Growing agency" },
                  { id: "6-15", label: "6–15 Workers", desc: "Multiple beats" },
                  { id: "15+", label: "15+ Fleet", desc: "Regional distributor" },
                ].map((s) => {
                  const isSelected = workerCount === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setWorkerCount(s.id)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? "bg-purple-50 dark:bg-[#1E1B38] border-purple-500/50 dark:border-[#D4F638] shadow-sm"
                          : "bg-white dark:bg-[#13141C] border-black/[0.08] dark:border-white/[0.06] text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      <div className={`font-bold font-mono text-xs ${isSelected ? "text-purple-900 dark:text-[#D4F638]" : "text-zinc-950 dark:text-white"}`}>
                        {s.label}
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{s.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Roles Breakdown Cards */}
            <div className="space-y-3 pt-2">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
                Role Permissions Architecture
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  onClick={() => setSelectedRole("admin")}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedRole === "admin"
                      ? "bg-purple-50 dark:bg-[#1E1B38] border-purple-500/50 dark:border-[#D4F638] shadow-sm"
                      : "bg-white dark:bg-[#13141C] border-black/[0.08] dark:border-white/[0.06]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-zinc-950 dark:text-white">Admin / Owner</span>
                    <span className="w-2 h-2 rounded-full bg-[#D4F638]" />
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Full superuser access. Can manage routes, adjust dues, export ledger, and log field deliveries anytime.
                  </p>
                </div>

                <div
                  onClick={() => setSelectedRole("backoffice")}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedRole === "backoffice"
                      ? "bg-purple-50 dark:bg-[#1E1B38] border-purple-500/50 dark:border-[#D4F638] shadow-sm"
                      : "bg-white dark:bg-[#13141C] border-black/[0.08] dark:border-white/[0.06]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-zinc-950 dark:text-white">Backoffice</span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Warehouse officer. Manages invoices, godown stock replenishment, and payment reconciliations.
                  </p>
                </div>

                <div
                  onClick={() => setSelectedRole("driver")}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedRole === "driver"
                      ? "bg-purple-50 dark:bg-[#1E1B38] border-purple-500/50 dark:border-[#D4F638] shadow-sm"
                      : "bg-white dark:bg-[#13141C] border-black/[0.08] dark:border-white/[0.06]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-zinc-950 dark:text-white">Supplier / Driver</span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Field delivery supplier. Focuses exclusively on the 10-second Walk-to-Car logger while dropping crates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 5: Launch Mode ── */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Ready to launch your wholesale cockpit
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Choose how you want to initialize your workspace.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setLaunchMode("clean")}
                className={`p-6 rounded-3xl border cursor-pointer transition-all space-y-3 ${
                  launchMode === "clean"
                    ? "bg-purple-50 dark:bg-[#1E1B38] border-2 border-purple-600 dark:border-[#D4F638] shadow-lg"
                    : "bg-white dark:bg-[#13141C] border-black/[0.08] dark:border-white/[0.08]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-zinc-950 dark:text-white">
                    Empty Workspace
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-[#D4F638]">
                    RECOMMENDED
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Start fresh with your configured delivery beats and products, ready to register your stores on the road.
                </p>
              </div>

              <div
                onClick={() => setLaunchMode("sample")}
                className={`p-6 rounded-3xl border cursor-pointer transition-all space-y-3 ${
                  launchMode === "sample"
                    ? "bg-purple-50 dark:bg-[#1E1B38] border-2 border-purple-600 dark:border-[#D4F638] shadow-lg"
                    : "bg-white dark:bg-[#13141C] border-black/[0.08] dark:border-white/[0.08]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-zinc-950 dark:text-white">
                    Preview with Sample Stores
                  </span>
                  <span className="text-xs font-mono text-zinc-400">PREVIEW</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Loads sample stores in Fort Kochi and Mattancherry to explore the field workflow.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="pt-6 border-t border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => {
                playTactile("tap");
                setCurrentStep((prev) => Math.max(1, prev - 1));
              }}
              className="px-4 py-2.5 rounded-xl border border-black/[0.1] dark:border-white/[0.1] text-zinc-700 dark:text-zinc-300 font-mono text-xs font-bold hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-all flex items-center gap-2"
            >
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={() => {
                playTactile("tap");
                setCurrentStep((prev) => Math.min(totalSteps, prev + 1));
              }}
              className="px-6 py-3 bg-[#D4F638] hover:bg-[#C2E426] text-[#0A0D02] rounded-2xl font-bold font-mono text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95"
            >
              <span>Next: {currentStep === 1 ? "Routes" : currentStep === 2 ? "Schedule" : currentStep === 3 ? "Fleet & Roles" : "Launch"}</span>
              <ArrowRight size={15} strokeWidth={2.5} />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleCompleteOnboarding(launchMode)}
              className="px-8 py-3.5 bg-[#D4F638] hover:bg-[#C2E426] text-[#0A0D02] rounded-2xl font-bold font-sans text-sm flex items-center gap-2 shadow-xl transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Launching Cockpit...</span>
              ) : (
                <>
                  <span>Complete Setup &amp; Launch Cockpit</span>
                  <ArrowRight size={17} strokeWidth={2.5} />
                </>
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
