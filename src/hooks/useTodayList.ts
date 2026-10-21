import { useLiveQuery } from "dexie-react-hooks";
import { db, LocalShop, LocalProduct, LocalShopProduct, LocalRegion } from "@/lib/db/dexie";
import { isDueToday, isEscalated, sortTodayItems, parseDateOnly } from "@/lib/scheduling";

export interface TodayDueProduct {
  product: LocalProduct;
  shopProduct: LocalShopProduct;
  isDue: boolean;
}

export interface TodayShopItem {
  shop: LocalShop;
  region: LocalRegion | null;
  dueProducts: TodayDueProduct[];
  allProducts: TodayDueProduct[];
  isUrgent: boolean;
  isEscalated: boolean;
  earliestDueDate: Date;
}

export function useTodayList(todayStr?: string) {
  return useLiveQuery(async () => {
    const today = todayStr ? parseDateOnly(todayStr) : parseDateOnly(new Date());

    const [allShops, allProducts, allShopProducts, allRegions] = await Promise.all([
      db.shops.toArray(),
      db.products.toArray(),
      db.shop_products.toArray(),
      db.regions.toArray(),
    ]);

    const productMap = new Map<string, LocalProduct>(
      allProducts.map((p) => [p.id, p])
    );
    const regionMap = new Map<string, LocalRegion>(
      allRegions.map((r) => [r.id, r])
    );

    // Group shop_products by shop_id
    const shopProductsByShop = new Map<string, LocalShopProduct[]>();
    for (const sp of allShopProducts) {
      const list = shopProductsByShop.get(sp.shop_id) || [];
      list.push(sp);
      shopProductsByShop.set(sp.shop_id, list);
    }

    const todayItems: TodayShopItem[] = [];

    for (const shop of allShops) {
      const spList = shopProductsByShop.get(shop.id) || [];
      const productsWithDetails: TodayDueProduct[] = [];
      const dueProducts: TodayDueProduct[] = [];
      let earliestDate: Date | null = null;

      for (const sp of spList) {
        const prod = productMap.get(sp.product_id);
        if (!prod) continue;

        const due = isDueToday(sp.next_due_date, today);
        const item: TodayDueProduct = {
          product: prod,
          shopProduct: sp,
          isDue: due,
        };

        productsWithDetails.push(item);
        if (due) {
          dueProducts.push(item);
        }

        const dateObj = parseDateOnly(sp.next_due_date);
        if (!earliestDate || dateObj.getTime() < earliestDate.getTime()) {
          earliestDate = dateObj;
        }
      }

      // A shop is due if:
      // 1. shop.is_urgent is true
      // 2. OR any of its products is due today/overdue
      const shouldInclude = shop.is_urgent || dueProducts.length > 0;

      if (shouldInclude) {
        const region = shop.region_id ? regionMap.get(shop.region_id) || null : null;
        const finalDueDate = earliestDate || today;

        todayItems.push({
          shop,
          region,
          dueProducts: dueProducts.length > 0 ? dueProducts : productsWithDetails,
          allProducts: productsWithDetails,
          isUrgent: shop.is_urgent,
          isEscalated: isEscalated(finalDueDate, today),
          earliestDueDate: finalDueDate,
        });
      }
    }

    // Sort using scheduling rules
    const sortable = todayItems.map((item) => ({
      ...item,
      shopId: item.shop.id,
      nextDueDate: item.earliestDueDate,
      sortOrder: item.shop.sort_order,
    }));

    return sortTodayItems(sortable, today);
  }, [todayStr]);
}
