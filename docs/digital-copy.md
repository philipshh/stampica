# Digital Copy Delivery — Design

Status: **designed, not implemented**. Blocked on online payments for standalone
digital purchases; the free-with-physical-order variant can ship earlier.

## Goal

After a purchase, the customer can download the hi-res print file (and/or receive
it by email). Two product variants:

1. **Included with a physical order** — every ordered poster's hi-res file is
   downloadable from the order page. No extra payment needed. Can ship first.
2. **Standalone digital purchase** — buy only the digital file at a lower price.
   Requires an online payment provider (COD doesn't work for digital goods).

## Current state (what exists)

- Hi-res generation works: `exportPosterHiResBlob` in `src/lib/posterExport.ts`
  renders the poster at print resolution at checkout.
- Files are uploaded to the **public** Supabase Storage bucket `poster-orders`
  (`src/lib/supabase.ts` → `uploadPosterFile`) and the URL is stored on the
  order (`poster_url` / `items[].posterUrl`). Anyone with the URL can download —
  URLs are random (unguessable) but permanent and shareable.
- The "Download hi-res" button on the checkout success screen is disabled with
  a "Coming soon" badge (`src/pages/Checkout.tsx`).

## Design

### Storage: move hi-res files to a private bucket

- New private bucket `poster-files` (no anon policies). Preview images stay in
  the public bucket (they're low-res and used in emails).
- Uploads move server-side: the checkout POST sends the hi-res blob to a new
  `api/upload.ts` endpoint (auth required) which stores it with the service
  role key. This also closes the current "anon can upload/overwrite" gap in
  `poster-orders` (see `backend/migration_002.sql`).
  - Size guard: hi-res PNGs are 5–20 MB; either raise the function body limit
    or (better) have the API return a short-lived **signed upload URL**
    (`createSignedUploadUrl`) and let the client PUT directly to Storage.

### Data model (migration_004)

```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS digital_included BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS download_tokens (
  token       TEXT PRIMARY KEY,            -- 32+ random bytes, base64url
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_index  INTEGER NOT NULL DEFAULT 0,  -- which items[] entry
  expires_at  TIMESTAMPTZ NOT NULL,        -- e.g. NOW() + interval '30 days'
  max_uses    INTEGER NOT NULL DEFAULT 10,
  use_count   INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Delivery flow

1. Order is created (or, for variant 2, payment confirmed) → API generates one
   token per item and stores rows in `download_tokens`.
2. **Email**: order-confirmation email gains a "Download your poster" button per
   item → `https://<app>/api/download/<token>`.
3. **Profile**: `/orders` page shows a Download button per item when
   `digital_included` (move the disabled button from Checkout there).
4. `api/download/[token].ts`:
   - look up token; 404 if missing, 410 if expired or `use_count >= max_uses`;
   - increment `use_count`;
   - create a Supabase **signed URL** (60 s) for the file in `poster-files`
     and 302-redirect to it.

No auth needed on the download endpoint itself — the token is the credential —
which keeps email links working. Owner-authenticated re-issue: `/orders` can
request a fresh token via an authenticated endpoint if the old one expired.

### Pricing (variant 2, later)

- Add `digital` price entries in `shared/pricing.ts` (e.g. flat 300–500 din).
- Checkout gains a "digital only" toggle per item; server computes totals as it
  does today. Payment provider decision still open (local gateway vs
  merchant-of-record like Paddle/Lemon Squeezy).

### Non-goals / explicitly out of scope

- DRM or watermarking (files are the customer's own designs).
- Resolution upsell tiers.
