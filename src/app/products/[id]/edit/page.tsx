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
    return <div className="max-w-2xl mx-auto px-4 py-8 text-xs text-text-tertiary">Loading...</div>;
  }

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-xs">
        <div>Product not found.</div>
        <Link href="/settings" className="text-accent mt-2 inline-block">← Back</Link>
      </div>
    );
  }

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
          Edit Product
        </h1>
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
              {submitting ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
