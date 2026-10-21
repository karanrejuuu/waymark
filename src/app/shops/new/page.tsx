"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ShopForm } from "@/components/shop/ShopForm";

export default function NewShopPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Link
          href="/"
          className="text-xs text-text-secondary hover:text-text-primary inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-text-primary">
          Add New Shop
        </h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Configure shop details, delivery route, and initial product cycle.
        </p>
      </div>

      <div className="bg-bg border border-border rounded-lg p-5">
        <ShopForm />
      </div>
    </div>
  );
}
