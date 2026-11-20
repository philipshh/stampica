import { neon } from '@neondatabase/serverless';

// Neon over HTTP: no connection pool to manage in serverless functions, and the
// compute wakes up on the first query after scaling to zero.
let client: ReturnType<typeof neon> | null = null;

export function sql() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL not configured');
    client = neon(url);
  }
  return client;
}
