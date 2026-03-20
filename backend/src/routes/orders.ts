import { Router, Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { extractBearerToken, verifyJWT } from '../services/auth.js';
import {
  sendOrderConfirmationToCustomer,
  sendNewOrderNotificationToPrintShop,
} from '../services/email.js';

const router = Router();

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// Middleware: require a valid JWT
function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractBearerToken(req.headers.authorization);
    res.locals.user = verifyJWT(token);
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `STP-${timestamp}-${random}`;
}

// POST /api/orders – create a new order
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { user } = res.locals;
    const { size, quantity, shippingAddress, phone, designData, previewUrl, posterUrl } = req.body as {
      size: string;
      quantity: number;
      shippingAddress: string;
      phone: string;
      designData: Record<string, unknown>;
      previewUrl?: string;
      posterUrl?: string;
    };

    if (!size || !quantity || !shippingAddress || !phone) {
      res.status(400).json({ error: 'size, quantity, shippingAddress, and phone are required' });
      return;
    }

    const supabase = getSupabase();
    const orderNumber = generateOrderNumber();

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: user.userId,
        order_number: orderNumber,
        design_data: designData ?? {},
        size,
        quantity,
        status: 'pending',
        shipping_address: shippingAddress,
        phone,
        preview_url: previewUrl ?? null,
        poster_url: posterUrl ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    // Fire-and-forget emails (don't block the response)
    const emailData = {
      orderNumber,
      customerEmail: user.email,
      customerName: user.name,
      size,
      quantity,
      frame: (designData?.frame as string | undefined) ?? null,
      shippingAddress,
      phone,
      previewUrl: previewUrl ?? null,
      posterUrl: posterUrl ?? null,
    };

    sendOrderConfirmationToCustomer(emailData).catch(console.error);
    sendNewOrderNotificationToPrintShop(emailData).catch(console.error);

    res.status(201).json({ order });
  } catch (err) {
    console.error('[orders/create]', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// GET /api/orders – list orders for the current user
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { user } = res.locals;
    const supabase = getSupabase();

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ orders });
  } catch (err) {
    console.error('[orders/list]', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// PATCH /api/orders/:id/cancel – cancel a pending order (owner only)
router.patch('/:id/cancel', requireAuth, async (req: Request, res: Response) => {
  try {
    const { user } = res.locals;
    const { id } = req.params;
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

    res.json({ ok: true });
  } catch (err) {
    console.error('[orders/cancel]', err);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// GET /api/orders/:orderNumber – get a single order by order number
router.get('/:orderNumber', requireAuth, async (req: Request, res: Response) => {
  try {
    const { user } = res.locals;
    const { orderNumber } = req.params;
    const supabase = getSupabase();

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .eq('user_id', user.userId)
      .single();

    if (error || !order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({ order });
  } catch (err) {
    console.error('[orders/get]', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

export default router;
