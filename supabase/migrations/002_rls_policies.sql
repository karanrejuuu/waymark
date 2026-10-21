-- 002_rls_policies.sql: Row Level Security for Waymark

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE godowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_auth_role()
RETURNS text AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- GODOWNS
CREATE POLICY "Owners can manage godowns"
  ON godowns FOR ALL
  USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can view godowns"
  ON godowns FOR SELECT
  TO authenticated
  USING (true);

-- REGIONS
CREATE POLICY "Owners can manage regions"
  ON regions FOR ALL
  USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can view regions"
  ON regions FOR SELECT
  TO authenticated
  USING (true);

-- SHOPS
CREATE POLICY "Owners can manage shops"
  ON shops FOR ALL
  USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can view shops"
  ON shops FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Delivery staff can update shop urgent status"
  ON shops FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- PRODUCTS
CREATE POLICY "Owners can manage products"
  ON products FOR ALL
  USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

-- SHOP_PRODUCTS
CREATE POLICY "Owners can manage shop products"
  ON shop_products FOR ALL
  USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = shop_products.shop_id AND shops.owner_id = auth.uid()));

CREATE POLICY "Authenticated users can view shop products"
  ON shop_products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update scheduling on delivery"
  ON shop_products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELIVERIES (Append-only)
CREATE POLICY "Authenticated users can view deliveries"
  ON deliveries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert deliveries"
  ON deliveries FOR INSERT
  TO authenticated
  WITH CHECK (delivered_by = auth.uid() OR delivered_by IS NULL);
