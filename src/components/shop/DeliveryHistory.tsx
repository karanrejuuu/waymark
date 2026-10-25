import React from "react";
import { LocalDelivery, LocalProduct } from "@/lib/db/dexie";
import { Package, Clock } from "lucide-react";

interface DeliveryHistoryProps {
  deliveries: LocalDelivery[];
  productMap: Map<string, LocalProduct>;
}

export const DeliveryHistory: React.FC<DeliveryHistoryProps> = ({
  deliveries,
  productMap,
}) => {
  if (deliveries.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-zinc-500 border border-dashed border-white/[0.08] rounded-xl bg-[#111827]/40">
        No past deliveries logged for this store yet.
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/[0.06] text-xs">
      {deliveries.map((del) => {
        const prod = productMap.get(del.product_id);
        const dateFormatted = new Date(del.delivered_at).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <div
            key={del.id || del.client_id}
            className="py-3 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors rounded-lg px-2 -mx-2"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#1E293B] border border-white/[0.08] flex items-center justify-center text-zinc-400 shrink-0">
                <Package size={13} />
              </div>
              <div className="truncate">
                <span className="font-semibold text-zinc-200">
                  {prod?.name || "Product SKU"}
                </span>
                <span className="text-zinc-400 font-mono text-[11px] ml-2">
                  × {del.qty} {del.qty === 1 ? "unit" : "units"}
                </span>
                {del.stock_feedback && (
                  <span className="ml-2 inline-flex items-center text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-zinc-400">
                    Stock {del.stock_feedback}
                  </span>
                )}
              </div>
            </div>

            <div className="text-zinc-500 font-mono text-[11px] flex items-center gap-1 shrink-0">
              <Clock size={11} />
              <span>{dateFormatted}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
