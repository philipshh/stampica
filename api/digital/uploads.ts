import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createUploadSlots } from '../_lib/digital.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  await createUploadSlots(req, res);
}
