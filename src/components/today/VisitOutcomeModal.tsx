"use client";

import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  Clock,
  Receipt,
  CalendarClock,
  Store,
  PackageX,
  MessageSquare,
  IndianRupee,
  Calendar,
  Sparkles,
} from "lucide-react";
import { LocalShop, LocalShopProduct, LocalProduct } from "@/lib/db/dexie";
import { recordShopVisitOutcome, VisitOutcome } from "@/lib/actions/visitActions";
import { PaymentMode } from "@/lib/supabase/types";

interface VisitOutcomeModalProps {
  shop: LocalShop;
  shopProducts?: Array<{ shopProduct: LocalShopProduct; product?: LocalProduct }>;
  onClose: () => void;
  onSuccess: () => void;
}

export const VisitOutcomeModal: React.FC<VisitOutcomeModalProps> = ({
  shop,
  shopProducts = [],
  onClose,
  onSuccess,
}) => {
  const [outcome, setOutcome] = useState<VisitOutcome>("delivered_paid");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [paymentAmount, setPaymentAmount] = useState<string>(
    shop.balance_due ? String(shop.balance_due) : ""
  );
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");
  const [billNumber, setBillNumber] = useState<string>("");
  const [billAmount, setBillAmount] = useState<string>("");
  const [previousBillSettled, setPreviousBillSettled] = useState<string>(
    shop.balance_due ? String(shop.balance_due) : ""
  );
  const [followUpDays, setFollowUpDays] = useState<number>(1);
  const [customDate, setCustomDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Product Delivery Quantities (default to configured default_qty)
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const sp of shopProducts) {
      init[sp.shopProduct.product_id] = sp.shopProduct.default_qty || 1;
    }
    return init;
  });

  const handleQtyChange = (productId: string, val: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(0, val),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const productDeliveries = shopProducts
        .filter((sp) => (quantities[sp.shopProduct.product_id] ?? 0) > 0)
        .map((sp) => ({
          productId: sp.shopProduct.product_id,
          qty: quantities[sp.shopProduct.product_id] || 1,
        }));

      await recordShopVisitOutcome({
        shopId: shop.id,
        outcome,
        productDeliveries:
          outcome === "delivered_paid" ||
          outcome === "delivered_unpaid" ||
          outcome === "bill_to_bill"
            ? productDeliveries
            : undefined,
        paymentCollected: paymentAmount ? parseFloat(paymentAmount) : undefined,
        paymentMode,
        billNumber: billNumber.trim() || undefined,
        billAmount: billAmount ? parseFloat(billAmount) : undefined,
        previousBillSettled: previousBillSettled ? parseFloat(previousBillSettled) : undefined,
        followUpDate: customDate || followUpDays,
        notes: notes.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to record visit outcome:", err);
      setErrorMsg(err.message || "Failed to save outcome");
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#131316] border border-white/[0.08] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#B5F23D]">
                Store Visit & Update
              </span>
              <span className="text-zinc-500 font-mono text-[11px]">· Offline Ready</span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">{shop.name}</h3>
            <div className="flex items-center gap-2 mt-1 text-xs font-mono text-zinc-400">
              {shop.contact && <span>Ph: {shop.contact}</span>}
              <span>·</span>
              <span>
                Current Dues:{" "}
                <strong className={shop.balance_due > 0 ? "text-[#FDA4AF]" : "text-[#4ADE80]"}>
                  ₹{(shop.balance_due || 0).toLocaleString("en-IN")}
                </strong>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Outcome Selector Pills */}
        <div className="p-4 bg-[#1B1B20]/40 border-b border-white/[0.06] overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            <button
              type="button"
              onClick={() => setOutcome("delivered_paid")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                outcome === "delivered_paid"
                  ? "bg-[#B5F23D] text-[#0C1004] shadow-xs"
                  : "bg-[#1B1B20] text-zinc-300 hover:text-white border border-white/[0.06]"
              }`}
            >
              <CheckCircle2 size={13} />
              <span>Delivered & Paid</span>
            </button>

            <button
              type="button"
              onClick={() => setOutcome("delivered_unpaid")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                outcome === "delivered_unpaid"
                  ? "bg-[#B5F23D] text-[#0C1004] shadow-xs"
                  : "bg-[#1B1B20] text-zinc-300 hover:text-white border border-white/[0.06]"
              }`}
            >
              <Clock size={13} />
              <span>Cash Not Received</span>
            </button>

            <button
              type="button"
              onClick={() => setOutcome("bill_to_bill")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                outcome === "bill_to_bill"
                  ? "bg-[#B5F23D] text-[#0C1004] shadow-xs"
                  : "bg-[#1B1B20] text-zinc-300 hover:text-white border border-white/[0.06]"
              }`}
            >
              <Receipt size={13} />
              <span>Bill to Bill</span>
            </button>

            <button
              type="button"
              onClick={() => setOutcome("follow_up")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                outcome === "follow_up"
                  ? "bg-[#B5F23D] text-[#0C1004] shadow-xs"
                  : "bg-[#1B1B20] text-zinc-300 hover:text-white border border-white/[0.06]"
              }`}
            >
              <CalendarClock size={13} />
              <span>Follow Up</span>
            </button>

            <button
              type="button"
              onClick={() => setOutcome("shop_closed")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                outcome === "shop_closed"
                  ? "bg-[#B5F23D] text-[#0C1004] shadow-xs"
                  : "bg-[#1B1B20] text-zinc-300 hover:text-white border border-white/[0.06]"
              }`}
            >
              <Store size={13} />
              <span>Shop Closed</span>
            </button>

            <button
              type="button"
              onClick={() => setOutcome("no_order")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                outcome === "no_order"
                  ? "bg-[#B5F23D] text-[#0C1004] shadow-xs"
                  : "bg-[#1B1B20] text-zinc-300 hover:text-white border border-white/[0.06]"
              }`}
            >
              <PackageX size={13} />
              <span>Overstocked</span>
            </button>

            <button
              type="button"
              onClick={() => setOutcome("update_note")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                outcome === "update_note"
                  ? "bg-[#B5F23D] text-[#0C1004] shadow-xs"
                  : "bg-[#1B1B20] text-zinc-300 hover:text-white border border-white/[0.06]"
              }`}
            >
              <MessageSquare size={13} />
              <span>Mention Note</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 font-medium">
              {errorMsg}
            </div>
          )}

          {/* 1. PRODUCT QUANTITIES (for delivery outcomes) */}
          {(outcome === "delivered_paid" ||
            outcome === "delivered_unpaid" ||
            outcome === "bill_to_bill") && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2">
                Delivered Items & Quantities
              </label>
              {shopProducts.length === 0 ? (
                <div className="p-3 bg-[#1B1B20] border border-white/[0.06] rounded-xl text-xs text-zinc-400">
                  Standard delivery delivery will be stamped for this retailer.
                </div>
              ) : (
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {shopProducts.map((sp) => {
                    const pid = sp.shopProduct.product_id;
                    const pName = sp.product?.name || "Product SKU";
                    const qty = quantities[pid] ?? sp.shopProduct.default_qty ?? 1;

                    return (
                      <div
                        key={sp.shopProduct.id}
                        className="flex items-center justify-between p-2.5 bg-[#1B1B20] border border-white/[0.06] rounded-xl text-xs"
                      >
                        <span className="font-semibold text-zinc-200 truncate pr-2">{pName}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleQtyChange(pid, qty - 1)}
                            className="w-6 h-6 rounded bg-[#131316] text-zinc-300 hover:text-white border border-white/[0.08] flex items-center justify-center font-bold"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold text-white w-6 text-center">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQtyChange(pid, qty + 1)}
                            className="w-6 h-6 rounded bg-[#131316] text-zinc-300 hover:text-white border border-white/[0.08] flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 2. PAYMENT DETAILS (delivered_paid) */}
          {outcome === "delivered_paid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Amount Collected (₹)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <IndianRupee size={13} />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1500"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs font-mono border border-white/[0.1] rounded-xl bg-[#1B1B20] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#B5F23D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Payment Mode</label>
                <div className="grid grid-cols-3 gap-1 bg-[#1B1B20] p-1 rounded-xl border border-white/[0.06] text-xs font-mono">
                  {(["cash", "upi", "cheque"] as PaymentMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMode(m)}
                      className={`py-1.5 rounded-lg uppercase text-[11px] font-bold transition-colors ${
                        paymentMode === m
                          ? "bg-[#B5F23D] text-[#0C1004]"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. CASH NOT RECEIVED / CREDIT DETAILS */}
          {outcome === "delivered_unpaid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Invoice / Bill Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. INV-4902"
                  value={billNumber}
                  onChange={(e) => setBillNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-white/[0.1] rounded-xl bg-[#1B1B20] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#B5F23D]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Bill Amount Added to Khata (₹)
                </label>
                <input
                  type="number"
                  placeholder="Amount owed"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-white/[0.1] rounded-xl bg-[#1B1B20] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#B5F23D]"
                />
              </div>
            </div>
          )}

          {/* 4. BILL TO BILL CREDIT DETAILS */}
          {outcome === "bill_to_bill" && (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Previous Bill Cleared (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Amount cleared"
                    value={previousBillSettled}
                    onChange={(e) => setPreviousBillSettled(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-white/[0.1] rounded-xl bg-[#1B1B20] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#B5F23D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Payment Mode (Cleared Bill)
                  </label>
                  <div className="grid grid-cols-2 gap-1 bg-[#1B1B20] p-1 rounded-xl border border-white/[0.06] text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setPaymentMode("cash")}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        paymentMode === "cash"
                          ? "bg-[#B5F23D] text-[#0C1004]"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      CASH
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMode("upi")}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        paymentMode === "upi"
                          ? "bg-[#B5F23D] text-[#0C1004]"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      UPI QR
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Fresh Invoice / Bill #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-5021"
                    value={billNumber}
                    onChange={(e) => setBillNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-white/[0.1] rounded-xl bg-[#1B1B20] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#B5F23D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Fresh Bill Amount (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="New bill value"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-white/[0.1] rounded-xl bg-[#1B1B20] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#B5F23D]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. FOLLOW UP SCHEDULE */}
          {outcome === "follow_up" && (
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-medium text-zinc-300">
                When should the salesman / driver return?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Tomorrow", days: 1 },
                  { label: "In 2 Days", days: 2 },
                  { label: "In 3 Days", days: 3 },
                ].map((item) => (
                  <button
                    key={item.days}
                    type="button"
                    onClick={() => {
                      setFollowUpDays(item.days);
                      setCustomDate("");
                    }}
                    className={`py-2 rounded-xl text-xs font-mono font-semibold transition-colors ${
                      followUpDays === item.days && !customDate
                        ? "bg-[#B5F23D] text-[#0C1004]"
                        : "bg-[#1B1B20] text-zinc-300 hover:text-white border border-white/[0.06]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="pt-1">
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Or pick specific follow-up date:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Calendar size={13} />
                  </div>
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-white/[0.1] rounded-xl bg-[#1B1B20] text-zinc-100 focus:outline-none focus:border-[#B5F23D]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 6. GENERAL NOTES / UPDATE MENTION */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              {outcome === "update_note"
                ? "Mention Update About This Store *"
                : "Visit Notes / Storekeeper Feedback"}
            </label>
            <textarea
              rows={2}
              required={outcome === "update_note"}
              placeholder={
                outcome === "update_note"
                  ? "e.g. Owner requested delivery before 10 AM, or new contact number is 9820011223"
                  : outcome === "follow_up"
                  ? "e.g. Owner absent, brother at counter says return after 4 PM"
                  : outcome === "shop_closed"
                  ? "e.g. Weekly off day or shutter locked"
                  : outcome === "no_order"
                  ? "e.g. Counter has 4 cases remaining, will order next round"
                  : "Additional details about drop or cash..."
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 text-xs border border-white/[0.1] rounded-xl bg-[#1B1B20] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#B5F23D] transition-colors"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-[#B5F23D] hover:bg-[#c4f84c] text-[#0C1004] font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              {submitting ? "Logging..." : "Log Store Outcome"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
