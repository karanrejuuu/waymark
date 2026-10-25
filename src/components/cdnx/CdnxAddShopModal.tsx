"use client";

import React, { useState } from "react";
import { X, Plus, Store, MapPin, Phone, Package, IndianRupee } from "lucide-react";
import { db, LocalRegion, LocalShop } from "@/lib/db/dexie";
import { enqueueWrite } from "@/lib/db/sync";
import { formatDateOnly } from "@/lib/scheduling";

interface CdnxAddShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  regions: LocalRegion[];
  defaultRegionId?: string;
  onShopAdded: (newShop: LocalShop) => void;
}

export const CdnxAddShopModal: React.FC<CdnxAddShopModalProps> = ({
  isOpen,
  onClose,
  regions,
  defaultRegionId,
  onShopAdded,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState("");
  const [selectedRegionId, setSelectedRegionId] = useState(defaultRegionId || regions[0]?.id || "");
  const [initialCrates, setInitialCrates] = useState("2");
  const [initialDue, setInitialDue] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const now = new Date();
      const nowIso = now.toISOString();
      const todayStr = formatDateOnly(now);
      const newShopId = `shop-${Date.now()}`;

      const newShop: LocalShop = {
        id: newShopId,
        organisation_id: "org-waymark-demo",
        owner_id: "demo-user",
        region_id: selectedRegionId || null,
        name: name.trim(),
        contact: contact.trim() || null,
        notes: address.trim() || null,
        lat: null,
        lng: null,
        is_urgent: false,
        is_archived: false,
        balance_due: parseFloat(initialDue) || 0,
        sort_order: 99,
        created_at: nowIso,
        updated_at: nowIso,
      };

      // Put into Dexie
      await db.shops.put(newShop);
      await enqueueWrite("shops", "upsert", newShop);

      // Create a default shop_product record so it is immediately scheduled
      const products = await db.products.toArray();
      if (products.length > 0) {
        const defaultProd = products[0];
        const spRecord = {
          id: `sp-${Date.now()}`,
          organisation_id: "org-waymark-demo",
          shop_id: newShopId,
          product_id: defaultProd.id,
          default_qty: parseInt(initialCrates) || 2,
          interval_days: 7,
          remind_offset_days: 0,
          next_due_date: todayStr,
          snooze_until: null,
          created_at: nowIso,
        };
        await db.shop_products.put(spRecord);
        await enqueueWrite("shop_products", "upsert", spRecord);
      }

      onShopAdded(newShop);
      onClose();
    } catch (err) {
      console.error("Failed to add new shop:", err);
      alert("Error adding store. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-[#13141C] border border-white/[0.1] rounded-3xl p-6 shadow-2xl relative text-white space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D4F638]" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#D4F638]">
                New Shop on the Road
              </span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
              Quick Add Store
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Active Route Selection */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Delivery Route / Area
            </label>
            <select
              value={selectedRegionId}
              onChange={(e) => setSelectedRegionId(e.target.value)}
              className="w-full bg-[#1A1B24] border border-white/[0.1] rounded-xl px-3 py-2.5 text-white font-medium focus:outline-none focus:border-[#D4F638]"
            >
              {regions.map((r) => (
                <option key={r.id} value={r.id} className="bg-[#13141C] text-white">
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Shop Name */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Shop Name *
            </label>
            <div className="flex items-center bg-[#1A1B24] border border-white/[0.1] rounded-xl px-3">
              <Store size={15} className="text-zinc-500 mr-2" />
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Paulson General Store"
                className="w-full bg-transparent py-2.5 text-white placeholder:text-zinc-600 focus:outline-none text-xs font-semibold"
              />
            </div>
          </div>

          {/* Street / Landmark */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Landmark / Location
            </label>
            <div className="flex items-center bg-[#1A1B24] border border-white/[0.1] rounded-xl px-3">
              <MapPin size={15} className="text-zinc-500 mr-2" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Near Beach Walk, opposite Cochin Club"
                className="w-full bg-transparent py-2.5 text-white placeholder:text-zinc-600 focus:outline-none text-xs"
              />
            </div>
          </div>

          {/* Phone / Owner */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Phone / Owner Name (Optional)
            </label>
            <div className="flex items-center bg-[#1A1B24] border border-white/[0.1] rounded-xl px-3">
              <Phone size={15} className="text-zinc-500 mr-2" />
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="e.g. 9847012345 · Ramesh"
                className="w-full bg-transparent py-2.5 text-white placeholder:text-zinc-600 focus:outline-none text-xs"
              />
            </div>
          </div>

          {/* Initial Crates & Opening Balance */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                Default Crates
              </label>
              <div className="flex items-center bg-[#1A1B24] border border-white/[0.1] rounded-xl px-3">
                <Package size={14} className="text-[#D4F638] mr-2" />
                <input
                  type="number"
                  min={1}
                  value={initialCrates}
                  onChange={(e) => setInitialCrates(e.target.value)}
                  className="w-full bg-transparent py-2 text-white font-mono font-bold focus:outline-none text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                Opening Due (₹)
              </label>
              <div className="flex items-center bg-[#1A1B24] border border-white/[0.1] rounded-xl px-3">
                <IndianRupee size={14} className="text-amber-400 mr-1" />
                <input
                  type="number"
                  min={0}
                  value={initialDue}
                  onChange={(e) => setInitialDue(e.target.value)}
                  className="w-full bg-transparent py-2 text-white font-mono font-bold focus:outline-none text-xs"
                />
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="w-full py-3.5 bg-[#D4F638] hover:bg-[#C2E426] text-[#0A0D02] rounded-2xl font-bold font-sans text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
          >
            <Plus size={17} strokeWidth={2.5} />
            <span>{isSubmitting ? "Saving to Route..." : "Add to Route Now"}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
