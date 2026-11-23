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
        <p>You keep all rights to the photos you upload. You give us permission to store and process them only to make and deliver your posters.</p>
        <p>Stampica is a design tool. We don't review what you upload and we don't check who owns it. You are responsible for your images and for the text you add.</p>
      </Section>

      <Section title="5. Images you don't own">
        <p>By uploading an image, you confirm that you took it yourself, own it, or have permission to use it. This also covers film and TV stills, artwork, album covers, logos, characters and photos of other people.</p>
        <p>If your design uses something you don't own the rights to, you may only use it privately, for example on your own wall or as a gift. You may not sell it, offer it for sale, or use it to promote a business. Buying a design from us gives you no rights to anyone else's work.</p>
        <p>If someone makes a claim against us because of content you uploaded, you agree to cover the costs that follow from it, as far as the law allows.</p>
      </Section>

      <Section title="6. Using and reselling the files">
        <p>You may print your files for personal use and for gifts. Selling Stampica designs or files, or offering them as a product or service, needs our written permission. This applies even when you own every image in the design.</p>
      </Section>

      <Section title="7. Rights holders and removal">
        <p>If you believe a design made with Stampica uses your work without permission, write to <Mail /> with a link or a description, and proof that you hold the rights. We will look into it promptly.</p>
        <p>We may remove content, refuse or cancel an order, or close an account that breaks these terms or the law. If we cancel an order before the files are delivered, we refund it.</p>
      </Section>

      <Section title="8. Refunds">
        <p>Digital files are delivered instantly, so refunds work differently from physical goods. See <Link to="/refunds" className="text-ink underline">Refunds & Delivery</Link>.</p>
      </Section>

      <Section title="9. Liability">
        <p>We do our best to keep the service running and the files correct. Our liability is limited to the amount you paid for the order in question. Nothing here limits rights you have under consumer law.</p>
      </Section>

      <Section title="10. Changes">
        <p>We may update these terms. The date at the top shows the latest version. Orders are covered by the terms in force when you placed them.</p>
      </Section>

      <Section title="11. Contact">
        <p>Questions? Write to <Mail />.</p>
      </Section>
    </LegalPage>
  );
}
