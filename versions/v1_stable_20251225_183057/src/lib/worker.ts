import { DitherOptions, WorkerMessage } from './dither';

// Helper to get luminance
const getLuminance = (r: number, g: number, b: number) => {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// Find closest color in palette using weighted Euclidean distance
const findClosestColor = (r: number, g: number, b: number, palette: [number, number, number][]): [number, number, number] => {
    let minDist = Infinity;
    let closest = palette[0];

    for (const color of palette) {
        // Weighted Euclidean distance (Red: 0.299, Green: 0.587, Blue: 0.114)
        // We square the weights to keep the calculation in squared space for performance
        const dist =
            Math.pow(r - color[0], 2) * 0.299 +
            Math.pow(g - color[1], 2) * 0.587 +
            Math.pow(b - color[2], 2) * 0.114;

        if (dist < minDist) {
            minDist = dist;
            closest = color;
        }
    }
    return closest;
};

// Cluster 8x8 matrix for Blocky Pixel
const clusterMatrix8x8 = [
    [24, 10, 12, 26, 35, 47, 49, 37],
    [8, 0, 2, 14, 45, 59, 61, 48],
    [22, 6, 4, 16, 43, 57, 63, 50],
    [30, 20, 18, 28, 33, 41, 55, 39],
    [34, 46, 48, 36, 25, 11, 13, 27],
    [44, 58, 60, 49, 9, 1, 3, 15],
    [42, 56, 62, 51, 23, 7, 5, 17],
    [32, 40, 54, 38, 31, 21, 19, 29]
];

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

const pixelate = (imageData: ImageData, pixelSize: number): ImageData => {
    if (pixelSize <= 1) return imageData;

    const w = imageData.width;
    const h = imageData.height;
    const newW = Math.ceil(w / pixelSize);
    const newH = Math.ceil(h / pixelSize);
    const data = new Uint8ClampedArray(imageData.data);
    const newData = new Uint8ClampedArray(newW * newH * 4);

    for (let y = 0; y < newH; y++) {
        for (let x = 0; x < newW; x++) {
            // Calculate average color of the block
            let r = 0, g = 0, b = 0, count = 0;
            const startY = y * pixelSize;
            const startX = x * pixelSize;

            for (let dy = 0; dy < pixelSize && startY + dy < h; dy++) {
                for (let dx = 0; dx < pixelSize && startX + dx < w; dx++) {
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
    const { algorithm, threshold, palette, pixelSize } = options;

    // 1. Pixelate (Downscale)
    // If pixelSize > 1, we work on a smaller image
    const workingImage = pixelate(imageData, pixelSize);

    const width = workingImage.width;
    const height = workingImage.height;
    const data = workingImage.data;

    // 2. Apply Effects (Brightness, Contrast, etc.)
    applyEffects(data, options);

    // If algorithm is 'none', skip dithering and return the image as-is
    if (algorithm === 'none') {
        // 4. Upscale if needed
        if (pixelSize > 1) {
            const originalWidth = imageData.width;
            const originalHeight = imageData.height;
            const upscaledData = new Uint8ClampedArray(originalWidth * originalHeight * 4);

            for (let y = 0; y < originalHeight; y++) {
                for (let x = 0; x < originalWidth; x++) {
                    // Nearest neighbor interpolation
                    const srcX = Math.floor(x / pixelSize);
                    const srcY = Math.floor(y / pixelSize);

                    // Clamp coordinates
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

            self.postMessage({ imageData: new ImageData(upscaledData, originalWidth, originalHeight) });
        } else {
            self.postMessage({ imageData: workingImage });
        }
        return;
    }

    const getPixelIndex = (x: number, y: number) => (y * width + x) * 4;

    // 3. Dither
    for (let y = 0; y < height; y++) {
        const isReverse = y % 2 !== 0;
        const startX = isReverse ? width - 1 : 0;
        const endX = isReverse ? -1 : width;
        const stepX = isReverse ? -1 : 1;

        for (let x = startX; x !== endX; x += stepX) {
            const i = getPixelIndex(x, y);

            const oldR = data[i];
            const oldG = data[i + 1];
            const oldB = data[i + 2];

            // Handle Threshold Algorithm
            if (algorithm === 'threshold') {
                // If we have a 2-color palette (Monochrome/Duotone), use the threshold slider
                if (palette.length === 2) {
                    const luminance = getLuminance(oldR, oldG, oldB);
                    const target = luminance < threshold ? palette[0] : palette[1];

                    data[i] = target[0];
                    data[i + 1] = target[1];
                    data[i + 2] = target[2];
                    continue;
                }

                // For multi-color palettes, fall back to nearest color
                const closest = findClosestColor(oldR, oldG, oldB, palette);
                data[i] = closest[0];
                data[i + 1] = closest[1];
                data[i + 2] = closest[2];
                continue;
            }

            const closest = findClosestColor(oldR, oldG, oldB, palette);

            data[i] = closest[0];
            data[i + 1] = closest[1];
            data[i + 2] = closest[2];

            const errR = oldR - closest[0];
            const errG = oldG - closest[1];
            const errB = oldB - closest[2];

            const distributeError = (dx: number, dy: number, factor: number) => {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const ni = getPixelIndex(nx, ny);
                    data[ni] = Math.min(255, Math.max(0, data[ni] + errR * factor));
                    data[ni + 1] = Math.min(255, Math.max(0, data[ni + 1] + errG * factor));
                    data[ni + 2] = Math.min(255, Math.max(0, data[ni + 2] + errB * factor));
                }
            };

            // Serpentine scanning: use stepX as direction
            const dir = stepX;

            if (algorithm === 'atkinson') {
                distributeError(dir * 1, 0, 1 / 8);
                distributeError(dir * 2, 0, 1 / 8);
                distributeError(dir * -1, 1, 1 / 8);
                distributeError(0, 1, 1 / 8);
                distributeError(dir * 1, 1, 1 / 8);
                distributeError(0, 2, 1 / 8);
            } else if (algorithm === 'stucki') {
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

    // 4. Upscale if needed
    if (pixelSize > 1) {
        const originalWidth = imageData.width;
        const originalHeight = imageData.height;
        const upscaledData = new Uint8ClampedArray(originalWidth * originalHeight * 4);

        for (let y = 0; y < originalHeight; y++) {
            for (let x = 0; x < originalWidth; x++) {
                // Nearest neighbor interpolation
                const srcX = Math.floor(x / pixelSize);
                const srcY = Math.floor(y / pixelSize);

                // Clamp coordinates
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

        self.postMessage({ imageData: new ImageData(upscaledData, originalWidth, originalHeight) });
    } else {
        self.postMessage({ imageData: workingImage });
    }
};
