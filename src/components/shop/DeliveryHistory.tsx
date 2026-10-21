import React from "react";
import { LocalDelivery, LocalProduct } from "@/lib/db/dexie";

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
      <div className="py-4 text-xs text-text-tertiary">
        No delivery history recorded yet.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border text-xs">
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
            className="py-2.5 flex items-center justify-between gap-2 hover:bg-bg-subtle/30"
          >
            <div className="flex-1 min-w-0">
              <span className="font-medium text-text-primary">
                {prod?.name || "Product"}
              </span>
              <span className="text-text-secondary ml-2">
                — {del.qty} {del.qty === 1 ? "unit" : "units"}
              </span>
              {del.stock_feedback && (
                <span className="ml-2 inline-flex items-center text-[11px] px-1.5 py-0.2 rounded bg-bg-subtle border border-border text-text-secondary">
                  Stock was {del.stock_feedback}
                </span>
              )}
            </div>

            <div className="text-text-tertiary text-right text-[11px] flex-shrink-0">
              {dateFormatted}
            </div>
          </div>
        );
      })}
    </div>
  );
};
