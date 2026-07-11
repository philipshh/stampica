// Local development server. Production runs the same handlers as Vercel
// serverless functions under /api — all logic lives in ../../api/_lib.
import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { authGoogle, support, health } from '../../api/_lib/handlers.js';
import { createOrder, listOrders, cancelOrder, getOrderByNumber } from '../../api/_lib/orders.js';
import { adminListOrders, adminUpdateOrder, adminDeleteOrder } from '../../api/_lib/admin.js';
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
app.use(express.json({ limit: '10mb' }));

const adapt = (req: Request, res: Response): [ApiRequest, ApiResponse] => [
  req as unknown as ApiRequest,
  res as unknown as ApiResponse,
];

app.post('/api/auth/google', (req, res) => authGoogle(...adapt(req, res)));

app.post('/api/orders', (req, res) => createOrder(...adapt(req, res)));
app.get('/api/orders', (req, res) => listOrders(...adapt(req, res)));
app.patch('/api/orders/:id/cancel', (req, res) => cancelOrder(...adapt(req, res), req.params.id));
app.get('/api/orders/:orderNumber', (req, res) =>
  getOrderByNumber(...adapt(req, res), req.params.orderNumber),
);

app.get('/api/admin/orders', (req, res) => adminListOrders(...adapt(req, res)));
app.patch('/api/admin/orders/:id', (req, res) =>
  adminUpdateOrder(...adapt(req, res), req.params.id),
);
app.delete('/api/admin/orders/:id', (req, res) =>
  adminDeleteOrder(...adapt(req, res), req.params.id),
);

app.post('/api/support', (req, res) => support(...adapt(req, res)));

app.get('/api/health', (req, res) => health(...adapt(req, res)));
app.get('/health', (req, res) => health(...adapt(req, res)));

app.listen(PORT, () => {
  console.log(`Stampica dev API running on http://localhost:${PORT}`);
});
