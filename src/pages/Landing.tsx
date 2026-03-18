import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GoogleLoginButton } from '../components/GoogleLoginButton';
import { useState } from 'react';

const INSTAGRAM_URL = 'https://instagram.com/stampica.studio';

export function Landing() {
  const { user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 border-b border-neutral-900">
        <span className="font-bold text-lg tracking-tight">Stampica</span>

        <div className="flex items-center gap-4">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-400 hover:text-white transition-colors text-sm"
          >
            Instagram
          </a>

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-400">{user.name}</span>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className="text-sm px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
                >
                  Admin
                </Link>
              )}
              <Link
                to="/orders"
                className="text-sm px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
              >
                Orders
              </Link>
              <button
                onClick={logout}
                className="text-sm text-neutral-500 hover:text-white transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLogin((v) => !v)}
              className="text-sm px-4 py-1.5 rounded-lg border border-neutral-700 hover:border-neutral-400 transition-colors"
            >
              Sign in
            </button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8">
        <div className="space-y-4 max-w-xl">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-none">
            Stampica
          </h1>
          <p className="text-neutral-400 text-lg md:text-xl leading-relaxed">
            Design dithered posters, order prints — delivered to your door.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            to="/create"
            className="px-8 py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-neutral-100 transition-colors text-base"
          >
            Create poster
          </Link>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3.5 border border-neutral-700 text-white font-semibold rounded-xl hover:border-neutral-400 transition-colors text-base"
          >
            See examples
          </a>
        </div>

        {/* Inline login panel */}
        {showLogin && !user && (
          <div className="mt-2 p-6 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col items-center gap-3 w-full max-w-xs">
            <p className="text-sm text-neutral-400">Sign in to order and track prints</p>
            <GoogleLoginButton onSuccess={() => setShowLogin(false)} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-6 py-5 border-t border-neutral-900 flex items-center justify-between text-xs text-neutral-600">
        <span>© {new Date().getFullYear()} Stampica</span>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-neutral-400 transition-colors"
        >
          @stampica.studio
        </a>
      </footer>
    </div>
  );
}
