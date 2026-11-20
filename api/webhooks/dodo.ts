import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dodoWebhook } from '../_lib/digital.js';

// Signature verification needs the exact bytes Dodo sent, so the body is not parsed.
export const config = { api: { bodyParser: false } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  const headers = Object.fromEntries(
    Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v.join(',') : String(v ?? '')]),
  );
  await dodoWebhook(Buffer.concat(chunks).toString('utf8'), headers, res);
}
