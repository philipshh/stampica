import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart, CartItem, PosterSize, FrameOption } from '../contexts/CartContext';
import { useT } from '../contexts/LanguageContext';

const SIZES: PosterSize[] = ['A5', 'A4', 'A3'];
const FRAMES: FrameOption[] = ['none', 'black', 'white'];

const SIZE_PRICE: Record<PosterSize, number> = { A5: 700, A4: 900, A3: 1100 };
const FRAME_EXTRA: Record<FrameOption, number> = { none: 0, black: 1000, white: 1000 };
const SHIPPING_COST = 200;
const FREE_SHIPPING_THRESHOLD = 4000;

function itemTotal(item: CartItem) {
  return (SIZE_PRICE[item.size] + FRAME_EXTRA[item.frame]) * item.quantity;
}

export function Cart() {
  const { items, removeItem, updateItem } = useCart();
  const { t } = useT();
  const navigate = useNavigate();

  const subtotal = items.reduce((sum, i) => sum + itemTotal(i), 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="min-h-full bg-neutral-950 flex flex-col items-center justify-center p-8 text-center">
        <ShoppingBag size={48} className="text-neutral-700 mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">{t('cartEmpty')}</h1>
        <p className="text-neutral-500 text-sm mb-6">{t('cartEmptyDesc')}</p>
        <Link to="/create" className="bg-white text-black font-semibold px-6 py-3 rounded-xl hover:bg-neutral-100 transition-colors text-sm">
          {t('backToEditor')}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-neutral-950 text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate(-1)} className="text-neutral-500 hover:text-white transition-colors p-1">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">{t('yourCart')}</h1>
          <span className="text-sm text-neutral-500">{items.length} {items.length === 1 ? t('item') : t('items')}</span>
        </div>

        {/* Items */}
        <div className="space-y-3 mb-6">
          {items.map(item => (
            <CartItemRow key={item.id} item={item} onRemove={removeItem} onUpdate={updateItem} />
          ))}
        </div>

        {/* Summary */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">{t('subtotal')}</span>
            <span>{subtotal} din</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">{t('shipping')}</span>
            {shipping === 0
              ? <span className="text-green-400">{t('freeShipping')}</span>
              : <span>{shipping} din</span>
            }
          </div>
          {shipping > 0 && (
            <p className="text-[11px] text-neutral-600">{t('freeShippingNote', { amount: FREE_SHIPPING_THRESHOLD })}</p>
          )}
          <div className="flex justify-between pt-3 border-t border-neutral-800">
            <span className="font-semibold">{t('total')}</span>
            <span className="text-2xl font-bold">{total} din</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/checkout')}
          className="w-full mt-4 bg-white text-black font-bold py-4 rounded-xl hover:bg-neutral-100 transition-colors text-base"
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
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
      <div className="flex gap-4 p-4">
        {/* Preview */}
        {item.previewBlobUrl ? (
          <img src={item.previewBlobUrl} alt="Poster" className="w-20 object-contain rounded-lg border border-neutral-700 flex-shrink-0 self-start" />
        ) : (
          <div className="w-20 aspect-[1/1.41] bg-neutral-800 rounded-lg flex-shrink-0" />
        )}

        <div className="flex-1 min-w-0 space-y-3">
          {/* Size */}
          <div>
            <label className="block text-xs text-neutral-500 mb-1">{t('size')}</label>
            <div className="flex gap-1.5">
              {SIZES.map(s => (
                <button key={s} type="button" onClick={() => onUpdate(item.id, { size: s })}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                    item.size === s ? 'bg-white text-black border-transparent' : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:border-neutral-500'
                  }`}
                >
                  {s} <span className="opacity-60">{SIZE_PRICE[s]} din</span>
                </button>
              ))}
            </div>
          </div>

          {/* Frame */}
          <div>
            <label className="block text-xs text-neutral-500 mb-1">{t('framing')}</label>
            <div className="flex gap-1.5 flex-wrap">
              {FRAMES.map(f => (
                <button key={f} type="button" onClick={() => onUpdate(item.id, { frame: f })}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                    item.frame === f ? 'bg-white text-black border-transparent' : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:border-neutral-500'
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
                className="w-7 h-7 rounded-lg border border-neutral-700 flex items-center justify-center text-sm font-medium text-white hover:bg-neutral-800 transition-colors">−</button>
              <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
              <button onClick={() => onUpdate(item.id, { quantity: Math.min(20, item.quantity + 1) })}
                className="w-7 h-7 rounded-lg border border-neutral-700 flex items-center justify-center text-sm font-medium text-white hover:bg-neutral-800 transition-colors">+</button>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-white">{itemTotal(item)} din</span>
              <button onClick={() => onRemove(item.id)} className="text-neutral-600 hover:text-red-400 transition-colors p-1">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
