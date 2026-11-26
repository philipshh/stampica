import { sql } from './db.js';
import { verifyGoogleToken, signJWT } from './auth.js';
import { sendSupportEmail } from './email.js';
import { dodoEnvironment } from './dodo.js';
import type { ApiRequest, ApiResponse } from './types.js';

// POST /api/auth/google
// Accepts a Google ID token, upserts the user in Neon, returns a JWT
export async function authGoogle(req: ApiRequest, res: ApiResponse) {
  try {
    const { idToken } = req.body as { idToken?: string };
    if (!idToken) {
      res.status(400).json({ error: 'idToken is required' });
      return;
    }

    const googleUser = await verifyGoogleToken(idToken);

    const [user] = await sql()`
      INSERT INTO users (google_id, email, name, avatar_url)
      VALUES (${googleUser.sub}, ${googleUser.email}, ${googleUser.name}, ${googleUser.picture})
      ON CONFLICT (google_id) DO UPDATE
        SET email = EXCLUDED.email, name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url
      RETURNING id, email, name, role` as { id: string; email: string; name: string; role: 'customer' | 'admin' }[];

    const token = signJWT({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role ?? 'customer',
    });

    res.status(200).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error('[auth/google]', err);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

// POST /api/support – submit a contact/support request
export async function support(req: ApiRequest, res: ApiResponse) {
  try {
    const { name, email, orderNumber, subject, message } = req.body as {
      name: string;
      email: string;
      orderNumber?: string;
      subject: string;
      message: string;
    };

    if (!name || !email || !subject || !message) {
      res.status(400).json({ error: 'name, email, subject, and message are required' });
      return;
    }

    await sendSupportEmail({ name, email, orderNumber, subject, message });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[support]', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
}

export function health(req: ApiRequest, res: ApiResponse) {
  // Vercel sets the visitor's country; the site uses it to show prices in the right currency
  const country = typeof req.headers['x-vercel-ip-country'] === 'string' ? req.headers['x-vercel-ip-country'] : null;
  res.status(200).json({ status: 'ok', payments: dodoEnvironment() === 'live_mode' ? 'live' : 'test', country, timestamp: new Date().toISOString() });
}
