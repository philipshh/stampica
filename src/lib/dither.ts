export type DitherAlgorithm =
    | 'none'
    | 'atkinson'
    | 'threshold'
    | 'stucki'
    | 'floyd-steinberg'
    | 'jarvis'
    | 'burkes'
    | 'sierra'
    | 'bayer-2'
    | 'bayer-4'
    | 'bayer-8'
    | 'halftone'
    | 'lines'
    | 'diagonal'
    | 'noise'
    | 'ascii';

export type EffectCategory = 'classic' | 'diffusion' | 'pattern';

export interface EffectInfo {
    id: DitherAlgorithm;
    label: string;
    category: EffectCategory;
}

// Effect gallery metadata — order defines display order
export const EFFECTS: EffectInfo[] = [
    { id: 'none', label: 'Original', category: 'classic' },
    { id: 'threshold', label: 'Threshold', category: 'classic' },
    { id: 'noise', label: 'Grain', category: 'classic' },
    { id: 'ascii', label: 'ASCII', category: 'classic' },
    { id: 'atkinson', label: 'Atkinson', category: 'diffusion' },
    { id: 'floyd-steinberg', label: 'Floyd', category: 'diffusion' },
    { id: 'stucki', label: 'Stucki', category: 'diffusion' },
    { id: 'jarvis', label: 'Jarvis', category: 'diffusion' },
    { id: 'burkes', label: 'Burkes', category: 'diffusion' },
    { id: 'sierra', label: 'Sierra', category: 'diffusion' },
    { id: 'bayer-2', label: 'Bayer S', category: 'pattern' },
    { id: 'bayer-4', label: 'Bayer M', category: 'pattern' },
    { id: 'bayer-8', label: 'Bayer L', category: 'pattern' },
    { id: 'halftone', label: 'Halftone', category: 'pattern' },
    { id: 'lines', label: 'Lines', category: 'pattern' },
    { id: 'diagonal', label: 'Diagonal', category: 'pattern' },
];
export type AspectRatio = 'A5' | 'A4' | 'A3' | 'A2' | 'A1' | 'A0' | '18x24' | '24x36' | '27x40' | 'custom';

export type PaddingSize = 'S' | 'M' | 'L';
export type ImagePadding = 'none' | 'same-as-poster';
export type LayoutOrder = string[]; // e.g. ['header', 'title', 'image', 'list', 'footer']
export type TitleFont = 'Inter' | 'Syne' | 'Playfair Display' | 'Unbounded' | 'Lato' | 'Roboto';
export type BodyFont = 'Inter' | 'Roboto' | 'Open Sans' | 'Lato';
export type PaperTexture = 'none' | 'texture-1' | 'texture-2' | 'texture-3' | 'folded' | 'glue' | 'photocopy';
export type Theme = 'light' | 'dark';

export interface ColorPreset {
    id: string;
    name: string;
    mode: 'duotone' | 'tritone' | 'quadtone';
    colors: { color1: string; color2: string; color3?: string; color4?: string };
    timestamp: number;
}

export interface QuadtoneTheme {
    name: string;
    shadow: string;
    midShadow: string;
    midHighlight: string;
    highlight: string;
    group?: string;
}

export interface TritoneTheme {
    name: string;
    shadow: string;
    mid: string;
    highlight: string;
    group?: string;
}

export interface DuotoneTheme {
    name: string;
    shadow: string;
    highlight: string;
    group?: string;
}

// Predefined color palette presets
// Predefined color palette presets removed in favor of dynamic generation

export type ImageMode = 'single' | 'grid';

export interface Slot {
    id: string;
    src?: string;
    file?: File;
    processedImageData?: ImageData;
    lastSettingsHash?: string;
    scale?: 'fill' | 'contain';
    alignX?: 'left' | 'center' | 'right';
    alignY?: 'top' | 'center' | 'bottom';
}

export interface GridSettings {
    enabled: boolean;
    selectedSlotId?: string;
    layout: {
        rows: number;
        cols: number;
        id: string;
    };
    images: Slot[];
}

