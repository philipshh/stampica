import { randomUUID } from 'node:crypto';
import { sql } from './db.js';
import { presignUpload, presignDownload, deleteObjects } from './storage.js';
import { requireUser } from './auth.js';
import { getDodo, dodoEnvironment, dodoProductId } from './dodo.js';
import { sendDownloadEmail } from './email.js';
import { DIGITAL_PRICE_CENTS } from '../../shared/pricing.js';
import type { ApiRequest, ApiResponse } from './types.js';

const MAX_ITEMS = 20;                     // Dodo carts hold at most 20 lines
// The browser resizes photos to 4000 px on the long edge before upload (a few MB);
// this is the hard ceiling the upload URL is locked to.
const MAX_SOURCE_BYTES = 12 * 1024 * 1024;
const MAX_PREVIEW_BYTES = 2 * 1024 * 1024;
const PENDING_RETENTION_DAYS = 7;         // unpaid checkouts: photos deleted after this

export interface DigitalItem {
  designData: Record<string, unknown>;
  sourcePath: string | null;              // null for text-only posters
  previewPath: string;
}

interface OrderRow {
  id: string;
  user_id: string;
  order_number: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  livemode: boolean;
  items: DigitalItem[];
  item_count: number;
  dodo_checkout_id: string | null;
  paid_at: string | null;
  created_at: string;
}

