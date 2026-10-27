"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Truck,
  IndianRupee,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Package,
  Layers,
} from "lucide-react";
import { LocalShop, LocalShopProduct, LocalProduct } from "@/lib/db/dexie";
import { recordShopVisitOutcome, VisitOutcome } from "@/lib/actions/visitActions";
import { formatDateOnly } from "@/lib/scheduling";
import {
  processPaymentReceipt,
  ProcessReceiptResult,
} from "@/lib/invoice/processPaymentReceipt";

interface CdnxWalkToCarSlipProps {
  shop: LocalShop | null;
  shopProducts: Array<{ shopProduct: LocalShopProduct; product?: LocalProduct }>;
  routeName: string;
  onClose: () => void;
  onSuccess: (shopId: string, nextShopId?: string) => void;
  onReceiptReady?: (receipt: ProcessReceiptResult) => void;
  nextShopId?: string;
  nextShopName?: string;
}

export const CdnxWalkToCarSlip: React.FC<CdnxWalkToCarSlipProps> = ({
  shop,
  shopProducts,
  routeName,
  onClose,
  onSuccess,
  onReceiptReady,
  nextShopId,
  nextShopName,
}) => {
  if (!shop) return null;

  // Visit Status
  const [outcome, setOutcome] = useState<VisitOutcome>("delivered_paid");

  // Crates Quantity calculation
  const defaultTotalCrates = shopProducts.reduce(
    (sum, sp) => sum + (sp.shopProduct.default_qty || 1),
    0
  ) || 3;
  const [cratesDelivered, setCratesDelivered] = useState<number>(defaultTotalCrates);

  // Payment
  const existingDue = Number(shop.balance_due) || 0;
  const [paymentAmount, setPaymentAmount] = useState<string>(
    existingDue > 0 ? String(existingDue) : "0"
  );
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi" | "cheque">("cash");

  // Scheduled Reminder Preset
  const [reminderPreset, setReminderPreset] = useState<
    "none" | "tomorrow" | "2days" | "3days" | "1week" | "custom"
  >("3days");
  const [customReminderDate, setCustomReminderDate] = useState<string>("");
  const [reminderNote, setReminderNote] = useState<string>(
    (shop as any).reminder_note || ""
  );

  // Quick Remark
  const [visitNote, setVisitNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset when shop changes
  useEffect(() => {
    setCratesDelivered(defaultTotalCrates);
    setPaymentAmount(existingDue > 0 ? String(existingDue) : "0");
    setReminderNote((shop as any).reminder_note || "");
    setOutcome("delivered_paid");
    setVisitNote("");
  }, [shop.id]);

  // Calculate reminder date string
  const getCalculatedReminderDate = (): string | null => {
    if (reminderPreset === "none") return null;
    const now = new Date();
    if (reminderPreset === "tomorrow") {
      now.setDate(now.getDate() + 1);
      return formatDateOnly(now);
    }
    if (reminderPreset === "2days") {
      now.setDate(now.getDate() + 2);
      return formatDateOnly(now);
    }
    if (reminderPreset === "3days") {
      now.setDate(now.getDate() + 3);
      return formatDateOnly(now);
    }
    if (reminderPreset === "1week") {
      now.setDate(now.getDate() + 7);
      return formatDateOnly(now);
    }
    if (reminderPreset === "custom") {
      return customReminderDate || null;
    }
    return null;
  };

  const handleCrateIncrement = (delta: number) => {
    setCratesDelivered((prev) => Math.max(0, prev + delta));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const calculatedReminder = getCalculatedReminderDate();
      const numPayment = parseFloat(paymentAmount) || 0;

      // Deliver product items
      const deliveries = shopProducts.map((sp) => ({
        shopProductId: sp.shopProduct.id,
        productId: sp.shopProduct.product_id,
        qty: cratesDelivered > 0 ? cratesDelivered : sp.shopProduct.default_qty || 1,
      }));

      // Combined note
      const combinedNotes = [
        visitNote.trim(),
        reminderNote ? `Reminder: ${reminderNote.trim()}` : "",
      ]
        .filter(Boolean)
        .join(" · ");

      await recordShopVisitOutcome({
        shopId: shop.id,
        outcome,
        productDeliveries: outcome === "delivered_paid" || outcome === "delivered_unpaid" ? deliveries : [],
        paymentCollected: outcome === "delivered_paid" ? numPayment : 0,
        paymentMode,
        followUpDate: calculatedReminder || undefined,
        notes: combinedNotes || undefined,
      });

      // If payment was recorded (outcome === "delivered_paid" & payment > 0), generate the GST Tax Invoice
      if (outcome === "delivered_paid" && numPayment > 0) {
        try {
          const itemLines = shopProducts.map((sp) => ({
            name: sp.product?.name || "Wholesale FMCG Crate",
            qty: cratesDelivered > 0 ? cratesDelivered : sp.shopProduct.default_qty || 1,
            unitPrice: numPayment / (cratesDelivered > 0 ? cratesDelivered : 1),
            unit: "crates",
          }));

          const receiptResult = await processPaymentReceipt({
            shop,
            amount: numPayment,
            paymentMode,
            items: itemLines,
          });

          if (onReceiptReady) {
            onReceiptReady(receiptResult);
          }
        } catch (receiptErr) {
          console.warn("Invoice generation warning:", receiptErr);
        }
      }

      onSuccess(shop.id, nextShopId);
    } catch (err) {
      console.error("Failed to record walk-to-car visit outcome:", err);
      alert("Error saving record. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#13141C] text-zinc-950 dark:text-white border-l border-black/[0.08] dark:border-white/[0.08] select-none shadow-2xl transition-colors duration-200">
      {/* Header */}
      <div className="p-4 border-b border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between bg-zinc-50 dark:bg-[#161722]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4F638] animate-pulse" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-700 dark:text-[#D4F638]">
              Walk-to-Car Quick Logger
            </span>
          </div>
          <h3 className="text-base font-bold text-zinc-950 dark:text-white tracking-tight mt-0.5 truncate max-w-[240px]">
            {shop.name}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
            {routeName} · {shop.contact || "No contact"}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-white/[0.06] hover:bg-zinc-300 dark:hover:bg-white/[0.12] flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Slip Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* Step 1: Visit Outcome Selector */}
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 font-bold">
            1. Visit Status
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "delivered_paid", label: "Delivered & Paid", color: "text-emerald-700 dark:text-[#D4F638]" },
              { id: "delivered_unpaid", label: "Delivered (Credit)", color: "text-amber-700 dark:text-amber-400" },
              { id: "no_order", label: "No Order / Full", color: "text-zinc-700 dark:text-zinc-300" },
              { id: "shop_closed", label: "Shop Closed", color: "text-rose-700 dark:text-rose-400" },
            ].map((opt) => {
              const isSelected = outcome === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setOutcome(opt.id as VisitOutcome)}
                  className={`p-2.5 rounded-xl border text-left transition-all font-medium ${
                    isSelected
                      ? "bg-purple-100 dark:bg-[#1E1B38] border-purple-500/50 dark:border-[#D4F638] text-purple-950 dark:text-white shadow-sm"
                      : "bg-zinc-50 dark:bg-[#1A1B24] border-black/[0.06] dark:border-white/[0.06] text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200"
                  }`}
                >
                  <div className={`font-bold ${isSelected ? opt.color : "text-zinc-700 dark:text-zinc-300"}`}>
                    {opt.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Crates Delivered */}
        {(outcome === "delivered_paid" || outcome === "delivered_unpaid") && (
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#1A1B24] border border-black/[0.06] dark:border-white/[0.06] space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 font-bold">
                <Package size={13} className="text-emerald-600 dark:text-[#D4F638]" />
                2. Crates Supplied
              </span>
              <span className="text-base font-bold font-mono text-emerald-700 dark:text-[#D4F638]">
                {cratesDelivered} Crates
              </span>
            </div>

            {/* Quick Increment Chips (+1, +2, +5, +10) */}
            <div className="grid grid-cols-4 gap-2">
              {[+1, +2, +5, +10].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => handleCrateIncrement(inc)}
                  className="py-1.5 px-2 bg-white dark:bg-[#232532] hover:bg-zinc-100 dark:hover:bg-[#2C2E3E] text-zinc-900 dark:text-white font-mono font-bold rounded-lg border border-black/[0.08] dark:border-white/[0.06] text-center transition-all active:scale-95 shadow-sm"
                >
                  +{inc}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-zinc-500 text-[11px]">Exact:</span>
              <input
                type="number"
                min={0}
                value={cratesDelivered}
                onChange={(e) => setCratesDelivered(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-20 px-2 py-1 bg-white dark:bg-[#13141C] border border-black/[0.1] dark:border-white/[0.1] rounded-lg text-center font-mono font-bold text-zinc-950 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-[#D4F638]"
              />
              <button
                type="button"
                onClick={() => setCratesDelivered(0)}
                className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 ml-auto"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Cash / Payment Collected */}
        {outcome === "delivered_paid" && (
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#1A1B24] border border-black/[0.06] dark:border-white/[0.06] space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 font-bold">
                <IndianRupee size={13} className="text-emerald-600 dark:text-emerald-400" />
                3. Payment Collected
              </span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                ₹{paymentAmount}
              </span>
            </div>

            {/* Quick Money Chips */}
            <div className="grid grid-cols-3 gap-2">
              {existingDue > 0 && (
                <button
                  type="button"
                  onClick={() => setPaymentAmount(String(existingDue))}
                  className="py-1.5 px-2 bg-white dark:bg-[#232532] hover:bg-zinc-100 dark:hover:bg-[#2C2E3E] text-emerald-700 dark:text-[#D4F638] font-mono font-bold rounded-lg border border-black/[0.08] dark:border-white/[0.06] truncate text-center shadow-sm"
                >
                  Full (₹{existingDue})
                </button>
              )}
              {["500", "1000", "2000"].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setPaymentAmount(amt)}
                  className="py-1.5 px-2 bg-white dark:bg-[#232532] hover:bg-zinc-100 dark:hover:bg-[#2C2E3E] text-zinc-900 dark:text-white font-mono font-bold rounded-lg border border-black/[0.08] dark:border-white/[0.06] text-center shadow-sm"
                >
                  ₹{amt}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPaymentAmount("0")}
                className="py-1.5 px-2 bg-white dark:bg-[#232532] hover:bg-zinc-100 dark:hover:bg-[#2C2E3E] text-zinc-500 dark:text-zinc-400 font-mono font-bold rounded-lg border border-black/[0.08] dark:border-white/[0.06] text-center shadow-sm"
              >
                ₹0 (Credit)
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <div className="flex-1 flex items-center bg-white dark:bg-[#13141C] border border-black/[0.1] dark:border-white/[0.1] rounded-lg px-2">
                <span className="text-zinc-500 font-mono">₹</span>
                <input
                  type="number"
                  min={0}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Custom amount"
                  className="w-full bg-transparent px-2 py-1 text-zinc-950 dark:text-white font-mono font-bold focus:outline-none"
                />
              </div>

              {/* Mode */}
              <div className="flex gap-1">
                {(["cash", "upi"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`px-2.5 py-1 rounded-lg font-mono font-bold uppercase text-[10px] ${
                      paymentMode === mode
                        ? "bg-[#D4F638] text-[#0A0D02]"
                        : "bg-zinc-200 dark:bg-[#232532] text-zinc-700 dark:text-zinc-400"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: SCHEDULE NEXT REMINDER */}
        <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-gradient-to-b dark:from-[#1C1938]/60 dark:to-[#1A1B24] border border-purple-200 dark:border-purple-500/20 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-purple-900 dark:text-purple-300 font-bold flex items-center gap-1.5">
              <Clock size={13} className="text-purple-700 dark:text-[#D4F638]" />
              4. Next Visit Reminder
            </span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
              Auto-surfaces on Home
            </span>
          </div>

          {/* Quick Preset Date Chips */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: "tomorrow", label: "Tomorrow" },
              { id: "2days", label: "2 Days" },
              { id: "3days", label: "3 Days" },
              { id: "1week", label: "1 Week" },
            ].map((p) => {
              const isSelected = reminderPreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setReminderPreset(p.id as any)}
                  className={`py-2 px-1 text-center font-mono text-[11px] font-bold rounded-xl border transition-all ${
                    isSelected
                      ? "bg-[#D4F638] text-[#0A0D02] border-[#D4F638] shadow-sm"
                      : "bg-white dark:bg-[#232532] text-zinc-700 dark:text-zinc-300 border-black/[0.08] dark:border-white/[0.06] hover:bg-zinc-100 dark:hover:bg-[#2C2E3E]"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setReminderPreset("custom")}
              className={`px-3 py-1.5 rounded-lg font-mono text-[11px] font-bold border ${
                reminderPreset === "custom"
                  ? "bg-[#D4F638] text-[#0A0D02] border-[#D4F638]"
                  : "bg-white dark:bg-[#232532] text-zinc-700 dark:text-zinc-300 border-black/[0.08] dark:border-white/[0.06]"
              }`}
            >
              Pick Date
            </button>
            {reminderPreset === "custom" && (
              <input
                type="date"
                value={customReminderDate}
                onChange={(e) => setCustomReminderDate(e.target.value)}
                className="flex-1 bg-white dark:bg-[#13141C] border border-black/[0.1] dark:border-white/[0.1] rounded-lg px-2.5 py-1 text-zinc-950 dark:text-white font-mono text-xs focus:outline-none focus:border-indigo-500 dark:focus:border-[#D4F638]"
              />
            )}
            <button
              type="button"
              onClick={() => setReminderPreset("none")}
              className="text-[10px] font-mono text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 ml-auto"
            >
              No Reminder
            </button>
          </div>

          {/* Reminder Instruction Note */}
          <input
            type="text"
            value={reminderNote}
            onChange={(e) => setReminderNote(e.target.value)}
            placeholder="e.g. Check frooti stock, collect ₹1500 cheque"
            className="w-full bg-white dark:bg-[#13141C] border border-black/[0.1] dark:border-white/[0.1] rounded-xl px-3 py-2 text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-xs focus:outline-none focus:border-indigo-500 dark:focus:border-[#D4F638] shadow-sm"
          />
        </div>

        {/* General Note */}
        <div>
          <input
            type="text"
            value={visitNote}
            onChange={(e) => setVisitNote(e.target.value)}
            placeholder="Optional quick remark (e.g. owner asked for discount)"
            className="w-full bg-zinc-50 dark:bg-[#1A1B24] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-3 py-2 text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-xs focus:outline-none focus:border-indigo-500 dark:focus:border-[#D4F638]"
          />
        </div>
      </div>

      {/* Slip Footer CTA */}
      <div className="p-4 border-t border-black/[0.08] dark:border-white/[0.08] bg-zinc-50 dark:bg-[#161722] space-y-2">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleSubmit}
          className="w-full py-3.5 px-4 bg-[#D4F638] hover:bg-[#C2E426] text-[#0A0D02] rounded-2xl font-bold font-sans text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isSubmitting ? (
            <span>Saving record...</span>
          ) : (
            <>
              <span>Save &amp; Complete Stop</span>
              <ArrowRight size={17} strokeWidth={2.5} />
            </>
          )}
        </button>

        {nextShopName && (
          <p className="text-[11px] text-center text-zinc-500 dark:text-zinc-400 font-mono truncate">
            Up Next: <span className="text-zinc-800 dark:text-zinc-200 font-bold">{nextShopName}</span>
          </p>
        )}
      </div>
    </div>
  );
};
