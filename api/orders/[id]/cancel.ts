import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cancelOrder } from '../../_lib/orders.js';
import { queryParam } from '../../_lib/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PATCH') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const id = queryParam(req, 'id');
  if (!id) {
    res.status(400).json({ error: 'id is required' });
    return;
  }
  await cancelOrder(req, res, id);
}
