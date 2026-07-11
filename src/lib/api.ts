// API base URL. Empty string = same origin (production on Vercel, and local
// dev via the vite proxy in vite.config.ts). Set VITE_API_URL to override.
export const API_BASE: string = import.meta.env.VITE_API_URL ?? '';
