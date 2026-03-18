import { useEffect, useState } from 'react';
import { ArrowLeft, Package, Printer, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

type OrderStatus = 'pending' | 'confirmed' | 'printing' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  order_number: string;
  size: string;
  quantity: number;
  status: OrderStatus;
  shipping_address: string;
  phone: string;
  tracking_number: string | null;
  created_at: string;
}

const STATUS_STEPS: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
  { status: 'pending', label: 'Order received', icon: Clock },
  { status: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { status: 'printing', label: 'Printing', icon: Printer },
  { status: 'shipped', label: 'Shipped', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: Package },
];

const STATUS_ORDER: Record<OrderStatus, number> = {
  pending: 0,
  confirmed: 1,
  printing: 2,
  shipped: 3,
  delivered: 4,
  cancelled: -1,
};

interface OrderTrackingProps {
  onBack: () => void;
  highlightOrderNumber?: string;
}

export function OrderTracking({ onBack, highlightOrderNumber }: OrderTrackingProps) {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors mb-6 text-sm"
        >
          <ArrowLeft size={16} />
          Back to editor
        </button>

        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-8">Your orders</h1>

        {isLoading && (
          <div className="text-neutral-400 text-sm py-12 text-center">Loading orders…</div>
        )}

        {error && (
          <div className="text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {!isLoading && !error && orders.length === 0 && (
          <div className="text-center py-16 text-neutral-400">
            <Package size={40} className="mx-auto mb-3 opacity-40" />
            <p>No orders yet</p>
          </div>
        )}

        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              highlight={order.order_number === highlightOrderNumber}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, highlight }: { order: Order; highlight: boolean }) {
  const currentStep = STATUS_ORDER[order.status];
  const isCancelled = order.status === 'cancelled';

  return (
    <div
      className={`bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border transition-all ${
        highlight
          ? 'border-neutral-900 dark:border-white ring-2 ring-neutral-900/10 dark:ring-white/10'
          : 'border-neutral-200 dark:border-neutral-800'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-mono font-bold text-neutral-900 dark:text-white">
            #{order.order_number}
          </p>
          <p className="text-xs text-neutral-400 mt-0.5">
            {new Date(order.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{order.size}</p>
          <p className="text-xs text-neutral-400">qty {order.quantity}</p>
        </div>
      </div>

      {isCancelled ? (
        <div className="flex items-center gap-2 text-red-500 text-sm">
          <XCircle size={16} />
          Order cancelled
        </div>
      ) : (
        <div className="relative">
          {/* Progress bar */}
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-neutral-100 dark:bg-neutral-800 -z-0">
            <div
              className="h-full bg-neutral-900 dark:bg-white transition-all duration-700"
              style={{
                width: currentStep >= 0 ? `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%` : '0%',
              }}
            />
          </div>

          <div className="relative z-10 flex justify-between">
            {STATUS_STEPS.map((step, idx) => {
              const done = idx <= currentStep;
              const Icon = step.icon;
              return (
                <div key={step.status} className="flex flex-col items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      done
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    <Icon size={14} />
                  </div>
                  <span
                    className={`text-xs text-center leading-tight max-w-[56px] ${
                      done ? 'text-neutral-900 dark:text-white font-medium' : 'text-neutral-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {order.tracking_number && (
        <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-2 text-sm">
          <Truck size={14} className="text-neutral-400" />
          <span className="text-neutral-500 dark:text-neutral-400">Tracking:</span>
          <span className="font-mono font-medium text-neutral-900 dark:text-white">
            {order.tracking_number}
          </span>
        </div>
      )}
    </div>
  );
}
