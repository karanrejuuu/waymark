import React, { useState } from "react";
import { Check, ChevronRight, Clock, IndianRupee, MapPin, MoreHorizontal } from "lucide-react";
import { TodayShopItem } from "@/hooks/useTodayList";
import { ProductConfirmRow } from "./ProductConfirmRow";
import { markDelivered } from "@/lib/actions/markDelivered";
import { snoozeShop } from "@/lib/actions/snoozeShop";
import { StockFeedback } from "@/lib/supabase/types";
import { VisitOutcomeModal } from "./VisitOutcomeModal";

interface VerticalRouteStopProps {
  item: TodayShopItem;
  stopNumber: number;
  isFirst: boolean;
  isLast: boolean;
  isNextUp: boolean;
  isDelivered?: boolean;
  onDelivered?: (shopId: string) => void;
}

export const VerticalRouteStop: React.FC<VerticalRouteStopProps> = ({
  item,
  stopNumber,
  isFirst,
  isLast,
  isNextUp,
  onDelivered,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justDelivered, setJustDelivered] = useState(false);
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
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

      await new Promise((r) => setTimeout(r, 160));
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

      await new Promise((r) => setTimeout(r, 160));
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

  const isDeliveredState = justDelivered;
  const isUrgent = item.isUrgent && !isDeliveredState;

  return (
    <div className="relative flex items-stretch select-none group">
      {/* Vertical Spine Line */}
      <div className="flex flex-col items-center w-10 flex-shrink-0 relative">
        <div
          className={`w-0.5 flex-1 transition-colors duration-200 ${
            isFirst
              ? "opacity-0"
              : isDeliveredState
              ? "bg-[#22C55E]"
              : "bg-white/[0.08]"
          }`}
        />

        {/* Stop Number / Completion Indicator */}
        <button
          type="button"
          onClick={handleQuickTick}
          title={isDeliveredState ? "Delivered" : "Tap to stamp stop delivered"}
          className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer my-1 z-10 transition-all duration-200 text-xs font-mono font-bold ${
            isDeliveredState
              ? "bg-[#B5F23D] text-[#0C1004] scale-110 shadow-sm"
              : isUrgent
              ? "border-2 border-[#F43F5E] bg-[#F43F5E]/20 text-[#F43F5E] ring-2 ring-[#F43F5E]/20"
              : isNextUp
              ? "border-2 border-[#B5F23D] bg-[#B5F23D]/10 text-[#B5F23D] ring-2 ring-[#B5F23D]/25"
              : "border border-white/[0.16] bg-[#1B1B20] text-[#8C8C96] hover:border-white/40"
          }`}
        >
          {isDeliveredState ? (
            <Check size={13} strokeWidth={3} />
          ) : isUrgent ? (
            "!"
          ) : (
            stopNumber
          )}
        </button>

        <div
          className={`w-0.5 flex-1 transition-colors duration-200 ${
            isLast
              ? "opacity-0"
              : isDeliveredState
              ? "bg-[#22C55E]"
              : "bg-white/[0.08]"
          }`}
        />
      </div>

      {/* Stop Card */}
      <div className="flex-1 pb-3.5 min-w-0">
        <div
          className={`border rounded-2xl transition-all duration-150 overflow-hidden ${
            isDeliveredState
              ? "bg-[#131316]/50 border-white/[0.04] opacity-75"
              : isNextUp
              ? "bg-[#16161B] border-[#B5F23D]/40 shadow-float ring-1 ring-[#B5F23D]/20"
              : "bg-[#131316] border-white/[0.08] hover:border-white/[0.18]"
          }`}
        >
          {/* Stop Header */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-4 flex items-center justify-between gap-3 cursor-pointer min-h-[56px]"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`font-sans font-bold text-sm tracking-tight truncate ${
                    isDeliveredState ? "line-through text-[#8C8C96]" : "text-[#F4F4F6]"
                  }`}
                >
                  {item.shop.name}
                </span>

                {isUrgent && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/30">
                    Urgent
                  </span>
                )}

                {item.daysOverdue >= 1 && !isUrgent && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 font-mono tabular-nums">
                    {item.daysOverdue}d overdue
                  </span>
                )}

                {isDeliveredState && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30">
                    Delivered
                  </span>
                )}
              </div>

              {/* SKU Order Pills */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {item.dueProducts.map((p) => (
                  <span
                    key={p.product.id}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-[#1B1B20] text-[#F4F4F6] border border-white/[0.06] font-mono"
                  >
                    <span className="truncate max-w-[150px]">{p.product.name}</span>
                    <span className="text-[#B5F23D] font-bold">×{p.shopProduct.default_qty}</span>
                  </span>
                ))}
              </div>

              {/* Outstanding Dues */}
              {(item.shop.balance_due || 0) > 0 && !isDeliveredState && (
                <div className="mt-2 text-xs font-mono font-bold text-[#F43F5E] flex items-center gap-1">
                  <IndianRupee size={12} />
                  <span>Dues: ₹{(item.shop.balance_due || 0).toLocaleString("en-IN")}</span>
                </div>
              )}
            </div>

            {/* Quick Action Button */}
            <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {!isDeliveredState ? (
                <>
                  <button
                    type="button"
                    onClick={handleQuickTick}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 rounded-xl bg-[#B5F23D] hover:bg-[#A3DE30] text-[#0C1004] text-xs font-bold transition-all flex items-center gap-1 shadow-sm active:scale-95"
                  >
                    <Check size={14} strokeWidth={3} />
                    <span className="hidden sm:inline">Delivered</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOutcomeModal(true)}
                    title="Log Other Outcome (Follow-up, Bill-to-Bill, Unpaid, Closed, Note)"
                    className="p-1.5 rounded-xl bg-[#1B1B20] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.08] transition-colors"
                  >
                    <MoreHorizontal size={15} />
                  </button>
                </>
              ) : (
                <span className="text-xs font-mono text-[#22C55E] font-semibold inline-flex items-center gap-1">
                  <Check size={13} strokeWidth={2.5} /> Logged
                </span>
              )}

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-[#8C8C96] hover:text-[#F4F4F6] rounded-lg transition-colors"
              >
                <ChevronRight
                  size={16}
                  className={`transform transition-transform ${isExpanded ? "rotate-90" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Expanded Drawer: Itemized adjustments & cash dues entry */}
          {isExpanded && (
            <div className="p-4 border-t border-white/[0.06] bg-[#0A0A0C]/50 space-y-4">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#8C8C96] mb-2">
                  Verify Crate Counts & Stock Feedback
                </div>
                {item.dueProducts.map((p) => {
                  const state = productStates[p.product.id];
                  return (
                    <ProductConfirmRow
                      key={p.product.id}
                      product={p.product}
                      shopProduct={p.shopProduct}
                      qty={state?.qty ?? p.shopProduct.default_qty}
                      feedback={state?.feedback ?? null}
                      onQtyChange={(qty) =>
                        setProductStates((prev) => ({
                          ...prev,
                          [p.product.id]: {
                            ...prev[p.product.id],
                            qty,
                          },
                        }))
                      }
                      onFeedbackChange={(feedback) =>
                        setProductStates((prev) => ({
                          ...prev,
                          [p.product.id]: {
                            ...prev[p.product.id],
                            feedback,
                          },
                        }))
                      }
                    />
                  );
                })}
              </div>

              {/* Payment collected at doorstep */}
              <div className="p-3.5 bg-[#1B1B20] border border-white/[0.08] rounded-xl flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-[#F4F4F6]">Doorstep Payment Collected</div>
                  <div className="text-[11px] text-[#8C8C96] font-mono">
                    Prior ledger balance: ₹{(item.shop.balance_due || 0).toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[#8C8C96]">₹</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={paymentInput}
                    onChange={(e) => setPaymentInput(e.target.value)}
                    className="w-24 px-2.5 py-1.5 text-xs font-mono font-bold text-right bg-[#131316] border border-white/[0.12] rounded-lg text-[#F4F4F6] focus:outline-none focus:border-[#B5F23D]"
                  />
                </div>
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setShowSnoozeMenu(!showSnoozeMenu)}
                  className="text-xs text-[#8C8C96] hover:text-[#F4F4F6] font-medium flex items-center gap-1"
                >
                  <Clock size={13} />
                  <span>Snooze Drop</span>
                </button>

                <button
                  type="button"
                  onClick={handleDetailedSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#B5F23D] hover:bg-[#A3DE30] text-[#0C1004] text-xs font-bold transition-all shadow-sm"
                >
                  Confirm Delivery & Log Payment
                </button>
              </div>

              {/* Snooze popover menu */}
              {showSnoozeMenu && (
                <div className="p-3 bg-[#1B1B20] border border-white/[0.12] rounded-xl text-xs space-y-2">
                  <div className="font-bold text-[#F4F4F6]">Snooze Delivery Round</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleSnooze(1, "Shop closed today")}
                      className="px-2.5 py-1 rounded-lg bg-[#131316] hover:bg-white/[0.06] text-[#F4F4F6] border border-white/[0.08]"
                    >
                      +1 Day (Shop Closed)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSnooze(2, "Owner requested weekend drop")}
                      className="px-2.5 py-1 rounded-lg bg-[#131316] hover:bg-white/[0.06] text-[#F4F4F6] border border-white/[0.08]"
                    >
                      +2 Days (Owner Request)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSnooze(7, "Excess inventory on hand")}
                      className="px-2.5 py-1 rounded-lg bg-[#131316] hover:bg-white/[0.06] text-[#F4F4F6] border border-white/[0.08]"
                    >
                      +7 Days (Full Rack)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showOutcomeModal && (
        <VisitOutcomeModal
          shop={item.shop}
          shopProducts={item.dueProducts.map((p) => ({
            shopProduct: p.shopProduct,
            product: p.product,
          }))}
          onClose={() => setShowOutcomeModal(false)}
          onSuccess={() => {
            setJustDelivered(true);
            onDelivered?.(item.shop.id);
          }}
        />
      )}
    </div>
  );
};
