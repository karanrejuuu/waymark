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
      <div className="py-4 text-xs text-text-tertiary">
        No products configured for this shop.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-border text-text-tertiary font-medium">
            <th className="py-2 pr-3">Product</th>
            <th className="py-2 px-3">Interval</th>
            <th className="py-2 px-3">Default Qty</th>
            <th className="py-2 px-3">Last Delivered</th>
            <th className="py-2 px-3">Next Due</th>
            <th className="py-2 pl-3">Offset</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {products.map(({ product, shopProduct, lastDeliveredStr }) => (
            <tr key={product.id} className="hover:bg-bg-subtle/50 transition-colors">
              <td className="py-2.5 pr-3 font-medium text-text-primary">
                {product.name}
              </td>
              <td className="py-2.5 px-3 text-text-secondary">
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
                    className="w-14 px-1.5 py-0.5 border border-border rounded bg-bg text-center font-medium"
                  />
                ) : (
                  `${shopProduct.interval_days} days`
                )}
              </td>
              <td className="py-2.5 px-3 text-text-secondary">
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
                    className="w-14 px-1.5 py-0.5 border border-border rounded bg-bg text-center font-medium"
                  />
                ) : (
                  shopProduct.default_qty
                )}
              </td>
              <td className="py-2.5 px-3 text-text-secondary">
                {lastDeliveredStr || "Never"}
              </td>
              <td className="py-2.5 px-3 font-medium text-text-primary">
                {shopProduct.next_due_date}
              </td>
              <td className="py-2.5 pl-3 text-text-secondary">
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
