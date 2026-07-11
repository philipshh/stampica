import { useState, useEffect } from 'react';
import { API_BASE } from '../lib/api';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useT } from '../contexts/LanguageContext';
import { CheckCircle } from 'lucide-react';


const SUBJECTS = [
  'Question about my order',
  'Order not received',
  'Wrong item received',
  'Request a cancellation',
  'Print quality issue',
  'Other',
];

interface Order {
  id: string;
  order_number: string;
  size: string;
  status: string;
}

export function Support() {
  const { user, token } = useAuth();
  const { t } = useT();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    orderNumber: searchParams.get('order') ?? '',
    subject: SUBJECTS[0],
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((data: { orders?: Order[] }) => setOrders(data.orders ?? []))
      .catch(() => {});
  }, [token]);

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
          <h2 className="text-xl font-bold text-white mb-2">{t('messageSent')}</h2>
          <p className="text-neutral-400 text-sm">{t('messageSentDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-neutral-950 text-white p-4 md:p-8">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">{t('contactSupportTitle')}</h1>
          <p className="text-neutral-400 text-sm">{t('contactSupportDesc')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">{t('name')}</label>
              <input
                required
                value={form.name}
                onChange={e => set('name', e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
                placeholder={t('yourName')}
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">{t('email')}</label>
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
            <label className="block text-xs text-neutral-400 mb-1.5">{t('orderOptional')}</label>
            {orders.length > 0 ? (
              <select
                value={form.orderNumber}
                onChange={e => set('orderNumber', e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neutral-600 transition-colors appearance-none cursor-pointer"
              >
                <option value="">{t('noSpecificOrder')}</option>
                {orders.map(o => (
                  <option key={o.id} value={o.order_number}>
                    #{o.order_number} — {o.size} · {o.status}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={form.orderNumber}
                onChange={e => set('orderNumber', e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
                placeholder="STP-XXXXX"
              />
            )}
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">{t('subject')}</label>
            <select
              value={form.subject}
              onChange={e => set('subject', e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neutral-600 transition-colors appearance-none cursor-pointer"
            >
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">{t('message')}</label>
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={e => set('message', e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors resize-none"
              placeholder={t('describeIssue')}
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-neutral-100 transition-colors disabled:opacity-50 text-sm"
          >
            {isSubmitting ? t('sending') : t('sendMessage')}
          </button>
        </form>
      </div>
    </div>
  );
}
