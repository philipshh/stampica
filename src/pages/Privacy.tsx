import { LegalPage, Section, Mail } from '../components/LegalPage';

export function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="November 2026">
      <Section title="1. What we collect">
        <ul className="list-disc pl-4 space-y-1">
          <li><strong className="text-ink">Account:</strong> your name, email address and profile picture from Google Sign-In.</li>
          <li><strong className="text-ink">Photos you buy:</strong> when you check out, we upload the photo behind each poster plus a small preview, together with the design settings (effect, colours, text).</li>
          <li><strong className="text-ink">Orders:</strong> order number, number of designs, amount, currency and payment status.</li>
        </ul>
        <p>Photos you only edit and never buy stay in your browser. They are not uploaded to us.</p>
      </Section>

      <Section title="2. How we handle your photos">
        <ul className="list-disc pl-4 space-y-1">
          <li>Before upload, your browser shrinks each photo to at most 4000 pixels on its longest side and saves it as a JPEG. That is plenty for the largest poster size, and it keeps files small (the limit is 12 MB per photo).</li>
          <li>Photos are stored in a private storage bucket in Frankfurt, Germany. They are never public. Each download link is personal and expires after 30 minutes.</li>
          <li>We use your photos only to render your posters. We do not share them, sell them, show them to others or use them to train any model.</li>
        </ul>
      </Section>

      <Section title="3. How long we keep it">
        <ul className="list-disc pl-4 space-y-1">
          <li><strong className="text-ink">Unpaid or failed checkouts:</strong> the photos and the order are deleted automatically after 7 days.</li>
          <li><strong className="text-ink">Paid orders:</strong> kept so you can download your posters again, in any size, whenever you like.</li>
          <li><strong className="text-ink">On request:</strong> email us and we will delete your photos, orders or whole account within 30 days. Payment records that the law requires us or our payment provider to keep are the only exception.</li>
        </ul>
      </Section>

      <Section title="4. Services we use">
        <ul className="list-disc pl-4 space-y-1">
          <li><strong className="text-ink">Dodo Payments</strong>: processes payments as our reseller and merchant of record. Your card details go to them, never to us.</li>
          <li><strong className="text-ink">Neon</strong>: database and photo storage (EU, Frankfurt).</li>
          <li><strong className="text-ink">Vercel</strong>: hosts the website.</li>
          <li><strong className="text-ink">Google</strong>: sign-in.</li>
          <li><strong className="text-ink">Brevo</strong>: sends order and support emails.</li>
        </ul>
        <p>Each service handles data under its own privacy policy. We do not sell your personal data.</p>
      </Section>

      <Section title="5. Cookies and storage">
        <p>We keep a sign-in token and your cart in your browser's local storage. We use no advertising or tracking cookies.</p>
      </Section>

      <Section title="6. Your rights">
        <p>You can ask to see, correct, export or delete the personal data we hold about you. Write to <Mail />.</p>
      </Section>
    </LegalPage>
  );
}
