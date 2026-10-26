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
  Sparkles,
  Sun,
  Moon,
  Truck,
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";
import { db } from "@/lib/db/dexie";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export default function LoginPage() {
  const router = useRouter();
  const { signInOffline } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createBrowserClient();
      const isLocalDummy =
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes("dummy");

      if (!isLocalDummy) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }

      // Check if user has an existing profile or onboarding status
      const existingProfile = await db.profiles.where("email").equals(email.trim()).first();
      const hasOnboarded =
        localStorage.getItem("waymark_onboarding_completed") === "true" ||
        (existingProfile as any)?.onboarding_completed;

      if (!existingProfile) {
        await signInOffline(
          email.trim(),
          email.split("@")[0],
          "FMCG Wholesale",
          "admin"
        );
      }

      if (hasOnboarded) {
        router.push("/");
      } else {
        router.push("/onboarding");
      }
    } catch (err: any) {
      console.warn("Supabase login fallback to local profile:", err);
      // Fallback for offline or local mode
      await signInOffline(
        email.trim(),
        email.split("@")[0],
        "FMCG Wholesale",
        "admin"
      );
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Tap Presentation Demo Mode for Client Meetings
  const handleClientDemoLogin = async () => {
    setIsLoading(true);
    await signInOffline(
      "admin@apexwholesale.com",
      "Rajesh Kumar (Proprietor)",
      "Apex FMCG Distributors",
      "admin"
    );
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#F4F5F8] dark:bg-[#0C0D12] text-zinc-950 dark:text-white flex flex-col font-sans selection:bg-[#D4F638] selection:text-[#0A0D02] transition-colors duration-200">
      {/* Top Bar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#0C0D12]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Link href="/welcome" className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-zinc-950 dark:text-white">
              WAYMARK
            </span>
          </Link>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-[#181924] border border-black/[0.06] dark:border-white/[0.06] text-zinc-500">
            Wholesale Cockpit
          </span>
        </div>

        <div className="flex items-center gap-2">
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
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Hero Card */}
          <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#1C1938] via-[#16172B] to-[#10111F] border border-purple-500/20 shadow-2xl relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181924] border border-white/[0.08] text-[10px] font-mono font-bold text-[#D4F638]">
                <ShieldCheck size={12} />
                <span>OFFLINE-FIRST DISTRIBUTOR ACCESS</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Sign In to Cockpit
              </h1>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Access your routes, scheduled shop reminders, stock replenishment orders, and khata dues.
              </p>
            </div>
          </div>

          {/* Login Form Box */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#13141C] border border-black/[0.08] dark:border-white/[0.08] shadow-sm space-y-5 transition-colors">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs font-mono">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 font-bold">
                  Work / Agency Email
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

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-bold">
                    Password
                  </label>
                  <span className="text-[11px] text-zinc-400 font-mono">Min. 8 characters</span>
                </div>
                <div className="flex items-center bg-zinc-50 dark:bg-[#181924] border border-black/[0.1] dark:border-white/[0.1] rounded-2xl px-3.5 focus-within:border-indigo-500 dark:focus-within:border-[#D4F638] transition-colors">
                  <Lock size={15} className="text-zinc-400 dark:text-zinc-500 mr-2 flex-shrink-0" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
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

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-zinc-600 dark:text-zinc-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-black/[0.2] dark:border-white/[0.2] text-[#D4F638] focus:ring-0"
                  />
                  <span>Keep me signed in</span>
                </label>
              </div>

              {/* Sign In CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-[#D4F638] hover:bg-[#C2E426] text-[#0A0D02] rounded-2xl font-bold font-sans text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Enter Distribution Cockpit</span>
                    <ArrowRight size={16} strokeWidth={2.5} />
                  </>
                )}
              </button>
            </form>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-black/[0.08] dark:border-white/[0.08]" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-mono">
                <span className="bg-white dark:bg-[#13141C] px-3 text-zinc-400">
                  Presentation Mode
                </span>
              </div>
            </div>

            {/* Quick Demo Mode for Client Showcases */}
            <button
              type="button"
              onClick={handleClientDemoLogin}
              className="w-full py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-[#181924] dark:hover:bg-[#202230] text-zinc-800 dark:text-zinc-200 border border-black/[0.08] dark:border-white/[0.08] rounded-2xl font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Sparkles size={14} className="text-purple-600 dark:text-[#D4F638]" />
              <span>1-Tap Client Presentation Demo (Admin)</span>
            </button>

            {/* Link to Signup */}
            <div className="text-center pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                New wholesale distributor?{" "}
                <Link
                  href="/signup"
                  className="font-bold text-indigo-600 dark:text-[#D4F638] hover:underline"
                >
                  Create Agency Account &rarr;
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