function orderNumber(): string {
  return `STD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function appOrigin(req: ApiRequest): string {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : '';
  return origin || process.env.APP_URL || 'http://localhost:5173';
}

const validSize = (n: unknown, max: number) => Number.isInteger(n) && (n as number) > 0 && (n as number) <= max;

// POST /api/digital/uploads  { files: [{ sourceSize: number | null, previewSize: number }] }
// Upload URLs are locked to the user's folder, JPEG, and the exact declared size.
export async function createUploadSlots(req: ApiRequest, res: ApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;
  try {
    const files = (req.body as { files?: { sourceSize: number | null; previewSize: number }[] })?.files;
    if (!Array.isArray(files) || files.length < 1 || files.length > MAX_ITEMS) {
      res.status(400).json({ error: `1-${MAX_ITEMS} designs required` });
      return;
    }
    if (files.some(f => !validSize(f.previewSize, MAX_PREVIEW_BYTES) || (f.sourceSize !== null && !validSize(f.sourceSize, MAX_SOURCE_BYTES)))) {
      res.status(413).json({ error: 'File too large' });
      return;
    }
    const slots = await Promise.all(files.map(async f => {
      const dir = `${user.userId}/${randomUUID()}`;
      const sourcePath = f.sourceSize === null ? null : `${dir}/source.jpg`;
      return {
        sourcePath,
        sourceUrl: sourcePath ? await presignUpload(sourcePath, 'image/jpeg', f.sourceSize!) : null,
        previewPath: `${dir}/preview.jpg`,
        previewUrl: await presignUpload(`${dir}/preview.jpg`, 'image/jpeg', f.previewSize),
      };
    }));
    res.status(200).json({ slots });
  } catch (err) {
    console.error('[digital/uploads]', err);
    res.status(500).json({ error: 'Could not prepare uploads' });
  }
}

// POST /api/digital/checkout  { items: DigitalItem[] }
// Creates a pending order and a Dodo checkout session; returns the hosted checkout URL.
export async function createDigitalCheckout(req: ApiRequest, res: ApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;
  try {
    const { items } = req.body as { items?: DigitalItem[] };
    if (!Array.isArray(items) || items.length < 1 || items.length > MAX_ITEMS) {
      res.status(400).json({ error: `1-${MAX_ITEMS} designs required` });
      return;
    }
    const own = (p: unknown) => typeof p === 'string' && p.startsWith(`${user.userId}/`) && !p.includes('..');
    if (items.some(i => !own(i.previewPath) || (i.sourcePath !== null && !own(i.sourcePath))
      || typeof i.designData !== 'object' || i.designData === null)) {
      res.status(400).json({ error: 'Invalid item' });
      return;
    }

    const number = orderNumber();
    const [order] = await sql()`
      INSERT INTO digital_orders (user_id, order_number, livemode, items, item_count, unit_price)
      VALUES (${user.userId}, ${number}, ${dodoEnvironment() === 'live_mode'},
              ${JSON.stringify(items)}::jsonb, ${items.length}, ${DIGITAL_PRICE_CENTS})
      RETURNING id` as { id: string }[];

    const session = await getDodo().checkoutSessions.create({
      // One line with a quantity: the fixed card fee is charged once per order.
      product_cart: [{ product_id: dodoProductId(), quantity: items.length }],
      customer: { email: user.email, name: user.name },
      return_url: `${appOrigin(req)}/downloads/${order.id}`,
      metadata: { order_id: order.id, order_number: number, app_url: appOrigin(req) },
    });

    await sql()`UPDATE digital_orders SET dodo_checkout_id = ${session.session_id}, updated_at = NOW() WHERE id = ${order.id}`;
    res.status(201).json({ orderId: order.id, checkoutUrl: session.checkout_url });
  } catch (err) {
    console.error('[digital/checkout]', err);
    res.status(500).json({ error: 'Could not start checkout' });
  }
}

/** Marks an order paid once (idempotent) and sends the download email on the first transition. */
async function markPaid(orderId: string, payment: { payment_id?: string | null; total_amount?: number | null; currency?: string | null; metadata?: Record<string, string | number | boolean> | null }) {
  const rows = await sql()`
    UPDATE digital_orders
       SET status = 'paid', dodo_payment_id = ${payment.payment_id ?? null},
           paid_amount = ${payment.total_amount ?? null}, paid_currency = ${payment.currency ?? null},
           paid_at = NOW(), updated_at = NOW()
     WHERE id = ${orderId} AND status <> 'paid'
     RETURNING order_number, item_count, user_id` as { order_number: string; item_count: number; user_id: string }[];
  if (rows.length === 0) return;   // already paid: email went out the first time
  const [u] = await sql()`SELECT email, name FROM users WHERE id = ${rows[0].user_id}` as { email: string; name: string }[];
  if (u) {
    sendDownloadEmail({
      customerEmail: u.email, customerName: u.name, orderNumber: rows[0].order_number,
      orderId, itemCount: rows[0].item_count,
      appUrl: typeof payment.metadata?.app_url === 'string' ? payment.metadata.app_url : undefined,
    }).catch(err => console.error('[digital/email]', orderId, err));
  }
}

// GET /api/digital/orders/:id
// Owner only. While pending, asks Dodo directly (covers a missed or delayed webhook).
// The photo and the design are only returned once the order is paid.
export async function getDigitalOrder(req: ApiRequest, res: ApiResponse, id: string) {
  const user = requireUser(req, res);
  if (!user) return;
  try {
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    const [order] = await sql()`SELECT * FROM digital_orders WHERE id = ${id} AND user_id = ${user.userId}` as OrderRow[];
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.status === 'pending' && order.dodo_checkout_id) {
      const session = await getDodo().checkoutSessions.retrieve(order.dodo_checkout_id);
      if (session.payment_status === 'succeeded' && session.payment_id) {
        const payment = await getDodo().payments.retrieve(session.payment_id);
        if (payment.status === 'succeeded' && payment.metadata?.order_id === order.id) {
          await markPaid(order.id, payment);
          order.status = 'paid';
        }
      } else if (session.payment_status === 'failed' || session.payment_status === 'cancelled') {
        order.status = 'failed';
      }
    }

    const paid = order.status === 'paid';
    const items = await Promise.all(order.items.map(async item => ({
      designData: paid ? item.designData : null,
      previewUrl: await presignDownload(item.previewPath),
      sourceUrl: paid && item.sourcePath ? await presignDownload(item.sourcePath) : null,
      textOnly: item.sourcePath === null,
    })));

    res.status(200).json({
      order: {
        id: order.id, orderNumber: order.order_number, status: order.status, livemode: order.livemode,
        itemCount: order.item_count, paidAt: order.paid_at, createdAt: order.created_at, items,
      },
    });
  } catch (err) {
    console.error('[digital/order]', err);
    res.status(500).json({ error: 'Could not load order' });
  }
}

// GET /api/digital/orders  (paid orders of the signed-in user, newest first)
export async function listDigitalOrders(req: ApiRequest, res: ApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;
  try {
    const rows = await sql()`
      SELECT id, order_number, item_count, paid_at, created_at, items
        FROM digital_orders
       WHERE user_id = ${user.userId} AND status = 'paid'
       ORDER BY paid_at DESC
       LIMIT 100` as Pick<OrderRow, 'id' | 'order_number' | 'item_count' | 'paid_at' | 'created_at' | 'items'>[];
    const orders = await Promise.all(rows.map(async o => ({
      id: o.id, orderNumber: o.order_number, itemCount: o.item_count, paidAt: o.paid_at,
      previewUrls: await Promise.all(o.items.slice(0, 4).map(i => presignDownload(i.previewPath))),
    })));
    res.status(200).json({ orders });
  } catch (err) {
    console.error('[digital/list]', err);
    res.status(500).json({ error: 'Could not load orders' });
  }
}

// POST /api/webhooks/dodo  (raw body; signature checked against DODO_PAYMENTS_WEBHOOK_KEY)
export async function dodoWebhook(rawBody: string, headers: Record<string, string>, res: ApiResponse) {
  let event;
  try {
    event = getDodo().webhooks.unwrap(rawBody, { headers });
  } catch (err) {
    console.error('[webhooks/dodo] bad signature', err);
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }
  try {
    if (event.type === 'payment.succeeded' || event.type === 'payment.failed') {
      const payment = event.data;
      const orderId = payment.metadata?.order_id;
      if (typeof orderId === 'string') {
        if (event.type === 'payment.succeeded') await markPaid(orderId, payment);
        else await sql()`UPDATE digital_orders SET status = 'failed', updated_at = NOW() WHERE id = ${orderId} AND status = 'pending'`;
      }
    }
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('[webhooks/dodo]', event.type, err);
    res.status(500).json({ error: 'Webhook handling failed' });
  }
}

// GET /api/cron/cleanup  (Vercel Cron, daily)
// Unpaid checkouts older than 7 days: delete their photos and the order row.
export async function cleanupAbandoned(req: ApiRequest, res: ApiResponse) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const rows = await sql()`
      SELECT id, items FROM digital_orders
       WHERE status IN ('pending', 'failed')
         AND created_at < NOW() - make_interval(days => ${PENDING_RETENTION_DAYS})
       LIMIT 500` as Pick<OrderRow, 'id' | 'items'>[];
    const keys = rows.flatMap(r => r.items.flatMap(i => [i.previewPath, i.sourcePath].filter((k): k is string => !!k)));
    await deleteObjects(keys);
    if (rows.length) await sql()`DELETE FROM digital_orders WHERE id = ANY(${rows.map(r => r.id)})`;
    res.status(200).json({ deletedOrders: rows.length, deletedFiles: keys.length });
  } catch (err) {
    console.error('[cron/cleanup]', err);
    res.status(500).json({ error: 'Cleanup failed' });
  }
}
