// Minimal request/response shapes satisfied by both Express and Vercel's
// Node runtime, so handler logic is written once and mounted in either.

export interface ApiRequest {
  method?: string;
  headers: { authorization?: string; [key: string]: unknown };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
  query: Partial<Record<string, string | string[]>>;
}

export interface ApiResponse {
  status(code: number): ApiResponse;
  json(body: unknown): void;
}

export function queryParam(req: ApiRequest, name: string): string | undefined {
  const value = req.query[name];
  return Array.isArray(value) ? value[0] : value;
}
