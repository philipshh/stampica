// Adaptive threshold dithering with Otsu's method
import { toGrayscale, applyDuotone, applyCartoon, applyQuadtone, hexToRgb } from './utils.js';

// Helper to get luminance
const getLuminance = (r, g, b) => {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// Adaptive threshold dithering with Otsu's method
export function thresholdDither(imageData, colorMode, palette, userThreshold = 128) {
    const data = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;

    if (colorMode === 'monochrome' || colorMode === 'duotone' || colorMode === 'tritone' || colorMode === 'cartoon' || colorMode === 'quadtone') {
        toGrayscale(data);
    }

    function calculateOptimalThreshold(pixelData, mode) {
        if (mode === 'color') return 128;
        // For multi-color modes, use the provided threshold parameter
        return userThreshold;
    }

    const threshold = calculateOptimalThreshold(data, colorMode);

    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue;
        if (colorMode === 'color') {
            for (let c = 0; c < 3; c++) {
                const value = data[i + c];
                const distance = Math.abs(value - threshold);
                if (distance < 4) {
                    const factor = distance / 4;
                    data[i + c] = value > threshold ? Math.round(255 * (0.8 + factor * 0.2)) : Math.round(255 * (0.2 - factor * 0.2));
                } else {
                    data[i + c] = value > threshold ? 255 : 0;
                }
            }
        } else if (colorMode === 'cartoon') {
            const gray = data[i];
            let value;
            const pixelIndex = Math.floor(i / 4);
            const x = pixelIndex % width;
            const y = Math.floor(pixelIndex / width);
            let localContrast = 0;
            let neighborCount = 0;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        const neighborIndex = (ny * width + nx) * 4;
                        localContrast += Math.abs(data[neighborIndex] - gray);
                        neighborCount++;
                    }
                }
            }
            localContrast /= neighborCount;
            if (localContrast > 20) {
                value = gray > threshold ? 255 : 0;
            } else {
                const distance = Math.abs(gray - threshold);
                if (distance < 8) {
                    const factor = distance / 8;
                    value = gray > threshold ? Math.round(255 * (0.7 + factor * 0.3)) : Math.round(255 * (0.3 - factor * 0.3));
                } else {
                    value = gray > threshold ? 255 : 0;
                }
            }
            data[i] = data[i + 1] = data[i + 2] = Math.max(0, Math.min(255, value));
        } else {
            // General multi-color threshold for monochrome, duotone, tritone, quadtone
            // Sorted palette by luminance
            const sortedPalette = palette.map(hex => hexToRgb(hex)).sort((a, b) =>
                getLuminance(a.r, a.g, a.b) - getLuminance(b.r, b.g, b.b)
            );

            const lum = data[i];
            const mid = 127.5;
            const bias = (threshold - 128) / 128 * mid;
            const biasedLum = Math.max(0, Math.min(255, lum - bias));
            const idx = Math.floor((biasedLum / 255) * sortedPalette.length);
            const color = sortedPalette[Math.min(idx, sortedPalette.length - 1)];
            data[i] = color.r;
            data[i + 1] = color.g;
            data[i + 2] = color.b;
        }
    }

    if (colorMode === 'cartoon') {
        applyCartoon(data, palette);
    }

    return new ImageData(data, width, height);
}