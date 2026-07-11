-- Migration 003: server-computed order totals (RSD)
-- Run in the Supabase SQL editor.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS items JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal_amount INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_amount INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount INTEGER;
