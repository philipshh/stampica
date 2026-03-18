-- ============================================================
-- Migration 001 — poster files + admin user
-- Run this in the Supabase SQL editor
-- ============================================================

-- 1. Add poster file columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS preview_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS poster_url  TEXT;

-- 2. Create Supabase Storage bucket for poster files (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('poster-orders', 'poster-orders', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage policy: authenticated users can upload to this bucket
CREATE POLICY "poster-orders: authenticated upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'poster-orders');

CREATE POLICY "poster-orders: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'poster-orders');

-- 4. Make fsosevic@gmail.com an admin
--    (run AFTER they have logged in at least once)
UPDATE users SET role = 'admin' WHERE email = 'fsosevic@gmail.com';
