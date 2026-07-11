import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getOrderByNumber } from '../_lib/orders.js';
import { queryParam } from '../_lib/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const orderNumber = queryParam(req, 'orderNumber');
  if (!orderNumber) {
    res.status(400).json({ error: 'orderNumber is required' });
    return;
  }
  await getOrderByNumber(req, res, orderNumber);
}
