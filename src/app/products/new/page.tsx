"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-5">
        <Link
          href="/settings"
          className="text-xs font-semibold text-[#475569] hover:text-[#0F172A] inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft size={14} />
          <span>Back to Settings</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] font-heading">
          Add FMCG Product
        </h1>
        <p className="text-xs text-[#475569] mt-1 font-medium">
          Add an item you supply and configure its default restock interval.
        </p>
      </div>

      <div className="bg-white border border-[#CBD5E1] rounded-2xl p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1">
              Product SKU & Packaging *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Parle-G 100g (Case of 24) or Frooti 200ml (Crate of 30)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 border border-[#CBD5E1] rounded-xl bg-[#FAF8F5] text-[#0F172A] placeholder:text-[#475569] font-bold focus:outline-none focus:border-[#92400E]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1">
              Default Replenishment Cycle (days) *
            </label>
            <input
              type="number"
              min={1}
              max={60}
              required
              value={defaultInterval}
              onChange={(e) => setDefaultInterval(parseInt(e.target.value, 10) || 7)}
              className="w-full text-xs px-3.5 py-2.5 border border-[#CBD5E1] rounded-xl bg-[#FAF8F5] text-[#0F172A] placeholder:text-[#475569] font-bold focus:outline-none focus:border-[#92400E]"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-xs font-semibold text-[#475569] hover:text-[#0F172A] rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#0F172A] hover:bg-[#92400E] rounded-xl shadow-xs transition-all"
            >
              {submitting ? "Saving..." : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
