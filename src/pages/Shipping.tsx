export function Shipping() {
  return (
    <div className="min-h-full bg-neutral-950 text-white p-6 md:p-10">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Shipping & Returns</h1>
          <p className="text-neutral-500 text-sm">Last updated: March 2025</p>
        </div>

        <Section title="Production Time">
          <p>All posters are printed to order. Please allow <strong className="text-white">2–5 business days</strong> for production before your order ships.</p>
        </Section>

        <Section title="Delivery Estimates">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left py-2 pr-4 text-neutral-400 font-medium">Region</th>
                <th className="text-left py-2 text-neutral-400 font-medium">Estimated delivery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {[
                ['Serbia', '2–4 business days'],
                ['EU / Western Balkans', '4–8 business days'],
                ['Rest of Europe', '6–10 business days'],
                ['Rest of world', '10–18 business days'],
              ].map(([region, time]) => (
                <tr key={region}>
                  <td className="py-2 pr-4 text-neutral-300">{region}</td>
                  <td className="py-2 text-neutral-400">{time}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>Delivery times are estimates and may vary due to customs or carrier delays.</p>
        </Section>

        <Section title="Tracking">
          <p>Once your order ships you'll receive an email with a tracking number. You can also view it any time in the <strong className="text-white">Orders</strong> section of the app.</p>
        </Section>

        <Section title="Damaged or Lost Orders">
          <p>If your poster arrives damaged or doesn't arrive within the estimated window, contact us at <a href="mailto:stampicastudio@gmail.com" className="text-white underline hover:text-neutral-300">stampicastudio@gmail.com</a> with your order number. We will reship or refund at no extra cost.</p>
        </Section>

        <Section title="Returns & Cancellations">
          <p>Because every poster is printed on demand we cannot accept returns for change of mind. If you believe there is a print quality issue, contact us within <strong className="text-white">14 days</strong> of delivery with a photo and we will make it right.</p>
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
      <h2 className="text-base font-semibold text-white mb-2">{title}</h2>
      <div className="text-sm text-neutral-400 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}
