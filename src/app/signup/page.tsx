"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Building2,
  User,
  Sparkles,
  Sun,
  Moon,
  Briefcase,
  Truck,
  CheckCircle2,
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";
import { db } from "@/lib/db/dexie";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export default function SignupPage() {
  const router = useRouter();
  const { signInOffline } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [businessName, setBusinessName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"admin" | "backoffice" | "driver">("admin");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!businessName.trim() || !fullName.trim() || !email.trim() || !password) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createBrowserClient();
      const isLocalDummy =
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes("dummy");

      if (!isLocalDummy) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              name: fullName.trim(),
              business_name: businessName.trim(),
              role,
            },
          },
        });
        if (error) throw error;
      }

      // Initialize local offline profile & agency
      const orgId = `org-${Date.now()}`;
      const nowIso = new Date().toISOString();

      await db.organisations.put({
        id: orgId,
        name: businessName.trim(),
        currency: "INR",
        created_at: nowIso,
      });

      await signInOffline(
        email.trim(),
        fullName.trim(),
        businessName.trim(),
        role
      );

      // Redirect directly to the interactive Duolingo-style onboarding
      router.push("/onboarding");
    } catch (err: any) {
      console.warn("Supabase signup fallback to offline storage:", err);
      // Fallback offline signup
      await signInOffline(
        email.trim(),
        fullName.trim(),
        businessName.trim(),
        role
      );
      router.push("/onboarding");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F8] dark:bg-[#0C0D12] text-zinc-950 dark:text-white flex flex-col font-sans selection:bg-[#D4F638] selection:text-[#0A0D02] transition-colors duration-200">
      {/* Top Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#0C0D12]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Link href="/welcome" className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-zinc-950 dark:text-white">
              WAYMARK
            </span>
          </Link>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-[#181924] border border-black/[0.06] dark:border-white/[0.06] text-zinc-500">
            Agency Registration
          </span>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-[#181924] hover:bg-zinc-200 dark:hover:bg-[#202230] border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center text-zinc-700 dark:text-zinc-300 transition-all active:scale-90"
        >
          {theme === "dark" ? (
            <Sun size={16} className="text-[#D4F638]" />
          ) : (
            <Moon size={16} className="text-indigo-600" />
          )}
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Hero Banner */}
          <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#1C1938] via-[#16172B] to-[#10111F] border border-purple-500/20 shadow-2xl relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181924] border border-white/[0.08] text-[10px] font-mono font-bold text-[#D4F638]">
                <ShieldCheck size={12} />
                <span>ZERO DATA LOSS GUARANTEED</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Create Agency Account
              </h1>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Set up your wholesale operation. You will configure your trading corridors, crate products, and delivery days next.
              </p>
            </div>
          </div>

          {/* Form Box */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#13141C] border border-black/[0.08] dark:border-white/[0.08] shadow-sm space-y-5 transition-colors">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs font-mono">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Agency Name */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 font-bold">
                  Wholesale Business / Agency Name *
                </label>
                <div className="flex items-center bg-zinc-50 dark:bg-[#181924] border border-black/[0.1] dark:border-white/[0.1] rounded-2xl px-3.5 focus-within:border-indigo-500 dark:focus-within:border-[#D4F638] transition-colors">
                  <Building2 size={15} className="text-zinc-400 dark:text-zinc-500 mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Apex FMCG Distributors"
                    className="w-full bg-transparent py-3 text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none text-xs font-medium"
                  />
                </div>
              </div>

              {/* Operator Name */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 font-bold">
                  Your Full Name *
                </label>
                <div className="flex items-center bg-zinc-50 dark:bg-[#181924] border border-black/[0.1] dark:border-white/[0.1] rounded-2xl px-3.5 focus-within:border-indigo-500 dark:focus-within:border-[#D4F638] transition-colors">
                  <User size={15} className="text-zinc-400 dark:text-zinc-500 mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full bg-transparent py-3 text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none text-xs font-medium"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 font-bold">
                  Work / Agency Email *
                </label>
                <div className="flex items-center bg-zinc-50 dark:bg-[#181924] border border-black/[0.1] dark:border-white/[0.1] rounded-2xl px-3.5 focus-within:border-indigo-500 dark:focus-within:border-[#D4F638] transition-colors">
                  <Mail size={15} className="text-zinc-400 dark:text-zinc-500 mr-2 flex-shrink-0" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. rajesh@apexagency.com"
                    className="w-full bg-transparent py-3 text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none text-xs font-medium"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 font-bold">
                  Create Password *
                </label>
                <div className="flex items-center bg-zinc-50 dark:bg-[#181924] border border-black/[0.1] dark:border-white/[0.1] rounded-2xl px-3.5 focus-within:border-indigo-500 dark:focus-within:border-[#D4F638] transition-colors">
                  <Lock size={15} className="text-zinc-400 dark:text-zinc-500 mr-2 flex-shrink-0" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full bg-transparent py-3 text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 font-bold">
                  Your Primary Operating Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "admin", label: "Owner / Admin", desc: "Full rights + field run" },
                    { id: "backoffice", label: "Backoffice", desc: "Godown & dues" },
                    { id: "driver", label: "Supplier / Driver", desc: "Field logger" },
                  ].map((r) => {
                    const isSelected = role === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id as any)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "bg-purple-50 dark:bg-[#1E1B38] border-purple-500/50 dark:border-[#D4F638] shadow-sm"
                            : "bg-zinc-50 dark:bg-[#181924] border-black/[0.06] dark:border-white/[0.06] text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        <div className={`font-bold font-mono text-[11px] ${isSelected ? "text-purple-900 dark:text-[#D4F638]" : "text-zinc-900 dark:text-white"}`}>
                          {r.label}
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-0.5 leading-tight">{r.desc}</p>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-zinc-400 mt-1 font-mono">
                  * Note: Admin role has full authority to perform all driver and delivery functions.
                </p>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-[#D4F638] hover:bg-[#C2E426] text-[#0A0D02] rounded-2xl font-bold font-sans text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <span>Creating Agency...</span>
                ) : (
                  <>
                    <span>Continue to Route &amp; Product Setup</span>
                    <ArrowRight size={16} strokeWidth={2.5} />
                  </>
                )}
              </button>
            </form>

            {/* Link to Login */}
            <div className="text-center pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Already registered with Waymark?{" "}
                <Link
                  href="/login"
                  className="font-bold text-indigo-600 dark:text-[#D4F638] hover:underline"
                >
                  Sign In Here &rarr;
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs font-mono text-zinc-400 border-t border-black/[0.06] dark:border-white/[0.06]">
        Waymark · FMCG Wholesale Delivery &amp; Corridor Dispatch
      </footer>
    </div>
  );
}
