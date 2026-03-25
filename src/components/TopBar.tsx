import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Pencil, Package, ShieldCheck } from 'lucide-react';
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
            ? 'bg-neutral-800 text-white'
            : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
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
        title={label}
        className={`md:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
          active
            ? 'bg-neutral-800 text-white'
            : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
        }`}
      >
        {icon}
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
    <header className="h-[88px] flex-shrink-0 flex items-center justify-between px-5 bg-neutral-950 border-b border-neutral-800 z-50">
      <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
        <img src="/logo.png" alt="Stampica" className="h-10 w-auto object-contain" />
      </Link>

      <div className="flex items-center gap-1">
        {/* Desktop text nav */}
        {navLink('/create', t('create'))}
        {user && navLink('/orders', t('orders'))}
        {user?.role === 'admin' && navLink('/admin', 'Admin')}

        {/* Mobile icon nav */}
        {iconLink('/create', <Pencil size={17} />, t('create'))}
        {user && iconLink('/orders', <Package size={17} />, t('orders'))}
        {user?.role === 'admin' && iconLink('/admin', <ShieldCheck size={17} />, 'Admin')}

        <div className="w-px h-4 bg-neutral-800 mx-1 md:mx-2" />

        {/* Cart icon */}
        <Link
          to="/cart"
          title={t('viewCart')}
          className="relative flex items-center justify-center w-9 h-9 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition-colors"
        >
          <ShoppingCart size={18} />
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center bg-white text-black text-[9px] font-bold rounded-full leading-none">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </Link>

        {/* Language toggle */}
        <button
          onClick={() => setLang(lang === 'en' ? 'sr' : 'en')}
          className="text-xs font-medium px-2 py-1 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800/60 transition-colors"
          title="Switch language"
        >
          {lang === 'en' ? 'SR' : 'EN'}
        </button>

        <div className="w-px h-4 bg-neutral-800 mx-1" />

        {user ? (
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setShowDropdown(v => !v)}
              className="flex items-center gap-2 rounded-lg p-1 hover:bg-neutral-800/60 transition-colors"
            >
              {user.picture ? (
                <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
                  {initials}
                </div>
              )}
              <span className="text-xs text-neutral-400 max-w-[100px] truncate hidden sm:block">{user.name}</span>
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl w-44 z-50 overflow-hidden">
                <div className="px-3 py-2.5 border-b border-neutral-800">
                  <p className="text-xs font-medium text-white truncate">{user.name}</p>
                  <p className="text-[11px] text-neutral-500 truncate">{user.email}</p>
                </div>
                <button
                  onClick={() => { setShowDropdown(false); logout(); }}
                  className="w-full text-left px-3 py-2.5 text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
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
