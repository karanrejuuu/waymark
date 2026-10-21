import Dexie, { type EntityTable } from "dexie";
import {
  Tables,
  StockFeedback,
  UserRole,
} from "../supabase/types";

export interface SyncQueueItem {
  id?: number;
  table: string;
  op: "upsert" | "delete";
  payload: any;
  createdAt: string;
}

export interface LocalProfile extends Tables<"profiles"> {}
export interface LocalGodown extends Tables<"godowns"> {}
export interface LocalRegion extends Tables<"regions"> {}
export interface LocalShop extends Tables<"shops"> {}
export interface LocalProduct extends Tables<"products"> {}
export interface LocalShopProduct extends Tables<"shop_products"> {}
export interface LocalDelivery extends Tables<"deliveries"> {}

export class WaymarkDatabase extends Dexie {
  profiles!: EntityTable<LocalProfile, "id">;
  godowns!: EntityTable<LocalGodown, "id">;
  regions!: EntityTable<LocalRegion, "id">;
  shops!: EntityTable<LocalShop, "id">;
  products!: EntityTable<LocalProduct, "id">;
  shop_products!: EntityTable<LocalShopProduct, "id">;
  deliveries!: EntityTable<LocalDelivery, "id">;
  sync_queue!: EntityTable<SyncQueueItem, "id">;

  constructor() {
    super("WaymarkDB");
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
  }
}

export const db = new WaymarkDatabase();
