import nodemailer from 'nodemailer';

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
}

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
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: order.customerEmail,
    subject: `Order Confirmed – #${order.orderNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Your order is confirmed!</h2>
        <p>Hi ${order.customerName}, thank you for your order.</p>

        <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
          <tr>
            <td style="padding: 8px 0; color: #666;">Order number</td>
            <td style="padding: 8px 0; font-weight: bold;">#${order.orderNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Size</td>
            <td style="padding: 8px 0;">${order.size}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Quantity</td>
            <td style="padding: 8px 0;">${order.quantity}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Shipping to</td>
            <td style="padding: 8px 0;">${order.shippingAddress}</td>
          </tr>
        </table>

        <p style="color: #666;">You'll receive another email with tracking info once your order ships.</p>
      </div>
    `,
  });
}

export async function sendNewOrderNotificationToPrintShop(order: OrderEmailData): Promise<void> {
  const transporter = createTransporter();
  const shopEmail = process.env.PRINT_SHOP_EMAIL;
  if (!shopEmail) throw new Error('PRINT_SHOP_EMAIL not configured');

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: shopEmail,
    subject: `New Stampica Order – #${order.orderNumber}`,
    html: `
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

        <a href="${process.env.ADMIN_DASHBOARD_URL}" style="
          display: inline-block;
          background: #1a1a1a;
          color: white;
          padding: 12px 24px;
          border-radius: 6px;
          text-decoration: none;
          margin-top: 16px;
        ">View in Admin Dashboard</a>
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
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: customerEmail,
    subject: `Your Stampica order #${orderNumber} has shipped!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your order is on its way!</h2>
        <p>Hi ${customerName}, your poster is heading to you.</p>
        <p><strong>Tracking number:</strong> ${trackingNumber}</p>
        <p style="color: #666; font-size: 14px;">Use your tracking number on the carrier's website to follow your package.</p>
      </div>
    `,
  });
}
