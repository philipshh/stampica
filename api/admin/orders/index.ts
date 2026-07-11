import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminListOrders } from '../../_lib/admin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  await adminListOrders(req, res);
}
