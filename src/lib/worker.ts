import { WorkerMessage } from './dither';

// Helper to get luminance
const getLuminance = (r: number, g: number, b: number) => {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// Simple sRGB <-> Linear conversion
const toLinear = (v: number) => Math.pow(v / 255, 2.2);
const toSRGB = (v: number) => Math.pow(Math.max(0, Math.min(1, v)), 1 / 2.2) * 255;

// Find closest color in palette using weighted Euclidean distance
const findClosestColor = (
    r: number, g: number, b: number,
    palette: [number, number, number][],
    pipeline: 'default' | 'smooth' | 'linear'
): [number, number, number] => {
    let minDist = Infinity;
    let closest = palette[0];

    for (const color of palette) {
        let dist = 0;
        if (pipeline === 'linear') {
            // Linear RGB Euclidean distance
            dist = Math.pow(r - color[0], 2) + Math.pow(g - color[1], 2) + Math.pow(b - color[2], 2);
        } else if (pipeline === 'smooth') {
            // Smoother perceptual weights
            dist =
                Math.pow(r - color[0], 2) * 0.2126 +
                Math.pow(g - color[1], 2) * 0.7152 +
                Math.pow(b - color[2], 2) * 0.0722;
        } else {
            // Default perceptual weights (Rec. 601)
            dist =
                Math.pow(r - color[0], 2) * 0.299 +
                Math.pow(g - color[1], 2) * 0.587 +
                Math.pow(b - color[2], 2) * 0.114;
        }

        if (dist < minDist) {
            minDist = dist;
            closest = color;
        }
    }
    return closest;
};

// Apply Brightness / Contrast / Gamma to an ImageData and return a NEW ImageData.
// This MUST be applied exactly once per render/export and BEFORE any downsample/dither.
const applyBCG = (imageData: ImageData, brightness: number, contrast: number, gamma: number): ImageData => {
    const src = imageData.data;
    const out = new Uint8ClampedArray(src.length);

    // Brightness: map -100..100 -> -1..1
    const b = (brightness || 0) / 100;
    // Contrast factor: 0..2
    const c = ((typeof contrast === 'number' ? contrast : 0) + 100) / 100;
    const c2 = c * c;
    const g = gamma && gamma > 0 ? gamma : 1;

    for (let i = 0; i < src.length; i += 4) {
        // Normalize to 0..1
        let r = src[i] / 255;
        let gg = src[i + 1] / 255;
        let bl = src[i + 2] / 255;

        // Brightness
        r = r + b;
        gg = gg + b;
        bl = bl + b;

        // Contrast (apply curve)
        r = (r - 0.5) * c2 + 0.5;
        gg = (gg - 0.5) * c2 + 0.5;
        bl = (bl - 0.5) * c2 + 0.5;

        // Gamma
        if (g !== 1) {
            r = Math.pow(Math.max(0, r), 1 / g);
            gg = Math.pow(Math.max(0, gg), 1 / g);
            bl = Math.pow(Math.max(0, bl), 1 / g);
        }

        out[i] = Math.min(255, Math.max(0, Math.round(r * 255)));
        out[i + 1] = Math.min(255, Math.max(0, Math.round(gg * 255)));
        out[i + 2] = Math.min(255, Math.max(0, Math.round(bl * 255)));
        out[i + 3] = src[i + 3];
    }

    return new ImageData(out, imageData.width, imageData.height);
};

// ── Ordered dithering matrices (values normalized to 0..1) ──────────────────

// Recursive Bayer matrix: size 2, 4, 8
const bayerMatrix = (size: number): number[][] => {
    let m = [[0, 2], [3, 1]];
    let n = 2;
    while (n < size) {
        const next: number[][] = [];
        for (let y = 0; y < n * 2; y++) {
            next.push(new Array(n * 2));
            for (let x = 0; x < n * 2; x++) {
                const quadrant = (y >= n ? 2 : 0) + (x >= n ? 1 : 0);
                const offsets = [0, 2, 3, 1];
                next[y][x] = m[y % n][x % n] * 4 + offsets[quadrant];
            }
        }
        m = next;
        n *= 2;
    }
    const total = n * n;
    return m.map(row => row.map(v => (v + 0.5) / total));
};

// Classic 8x8 clustered-dot (dual-dot) halftone screen
const HALFTONE_8 = [
    [24, 10, 12, 26, 35, 47, 49, 37],
    [8, 0, 2, 14, 45, 59, 61, 51],
    [22, 6, 4, 16, 43, 57, 63, 53],
    [30, 20, 18, 28, 33, 41, 55, 39],
    [34, 46, 48, 36, 25, 11, 13, 27],
    [44, 58, 60, 50, 9, 1, 3, 15],
    [42, 56, 62, 52, 23, 7, 5, 17],
    [32, 40, 54, 38, 31, 21, 19, 29],
].map(row => row.map(v => (v + 0.5) / 64));

// Horizontal line screen: lines thicken from their center as tones darken
const LINES_8 = Array.from({ length: 8 }, (_, y) =>
    Array.from({ length: 8 }, (_, x) => {
        const d = Math.abs(y - 3.5) / 4; // 0.125 .. 0.875
        return d + (x % 2) * 0.03; // tiny horizontal stagger to soften banding
    })
);

// 45° line screen
const DIAGONAL_8 = Array.from({ length: 8 }, (_, y) =>
    Array.from({ length: 8 }, (_, x) => {
        const d = Math.abs(((x + y) % 8) - 3.5) / 4;
        return d;
    })
);

// Deterministic per-cell pseudo-random value in 0..1 (stable across renders)
const blockHash = (x: number, y: number): number => {
    const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return s - Math.floor(s);
};

const getOrderedMatrix = (algorithm: string): number[][] | null => {
    switch (algorithm) {
        case 'bayer-2': return bayerMatrix(2);
        case 'bayer-4': return bayerMatrix(4);
        case 'bayer-8': return bayerMatrix(8);
        case 'halftone': return HALFTONE_8;
        case 'lines': return LINES_8;
        case 'diagonal': return DIAGONAL_8;
        default: return null;
    }
};

// ── Error-diffusion kernels: [dx, dy, weight] (dx is flipped on serpentine rows)
const DIFFUSION_KERNELS: Record<string, [number, number, number][]> = {
    'floyd-steinberg': [
        [1, 0, 7 / 16], [-1, 1, 3 / 16], [0, 1, 5 / 16], [1, 1, 1 / 16],
    ],
    'jarvis': [
        [1, 0, 7 / 48], [2, 0, 5 / 48],
        [-2, 1, 3 / 48], [-1, 1, 5 / 48], [0, 1, 7 / 48], [1, 1, 5 / 48], [2, 1, 3 / 48],
        [-2, 2, 1 / 48], [-1, 2, 3 / 48], [0, 2, 5 / 48], [1, 2, 3 / 48], [2, 2, 1 / 48],
    ],
    'burkes': [
        [1, 0, 8 / 32], [2, 0, 4 / 32],
        [-2, 1, 2 / 32], [-1, 1, 4 / 32], [0, 1, 8 / 32], [1, 1, 4 / 32], [2, 1, 2 / 32],
    ],
    'sierra': [
        [1, 0, 5 / 32], [2, 0, 3 / 32],
        [-2, 1, 2 / 32], [-1, 1, 4 / 32], [0, 1, 5 / 32], [1, 1, 4 / 32], [2, 1, 2 / 32],
        [-1, 2, 2 / 32], [0, 2, 3 / 32], [1, 2, 2 / 32],
    ],
};

const pixelate = (imageData: ImageData, pointSize: number): ImageData => {
    if (pointSize <= 1) return imageData;

    const w = imageData.width;
    const h = imageData.height;
    const newW = Math.floor(w / pointSize);
    const newH = Math.floor(h / pointSize);
    const data = imageData.data;
    const newData = new Uint8ClampedArray(newW * newH * 4);

    for (let y = 0; y < newH; y++) {
        for (let x = 0; x < newW; x++) {
            let r = 0, g = 0, b = 0, count = 0;
            const startY = y * pointSize;
            const startX = x * pointSize;

            for (let dy = 0; dy < pointSize && startY + dy < h; dy++) {
                for (let dx = 0; dx < pointSize && startX + dx < w; dx++) {
                    const i = ((startY + dy) * w + (startX + dx)) * 4;
                    r += data[i];
                    g += data[i + 1];
                    b += data[i + 2];
                    count++;
                }
            }

            const i = (y * newW + x) * 4;
            newData[i] = Math.round(r / count);
            newData[i + 1] = Math.round(g / count);
            newData[i + 2] = Math.round(b / count);
            // Average alpha or pick from center? Simple average:
            let a = 0;
            for (let dy = 0; dy < pointSize && startY + dy < h; dy++) {
                for (let dx = 0; dx < pointSize && startX + dx < w; dx++) {
                    const idx = ((startY + dy) * w + (startX + dx)) * 4;
                    a += data[idx + 3];
                }
            }
            newData[i + 3] = Math.round(a / count);
        }
    }

    return new ImageData(newData, newW, newH);
};

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
    const { imageData, options } = e.data;
    const { algorithm, threshold, palette, pointSize, colorPipeline } = options;

    // 1. Apply Brightness/Contrast/Gamma to ORIGINAL image BEFORE any downsample/dither
    const adjustedOriginal = applyBCG(imageData, options.brightness, options.contrast, options.gamma);

    // Apply invert pre-dither if requested (invert is considered an image-level op)
    if (options.invert) {
        for (let i = 0; i < adjustedOriginal.data.length; i += 4) {
            adjustedOriginal.data[i] = 255 - adjustedOriginal.data[i];
            adjustedOriginal.data[i + 1] = 255 - adjustedOriginal.data[i + 1];
            adjustedOriginal.data[i + 2] = 255 - adjustedOriginal.data[i + 2];
        }
    }

    // 2. Pixelate (Downscale) the adjusted image
    const workingImage = pixelate(adjustedOriginal, pointSize);
    const width = workingImage.width;
    const height = workingImage.height;
    const data = workingImage.data;

    // Prepare processing buffer (Linear if requested)
    const buffer = new Float32Array(data.length);
    for (let i = 0; i < data.length; i += 4) {
        if (colorPipeline === 'linear') {
            buffer[i] = toLinear(data[i]);
            buffer[i + 1] = toLinear(data[i + 1]);
            buffer[i + 2] = toLinear(data[i + 2]);
        } else {
            buffer[i] = data[i];
            buffer[i + 1] = data[i + 1];
            buffer[i + 2] = data[i + 2];
        }
        buffer[i + 3] = data[i + 3];
    }

    // Palette preparation (Linear if requested)
    const workingPalette: [number, number, number][] = palette.map(c => {
        if (colorPipeline === 'linear') {
            return [toLinear(c[0]), toLinear(c[1]), toLinear(c[2])];
        }
        return [c[0], c[1], c[2]];
    });

    if (algorithm === 'none') {
        const resultData = new Uint8ClampedArray(data.length);
        for (let i = 0; i < data.length; i += 4) {
            resultData[i] = colorPipeline === 'linear' ? toSRGB(buffer[i]) : buffer[i];
            resultData[i + 1] = colorPipeline === 'linear' ? toSRGB(buffer[i + 1]) : buffer[i + 1];
            resultData[i + 2] = colorPipeline === 'linear' ? toSRGB(buffer[i + 2]) : buffer[i + 2];
            resultData[i + 3] = buffer[i + 3];
        }
        finish(resultData, width, height, imageData.width, imageData.height, pointSize, e.data.jobId);
        return;
    }

    // 3. Dither (classic)
    const getPixelIndex = (x: number, y: number) => (y * width + x) * 4;

    // ── ASCII rendering ──────────────────────────────────────────────────────
    // (if OffscreenCanvas is unavailable the fallthrough quantizes without dithering)
    // Pattern/ASCII cell scale: keep the printed look matching the on-screen
    // preview when the worker runs at higher-than-preview resolution (hi-res export)
    const longEdge = Math.max(imageData.width, imageData.height);
    const resScale = Math.max(1, Math.round(longEdge / (options.previewResolution || longEdge)));

    if (algorithm === 'ascii' && typeof OffscreenCanvas !== 'undefined') {
        const cell = 8 * resScale;
        // light → dark glyph ramp
        const ramp = [' ', '.', ':', '-', '=', 'o', 'c', 'x', '%', '#', '@'];
        const bias255 = (128 - threshold) / 128 * 128;
        const customText = [...(options.asciiText ?? '').replace(/\s+/g, ' ').trim()];
        const cols = Math.ceil(width / cell);

        // Palette in display (sRGB) space for drawing
        const displayPalette = palette;
        const sorted = [...displayPalette].sort(
            (a, b) => getLuminance(b[0], b[1], b[2]) - getLuminance(a[0], a[1], a[2])
        );
        const bg = sorted[0]; // lightest
        // Glyphs never use the background color, or light cells would draw invisible text
        const inkPalette = sorted.length > 1 ? sorted.slice(1) : sorted;

        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = `rgb(${bg[0]},${bg[1]},${bg[2]})`;
        ctx.fillRect(0, 0, width, height);
        ctx.font = `${customText.length ? 'bold ' : ''}${cell}px Menlo, Consolas, monospace`;
        ctx.textBaseline = 'top';

        for (let cy = 0; cy < height; cy += cell) {
            for (let cx = 0; cx < width; cx += cell) {
                // average the cell in display space
                let r = 0, g = 0, b = 0, count = 0;
                for (let dy = 0; dy < cell && cy + dy < height; dy++) {
                    for (let dx = 0; dx < cell && cx + dx < width; dx++) {
                        const i = getPixelIndex(cx + dx, cy + dy);
                        r += colorPipeline === 'linear' ? toSRGB(buffer[i]) : buffer[i];
                        g += colorPipeline === 'linear' ? toSRGB(buffer[i + 1]) : buffer[i + 1];
                        b += colorPipeline === 'linear' ? toSRGB(buffer[i + 2]) : buffer[i + 2];
                        count++;
                    }
                }
                r /= count; g /= count; b /= count;

                const lum = Math.max(0, Math.min(255, getLuminance(r, g, b) + bias255));
                const idx = Math.min(ramp.length - 1, Math.floor((1 - lum / 256) * ramp.length));
                if (ramp[idx] === ' ') continue;

                // Custom text tiles across the grid in reading order so words stay legible
                const glyph = customText.length
                    ? customText[((cy / cell) * cols + cx / cell) % customText.length]
                    : ramp[idx];
                if (glyph === ' ') continue;

                // glyph drawn in the palette color closest to the cell average
                const glyphColor = findClosestColor(r, g, b, inkPalette, 'default');
                ctx.fillStyle = `rgb(${glyphColor[0]},${glyphColor[1]},${glyphColor[2]})`;
                ctx.fillText(glyph, cx, cy);
            }
        }

        const asciiResult = ctx.getImageData(0, 0, width, height);
        finish(new Uint8ClampedArray(asciiResult.data), width, height, imageData.width, imageData.height, pointSize, e.data.jobId);
        return;
    }

    // ── Ordered / pattern dithering ──────────────────────────────────────────
    const orderedMatrix = getOrderedMatrix(algorithm);
    if (orderedMatrix || algorithm === 'noise') {
        const range = colorPipeline === 'linear' ? 1 : 255;
        const mid = range / 2;
        const bias = (128 - threshold) / 128 * mid;
        // Spread of the threshold perturbation: full range for 2-color palettes,
        // narrower as the palette grows (more levels need less push per level).
        const spread = range / Math.max(1, Math.sqrt(palette.length - 1));
        const n = orderedMatrix ? orderedMatrix.length : 0;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = getPixelIndex(x, y);
                if (buffer[i + 3] < 128) continue;

                const mx = Math.floor(x / resScale);
                const my = Math.floor(y / resScale);
                const m = orderedMatrix
                    ? orderedMatrix[my % n][mx % n]
                    : blockHash(mx, my);
                const offset = (m - 0.5) * spread + bias;

                const r = Math.max(0, Math.min(range, buffer[i] + offset));
                const g = Math.max(0, Math.min(range, buffer[i + 1] + offset));
                const b = Math.max(0, Math.min(range, buffer[i + 2] + offset));

                const closest = findClosestColor(r, g, b, workingPalette, colorPipeline);
                buffer[i] = closest[0];
                buffer[i + 1] = closest[1];
                buffer[i + 2] = closest[2];
            }
        }

        const orderedResult = new Uint8ClampedArray(data.length);
        for (let i = 0; i < data.length; i += 4) {
            orderedResult[i] = colorPipeline === 'linear' ? toSRGB(buffer[i]) : buffer[i];
            orderedResult[i + 1] = colorPipeline === 'linear' ? toSRGB(buffer[i + 1]) : buffer[i + 1];
            orderedResult[i + 2] = colorPipeline === 'linear' ? toSRGB(buffer[i + 2]) : buffer[i + 2];
            orderedResult[i + 3] = buffer[i + 3];
        }
        finish(orderedResult, width, height, imageData.width, imageData.height, pointSize, e.data.jobId);
        return;
    }

    // Calculate global dither bias based on threshold (128 = no bias)
    const range = colorPipeline === 'linear' ? 1 : 255;
    const mid = range / 2;
    const bias = (128 - threshold) / 128 * mid;

    // For multi-color thresholding, sort palette by luminance
    const sortedPalette = [...workingPalette].sort((a, b) => {
        return getLuminance(a[0], a[1], a[2]) - getLuminance(b[0], b[1], b[2]);
    });

    for (let y = 0; y < height; y++) {
        const isReverse = y % 2 !== 0;
        const startX = isReverse ? width - 1 : 0;
        const endX = isReverse ? -1 : width;
        const stepX = isReverse ? -1 : 1;

        for (let x = startX; x !== endX; x += stepX) {
            const i = getPixelIndex(x, y);

            // Skip fully transparent pixels in dither error distribution
            if (buffer[i + 3] < 128) continue;

            // Apply bias to the current pixel before choosing palette color
            const oldR = Math.max(0, Math.min(range, buffer[i] + bias));
            const oldG = Math.max(0, Math.min(range, buffer[i + 1] + bias));
            const oldB = Math.max(0, Math.min(range, buffer[i + 2] + bias));

            let closest: [number, number, number];

            if (algorithm === 'threshold') {
                // Multi-color threshold logic using biased luminance
                const lum = getLuminance(oldR, oldG, oldB);
                const idx = Math.floor((lum / (range + 0.001)) * sortedPalette.length);
                closest = sortedPalette[Math.min(idx, sortedPalette.length - 1)];
            } else {
                closest = findClosestColor(oldR, oldG, oldB, workingPalette, colorPipeline);
            }

            buffer[i] = closest[0];
            buffer[i + 1] = closest[1];
            buffer[i + 2] = closest[2];

            // Use the biased error for distribution to maintain brightness correction
            const errR = oldR - closest[0];
            const errG = oldG - closest[1];
            const errB = oldB - closest[2];

            const distributeError = (dx: number, dy: number, factor: number) => {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const ni = getPixelIndex(nx, ny);
                    buffer[ni] += errR * factor;
                    buffer[ni + 1] += errG * factor;
                    buffer[ni + 2] += errB * factor;
                }
            };

            const dir = stepX;
            const kernel = DIFFUSION_KERNELS[algorithm];
            if (kernel) {
                for (const [dx, dy, factor] of kernel) {
                    distributeError(dir * dx, dy, factor);
                }
            } else if (algorithm === 'atkinson') {
                distributeError(dir * 1, 0, 1 / 8);
                distributeError(dir * 2, 0, 1 / 8);
                distributeError(dir * -1, 1, 1 / 8);
                distributeError(0, 1, 1 / 8);
                distributeError(dir * 1, 1, 1 / 8);
                distributeError(0, 2, 1 / 8);
            } else if (algorithm === 'stucki') {
                // Stucki kernel (weights / 42):
                //   . . X 8 4
                //   2 4 8 4 2
                //   1 2 4 2 1
                distributeError(dir * 1, 0, 8 / 42);
                distributeError(dir * 2, 0, 4 / 42);
                distributeError(dir * -2, 1, 2 / 42);
                distributeError(dir * -1, 1, 4 / 42);
                distributeError(0, 1, 8 / 42);
                distributeError(dir * 1, 1, 4 / 42);
                distributeError(dir * 2, 1, 2 / 42);
                distributeError(dir * -2, 2, 1 / 42);
                distributeError(dir * -1, 2, 2 / 42);
                distributeError(0, 2, 4 / 42);
                distributeError(dir * 1, 2, 2 / 42);
                distributeError(dir * 2, 2, 1 / 42);
            }
        }
    }

    const resultData = new Uint8ClampedArray(data.length);
    for (let i = 0; i < data.length; i += 4) {
        resultData[i] = colorPipeline === 'linear' ? toSRGB(buffer[i]) : buffer[i];
        resultData[i + 1] = colorPipeline === 'linear' ? toSRGB(buffer[i + 1]) : buffer[i + 1];
        resultData[i + 2] = colorPipeline === 'linear' ? toSRGB(buffer[i + 2]) : buffer[i + 2];
        resultData[i + 3] = buffer[i + 3];
    }

    finish(resultData, width, height, imageData.width, imageData.height, pointSize, e.data.jobId);
};

function finish(data: Uint8ClampedArray, width: number, height: number, originalWidth: number, originalHeight: number, pointSize: number, jobId?: string) {
    if (pointSize > 1) {
        const upscaledData = new Uint8ClampedArray(originalWidth * originalHeight * 4);
        for (let y = 0; y < originalHeight; y++) {
            for (let x = 0; x < originalWidth; x++) {
                const srcX = Math.floor(x / pointSize);
                const srcY = Math.floor(y / pointSize);
                const sx = Math.min(srcX, width - 1);
                const sy = Math.min(srcY, height - 1);
                const srcI = (sy * width + sx) * 4;
                const dstI = (y * originalWidth + x) * 4;
                upscaledData[dstI] = data[srcI];
                upscaledData[dstI + 1] = data[srcI + 1];
                upscaledData[dstI + 2] = data[srcI + 2];
                upscaledData[dstI + 3] = data[srcI + 3];
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        self.postMessage({ imageData: new ImageData(upscaledData as any, originalWidth, originalHeight), jobId });
    } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        self.postMessage({ imageData: new ImageData(data as any, width, height), jobId });
    }
}
