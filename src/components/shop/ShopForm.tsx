"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { db, LocalProduct, LocalRegion, LocalShop } from "@/lib/db/dexie";
import { saveShop, ShopProductConfigInput } from "@/lib/actions/saveShop";
import { RemindOffsetSlider } from "./RemindOffsetSlider";
import { Plus, Trash2 } from "lucide-react";

const ShopMap = dynamic(() => import("./ShopMap").then((m) => m.ShopMap), {
  ssr: false,
  loading: () => (
    <div className="h-56 bg-bg-subtle rounded border border-border flex items-center justify-center text-xs text-text-tertiary">
      Loading map...
    </div>
  ),
});

interface ShopFormProps {
  initialShop?: LocalShop;
}

export const ShopForm: React.FC<ShopFormProps> = ({ initialShop }) => {
  const router = useRouter();
  const [name, setName] = useState(initialShop?.name || "");
  const [regionId, setRegionId] = useState(initialShop?.region_id || "");
  const [contact, setContact] = useState(initialShop?.contact || "");
  const [notes, setNotes] = useState(initialShop?.notes || "");
  const [lat, setLat] = useState<number | null>(initialShop?.lat ?? null);
  const [lng, setLng] = useState<number | null>(initialShop?.lng ?? null);

  const [allProducts, setAllProducts] = useState<LocalProduct[]>([]);
  const [allRegions, setAllRegions] = useState<LocalRegion[]>([]);
  const [configuredProducts, setConfiguredProducts] = useState<ShopProductConfigInput[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function init() {
      const [prods, regs] = await Promise.all([
        db.products.toArray(),
        db.regions.toArray(),
      ]);
      setAllProducts(prods);
      setAllRegions(regs);

      if (initialShop) {
        const existingSps = await db.shop_products
          .where({ shop_id: initialShop.id })
          .toArray();

        setConfiguredProducts(
          existingSps.map((sp) => ({
            productId: sp.product_id,
            defaultQty: sp.default_qty,
            intervalDays: sp.interval_days,
            remindOffsetDays: sp.remind_offset_days,
          }))
        );
      } else {
        // Default to adding the first available product
        if (prods.length > 0) {
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
    }
    init();
  }, [initialShop]);

  const handleAddProduct = () => {
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
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#0F172A] mb-1">
            Shop Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Laxmi General Store"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 border border-[#CBD5E1] rounded-xl bg-white text-[#0F172A] placeholder:text-[#475569] font-medium focus:outline-none focus:border-[#92400E]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1">
              Region / Route
            </label>
            <select
              value={regionId}
              onChange={(e) => setRegionId(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 border border-[#CBD5E1] rounded-xl bg-white text-[#0F172A] font-medium focus:outline-none focus:border-[#92400E]"
            >
              <option value="">Select a region...</option>
              {allRegions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1">
              Contact Phone
            </label>
            <input
              type="tel"
              placeholder="e.g. 9820012345"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 border border-[#CBD5E1] rounded-xl bg-white text-[#0F172A] placeholder:text-[#475569] font-medium focus:outline-none focus:border-[#92400E]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#0F172A] mb-1">
            Notes & Delivery Instructions
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Prefers mornings, near Shiv temple..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 border border-[#CBD5E1] rounded-xl bg-white text-[#0F172A] placeholder:text-[#475569] font-medium focus:outline-none focus:border-[#92400E] resize-none"
          />
        </div>
      </div>

      {/* Map location pin */}
      <div className="pt-2">
        <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
          Shop Location (search address/road or tap to pin)
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
          placeholder="Search road, shop name, or area..."
        />
        {lat !== null && lng !== null && (
          <div className="text-xs text-[#475569] mt-1 font-medium">
            Pinned location: {lat.toFixed(5)}, {lng.toFixed(5)}
          </div>
        )}
      </div>

      {/* Products & Intervals */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-[#0F172A]">
            Stocked Products & Delivery Cycles
          </label>
          <button
            type="button"
            onClick={handleAddProduct}
            className="text-xs text-[#92400E] hover:underline inline-flex items-center gap-1 font-bold"
          >
            <Plus size={13} />
            <span>Add product</span>
          </button>
        </div>

        {configuredProducts.length === 0 ? (
          <div className="p-4 border border-[#CBD5E1] border-dashed rounded-xl text-center text-xs text-[#475569] font-medium bg-white">
            No products added yet. Click &quot;Add product&quot; to configure delivery cycles.
          </div>
        ) : (
          <div className="space-y-3">
            {configuredProducts.map((cp, idx) => {
              return (
                <div
                  key={idx}
                  className="p-3.5 border border-[#CBD5E1] rounded-xl bg-white space-y-3 shadow-xs"
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
                      className="text-xs font-bold bg-[#FAF8F5] border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 flex-1 text-[#0F172A]"
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
                      className="p-1.5 text-[#475569] hover:text-[#DC2626] rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[#475569] font-medium block mb-1">
                        Default Delivery Qty
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
                        className="w-full text-xs px-2.5 py-1.5 bg-[#FAF8F5] border border-[#CBD5E1] rounded-lg font-bold text-[#0F172A]"
                      />
                    </div>

                    <div>
                      <span className="text-[#475569] font-medium block mb-1">
                        Delivery Interval (days)
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
                        className="w-full text-xs px-2.5 py-1.5 bg-[#FAF8F5] border border-[#CBD5E1] rounded-lg font-bold text-[#0F172A]"
                      />
                    </div>
                  </div>

                  {/* Inline Remind Earlier Slider */}
                  <div className="pt-1 border-t border-[#E2E8F0]">
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
      <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#CBD5E1]">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-xs font-semibold text-[#475569] hover:text-[#0F172A] rounded-xl"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2.5 text-xs font-bold text-white bg-[#0F172A] hover:bg-[#92400E] rounded-xl transition-all shadow-xs"
        >
          {submitting ? "Saving..." : initialShop ? "Save changes" : "Create shop"}
        </button>
      </div>
    </form>
  );
};
