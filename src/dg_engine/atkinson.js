import { toGrayscale, quantizeValue, distributeError, applyDuotone, applyTritone, applyCartoon, applyQuadtone } from './utils.js';

// Atkinson Dithering Algorithm
export function atkinsonDither(imageData, colorMode, palette, threshold = 128) {
    const data = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;

    // Bias based on threshold (128 = no bias)
    const bias = 128 - threshold;

    if (colorMode === 'monochrome') {
        toGrayscale(data);
    }

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;

            if (data[idx + 3] < 128) continue;

            if (colorMode === 'color') {
                for (let c = 0; c < 3; c++) {
                    const oldValue = data[idx + c];
                    const biasedValue = Math.max(0, Math.min(255, oldValue + bias));
                    const newValue = quantizeValue(biasedValue, colorMode);
                    data[idx + c] = newValue;

                    const error = biasedValue - newValue;

                    distributeError(data, width, height, x, y, c, error, [
                        [1, 0, 1 / 8], [2, 0, 1 / 8],
                        [-1, 1, 1 / 8], [0, 1, 1 / 8], [1, 1, 1 / 8],
                        [0, 2, 1 / 8]
                    ]);
                }
            } else {
                const oldValue = data[idx];
                const biasedValue = Math.max(0, Math.min(255, oldValue + bias));
                const newValue = quantizeValue(biasedValue, colorMode);
                data[idx] = data[idx + 1] = data[idx + 2] = newValue;

                const error = biasedValue - newValue;

                distributeError(data, width, height, x, y, 0, error, [
                    [1, 0, 1 / 8], [2, 0, 1 / 8],
                    [-1, 1, 1 / 8], [0, 1, 1 / 8], [1, 1, 1 / 8],
                    [0, 2, 1 / 8]
                ]);
            }
        }
    }

    if (colorMode === 'duotone') {
        applyDuotone(data, palette);
    } else if (colorMode === 'tritone') {
        applyTritone(data, palette);
    } else if (colorMode === 'quadtone') {
        applyQuadtone(data, palette);
    } else if (colorMode === 'cartoon') {
        applyCartoon(data, palette);
    }

    return new ImageData(data, width, height);
}