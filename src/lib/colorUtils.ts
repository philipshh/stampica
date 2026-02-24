
import { QuadtoneTheme, TritoneTheme, DuotoneTheme } from './dither';

export const generateRandomColor = (): string => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};

export const generateRandomPalette = (mode: 'duotone' | 'tritone' | 'quadtone') => {
    if (mode === 'duotone') {
        return {
            color1: generateRandomColor(),
            color2: generateRandomColor(),
        };
    } else if (mode === 'tritone') {
        return {
            color1: generateRandomColor(),
            color2: generateRandomColor(),
            color3: generateRandomColor(),
        };
    } else {
        return {
            color1: generateRandomColor(),
            color2: generateRandomColor(),
            color3: generateRandomColor(),
            color4: generateRandomColor(),
        };
    }
};

export const extractColors = async (imageSource: File | HTMLImageElement, count: number = 3): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const processImage = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            // Resize for faster processing
            const MAX_SIZE = 200;
            let width = img.width;
            let height = img.height;
            if (width > height) {
                if (width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                }
            } else {
                if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            const imageData = ctx.getImageData(0, 0, width, height).data;
            const colorMap: { [key: string]: number } = {};

            for (let i = 0; i < imageData.length; i += 4) {
                // Simple quantization by rounding to nearest 16
                const r = Math.round(imageData[i] / 16) * 16;
                const g = Math.round(imageData[i + 1] / 16) * 16;
                const b = Math.round(imageData[i + 2] / 16) * 16;

                // Skip transparent or very translucent pixels
                if (imageData[i + 3] < 128) continue;

                // Convert to hex
                const toHex = (c: number) => {
                    const hex = c.toString(16);
                    return hex.length === 1 ? '0' + hex : hex;
                };

                const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
                colorMap[hex] = (colorMap[hex] || 0) + 1;
            }

            const sortedColors = Object.entries(colorMap)
                .sort(([, a], [, b]) => b - a)
                .map(([color]) => color)
                .slice(0, count);

            // If we didn't find enough colors, fill with random ones or defaults
            while (sortedColors.length < count) {
                sortedColors.push(generateRandomColor());
            }

            resolve(sortedColors);
        };

        if (imageSource instanceof File) {
            img.src = URL.createObjectURL(imageSource);
            img.onload = () => {
                processImage();
                URL.revokeObjectURL(img.src);
            };
            img.onerror = reject;
        } else {
            img.src = imageSource.src;
            if (img.complete) {
                processImage();
            } else {
                img.onload = processImage;
                img.onerror = reject;
            }
        }
    });
};

export const hexToRgb = (hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
};

export const rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (c: number) => {
        const h = Math.max(0, Math.min(255, Math.round(c))).toString(16);
        return h.length === 1 ? '0' + h : h;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const interpolateColors = (colors: string[], steps: number): string[] => {
    if (colors.length < 2) return colors;
    if (steps <= colors.length) return colors;

    const result: string[] = [];
    const segments = colors.length - 1;
    const stepsPerSegment = (steps - 1) / segments;

    for (let i = 0; i < segments; i++) {
        const start = hexToRgb(colors[i]);
        const end = hexToRgb(colors[i + 1]);

        for (let j = 0; j < stepsPerSegment; j++) {
            const t = j / stepsPerSegment;
            const r = start[0] + (end[0] - start[0]) * t;
            const g = start[1] + (end[1] - start[1]) * t;
            const b = start[2] + (end[2] - start[2]) * t;
            result.push(rgbToHex(r, g, b));
        }
    }
    result.push(colors[colors.length - 1]);
    return result;
};

// applyTransparency removed: dithering output must remain fully opaque.

// HSV conversion utilities
export const rgbToHsv = (r: number, g: number, b: number): [number, number, number] => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    let h = 0;
    if (diff !== 0) {
        if (max === r) h = ((g - b) / diff) % 6;
        else if (max === g) h = (b - r) / diff + 2;
        else h = (r - g) / diff + 4;
        h *= 60;
        if (h < 0) h += 360;
    }

    const s = max === 0 ? 0 : diff / max;
    const v = max;

    return [h, s, v];
};

export const hsvToRgb = (h: number, s: number, v: number): [number, number, number] => {
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;

    let r = 0, g = 0, b = 0;
    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

    return [
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255)
    ];
};

