export function Terms() {
  return (
    <div className="min-h-full bg-neutral-950 text-white p-6 md:p-10">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Terms & Conditions</h1>
          <p className="text-neutral-500 text-sm">Last updated: March 2025</p>
        </div>

        <Section title="1. About Stampica">
          <p>Stampica is a print-on-demand poster service. By placing an order, you agree to these terms.</p>
        </Section>

        <Section title="2. Orders & Payment">
          <p>All orders are final once placed. Prices are listed in EUR and include VAT where applicable. We accept payment via the methods displayed at checkout.</p>
        </Section>

        <Section title="3. Custom Designs">
          <p>You retain ownership of any original artwork you upload. By submitting a design, you confirm that you own the rights to reproduce it in print. Stampica will not reproduce designs that infringe third-party intellectual property.</p>
        </Section>

        <Section title="4. Production & Delivery">
          <p>Orders are typically produced within 2–5 business days. Delivery times vary by location — see our Shipping & Returns page for details. Stampica is not responsible for delays caused by carriers.</p>
        </Section>

        <Section title="5. Quality Guarantee">
          <p>If your print arrives damaged or with a production defect, contact us within 14 days of delivery with a photo and we will reprint or refund your order at no cost.</p>
        </Section>

        <Section title="6. Limitation of Liability">
          <p>Stampica's liability is limited to the value of the order placed. We are not responsible for indirect or consequential losses.</p>
        </Section>

        <Section title="7. Changes to Terms">
          <p>We may update these terms from time to time. Continued use of the service constitutes acceptance of the revised terms.</p>
        </Section>

        <Section title="8. Contact">
          <p>Questions? Reach us at <a href="mailto:stampicastudio@gmail.com" className="text-white underline hover:text-neutral-300">stampicastudio@gmail.com</a>.</p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-white mb-2">{title}</h2>
      <div className="text-sm text-neutral-400 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}
