export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "owner" | "delivery";
export type StockFeedback = "low" | "fine" | "plenty" | null;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          name: string;
          push_subscription: Json | null;
          created_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          name?: string;
          push_subscription?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          name?: string;
          push_subscription?: Json | null;
          created_at?: string;
        };
      };
      godowns: {
        Row: {
          id: string;
          owner_id: string;
          lat: number;
          lng: number;
          vehicle_mileage_kmpl: number;
          petrol_price_per_l: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          lat: number;
          lng: number;
          vehicle_mileage_kmpl?: number;
          petrol_price_per_l?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
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
          name: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          sort_order?: number;
          created_at?: string;
        };
      };
      shops: {
        Row: {
          id: string;
          owner_id: string;
          region_id: string | null;
          name: string;
          contact: string | null;
          lat: number | null;
          lng: number | null;
          notes: string | null;
          is_urgent: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          region_id?: string | null;
          name: string;
          contact?: string | null;
          lat?: number | null;
          lng?: number | null;
          notes?: string | null;
          is_urgent?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          region_id?: string | null;
          name?: string;
          contact?: string | null;
          lat?: number | null;
          lng?: number | null;
          notes?: string | null;
          is_urgent?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          default_interval: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          default_interval?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          default_interval?: number;
          created_at?: string;
        };
      };
      shop_products: {
        Row: {
          id: string;
          shop_id: string;
          product_id: string;
          default_qty: number;
          interval_days: number;
          remind_offset_days: number;
          next_due_date: string; // YYYY-MM-DD
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          product_id: string;
          default_qty?: number;
          interval_days?: number;
          remind_offset_days?: number;
          next_due_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          product_id?: string;
          default_qty?: number;
          interval_days?: number;
          remind_offset_days?: number;
          next_due_date?: string;
          created_at?: string;
        };
      };
      deliveries: {
        Row: {
          id: string;
          client_id: string;
          shop_id: string;
          product_id: string;
          delivered_by: string | null;
          qty: number;
          delivered_at: string;
          stock_feedback: StockFeedback;
          notes: string | null;
          synced: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          shop_id: string;
          product_id: string;
          delivered_by?: string | null;
          qty: number;
          delivered_at?: string;
          stock_feedback?: StockFeedback;
          notes?: string | null;
          synced?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          shop_id?: string;
          product_id?: string;
          delivered_by?: string | null;
          qty?: number;
          delivered_at?: string;
          stock_feedback?: StockFeedback;
          notes?: string | null;
          synced?: boolean;
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
