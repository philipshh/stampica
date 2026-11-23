import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Pencil, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useT } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { GoogleLoginButton } from './GoogleLoginButton';

export function TopBar() {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useT();
  const { items } = useCart();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cartCount = items.length;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDropdown]);

  useEffect(() => { setShowDropdown(false); }, [location.pathname]);

  function navLink(to: string, label: string) {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        className={`hidden md:inline-flex text-sm px-3 py-1.5 rounded-lg transition-colors ${
          active
            ? 'bg-ink text-paper'
            : 'text-ink-soft hover:text-ink hover:bg-line/50'
        }`}
      >
        {label}
      </Link>
    );
  }

  function iconLink(to: string, icon: React.ReactNode, label: string) {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        aria-label={label}
        className={`md:hidden flex flex-col items-center justify-center gap-0.5 min-w-12 px-1 h-12 rounded-lg transition-colors ${
          active
            ? 'bg-ink text-paper'
            : 'text-ink-soft hover:text-ink hover:bg-line/50'
        }`}
      >
        {icon}
        <span className="text-[10px] font-medium leading-none">{label}</span>
      </Link>
    );
  }

  const initials = user?.name
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '';

  return (
    <header className="sticky top-0 h-16 md:h-[72px] flex-shrink-0 flex items-center justify-between pl-4 pr-3 md:px-5 bg-paper/90 backdrop-blur border-b border-line z-50 pt-[env(safe-area-inset-top)] box-content">
      <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
        <img src="/logo.png" alt="Stampica" className="h-9 w-auto object-contain" />
      </Link>

      <div className="flex items-center gap-1">
        {/* Desktop text nav */}
        {navLink('/create', t('create'))}
        {user && navLink('/orders', t('orders'))}

        {/* Mobile icon nav */}
        {iconLink('/create', <Pencil size={17} />, t('create'))}
        {user && iconLink('/orders', <Package size={17} />, t('orders'))}

        <div className="w-px h-4 bg-line mx-1 md:mx-2" />

        {/* Cart icon */}
        <Link
          to="/cart"
          aria-label={t('viewCart')}
          className={`relative flex flex-col items-center justify-center gap-0.5 w-12 h-12 md:w-9 md:h-9 rounded-lg transition-colors ${location.pathname === '/cart' ? 'bg-ink text-paper md:bg-transparent md:text-ink' : 'text-ink-soft hover:text-ink hover:bg-line/50'}`}
        >
          <ShoppingCart size={18} />
          <span className="md:hidden text-[10px] font-medium leading-none">{t('cartShort')}</span>
          {cartCount > 0 && (
            <span className="absolute top-0.5 right-1 md:-top-0.5 md:-right-0.5 w-4 h-4 flex items-center justify-center bg-vermilion text-paper text-[9px] font-bold rounded-full leading-none">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </Link>

        {/* Language toggle */}
        <button
          onClick={() => setLang(lang === 'en' ? 'sr' : 'en')}
          className="text-xs font-semibold w-11 h-11 md:w-auto md:h-auto md:px-2 md:py-1 rounded-lg text-ink-faint hover:text-ink hover:bg-line/50 transition-colors"
          aria-label={lang === 'en' ? 'Srpski' : 'English'}
        >
          {lang === 'en' ? 'SR' : 'EN'}
        </button>

        <div className="w-px h-4 bg-line mx-1" />

        {user ? (
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setShowDropdown(v => !v)}
              aria-label={user.name}
              className="flex items-center gap-2 rounded-lg p-1.5 md:p-1 hover:bg-line/50 transition-colors"
            >
              {user.picture ? (
                <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center text-xs font-semibold text-paper flex-shrink-0">
                  {initials}
                </div>
              )}
              <span className="text-xs text-ink-soft max-w-[100px] truncate hidden sm:block">{user.name}</span>
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 bg-surface border border-line rounded-xl shadow-card w-44 z-50 overflow-hidden">
                <div className="px-3 py-2.5 border-b border-line">
                  <p className="text-xs font-medium text-ink truncate">{user.name}</p>
                  <p className="text-[11px] text-ink-faint truncate">{user.email}</p>
                </div>
                <button
                  onClick={() => { setShowDropdown(false); logout(); }}
                  className="w-full text-left px-3 py-2.5 text-sm text-ink-soft hover:text-ink hover:bg-line/50 transition-colors"
                >
                  {t('signOut')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <GoogleLoginButton />
        )}
      </div>
    </header>
  );
}
