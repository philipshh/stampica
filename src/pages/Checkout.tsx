import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Loader2, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useT } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { GoogleLoginButton } from '../components/GoogleLoginButton';
import { FramedPoster } from '../components/FramedPoster';
import { Lightbox } from '../components/Lightbox';
import { DIGITAL_PRICE_CENTS, formatPrice } from '../../shared/pricing';
import { POSTER_SIZES } from '../lib/posterSizes';
import { startDigitalCheckout } from '../lib/digitalCheckout';

export function Checkout() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { t } = useT();
  const { items } = useCart();
  const [viewIdx, setViewIdx] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wallImages = items.map(i => i.previewBlobUrl).filter(Boolean);
  const total = items.length * DIGITAL_PRICE_CENTS;

  useEffect(() => {
    if (items.length === 0) navigate('/cart', { replace: true });
  }, [items.length]);

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
    <div className="md:h-full bg-paper md:overflow-hidden">
      <div className="flex flex-col md:flex-row md:h-full">

        {/* Left — the order as a little gallery wall; tap a poster to see it up close */}
        <div className="md:w-1/2 bg-surface border-b md:border-b-0 md:border-r border-line flex-shrink-0 md:h-full md:overflow-y-auto custom-scrollbar">
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
                      <figcaption className="mt-3 text-xs text-ink-soft">
                        {item.size}{item.quantity > 1 ? ` × ${item.quantity}` : ''}
                      </figcaption>
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
                      <figcaption className="mt-3 text-xs text-ink-soft">
                        {item.size}{item.quantity > 1 ? ` × ${item.quantity}` : ''}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right — summary and payment */}
        <div className="md:w-1/2 md:overflow-y-auto p-4 md:p-8 md:h-full">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <button onClick={() => navigate('/cart')} aria-label={t('backToCart')} className="text-ink-faint hover:text-ink transition-colors">
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
                <span>{items.length} × {formatPrice(DIGITAL_PRICE_CENTS)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-soft">{t('checkoutSizes')}</span>
                <span>{t('checkoutAllSizes', { count: POSTER_SIZES.length })}</span>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-line">
                <span className="font-semibold">{t('total')}</span>
                <span className="font-display font-extrabold text-3xl tracking-[-0.02em]">{formatPrice(total)}</span>
              </div>
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
                    : t('payAndDownload', { total: formatPrice(total) })}
                </button>
                {error && <p className="mt-3 text-sm text-vermilion text-center">{error}</p>}
                <p className="mt-4 text-xs text-ink-faint text-center leading-relaxed">
                  {t('checkoutNote', { email: user.email })}
                </p>
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
