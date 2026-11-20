import type { VercelRequest, VercelResponse } from '@vercel/node';
import { listDigitalOrders } from '../../_lib/digital.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  await listDigitalOrders(req, res);
}
