-- ============================================================
-- Stampica Order Management Schema
-- Run this in the Supabase SQL editor
-- ============================================================

-- Users table (synced from Google OAuth)
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  google_id   TEXT NOT NULL UNIQUE,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_number     TEXT NOT NULL UNIQUE,
  design_data      JSONB NOT NULL DEFAULT '{}',
  size             TEXT NOT NULL,
  quantity         INTEGER NOT NULL CHECK (quantity > 0),
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','confirmed','printing','shipped','delivered','cancelled')),
  shipping_address TEXT NOT NULL,
  phone            TEXT NOT NULL,
  tracking_number  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS orders_user_id_idx    ON orders(user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx     ON orders(status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE users  ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can read their own row
CREATE POLICY "users: read own"
  ON users FOR SELECT
  USING (auth.uid()::text = id::text);

-- Orders: customers can read/insert their own orders
CREATE POLICY "orders: read own"
  ON orders FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE google_id = auth.uid()::text));

CREATE POLICY "orders: insert own"
  ON orders FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM users WHERE google_id = auth.uid()::text));

-- Service role (backend) bypasses RLS automatically, so admin routes work via service_role key
