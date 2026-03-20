import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Package, Printer, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Lightbox } from '../components/Lightbox';
import { SkeletonCard } from '../components/Skeleton';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

type OrderStatus = 'pending' | 'confirmed' | 'printing' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  order_number: string;
  size: string;
  quantity: number;
  status: OrderStatus;
  shipping_address: string;
  tracking_number: string | null;
  preview_url: string | null;
  created_at: string;
}

const STATUS_STEPS: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
  { status: 'pending',   label: 'Received',  icon: Clock },
  { status: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { status: 'printing',  label: 'Printing',  icon: Printer },
  { status: 'shipped',   label: 'Shipped',   icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: Package },
];

const STATUS_ORDER: Record<OrderStatus, number> = {
  pending: 0, confirmed: 1, printing: 2, shipped: 3, delivered: 4, cancelled: -1,
};

export function OrderTracking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightOrderNumber = searchParams.get('highlight') ?? undefined;

  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setIsLoading(false); return; }

    async function fetchOrders() {
      try {
        const res = await fetch(`${API_BASE}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await res.json()) as { orders?: Order[]; error?: string };
        if (!res.ok) throw new Error(data.error ?? 'Failed to load orders');
        setOrders(data.orders ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load orders');
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrders();
  }, [token]);

  return (
    <div className="min-h-full bg-neutral-950 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Your orders</h1>
          {!user && (
            <button
              onClick={() => navigate('/checkout')}
              className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Sign in to view orders
            </button>
          )}
        </div>

        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}
        {error && <div className="text-red-400 bg-red-900/20 px-4 py-3 rounded-xl text-sm">{error}</div>}

        {!isLoading && !error && orders.length === 0 && (
          <div className="text-center py-16 text-neutral-400">
            <Package size={40} className="mx-auto mb-3 opacity-40" />
            <p>No orders yet</p>
            <Link to="/create" className="mt-4 inline-block text-sm text-neutral-600 hover:text-neutral-900 dark:hover:text-white transition-colors">
              Create your first poster →
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              highlight={order.order_number === highlightOrderNumber}
              onCancelled={(id) => setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled' } : o))}
            />
          ))}
        </div>
        <div className="h-8" />
      </div>
    </div>
  );
}

function OrderCard({ order, highlight, onCancelled }: { order: Order; highlight: boolean; onCancelled: (id: string) => void }) {
  const currentStep = STATUS_ORDER[order.status];
  const isCancelled = order.status === 'cancelled';
  const [lightbox, setLightbox] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const { token } = useAuth();

  async function handleCancel() {
    if (!confirm(`Cancel order #${order.order_number}? This cannot be undone.`)) return;
    setCancelling(true);
    try {
      await fetch(`${API_BASE}/api/orders/${order.id}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      onCancelled(order.id);
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className={`bg-neutral-900 rounded-2xl border transition-all overflow-hidden ${
      highlight ? 'border-white ring-2 ring-white/10' : 'border-neutral-800'
    }`}>
      {lightbox && order.preview_url && (
        <Lightbox src={order.preview_url} alt={`Poster #${order.order_number}`} onClose={() => setLightbox(false)} />
      )}
      <div className="flex gap-4 p-5">
        {/* Poster thumbnail */}
        {order.preview_url ? (
          <img
            src={order.preview_url}
            alt="Poster"
            onClick={() => setLightbox(true)}
            className="w-20 object-contain rounded-lg flex-shrink-0 border border-neutral-700 self-start cursor-zoom-in hover:opacity-80 transition-opacity"
          />
        ) : (
          <div className="w-20 aspect-[1/1.41] bg-neutral-800 rounded-lg flex-shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-mono font-bold text-neutral-900 dark:text-white">#{order.order_number}</p>
              <p className="text-xs text-neutral-400 mt-0.5">
                {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{order.size}</p>
              <p className="text-xs text-neutral-400">qty {order.quantity}</p>
            </div>
          </div>

          {isCancelled ? (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <XCircle size={16} /> Cancelled
            </div>
          ) : (
            <>
              <div className="relative">
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-neutral-800 -z-0">
                  <div
                    className="h-full bg-white transition-all duration-700"
                    style={{ width: currentStep >= 0 ? `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%` : '0%' }}
                  />
                </div>
                <div className="relative z-10 flex justify-between">
                  {STATUS_STEPS.map((step, idx) => {
                    const done = idx <= currentStep;
                    const Icon = step.icon;
                    return (
                      <div key={step.status} className="flex flex-col items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          done ? 'bg-white text-neutral-900' : 'bg-neutral-800 text-neutral-400'
                        }`}>
                          <Icon size={14} />
                        </div>
                        <span className={`hidden sm:block text-xs text-center leading-tight max-w-[56px] ${
                          done ? 'text-white font-medium' : 'text-neutral-500'
                        }`}>{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {currentStep >= 0 && (
                <p className="sm:hidden mt-3 text-xs text-white font-medium">
                  {STATUS_STEPS[currentStep].label}
                </p>
              )}
            </>
          )}

          {order.tracking_number && (
            <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center gap-2 text-sm">
              <Truck size={14} className="text-neutral-400" />
              <span className="text-neutral-400">Tracking:</span>
              <span className="font-mono font-medium text-white">{order.tracking_number}</span>
            </div>
          )}

          {/* Bottom actions */}
          <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between gap-2">
            {order.status === 'pending' ? (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
              >
                {cancelling ? 'Cancelling…' : 'Cancel order'}
              </button>
            ) : (
              <span />
            )}
            <Link
              to={`/support?order=${order.order_number}`}
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              {order.status === 'pending' ? 'Need help?' : 'Contact support'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
