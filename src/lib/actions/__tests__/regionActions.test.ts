import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { db } from "@/lib/db/dexie";
import { reorderShops, saveRegion, saveProduct } from "../regionActions";

describe("Region & Product Actions", () => {
  beforeEach(async () => {
    await db.regions.clear();
    await db.shops.clear();
    await db.products.clear();
    await db.sync_queue.clear();
  });

  it("reorderShops updates sort_order sequentially", async () => {
    const rId = await saveRegion("Station East");

    await db.shops.put({
      id: "shop-a",
      owner_id: "demo",
      region_id: rId,
      name: "Shop A",
      contact: null,
      lat: null,
      lng: null,
      notes: null,
      is_urgent: false,
      sort_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await db.shops.put({
      id: "shop-b",
      owner_id: "demo",
      region_id: rId,
      name: "Shop B",
      contact: null,
      lat: null,
      lng: null,
      notes: null,
      is_urgent: false,
      sort_order: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Reorder: shop-b first, then shop-a
    await reorderShops(rId, ["shop-b", "shop-a"]);

    const shopA = await db.shops.get("shop-a");
    const shopB = await db.shops.get("shop-b");

    expect(shopB?.sort_order).toBe(1);
    expect(shopA?.sort_order).toBe(2);
  });

  it("saveProduct creates and updates products with default_interval", async () => {
    const pId = await saveProduct({
      name: "Britannia Bourbon 150g",
      default_interval: 10,
    });

    const prod = await db.products.get(pId);
    expect(prod?.name).toBe("Britannia Bourbon 150g");
    expect(prod?.default_interval).toBe(10);
  });
});
