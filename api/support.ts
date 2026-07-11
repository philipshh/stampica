import type { VercelRequest, VercelResponse } from '@vercel/node';
import { support } from './_lib/handlers.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  await support(req, res);
}
