export function Privacy() {
  return (
    <div className="min-h-full bg-neutral-950 text-white p-6 md:p-10">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-neutral-500 text-sm">Last updated: March 2025</p>
        </div>

        <Section title="1. What We Collect">
          <p>When you create an account we collect your name and email address via Google Sign-In. When you place an order we also collect your shipping address and phone number.</p>
          <p>We store the poster designs you create and the preview images associated with your orders.</p>
        </Section>

        <Section title="2. How We Use It">
          <ul className="list-disc pl-4 space-y-1">
            <li>To fulfil and ship your orders</li>
            <li>To send order confirmation and shipping update emails</li>
            <li>To display your order history in the app</li>
          </ul>
          <p>We do not sell your personal data to third parties.</p>
        </Section>

        <Section title="3. Third-Party Services">
          <p>We use the following services to operate Stampica:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong className="text-white">Google Sign-In</strong> – for authentication</li>
            <li><strong className="text-white">Supabase</strong> – for database and file storage</li>
            <li><strong className="text-white">Brevo</strong> – for transactional email</li>
          </ul>
          <p>Each service has its own privacy policy governing how they handle data.</p>
        </Section>

        <Section title="4. Data Retention">
          <p>Your account and order data is retained for as long as your account is active. You may request deletion by contacting us.</p>
        </Section>

        <Section title="5. Cookies">
          <p>We use a single authentication token stored in your browser's local storage to keep you signed in. We do not use advertising or tracking cookies.</p>
        </Section>

        <Section title="6. Your Rights">
          <p>You have the right to access, correct, or delete the personal data we hold about you. Contact us at <a href="mailto:stampicastudio@gmail.com" className="text-white underline hover:text-neutral-300">stampicastudio@gmail.com</a> to make a request.</p>
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
