"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit3 } from "lucide-react";
import { db, LocalProduct } from "@/lib/db/dexie";
import { saveProduct } from "@/lib/actions/regionActions";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<LocalProduct | null>(null);
  const [name, setName] = useState("");
  const [defaultInterval, setDefaultInterval] = useState(7);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (productId) {
      db.products.get(productId).then((p) => {
        if (p) {
          setProduct(p);
          setName(p.name);
          setDefaultInterval(p.default_interval);
        }
        setLoading(false);
      });
    }
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || submitting || !product) return;

    setSubmitting(true);
    try {
      await saveProduct({
        id: product.id,
        name: name.trim(),
        default_interval: defaultInterval || 7,
      });
      router.push("/settings");
    } catch (err) {
      console.error("Failed to update product:", err);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-xs text-zinc-500 font-mono">
        Loading product SKU...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-xs text-rose-400 font-medium">Product SKU not found.</p>
        <Link
          href="/settings"
          className="text-xs text-[#3B82F6] hover:underline mt-2 inline-block font-mono"
        >
          ← Back to Settings
        </Link>
      </div>
    );
  }

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
          <div className="w-10 h-10 rounded-xl bg-[#1E293B] border border-white/[0.08] flex items-center justify-center text-[#3B82F6]">
            <Edit3 size={18} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Edit Product SKU
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Modify packaging spec and default replenishment cycle.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Product SKU & Packaging Spec *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3.5 py-3 border border-white/[0.1] rounded-xl bg-[#1E293B] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#2563EB] transition-colors"
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
              className="w-full text-xs font-mono px-3.5 py-3 border border-white/[0.1] rounded-xl bg-[#1E293B] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#2563EB] transition-colors"
            />
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
              className="px-5 py-2.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
