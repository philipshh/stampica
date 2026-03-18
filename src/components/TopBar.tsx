import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GoogleLoginButton } from './GoogleLoginButton';

export function TopBar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showLogin, setShowLogin] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close login popover on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowLogin(false);
      }
    }
    if (showLogin) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showLogin]);

  // Close popover on route change
  useEffect(() => { setShowLogin(false); }, [location.pathname]);

  function navLink(to: string, label: string) {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
          active
            ? 'bg-neutral-800 text-white'
            : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
        }`}
      >
        {label}
      </Link>
    );
  }

  return (
    <header className="h-[88px] flex-shrink-0 flex items-center justify-between px-5 bg-neutral-950 border-b border-neutral-800 z-50">
      {/* Logo */}
      <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
        <img src="/logo.png" alt="Stampica" className="h-10 w-auto object-contain" />
      </Link>

      {/* Nav + auth */}
      <div className="flex items-center gap-1">
        {navLink('/create', 'Create')}
        {user && navLink('/orders', 'Orders')}
        {user?.role === 'admin' && navLink('/admin', 'Admin')}

        <div className="w-px h-4 bg-neutral-800 mx-2" />

        {user ? (
          <>
            <span className="text-xs text-neutral-500 max-w-[120px] truncate hidden sm:block">
              {user.name}
            </span>
            <button
              onClick={logout}
              className="text-sm px-3 py-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition-colors"
            >
              Sign out
            </button>
          </>
        ) : (
          <div ref={popoverRef} className="relative">
            <button
              onClick={() => setShowLogin((v) => !v)}
              className="text-sm px-3 py-1.5 rounded-lg border border-neutral-700 text-neutral-300 hover:border-neutral-500 hover:text-white transition-colors"
            >
              Sign in
            </button>
            {showLogin && (
              <div className="absolute right-0 top-full mt-2 p-4 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl flex flex-col items-center gap-2 w-64 z-50">
                <p className="text-xs text-neutral-500 text-center">Sign in to order and track prints</p>
                <GoogleLoginButton onSuccess={() => setShowLogin(false)} />
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
