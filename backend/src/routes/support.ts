import { Router, Request, Response } from 'express';
import { sendSupportEmail } from '../services/email.js';

const router = Router();

// POST /api/support – submit a contact/support request
router.post('/', async (req: Request, res: Response) => {
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

    res.json({ ok: true });
  } catch (err) {
    console.error('[support]', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
