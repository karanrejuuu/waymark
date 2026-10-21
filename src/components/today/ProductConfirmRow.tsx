import React from "react";
import { StockFeedback } from "@/lib/supabase/types";
import { LocalProduct, LocalShopProduct } from "@/lib/db/dexie";

interface ProductConfirmRowProps {
  product: LocalProduct;
  shopProduct: LocalShopProduct;
  qty: number;
  feedback: StockFeedback;
  onQtyChange: (qty: number) => void;
  onFeedbackChange: (feedback: StockFeedback) => void;
}

export const ProductConfirmRow: React.FC<ProductConfirmRowProps> = ({
  product,
  shopProduct,
  qty,
  feedback,
  onQtyChange,
  onFeedbackChange,
}) => {
  return (
    <div className="py-2.5 px-3 bg-bg-subtle rounded-md mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-sm">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-text-primary truncate">{product.name}</div>
        <div className="text-xs text-text-tertiary">
          Interval: {shopProduct.interval_days}d · Default: {shopProduct.default_qty}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quantity input */}
        <div className="flex items-center gap-1.5">
          <label htmlFor={`qty-${product.id}`} className="text-xs text-text-secondary">
            Qty:
          </label>
          <input
            id={`qty-${product.id}`}
            type="number"
            inputMode="numeric"
            min={1}
            value={Number.isNaN(qty) ? "" : qty}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              onQtyChange(val);
            }}
            className="w-16 h-8 px-2 text-center text-sm font-medium bg-bg border border-border rounded focus:outline-none focus:border-accent"
          />
        </div>

        {/* Stock feedback selector (the spec-allowed 🔴🟡🟢 emoji exception) */}
        <div className="flex items-center gap-1 bg-bg border border-border rounded p-0.5" role="group" aria-label="Stock level feedback">
          <button
            type="button"
            title="Stock low (decreases interval next round)"
            aria-label="Stock low"
            onClick={() => onFeedbackChange(feedback === "low" ? null : "low")}
            className={`w-7 h-7 flex items-center justify-center rounded text-xs transition-opacity ${
              feedback === "low" ? "bg-red-soft/20 ring-1 ring-red-soft" : "opacity-40 hover:opacity-100"
            }`}
          >
            🔴
          </button>
          <button
            type="button"
            title="Stock fine (no interval change)"
            aria-label="Stock fine"
            onClick={() => onFeedbackChange(feedback === "fine" ? null : "fine")}
            className={`w-7 h-7 flex items-center justify-center rounded text-xs transition-opacity ${
              feedback === "fine" ? "bg-yellow-soft/20 ring-1 ring-yellow-soft" : "opacity-40 hover:opacity-100"
            }`}
          >
            🟡
          </button>
          <button
            type="button"
            title="Stock plenty (increases interval next round)"
            aria-label="Stock plenty"
            onClick={() => onFeedbackChange(feedback === "plenty" ? null : "plenty")}
            className={`w-7 h-7 flex items-center justify-center rounded text-xs transition-opacity ${
              feedback === "plenty" ? "bg-green-soft/20 ring-1 ring-green-soft" : "opacity-40 hover:opacity-100"
            }`}
          >
            🟢
          </button>
        </div>
      </div>
    </div>
  );
};