export interface DitherOptions {
    algorithm: DitherAlgorithm;
    threshold: number;
    palette: [number, number, number][];
    brightness: number; // -100 to 100
    contrast: number;   // -100 to 100
    gamma: number;      // 0.1 to 3.0
    pointSize: number;  // 1 to 16
    previewResolution: number; // 400 to 2400 (preview long edge)
    strictSwatches: boolean;
    paletteSteps: number; // 2 to 16
    colorPipeline: 'default' | 'smooth' | 'linear';
    invert: boolean;
    colorMode: 'monochrome' | 'duotone' | 'tritone' | 'quadtone' | 'rgb';
    selectedThemeName?: string;
    // Custom colors for each mode
    monochromeColors: { dark: string; light: string };
    duotoneColors: { color1: string; color2: string };
    tritoneColors: { color1: string; color2: string; color3: string };
    quadtoneColors: { color1: string; color2: string; color3: string; color4: string };
    paperTexture: PaperTexture;
    paperTextureOpacity: number; // 0 to 100
    theme: Theme;
    imageMode: ImageMode;
    grid: GridSettings;
    poster: {
        enabled: boolean;
        title: string;
        year: string;
        description: string[];
        paperColor: string;
        textColor: string;
        titleColor?: string;
        subtitleColor?: string;
        directorTextColor: string;
        listColor?: string;
        descriptionColor?: string;
        yearColor?: string;
        titleFontSize: number;
        director: string;
        titleAlignment: 'left' | 'center' | 'right';
        footerLayout: 'standard' | 'reversed';
        imageScale: 'fit' | 'fill' | 'original';
        imageAlignX: 'left' | 'center' | 'right';
        imageAlignY: 'top' | 'center' | 'bottom';
        imagePadding: ImagePadding;
        exportFormat: 'png' | 'jpeg';
        resolution: 'high' | 'low';
        aspectRatio: AspectRatio;
        customDimensions?: {
            width: number;
            height: number;
            keepRatio: boolean;
        };
        upscaleFactor?: 1 | 2 | 4;
        paddingSize: PaddingSize;
        titleMargin: number;
        subtitleMargin: number;
        descriptionColumns: 1 | 2 | 3;
        imageBackgroundColor: string; // 'none', '#e0ded2', or custom hex
        layoutOrder: LayoutOrder;
        showHeader: boolean;
        showTitle: boolean;
        showImage: boolean;
        showFooter: boolean;
        // List Section Options
        listSection: {
            enabled: boolean;
            content: string[];
            alignment: 'left' | 'center' | 'right';
            columns: 1 | 2 | 3 | 4;
        };
        // Icon Section Options
        iconSection: {
            enabled: boolean;
            items: { icon: string; text: string }[];
            width: number; // Percentage or fixed? Tailwind usually. But standard is 4 columns.
            alignment: 'left' | 'center' | 'right';
            iconSize: number; // px
            iconColor: string;
            textColor: string;
        };
        imageRoundedCorners?: 'none' | 'S' | 'M' | 'L';
        subtitle?: string;
        showSubtitle?: boolean;
        subtitleFontSize?: number;
        titleFont?: TitleFont;
        bodyFont?: BodyFont;
        gap: number;
        textOnly?: boolean;
        contentVerticalAlign?: 'top' | 'center' | 'bottom';
        contentHorizontalAlign?: 'left' | 'center' | 'right';
        titleLetterSpacing?: number; // em units, e.g. -0.05
        titleLineHeight?: number;    // multiplier, e.g. 1.0
        textOverflow?: 'wrap' | 'clip';
    };
}

export interface WorkerMessage {
    imageData: ImageData;
    options: DitherOptions;
    jobId?: string;
}

export interface WorkerResponse {
    imageData: ImageData;
    jobId?: string;
}

export interface WorkerErrorResponse {
    error: string;
    fallback?: string;
    jobId?: string;
}

// Stored project type — extends DitherOptions with DB-side asset references
export interface StoredDitherOptions extends DitherOptions {
    assetId?: string;
}
