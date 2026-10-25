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
    <div className="py-2.5 px-3.5 bg-[#1B1B20] border border-white/[0.08] rounded-xl mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shadow-sm">
      <div className="flex-1 min-w-0">
        <div className="font-bold text-[#F4F4F6] truncate">{product.name}</div>
        <div className="text-[11px] text-[#8C8C96] font-mono mt-0.5">
          Cadence: Every {shopProduct.interval_days}d · Default: {shopProduct.default_qty} units
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quantity input */}
        <div className="flex items-center gap-1.5">
          <label htmlFor={`qty-${product.id}`} className="text-xs font-semibold text-[#8C8C96]">
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
            className="w-16 h-8 px-2 text-center text-xs font-mono font-bold bg-[#131316] border border-white/[0.12] rounded-lg text-[#F4F4F6] focus:outline-none focus:border-[#B5F23D]"
          />
        </div>

        {/* Professional Stock Feedback Selector (Clean SVG Dot Pills, Zero Emojis) */}
        <div
          className="flex items-center gap-1 bg-[#131316] border border-white/[0.08] rounded-lg p-1"
          role="group"
          aria-label="Stock level feedback"
        >
          <button
            type="button"
            title="Stock low (shortens replenishment cycle)"
            aria-label="Stock low"
            onClick={() => onFeedbackChange(feedback === "low" ? null : "low")}
            className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
              feedback === "low"
                ? "bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/40"
                : "text-[#8C8C96] hover:text-[#F4F4F6]"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#F43F5E]" />
            <span>Low</span>
          </button>

          <button
            type="button"
            title="Stock normal (preserves cadence)"
            aria-label="Stock normal"
            onClick={() => onFeedbackChange(feedback === "fine" ? null : "fine")}
            className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
              feedback === "fine"
                ? "bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40"
                : "text-[#8C8C96] hover:text-[#F4F4F6]"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            <span>OK</span>
          </button>

          <button
            type="button"
            title="Stock plenty (lengthens replenishment cycle)"
            aria-label="Stock plenty"
            onClick={() => onFeedbackChange(feedback === "plenty" ? null : "plenty")}
            className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
              feedback === "plenty"
                ? "bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/40"
                : "text-[#8C8C96] hover:text-[#F4F4F6]"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
            <span>High</span>
          </button>
        </div>
      </div>
    </div>
  );
};
