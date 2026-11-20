import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Download, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useT } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { API_BASE } from '../lib/api';
import { GoogleLoginButton } from '../components/GoogleLoginButton';
import { FramedPoster } from '../components/FramedPoster';
import { SIZE_FAMILIES, sizesInFamily, getPosterSize } from '../lib/posterSizes';
import { computePaletteFromColorMode, interpolateColors, rgbToHex, hexToRgb } from '../lib/colorUtils';
import { exportPosterHiResBlob } from '../lib/posterExport';
import { PENDING_ORDER_KEY } from '../lib/digitalCheckout';
import type { DitherOptions } from '../lib/dither';

interface OrderItem {
  designData: DitherOptions | null;
  previewUrl: string | null;
  sourceUrl: string | null;
  textOnly: boolean;
}

interface DigitalOrder {
  id: string;
  orderNumber: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  livemode: boolean;
  itemCount: number;
  items: OrderItem[];
}

// While the payment confirms: a handful of checks with growing gaps, then stop.
// Nothing polls in the background after that.
const POLL_DELAYS_MS = [1500, 2000, 3000, 4000, 6000, 8000, 10000];

/** Rebuild the palette the editor computes at runtime (it is not stored with the design). */
function withPalette(options: DitherOptions): DitherOptions {
  const base = computePaletteFromColorMode(options);
  const palette = !options.strictSwatches && options.colorMode !== 'rgb'
    ? interpolateColors(base.map(c => rgbToHex(c[0], c[1], c[2])), options.paletteSteps).map(hex => hexToRgb(hex))
    : base;
  return { ...options, palette };
}

function slug(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'poster';
}

function PosterDownload({ item, index }: { item: OrderItem; index: number }) {
  const { t } = useT();
  const design = item.designData!;
  const [size, setSize] = useState(getPosterSize(design.poster.aspectRatio).id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function download() {
    setBusy(true);
    setError(false);
    try {
      let file: File | null = null;
      if (item.sourceUrl) {
        const res = await fetch(item.sourceUrl);
        if (!res.ok) throw new Error(`photo ${res.status}`);
        file = new File([await res.blob()], 'source.jpg', { type: 'image/jpeg' });
      }
      const options = withPalette({ ...design, poster: { ...design.poster, aspectRatio: size } });
      const blob = await exportPosterHiResBlob(options, file);
      if (!blob) throw new Error('render failed');
      const name = `stampica-${slug(design.poster.title || `poster-${index + 1}`)}-${size}.png`;
      // On phones the share sheet offers "Save Image" straight to Photos
      const shareFile = new File([blob], name, { type: 'image/png' });
      if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [shareFile] })) {
        try {
          await navigator.share({ files: [shareFile] });
          return;
        } catch (err) {
          if ((err as Error).name === 'AbortError') return;
          // Share not allowed (e.g. the tap expired during rendering): fall back to a download
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      console.error('[download]', err);
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <figure className="flex gap-4 items-start sm:flex-col sm:items-stretch sm:gap-0">
      {item.previewUrl && <div className="w-28 shrink-0 sm:w-auto"><FramedPoster src={item.previewUrl} eager /></div>}
      <figcaption className="flex-1 min-w-0 sm:mt-4 space-y-2">
        <label className="block text-xs text-ink-faint" htmlFor={`size-${index}`}>{t('dlSize')}</label>
        <select
          id={`size-${index}`}
          value={size}
          onChange={e => setSize(e.target.value)}
          className="w-full bg-surface border border-line text-ink py-2.5 px-3 text-sm rounded-lg focus:outline-none focus:border-ink/40"
        >
          {SIZE_FAMILIES.map(f => (
            <optgroup key={f.id} label={`${f.label} (${f.ratio})`}>
              {sizesInFamily(f.id).map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </optgroup>
          ))}
        </select>
        <button
          onClick={download}
          disabled={busy}
          className="press w-full bg-ink text-paper font-semibold py-3 rounded-full hover:bg-black disabled:opacity-60 transition-colors text-sm flex items-center justify-center gap-2"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {busy ? t('dlRendering') : t('dlDownload')}
        </button>
        {error && <p className="text-xs text-vermilion">{t('dlRenderError')}</p>}
      </figcaption>
    </figure>
  );
}

export function Downloads() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const { t } = useT();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<DigitalOrder | null>(null);
  const [state, setState] = useState<'loading' | 'pending' | 'slow' | 'ready' | 'failed' | 'notfound'>('loading');
  const attempt = useRef(0);

  useEffect(() => {
    if (!token || !id) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    attempt.current = 0;

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/digital/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (cancelled) return;
        if (res.status === 404) { setState('notfound'); return; }
        if (!res.ok) throw new Error(String(res.status));
        const { order } = (await res.json()) as { order: DigitalOrder };
        if (cancelled) return;
        setOrder(order);
        if (order.status === 'paid') {
          setState('ready');
          try {
            if (sessionStorage.getItem(PENDING_ORDER_KEY) === order.id) {
              clearCart();
              sessionStorage.removeItem(PENDING_ORDER_KEY);
            }
          } catch { /* private mode */ }
        } else if (order.status === 'failed') {
          setState('failed');
        } else if (attempt.current < POLL_DELAYS_MS.length) {
          setState('pending');
          timer = setTimeout(load, POLL_DELAYS_MS[attempt.current++]);
        } else {
          setState('slow');
        }
      } catch {
        if (!cancelled) setState('slow');
      }
    }
    load();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [id, token]);

  return (
    <div className="min-h-full bg-paper text-ink px-6 py-10 md:py-16">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-baseline justify-between gap-4 flex-wrap mb-2">
          <h1 className="font-display font-extrabold text-4xl md:text-5xl tracking-[-0.02em]">{t('dlTitle')}</h1>
          {order && !order.livemode && (
            <span className="text-xs font-semibold uppercase tracking-wider text-vermilion border border-vermilion/40 rounded-full px-3 py-1">{t('dlTestMode')}</span>
          )}
        </div>
        {order && <p className="text-sm text-ink-faint mb-10">#{order.orderNumber}</p>}

        {!user ? (
          <div className="max-w-md bg-surface rounded-2xl p-6 border border-line">
            <p className="text-ink-soft mb-4 text-sm">{t('dlSignIn')}</p>
            <GoogleLoginButton />
          </div>
        ) : state === 'loading' || state === 'pending' ? (
          <p className="flex items-center gap-3 text-ink-soft"><Loader2 size={18} className="animate-spin" />{t('dlConfirming')}</p>
        ) : state === 'slow' ? (
          <p className="text-ink-soft max-w-md">{t('dlSlow')}</p>
        ) : state === 'failed' ? (
          <div className="space-y-4">
            <p className="text-ink-soft">{t('dlFailed')}</p>
            <Link to="/cart" className="inline-block bg-ink text-paper font-semibold px-6 py-3 rounded-full hover:bg-black transition-colors text-sm">{t('backToCart')}</Link>
          </div>
        ) : state === 'notfound' ? (
          <p className="text-ink-soft">{t('dlNotFound')}</p>
        ) : order && (
          <>
            <p className="text-ink-soft max-w-2xl mb-10 leading-relaxed">{t('dlHint')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
              {order.items.map((item, i) => item.designData && <PosterDownload key={i} item={item} index={i} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
