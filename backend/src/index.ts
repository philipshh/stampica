// Local development server. Production runs the same handlers as Vercel
// serverless functions under /api — all logic lives in ../../api/_lib.
import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { authGoogle, support, health } from '../../api/_lib/handlers.js';
import {
  createUploadSlots, createDigitalCheckout, getDigitalOrder, listDigitalOrders, dodoWebhook, cleanupAbandoned,
} from '../../api/_lib/digital.js';
import type { ApiRequest, ApiResponse } from '../../api/_lib/types.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = process.env.FRONTEND_URL ?? '';
      if (!origin || origin.startsWith('http://localhost:') || origin === allowed) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  }),
);
// Webhook needs the raw body for signature checks, so it is mounted before express.json().
app.post('/api/webhooks/dodo', express.raw({ type: '*/*' }), (req, res) =>
  dodoWebhook(req.body.toString('utf8'), req.headers as Record<string, string>, res as unknown as ApiResponse),
);
app.use(express.json({ limit: '1mb' }));

const adapt = (req: Request, res: Response): [ApiRequest, ApiResponse] => [
  req as unknown as ApiRequest,
  res as unknown as ApiResponse,
];

app.post('/api/auth/google', (req, res) => authGoogle(...adapt(req, res)));

app.post('/api/digital/uploads', (req, res) => createUploadSlots(...adapt(req, res)));
app.post('/api/digital/checkout', (req, res) => createDigitalCheckout(...adapt(req, res)));
app.get('/api/digital/orders', (req, res) => listDigitalOrders(...adapt(req, res)));
app.get('/api/digital/orders/:id', (req, res) => getDigitalOrder(...adapt(req, res), req.params.id));
app.get('/api/cron/cleanup', (req, res) => cleanupAbandoned(...adapt(req, res)));

app.post('/api/support', (req, res) => support(...adapt(req, res)));

app.get('/api/health', (req, res) => health(...adapt(req, res)));
app.get('/health', (req, res) => health(...adapt(req, res)));

app.listen(PORT, () => {
  console.log(`Stampica dev API running on http://localhost:${PORT}`);
});
