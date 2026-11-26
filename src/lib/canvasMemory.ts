// iPhone Safari caps the total memory all canvases may use (a few hundred MB) and
// frees old canvases slowly. Once the cap is hit, every canvas draws blank. Shrinking
// a canvas to 0×0 frees its memory right away.
export function releaseCanvas(canvas: HTMLCanvasElement | null | undefined) {
    if (!canvas) return;
    canvas.width = 0;
    canvas.height = 0;
}

const cache = new Map<string, ImageData>();

function keyFor(file: File, maxEdge: number) {
    return `${file.name}:${file.size}:${file.lastModified}:${maxEdge}`;
}

/**
 * Decode a photo once, scaled so its long edge is maxEdge, and reuse it. Phone photos
 * are 12–48 MP; decoding one into a fresh canvas on every effect change ran iOS out
 * of canvas memory.
 */
export function loadScaledImageData(file: File, maxEdge: number): Promise<ImageData> {
    const key = keyFor(file, maxEdge);
    const hit = cache.get(key);
    if (hit) return Promise.resolve(hit);

    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            const scale = maxEdge / Math.max(img.width, img.height);
            const w = Math.max(1, Math.round(img.width * scale));
            const h = Math.max(1, Math.round(img.height * scale));
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, w, h);
            const data = ctx.getImageData(0, 0, w, h);
            releaseCanvas(canvas);
            img.src = '';
            // Keep only the latest photo or two
            if (cache.size >= 2) cache.delete(cache.keys().next().value as string);
            cache.set(key, data);
            resolve(data);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Could not load image'));
        };
        img.src = url;
    });
}
