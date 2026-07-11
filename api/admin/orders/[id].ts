import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminUpdateOrder, adminDeleteOrder } from '../../_lib/admin.js';
import { queryParam } from '../../_lib/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = queryParam(req, 'id');
  if (!id) {
    res.status(400).json({ error: 'id is required' });
    return;
  }
  if (req.method === 'PATCH') {
    await adminUpdateOrder(req, res, id);
  } else if (req.method === 'DELETE') {
    await adminDeleteOrder(req, res, id);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
