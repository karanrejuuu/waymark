"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PackagePlus } from "lucide-react";
import { saveProduct } from "@/lib/actions/regionActions";

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [defaultInterval, setDefaultInterval] = useState(7);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;

    setSubmitting(true);
    try {
      await saveProduct({
        name: name.trim(),
        default_interval: defaultInterval || 7,
      });
      router.push("/settings");
    } catch (err) {
      console.error("Failed to save product:", err);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/settings"
          className="text-xs font-mono text-zinc-400 hover:text-white inline-flex items-center gap-1.5 mb-3 transition-colors"
        >
          <ArrowLeft size={13} />
          <span>Back to Settings</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1B1B20] border border-white/[0.08] flex items-center justify-center text-[#B5F23D]">
            <PackagePlus size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Add Product SKU
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Configure wholesale SKU packaging and default replenishment cadence.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#131316] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Product SKU & Packaging Spec *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Parle-G 100g (Case of 24) or Frooti 200ml (Crate of 30)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3.5 py-3 border border-white/[0.1] rounded-xl bg-[#1B1B20] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#B5F23D] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Default Replenishment Cycle (days) *
            </label>
            <input
              type="number"
              min={1}
              max={60}
              required
              value={defaultInterval}
              onChange={(e) => setDefaultInterval(parseInt(e.target.value, 10) || 7)}
              className="w-full text-xs font-mono px-3.5 py-3 border border-white/[0.1] rounded-xl bg-[#1B1B20] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#B5F23D] transition-colors"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Shops receiving this SKU will automatically schedule their next delivery based on this cycle.
            </p>
          </div>

          <div className="pt-5 flex items-center justify-end gap-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2.5 text-xs font-medium text-zinc-400 hover:text-white rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-semibold text-[#0C1004] bg-[#B5F23D] hover:bg-[#c4f84c] rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Create Product SKU"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
