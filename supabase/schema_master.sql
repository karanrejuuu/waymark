-- ========================================================================
-- WAYMARK FMCG - COMPLETE MASTER SCHEMA MIGRATION
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ========================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'delivery' CHECK (role IN ('owner', 'delivery')),
  name text NOT NULL DEFAULT '',
  push_subscription jsonb,
  created_at timestamptz DEFAULT now()
);

-- 2. Organisations Table
CREATE TABLE IF NOT EXISTS organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  created_at timestamptz DEFAULT now()
);

-- 3. Organisation Members (Multi-Tenant Access Control)
CREATE TABLE IF NOT EXISTS organisation_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'staff', 'delivery')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(organisation_id, user_id)
);

-- 4. Godowns Table (Warehouse + Fuel Settings)
CREATE TABLE IF NOT EXISTS godowns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid REFERENCES organisations(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lat float8 NOT NULL,
  lng float8 NOT NULL,
  vehicle_mileage_kmpl float8 DEFAULT 18.0,
  petrol_price_per_l float8 DEFAULT 104.5,
  created_at timestamptz DEFAULT now()
);

-- 5. Regions / Routes Table
CREATE TABLE IF NOT EXISTS regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid REFERENCES organisations(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 6. Shops (Dukaans) Table
CREATE TABLE IF NOT EXISTS shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid REFERENCES organisations(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  region_id uuid REFERENCES regions(id) ON DELETE SET NULL,
  name text NOT NULL,
  contact text,
  lat float8,
  lng float8,
  notes text,
  is_urgent boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  balance_due numeric(12,2) NOT NULL DEFAULT 0.00,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. Products Catalog
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid REFERENCES organisations(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  default_interval int NOT NULL DEFAULT 7,
  created_at timestamptz DEFAULT now()
);

-- 8. Shop-Product Scheduling & Intervals
CREATE TABLE IF NOT EXISTS shop_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid REFERENCES organisations(id) ON DELETE CASCADE,
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  default_qty int NOT NULL DEFAULT 1,
  interval_days int NOT NULL DEFAULT 7,
  remind_offset_days int NOT NULL DEFAULT 0 CHECK (remind_offset_days BETWEEN 0 AND 3),
  next_due_date date NOT NULL DEFAULT CURRENT_DATE,
  snooze_until date,
  created_at timestamptz DEFAULT now(),
  UNIQUE(shop_id, product_id)
);

-- 9. Deliveries Log (Immutable Append-Only)
CREATE TABLE IF NOT EXISTS deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid UNIQUE NOT NULL,
  organisation_id uuid REFERENCES organisations(id) ON DELETE CASCADE,
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  delivered_by uuid REFERENCES profiles(id),
  qty int NOT NULL,
  delivered_at timestamptz NOT NULL DEFAULT now(),
  stock_feedback text CHECK (stock_feedback IN ('low', 'fine', 'plenty') OR stock_feedback IS NULL),
  notes text,
  skip_reason text,
  synced boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 10. Payments Ledger (Dues Tracking)
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid UNIQUE NOT NULL,
  organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  collected_by uuid REFERENCES profiles(id),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  payment_mode text NOT NULL DEFAULT 'cash' CHECK (payment_mode IN ('cash', 'upi', 'cheque', 'credit')),
  notes text,
  collected_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- 11. Performance Composite Indexes
CREATE INDEX IF NOT EXISTS idx_shop_products_org_due ON shop_products(organisation_id, next_due_date);
CREATE INDEX IF NOT EXISTS idx_shops_org_archived ON shops(organisation_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_deliveries_org_shop ON deliveries(organisation_id, shop_id);
CREATE INDEX IF NOT EXISTS idx_payments_org_shop ON payments(organisation_id, shop_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organisation_members(user_id, organisation_id);
CREATE INDEX IF NOT EXISTS idx_shops_region ON shops(region_id);

-- 12. Multi-Tenant Isolation Function (Hardened search_path)
CREATE OR REPLACE FUNCTION has_org_access(target_org_id uuid)
RETURNS boolean
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organisation_members
    WHERE organisation_id = target_org_id
      AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 13. Enable Row Level Security (RLS) on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE godowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 14. Multi-Tenant RLS Policies
CREATE POLICY "Users can view organisations they belong to"
  ON organisations FOR SELECT TO authenticated
  USING (has_org_access(id));

CREATE POLICY "Users can view memberships for their organisations"
  ON organisation_members FOR SELECT TO authenticated
  USING (has_org_access(organisation_id));

CREATE POLICY "Godowns isolation"
  ON godowns FOR ALL TO authenticated
  USING (has_org_access(organisation_id))
  WITH CHECK (has_org_access(organisation_id));

CREATE POLICY "Regions isolation"
  ON regions FOR ALL TO authenticated
  USING (has_org_access(organisation_id))
  WITH CHECK (has_org_access(organisation_id));

CREATE POLICY "Shops isolation"
  ON shops FOR ALL TO authenticated
  USING (has_org_access(organisation_id))
  WITH CHECK (has_org_access(organisation_id));

CREATE POLICY "Products isolation"
  ON products FOR ALL TO authenticated
  USING (has_org_access(organisation_id))
  WITH CHECK (has_org_access(organisation_id));

CREATE POLICY "Shop products isolation"
  ON shop_products FOR ALL TO authenticated
  USING (has_org_access(organisation_id))
  WITH CHECK (has_org_access(organisation_id));

CREATE POLICY "Deliveries isolation"
  ON deliveries FOR ALL TO authenticated
  USING (has_org_access(organisation_id))
  WITH CHECK (has_org_access(organisation_id));

CREATE POLICY "Payments isolation"
  ON payments FOR ALL TO authenticated
  USING (has_org_access(organisation_id))
  WITH CHECK (has_org_access(organisation_id));
