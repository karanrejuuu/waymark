"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, Mail, Lock, Building, User, Eye, EyeOff, Sparkles, Check, AlertCircle, ArrowLeft } from "lucide-react";
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
    // Ensure at least 1 digit
    if (!/\d/.test(gen)) gen += "7";

    setPassword(gen);
    setConfirmPassword(gen);
    setShowPassword(true);
    setGeneratedNotice(true);
    setTimeout(() => setGeneratedNotice(false), 3000);
  };

  // Natural Validation Rules
  const validateForm = (): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      return "Please enter a valid email address (e.g., rajesh@agency.com).";
    }

    if (password.length < 8) {
      return "Password must be at least 8 characters long.";
    }

    if (!/\d/.test(password)) {
      return "Password must include at least one number.";
    }

    if (mode === "signup") {
      if (!fullName.trim()) {
        return "Please enter your name.";
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
      const isLocalDummy = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("dummy");

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
            setSuccessMsg("Account created! Check your email to confirm, or proceed directly.");
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
        // Mode === "login"
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
      setErrorMsg(err.message || "Authentication failed. Please check credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/welcome"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#475569] hover:text-[#0F172A] transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Waymark Overview
          </Link>
        </div>

        {/* Brand Logo & Title */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-xl bg-[#92400E] text-white flex items-center justify-center font-bold text-base shadow-xs font-heading">
            W
          </div>
          <span className="font-heading font-extrabold text-2xl tracking-tight text-[#0F172A]">
            Waymark
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold font-heading text-[#0F172A]">
          {mode === "login" ? "Sign in to your distributor account" : "Create your agency account"}
        </h2>
        <p className="mt-1 text-xs text-[#475569] font-medium">
          {mode === "login"
            ? "Access your daily routes, shop orders, and dues ledger"
            : "Set up delivery tracking for your wholesale rounds in 2 minutes"}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xs border border-[#CBD5E1] rounded-2xl">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-[#F1F5F9] p-1 rounded-xl mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMsg(null);
              }}
              className={`py-2 rounded-lg transition-colors ${
                mode === "login" ? "bg-white text-[#0F172A] shadow-xs" : "text-[#475569] hover:text-[#0F172A]"
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
                mode === "signup" ? "bg-white text-[#0F172A] shadow-xs" : "text-[#475569] hover:text-[#0F172A]"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#DC2626] font-semibold flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-xs text-[#065F46] font-semibold flex items-start gap-2">
              <Check size={15} className="shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                      <User size={15} />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Patel"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-[#CBD5E1] rounded-xl bg-[#FAF8F5] text-[#0F172A] placeholder:text-[#475569] focus:outline-none focus:border-[#92400E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">
                    Business / Agency Name (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                      <Building size={15} />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Apex FMCG Agency"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-[#CBD5E1] rounded-xl bg-[#FAF8F5] text-[#0F172A] placeholder:text-[#475569] focus:outline-none focus:border-[#92400E]"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                  <Mail size={15} />
                </div>
                <input
                  type="email"
                  required
                  placeholder="ramesh@distributors.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#CBD5E1] rounded-xl bg-[#FAF8F5] text-[#0F172A] placeholder:text-[#475569] focus:outline-none focus:border-[#92400E]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-[#0F172A]">
                  Password
                </label>
                {mode === "signup" && (
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-xs font-bold text-[#92400E] hover:underline flex items-center gap-1"
                  >
                    <Sparkles size={13} />
                    Suggest Strong Password
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                  <Lock size={15} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Min. 8 characters with 1 number"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 text-xs border border-[#CBD5E1] rounded-xl bg-[#FAF8F5] text-[#0F172A] placeholder:text-[#475569] focus:outline-none focus:border-[#92400E]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#64748B] hover:text-[#0F172A]"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {generatedNotice && (
                <span className="text-xs text-[#065F46] font-semibold mt-1 block">
                  ✓ Strong password generated and filled!
                </span>
              )}
            </div>

            {mode === "signup" && (
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                    <KeyRound size={15} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-[#CBD5E1] rounded-xl bg-[#FAF8F5] text-[#0F172A] placeholder:text-[#475569] focus:outline-none focus:border-[#92400E]"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-xl bg-[#0F172A] hover:bg-[#92400E] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {isLoading
                ? "Processing..."
                : mode === "login"
                ? "Sign In to Waymark"
                : "Create Account & Start Onboarding"}
            </button>
          </form>

          {/* Offline local note */}
          <div className="mt-6 pt-4 border-t border-[#E2E8F0] text-center text-xs text-[#475569] font-medium">
            <span>100% Offline Capable · Works without internet once opened</span>
          </div>
        </div>
      </div>
    </div>
  );
}