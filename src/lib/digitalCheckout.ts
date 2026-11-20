import { API_BASE } from './api';
import type { CartItem } from '../contexts/CartContext';
import type { DitherOptions } from './dither';

// Photos are resized in the browser before upload: 4000 px on the long edge is
// more than the largest print needs (the poster's image area at 70×100 cm), and
// keeps a typical phone photo to roughly 1-3 MB.
const SOURCE_LONG_EDGE = 4000;
const SOURCE_QUALITY = 0.88;
const PREVIEW_LONG_EDGE = 900;

async function toJpeg(blob: Blob, longEdge: number, quality: number): Promise<Blob> {
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, longEdge / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale), h = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';               // JPEG has no transparency
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    return new Promise((resolve, reject) =>
        canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not encode image'))), 'image/jpeg', quality));
}

/** Design settings only: no files, bitmaps or object URLs. */
function designData(options: DitherOptions): Record<string, unknown> {
    return JSON.parse(JSON.stringify(options, (key, value) => {
        if (key === 'file' || key === 'processedImageData' || key === 'src' || key === 'palette') return undefined;
        return value;
    }));
}

async function api<T>(path: string, token: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
    return data as T;
}

async function put(url: string, blob: Blob) {
    const res = await fetch(url, { method: 'PUT', body: blob, headers: { 'Content-Type': 'image/jpeg' } });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
}

export const PENDING_ORDER_KEY = 'stampica_pending_order';

/** Uploads every design, creates the order and returns Dodo's hosted checkout URL. */
export async function startDigitalCheckout(items: CartItem[], token: string, onProgress?: (done: number, total: number) => void): Promise<string> {
    const files = await Promise.all(items.map(async item => ({
        source: item.imageFile ? await toJpeg(item.imageFile, SOURCE_LONG_EDGE, SOURCE_QUALITY) : null,
        preview: item.previewBlob ? await toJpeg(item.previewBlob, PREVIEW_LONG_EDGE, 0.85) : null,
    })));
    if (files.some(f => !f.preview)) throw new Error('Missing poster preview');

    const { slots } = await api<{ slots: { sourcePath: string | null; sourceUrl: string | null; previewPath: string; previewUrl: string }[] }>(
        '/api/digital/uploads', token,
        { files: files.map(f => ({ sourceSize: f.source?.size ?? null, previewSize: f.preview!.size })) },
    );

    let done = 0;
    onProgress?.(0, items.length);
    await Promise.all(slots.map(async (slot, i) => {
        await put(slot.previewUrl, files[i].preview!);
        if (slot.sourceUrl && files[i].source) await put(slot.sourceUrl, files[i].source!);
        onProgress?.(++done, items.length);
    }));

    const { orderId, checkoutUrl } = await api<{ orderId: string; checkoutUrl: string }>('/api/digital/checkout', token, {
        items: items.map((item, i) => ({
            designData: designData(item.options),
            sourcePath: slots[i].sourcePath,
            previewPath: slots[i].previewPath,
        })),
    });
    // Lets the download page clear the cart only for the order it came from.
    try { sessionStorage.setItem(PENDING_ORDER_KEY, orderId); } catch { /* private mode */ }
    return checkoutUrl;
}
