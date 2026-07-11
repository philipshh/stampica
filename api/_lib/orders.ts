import { getSupabase } from './supabase.js';
import { requireUser } from './auth.js';
import { orderTotals } from '../../shared/pricing.js';
import {
  sendOrderConfirmationToCustomer,
  sendNewOrderNotificationToPrintShop,
} from './email.js';
import type { ApiRequest, ApiResponse } from './types.js';

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `STP-${timestamp}-${random}`;
}

export interface OrderItem {
  size: string;
  quantity: number;
  frame: string;
  previewUrl?: string | null;
  posterUrl?: string | null;
  designData?: Record<string, unknown>;
}

const VALID_SIZES = ['A5', 'A4', 'A3'];
const VALID_FRAMES = ['none', 'black', 'white'];

// POST /api/orders – create a new order
export async function createOrder(req: ApiRequest, res: ApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;
  try {
    const { items, shippingAddress, phone } = req.body as {
      items: OrderItem[];
      shippingAddress: string;
      phone: string;
    };

    if (!Array.isArray(items) || items.length === 0 || !shippingAddress || !phone) {
      res.status(400).json({ error: 'items, shippingAddress, and phone are required' });
      return;
    }
    const invalid = items.find(
      (i) =>
        !VALID_SIZES.includes(i.size) ||
        !VALID_FRAMES.includes(i.frame ?? 'none') ||
        !Number.isInteger(i.quantity) ||
        i.quantity < 1 ||
        i.quantity > 20,
    );
    if (invalid) {
      res.status(400).json({ error: 'Invalid item size, frame, or quantity' });
      return;
    }

    const supabase = getSupabase();
    const orderNumber = generateOrderNumber();
    // Totals are computed server-side from the shared price list; the client
    // never sends prices.
    const { subtotal, shipping, total } = orderTotals(items);

    // Use first item for legacy columns (backwards compat with admin dashboard)
    const first = items[0];

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: user.userId,
        order_number: orderNumber,
        design_data: first.designData ?? {},
        size: first.size,
        quantity: first.quantity,
        status: 'pending',
        shipping_address: shippingAddress,
        phone,
        preview_url: first.previewUrl ?? null,
        poster_url: first.posterUrl ?? null,
        items,
        subtotal_amount: subtotal,
        shipping_amount: shipping,
        total_amount: total,
      })
      .select()
      .single();

    if (error) throw error;

    // Fire-and-forget emails (don't block the response)
    const emailData = {
      orderNumber,
      customerEmail: user.email,
      customerName: user.name,
      items,
      shippingAddress,
      phone,
    };

    sendOrderConfirmationToCustomer(emailData).catch((err) =>
      console.error('[orders/email/customer]', orderNumber, err),
    );
    sendNewOrderNotificationToPrintShop(emailData).catch((err) =>
      console.error('[orders/email/printshop]', orderNumber, err),
    );

    res.status(201).json({ order });
  } catch (err) {
    console.error('[orders/create]', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
}

// GET /api/orders – list orders for the current user
export async function listOrders(req: ApiRequest, res: ApiResponse) {
  const user = requireUser(req, res);
  if (!user) return;
  try {
    const { data: orders, error } = await getSupabase()
      .from('orders')
      .select('*')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json({ orders });
  } catch (err) {
    console.error('[orders/list]', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
}

// PATCH /api/orders/:id/cancel – cancel a pending order (owner only)
export async function cancelOrder(req: ApiRequest, res: ApiResponse, id: string) {
  const user = requireUser(req, res);
  if (!user) return;
  try {
    const supabase = getSupabase();

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, status, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    if (order.user_id !== user.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    if (order.status !== 'pending') {
      res.status(409).json({ error: 'Only pending orders can be cancelled' });
      return;
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (updateError) throw updateError;
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[orders/cancel]', err);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
}

// GET /api/orders/:orderNumber – get a single order by order number
export async function getOrderByNumber(req: ApiRequest, res: ApiResponse, orderNumber: string) {
  const user = requireUser(req, res);
  if (!user) return;
  try {
    const { data: order, error } = await getSupabase()
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .eq('user_id', user.userId)
      .single();

    if (error || !order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.status(200).json({ order });
  } catch (err) {
    console.error('[orders/get]', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
}
