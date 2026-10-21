import { db, LocalRegion, LocalShop, LocalProduct } from "@/lib/db/dexie";
import { enqueueWrite } from "@/lib/db/sync";

export async function saveRegion(name: string, id?: string, ownerId: string = "demo-user"): Promise<string> {
  const isNew = !id;
  const nowIso = new Date().toISOString();
  const regionId = id || (typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `reg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);

  let sortOrder = 0;
  if (isNew) {
    const count = await db.regions.count();
    sortOrder = count + 1;
  } else {
    const existing = await db.regions.get(id);
    if (existing) sortOrder = existing.sort_order;
  }

  const regionRecord: LocalRegion = {
    id: regionId,
    owner_id: ownerId,
    name: name.trim(),
    sort_order: sortOrder,
    created_at: nowIso,
  };

  await enqueueWrite("regions", "upsert", regionRecord);
  return regionId;
}

export async function reorderShops(regionId: string, orderedIds: string[]): Promise<void> {
  const nowIso = new Date().toISOString();

  for (let i = 0; i < orderedIds.length; i++) {
    const shopId = orderedIds[i];
    const shop = await db.shops.get(shopId);
    if (shop) {
      const updated: LocalShop = {
        ...shop,
        region_id: regionId,
        sort_order: i + 1,
        updated_at: nowIso,
      };
      await enqueueWrite("shops", "upsert", updated);
    }
  }
}

export async function saveProduct(
  data: { id?: string; name: string; default_interval: number },
  ownerId: string = "demo-user"
): Promise<string> {
  const nowIso = new Date().toISOString();
  const prodId = data.id || (typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);

  const prodRecord: LocalProduct = {
    id: prodId,
    owner_id: ownerId,
    name: data.name.trim(),
    default_interval: data.default_interval || 7,
    created_at: nowIso,
  };

  await enqueueWrite("products", "upsert", prodRecord);
  return prodId;
}
