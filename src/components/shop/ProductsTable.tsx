import React from "react";
import { LocalProduct, LocalShopProduct } from "@/lib/db/dexie";

export interface ShopProductDetailItem {
  product: LocalProduct;
  shopProduct: LocalShopProduct;
  lastDeliveredStr: string | null;
}

interface ProductsTableProps {
  products: ShopProductDetailItem[];
  onUpdateProduct?: (
    productId: string,
    updates: Partial<LocalShopProduct>
  ) => void;
}

export const ProductsTable: React.FC<ProductsTableProps> = ({
  products,
  onUpdateProduct,
}) => {
  if (products.length === 0) {
    return (
      <div className="py-6 text-center text-xs font-mono text-[#8C8C96] bg-[#131316] border border-white/[0.08] rounded-2xl">
        No products configured for this kirana store.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-white/[0.08] rounded-2xl bg-[#131316] shadow-lift">
      <table className="w-full text-left text-xs font-mono border-collapse">
        <thead>
          <tr className="border-b border-white/[0.08] bg-[#16161B] text-[#8C8C96] select-none">
            <th className="py-2.5 px-4 font-bold">Product SKU</th>
            <th className="py-2.5 px-3 font-bold">Interval</th>
            <th className="py-2.5 px-3 font-bold">Default Qty</th>
            <th className="py-2.5 px-3 font-bold">Last Drop</th>
            <th className="py-2.5 px-3 font-bold">Next Due</th>
            <th className="py-2.5 px-4 font-bold text-right">Offset</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {products.map(({ product, shopProduct, lastDeliveredStr }) => (
            <tr key={product.id} className="hover:bg-[#1B1B20]/40 transition-colors">
              <td className="py-3 px-4 font-bold text-[#F4F4F6]">
                {product.name}
              </td>
              <td className="py-3 px-3 text-[#F4F4F6]">
                {onUpdateProduct ? (
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={shopProduct.interval_days}
                    onChange={(e) =>
                      onUpdateProduct(product.id, {
                        interval_days: parseInt(e.target.value, 10) || 7,
                      })
                    }
                    className="w-16 px-2 py-1 border border-white/[0.12] rounded-lg bg-[#1B1B20] text-center font-bold text-[#F4F4F6] focus:border-[#B5F23D]"
                  />
                ) : (
                  `${shopProduct.interval_days} days`
                )}
              </td>
              <td className="py-3 px-3 text-[#F4F4F6]">
                {onUpdateProduct ? (
                  <input
                    type="number"
                    min={1}
                    value={shopProduct.default_qty}
                    onChange={(e) =>
                      onUpdateProduct(product.id, {
                        default_qty: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-16 px-2 py-1 border border-white/[0.12] rounded-lg bg-[#1B1B20] text-center font-bold text-[#B5F23D] focus:border-[#B5F23D]"
                  />
                ) : (
                  <span className="text-[#B5F23D] font-bold">{shopProduct.default_qty}</span>
                )}
              </td>
              <td className="py-3 px-3 text-[#8C8C96]">
                {lastDeliveredStr || "Never"}
              </td>
              <td className="py-3 px-3 font-bold text-[#F4F4F6] tabular-nums">
                {shopProduct.next_due_date}
              </td>
              <td className="py-3 px-4 text-right text-[#8C8C96]">
                {shopProduct.remind_offset_days === 0
                  ? "0d"
                  : `-${shopProduct.remind_offset_days}d`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
