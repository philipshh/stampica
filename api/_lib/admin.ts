import { getSupabase } from './supabase.js';
import { requireAdmin } from './auth.js';
import { sendShippingNotification } from './email.js';
import type { ApiRequest, ApiResponse } from './types.js';
import { queryParam } from './types.js';

type OrderStatus = 'pending' | 'confirmed' | 'printing' | 'shipped' | 'delivered' | 'cancelled';

const PAGE_SIZE = 25;

// GET /api/admin/orders – list all orders (admin only), paginated
export async function adminListOrders(req: ApiRequest, res: ApiResponse) {
  if (!requireAdmin(req, res)) return;
  try {
    const status = queryParam(req, 'status') as OrderStatus | undefined;
    const search = queryParam(req, 'search');
    const page = queryParam(req, 'page');
    const pageNum = Math.max(0, parseInt(page ?? '0', 10) || 0);
    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = getSupabase()
      .from('orders')
      .select('*, users(name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status) query = query.eq('status', status);
    if (search) query = query.ilike('order_number', `%${search}%`);

    const { data: orders, error, count } = await query;
    if (error) throw error;

    res.status(200).json({ orders, total: count ?? 0, page: pageNum, pageSize: PAGE_SIZE });
  } catch (err) {
    console.error('[admin/orders/list]', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
}

// PATCH /api/admin/orders/:id – update order status (and optionally tracking number)
export async function adminUpdateOrder(req: ApiRequest, res: ApiResponse, id: string) {
  if (!requireAdmin(req, res)) return;
  try {
    const { status, trackingNumber } = req.body as {
      status?: OrderStatus;
      trackingNumber?: string;
    };

    if (!status && !trackingNumber) {
      res.status(400).json({ error: 'status or trackingNumber is required' });
      return;
    }

    const updatePayload: Record<string, unknown> = {};
    if (status) updatePayload.status = status;
    if (trackingNumber) updatePayload.tracking_number = trackingNumber;

    const { data: order, error } = await getSupabase()
      .from('orders')
      .update(updatePayload)
      .eq('id', id)
      .select('*, users(name, email)')
      .single();

    if (error || !order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Send shipping email if we're marking as shipped and have a tracking number
    if (status === 'shipped' && (trackingNumber || order.tracking_number)) {
      const tracking = trackingNumber ?? order.tracking_number;
      sendShippingNotification(
        order.users.email,
        order.users.name,
        order.order_number,
        tracking,
      ).catch((err) => console.error('[admin/email/shipping]', order.order_number, err));
    }

    res.status(200).json({ order });
  } catch (err) {
    console.error('[admin/orders/update]', err);
    res.status(500).json({ error: 'Failed to update order' });
  }
}

// DELETE /api/admin/orders/:id – permanently delete an order
export async function adminDeleteOrder(req: ApiRequest, res: ApiResponse, id: string) {
  if (!requireAdmin(req, res)) return;
  try {
    const { error } = await getSupabase().from('orders').delete().eq('id', id);
    if (error) throw error;
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[admin/orders/delete]', err);
    res.status(500).json({ error: 'Failed to delete order' });
  }
}
