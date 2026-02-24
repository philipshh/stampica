import { DitherOptions, WorkerMessage } from './dither';

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

const applyEffects = (data: Uint8ClampedArray, options: DitherOptions) => {
    const { brightness, contrast, gamma, invert } = options;

    const b = brightness / 100; // -1 to 1
    const c = (contrast + 100) / 100; // 0 to 2
    const c2 = c * c; // Contrast curve

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i] / 255;
        let g = data[i + 1] / 255;
        let bl = data[i + 2] / 255;

        // Invert
        if (invert) {
            r = 1 - r;
            g = 1 - g;
            bl = 1 - bl;
        }

        // Brightness
        r += b;
        g += b;
        bl += b;

        // Contrast
        r = (r - 0.5) * c2 + 0.5;
        g = (g - 0.5) * c2 + 0.5;
        bl = (bl - 0.5) * c2 + 0.5;

        // Gamma
        if (gamma !== 1) {
            r = Math.pow(Math.max(0, r), 1 / gamma);
            g = Math.pow(Math.max(0, g), 1 / gamma);
            bl = Math.pow(Math.max(0, bl), 1 / gamma);
        }

        data[i] = Math.min(255, Math.max(0, r * 255));
        data[i + 1] = Math.min(255, Math.max(0, g * 255));
        data[i + 2] = Math.min(255, Math.max(0, bl * 255));
    }
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
            newData[i + 3] = 255;
        }
    }

    return new ImageData(newData, newW, newH);
};

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
    const { imageData, options } = e.data;
    const { algorithm, threshold, palette, pointSize, colorPipeline } = options;

    // 1. Pixelate (Downscale)
    const workingImage = pixelate(imageData, pointSize);
    const width = workingImage.width;
    const height = workingImage.height;
    const data = workingImage.data;

    // 2. Apply Effects
    applyEffects(data, options);

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
            resultData[i + 3] = 255;
        }
        finish(resultData, width, height, imageData.width, imageData.height, pointSize);
        return;
    }

    // 3. Dither
    const getPixelIndex = (x: number, y: number) => (y * width + x) * 4;

    // For multi-color thresholding, sort palette by luminance
    let sortedPalette = [...workingPalette];
    if (algorithm === 'threshold') {
        sortedPalette.sort((a, b) => {
            return getLuminance(a[0], a[1], a[2]) - getLuminance(b[0], b[1], b[2]);
        });
    }

    for (let y = 0; y < height; y++) {
        const isReverse = y % 2 !== 0;
        const startX = isReverse ? width - 1 : 0;
        const endX = isReverse ? -1 : width;
        const stepX = isReverse ? -1 : 1;

        for (let x = startX; x !== endX; x += stepX) {
            const i = getPixelIndex(x, y);

            const oldR = buffer[i];
            const oldG = buffer[i + 1];
            const oldB = buffer[i + 2];

            let closest: [number, number, number];

            if (algorithm === 'threshold') {
                // Multi-color threshold logic
                // Normalize luminance to index range [0, palette.length - 1]
                const lum = getLuminance(oldR, oldG, oldB);

                // Adjust by threshold slider (center is 128)
                const range = colorPipeline === 'linear' ? 1 : 255;
                const mid = range / 2;
                const bias = (threshold - 128) / 128 * mid;
                const biasedLum = Math.max(0, Math.min(range, lum - bias));

                const idx = Math.floor((biasedLum / range) * sortedPalette.length);
                closest = sortedPalette[Math.min(idx, sortedPalette.length - 1)];
            } else {
                closest = findClosestColor(oldR, oldG, oldB, workingPalette, colorPipeline);
            }

            buffer[i] = closest[0];
            buffer[i + 1] = closest[1];
            buffer[i + 2] = closest[2];

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

    // Convert buffer back to Uint8
    const resultData = new Uint8ClampedArray(data.length);
    for (let i = 0; i < data.length; i += 4) {
        resultData[i] = colorPipeline === 'linear' ? toSRGB(buffer[i]) : buffer[i];
        resultData[i + 1] = colorPipeline === 'linear' ? toSRGB(buffer[i + 1]) : buffer[i + 1];
        resultData[i + 2] = colorPipeline === 'linear' ? toSRGB(buffer[i + 2]) : buffer[i + 2];
        resultData[i + 3] = 255;
    }

    finish(resultData, width, height, imageData.width, imageData.height, pointSize);
};

function finish(data: Uint8ClampedArray, width: number, height: number, originalWidth: number, originalHeight: number, pointSize: number) {
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
                upscaledData[dstI + 3] = 255;
            }
        }
        self.postMessage({ imageData: new ImageData(upscaledData as any, originalWidth, originalHeight) });
    } else {
        self.postMessage({ imageData: new ImageData(data as any, width, height) });
    }
}
