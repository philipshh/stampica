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

// GET /api/admin/orders – list all orders (admin only)
router.get('/orders', requireAdmin, async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { status } = req.query as { status?: OrderStatus };

    let query = supabase
      .from('orders')
      .select('*, users(name, email)')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: orders, error } = await query;
    if (error) throw error;

    res.json({ orders });
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

export default router;
