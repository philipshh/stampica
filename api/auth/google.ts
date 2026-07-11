import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authGoogle } from '../_lib/handlers.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  await authGoogle(req, res);
}
