-- ============================================================
-- Migration 002 — fix Storage upload policy
-- The previous policy used TO authenticated which requires
-- Supabase Auth. We use our own JWT, so users are anon role.
-- This migration drops the old policy and allows anon uploads.
-- ============================================================

-- Drop the old policy that blocked uploads
DROP POLICY IF EXISTS "poster-orders: authenticated upload" ON storage.objects;

-- Allow anyone with the anon key to upload to this bucket
-- (files use random IDs so there's no guessability concern)
CREATE POLICY "poster-orders: anon upload"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'poster-orders');

-- Allow anon to update/overwrite (upsert support)
CREATE POLICY "poster-orders: anon update"
  ON storage.objects FOR UPDATE
  TO anon
  USING (bucket_id = 'poster-orders');
