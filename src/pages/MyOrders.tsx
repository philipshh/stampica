import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useT } from '../contexts/LanguageContext';
import { API_BASE } from '../lib/api';
import { GoogleLoginButton } from '../components/GoogleLoginButton';
import { PrintGuide } from '../components/PrintGuide';

interface OrderSummary {
  id: string;
  orderNumber: string;
  itemCount: number;
  paidAt: string;
  previewUrls: string[];
}

export function MyOrders() {
  const { user, token } = useAuth();
  const { t, lang } = useT();
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/digital/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { orders: OrderSummary[] }) => setOrders(d.orders))
      .catch(() => setError(true));
  }, [token]);

  const date = (iso: string) => new Date(iso).toLocaleDateString(lang === 'sr' ? 'sr-Latn-RS' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-full bg-paper text-ink px-6 py-10 md:py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display font-extrabold text-4xl md:text-5xl tracking-[-0.02em] mb-10">{t('myOrdersTitle')}</h1>

        {!user ? (
          <div className="max-w-md bg-surface rounded-2xl p-6 border border-line">
            <p className="text-ink-soft mb-4 text-sm">{t('myOrdersSignIn')}</p>
            <GoogleLoginButton />
          </div>
        ) : error ? (
          <p className="text-ink-soft">{t('myOrdersError')}</p>
        ) : orders === null ? (
          <Loader2 size={20} className="animate-spin text-ink-faint" />
        ) : orders.length === 0 ? (
          <div className="space-y-4">
            <p className="text-ink-soft">{t('myOrdersEmpty')}</p>
            <Link to="/create" className="inline-block bg-ink text-paper font-semibold px-6 py-3 rounded-full hover:bg-black transition-colors text-sm">{t('create')}</Link>
          </div>
        ) : (
          <>
          <PrintGuide className="mb-6" />
          <ul className="space-y-4">
            {orders.map(o => (
              <li key={o.id}>
                <Link to={`/downloads/${o.id}`} className="flex items-center gap-4 bg-surface border border-line rounded-2xl p-4 hover:border-ink/30 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{t('checkoutDesigns', { count: o.itemCount })}</p>
                    <p className="text-sm text-ink-faint">{date(o.paidAt)}</p>
                    <p className="text-xs text-ink-faint truncate">#{o.orderNumber}</p>
                  </div>
                  <div className="flex -space-x-7 shrink-0">
                    {o.previewUrls.slice(0, 3).map((u, i) => (
                      <img key={i} src={u} alt="" className="w-11 sm:w-14 h-auto border-[3px] border-ink bg-white shadow-card" style={{ zIndex: 10 - i }} />
                    ))}
                  </div>
                  <span className="text-sm font-semibold whitespace-nowrap" aria-hidden="true"><span className="hidden sm:inline">{t('dlDownload')} </span>→</span>
                </Link>
              </li>
            ))}
          </ul>
          </>
        )}
      </div>
    </div>
  );
}
