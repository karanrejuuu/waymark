"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  Mail,
  Lock,
  Building,
  User,
  Eye,
  EyeOff,
  Sparkles,
  Check,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";
import { db } from "@/lib/db/dexie";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [generatedNotice, setGeneratedNotice] = useState(false);

  // Password generator helper
  const handleGeneratePassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
    let gen = "";
    for (let i = 0; i < 12; i++) {
      gen += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (!/\d/.test(gen)) gen += "7";

    setPassword(gen);
    setConfirmPassword(gen);
    setShowPassword(true);
    setGeneratedNotice(true);
    setTimeout(() => setGeneratedNotice(false), 3000);
  };

  const validateForm = (): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      return "Please enter a valid email address (e.g. rajesh@agency.com).";
    }

    if (password.length < 8) {
      return "Password must be at least 8 characters long.";
    }

    if (!/\d/.test(password)) {
      return "Password must include at least one number.";
    }

    if (mode === "signup") {
      if (!fullName.trim()) {
        return "Please enter your full name.";
      }
      if (password !== confirmPassword) {
        return "Passwords do not match.";
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createBrowserClient();
      const isLocalDummy =
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes("dummy");

      if (mode === "signup") {
        if (!isLocalDummy) {
          const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                name: fullName.trim(),
                business_name: businessName.trim() || "FMCG Agency",
              },
            },
          });
          if (error) throw error;

          if (data?.user && !data.session) {
            setSuccessMsg("Account created. Check your email or proceed directly.");
          }
        }

        // Store local profile
        await db.profiles.put({
          id: "user-" + Date.now(),
          name: fullName.trim(),
          email: email.trim(),
          phone: null,
          role: "owner",
          push_subscription: null,
          created_at: new Date().toISOString(),
        });

        router.push("/onboarding");
      } else {
        if (!isLocalDummy) {
          const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          if (error) throw error;
        }

        router.push("/");
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setErrorMsg(err.message || "Authentication failed. Please verify your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-zinc-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Back to Waymark Overview</span>
          </Link>
        </div>

        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-[#B5F23D] text-[#0C1004] flex items-center justify-center font-bold text-base shadow-[0_0_25px_rgba(181,242,61,0.25)]">
            W
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight text-white block">
              Waymark
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              Wholesale FMCG Dispatch Cockpit
            </span>
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          {mode === "login" ? "Sign in to Dispatch" : "Set up your Agency Account"}
        </h2>
        <p className="mt-1 text-xs text-zinc-400">
          {mode === "login"
            ? "Access your route cockpit, LIFO crate counts, and dues ledger."
            : "Deploy offline route sequencing for your delivery rounds in 2 minutes."}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#131316] py-8 px-6 sm:px-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/[0.08] rounded-2xl">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-[#1B1B20] p-1 rounded-xl mb-6 text-xs font-medium border border-white/[0.06]">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMsg(null);
              }}
              className={`py-2 rounded-lg transition-colors ${
                mode === "login"
                  ? "bg-[#B5F23D] text-[#0C1004] font-semibold shadow-xs"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setErrorMsg(null);
              }}
              className={`py-2 rounded-lg transition-colors ${
                mode === "signup"
                  ? "bg-[#B5F23D] text-[#0C1004] font-semibold shadow-xs"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 font-medium flex items-start gap-2.5">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-medium flex items-start gap-2.5">
              <Check size={15} className="shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                      <User size={14} />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Patel"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs border border-white/[0.1] rounded-xl bg-[#1B1B20] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#B5F23D] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Agency / Wholesale Name (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                      <Building size={14} />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Apex FMCG Agency"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs border border-white/[0.1] rounded-xl bg-[#1B1B20] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#B5F23D] transition-colors"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Mail size={14} />
                </div>
                <input
                  type="email"
                  required
                  placeholder="ramesh@distributors.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs border border-white/[0.1] rounded-xl bg-[#1B1B20] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#B5F23D] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Password
                </label>
                {mode === "signup" && (
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] font-mono text-[#B5F23D] hover:underline flex items-center gap-1"
                  >
                    <Sparkles size={11} />
                    Suggest Strong
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Lock size={14} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Min. 8 characters with 1 number"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 text-xs font-mono border border-white/[0.1] rounded-xl bg-[#1B1B20] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#B5F23D] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {generatedNotice && (
                <span className="text-[11px] text-emerald-400 font-mono mt-1 block">
                  Strong password auto-filled
                </span>
              )}
            </div>

            {mode === "signup" && (
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <KeyRound size={14} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs font-mono border border-white/[0.1] rounded-xl bg-[#1B1B20] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#B5F23D] transition-colors"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-xl bg-[#B5F23D] hover:bg-[#c4f84c] text-[#0C1004] font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {isLoading
                ? "Verifying..."
                : mode === "login"
                ? "Sign In to Waymark"
                : "Create Account & Start Onboarding"}
            </button>
          </form>

          {/* Offline local note */}
          <div className="mt-6 pt-5 border-t border-white/[0.08] text-center text-xs text-zinc-500 font-mono flex items-center justify-center gap-1.5">
            <ShieldCheck size={13} className="text-[#B5F23D]" />
            <span>Offline First Architecture · Works without internet</span>
          </div>
        </div>
      </div>
    </div>
  );
}
