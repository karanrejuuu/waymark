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
    return <div className="max-w-2xl mx-auto px-4 py-8 text-xs text-[#475569] font-medium">Loading store details...</div>;
  }

  if (!shop) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-xs text-[#DC2626]">
        <div>Shop not found.</div>
        <Link href="/" className="text-[#92400E] font-bold mt-2 inline-block">← Back to Today</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-5">
        <Link
          href={`/shops/${shop.id}`}
          className="text-xs font-semibold text-[#475569] hover:text-[#0F172A] inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft size={14} />
          <span>Back to Store Profile</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] font-heading">
          Edit {shop.name}
        </h1>
        <p className="text-xs text-[#475569] mt-1 font-medium">
          Update store location, contact details, assigned route, and product inventory intervals.
        </p>
      </div>

      <div className="space-y-6">
        <ShopForm initialShop={shop} />
      </div>
    </div>
  );
}
