import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const SUBJECTS = [
  'Question about my order',
  'Order not received',
  'Wrong item received',
  'Request a cancellation',
  'Print quality issue',
  'Other',
];

export function Support() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    orderNumber: '',
    subject: SUBJECTS[0],
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong');
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-full bg-neutral-950 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Message sent</h2>
          <p className="text-neutral-400 text-sm">We'll get back to you as soon as possible.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-neutral-950 text-white p-4 md:p-8">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Contact support</h1>
          <p className="text-neutral-400 text-sm">
            Have a question or issue? Fill out the form and we'll get back to you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">Name</label>
              <input
                required
                value={form.name}
                onChange={e => set('name', e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">Email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Order number <span className="text-neutral-600">(optional)</span></label>
            <input
              value={form.orderNumber}
              onChange={e => set('orderNumber', e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
              placeholder="STP-XXXXX"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Subject</label>
            <select
              value={form.subject}
              onChange={e => set('subject', e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neutral-600 transition-colors appearance-none cursor-pointer"
            >
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Message</label>
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={e => set('message', e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors resize-none"
              placeholder="Describe your issue…"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-neutral-100 transition-colors disabled:opacity-50 text-sm"
          >
            {isSubmitting ? 'Sending…' : 'Send message'}
          </button>
        </form>
      </div>
    </div>
  );
}
