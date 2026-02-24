export type DitherAlgorithm =
    | 'none'
    | 'atkinson'
    | 'threshold';
export type AspectRatio = 'A4' | 'A3' | 'A2' | 'A1' | 'A0' | '18x24' | '24x36' | '27x40';
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

// Predefined color palette presets
// Predefined color palette presets removed in favor of dynamic generation

export interface DitherOptions {
    algorithm: DitherAlgorithm;
    threshold: number;
    omdbApiKey?: string;
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
    // Custom colors for each mode
    monochromeColors: { dark: string; light: string };
    duotoneColors: { color1: string; color2: string };
    tritoneColors: { color1: string; color2: string; color3: string };
    quadtoneColors: { color1: string; color2: string; color3: string; color4: string };
    paperTexture: PaperTexture;
    paperTextureOpacity: number; // 0 to 100
    theme: Theme;
    designMode: 'poster' | 'tshirt';
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
        paddingSize: PaddingSize;
        titleMargin: 'S' | 'M' | 'L';
        subtitleMargin?: 'S' | 'M' | 'L';
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
    };
}

export interface WorkerMessage {
    imageData: ImageData;
    options: DitherOptions;
}

export interface WorkerResponse {
    imageData: ImageData;
}
