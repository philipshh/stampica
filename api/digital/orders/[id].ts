import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDigitalOrder } from '../../_lib/digital.js';
import { queryParam } from '../../_lib/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const id = queryParam(req, 'id');
  if (!id) return res.status(400).json({ error: 'id is required' });
  await getDigitalOrder(req, res, id);
}
