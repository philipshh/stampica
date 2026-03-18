import jwt from 'jsonwebtoken';

const GOOGLE_TOKEN_INFO_URL = 'https://oauth2.googleapis.com/tokeninfo';

interface GoogleTokenPayload {
  sub: string;
  email: string;
  name: string;
  picture: string;
  email_verified: string;
}

interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
}

export async function verifyGoogleToken(idToken: string): Promise<GoogleTokenPayload> {
  const response = await fetch(`${GOOGLE_TOKEN_INFO_URL}?id_token=${idToken}`);
  if (!response.ok) {
    throw new Error('Invalid Google token');
  }

  const payload = (await response.json()) as GoogleTokenPayload;

  if (payload.email_verified !== 'true') {
    throw new Error('Google email not verified');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID not configured');

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
