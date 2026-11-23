import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useT } from '../contexts/LanguageContext';
import { FramedPoster } from '../components/FramedPoster';
import { DIGITAL_PRICE_CENTS, formatPrice } from '../../shared/pricing';

// Digital cart: one entry per design. Every design unlocks all sizes, so there
// are no size, frame or quantity choices here.
const MAX_ITEMS = 20;

export function Cart() {
  const { items, ready, removeItem } = useCart();
  const { t } = useT();
  const navigate = useNavigate();
  const total = items.length * DIGITAL_PRICE_CENTS;

  if (!ready) return <div className="min-h-[60vh] bg-paper" />;

  if (items.length === 0) {
    return (
      <div className="min-h-full bg-paper flex flex-col items-center justify-center p-8 text-center">
        <ShoppingBag size={48} className="text-ink-faint mb-4" />
        <h1 className="text-xl font-bold text-ink mb-2">{t('cartEmpty')}</h1>
        <p className="text-ink-faint text-sm mb-6">{t('cartEmptyDesc')}</p>
        <Link to="/create" className="bg-ink text-paper font-semibold px-6 py-3 rounded-full hover:bg-black transition-colors text-sm">
          {t('backToEditor')}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-paper text-ink px-4 py-8 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate(-1)} aria-label={t('backToEditor')} className="text-ink-faint hover:text-ink transition-colors p-1">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl tracking-[-0.02em]">{t('yourCart')}</h1>
          <span className="text-sm text-ink-faint">{items.length} {items.length === 1 ? t('item') : t('items')}</span>
        </div>
        <p className="text-sm text-ink-soft mb-8 ml-10">{t('cartAllSizesNote')}</p>

        <div className="grid md:grid-cols-[1fr_320px] gap-8 md:gap-10 items-start">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {items.map(item => (
            <figure key={item.id}>
              {item.previewBlobUrl
                ? <FramedPoster src={item.previewBlobUrl} eager />
                : <div className="aspect-[1/1.41] bg-surface border border-line" />}
              <figcaption className="mt-3 flex items-center justify-between text-sm">
                <span className="font-semibold">{formatPrice(DIGITAL_PRICE_CENTS)}</span>
                <button onClick={() => removeItem(item.id)} aria-label={t('removeItem')} className="text-ink-faint hover:text-vermilion transition-colors p-1">
                  <Trash2 size={15} />
                </button>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="bg-surface border border-line rounded-2xl p-5 md:sticky md:top-24">
          <div className="flex justify-between items-baseline">
            <span className="font-semibold">{t('total')}</span>
            <span className="font-display font-extrabold text-3xl tracking-[-0.02em]">{formatPrice(total)}</span>
          </div>
          {items.length > MAX_ITEMS && <p className="mt-2 text-xs text-vermilion">{t('cartTooMany', { max: MAX_ITEMS })}</p>}
          <button
            onClick={() => navigate('/checkout')}
            disabled={items.length > MAX_ITEMS}
            className="press w-full mt-4 bg-ink text-paper font-semibold py-4 rounded-full hover:bg-black disabled:opacity-50 transition-colors text-base"
          >
            {t('proceedToCheckout')}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
