import { BrevoClient } from '@getbrevo/brevo';

function getClient() {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY not configured');
  return new BrevoClient({ apiKey });
}

const FROM_EMAIL = process.env.EMAIL_USER ?? 'stampicastudio@gmail.com';
const FROM_NAME = 'Stampica';
const APP_URL = process.env.APP_URL ?? 'https://stampica.studio';

export interface OrderEmailItem {
  size: string;
  quantity: number;
  frame: string;
  previewUrl?: string | null;
  posterUrl?: string | null;
}

export interface OrderEmailData {
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  items: OrderEmailItem[];
  shippingAddress: string; // "Name, Street, City PostalCode, Country"
  phone: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Splits "Name, Street, City PostalCode, Country" into parts */
function parseAddress(addr: string) {
  const parts = addr.split(', ');
  if (parts.length < 4) return { street: addr, cityPostal: '', country: '' };
  const street = parts[1];
  const cityPostal = parts[2];
  const country = parts.slice(3).join(', ');
  return { street, cityPostal, country };
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
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

        <!-- Header / Logo -->
        <tr>
          <td style="background:#0a0a0a;padding:28px 40px;text-align:center;">
            <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.06em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">STAMPICA</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 40px;">
            ${body}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;padding:20px 40px;border-top:1px solid #eee;text-align:center;">
            <p style="margin:0;color:#aaa;font-size:12px;">© Stampica · <a href="${APP_URL}" style="color:#aaa;text-decoration:none;">${APP_URL.replace('https://', '')}</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Emails ────────────────────────────────────────────────────────────────────

const SIZE_PRICE: Record<string, number> = { A5: 700, A4: 900, A3: 1100 };
const FRAME_EXTRA: Record<string, number> = { none: 0, black: 1000, white: 1000 };
const SHIPPING_COST = 200;
const FREE_SHIPPING_THRESHOLD = 4000;

function itemPrice(item: OrderEmailItem): number {
  return ((SIZE_PRICE[item.size] ?? 0) + (FRAME_EXTRA[item.frame] ?? 0)) * item.quantity;
}

function itemsHtml(items: OrderEmailItem[]): string {
  return items.map((item, i) => {
    const frameLabel = item.frame && item.frame !== 'none'
      ? ` · ${item.frame.charAt(0).toUpperCase() + item.frame.slice(1)} frame`
      : '';
    const previewCell = item.previewUrl
      ? `<img src="${item.previewUrl}" alt="Poster ${i + 1}" style="width:56px;border:3px solid #0a0a0a;display:block;">`
      : `<div style="width:56px;height:79px;background:#eee;border-radius:4px;"></div>`;
    return `
    <tr style="border-bottom:1px solid #eee;">
      <td style="padding:12px 0;width:70px;vertical-align:top;">${previewCell}</td>
      <td style="padding:12px 12px;font-size:13px;color:#333;vertical-align:top;">
        ${item.size}${frameLabel}<br>
        <span style="color:#888;">×${item.quantity}</span>
      </td>
      <td style="padding:12px 0;font-size:13px;font-weight:600;color:#111;vertical-align:top;text-align:right;white-space:nowrap;">${itemPrice(item)} din</td>
    </tr>`;
  }).join('');
}

export async function sendOrderConfirmationToCustomer(order: OrderEmailData): Promise<void> {
  const { street, cityPostal, country } = parseAddress(order.shippingAddress);
  const firstName = order.customerName.split(' ')[0];
  const subtotal = order.items.reduce((s, i) => s + itemPrice(i), 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;

  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;color:#0a0a0a;">Your order is confirmed!</h2>
    <p style="margin:0 0 28px;color:#666;font-size:15px;">Hi ${firstName}, thanks for your order. We'll get it printed and on its way.</p>

    <!-- Items -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee;">
      ${itemsHtml(order.items)}
    </table>

    <!-- Totals -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
      ${row('Order #', `<strong>#${order.orderNumber}</strong>`)}
      ${row('Shipping', shipping === 0 ? 'Free' : `${shipping} din`)}
      ${row('Total', `<strong>${total} din</strong>`)}
      ${row('Payment', 'Cash on delivery / Plaćanje pouzećem')}
    </table>

    <!-- Ship to -->
    <p style="margin:24px 0 8px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#aaa;">Ship to</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:8px;padding:16px;" bgcolor="#f9f9f9">
      <tr><td style="padding:4px 16px;font-size:14px;color:#111;">${order.customerName}</td></tr>
      <tr><td style="padding:4px 16px;font-size:14px;color:#555;">${street}</td></tr>
      <tr><td style="padding:4px 16px;font-size:14px;color:#555;">${cityPostal}</td></tr>
      <tr><td style="padding:4px 16px;font-size:14px;color:#555;">${country}</td></tr>
      <tr><td style="padding:4px 16px;font-size:14px;color:#555;">${order.phone}</td></tr>
    </table>

    <p style="margin:28px 0 0;color:#999;font-size:13px;line-height:1.6;">
      You'll receive another email with tracking info once your order ships.
    </p>`;

  await getClient().transactionalEmails.sendTransacEmail({
    sender: { email: FROM_EMAIL, name: FROM_NAME },
    to: [{ email: order.customerEmail, name: order.customerName }],
    subject: `Order confirmed – #${order.orderNumber}`,
    htmlContent: emailShell(body),
  });
}

export async function sendNewOrderNotificationToPrintShop(order: OrderEmailData): Promise<void> {
  const shopEmail = process.env.PRINT_SHOP_EMAIL;
  if (!shopEmail) throw new Error('PRINT_SHOP_EMAIL not configured');

  const { street, cityPostal, country } = parseAddress(order.shippingAddress);
  const subtotal = order.items.reduce((s, i) => s + itemPrice(i), 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;

  const downloadLinks = order.items
    .filter(i => i.posterUrl)
    .map((i, idx) => `<a href="${i.posterUrl}" style="display:inline-block;background:#0a0a0a;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;margin:4px 4px 0 0;">↓ Item ${idx + 1} – ${i.size}</a>`)
    .join('');

  const body = `
    <h2 style="margin:0 0 4px;font-size:22px;color:#0a0a0a;">New order</h2>
    <p style="margin:0 0 28px;color:#666;font-size:15px;">Order <strong>#${order.orderNumber}</strong> just came in.</p>

    <!-- Customer -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee;">
      ${row('Order #', `<strong>#${order.orderNumber}</strong>`)}
      ${row('Customer', order.customerName)}
      ${row('Email', `<a href="mailto:${order.customerEmail}" style="color:#111;">${order.customerEmail}</a>`)}
    </table>

    <!-- Items -->
    <p style="margin:24px 0 8px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#aaa;">Items (${order.items.length})</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee;">
      ${itemsHtml(order.items)}
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
      ${row('Shipping', shipping === 0 ? 'Free' : `${shipping} din`)}
      ${row('Total', `<strong>${total} din</strong>`)}
    </table>

    <!-- Ship to -->
    <p style="margin:24px 0 8px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#aaa;">Ship to</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:8px;" bgcolor="#f9f9f9">
      <tr><td style="padding:4px 16px;font-size:14px;color:#111;">${order.customerName}</td></tr>
      <tr><td style="padding:4px 16px;font-size:14px;color:#555;">${street}</td></tr>
      <tr><td style="padding:4px 16px;font-size:14px;color:#555;">${cityPostal}</td></tr>
      <tr><td style="padding:4px 16px;font-size:14px;color:#555;">${country}</td></tr>
      <tr><td style="padding:4px 16px 12px;font-size:14px;color:#555;">${order.phone}</td></tr>
    </table>

    <!-- Download buttons -->
    <div style="margin-top:28px;">
      ${downloadLinks || `<p style="color:#aaa;font-size:13px;margin:0;">No hi-res files attached to this order.</p>`}
    </div>`;

  await getClient().transactionalEmails.sendTransacEmail({
    sender: { email: FROM_EMAIL, name: FROM_NAME },
    to: [{ email: shopEmail }],
    subject: `New order – #${order.orderNumber}`,
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
    <h2 style="margin:0 0 8px;font-size:22px;color:#0a0a0a;">Support request</h2>
    <p style="margin:0 0 28px;color:#666;font-size:15px;">${subject}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee;">
      ${row('From', `${name} &lt;${email}&gt;`)}
      ${orderNumber ? row('Order #', `<strong>#${orderNumber}</strong>`) : ''}
    </table>

    <p style="margin:24px 0 8px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#aaa;">Message</p>
    <div style="background:#f9f9f9;border-radius:8px;padding:16px 20px;font-size:14px;color:#333;line-height:1.7;white-space:pre-wrap;">${message}</div>

    <p style="margin:24px 0 0;">
      <a href="mailto:${email}" style="display:inline-block;background:#0a0a0a;color:#fff;padding:11px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Reply to ${name}</a>
    </p>`;

  await getClient().transactionalEmails.sendTransacEmail({
    sender: { email: FROM_EMAIL, name: FROM_NAME },
    to: [{ email: shopEmail }],
    replyTo: { email, name },
    subject: `Support: ${subject}${orderNumber ? ` (#${orderNumber})` : ''}`,
    htmlContent: emailShell(body),
  });
}

export async function sendShippingNotification(
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  trackingNumber: string,
): Promise<void> {
  const firstName = customerName.split(' ')[0];

  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;color:#0a0a0a;">Your order is on its way!</h2>
    <p style="margin:0 0 28px;color:#666;font-size:15px;">Hi ${firstName}, your poster has been shipped.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee;">
      ${row('Order #', `<strong>#${orderNumber}</strong>`)}

      ${row('Tracking', `<strong style="font-family:monospace;">${trackingNumber}</strong>`)}
    </table>

    <p style="margin:24px 0 0;color:#999;font-size:13px;line-height:1.6;">
      Use your tracking number on the carrier's website to follow your package.
    </p>`;

  await getClient().transactionalEmails.sendTransacEmail({
    sender: { email: FROM_EMAIL, name: FROM_NAME },
    to: [{ email: customerEmail, name: customerName }],
    subject: `Your order #${orderNumber} has shipped!`,
    htmlContent: emailShell(body),
  });
}
