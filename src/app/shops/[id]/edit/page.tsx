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
    return <div className="max-w-2xl mx-auto px-4 py-8 text-xs text-text-tertiary">Loading...</div>;
  }

  if (!shop) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-xs">
        <div>Shop not found.</div>
        <Link href="/" className="text-accent mt-2 inline-block">← Back</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Link
          href={`/shops/${shop.id}`}
          className="text-xs text-text-secondary hover:text-text-primary inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft size={14} />
          <span>Back to Shop</span>
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-text-primary">
          Edit {shop.name}
        </h1>
      </div>

      <div className="bg-bg border border-border rounded-lg p-5">
        <ShopForm initialShop={shop} />
      </div>
    </div>
  );
}
