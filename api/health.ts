import type { VercelRequest, VercelResponse } from '@vercel/node';
import { health } from './_lib/handlers.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  health(req, res);
}
