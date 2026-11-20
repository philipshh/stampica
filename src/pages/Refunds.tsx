import { Link } from 'react-router-dom';
import { LegalPage, Section, Mail } from '../components/LegalPage';

export function Refunds() {
  return (
    <LegalPage title="Refunds & Delivery" updated="November 2026">
      <Section title="Delivery">
        <p>Everything is digital. Once your payment is confirmed, usually within seconds, your posters are ready on the download page, and we email you a link to it. Nothing is shipped.</p>
        <p>You can come back any time through <Link to="/orders" className="text-ink underline">My orders</Link> and download any size again.</p>
      </Section>

      <Section title="Refunds">
        <p>Because the files are available right after payment, you agree at checkout that delivery starts immediately. Under EU consumer law, that means the 14-day right of withdrawal no longer applies once you have downloaded a file.</p>
        <p>We will still refund you in full if:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>you have not downloaded any file from the order yet, and you ask within 14 days, or</li>
          <li>a file is broken, does not match what you saw in the editor, or will not download, and we cannot fix it.</li>
        </ul>
        <p>Write to <Mail /> with your order number. Refunds are paid by Dodo Payments to your original payment method, usually within 5–10 business days.</p>
      </Section>

      <Section title="Printing your poster">
        <p>The files are made for printing at any local print shop or online printer. Print quality depends on the printer and paper you choose, so we cannot refund printing costs.</p>
      </Section>
    </LegalPage>
  );
}
