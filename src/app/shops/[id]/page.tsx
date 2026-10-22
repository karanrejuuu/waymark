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
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/"
          className="text-xs text-text-secondary hover:text-text-primary inline-flex items-center gap-1"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </Link>
        <Link
          href={`/shops/${shop.id}/edit`}
          className="text-xs text-text-secondary hover:text-text-primary inline-flex items-center gap-1 py-1 px-2 rounded hover:bg-bg-subtle"
        >
          <Edit3 size={13} />
          <span>Edit shop</span>
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
            className="text-2xl font-semibold text-text-primary bg-transparent border-b border-accent focus:outline-none w-full"
          />
        ) : (
          <h1
            onClick={() => setIsEditingName(true)}
            title="Click to rename"
            className="text-2xl font-semibold text-text-primary hover:bg-bg-subtle/80 px-1 -mx-1 rounded cursor-text inline-block transition-colors"
          >
            {shop.name}
          </h1>
        )}
      </div>

      {/* Notion-style Properties Block */}
      <div className="space-y-1.5 text-xs pb-4 border-b border-border">
        {/* Region */}
        <div className="flex items-center py-0.5">
          <span className="w-24 text-text-tertiary">Region</span>
          <span className="text-text-primary font-medium">
            {region ? region.name : "Unassigned"}
          </span>
        </div>

        {/* Contact */}
        {shop.contact && (
          <div className="flex items-center py-0.5">
            <span className="w-24 text-text-tertiary">Contact</span>
            <a
              href={`tel:${shop.contact}`}
              className="text-accent hover:underline inline-flex items-center gap-1 font-medium"
            >
              <Phone size={12} />
              <span>{shop.contact}</span>
            </a>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center py-0.5">
          <span className="w-24 text-text-tertiary">Status</span>
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

        {/* Expense Estimator (haversine) */}
        {distanceKm !== null && fuelCost !== null && (
          <div className="flex items-center py-0.5 text-text-secondary">
            <span className="w-24 text-text-tertiary">Expense</span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={12} className="text-text-tertiary" />
              <span>≈ {distanceKm.toFixed(1)} km from godown</span>
              <span>·</span>
              <Fuel size={12} className="text-text-tertiary" />
              <span>₹{Math.round(fuelCost)} est. fuel</span>
            </span>
          </div>
        )}
      </div>

      {/* Section 1: Products */}
      <div className="py-6 border-b border-border">
        <h2 className="text-sm font-semibold text-text-primary mb-3">
          Products
        </h2>
        <ProductsTable
          products={productsData}
          onUpdateProduct={handleUpdateProduct}
        />
      </div>

      {/* Section 2: Notes (Notion-style auto-save on blur) */}
      <div className="py-6 border-b border-border">
        <h2 className="text-sm font-semibold text-text-primary mb-2">
          Notes
        </h2>
        <textarea
          rows={3}
          placeholder="Add notes (e.g. prefers mornings, delivery gate in rear)..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          className="w-full text-xs p-2.5 rounded bg-bg-subtle/50 border border-transparent hover:border-border focus:border-border focus:bg-bg focus:outline-none transition-colors resize-none placeholder:text-text-tertiary"
        />
      </div>

      {/* Section 3: History */}
      <div className="py-6 border-b border-border">
        <h2 className="text-sm font-semibold text-text-primary mb-3">
          Delivery History
        </h2>
        <DeliveryHistory deliveries={deliveries} productMap={productMap} />
      </div>

      {/* Section 4: Map (least important, shown last) */}
      <div className="py-6">
        <h2 className="text-sm font-semibold text-text-primary mb-3">
          Location
        </h2>
        <ShopMap lat={shop.lat} lng={shop.lng} editable={false} height="200px" />
      </div>
    </div>
  );
}
