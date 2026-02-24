// @ts-ignore
import { atkinsonDither } from './atkinson.js';
// @ts-ignore
import { floydSteinbergDither } from './floyd-steinberg.js';
// @ts-ignore
import { stuckiDither } from './stucki.js';
// @ts-ignore
import { thresholdDither } from './threshold.js';

export async function runDitherGarden(imageData: ImageData, algorithm: string, colorMode: string, palette: string[], threshold?: number): Promise<ImageData> {
    // Normalize algorithm key
    const algo = (algorithm || 'atkinson').toLowerCase();

    // Ensure palette validity for multi-color modes
    let usedPalette = palette;
    if (colorMode === 'quadtone') {
        if (!palette || palette.length < 4) {
            console.warn('Quadtone requested but palette has fewer than 4 colors. Falling back.');
            usedPalette = (palette && palette.length > 0) ? palette.slice(0) : ['#000000'];
            while (usedPalette.length < 4) usedPalette.push(usedPalette[usedPalette.length - 1]);
        }
    } else if (colorMode === 'tritone') {
        if (!palette || palette.length < 3) {
            console.warn('Tritone requested but palette has fewer than 3 colors. Falling back.');
            usedPalette = (palette && palette.length > 0) ? palette.slice(0) : ['#000000'];
            while (usedPalette.length < 3) usedPalette.push(usedPalette[usedPalette.length - 1]);
        }
    }

    switch (algo) {
        case 'atkinson':
            return atkinsonDither(imageData, colorMode, usedPalette, threshold);
        case 'floyd':
        case 'floyd-steinberg':
        case 'floydsteinberg':
            return floydSteinbergDither(imageData, colorMode, usedPalette, threshold);
        case 'stucki':
            return stuckiDither(imageData, colorMode, usedPalette, threshold);
        case 'threshold':
            return thresholdDither(imageData, colorMode, usedPalette, threshold);
        default:
            // Default to atkinson
            return atkinsonDither(imageData, colorMode, usedPalette, threshold);
    }
}