// Hue distance with wrap-around
const hueDistance = (h1: number, h2: number): number => {
    const diff = Math.abs(h1 - h2);
    return Math.min(diff, 360 - diff);
};

export const buildAccentMask = (
    src: ImageData,
    opts: {
        enabled: boolean;
        targetHex: string;
        hueTolerance: number;
        minSaturation: number;
        minValue: number;
        edgeBoost?: boolean;
        edgeThreshold?: number;
    }
): Uint8Array => {
    if (!opts.enabled) return new Uint8Array(src.width * src.height);

    const mask = new Uint8Array(src.width * src.height);
    const data = src.data;
    const width = src.width;
    const height = src.height;

    // Target HSV
    const [targetR, targetG, targetB] = hexToRgb(opts.targetHex);
    const [targetH] = rgbToHsv(targetR, targetG, targetB);

    const edgeBoost = opts.edgeBoost ?? true;
    const edgeThreshold = opts.edgeThreshold ?? 22;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;

            if (data[i + 3] < 128) {
                mask[y * width + x] = 0;
                continue;
            }

            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const [h, s, v] = rgbToHsv(r, g, b);
            const hueDist = hueDistance(h, targetH);

            let isAccent = hueDist <= opts.hueTolerance &&
                s >= opts.minSaturation &&
                v >= opts.minValue;

            // Optional edge boost
            if (edgeBoost && !isAccent) {
                // Quick edge detection using luminance differences
                const luma = 0.299 * r + 0.587 * g + 0.114 * b;
                let edgeMag = 0;

                // Check right neighbor
                if (x < width - 1) {
                    const ri = i + 4;
                    const rluma = 0.299 * data[ri] + 0.587 * data[ri + 1] + 0.114 * data[ri + 2];
                    edgeMag = Math.max(edgeMag, Math.abs(luma - rluma));
                }

                // Check down neighbor
                if (y < height - 1) {
                    const di = ((y + 1) * width + x) * 4;
                    const dluma = 0.299 * data[di] + 0.587 * data[di + 1] + 0.114 * data[di + 2];
                    edgeMag = Math.max(edgeMag, Math.abs(luma - dluma));
                }

                if (edgeMag > edgeThreshold && s > opts.minSaturation * 0.6) {
                    isAccent = true;
                }
            }

            mask[y * width + x] = isAccent ? 255 : 0;
        }
    }

    return mask;
};

export const applyAccentWithMask = (
    dithered: ImageData,
    mask: Uint8Array,
    accentRgb: [number, number, number],
    strength: number = 1
): ImageData => {
    const out = new Uint8ClampedArray(dithered.data.length);
    const data = dithered.data;

    for (let i = 0; i < data.length; i += 4) {
        const pixelIndex = i / 4;

        if (mask[pixelIndex] === 255) {
            if (strength >= 1) {
                // Full replacement
                out[i] = accentRgb[0];
                out[i + 1] = accentRgb[1];
                out[i + 2] = accentRgb[2];
                out[i + 3] = data[i + 3];
            } else {
                // Blend toward accent
                const origR = data[i];
                const origG = data[i + 1];
                const origB = data[i + 2];

                out[i] = Math.round(origR + (accentRgb[0] - origR) * strength);
                out[i + 1] = Math.round(origG + (accentRgb[1] - origG) * strength);
                out[i + 2] = Math.round(origB + (accentRgb[2] - origB) * strength);
                out[i + 3] = data[i + 3];
            }
        } else {
            // Leave exactly as palette output
            out[i] = data[i];
            out[i + 1] = data[i + 1];
            out[i + 2] = data[i + 2];
            out[i + 3] = data[i + 3];
        }
    }

    return new ImageData(out, dithered.width, dithered.height);
};

