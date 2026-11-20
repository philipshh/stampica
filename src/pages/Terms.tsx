import { Link } from 'react-router-dom';
import { LegalPage, Section, Mail } from '../components/LegalPage';

export function Terms() {
  return (
    <LegalPage title="Terms & Conditions" updated="November 2026">
      <Section title="1. About Stampica">
        <p>Stampica turns your photos into poster designs that you buy as digital downloads. We do not print or ship anything. By using the site or buying a design, you agree to these terms.</p>
      </Section>

      <Section title="2. What you get">
        <p>One purchase covers one design. It includes print-ready PNG files of that design in every size we offer, and you can download them as often as you like from your account.</p>
      </Section>

      <Section title="3. Payment">
        <p>Payments are handled by Dodo Payments, our reseller and merchant of record. They charge you, issue the receipt and handle taxes, and their <a href="https://dodopayments.com/buyer-terms" className="text-ink underline" target="_blank" rel="noreferrer">buyer terms</a> also apply. Prices are shown at checkout in your local currency where available.</p>
      </Section>

      <Section title="4. Your photos and designs">
        <p>You keep all rights to the photos you upload. By uploading, you confirm you have the right to use them and that they do not break the law or anyone else's rights. You give us permission to store and process them only to make and deliver your posters.</p>
        <p>You may print the files for personal use and for gifts. Selling Stampica designs or the files themselves as a product requires our written permission.</p>
      </Section>

      <Section title="5. Refunds">
        <p>Digital files are delivered instantly, so refunds work differently from physical goods. See <Link to="/refunds" className="text-ink underline">Refunds & Delivery</Link>.</p>
      </Section>

      <Section title="6. Liability">
        <p>We do our best to keep the service running and the files correct. Our liability is limited to the amount you paid for the order in question. Nothing here limits rights you have under consumer law.</p>
      </Section>

      <Section title="7. Changes">
        <p>We may update these terms. The date at the top shows the latest version. Orders are covered by the terms in force when you placed them.</p>
      </Section>

      <Section title="8. Contact">
        <p>Questions? Write to <Mail />.</p>
      </Section>
    </LegalPage>
  );
}
