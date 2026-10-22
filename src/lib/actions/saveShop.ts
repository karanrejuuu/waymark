import { db, LocalShop, LocalShopProduct } from "../db/dexie";
import { enqueueWrite } from "../db/sync";
import { formatDateOnly } from "../scheduling";

export interface ShopProductConfigInput {
  productId: string;
  defaultQty: number;
  intervalDays: number;
  remindOffsetDays: number;
}

export interface SaveShopInput {
  id?: string;
  name: string;
  regionId: string | null;
  contact?: string | null;
  lat?: number | null;
  lng?: number | null;
  notes?: string | null;
  products: ShopProductConfigInput[];
}

export async function saveShop(
  input: SaveShopInput,
  ownerId: string = "demo-user",
  organisationId: string = "org-waymark-demo"
): Promise<string> {
  const isNew = !input.id;
  const now = new Date();
  const nowIso = now.toISOString();
  const todayStr = formatDateOnly(now);

  const shopId = input.id || (typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `shop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);

  const shopRecord: LocalShop = {
    id: shopId,
    owner_id: ownerId,
    organisation_id: organisationId,
    region_id: input.regionId || null,
    name: input.name.trim(),
    contact: input.contact?.trim() || null,
    lat: input.lat !== undefined ? input.lat : null,
    lng: input.lng !== undefined ? input.lng : null,
    notes: input.notes?.trim() || null,
    is_urgent: false,
    sort_order: 0,
    balance_due: 0,
    is_archived: false,
    created_at: nowIso,
    updated_at: nowIso,
  };

  // If updating, preserve existing created_at and sort_order and is_urgent
  if (!isNew && input.id) {
    const existing = await db.shops.get(input.id);
    if (existing) {
      shopRecord.created_at = existing.created_at;
      shopRecord.sort_order = existing.sort_order;
      shopRecord.is_urgent = existing.is_urgent;
      shopRecord.balance_due = existing.balance_due ?? 0;
      shopRecord.is_archived = existing.is_archived ?? false;
      shopRecord.organisation_id = existing.organisation_id ?? organisationId;
    }
  }

  await enqueueWrite("shops", "upsert", shopRecord);

  // Manage shop_products
  for (const prodInput of input.products) {
    const existingSp = await db.shop_products
      .where({ shop_id: shopId, product_id: prodInput.productId })
      .first();

    const spId = existingSp?.id || (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `sp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);

    // For newly added products, next_due_date defaults to today
    const nextDueDate = existingSp ? existingSp.next_due_date : todayStr;

    const spRecord: LocalShopProduct = {
      id: spId,
      organisation_id: organisationId,
      shop_id: shopId,
      product_id: prodInput.productId,
      default_qty: prodInput.defaultQty || 1,
      interval_days: prodInput.intervalDays || 7,
      remind_offset_days: Math.min(3, Math.max(0, prodInput.remindOffsetDays || 0)),
      next_due_date: nextDueDate,
      snooze_until: existingSp ? (existingSp.snooze_until ?? null) : null,
      created_at: existingSp ? existingSp.created_at : nowIso,
    };

    await enqueueWrite("shop_products", "upsert", spRecord);
  }

  return shopId;
}
