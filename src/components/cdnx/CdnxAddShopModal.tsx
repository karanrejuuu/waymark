"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Plus,
  Store,
  MapPin,
  Phone,
  Package,
  IndianRupee,
  Mail,
  MessageSquare,
  FileText,
} from "lucide-react";
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
  // Deduplicate and filter to only active delivery routes (exclude turned-off routes with 0 active days)
  const activeRegions = useMemo(() => {
    const seen = new Set<string>();
    return regions.filter((r) => {
      // Exclude if explicitly turned off (empty active_days array)
      if (Array.isArray(r.active_days) && r.active_days.length === 0) {
        return false;
      }
      const norm = r.name.toLowerCase().replace(/[\s-_]/g, "").replace(/beat$/i, "");
      if (seen.has(norm)) {
        return false;
      }
      seen.add(norm);
      return true;
    });
  }, [regions]);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [gstin, setGstin] = useState("");
  const [stateName, setStateName] = useState("Kerala");
  const [stateCode, setStateCode] = useState("32");
  const [selectedRegionId, setSelectedRegionId] = useState(
    defaultRegionId && activeRegions.some((r) => r.id === defaultRegionId)
      ? defaultRegionId
      : activeRegions[0]?.id || ""
  );
  const [initialCrates, setInitialCrates] = useState("2");
  const [initialDue, setInitialDue] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (defaultRegionId && activeRegions.some((r) => r.id === defaultRegionId)) {
      setSelectedRegionId(defaultRegionId);
    } else if (activeRegions.length > 0 && !activeRegions.some((r) => r.id === selectedRegionId)) {
      setSelectedRegionId(activeRegions[0].id);
    }
  }, [defaultRegionId, activeRegions, selectedRegionId]);

  if (!isOpen) return null;

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
        email: email.trim() || null,
        whatsapp_number: whatsappNumber.trim() || contact.trim() || null,
        gstin: gstin.trim() || null,
        billing_address: address.trim() || null,
        state_name: stateName.trim() || "Kerala",
        state_code: stateCode.trim() || "32",
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
      <div className="w-full max-w-md bg-white dark:bg-[#13141C] border border-black/[0.1] dark:border-white/[0.1] rounded-3xl p-6 shadow-2xl relative text-zinc-950 dark:text-white space-y-4 max-h-[90vh] flex flex-col transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] pb-3 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D4F638]" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-700 dark:text-[#D4F638]">
                New Shop on the Road
              </span>
            </div>
            <h3 className="text-lg font-bold text-zinc-950 dark:text-white tracking-tight mt-0.5">
              Quick Add Store &amp; Billing
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-white/[0.06] hover:bg-zinc-200 dark:hover:bg-white/[0.12] flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs overflow-y-auto pr-1 flex-1">
          {/* Active Route Selection */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1 font-bold">
              Delivery Route / Beat Area
            </label>
            <select
              value={selectedRegionId}
              onChange={(e) => setSelectedRegionId(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-[#1A1B24] border border-black/[0.1] dark:border-white/[0.1] rounded-xl px-3 py-2 text-zinc-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500 dark:focus:border-[#D4F638]"
            >
              {activeRegions.map((r) => (
                <option key={r.id} value={r.id} className="bg-white dark:bg-[#13141C] text-zinc-900 dark:text-white">
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Shop Name */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1 font-bold">
              Shop Name (Buyer / Bill to) *
            </label>
            <div className="flex items-center bg-zinc-50 dark:bg-[#1A1B24] border border-black/[0.1] dark:border-white/[0.1] rounded-xl px-3">
              <Store size={15} className="text-zinc-400 dark:text-zinc-500 mr-2 flex-shrink-0" />
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Cochin Shipyard Co-op Society"
                className="w-full bg-transparent py-2 text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none text-xs font-semibold"
              />
            </div>
          </div>

          {/* Street / Landmark / Billing Address */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1 font-bold">
              Billing Address / Landmark
            </label>
            <div className="flex items-center bg-zinc-50 dark:bg-[#1A1B24] border border-black/[0.1] dark:border-white/[0.1] rounded-xl px-3">
              <MapPin size={15} className="text-zinc-400 dark:text-zinc-500 mr-2 flex-shrink-0" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. No: E-750, Perumpadappu, Kochi-15"
                className="w-full bg-transparent py-2 text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none text-xs"
              />
            </div>
          </div>

          {/* Email & WhatsApp Row (Required for Automated Receipt PDF) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1 font-bold">
                Email for PDF Invoice
              </label>
              <div className="flex items-center bg-zinc-50 dark:bg-[#1A1B24] border border-black/[0.1] dark:border-white/[0.1] rounded-xl px-3">
                <Mail size={14} className="text-zinc-400 dark:text-zinc-500 mr-2 flex-shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. store@gmail.com"
                  className="w-full bg-transparent py-2 text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1 font-bold">
                WhatsApp Phone Number
              </label>
              <div className="flex items-center bg-zinc-50 dark:bg-[#1A1B24] border border-black/[0.1] dark:border-white/[0.1] rounded-xl px-3">
                <MessageSquare size={14} className="text-emerald-500 mr-2 flex-shrink-0" />
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="e.g. 9895047600"
                  className="w-full bg-transparent py-2 text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* GSTIN / UIN & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1 font-bold">
                Shop GSTIN / UIN (Optional)
              </label>
              <div className="flex items-center bg-zinc-50 dark:bg-[#1A1B24] border border-black/[0.1] dark:border-white/[0.1] rounded-xl px-3">
                <FileText size={14} className="text-zinc-400 dark:text-zinc-500 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  placeholder="e.g. 32AADAC5517E1ZA"
                  className="w-full bg-transparent py-2 text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none text-xs uppercase font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1 font-bold">
                Contact Person Name
              </label>
              <div className="flex items-center bg-zinc-50 dark:bg-[#1A1B24] border border-black/[0.1] dark:border-white/[0.1] rounded-xl px-3">
                <Phone size={14} className="text-zinc-400 dark:text-zinc-500 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="e.g. Ramesh (Manager)"
                  className="w-full bg-transparent py-2 text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none text-xs"
                />
              </div>
            </div>
          </div>

          {/* Initial Crates & Opening Balance */}
          <div className="grid grid-cols-2 gap-2.5 pt-0.5">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1 font-bold">
                Default Crates
              </label>
              <div className="flex items-center bg-zinc-50 dark:bg-[#1A1B24] border border-black/[0.1] dark:border-white/[0.1] rounded-xl px-3">
                <Package size={14} className="text-emerald-600 dark:text-[#D4F638] mr-2 flex-shrink-0" />
                <input
                  type="number"
                  min={1}
                  value={initialCrates}
                  onChange={(e) => setInitialCrates(e.target.value)}
                  className="w-full bg-transparent py-2 text-zinc-950 dark:text-white font-mono font-bold focus:outline-none text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1 font-bold">
                Opening Due (₹)
              </label>
              <div className="flex items-center bg-zinc-50 dark:bg-[#1A1B24] border border-black/[0.1] dark:border-white/[0.1] rounded-xl px-3">
                <IndianRupee size={14} className="text-amber-600 dark:text-amber-400 mr-1 flex-shrink-0" />
                <input
                  type="number"
                  min={0}
                  value={initialDue}
                  onChange={(e) => setInitialDue(e.target.value)}
                  className="w-full bg-transparent py-2 text-zinc-950 dark:text-white font-mono font-bold focus:outline-none text-xs"
                />
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="w-full py-3 bg-[#D4F638] hover:bg-[#C2E426] text-[#0A0D02] rounded-2xl font-bold font-sans text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>{isSubmitting ? "Saving to Route..." : "Add to Route Now"}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
