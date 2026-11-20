import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cleanupAbandoned } from '../_lib/digital.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await cleanupAbandoned(req, res);
}
