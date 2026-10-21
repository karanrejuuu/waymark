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
      <div className="mb-4">
        <Link
          href="/settings"
          className="text-xs text-text-secondary hover:text-text-primary inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft size={14} />
          <span>Back to Settings</span>
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-text-primary">
          Add Product
        </h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Add an FMCG product to your distribution catalog.
        </p>
      </div>

      <div className="bg-bg border border-border rounded-lg p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Product Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Parle-G 100g Case"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-border rounded bg-bg focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Default Delivery Interval (days) *
            </label>
            <input
              type="number"
              min={1}
              max={60}
              required
              value={defaultInterval}
              onChange={(e) => setDefaultInterval(parseInt(e.target.value, 10) || 7)}
              className="w-full text-sm px-3 py-2 border border-border rounded bg-bg focus:outline-none focus:border-accent"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-border">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-1.5 text-xs text-text-secondary hover:text-text-primary rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 text-xs font-medium text-white bg-accent rounded hover:opacity-90"
            >
              {submitting ? "Saving..." : "Create product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
