"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ShopForm } from "@/components/shop/ShopForm";

export default function NewShopPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-5">
        <Link
          href="/"
          className="text-xs font-semibold text-[#475569] hover:text-[#0F172A] inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft size={14} />
          <span>Back to Today's Route</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] font-heading">
          Add Kirana Store
        </h1>
        <p className="text-xs text-[#475569] mt-1 font-medium">
          Configure store name, delivery sector, counter credit limits, and initial restock cycle.
        </p>
      </div>

      <div className="space-y-6">
        <ShopForm />
      </div>
    </div>
  );
}
