import type { ReactNode } from 'react';

export const CONTACT_EMAIL = 'stampicastudio@gmail.com';

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="min-h-full bg-paper text-ink p-6 md:p-10">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="font-display font-extrabold text-4xl tracking-[-0.02em] mb-2">{title}</h1>
          <p className="text-ink-faint text-sm">Last updated: {updated}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-ink mb-2">{title}</h2>
      <div className="text-sm text-ink-soft leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export function Mail() {
  return <a href={`mailto:${CONTACT_EMAIL}`} className="text-ink underline">{CONTACT_EMAIL}</a>;
}
