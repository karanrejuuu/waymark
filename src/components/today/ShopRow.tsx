import React, { useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { TodayShopItem } from "@/hooks/useTodayList";
import { StatusDot } from "@/components/ui/StatusDot";
import { ProductConfirmRow } from "./ProductConfirmRow";
import { markDelivered } from "@/lib/actions/markDelivered";
import { StockFeedback } from "@/lib/supabase/types";

interface ShopRowProps {
  item: TodayShopItem;
  onDelivered?: (shopId: string) => void;
}

export const ShopRow: React.FC<ShopRowProps> = ({ item, onDelivered }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckedAnimation, setIsCheckedAnimation] = useState(false);

  // Form state for each product in this shop
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

  const handleQuickCheck = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSubmitting) return;

    // Trigger checkbox animation
    setIsCheckedAnimation(true);
    setIsSubmitting(true);

    try {
      // Fast path: mark all due products with default quantity and no feedback
      const payload = item.dueProducts.map((p) => ({
        productId: p.product.id,
        qty: p.shopProduct.default_qty,
        feedback: null,
      }));

      // Short delay for the 150ms tick feeling
      await new Promise((r) => setTimeout(r, 150));
      await markDelivered(item.shop.id, payload);
      onDelivered?.(item.shop.id);
    } catch (err) {
      console.error("Failed to mark delivered:", err);
      setIsCheckedAnimation(false);
      setIsSubmitting(false);
    }
  };

  const handleDetailedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setIsCheckedAnimation(true);

    try {
      const payload = item.dueProducts.map((p) => {
        const state = productStates[p.product.id];
        return {
          productId: p.product.id,
          qty: state?.qty ?? p.shopProduct.default_qty,
          feedback: state?.feedback ?? null,
        };
      });

      await new Promise((r) => setTimeout(r, 150));
      await markDelivered(item.shop.id, payload);
      onDelivered?.(item.shop.id);
    } catch (err) {
      console.error("Failed to mark detailed delivery:", err);
      setIsSubmitting(false);
      setIsCheckedAnimation(false);
    }
  };

  return (
    <div className="border-b border-border last:border-b-0 transition-colors">
      {/* Collapsed Row header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        className="flex items-center justify-between py-3 px-3 hover:bg-bg-subtle cursor-pointer select-none min-h-[44px] gap-2"
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <ChevronRight
            size={16}
            className={`text-text-tertiary transition-transform duration-150 flex-shrink-0 ${
              isExpanded ? "rotate-90 text-text-primary" : ""
            }`}
          />

          {item.isUrgent ? (
            <StatusDot variant="urgent" label="Urgent" />
          ) : item.isEscalated ? (
            <StatusDot variant="escalated" label="Overdue" />
          ) : (
            <StatusDot variant="fine" />
          )}

          <span className="font-medium text-sm text-text-primary truncate">
            {item.shop.name}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {item.region && (
            <span className="text-xs text-text-tertiary hidden xs:inline">
              {item.region.name}
            </span>
          )}

          {/* Signature Satisfying Checkbox */}
          <button
            type="button"
            aria-label={`Mark ${item.shop.name} delivered`}
            onClick={handleQuickCheck}
            disabled={isSubmitting}
            className={`w-6 h-6 rounded border flex items-center justify-center transition-all duration-150 ${
              isCheckedAnimation
                ? "bg-accent border-accent text-white scale-105"
                : "border-border hover:border-text-secondary bg-bg"
            }`}
          >
            {isCheckedAnimation && <Check size={14} className="stroke-[3]" />}
          </button>
        </div>
      </div>

      {/* Inline Expanded Panel */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 bg-bg-subtle/50">
          <form onSubmit={handleDetailedSubmit}>
            <div className="text-xs text-text-secondary mb-2 font-medium">
              Products to deliver:
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

            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 text-xs font-medium text-white bg-accent rounded hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                {isSubmitting ? "Saving..." : "Mark delivered"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
