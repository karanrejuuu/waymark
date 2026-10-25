"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db, LocalShop } from "@/lib/db/dexie";
import { ShopForm } from "@/components/shop/ShopForm";

export default function EditShopPage() {
  const params = useParams();
  const shopId = params.id as string;
  const [shop, setShop] = useState<LocalShop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shopId) {
      db.shops.get(shopId).then((s) => {
        setShop(s || null);
        setLoading(false);
      });
    }
  }, [shopId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-xs font-mono text-[#8C8C96]">
        Loading store details...
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-xs font-mono text-[#F43F5E]">
        <div>Store not found.</div>
        <Link href="/" className="text-[#B5F23D] font-bold mt-2 inline-block">
          ← Back to Today&apos;s Dispatch
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6">
        <Link
          href={`/shops/${shop.id}`}
          className="text-xs font-mono text-[#8C8C96] hover:text-[#F4F4F6] inline-flex items-center gap-1 mb-2 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Store Profile</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F4F6]">
          Edit {shop.name}
        </h1>
        <p className="text-xs text-[#8C8C96] mt-1 font-mono">
          Update store location, contact details, assigned sector route, and product inventory cadences.
        </p>
      </div>

      <ShopForm initialShop={shop} />
    </div>
  );
}
