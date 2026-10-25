import Dexie, { type EntityTable } from "dexie";
import { Tables } from "../supabase/types";

export interface SyncQueueItem {
  id?: number;
  table: string;
  op: "upsert" | "delete";
  payload: any;
  createdAt: string;
}

export interface LocalOrganisation extends Tables<"organisations"> {}
export interface LocalOrganisationMember extends Tables<"organisation_members"> {}
export interface LocalProfile extends Tables<"profiles"> {}
export interface LocalGodown extends Tables<"godowns"> {}
export interface LocalRegion extends Tables<"regions"> {}
export interface LocalShop extends Tables<"shops"> {
  reminder_date?: string | null;
  reminder_note?: string | null;
}
export interface LocalProduct extends Tables<"products"> {}
export interface LocalShopProduct extends Tables<"shop_products"> {}
export interface LocalDelivery extends Tables<"deliveries"> {}
export interface LocalPayment extends Tables<"payments"> {}

export class WaymarkDatabase extends Dexie {
  organisations!: EntityTable<LocalOrganisation, "id">;
  organisation_members!: EntityTable<LocalOrganisationMember, "id">;
  profiles!: EntityTable<LocalProfile, "id">;
  godowns!: EntityTable<LocalGodown, "id">;
  regions!: EntityTable<LocalRegion, "id">;
  shops!: EntityTable<LocalShop, "id">;
  products!: EntityTable<LocalProduct, "id">;
  shop_products!: EntityTable<LocalShopProduct, "id">;
  deliveries!: EntityTable<LocalDelivery, "id">;
  payments!: EntityTable<LocalPayment, "id">;
  sync_queue!: EntityTable<SyncQueueItem, "id">;

  constructor() {
    super("WaymarkDB");

    // Version 1: Original schema (preserves backward compatibility for existing devices)
    this.version(1).stores({
      profiles: "id",
      godowns: "id, owner_id",
      regions: "id, owner_id, sort_order",
      shops: "id, owner_id, region_id, is_urgent, sort_order",
      products: "id, owner_id",
      shop_products: "id, shop_id, product_id, next_due_date, [shop_id+product_id]",
      deliveries: "id, &client_id, shop_id, product_id, delivered_at, synced",
      sync_queue: "++id, table, op, createdAt",
    });

    // Version 2: Multi-tenant organisation and payments support
    this.version(2).stores({
      organisations: "id",
      organisation_members: "id, organisation_id, user_id",
      profiles: "id",
      godowns: "id, owner_id, organisation_id",
      regions: "id, owner_id, organisation_id, sort_order",
      shops: "id, owner_id, organisation_id, region_id, is_urgent, is_archived, sort_order",
      products: "id, owner_id, organisation_id",
      shop_products: "id, shop_id, product_id, organisation_id, next_due_date, snooze_until, [shop_id+product_id]",
      deliveries: "id, &client_id, organisation_id, shop_id, product_id, delivered_at, synced",
      payments: "id, &client_id, organisation_id, shop_id, collected_at",
      sync_queue: "++id, table, op, createdAt",
    });

    // Version 3: Added reminder_date to shops for supplier walk-to-car scheduled reminders
    this.version(3).stores({
      shops: "id, owner_id, organisation_id, region_id, is_urgent, is_archived, sort_order, reminder_date",
    });
  }
}

export const db = new WaymarkDatabase();
