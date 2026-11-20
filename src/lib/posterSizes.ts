// Standard poster/frame sizes, grouped by aspect ratio.
// A design is laid out for one ratio; every size in that family is the same
// composition at a different resolution.

export type SizeFamilyId = 'iso' | '5:7' | '3:4' | '4:5' | '2:3';

export interface PosterSizeSpec {
    id: string;
    label: string;
    family: SizeFamilyId;
    widthMm: number;
    heightMm: number;
}

export interface SizeFamily {
    id: SizeFamilyId;
    label: string;
}

export const SIZE_FAMILIES: SizeFamily[] = [
    { id: 'iso', label: 'A series' },
    { id: '5:7', label: '5:7' },
    { id: '3:4', label: '3:4' },
    { id: '4:5', label: '4:5' },
    { id: '2:3', label: '2:3' },
];

const IN = 25.4;

export const POSTER_SIZES: PosterSizeSpec[] = [
    { id: 'A5', label: 'A5', family: 'iso', widthMm: 148, heightMm: 210 },
    { id: 'A4', label: 'A4', family: 'iso', widthMm: 210, heightMm: 297 },
    { id: 'A3', label: 'A3', family: 'iso', widthMm: 297, heightMm: 420 },
    { id: 'A2', label: 'A2', family: 'iso', widthMm: 420, heightMm: 594 },
    { id: 'A1', label: 'A1', family: 'iso', widthMm: 594, heightMm: 841 },

    { id: '13x18cm', label: '13×18 cm', family: '5:7', widthMm: 130, heightMm: 180 },
    { id: '50x70cm', label: '50×70 cm', family: '5:7', widthMm: 500, heightMm: 700 },

    { id: '30x40cm', label: '30×40 cm', family: '3:4', widthMm: 300, heightMm: 400 },
    { id: '12x16in', label: '12×16 in', family: '3:4', widthMm: 12 * IN, heightMm: 16 * IN },
    { id: '18x24in', label: '18×24 in', family: '3:4', widthMm: 18 * IN, heightMm: 24 * IN },

    { id: '8x10in', label: '8×10 in', family: '4:5', widthMm: 8 * IN, heightMm: 10 * IN },
    { id: '40x50cm', label: '40×50 cm', family: '4:5', widthMm: 400, heightMm: 500 },
    { id: '16x20in', label: '16×20 in', family: '4:5', widthMm: 16 * IN, heightMm: 20 * IN },

    { id: '20x30cm', label: '20×30 cm', family: '2:3', widthMm: 200, heightMm: 300 },
    { id: '12x18in', label: '12×18 in', family: '2:3', widthMm: 12 * IN, heightMm: 18 * IN },
    { id: '40x60cm', label: '40×60 cm', family: '2:3', widthMm: 400, heightMm: 600 },
    { id: '24x36in', label: '24×36 in', family: '2:3', widthMm: 24 * IN, heightMm: 36 * IN },
    { id: '61x91cm', label: '61×91 cm', family: '2:3', widthMm: 610, heightMm: 910 },
];

// Ids used by older saved projects
const LEGACY_IDS: Record<string, string> = { '18x24': '18x24in', '24x36': '24x36in', A0: 'A1', '27x40': '24x36in' };

export function getPosterSize(id: string | undefined): PosterSizeSpec {
    const key = id && LEGACY_IDS[id] ? LEGACY_IDS[id] : id;
    return POSTER_SIZES.find(s => s.id === key) ?? POSTER_SIZES[1];
}

// Canvas area above ~16.7 MP fails on iOS Safari, so large sizes drop below 300 dpi.
const TARGET_DPI = 300;
const MAX_PIXELS = 16_000_000;

export function getPixelSize(spec: PosterSizeSpec): { width: number; height: number; dpi: number } {
    const wIn = spec.widthMm / IN;
    const hIn = spec.heightMm / IN;
    const dpi = Math.min(TARGET_DPI, Math.floor(Math.sqrt(MAX_PIXELS / (wIn * hIn))));
    return { width: Math.round(wIn * dpi), height: Math.round(hIn * dpi), dpi };
}

export function sizesInFamily(family: SizeFamilyId): PosterSizeSpec[] {
    return POSTER_SIZES.filter(s => s.family === family);
}
