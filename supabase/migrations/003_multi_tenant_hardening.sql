-- 003_multi_tenant_hardening.sql
-- Production Multi-Tenant Schema with Organization Membership RLS,
-- Composite Indexes, Payments Ledger, Archive Flag, and Snooze Support.

-- 1. Organisations Table
CREATE TABLE IF NOT EXISTS organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  created_at timestamptz DEFAULT now()
);

-- 2. Organisation Members (Multi-Tenant Membership)
CREATE TABLE IF NOT EXISTS organisation_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'staff', 'delivery')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(organisation_id, user_id)
);

-- 3. Enhance existing tables with organisation_id, archive, dues, snooze
ALTER TABLE godowns ADD COLUMN IF NOT EXISTS organisation_id uuid REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS organisation_id uuid REFERENCES organisations(id) ON DELETE CASCADE;

ALTER TABLE shops ADD COLUMN IF NOT EXISTS organisation_id uuid REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS balance_due numeric(12,2) NOT NULL DEFAULT 0.00;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

ALTER TABLE products ADD COLUMN IF NOT EXISTS organisation_id uuid REFERENCES organisations(id) ON DELETE CASCADE;

ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS organisation_id uuid REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS snooze_until date;

ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS organisation_id uuid REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS skip_reason text;

-- 4. Payments Ledger Table (Dues Collection)
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

-- 5. Performance Composite Indexes
CREATE INDEX IF NOT EXISTS idx_shop_products_org_due ON shop_products(organisation_id, next_due_date);
CREATE INDEX IF NOT EXISTS idx_shops_org_archived ON shops(organisation_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_deliveries_org_shop ON deliveries(organisation_id, shop_id);
CREATE INDEX IF NOT EXISTS idx_payments_org_shop ON payments(organisation_id, shop_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organisation_members(user_id, organisation_id);

-- 6. Helper Security Function for Multi-Tenant Isolation
CREATE OR REPLACE FUNCTION has_org_access(target_org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organisation_members
    WHERE organisation_id = target_org_id
      AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 7. Enable RLS on newly created tables
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 8. Hardened Multi-Tenant RLS Policies
CREATE POLICY "Users can view organisations they belong to"
  ON organisations FOR SELECT
  TO authenticated
  USING (has_org_access(id));

CREATE POLICY "Users can view memberships for their organisations"
  ON organisation_members FOR SELECT
  TO authenticated
  USING (has_org_access(organisation_id));

CREATE POLICY "Payments viewable only within user organisation"
  ON payments FOR SELECT
  TO authenticated
  USING (has_org_access(organisation_id));

CREATE POLICY "Payments insertable only within user organisation"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (has_org_access(organisation_id));
