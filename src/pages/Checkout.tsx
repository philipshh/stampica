import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Loader2, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useT } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { GoogleLoginButton } from '../components/GoogleLoginButton';
import { FramedPoster } from '../components/FramedPoster';
import { Lightbox } from '../components/Lightbox';
import { freeCount, orderTotalCents, unitPriceCents, formatPrice } from '../../shared/pricing';
import { startDigitalCheckout } from '../lib/digitalCheckout';
import { API_BASE } from '../lib/api';

export function Checkout() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { t, lang } = useT();
  const { items, ready } = useCart();
  const [viewIdx, setViewIdx] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wallImages = items.map(i => i.previewBlobUrl).filter(Boolean);
  const unit = unitPriceCents();
  const free = freeCount(items.length);
  const total = orderTotalCents(items.length);
  const [testMode, setTestMode] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then(r => r.json())
      .then((d: { payments?: string }) => setTestMode(d.payments === 'test'))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (ready && items.length === 0) navigate('/cart', { replace: true });
  }, [ready, items.length]);

  async function pay() {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      // The cart is kept until payment is confirmed on the download page.
      const url = await startDigitalCheckout(items, token, (done, all) => setProgress([done, all]));
      window.location.href = url;
    } catch (err) {
      console.error('[checkout]', err);
      setError(t('checkoutError'));
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <div className="bg-paper">
      <div className="flex flex-col md:flex-row">

        {/* Left — the order as a little gallery wall; tap a poster to see it up close */}
        <div className="order-2 md:order-1 md:w-1/2 md:min-h-[calc(100dvh-72px)] bg-surface border-t md:border-t-0 md:border-r border-line flex-shrink-0">
          <div className="p-6 md:p-10">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="font-display font-extrabold text-2xl tracking-[-0.02em]">
                {t('yourPosters', { count: items.length })}
              </h2>
              {wallImages.length > 0 && <span className="text-xs text-ink-faint">{t('tapToView')}</span>}
            </div>
            {wallImages.length === 0 ? (
              <div className="w-full aspect-[1/1.41] max-w-xs mx-auto bg-paper rounded-xl flex items-center justify-center text-ink-faint text-sm">
                {t('noPreview')}
              </div>
            ) : (
              <>
                {/* Phones: swipe through the wall */}
                <div className="md:hidden no-scrollbar flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-px-6 -mx-6 px-6 pb-2">
                  {items.map((item, i) => item.previewBlobUrl && (
                    <figure key={item.id} className={`snap-start shrink-0 ${items.length === 1 ? 'w-full max-w-[280px] mx-auto' : 'w-[68%]'}`}>
                      <button
                        onClick={() => setViewIdx(wallImages.indexOf(item.previewBlobUrl))}
                        aria-label={t('viewPoster', { n: i + 1 })}
                        className="block w-full text-left"
                      >
                        <FramedPoster src={item.previewBlobUrl} eager />
                      </button>
                    </figure>
                  ))}
                </div>
                {/* Desktop: masonry wall */}
                <div className={`hidden md:block ${items.length === 1 ? 'max-w-sm mx-auto' : `gap-6 ${items.length <= 4 ? 'columns-2' : 'columns-2 lg:columns-3'}`}`}>
                  {items.map((item, i) => item.previewBlobUrl && (
                    <figure key={item.id} className="break-inside-avoid mb-6">
                      <button
                        onClick={() => setViewIdx(wallImages.indexOf(item.previewBlobUrl))}
                        aria-label={t('viewPoster', { n: i + 1 })}
                        className="block w-full text-left focus-visible:outline-offset-4"
                      >
                        <FramedPoster src={item.previewBlobUrl} eager className="poster-lift" />
                      </button>
                    </figure>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right — summary and payment */}
        <div className="order-1 md:order-2 md:w-1/2 p-4 pt-6 md:p-8 md:sticky md:top-[72px] md:self-start">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <button onClick={() => navigate('/cart')} aria-label={t('backToCart')} className="-ml-2 w-11 h-11 flex items-center justify-center text-ink-faint hover:text-ink transition-colors">
                <ArrowLeft size={20} />
              </button>
              <div className="w-10 h-10 rounded-xl bg-surface border border-line flex items-center justify-center">
                <ShoppingBag className="text-ink" size={20} />
              </div>
              <h1 className="text-2xl font-bold text-ink">{t('checkoutTitle')}</h1>
            </div>

            <div className="bg-surface rounded-2xl border border-line p-5 space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-ink-soft">{t('checkoutDesigns', { count: items.length })}</span>
                <span>{items.length} × {formatPrice(unit, lang)}</span>
              </div>
              {free > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-ink-soft">{t('bundleLine')}</span>
                  <span className="font-semibold text-vermilion">−{formatPrice(free * unit, lang)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-ink-soft">{t('checkoutSizes')}</span>
                <span>{t('checkoutAllSizes')}</span>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-line">
                <span className="font-semibold">{t('total')}</span>
                <span className="font-display font-extrabold text-3xl tracking-[-0.02em]">{formatPrice(total, lang)}</span>
              </div>
              {lang === 'sr' && <p className="text-xs text-ink-faint">{t('priceApproxNote', { usd: formatPrice(total) })}</p>}
            </div>

            {!user ? (
              <div className="bg-surface rounded-2xl p-6 text-center border border-line">
                <p className="text-ink-soft mb-4 text-sm">{t('signInToBuy')}</p>
                <div className="flex justify-center">
                  <GoogleLoginButton />
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={pay}
                  disabled={busy}
                  className="press w-full bg-ink text-paper font-semibold py-4 rounded-full hover:bg-black disabled:opacity-60 transition-colors text-base flex items-center justify-center gap-2"
                >
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <Lock size={16} />}
                  {busy
                    ? (progress ? t('checkoutUploading', { done: progress[0], total: progress[1] }) : t('checkoutPreparing'))
                    : t('payAndDownload', { total: formatPrice(total, lang) })}
                </button>
                {error && <p className="mt-3 text-sm text-vermilion text-center">{error}</p>}
                <p className="mt-4 text-xs text-ink-faint text-center leading-relaxed">
                  {t('checkoutNote', { email: user.email })}
                </p>
                <p className="mt-2 text-xs text-ink-faint text-center leading-relaxed">
                  {t('checkoutRights')} <Link to="/terms" className="underline hover:text-ink">{t('terms')}</Link>
                </p>
                {testMode && (
                  <div className="mt-4 rounded-xl border border-vermilion/40 p-3 text-xs text-ink-soft leading-relaxed">
                    <p className="font-semibold text-vermilion uppercase tracking-wider mb-1">{t('dlTestMode')}</p>
                    <p>{t('checkoutTestCard')}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {viewIdx !== null && (
        <Lightbox srcs={wallImages} initialIndex={viewIdx} alt={t('yourPosters', { count: items.length })} onClose={() => setViewIdx(null)} />
      )}
    </div>
  );
}
