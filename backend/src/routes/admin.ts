import { Router, Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { extractBearerToken, verifyJWT } from '../services/auth.js';
import { sendShippingNotification } from '../services/email.js';

const router = Router();

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// Middleware: require admin role
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractBearerToken(req.headers.authorization);
    const user = verifyJWT(token);
    if (user.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    res.locals.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

type OrderStatus = 'pending' | 'confirmed' | 'printing' | 'shipped' | 'delivered' | 'cancelled';

const PAGE_SIZE = 25;

// GET /api/admin/orders – list all orders (admin only), paginated
router.get('/orders', requireAdmin, async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { status, search, page } = req.query as { status?: OrderStatus; search?: string; page?: string };
    const pageNum = Math.max(0, parseInt(page ?? '0', 10) || 0);
    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('orders')
      .select('*, users(name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status) query = query.eq('status', status);
    if (search) query = query.ilike('order_number', `%${search}%`);

    const { data: orders, error, count } = await query;
    if (error) throw error;

    res.json({ orders, total: count ?? 0, page: pageNum, pageSize: PAGE_SIZE });
  } catch (err) {
    console.error('[admin/orders/list]', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// PATCH /api/admin/orders/:id – update order status (and optionally tracking number)
router.patch('/orders/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, trackingNumber } = req.body as {
      status?: OrderStatus;
      trackingNumber?: string;
    };

    if (!status && !trackingNumber) {
      res.status(400).json({ error: 'status or trackingNumber is required' });
      return;
    }

    const supabase = getSupabase();

    const updatePayload: Record<string, unknown> = {};
    if (status) updatePayload.status = status;
    if (trackingNumber) updatePayload.tracking_number = trackingNumber;

    const { data: order, error } = await supabase
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
      ).catch(console.error);
    }

    res.json({ order });
  } catch (err) {
    console.error('[admin/orders/update]', err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// DELETE /api/admin/orders/:id – permanently delete an order
router.delete('/orders/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supabase = getSupabase();

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ ok: true });
  } catch (err) {
    console.error('[admin/orders/delete]', err);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

export default router;
