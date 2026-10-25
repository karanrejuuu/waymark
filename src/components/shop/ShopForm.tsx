"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Plus, Trash2 } from "lucide-react";
import { db, LocalShop, LocalProduct, LocalRegion } from "@/lib/db/dexie";
import { saveShop, ConfiguredProductInput } from "@/lib/actions/saveShop";
import { RemindOffsetSlider } from "./RemindOffsetSlider";

const ShopMap = dynamic(() => import("./ShopMap"), {
  ssr: false,
  loading: () => <div className="h-44 bg-[#1B1B20] rounded-xl border border-white/[0.08] flex items-center justify-center text-xs text-[#8C8C96] font-mono">Loading map...</div>,
});

interface ShopFormProps {
  initialShop?: LocalShop;
}

export const ShopForm: React.FC<ShopFormProps> = ({ initialShop }) => {
  const router = useRouter();

  // Basic fields
  const [name, setName] = useState(initialShop?.name || "");
  const [regionId, setRegionId] = useState(initialShop?.region_id || "");
  const [contact, setContact] = useState(initialShop?.contact || "");
  const [notes, setNotes] = useState(initialShop?.notes || "");
  const [lat, setLat] = useState<number | null>(initialShop?.lat ?? null);
  const [lng, setLng] = useState<number | null>(initialShop?.lng ?? null);

  // Reference data
  const [allProducts, setAllProducts] = useState<LocalProduct[]>([]);
  const [allRegions, setAllRegions] = useState<LocalRegion[]>([]);

  // Products configured for this shop
  const [configuredProducts, setConfiguredProducts] = useState<ConfiguredProductInput[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Load existing products and regions
  useEffect(() => {
    async function loadRefs() {
      const [prods, regs] = await Promise.all([
        db.products.toArray(),
        db.regions.orderBy("sort_order").toArray(),
      ]);
      setAllProducts(prods);
      setAllRegions(regs);

      if (initialShop) {
        // Load existing shop_products
        const existingSp = await db.shop_products
          .where("shop_id")
          .equals(initialShop.id)
          .toArray();

        if (existingSp.length > 0) {
          setConfiguredProducts(
            existingSp.map((sp) => ({
              productId: sp.product_id,
              defaultQty: sp.default_qty,
              intervalDays: sp.interval_days,
              remindOffsetDays: sp.remind_offset_days || 0,
            }))
          );
        } else if (prods.length > 0) {
          // Default to first product if none configured
          setConfiguredProducts([
            {
              productId: prods[0].id,
              defaultQty: 1,
              intervalDays: prods[0].default_interval || 7,
              remindOffsetDays: 0,
            },
          ]);
        }
      } else if (prods.length > 0) {
        // New shop default: add first product
        setConfiguredProducts([
          {
            productId: prods[0].id,
            defaultQty: 1,
            intervalDays: prods[0].default_interval || 7,
            remindOffsetDays: 0,
          },
        ]);
      }
    }

    loadRefs();
  }, [initialShop]);

  const handleAddProduct = () => {
    // Pick first product not already configured, or just first product
    const unconfigured = allProducts.find(
      (p) => !configuredProducts.some((cp) => cp.productId === p.id)
    );
    const prodToAdd = unconfigured || allProducts[0];
    if (prodToAdd) {
      setConfiguredProducts((prev) => [
        ...prev,
        {
          productId: prodToAdd.id,
          defaultQty: 1,
          intervalDays: prodToAdd.default_interval || 7,
          remindOffsetDays: 0,
        },
      ]);
    }
  };

  const handleRemoveProduct = (index: number) => {
    setConfiguredProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;

    setSubmitting(true);
    try {
      const savedId = await saveShop({
        id: initialShop?.id,
        name: name.trim(),
        regionId: regionId || null,
        contact: contact.trim() || null,
        notes: notes.trim() || null,
        lat,
        lng,
        products: configuredProducts,
      });

      router.push(`/shops/${savedId}`);
    } catch (err) {
      console.error("Failed to save shop:", err);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic properties */}
      <div className="bg-[#131316] border border-white/[0.08] rounded-2xl p-5 shadow-lift space-y-4">
        <div>
          <label className="block text-xs font-mono font-bold text-[#F4F4F6] mb-1.5">
            Store Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Laxmi General Store"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 border border-white/[0.12] rounded-xl bg-[#1B1B20] text-[#F4F4F6] placeholder:text-[#54545E] font-medium focus:outline-none focus:border-[#B5F23D]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono font-bold text-[#F4F4F6] mb-1.5">
              Route / Territory Sector
            </label>
            <select
              value={regionId}
              onChange={(e) => setRegionId(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 border border-white/[0.12] rounded-xl bg-[#1B1B20] text-[#F4F4F6] font-mono focus:outline-none focus:border-[#B5F23D]"
            >
              <option value="">Select a route sector...</option>
              {allRegions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-[#F4F4F6] mb-1.5">
              Storekeeper Phone
            </label>
            <input
              type="tel"
              placeholder="e.g. 9820012345"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 border border-white/[0.12] rounded-xl bg-[#1B1B20] text-[#F4F4F6] placeholder:text-[#54545E] font-mono focus:outline-none focus:border-[#B5F23D]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono font-bold text-[#F4F4F6] mb-1.5">
            Dispatcher & Delivery Notes
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Prefers morning deliveries before 11 AM, rear loading gate..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 border border-white/[0.12] rounded-xl bg-[#1B1B20] text-[#F4F4F6] placeholder:text-[#54545E] font-medium focus:outline-none focus:border-[#B5F23D] resize-none"
          />
        </div>
      </div>

      {/* Map location pin */}
      <div className="bg-[#131316] border border-white/[0.08] rounded-2xl p-5 shadow-lift">
        <label className="block text-xs font-mono font-bold text-[#B5F23D] uppercase tracking-wider mb-2">
          Store Coordinates & Pin Location
        </label>
        <ShopMap
          lat={lat}
          lng={lng}
          editable={true}
          onLocationChange={(newLat, newLng) => {
            setLat(newLat);
            setLng(newLng);
          }}
          height="260px"
          placeholder="Search road, store name, or area..."
        />
        {lat !== null && lng !== null && (
          <div className="text-[11px] font-mono text-[#8C8C96] mt-2">
            GPS Pin: {lat.toFixed(5)}, {lng.toFixed(5)}
          </div>
        )}
      </div>

      {/* Products & Intervals */}
      <div className="bg-[#131316] border border-white/[0.08] rounded-2xl p-5 shadow-lift">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
          <div>
            <div className="text-xs font-mono font-bold text-[#B5F23D] uppercase tracking-wider">
              Stocked Products & Delivery Cadence
            </div>
            <div className="text-[#8C8C96] text-[11px] font-mono mt-0.5">
              Configure baseline intervals per SKU
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddProduct}
            className="text-xs font-mono text-[#0C1004] bg-[#B5F23D] hover:bg-[#A3DE30] px-3 py-1.5 rounded-xl font-bold inline-flex items-center gap-1 transition-all active:scale-95"
          >
            <Plus size={13} strokeWidth={2.5} />
            <span>Add SKU</span>
          </button>
        </div>

        {configuredProducts.length === 0 ? (
          <div className="p-5 border border-white/[0.08] border-dashed rounded-xl text-center text-xs text-[#8C8C96] font-mono">
            No products configured. Click &quot;Add SKU&quot; to set replenishment days.
          </div>
        ) : (
          <div className="space-y-3">
            {configuredProducts.map((cp, idx) => {
              return (
                <div
                  key={idx}
                  className="p-3.5 border border-white/[0.08] rounded-xl bg-[#1B1B20] space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={cp.productId}
                      onChange={(e) => {
                        const newId = e.target.value;
                        const defaultProd = allProducts.find((p) => p.id === newId);
                        setConfiguredProducts((prev) =>
                          prev.map((item, i) =>
                            i === idx
                              ? {
                                  ...item,
                                  productId: newId,
                                  intervalDays: defaultProd?.default_interval || 7,
                                }
                              : item
                          )
                        );
                      }}
                      className="text-xs font-mono font-bold bg-[#131316] border border-white/[0.12] rounded-lg px-2.5 py-1.5 flex-1 text-[#F4F4F6] focus:border-[#B5F23D]"
                    >
                      {allProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(idx)}
                      className="p-1.5 text-[#8C8C96] hover:text-[#F43F5E] rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-[#8C8C96] block mb-1 text-[11px]">
                        Default Drop Qty
                      </span>
                      <input
                        type="number"
                        min={1}
                        value={cp.defaultQty}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 1;
                          setConfiguredProducts((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, defaultQty: val } : item
                            )
                          );
                        }}
                        className="w-full text-xs px-2.5 py-1.5 bg-[#131316] border border-white/[0.12] rounded-lg font-bold text-[#F4F4F6] focus:border-[#B5F23D]"
                      />
                    </div>

                    <div>
                      <span className="text-[#8C8C96] block mb-1 text-[11px]">
                        Cycle Interval (days)
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={cp.intervalDays}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 7;
                          setConfiguredProducts((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, intervalDays: val } : item
                            )
                          );
                        }}
                        className="w-full text-xs px-2.5 py-1.5 bg-[#131316] border border-white/[0.12] rounded-lg font-bold text-[#F4F4F6] focus:border-[#B5F23D]"
                      />
                    </div>
                  </div>

                  {/* Inline Remind Earlier Slider */}
                  <div className="pt-2 border-t border-white/[0.04]">
                    <RemindOffsetSlider
                      value={cp.remindOffsetDays}
                      onChange={(newOffset) => {
                        setConfiguredProducts((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, remindOffsetDays: newOffset } : item
                          )
                        );
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submit buttons */}
      <div className="pt-2 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 text-xs font-mono font-semibold text-[#8C8C96] hover:text-[#F4F4F6] rounded-xl"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2.5 text-xs font-mono font-bold text-[#0C1004] bg-[#B5F23D] hover:bg-[#A3DE30] rounded-xl transition-all shadow-sm active:scale-95"
        >
          {submitting ? "Saving..." : initialShop ? "Save Changes" : "Create Kirana Store"}
        </button>
      </div>
    </form>
  );
};
