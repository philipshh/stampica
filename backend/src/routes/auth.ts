import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { verifyGoogleToken, signJWT } from '../services/auth.js';

const router = Router();

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// POST /api/auth/google
// Accepts a Google ID token, upserts the user in Supabase, returns a JWT
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body as { idToken?: string };
    if (!idToken) {
      res.status(400).json({ error: 'idToken is required' });
      return;
    }

    const googleUser = await verifyGoogleToken(idToken);
    const supabase = getSupabase();

    // Upsert user
    const { data: user, error } = await supabase
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

    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    console.error('[auth/google]', err);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

export default router;