export const QUADTONE_THEMES: QuadtoneTheme[] = [
    {
        name: "Base Reference",
        shadow: "#0B0B0F",
        midShadow: "#4B3FA6",
        midHighlight: "#D19A9A",
        highlight: "#FFFFFF"
    },
    {
        name: "Cold Neon Night",
        shadow: "#0A0F1F",
        midShadow: "#1F3C88",
        midHighlight: "#6EE7FF",
        highlight: "#F5FBFF"
    },
    {
        name: "Retro Cyberpunk",
        shadow: "#120A1A",
        midShadow: "#5B2E8A",
        midHighlight: "#FF5DA2",
        highlight: "#FFF2F7"
    },
    {
        name: "Warm Analog Film",
        shadow: "#1C120B",
        midShadow: "#6B3E2E",
        midHighlight: "#D9A066",
        highlight: "#FFF3E6"
    },
    {
        name: "Forest Dusk",
        shadow: "#0D1A14",
        midShadow: "#1F4D3A",
        midHighlight: "#8FC9A3",
        highlight: "#F2FFF8"
    },
    {
        name: "Desert Sunset",
        shadow: "#2A1208",
        midShadow: "#8A3E1F",
        midHighlight: "#F2A65A",
        highlight: "#FFF1E3"
    },
    {
        name: "Ice & Steel",
        shadow: "#0B141A",
        midShadow: "#2F5F7A",
        midHighlight: "#A7D8F0",
        highlight: "#F7FCFF"
    },
    {
        name: "Noir Purple",
        shadow: "#0E0B14",
        midShadow: "#3A2F5F",
        midHighlight: "#9E8AD9",
        highlight: "#F5F2FF"
    },
    {
        name: "Toxic Lime",
        shadow: "#0B1205",
        midShadow: "#2E5F1A",
        midHighlight: "#9AFF3C",
        highlight: "#F6FFE8"
    },
    {
        name: "Blood & Bone",
        shadow: "#120505",
        midShadow: "#5F1A1A",
        midHighlight: "#C94A4A",
        highlight: "#FFF0F0"
    },
    {
        name: "Blueprint Tech",
        shadow: "#07121F",
        midShadow: "#0E3A66",
        midHighlight: "#5FB3FF",
        highlight: "#F4FAFF"
    },
    {
        name: "Dark Knight Neon",
        shadow: "#0B0E2A",
        midShadow: "#1F2B8F",
        midHighlight: "#F07C73",
        highlight: "#F6E6CF"
    },
    {
        name: "Neon Noir",
        shadow: "#0A0A14",
        midShadow: "#2B2FFF",
        midHighlight: "#FF5DA2",
        highlight: "#FFE6F0"
    },
    {
        name: "Electric Sunset",
        shadow: "#120A1F",
        midShadow: "#3A2A8F",
        midHighlight: "#FF8A5B",
        highlight: "#FFE3C4"
    },
    {
        name: "Blade Runner Fog",
        shadow: "#0E1020",
        midShadow: "#39406B",
        midHighlight: "#C97C7C",
        highlight: "#E6DCD2"
    },
    {
        name: "Midnight Coral",
        shadow: "#0A0D1A",
        midShadow: "#2430A8",
        midHighlight: "#FF6F61",
        highlight: "#FFF1E6"
    },
    {
        name: "Ultraviolet Cream",
        shadow: "#0C0C1E",
        midShadow: "#4B3FD6",
        midHighlight: "#E58BAA",
        highlight: "#F4EBDD"
    },
    {
        name: "Neo Tokyo",
        shadow: "#060611",
        midShadow: "#1C2CFF",
        midHighlight: "#FF4D4D",
        highlight: "#FFE9D6"
    },
    {
        name: "Cold Flame",
        shadow: "#070B1A",
        midShadow: "#2233AA",
        midHighlight: "#FF7A3D",
        highlight: "#FFF0D8"
    },
    {
        name: "Synthwave Dusk",
        shadow: "#140A1F",
        midShadow: "#5B2DAA",
        midHighlight: "#FF77A8",
        highlight: "#FFEAF3"
    },
    {
        name: "Graphite Rose",
        shadow: "#0F1116",
        midShadow: "#2E3448",
        midHighlight: "#C07A8A",
        highlight: "#EDE1E5"
    }
];

export const TRITONE_THEMES: TritoneTheme[] = QUADTONE_THEMES.map(theme => ({
    name: theme.name,
    shadow: theme.shadow,
    mid: theme.midShadow,
    highlight: theme.highlight
}));

export const DUOTONE_THEMES: DuotoneTheme[] = QUADTONE_THEMES.map(theme => ({
    name: theme.name,
    shadow: theme.shadow,
    highlight: theme.highlight
}));

