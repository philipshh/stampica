import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart, CartItem, PosterSize, FrameOption } from '../contexts/CartContext';
import { useT } from '../contexts/LanguageContext';
import { SIZE_PRICE, FRAME_EXTRA, SHIPPING_COST, FREE_SHIPPING_THRESHOLD, itemPrice as itemTotal } from '../../shared/pricing';

const SIZES: PosterSize[] = ['A5', 'A4', 'A3'];
const FRAMES: FrameOption[] = ['none', 'black', 'white'];


export function Cart() {
  const { items, removeItem, updateItem } = useCart();
  const { t } = useT();
  const navigate = useNavigate();

  const subtotal = items.reduce((sum, i) => sum + itemTotal(i), 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="min-h-full bg-paper flex flex-col items-center justify-center p-8 text-center">
        <ShoppingBag size={48} className="text-ink-faint mb-4" />
        <h1 className="text-xl font-bold text-ink mb-2">{t('cartEmpty')}</h1>
        <p className="text-ink-faint text-sm mb-6">{t('cartEmptyDesc')}</p>
        <Link to="/create" className="bg-ink text-paper font-semibold px-6 py-3 rounded-xl hover:bg-black transition-colors text-sm">
          {t('backToEditor')}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-paper text-ink p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate(-1)} className="text-ink-faint hover:text-ink transition-colors p-1">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">{t('yourCart')}</h1>
          <span className="text-sm text-ink-faint">{items.length} {items.length === 1 ? t('item') : t('items')}</span>
        </div>

        {/* Items */}
        <div className="space-y-3 mb-6">
          {items.map(item => (
            <CartItemRow key={item.id} item={item} onRemove={removeItem} onUpdate={updateItem} />
          ))}
        </div>

        {/* Summary */}
        <div className="bg-surface border border-line rounded-2xl p-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-ink-soft">{t('subtotal')}</span>
            <span>{subtotal} din</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-soft">{t('shipping')}</span>
            {shipping === 0
              ? <span className="text-green-400">{t('freeShipping')}</span>
              : <span>{shipping} din</span>
            }
          </div>
          {shipping > 0 && (
            <p className="text-[11px] text-ink-faint">{t('freeShippingNote', { amount: FREE_SHIPPING_THRESHOLD })}</p>
          )}
          <div className="flex justify-between pt-3 border-t border-line">
            <span className="font-semibold">{t('total')}</span>
            <span className="text-2xl font-bold">{total} din</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/checkout')}
          className="w-full mt-4 bg-ink text-paper font-bold py-4 rounded-xl hover:bg-black transition-colors text-base"
        >
          {t('proceedToCheckout')}
        </button>
        <div className="h-8" />
      </div>
    </div>
  );
}

function CartItemRow({ item, onRemove, onUpdate }: {
  item: CartItem;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Pick<CartItem, 'size' | 'quantity' | 'frame'>>) => void;
}) {
  const { t } = useT();

  const frameLabels: Record<FrameOption, string> = {
    none: t('noFrame'),
    black: t('blackFrame'),
    white: t('whiteFrame'),
  };

  return (
    <div className="bg-surface border border-line rounded-2xl overflow-hidden">
      <div className="flex gap-4 p-4">
        {/* Preview */}
        {item.previewBlobUrl ? (
          <img src={item.previewBlobUrl} alt="Poster" className="w-20 object-contain rounded-lg border border-line flex-shrink-0 self-start" />
        ) : (
          <div className="w-20 aspect-[1/1.41] bg-paper rounded-lg flex-shrink-0" />
        )}

        <div className="flex-1 min-w-0 space-y-3">
          {/* Size */}
          <div>
            <label className="block text-xs text-ink-faint mb-1">{t('size')}</label>
            <div className="flex gap-1.5">
              {SIZES.map(s => (
                <button key={s} type="button" onClick={() => onUpdate(item.id, { size: s })}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                    item.size === s ? 'bg-ink text-paper border-transparent' : 'bg-paper text-ink-soft border-line hover:border-ink/40'
                  }`}
                >
                  {s} <span className="opacity-60">{SIZE_PRICE[s]} din</span>
                </button>
              ))}
            </div>
          </div>

          {/* Frame */}
          <div>
            <label className="block text-xs text-ink-faint mb-1">{t('framing')}</label>
            <div className="flex gap-1.5 flex-wrap">
              {FRAMES.map(f => (
                <button key={f} type="button" onClick={() => onUpdate(item.id, { frame: f })}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                    item.frame === f ? 'bg-ink text-paper border-transparent' : 'bg-paper text-ink-soft border-line hover:border-ink/40'
                  }`}
                >
                  {frameLabels[f]}{FRAME_EXTRA[f] > 0 ? ` +${FRAME_EXTRA[f]}` : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Qty + price row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => onUpdate(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                className="w-7 h-7 rounded-lg border border-line flex items-center justify-center text-sm font-medium text-ink hover:bg-line/40 transition-colors">−</button>
              <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
              <button onClick={() => onUpdate(item.id, { quantity: Math.min(20, item.quantity + 1) })}
                className="w-7 h-7 rounded-lg border border-line flex items-center justify-center text-sm font-medium text-ink hover:bg-line/40 transition-colors">+</button>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-ink">{itemTotal(item)} din</span>
              <button onClick={() => onRemove(item.id)} className="text-ink-faint hover:text-red-400 transition-colors p-1">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
