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
export interface LocalOrganisationMember extends Tables<"organisation_members"> {
  name?: string;
  phone?: string;
}
export interface LocalProfile extends Tables<"profiles"> {
  onboarding_completed?: boolean;
  business_name?: string;
}
export interface LocalGodown extends Tables<"godowns"> {}
export interface LocalRegion extends Tables<"regions"> {
  active_days?: number[]; // [0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat]
}
export interface LocalShop extends Tables<"shops"> {
  reminder_date?: string | null;
  reminder_note?: string | null;
  email?: string | null;
  whatsapp_number?: string | null;
  gstin?: string | null;
  billing_address?: string | null;
  state_name?: string | null;
  state_code?: string | null;
}
export interface LocalCompanyProfile {
  id: string; // "default"
  company_name: string;
  address_line1: string;
  address_line2: string;
  city_pincode: string;
  mobile: string;
  contact: string;
  gstin: string;
  state_name: string;
  state_code: string;
  bank_name: string;
  account_number: string;
  branch_ifsc: string;
  upi_id: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_pass?: string;
  from_email?: string;
  resend_api_key?: string;
  updated_at: string;
}
export interface LocalInvoice {
  id: string;
  invoice_no: string;
  shop_id: string;
  shop_name: string;
  delivery_id?: string | null;
  payment_id?: string | null;
  dated: string;
  delivery_note?: string;
  mode_of_payment: string;
  subtotal: number;
  cgst_amount: number;
  sgst_amount: number;
  round_off: number;
  total_amount: number;
  amount_in_words: string;
  tax_amount_in_words: string;
  items_json: string;
  pdf_data_url?: string;
  recipient_email?: string | null;
  recipient_whatsapp?: string | null;
  sent_via_email?: boolean;
  sent_via_whatsapp?: boolean;
  created_at: string;
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
  company_profiles!: EntityTable<LocalCompanyProfile, "id">;
  invoices!: EntityTable<LocalInvoice, "id">;
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

    // Version 4: Tax invoices, supplier company profile, and shop GST/email/WhatsApp fields
    this.version(4).stores({
      shops: "id, owner_id, organisation_id, region_id, is_urgent, is_archived, sort_order, reminder_date, email, whatsapp_number, gstin",
      company_profiles: "id",
      invoices: "id, invoice_no, shop_id, delivery_id, payment_id, dated, created_at",
    });
  }
}

export const db = new WaymarkDatabase();
