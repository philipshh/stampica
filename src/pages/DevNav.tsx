import { useState, useEffect } from 'react';
import { API_BASE } from '../lib/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PAGES = [
  { path: '/',         label: 'Landing',          desc: 'Public landing page' },
  { path: '/create',   label: 'Editor',            desc: 'Poster design editor' },
  { path: '/checkout', label: 'Checkout',          desc: 'Order form (requires login)' },
  { path: '/orders',   label: 'Order Tracking',    desc: 'Customer order history' },
  { path: '/admin',    label: 'Admin Dashboard',   desc: 'Order management (admin only)' },
  { path: '/dev',      label: 'Dev Nav',           desc: 'This page' },
];

export function DevNav() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-paper text-ink p-8">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Dev Navigation</h1>
          <p className="text-ink-faint text-sm">All pages in the app</p>
        </div>

        {/* Auth status */}
        <div className="mb-6 p-4 bg-surface border border-line rounded-xl text-sm">
          {user ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-ink-soft">{user.name}</p>
                <p className="text-ink-faint text-xs">{user.email}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                user.role === 'admin'
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              }`}>
                {user.role}
              </span>
            </div>
          ) : (
            <p className="text-ink-faint">Not signed in</p>
          )}
        </div>

        {/* Pages list */}
        <div className="space-y-2">
          {PAGES.map(({ path, label, desc }) => (
            <Link
              key={path}
              to={path}
              className="flex items-center justify-between p-4 bg-surface border border-line rounded-xl hover:border-ink/25 transition-colors group"
            >
              <div>
                <p className="font-medium text-ink group-hover:text-ink">{label}</p>
                <p className="text-xs text-ink-faint mt-0.5">{desc}</p>
              </div>
              <span className="font-mono text-xs text-ink-faint group-hover:text-ink-soft transition-colors">
                {path}
              </span>
            </Link>
          ))}
        </div>

        {/* Backend health */}
        <div className="mt-6">
          <BackendStatus />
        </div>
      </div>
    </div>
  );
}

function BackendStatus() {
  const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  
  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then((r) => setStatus(r.ok ? 'ok' : 'error'))
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div className="p-4 bg-surface border border-line rounded-xl flex items-center justify-between text-sm">
      <span className="text-ink-soft">Backend ({API_BASE})</span>
      <span className={`flex items-center gap-1.5 text-xs font-medium ${
        status === 'ok' ? 'text-green-400' : status === 'error' ? 'text-red-400' : 'text-ink-soft'
      }`}>
        <span className={`w-2 h-2 rounded-full ${
          status === 'ok' ? 'bg-green-400' : status === 'error' ? 'bg-red-400' : 'bg-neutral-400 animate-pulse'
        }`} />
        {status === 'checking' ? 'Checking…' : status === 'ok' ? 'Online' : 'Offline'}
      </span>
    </div>
  );
}

