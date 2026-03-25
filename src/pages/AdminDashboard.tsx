import { useEffect, useState } from 'react';
import { ChevronDown, Trash2, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Lightbox } from '../components/Lightbox';
import { SkeletonCard } from '../components/Skeleton';

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

interface OrderItem {
  size: string;
  quantity: number;
  frame: string;
  previewUrl?: string | null;
  posterUrl?: string | null;
}

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
  items: OrderItem[] | null;
  created_at: string;
  users: { name: string; email: string } | null;
}

export function AdminDashboard() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 25;
  const [error, setError] = useState<string | null>(null);

  async function fetchOrders(p = page) {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`${API_BASE}/api/admin/orders?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = (await res.json()) as { orders?: Order[]; total?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to load');
      setOrders(data.orders ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    setPage(0);
    fetchOrders(0);
  }, [filterStatus, search, token]);

  useEffect(() => {
    fetchOrders(page);
  }, [page]);

  async function updateOrder(id: string, patch: { status?: OrderStatus; trackingNumber?: string }) {
    await fetch(`${API_BASE}/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    });
    fetchOrders(page);
  }

  async function deleteOrder(id: string) {
    await fetch(`${API_BASE}/api/admin/orders/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchOrders(page);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <span className="text-sm text-neutral-500">{total} orders</span>
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order number, name or email…"
          className="w-full mb-4 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
        />

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

        {isLoading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {/* Orders table */}
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} onUpdate={updateOrder} onDelete={deleteOrder} />
          ))}
          {!isLoading && orders.length === 0 && (
            <p className="text-neutral-500 text-sm py-8 text-center">No orders found</p>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 text-sm">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page === 0}
              className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white hover:border-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              ← Prev
            </button>
            <span className="text-neutral-500">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white hover:border-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next →
            </button>
          </div>
        )}
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

      {/* Main body */}
      <div className="flex gap-3 p-4">
        {order.preview_url ? (
          <img
            src={order.preview_url}
            alt="Poster preview"
            onClick={() => setLightbox(true)}
            className="w-14 md:w-20 object-contain rounded-lg flex-shrink-0 border border-neutral-700 self-start cursor-zoom-in hover:opacity-80 transition-opacity"
          />
        ) : (
          <div className="w-14 md:w-20 aspect-[1/1.41] bg-neutral-800 rounded-lg flex-shrink-0 flex items-center justify-center text-neutral-600 text-xs">–</div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm">#{order.order_number}</span>
            {order.items && order.items.length > 1 && (
              <span className="text-[10px] bg-neutral-700 text-neutral-300 px-1.5 py-0.5 rounded-full font-medium">{order.items.length} items</span>
            )}
          </div>
          <p className="text-sm text-neutral-400 mt-0.5 truncate">
            {order.users?.name ?? 'Unknown'} · {order.items
              ? order.items.map(i => `${i.size}×${i.quantity}`).join(', ')
              : `${order.size} × ${order.quantity}`
            }
          </p>
          <p className="text-xs text-neutral-600 mt-0.5">
            {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          {order.users?.email && (
            <p className="text-xs text-neutral-600 mt-0.5 truncate">{order.users.email}</p>
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-t border-neutral-800 bg-neutral-950/40">
        {/* Status select — left */}
        <select
          value={order.status}
          onChange={(e) => onUpdate(order.id, { status: e.target.value as OrderStatus })}
          className={`text-xs px-3 py-1.5 rounded-lg border capitalize appearance-none cursor-pointer bg-neutral-900 font-medium ${STATUS_COLORS[order.status]}`}
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize bg-neutral-900 text-white">{s}</option>
          ))}
        </select>

        {/* Actions — right */}
        <div className="flex items-center gap-1">
          {(order.poster_url || order.items?.some(i => i.posterUrl)) && (
            <button
              onClick={() => {
                if (order.items?.length) {
                  // For multi-item, expand to show per-item download links
                  setExpanded(true);
                } else if (order.poster_url) {
                  handleDownload(order.poster_url, `poster-${order.order_number}.png`);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
              title="Download hi-res"
            >
              <Download size={13} /> Hi-res
            </button>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${expanded ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700'}`}
          >
            Details
            <ChevronDown size={13} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={() => {
              if (!deleting && confirm(`Delete order #${order.order_number}? This cannot be undone.`)) {
                setDeleting(true);
                onDelete(order.id);
              }
            }}
            className="p-1.5 text-neutral-600 hover:text-red-400 transition-colors rounded-lg hover:bg-neutral-800"
            title="Delete order"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-neutral-800 pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-neutral-500 text-xs mb-1">Phone</p>
              <p>{order.phone}</p>
            </div>
            <div className="col-span-2">
              <p className="text-neutral-500 text-xs mb-1">Ship to</p>
              <p>{order.shipping_address}</p>
            </div>
          </div>

          {/* Multi-item breakdown */}
          {order.items && order.items.length > 0 && (
            <div>
              <p className="text-neutral-500 text-xs mb-2">Items</p>
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-neutral-800/60 rounded-lg px-3 py-2">
                    {item.previewUrl
                      ? <img src={item.previewUrl} alt="" className="w-8 object-contain rounded border border-neutral-700 flex-shrink-0" />
                      : <div className="w-8 aspect-[1/1.41] bg-neutral-700 rounded flex-shrink-0" />
                    }
                    <span className="text-xs text-neutral-300 flex-1">
                      {item.size}{item.frame !== 'none' ? ` · ${item.frame} frame` : ''} × {item.quantity}
                    </span>
                    {item.posterUrl && (
                      <button
                        onClick={() => handleDownload(item.posterUrl!, `poster-${order.order_number}-${idx + 1}.png`)}
                        className="flex items-center gap-1 px-2 py-1 text-[11px] text-neutral-400 hover:text-white bg-neutral-700 hover:bg-neutral-600 rounded transition-colors"
                      >
                        <Download size={11} /> Hi-res
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

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
          {!order.poster_url && !order.items?.some(i => i.posterUrl) && (
            <p className="text-xs text-neutral-600">No hi-res file attached</p>
          )}
        </div>
      )}
    </div>
  );
}
