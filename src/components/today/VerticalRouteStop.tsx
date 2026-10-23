import React, { useState } from "react";
import { Check, ChevronRight, Clock, Banknote, AlertCircle } from "lucide-react";
import { TodayShopItem } from "@/hooks/useTodayList";
import { ProductConfirmRow } from "./ProductConfirmRow";
import { markDelivered } from "@/lib/actions/markDelivered";
import { snoozeShop } from "@/lib/actions/snoozeShop";
import { StockFeedback } from "@/lib/supabase/types";

interface VerticalRouteStopProps {
  item: TodayShopItem;
  isFirst: boolean;
  isLast: boolean;
  isNextUp: boolean;
  isDelivered?: boolean;
  onDelivered?: (shopId: string) => void;
}

export const VerticalRouteStop: React.FC<VerticalRouteStopProps> = ({
  item,
  isFirst,
  isLast,
  isNextUp,
  onDelivered,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justDelivered, setJustDelivered] = useState(false);
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);
  const [paymentInput, setPaymentInput] = useState<string>("");

  // Product delivery states
  const [productStates, setProductStates] = useState<
    Record<string, { qty: number; feedback: StockFeedback }>
  >(() => {
    const initial: Record<string, { qty: number; feedback: StockFeedback }> = {};
    for (const p of item.dueProducts) {
      initial[p.product.id] = {
        qty: p.shopProduct.default_qty,
        feedback: null,
      };
    }
    return initial;
  });

  const handleQuickTick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSubmitting || justDelivered) return;

    setJustDelivered(true);
    setIsSubmitting(true);

    try {
      const payload = item.dueProducts.map((p) => ({
        productId: p.product.id,
        qty: p.shopProduct.default_qty,
        feedback: null,
      }));

      // 200ms tally-style tick animation per spec
      await new Promise((r) => setTimeout(r, 200));
      await markDelivered(item.shop.id, payload);
      onDelivered?.(item.shop.id);
    } catch (err) {
      console.error("Delivery error:", err);
      setJustDelivered(false);
      setIsSubmitting(false);
    }
  };

  const handleDetailedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || justDelivered) return;

    setJustDelivered(true);
    setIsSubmitting(true);

    try {
      const payload = item.dueProducts.map((p) => {
        const state = productStates[p.product.id];
        return {
          productId: p.product.id,
          qty: state?.qty ?? p.shopProduct.default_qty,
          feedback: state?.feedback ?? null,
        };
      });

      const collected = parseFloat(paymentInput) || 0;

      await new Promise((r) => setTimeout(r, 200));
      await markDelivered(item.shop.id, payload, null, {
        paymentCollected: collected > 0 ? collected : undefined,
      });

      onDelivered?.(item.shop.id);
    } catch (err) {
      console.error("Detailed delivery error:", err);
      setJustDelivered(false);
      setIsSubmitting(false);
    }
  };

  const handleSnooze = async (days: number, reason: string) => {
    setShowSnoozeMenu(false);
    try {
      await snoozeShop(item.shop.id, days, reason);
      onDelivered?.(item.shop.id);
    } catch (err) {
      console.error("Snooze error:", err);
    }
  };

  // Dot styling based on spec
  const isDeliveredState = justDelivered;
  const isChilliUrgent = item.isUrgent && !isDeliveredState;

  return (
    <div className="relative flex items-stretch select-none group">
      {/* ── VERTICAL ROUTE CONNECTOR LINE & STOP DOT ── */}
      <div className="flex flex-col items-center w-10 flex-shrink-0 relative">
        {/* Top half connector */}
        <div
          className={`w-0.5 flex-1 transition-colors duration-200 ${
            isFirst
              ? "opacity-0"
              : isDeliveredState
              ? "bg-success"
              : "bg-lines"
          }`}
        />

        {/* Transit Stop Dot */}
        <div
          onClick={handleQuickTick}
          title={isDeliveredState ? "Delivered" : "Tap to mark stop delivered"}
          className={`w-5 h-5 rounded-full flex items-center justify-center cursor-pointer my-1 z-10 transition-all duration-200 ${
            isDeliveredState
              ? "bg-success text-white scale-110 shadow-sm"
              : isChilliUrgent
              ? "bg-urgent ring-4 ring-urgent/20 text-white"
              : isNextUp
              ? "bg-bg border-2 border-accent ring-4 ring-accent-faint"
              : "bg-bg border-2 border-lines hover:border-text-secondary"
          }`}
        >
          {isDeliveredState ? (
            <Check size={12} className="stroke-[3.5]" />
          ) : isChilliUrgent ? (
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
          ) : isNextUp ? (
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-lines group-hover:bg-text-tertiary" />
          )}
        </div>

        {/* Bottom half connector */}
        <div
          className={`w-0.5 flex-1 transition-colors duration-200 ${
            isLast
              ? "opacity-0"
              : isDeliveredState
              ? "bg-success"
              : "bg-lines"
          }`}
        />
      </div>

      {/* ── STOP CARD CONTENT ── */}
      <div className="flex-1 pb-4 min-w-0">
        <div
          className={`border rounded-xl transition-all duration-150 overflow-hidden ${
            isNextUp && !isDeliveredState
              ? "bg-accent-faint border-accent/40 shadow-soft"
              : "bg-card border-lines hover:border-text-secondary/30"
          }`}
        >
          {/* Main Stop Header */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-3.5 flex items-center justify-between gap-3 cursor-pointer min-h-[52px]"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-heading font-semibold text-sm text-ink truncate">
                  {item.shop.name}
                </span>

                {isChilliUrgent && (
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
                    Urgent
                  </span>
                )}

                {item.daysOverdue >= 1 && !isChilliUrgent && (
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#FFFBEB] text-[#78350F] border border-[#FDE68A] tabular-nums">
                    {item.daysOverdue}d overdue
                  </span>
                )}
              </div>

              {/* Sub-meta: Region and Balance Due */}
              <div className="flex items-center gap-2 text-xs text-text-secondary mt-1">
                {item.region && <span>{item.region.name}</span>}
                {item.shop.balance_due > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-urgent font-medium tabular-nums flex items-center gap-1">
                      <Banknote size={12} />
                      ₹{item.shop.balance_due.toLocaleString("en-IN")} pending
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Snooze Button */}
              <div className="relative">
                <button
                  type="button"
                  title="Snooze visit"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSnoozeMenu(!showSnoozeMenu);
                  }}
                  className="p-1.5 text-text-tertiary hover:text-ink rounded-lg hover:bg-bg-subtle transition-colors"
                >
                  <Clock size={16} />
                </button>

                {/* Snooze Popover Menu */}
                {showSnoozeMenu && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-8 z-30 w-48 bg-card border border-lines rounded-xl shadow-lg p-1.5 text-xs text-ink"
                  >
                    <div className="px-2 py-1 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                      Snooze Stop
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSnooze(1, "Tomorrow")}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-bg-subtle font-medium"
                    >
                      Tomorrow (+1 day)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSnooze(2, "In 2 days")}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-bg-subtle font-medium"
                    >
                      In 2 days (+2 days)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSnooze(1, "Shop closed today")}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-bg-subtle text-text-secondary"
                    >
                      Shop closed today
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSnooze(3, "Next week / Thursday")}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-bg-subtle text-text-secondary"
                    >
                      Shopkeeper asked later (+3d)
                    </button>
                  </div>
                )}
              </div>

              {/* Expand caret */}
              <ChevronRight
                size={16}
                className={`text-text-tertiary transition-transform duration-200 ${
                  isExpanded ? "rotate-90 text-ink" : ""
                }`}
              />

              {/* Tally-Style Quick Tick Button */}
              <button
                type="button"
                aria-label={`Mark ${item.shop.name} delivered`}
                onClick={handleQuickTick}
                disabled={isSubmitting}
                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-200 ${
                  isDeliveredState
                    ? "bg-[#065F46] border-[#065F46] text-white scale-105 shadow-xs"
                    : isNextUp
                    ? "border-[#92400E] bg-[#92400E] text-white hover:bg-[#78350F]"
                    : "border-[#CBD5E1] bg-white hover:border-[#94A3B8]"
                }`}
              >
                <Check
                  size={15}
                  className={isDeliveredState ? "stroke-[3.5]" : isNextUp ? "stroke-[2.5]" : "text-transparent"}
                />
              </button>
            </div>
          </div>

          {/* ── INLINE DETAILED EXPANSION ── */}
          {isExpanded && (
            <div className="p-4 border-t border-[#E2E8F0] bg-[#FAF8F5]/80 text-xs">
              <form onSubmit={handleDetailedSubmit} className="space-y-4">
                <div>
                  <div className="font-bold text-[#0F172A] mb-2 uppercase tracking-wide text-xs">
                    Products Due for Restock
                  </div>

                  {item.dueProducts.map((p) => {
                    const state = productStates[p.product.id] || {
                      qty: p.shopProduct.default_qty,
                      feedback: null,
                    };

                    return (
                      <ProductConfirmRow
                        key={p.product.id}
                        product={p.product}
                        shopProduct={p.shopProduct}
                        qty={state.qty}
                        feedback={state.feedback}
                        onQtyChange={(newQty) =>
                          setProductStates((prev) => ({
                            ...prev,
                            [p.product.id]: { ...state, qty: newQty },
                          }))
                        }
                        onFeedbackChange={(newFeedback) =>
                          setProductStates((prev) => ({
                            ...prev,
                            [p.product.id]: { ...state, feedback: newFeedback },
                          }))
                        }
                      />
                    );
                  })}
                </div>

                {/* Payments / Dues Collection field */}
                <div className="p-3.5 bg-white border border-[#CBD5E1] rounded-xl space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                      <Banknote size={15} className="text-[#92400E]" />
                      Collect Payment at Counter
                    </span>
                    <span className="text-xs text-[#475569] font-medium tabular-nums">
                      Balance: ₹{item.shop.balance_due.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#0F172A]">₹</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      placeholder={item.shop.balance_due > 0 ? `${item.shop.balance_due}` : "0"}
                      value={paymentInput}
                      onChange={(e) => setPaymentInput(e.target.value)}
                      className="w-full px-3 py-1.5 border border-[#CBD5E1] rounded-lg bg-[#FAF8F5] font-bold text-sm tabular-nums text-[#0F172A] focus:outline-none focus:border-[#92400E]"
                    />
                    {item.shop.balance_due > 0 && (
                      <button
                        type="button"
                        onClick={() => setPaymentInput(String(item.shop.balance_due))}
                        className="px-3 py-1.5 rounded-lg bg-[#F1F5F9] text-xs font-bold text-[#334155] hover:text-[#0F172A] flex-shrink-0"
                      >
                        Full
                      </button>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsExpanded(false)}
                    className="px-4 py-2 rounded-xl text-[#475569] hover:text-[#0F172A] font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#92400E] hover:bg-[#78350F] transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    {isSubmitting ? "Marking stop..." : "Mark Delivered & Update Dues"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
