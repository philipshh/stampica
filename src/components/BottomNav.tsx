import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Pencil, Package, Languages } from 'lucide-react';
import { useT } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';

/** Phone-only tab bar for the regular pages (the editor keeps its own action bar). */
export function BottomNav() {
  const { lang, setLang, t } = useT();
  const { items } = useCart();
  const { pathname } = useLocation();
  const count = items.length;

  const tab = 'press flex-1 flex flex-col items-center justify-center gap-1 h-14 text-[11px] font-medium transition-colors';
  const tone = (active: boolean) => (active ? 'text-ink' : 'text-ink-faint');

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-paper/95 backdrop-blur border-t border-line pb-[env(safe-area-inset-bottom)]"
      aria-label="Main"
    >
      <div className="flex">
        <Link to="/create" className={`${tab} ${tone(pathname === '/create')}`}>
          <Pencil size={20} />
          {t('create')}
        </Link>
        <Link to="/orders" className={`${tab} ${tone(pathname === '/orders' || pathname.startsWith('/downloads'))}`}>
          <Package size={20} />
          {t('orders')}
        </Link>
        <Link to="/cart" className={`${tab} ${tone(pathname === '/cart' || pathname === '/checkout')}`}>
          <span className="relative">
            <ShoppingCart size={20} />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 flex items-center justify-center bg-vermilion text-paper text-[9px] font-bold rounded-full leading-none">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </span>
          {t('cartShort')}
        </Link>
        <button
          onClick={() => setLang(lang === 'en' ? 'sr' : 'en')}
          className={`${tab} text-ink-faint`}
          aria-label={lang === 'en' ? 'Srpski' : 'English'}
        >
          <Languages size={20} />
          {lang === 'en' ? 'Srpski' : 'English'}
        </button>
      </div>
    </nav>
  );
}
