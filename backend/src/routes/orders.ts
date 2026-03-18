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
      shippingAddress,
      phone,
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
