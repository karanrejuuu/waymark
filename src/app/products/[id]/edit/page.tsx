"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
    return <div className="max-w-2xl mx-auto px-4 py-8 text-xs text-[#475569] font-medium">Loading product...</div>;
  }

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-xs text-[#DC2626]">
        <div>Product not found.</div>
        <Link href="/settings" className="text-[#92400E] font-bold mt-2 inline-block">← Back to Settings</Link>
      </div>
    );
  }

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
          Edit Product SKU
        </h1>
        <p className="text-xs text-[#475569] mt-1 font-medium">
          Modify packaging details and default restock cadence.
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
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
