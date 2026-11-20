export function Shipping() {
  return (
    <div className="min-h-full bg-paper text-ink p-6 md:p-10">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Shipping & Returns</h1>
          <p className="text-ink-faint text-sm">Last updated: March 2025</p>
        </div>

        <Section title="Production Time">
          <p>All posters are printed to order. Please allow <strong className="text-ink">2–5 business days</strong> for production before your order ships.</p>
        </Section>

        <Section title="Delivery Estimates">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left py-2 pr-4 text-ink-soft font-medium">Region</th>
                <th className="text-left py-2 text-ink-soft font-medium">Estimated delivery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[
                ['Serbia', '2–4 business days'],
                ['EU / Western Balkans', '4–8 business days'],
                ['Rest of Europe', '6–10 business days'],
                ['Rest of world', '10–18 business days'],
              ].map(([region, time]) => (
                <tr key={region}>
                  <td className="py-2 pr-4 text-ink-soft">{region}</td>
                  <td className="py-2 text-ink-soft">{time}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>Delivery times are estimates and may vary due to customs or carrier delays.</p>
        </Section>

        <Section title="Tracking">
          <p>Once your order ships you'll receive an email with a tracking number. You can also view it any time in the <strong className="text-ink">Orders</strong> section of the app.</p>
        </Section>

        <Section title="Damaged or Lost Orders">
          <p>If your poster arrives damaged or doesn't arrive within the estimated window, contact us at <a href="mailto:stampicastudio@gmail.com" className="text-ink underline hover:text-ink">stampicastudio@gmail.com</a> with your order number. We will reship or refund at no extra cost.</p>
        </Section>

        <Section title="Returns & Cancellations">
          <p>Because every poster is printed on demand we cannot accept returns for change of mind. If you believe there is a print quality issue, contact us within <strong className="text-ink">14 days</strong> of delivery with a photo and we will make it right.</p>
          <p>Order cancellations are only possible before production starts. Contact us as soon as possible if you need to cancel.</p>
        </Section>

        <Section title="Packaging">
          <p>Posters are rolled and shipped in sturdy cardboard tubes to arrive flat and undamaged.</p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-ink mb-2">{title}</h2>
      <div className="text-sm text-ink-soft leading-relaxed space-y-2">{children}</div>
    </section>
  );
}
