import { WorkerMessage, WorkerErrorResponse } from './dither';
import { runDitherEngine } from '../dither_engine/runDitherEngine';
import { buildAccentMask, applyAccentWithMask, rgbToHex } from './colorUtils';

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

    // 2. If DG engine requested, route to the built-in dither engine
    if (options.engine === 'dg') {
        try {
            // Build hex palette array from numeric palette
            const hexPalette = palette.map(c => rgbToHex(c[0], c[1], c[2]));

            // Build accent mask from the adjusted & pixelated image (same resolution as dither input)
            let accentMask: Uint8Array | null = null;
            if (options.accent?.enabled) {
                accentMask = buildAccentMask(workingImage, {
                    enabled: true,
                    targetHex: options.accent.detectHex,
                    hueTolerance: options.accent.hueTolerance,
                    minSaturation: options.accent.minSaturation,
                    minValue: options.accent.minValue,
                    edgeBoost: options.accent.edgeBoost,
                    edgeThreshold: options.accent.edgeThreshold
                });
            }

            // Pass the already-adjusted & downscaled/pixelated image to DG runner directly (no post-dither effects)
            const dgResult: ImageData = await runDitherEngine(workingImage, algorithm, options.colorMode === 'rgb' ? 'color' : options.colorMode, hexPalette, options.threshold);

            // Apply accent with mask if enabled (after DG dithering)
            let finalResult = dgResult;
            if (accentMask && options.accent?.enabled) {
                finalResult = applyAccentWithMask(
                    dgResult,
                    accentMask,
                    [options.accent.color.r, options.accent.color.g, options.accent.color.b],
                    options.accent.strength
                );
            }

            const outData = new Uint8ClampedArray(finalResult.data);
            // Safety check for empty jobs
            finish(outData, finalResult.width, finalResult.height, imageData.width, imageData.height, pointSize, e.data.jobId);
            return;
        } catch (err: unknown) {
            // Report error back to main thread for UI handling
            const errMsg = err instanceof Error ? err.message : String(err);
            self.postMessage({ error: `DG engine failed: ${errMsg}`, fallback: 'classic', jobId: e.data.jobId } satisfies WorkerErrorResponse);
            return;
        }
    }

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

    // ── New effects: halftone, pixelate, ascii ────────────────────────────────
    if (algorithm === 'halftone' || algorithm === 'pixelate' || algorithm === 'ascii') {
        const sortedByLum = [...palette].sort((a, b) =>
            getLuminance(a[0], a[1], a[2]) - getLuminance(b[0], b[1], b[2])
        );
        const shadowColor = sortedByLum[0];
        const highlightColor = sortedByLum[sortedByLum.length - 1];

        if (algorithm === 'pixelate') {
            // Each downscaled block → closest palette color, no error diffusion
            const resultData = new Uint8ClampedArray(data.length);
            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] < 128) { resultData[i + 3] = data[i + 3]; continue; }
                const closest = findClosestColor(data[i], data[i + 1], data[i + 2], palette, 'default');
                resultData[i] = closest[0];
                resultData[i + 1] = closest[1];
                resultData[i + 2] = closest[2];
                resultData[i + 3] = data[i + 3];
            }
            finish(resultData, width, height, imageData.width, imageData.height, pointSize, e.data.jobId);
            return;
        }

        if (algorithm === 'halftone') {
            // Draw luminance-scaled circles at full resolution
            const origW = imageData.width;
            const origH = imageData.height;
            const bSize = Math.max(pointSize, 4);
            const outData = new Uint8ClampedArray(origW * origH * 4);
            const numBlocksX = Math.ceil(origW / bSize);
            const numBlocksY = Math.ceil(origH / bSize);

            for (let by = 0; by < numBlocksY; by++) {
                for (let bx = 0; bx < numBlocksX; bx++) {
                    const sx = Math.min(bx, width - 1);
                    const sy = Math.min(by, height - 1);
                    const si = (sy * width + sx) * 4;
                    const lum = getLuminance(data[si], data[si + 1], data[si + 2]) / 255;
                    const maxR = bSize / 2;
                    const r = maxR * (1 - lum); // dark = large dot, light = small dot
                    const cx = bx * bSize + bSize / 2;
                    const cy = by * bSize + bSize / 2;

                    for (let dy = 0; dy < bSize; dy++) {
                        for (let dx = 0; dx < bSize; dx++) {
                            const px = bx * bSize + dx;
                            const py = by * bSize + dy;
                            if (px >= origW || py >= origH) continue;
                            const di = (py * origW + px) * 4;
                            const distSq = (px - cx + 0.5) ** 2 + (py - cy + 0.5) ** 2;
                            const color = distSq <= r * r ? shadowColor : highlightColor;
                            outData[di] = color[0];
                            outData[di + 1] = color[1];
                            outData[di + 2] = color[2];
                            outData[di + 3] = 255;
                        }
                    }
                }
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            self.postMessage({ imageData: new ImageData(outData as any, origW, origH), jobId: e.data.jobId });
            return;
        }

        if (algorithm === 'ascii') {
            const chars = ['@', '#', 'S', '%', '?', '*', '+', ';', ':', ',', '.', ' '];
            const origW = imageData.width;
            const origH = imageData.height;
            const bSize = Math.max(pointSize, 6);

            try {
                const canvas = new OffscreenCanvas(origW, origH);
                const ctx = canvas.getContext('2d')!;
                ctx.fillStyle = `rgb(${highlightColor[0]},${highlightColor[1]},${highlightColor[2]})`;
                ctx.fillRect(0, 0, origW, origH);
                ctx.fillStyle = `rgb(${shadowColor[0]},${shadowColor[1]},${shadowColor[2]})`;
                ctx.font = `bold ${bSize}px monospace`;
                ctx.textBaseline = 'top';
                const numBlocksX = Math.ceil(origW / bSize);
                const numBlocksY = Math.ceil(origH / bSize);

                for (let by = 0; by < numBlocksY; by++) {
                    for (let bx = 0; bx < numBlocksX; bx++) {
                        const sx = Math.min(bx, width - 1);
                        const sy = Math.min(by, height - 1);
                        const si = (sy * width + sx) * 4;
                        const lum = getLuminance(data[si], data[si + 1], data[si + 2]) / 255;
                        const charIdx = Math.min(Math.floor(lum * chars.length), chars.length - 1);
                        ctx.fillText(chars[charIdx], bx * bSize, by * bSize);
                    }
                }
                const imgData = ctx.getImageData(0, 0, origW, origH);
                self.postMessage({ imageData: imgData, jobId: e.data.jobId });
            } catch {
                // OffscreenCanvas not available — fall back to pixelate
                const resultData = new Uint8ClampedArray(data.length);
                for (let i = 0; i < data.length; i += 4) {
                    const closest = findClosestColor(data[i], data[i + 1], data[i + 2], palette, 'default');
                    resultData[i] = closest[0]; resultData[i + 1] = closest[1];
                    resultData[i + 2] = closest[2]; resultData[i + 3] = data[i + 3];
                }
                finish(resultData, width, height, imageData.width, imageData.height, pointSize, e.data.jobId);
            }
            return;
        }
    }

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

    // Calculate global dither bias based on threshold (128 = no bias)
    const range = colorPipeline === 'linear' ? 1 : 255;
    const mid = range / 2;
    const bias = (128 - threshold) / 128 * mid;

    // For multi-color thresholding, sort palette by luminance
    let sortedPalette = [...workingPalette].sort((a, b) => {
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
            if (algorithm === 'atkinson') {
                distributeError(dir * 1, 0, 1 / 8);
                distributeError(dir * 2, 0, 1 / 8);
                distributeError(dir * -1, 1, 1 / 8);
                distributeError(0, 1, 1 / 8);
                distributeError(dir * 1, 1, 1 / 8);
                distributeError(0, 2, 1 / 8);
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
