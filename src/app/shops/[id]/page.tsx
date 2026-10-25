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
import { isDueToday, isEscalated } from "@/lib/scheduling";

const ShopMap = dynamic(() => import("@/components/shop/ShopMap"), {
  ssr: false,
  loading: () => <div className="h-48 bg-[#1B1B20] rounded-2xl border border-white/[0.08] flex items-center justify-center text-xs text-[#8C8C96] font-mono">Loading store map...</div>,
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

  const handleNotesBlur = async () => {
    if (!shop || notes === (shop.notes || "")) return;
    const updated = { ...shop, notes, updated_at: new Date().toISOString() };
    await enqueueWrite("shops", "upsert", updated);
    setShop(updated);
  };

  const handleNameSave = async () => {
    setIsEditingName(false);
    if (!shop || !name.trim() || name === shop.name) return;
    const updated = { ...shop, name: name.trim(), updated_at: new Date().toISOString() };
    await enqueueWrite("shops", "upsert", updated);
    setShop(updated);
  };

  const handleUpdateProduct = async (productId: string, updates: Partial<LocalShopProduct>) => {
    const target = productsData.find((p) => p.product.id === productId);
    if (!target) return;

    const updatedSp = { ...target.shopProduct, ...updates };
    await enqueueWrite("shop_products", "upsert", updatedSp);
    loadData();
  };

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-xs font-mono text-[#8C8C96]">Loading store details...</div>;
  }

  if (!shop) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-xs font-mono text-[#F43F5E]">
        <div>Store not found</div>
        <Link href="/" className="text-[#B5F23D] font-bold mt-2 inline-block">← Back to Today</Link>
      </div>
    );
  }

  const anyDue = productsData.some((p) => isDueToday(p.shopProduct.next_due_date));
  const anyEscalated = productsData.some((p) => isEscalated(p.shopProduct.next_due_date));

  let distanceKm: number | null = null;
  let fuelCost: number | null = null;
  if (godown && shop.lat !== null && shop.lng !== null) {
    distanceKm = haversineKm({ lat: godown.lat, lng: godown.lng }, { lat: shop.lat, lng: shop.lng });
    fuelCost = estimateFuelCost(distanceKm, godown.vehicle_mileage_kmpl, godown.petrol_price_per_l);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      {/* Back nav & Edit link */}
      <div className="flex items-center justify-between mb-5">
        <Link
          href="/"
          className="text-xs font-mono text-[#8C8C96] hover:text-[#F4F4F6] inline-flex items-center gap-1 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Today&apos;s Dispatch</span>
        </Link>
        <Link
          href={`/shops/${shop.id}/edit`}
          className="px-3.5 py-1.5 rounded-xl font-mono font-bold text-xs bg-[#B5F23D] text-[#0C1004] hover:bg-[#A3DE30] inline-flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
        >
          <Edit3 size={13} />
          <span>Edit Store</span>
        </Link>
      </div>

      {/* Title */}
      <div className="mb-4">
        {isEditingName ? (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
            autoFocus
            className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F4F6] bg-transparent border-b-2 border-[#B5F23D] focus:outline-none w-full"
          />
        ) : (
          <h1
            onClick={() => setIsEditingName(true)}
            title="Click to rename"
            className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F4F6] hover:bg-white/[0.04] px-2 -mx-2 rounded-xl cursor-text inline-block transition-colors"
          >
            {shop.name}
          </h1>
        )}
      </div>

      {/* Properties Block */}
      <div className="space-y-2.5 text-xs font-mono bg-[#131316] p-4 sm:p-5 rounded-2xl border border-white/[0.08] shadow-lift mb-6">
        <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
          <span className="text-[#8C8C96]">Route Sector:</span>
          <span className="text-[#F4F4F6] font-bold">
            {region ? region.name : "Unassigned"}
          </span>
        </div>

        {shop.contact && (
          <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
            <span className="text-[#8C8C96]">Storekeeper Phone:</span>
            <a
              href={`tel:${shop.contact}`}
              className="text-[#B5F23D] hover:underline inline-flex items-center gap-1 font-bold"
            >
              <Phone size={13} />
              <span>{shop.contact}</span>
            </a>
          </div>
        )}

        <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
          <span className="text-[#8C8C96]">Replenishment Status:</span>
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

        <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
          <span className="text-[#8C8C96]">Current Credit Dues:</span>
          <span className={`font-bold tabular-nums ${shop.balance_due > 0 ? "text-[#F43F5E]" : "text-[#22C55E]"}`}>
            ₹{shop.balance_due.toLocaleString("en-IN")}
          </span>
        </div>

        {distanceKm !== null && fuelCost !== null && (
          <div className="flex items-center justify-between py-1 text-[#8C8C96]">
            <span>Godown Distance & Fuel:</span>
            <span className="inline-flex items-center gap-2 text-[#F4F4F6]">
              <MapPin size={13} className="text-[#B5F23D]" />
              <span>≈ {distanceKm.toFixed(1)} km</span>
              <span>·</span>
              <Fuel size={13} className="text-[#B5F23D]" />
              <span>₹{Math.round(fuelCost)} fuel burn</span>
            </span>
          </div>
        )}
      </div>

      {/* Section 1: Products */}
      <div className="py-6 border-b border-white/[0.08]">
        <h2 className="text-sm font-mono uppercase tracking-wider font-bold text-[#B5F23D] mb-3">
          Products & Restock Cadence
        </h2>
        <ProductsTable
          products={productsData}
          onUpdateProduct={handleUpdateProduct}
        />
      </div>

      {/* Section 2: Notes */}
      <div className="py-6 border-b border-white/[0.08]">
        <h2 className="text-sm font-mono uppercase tracking-wider font-bold text-[#B5F23D] mb-2">
          Dispatcher Notes
        </h2>
        <textarea
          rows={3}
          placeholder="Add delivery instructions (e.g. prefers mornings, rear loading gate)..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          className="w-full text-xs p-3.5 rounded-2xl bg-[#131316] border border-white/[0.08] text-[#F4F4F6] focus:border-[#B5F23D] focus:outline-none transition-colors resize-none placeholder:text-[#54545E] shadow-sm font-medium"
        />
      </div>

      {/* Section 3: History */}
      <div className="py-6 border-b border-white/[0.08]">
        <h2 className="text-sm font-mono uppercase tracking-wider font-bold text-[#B5F23D] mb-3">
          Delivery History & Tally Log
        </h2>
        <DeliveryHistory deliveries={deliveries} productMap={productMap} />
      </div>

      {/* Section 4: Map */}
      <div className="py-6">
        <h2 className="text-sm font-mono uppercase tracking-wider font-bold text-[#B5F23D] mb-3">
          Kirana Store Coordinates
        </h2>
        <ShopMap lat={shop.lat} lng={shop.lng} editable={false} height="220px" />
      </div>
    </div>
  );
}
