import jwt from 'jsonwebtoken';
import type { ApiRequest, ApiResponse } from './types.js';

const GOOGLE_TOKEN_INFO_URL = 'https://oauth2.googleapis.com/tokeninfo';

interface GoogleTokenPayload {
  sub: string;
  email: string;
  name: string;
  picture: string;
  email_verified: string;
  aud: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
}

export async function verifyGoogleToken(idToken: string): Promise<GoogleTokenPayload> {
  const response = await fetch(`${GOOGLE_TOKEN_INFO_URL}?id_token=${encodeURIComponent(idToken)}`);
  if (!response.ok) {
    throw new Error('Invalid Google token');
  }

  const payload = (await response.json()) as GoogleTokenPayload;

  if (payload.email_verified !== 'true') {
    throw new Error('Google email not verified');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID not configured');
  if (payload.aud !== clientId) {
    throw new Error('Google token audience mismatch');
  }

  return payload;
}

export function signJWT(payload: JWTPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function verifyJWT(token: string): JWTPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  return jwt.verify(token, secret) as JWTPayload;
}

export function extractBearerToken(authHeader: string | undefined): string {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }
  return authHeader.slice(7);
}

/** Returns the authenticated user, or sends 401 and returns null. */
export function requireUser(req: ApiRequest, res: ApiResponse): JWTPayload | null {
  try {
    return verifyJWT(extractBearerToken(req.headers.authorization));
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
}

/** Returns the authenticated admin, or sends 401/403 and returns null. */
export function requireAdmin(req: ApiRequest, res: ApiResponse): JWTPayload | null {
  let user: JWTPayload;
  try {
    user = verifyJWT(extractBearerToken(req.headers.authorization));
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }
  return user;
}
