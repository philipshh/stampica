import { BrevoClient } from '@getbrevo/brevo';

function getClient() {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY not configured');
  return new BrevoClient({ apiKey });
}

const FROM_EMAIL = process.env.EMAIL_FROM ?? 'stampicastudio@gmail.com';
const FROM_NAME = 'Stampica';
const APP_URL = process.env.APP_URL ?? 'https://stampica.vercel.app';

/** User-entered text goes into HTML emails escaped. */
function esc(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

const row = (label: string, value: string) => `
  <tr>
    <td style="padding:10px 0;color:#888;font-size:13px;white-space:nowrap;width:130px;border-bottom:1px solid #eee;">${label}</td>
    <td style="padding:10px 0;color:#111;font-size:13px;border-bottom:1px solid #eee;">${value}</td>
  </tr>`;

function emailShell(body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f3f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f3f0;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #ddddd8;">
        <tr>
          <td style="padding:28px 40px 0;">
            <span style="color:#141414;font-size:20px;font-weight:800;letter-spacing:0.04em;">STAMPICA</span>
          </td>
        </tr>
        <tr><td style="padding:24px 40px 40px;">${body}</td></tr>
        <tr>
          <td style="background:#f9f9f7;padding:20px 40px;border-top:1px solid #eee;text-align:center;">
            <p style="margin:0;color:#999;font-size:12px;">© Stampica · Made with love in Serbia · <a href="${APP_URL}" style="color:#999;text-decoration:none;">${APP_URL.replace('https://', '')}</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Sent when a digital order is paid: one link back to the download page.
export async function sendDownloadEmail(order: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  orderId: string;
  itemCount: number;
  appUrl?: string;
}): Promise<void> {
  const base = order.appUrl ?? APP_URL;
  const link = `${base}/downloads/${order.orderId}`;
  const designs = order.itemCount === 1 ? '1 poster' : `${order.itemCount} posters`;
  const body = `
    <h2 style="margin:0 0 8px;font-size:24px;color:#141414;">Your posters are ready</h2>
    <p style="margin:0 0 24px;color:#55554f;font-size:15px;line-height:1.6;">
      Thanks, ${esc(order.customerName.split(' ')[0] || order.customerName)}! You can download ${designs} in any of the 23 sizes, as many times as you like.
    </p>
    <p style="margin:0 0 28px;">
      <a href="${link}" style="display:inline-block;background:#141414;color:#fff;padding:13px 28px;border-radius:999px;text-decoration:none;font-size:15px;font-weight:600;">Download your posters</a>
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee;">
      ${row('Order', `<strong>#${esc(order.orderNumber)}</strong>`)}
      ${row('Posters', String(order.itemCount))}
    </table>
    <p style="margin:24px 0 0;color:#999;font-size:12px;line-height:1.6;">
      Sign in with the same Google account to open the link. Questions? Just reply to this email.
    </p>`;

  await getClient().transactionalEmails.sendTransacEmail({
    sender: { email: FROM_EMAIL, name: FROM_NAME },
    to: [{ email: order.customerEmail, name: order.customerName }],
    subject: `Your Stampica posters (#${order.orderNumber})`,
    htmlContent: emailShell(body),
  });
}

export async function sendSupportEmail({
  name,
  email,
  orderNumber,
  subject,
  message,
}: {
  name: string;
  email: string;
  orderNumber?: string;
  subject: string;
  message: string;
}): Promise<void> {
  const shopEmail = process.env.PRINT_SHOP_EMAIL;
  if (!shopEmail) throw new Error('PRINT_SHOP_EMAIL not configured');

  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;color:#141414;">Support request</h2>
    <p style="margin:0 0 28px;color:#666;font-size:15px;">${esc(subject)}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee;">
      ${row('From', `${esc(name)} &lt;${esc(email)}&gt;`)}
      ${orderNumber ? row('Order #', `<strong>#${esc(orderNumber)}</strong>`) : ''}
    </table>

    <p style="margin:24px 0 8px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#aaa;">Message</p>
    <div style="background:#f9f9f9;border-radius:8px;padding:16px 20px;font-size:14px;color:#333;line-height:1.7;white-space:pre-wrap;">${esc(message)}</div>

    <p style="margin:24px 0 0;">
      <a href="mailto:${encodeURIComponent(email)}" style="display:inline-block;background:#141414;color:#fff;padding:11px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Reply to ${esc(name)}</a>
    </p>`;

  await getClient().transactionalEmails.sendTransacEmail({
    sender: { email: FROM_EMAIL, name: FROM_NAME },
    to: [{ email: shopEmail }],
    replyTo: { email, name },
    subject: `Support: ${subject}${orderNumber ? ` (#${orderNumber})` : ''}`,
    htmlContent: emailShell(body),
  });
}
