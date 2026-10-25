"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ShopForm } from "@/components/shop/ShopForm";

export default function NewShopPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6">
        <Link
          href="/"
          className="text-xs font-mono text-[#8C8C96] hover:text-[#F4F4F6] inline-flex items-center gap-1 mb-2 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Today&apos;s Dispatch</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F4F6]">
          Add Kirana Store
        </h1>
        <p className="text-xs text-[#8C8C96] mt-1 font-mono">
          Configure store location, sector route, initial restock intervals, and storekeeper contact.
        </p>
      </div>

      <ShopForm />
    </div>
  );
}
