"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, Phone, MapPin, Fuel, Edit3 } from "lucide-react";
import { db, LocalShop, LocalProduct, LocalShopProduct, LocalRegion, LocalDelivery, LocalGodown } from "@/lib/db/dexie";
import { enqueueWrite } from "@/lib/db/sync";
import { StatusDot } from "@/components/ui/StatusDot";
import { ProductsTable, ShopProductDetailItem } from "@/components/shop/ProductsTable";
import { DeliveryHistory } from "@/components/shop/DeliveryHistory";
import { haversineKm, estimateFuelCost } from "@/lib/geo";
import { isDueToday, isEscalated, parseDateOnly } from "@/lib/scheduling";

// Dynamic import for Leaflet map with SSR disabled
const ShopMap = dynamic(() => import("@/components/shop/ShopMap"), {
  ssr: false,
  loading: () => <div className="h-56 bg-bg-subtle rounded border border-border flex items-center justify-center text-xs text-text-tertiary">Loading map...</div>,
});

export default function ShopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params.id as string;

  const [shop, setShop] = useState<LocalShop | null>(null);
  const [region, setRegion] = useState<LocalRegion | null>(null);
  const [godown, setGodown] = useState<LocalGodown | null>(null);
  const [productsData, setProductsData] = useState<ShopProductDetailItem[]>([]);
  const [productMap, setProductMap] = useState<Map<string, LocalProduct>>(new Map());
  const [deliveries, setDeliveries] = useState<LocalDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  // Inline editing state
  const [name, setName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [notes, setNotes] = useState("");

  const loadData = async () => {
    if (!shopId) return;
    const currentShop = await db.shops.get(shopId);
    if (!currentShop) {
      setLoading(false);
      return;
    }

    setShop(currentShop);
    setName(currentShop.name);
    setNotes(currentShop.notes || "");

    const [reg, gdw, allProds, spList, delList] = await Promise.all([
      currentShop.region_id ? db.regions.get(currentShop.region_id) : Promise.resolve(undefined),
      db.godowns.toCollection().first(),
      db.products.toArray(),
      db.shop_products.where({ shop_id: shopId }).toArray(),
      db.deliveries.where({ shop_id: shopId }).reverse().sortBy("delivered_at"),
    ]);

    setRegion(reg || null);
    setGodown(gdw || null);
    setDeliveries(delList);

    const pMap = new Map<string, LocalProduct>(allProds.map((p) => [p.id, p]));
    setProductMap(pMap);

    // Build products table data with relative last delivered text
    const tableItems: ShopProductDetailItem[] = [];
    const now = new Date();

    for (const sp of spList) {
      const prod = pMap.get(sp.product_id);
      if (!prod) continue;

      const lastDel = delList.find((d) => d.product_id === sp.product_id);
      let lastDelStr: string | null = null;
      if (lastDel) {
        const delDate = new Date(lastDel.delivered_at);
        const diffDays = Math.floor((now.getTime() - delDate.getTime()) / 86400000);
        lastDelStr = diffDays === 0 ? "Today" : `${diffDays}d ago`;
      }

      tableItems.push({
        product: prod,
        shopProduct: sp,
        lastDeliveredStr: lastDelStr,
      });
    }

    setProductsData(tableItems);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [shopId]);

  // Handle auto-save of notes on blur
  const handleNotesBlur = async () => {
    if (!shop || notes === (shop.notes || "")) return;
    const updated = { ...shop, notes, updated_at: new Date().toISOString() };
    await enqueueWrite("shops", "upsert", updated);
    setShop(updated);
  };

  // Handle inline name save
  const handleNameSave = async () => {
    setIsEditingName(false);
    if (!shop || !name.trim() || name === shop.name) return;
    const updated = { ...shop, name: name.trim(), updated_at: new Date().toISOString() };
    await enqueueWrite("shops", "upsert", updated);
    setShop(updated);
  };

  // Handle shop product updates
  const handleUpdateProduct = async (productId: string, updates: Partial<LocalShopProduct>) => {
    const target = productsData.find((p) => p.product.id === productId);
    if (!target) return;

    const updatedSp = { ...target.shopProduct, ...updates };
    await enqueueWrite("shop_products", "upsert", updatedSp);
    loadData();
  };

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-8 text-xs text-text-tertiary">Loading shop...</div>;
  }

  if (!shop) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-sm font-medium">Shop not found</div>
        <Link href="/" className="text-xs text-accent mt-2 inline-block">← Back to Today</Link>
      </div>
    );
  }

  // Calculate status
  const anyDue = productsData.some((p) => isDueToday(p.shopProduct.next_due_date));
  const anyEscalated = productsData.some((p) => isEscalated(p.shopProduct.next_due_date));

  // Calculate distance and fuel estimate
  let distanceKm: number | null = null;
  let fuelCost: number | null = null;
  if (godown && shop.lat !== null && shop.lng !== null) {
    distanceKm = haversineKm({ lat: godown.lat, lng: godown.lng }, { lat: shop.lat, lng: shop.lng });
    fuelCost = estimateFuelCost(distanceKm, godown.vehicle_mileage_kmpl, godown.petrol_price_per_l);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Back nav & Edit link */}
      <div className="flex items-center justify-between mb-5">
        <Link
          href="/"
          className="text-xs font-semibold text-[#475569] hover:text-[#0F172A] inline-flex items-center gap-1"
        >
          <ArrowLeft size={14} />
          <span>Back to Today</span>
        </Link>
        <Link
          href={`/shops/${shop.id}/edit`}
          className="px-3 py-1.5 rounded-xl font-bold text-xs bg-[#0F172A] text-white hover:bg-[#92400E] inline-flex items-center gap-1.5 shadow-xs transition-all"
        >
          <Edit3 size={13} />
          <span>Edit Shop</span>
        </Link>
      </div>

      {/* Title (editable inline like Notion) */}
      <div className="mb-4">
        {isEditingName ? (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
            autoFocus
            className="text-2xl sm:text-3xl font-extrabold font-heading text-[#0F172A] bg-transparent border-b-2 border-[#92400E] focus:outline-none w-full"
          />
        ) : (
          <h1
            onClick={() => setIsEditingName(true)}
            title="Click to rename"
            className="text-2xl sm:text-3xl font-extrabold font-heading text-[#0F172A] hover:bg-white px-2 -mx-2 rounded-xl cursor-text inline-block transition-colors"
          >
            {shop.name}
          </h1>
        )}
      </div>

      {/* Properties Block */}
      <div className="space-y-2 text-xs pb-5 border-b border-[#E2E8F0] bg-white p-4 rounded-2xl border border-[#CBD5E1] shadow-xs mb-6">
        {/* Region */}
        <div className="flex items-center py-1">
          <span className="w-28 text-[#475569] font-medium">Route Sector</span>
          <span className="text-[#0F172A] font-bold">
            {region ? region.name : "Unassigned"}
          </span>
        </div>

        {/* Contact */}
        {shop.contact && (
          <div className="flex items-center py-1">
            <span className="w-28 text-[#475569] font-medium">Store Phone</span>
            <a
              href={`tel:${shop.contact}`}
              className="text-[#92400E] hover:underline inline-flex items-center gap-1 font-bold"
            >
              <Phone size={13} />
              <span>{shop.contact}</span>
            </a>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center py-1">
          <span className="w-28 text-[#475569] font-medium">Replenishment Status</span>
          {shop.is_urgent ? (
            <StatusDot variant="urgent" label="Urgent call-in" />
          ) : anyEscalated ? (
            <StatusDot variant="escalated" label="Overdue" />
          ) : anyDue ? (
            <StatusDot variant="fine" label="Due today" />
          ) : (
            <StatusDot variant="neutral" label="Not due" />
          )}
        </div>

        {/* Outstanding Dues */}
        <div className="flex items-center py-1">
          <span className="w-28 text-[#475569] font-medium">Current Credit Dues</span>
          <span className={`font-bold tabular-nums ${shop.balance_due > 0 ? "text-[#DC2626]" : "text-[#065F46]"}`}>
            ₹{shop.balance_due.toLocaleString("en-IN")}
          </span>
        </div>

        {/* Expense Estimator (haversine) */}
        {distanceKm !== null && fuelCost !== null && (
          <div className="flex items-center py-1 text-[#475569]">
            <span className="w-28 text-[#475569] font-medium">Trip Distance</span>
            <span className="inline-flex items-center gap-2 font-medium text-[#0F172A]">
              <MapPin size={13} className="text-[#92400E]" />
              <span>≈ {distanceKm.toFixed(1)} km from godown</span>
              <span>·</span>
              <Fuel size={13} className="text-[#92400E]" />
              <span>₹{Math.round(fuelCost)} estimated fuel burn</span>
            </span>
          </div>
        )}
      </div>

      {/* Section 1: Products */}
      <div className="py-6 border-b border-[#E2E8F0]">
        <h2 className="text-base font-extrabold font-heading text-[#0F172A] mb-3">
          Products & Restock Cadence
        </h2>
        <ProductsTable
          products={productsData}
          onUpdateProduct={handleUpdateProduct}
        />
      </div>

      {/* Section 2: Notes */}
      <div className="py-6 border-b border-[#E2E8F0]">
        <h2 className="text-base font-extrabold font-heading text-[#0F172A] mb-2">
          Dispatcher Notes
        </h2>
        <textarea
          rows={3}
          placeholder="Add delivery notes (e.g. prefers mornings, delivery gate in rear)..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          className="w-full text-xs p-3 rounded-2xl bg-white border border-[#CBD5E1] text-[#0F172A] focus:border-[#92400E] focus:outline-none transition-colors resize-none placeholder:text-[#64748B] shadow-xs"
        />
      </div>

      {/* Section 3: History */}
      <div className="py-6 border-b border-[#E2E8F0]">
        <h2 className="text-base font-extrabold font-heading text-[#0F172A] mb-3">
          Delivery History & Tally Log
        </h2>
        <DeliveryHistory deliveries={deliveries} productMap={productMap} />
      </div>

      {/* Section 4: Map */}
      <div className="py-6">
        <h2 className="text-base font-extrabold font-heading text-[#0F172A] mb-3">
          Kirana Store Location
        </h2>
        <ShopMap lat={shop.lat} lng={shop.lng} editable={false} height="200px" />
      </div>
    </div>
  );
}
