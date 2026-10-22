export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "owner" | "staff" | "delivery";
export type StockFeedback = "low" | "fine" | "plenty" | null;
export type PaymentMode = "cash" | "upi" | "cheque" | "credit";

export interface Database {
  public: {
    Tables: {
      organisations: {
        Row: {
          id: string;
          name: string;
          currency: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          currency?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          currency?: string;
          created_at?: string;
        };
      };
      organisation_members: {
        Row: {
          id: string;
          organisation_id: string;
          user_id: string;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          user_id: string;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          user_id?: string;
          role?: UserRole;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          name: string;
          phone: string | null;
          email: string | null;
          push_subscription: Json | null;
          created_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          name?: string;
          phone?: string | null;
          email?: string | null;
          push_subscription?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          name?: string;
          phone?: string | null;
          email?: string | null;
          push_subscription?: Json | null;
          created_at?: string;
        };
      };
      godowns: {
        Row: {
          id: string;
          owner_id: string;
          organisation_id: string;
          lat: number;
          lng: number;
          vehicle_mileage_kmpl: number;
          petrol_price_per_l: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          organisation_id?: string;
          lat: number;
          lng: number;
          vehicle_mileage_kmpl?: number;
          petrol_price_per_l?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          organisation_id?: string;
          lat?: number;
          lng?: number;
          vehicle_mileage_kmpl?: number;
          petrol_price_per_l?: number;
          created_at?: string;
        };
      };
      regions: {
        Row: {
          id: string;
          owner_id: string;
          organisation_id: string;
          name: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          organisation_id?: string;
          name: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          organisation_id?: string;
          name?: string;
          sort_order?: number;
          created_at?: string;
        };
      };
      shops: {
        Row: {
          id: string;
          owner_id: string;
          organisation_id: string;
          region_id: string | null;
          name: string;
          contact: string | null;
          lat: number | null;
          lng: number | null;
          notes: string | null;
          is_urgent: boolean;
          is_archived: boolean;
          balance_due: number;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          organisation_id?: string;
          region_id?: string | null;
          name: string;
          contact?: string | null;
          lat?: number | null;
          lng?: number | null;
          notes?: string | null;
          is_urgent?: boolean;
          is_archived?: boolean;
          balance_due?: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          organisation_id?: string;
          region_id?: string | null;
          name?: string;
          contact?: string | null;
          lat?: number | null;
          lng?: number | null;
          notes?: string | null;
          is_urgent?: boolean;
          is_archived?: boolean;
          balance_due?: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          owner_id: string;
          organisation_id: string;
          name: string;
          default_interval: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          organisation_id?: string;
          name: string;
          default_interval?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          organisation_id?: string;
          name?: string;
          default_interval?: number;
          created_at?: string;
        };
      };
      shop_products: {
        Row: {
          id: string;
          organisation_id: string;
          shop_id: string;
          product_id: string;
          default_qty: number;
          interval_days: number;
          remind_offset_days: number;
          next_due_date: string;
          snooze_until: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organisation_id?: string;
          shop_id: string;
          product_id: string;
          default_qty?: number;
          interval_days?: number;
          remind_offset_days?: number;
          next_due_date?: string;
          snooze_until?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organisation_id?: string;
          shop_id?: string;
          product_id?: string;
          default_qty?: number;
          interval_days?: number;
          remind_offset_days?: number;
          next_due_date?: string;
          snooze_until?: string | null;
          created_at?: string;
        };
      };
      deliveries: {
        Row: {
          id: string;
          client_id: string;
          organisation_id: string;
          shop_id: string;
          product_id: string;
          delivered_by: string | null;
          qty: number;
          delivered_at: string;
          stock_feedback: StockFeedback;
          notes: string | null;
          skip_reason: string | null;
          synced: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          organisation_id?: string;
          shop_id: string;
          product_id: string;
          delivered_by?: string | null;
          qty: number;
          delivered_at?: string;
          stock_feedback?: StockFeedback;
          notes?: string | null;
          skip_reason?: string | null;
          synced?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          organisation_id?: string;
          shop_id?: string;
          product_id?: string;
          delivered_by?: string | null;
          qty?: number;
          delivered_at?: string;
          stock_feedback?: StockFeedback;
          notes?: string | null;
          skip_reason?: string | null;
          synced?: boolean;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          client_id: string;
          organisation_id: string;
          shop_id: string;
          collected_by: string | null;
          amount: number;
          payment_mode: PaymentMode;
          notes: string | null;
          collected_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          organisation_id?: string;
          shop_id: string;
          collected_by?: string | null;
          amount: number;
          payment_mode?: PaymentMode;
          notes?: string | null;
          collected_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          organisation_id?: string;
          shop_id?: string;
          collected_by?: string | null;
          amount?: number;
          payment_mode?: PaymentMode;
          notes?: string | null;
          collected_at?: string;
          created_at?: string;
        };
      };
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
