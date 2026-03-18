import { BrevoClient } from '@getbrevo/brevo';

function getClient() {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY not configured');
  return new BrevoClient({ apiKey });
}

const FROM_EMAIL = process.env.EMAIL_USER ?? 'stampicastudio@gmail.com';
const FROM_NAME = 'Stampica';

export interface OrderEmailData {
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  size: string;
  quantity: number;
  shippingAddress: string;
  phone: string;
}

export async function sendOrderConfirmationToCustomer(order: OrderEmailData): Promise<void> {
  await getClient().transactionalEmails.sendTransacEmail({
    sender: { email: FROM_EMAIL, name: FROM_NAME },
    to: [{ email: order.customerEmail, name: order.customerName }],
    subject: `Order Confirmed – #${order.orderNumber}`,
    htmlContent: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Your order is confirmed!</h2>
        <p>Hi ${order.customerName}, thank you for your order.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
          <tr><td style="padding: 8px 0; color: #666;">Order number</td><td style="padding: 8px 0; font-weight: bold;">#${order.orderNumber}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Size</td><td style="padding: 8px 0;">${order.size}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Quantity</td><td style="padding: 8px 0;">${order.quantity}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Shipping to</td><td style="padding: 8px 0;">${order.shippingAddress}</td></tr>
        </table>
        <p style="color: #666;">You'll receive another email with tracking info once your order ships.</p>
      </div>
    `,
  });
}

export async function sendNewOrderNotificationToPrintShop(order: OrderEmailData): Promise<void> {
  const shopEmail = process.env.PRINT_SHOP_EMAIL;
  if (!shopEmail) throw new Error('PRINT_SHOP_EMAIL not configured');

  await getClient().transactionalEmails.sendTransacEmail({
    sender: { email: FROM_EMAIL, name: FROM_NAME },
    to: [{ email: shopEmail }],
    subject: `New Stampica Order – #${order.orderNumber}`,
    htmlContent: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New order received</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="color: #666; padding: 6px 0;">Order #</td><td>${order.orderNumber}</td></tr>
          <tr><td style="color: #666; padding: 6px 0;">Customer</td><td>${order.customerName} (${order.customerEmail})</td></tr>
          <tr><td style="color: #666; padding: 6px 0;">Phone</td><td>${order.phone}</td></tr>
          <tr><td style="color: #666; padding: 6px 0;">Size</td><td>${order.size}</td></tr>
          <tr><td style="color: #666; padding: 6px 0;">Quantity</td><td>${order.quantity}</td></tr>
          <tr><td style="color: #666; padding: 6px 0;">Ship to</td><td>${order.shippingAddress}</td></tr>
        </table>
      </div>
    `,
  });
}

export async function sendShippingNotification(
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  trackingNumber: string,
): Promise<void> {
  await getClient().transactionalEmails.sendTransacEmail({
    sender: { email: FROM_EMAIL, name: FROM_NAME },
    to: [{ email: customerEmail, name: customerName }],
    subject: `Your Stampica order #${orderNumber} has shipped!`,
    htmlContent: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your order is on its way!</h2>
        <p>Hi ${customerName}, your poster is heading to you.</p>
        <p><strong>Tracking number:</strong> ${trackingNumber}</p>
        <p style="color: #666; font-size: 14px;">Use your tracking number on the carrier's website to follow your package.</p>
      </div>
    `,
  });
}
