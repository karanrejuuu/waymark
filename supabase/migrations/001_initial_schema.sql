-- 001_initial_schema.sql: Initial database schema for Waymark

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'delivery' CHECK (role IN ('owner', 'delivery')),
  name text NOT NULL DEFAULT '',
  push_subscription jsonb,
  created_at timestamptz DEFAULT now()
);

-- Godowns table (owner warehouse location + fuel settings)
CREATE TABLE IF NOT EXISTS godowns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lat float8 NOT NULL,
  lng float8 NOT NULL,
  vehicle_mileage_kmpl float8 DEFAULT 15.0,
  petrol_price_per_l float8 DEFAULT 100.0,
  created_at timestamptz DEFAULT now()
);

-- Regions / Routes
CREATE TABLE IF NOT EXISTS regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Shops (Dukaans)
CREATE TABLE IF NOT EXISTS shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  region_id uuid REFERENCES regions(id) ON DELETE SET NULL,
  name text NOT NULL,
  contact text,
  lat float8,
  lng float8,
  notes text,
  is_urgent boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Products catalog
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  default_interval int NOT NULL DEFAULT 7,
  created_at timestamptz DEFAULT now()
);

-- Shop-Product configurations and scheduling state
CREATE TABLE IF NOT EXISTS shop_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  default_qty int NOT NULL DEFAULT 1,
  interval_days int NOT NULL DEFAULT 7,
  remind_offset_days int NOT NULL DEFAULT 0 CHECK (remind_offset_days BETWEEN 0 AND 3),
  next_due_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(shop_id, product_id)
);

-- Deliveries log (immutable append-only)
CREATE TABLE IF NOT EXISTS deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid UNIQUE NOT NULL,
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  delivered_by uuid REFERENCES profiles(id),
  qty int NOT NULL,
  delivered_at timestamptz NOT NULL DEFAULT now(),
  stock_feedback text CHECK (stock_feedback IN ('low', 'fine', 'plenty') OR stock_feedback IS NULL),
  notes text,
  synced boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_shops_owner ON shops(owner_id);
CREATE INDEX IF NOT EXISTS idx_shops_region ON shops(region_id);
CREATE INDEX IF NOT EXISTS idx_shop_products_due ON shop_products(next_due_date);
CREATE INDEX IF NOT EXISTS idx_deliveries_shop ON deliveries(shop_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_client_id ON deliveries(client_id);
