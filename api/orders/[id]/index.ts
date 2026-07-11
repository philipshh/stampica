import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getOrderByNumber } from '../../_lib/orders.js';
import { queryParam } from '../../_lib/types.js';

// GET /api/orders/:orderNumber — the dynamic segment is named `id` so it can
// share the directory with cancel.ts, but the value is an order number.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const orderNumber = queryParam(req, 'id');
  if (!orderNumber) {
    res.status(400).json({ error: 'order number is required' });
    return;
  }
  await getOrderByNumber(req, res, orderNumber);
}
