import { useEffect, useState } from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Lightbox } from '../components/Lightbox';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

type OrderStatus = 'pending' | 'confirmed' | 'printing' | 'shipped' | 'delivered' | 'cancelled';

const ALL_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'printing', 'shipped', 'delivered', 'cancelled'];

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  confirmed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  printing:  'bg-purple-500/10 text-purple-400 border-purple-500/20',
  shipped:   'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  delivered: 'bg-green-500/10 text-green-400 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

interface Order {
  id: string;
  order_number: string;
  size: string;
  quantity: number;
  status: OrderStatus;
  shipping_address: string;
  phone: string;
  tracking_number: string | null;
  preview_url: string | null;
  poster_url: string | null;
  created_at: string;
  users: { name: string; email: string } | null;
}

export function AdminDashboard() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  async function fetchOrders() {
    try {
      const url = filterStatus === 'all'
        ? `${API_BASE}/api/admin/orders`
        : `${API_BASE}/api/admin/orders?status=${filterStatus}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = (await res.json()) as { orders?: Order[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to load');
      setOrders(data.orders ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { fetchOrders(); }, [filterStatus, token]);

  async function updateOrder(id: string, patch: { status?: OrderStatus; trackingNumber?: string }) {
    await fetch(`${API_BASE}/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    });
    fetchOrders();
  }

  async function deleteOrder(id: string) {
    await fetch(`${API_BASE}/api/admin/orders/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchOrders();
  }

  const filtered = filterStatus === 'all' ? orders : orders.filter((o) => o.status === filterStatus);

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <span className="text-sm text-neutral-500">{orders.length} orders</span>
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['all', ...ALL_STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all capitalize ${
                filterStatus === s
                  ? 'bg-white text-black border-transparent'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {isLoading && <p className="text-neutral-400 text-sm">Loading orders…</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {/* Orders table */}
        <div className="space-y-3">
          {filtered.map((order) => (
            <OrderRow key={order.id} order={order} onUpdate={updateOrder} onDelete={deleteOrder} />
          ))}
          {!isLoading && filtered.length === 0 && (
            <p className="text-neutral-500 text-sm py-8 text-center">No orders found</p>
          )}
        </div>
        <div className="h-8" />
      </div>
    </div>
  );
}

function OrderRow({
  order,
  onUpdate,
  onDelete,
}: {
  order: Order;
  onUpdate: (id: string, patch: { status?: OrderStatus; trackingNumber?: string }) => void;
  onDelete: (id: string) => void;
}) {
  const [tracking, setTracking] = useState(order.tracking_number ?? '');
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  async function handleDownload(url: string, filename: string) {
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
      {lightbox && order.preview_url && (
        <Lightbox src={order.preview_url} alt={`Poster #${order.order_number}`} onClose={() => setLightbox(false)} />
      )}
      {/* Main row */}
      <div className="flex gap-3 p-4">
        {/* Preview thumbnail */}
        {order.preview_url ? (
          <img
            src={order.preview_url}
            alt="Poster preview"
            onClick={() => setLightbox(true)}
            className="w-14 md:w-20 object-contain rounded-lg flex-shrink-0 border border-neutral-700 self-start cursor-zoom-in hover:opacity-80 transition-opacity"
          />
        ) : (
          <div className="w-14 md:w-20 aspect-[1/1.41] bg-neutral-800 rounded-lg flex-shrink-0 flex items-center justify-center text-neutral-600 text-xs">
            –
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* Top: info + expand/delete */}
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-sm">#{order.order_number}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[order.status]}`}>
                  {order.status}
                </span>
              </div>
              <p className="text-sm text-neutral-400 mt-0.5 truncate">
                {order.users?.name ?? 'Unknown'} · {order.size} × {order.quantity}
              </p>
              <p className="text-xs text-neutral-600 mt-0.5">
                {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => {
                  if (!deleting && confirm(`Delete order #${order.order_number}? This cannot be undone.`)) {
                    setDeleting(true);
                    onDelete(order.id);
                  }
                }}
                className="text-neutral-600 hover:text-red-400 transition-colors p-1"
                title="Delete order"
              >
                <Trash2 size={15} />
              </button>
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-neutral-400 hover:text-white transition-colors p-1"
              >
                <ChevronDown size={16} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Bottom: status selector */}
          <div className="relative">
            <select
              value={order.status}
              onChange={(e) => onUpdate(order.id, { status: e.target.value as OrderStatus })}
              className="w-full appearance-none bg-neutral-800 border border-neutral-700 text-white text-sm rounded-lg px-3 py-2 pr-8 cursor-pointer hover:border-neutral-500 transition-colors"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400" />
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-neutral-800 pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-neutral-500 text-xs mb-1">Customer</p>
              <p>{order.users?.name}</p>
              <p className="text-neutral-400 text-xs">{order.users?.email}</p>
            </div>
            <div>
              <p className="text-neutral-500 text-xs mb-1">Phone</p>
              <p>{order.phone}</p>
            </div>
            <div className="col-span-2">
              <p className="text-neutral-500 text-xs mb-1">Ship to</p>
              <p>{order.shipping_address}</p>
            </div>
          </div>

          {/* Tracking number */}
          <div className="flex gap-2 items-center">
            <input
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="Add tracking number…"
              className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
            />
            <button
              onClick={() => onUpdate(order.id, { trackingNumber: tracking })}
              disabled={!tracking || tracking === order.tracking_number}
              className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-neutral-100 disabled:opacity-40 transition-all"
            >
              Save
            </button>
          </div>

          {/* Hi-res download for print shop */}
          {order.poster_url ? (
            <button
              onClick={() => handleDownload(order.poster_url!, `poster-${order.order_number}.png`)}
              className="inline-flex items-center gap-2 text-sm text-white bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-lg transition-colors font-medium"
            >
              ↓ Download hi-res print file
            </button>
          ) : (
            <p className="text-xs text-neutral-600">No hi-res file attached</p>
          )}
        </div>
      )}
    </div>
  );
}
