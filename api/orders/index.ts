import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createOrder, listOrders } from '../_lib/orders.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    await createOrder(req, res);
  } else if (req.method === 'GET') {
    await listOrders(req, res);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
