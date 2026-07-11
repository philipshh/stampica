import { getSupabase } from './supabase.js';
import { verifyGoogleToken, signJWT } from './auth.js';
import { sendSupportEmail } from './email.js';
import type { ApiRequest, ApiResponse } from './types.js';

// POST /api/auth/google
// Accepts a Google ID token, upserts the user in Supabase, returns a JWT
export async function authGoogle(req: ApiRequest, res: ApiResponse) {
  try {
    const { idToken } = req.body as { idToken?: string };
    if (!idToken) {
      res.status(400).json({ error: 'idToken is required' });
      return;
    }

    const googleUser = await verifyGoogleToken(idToken);

    const { data: user, error } = await getSupabase()
      .from('users')
      .upsert(
        {
          google_id: googleUser.sub,
          email: googleUser.email,
          name: googleUser.name,
          avatar_url: googleUser.picture,
        },
        { onConflict: 'google_id' },
      )
      .select()
      .single();

    if (error) throw error;

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

export function health(_req: ApiRequest, res: ApiResponse) {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
}
