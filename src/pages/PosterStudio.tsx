import { useState } from 'react';
import { DitherAlgorithm, DitherOptions, TitleFont } from '../lib/dither';
import { DEFAULT_OPTIONS } from '../lib/defaultOptions';
import { computePaletteFromColorMode, interpolateColors, rgbToHex, hexToRgb, QUADTONE_THEMES, TRITONE_THEMES, DUOTONE_THEMES } from '../lib/colorUtils';
import { getDitheredImageData } from '../lib/posterExport';
import { drawPosterToCanvas, getPosterDimensions } from '../lib/posterRenderer';

// Dev-only: renders the landing-page showcase posters through the real export
// pipeline. Source photos go in public/_src/<photo>.jpg (git-ignored; Unsplash
// License). "Render + save" writes public/showcase/<id>.jpg via the dev-server
// plugin in vite.config.ts; then shrink them for the web:
//   for f in public/showcase/*.jpg; do sips --resampleWidth 480 -s formatOptions 82 "$f" --out "$f"; done

interface ShowcaseSpec {
    id: string;
    photo: string;
    size: string;
    algorithm: DitherAlgorithm;
    mode: 'monochrome' | 'duotone' | 'tritone' | 'quadtone';
    theme?: string;
    mono?: { dark: string; light: string };
    title: string;
    subtitle?: string;
    year: string;
    director: string;
    description?: string;
    font?: TitleFont;
    titleSize?: number;
    order?: string[];
    align?: 'left' | 'center' | 'right';
    threshold?: number;
    brightness?: number;
    asciiText?: string;
    invert?: boolean;
    // Effect only, no poster layout (for the landing before/after slider)
    raw?: boolean;
    // Interpolate the theme into this many colors (posterized look)
    steps?: number;
    contrast?: number;
    paper?: string;
    ink?: string;
    imagePadding?: 'none' | 'same-as-poster';
}

export const SHOWCASE: ShowcaseSpec[] = [
    { id: 'ana-marko', photo: 'couple-sweaters', size: 'A4', algorithm: 'halftone', mode: 'duotone', theme: 'Desert Sunset',
      title: 'Ana & Marko', subtitle: 'Since the first coffee', year: '2019', director: 'Beograd', font: 'Playfair Display', titleSize: 84 },
    { id: 'luna', photo: 'dogmom-kiss', size: '40x50cm', algorithm: 'atkinson', mode: 'quadtone', theme: 'Warm Analog Film',
      title: 'Luna', subtitle: 'Best girl, every single day', year: '2021', director: 'Golden retriever', font: 'Unbounded', titleSize: 104 },
    { id: 'max', photo: 'dogdad-woods', size: '30x40cm', algorithm: 'bayer-4', mode: 'tritone', theme: 'Forest Dusk',
      title: 'Max & me', year: '2023', director: 'Fruška gora', order: ['header', 'title', 'image', 'footer'], titleSize: 96 },
    { id: 'hram', photo: 'bg-temple', size: '50x70cm', algorithm: 'lines', mode: 'tritone', theme: 'Blueprint Tech',
      title: 'Hram Svetog Save', subtitle: 'Vračar', year: '1935', director: 'Beograd', align: 'center', titleSize: 76 },
    { id: 'sava', photo: 'bg-bridge', size: '8x10in', algorithm: 'diagonal', mode: 'duotone', theme: 'Ice & Steel',
      title: 'Sava', subtitle: 'Ada Ciganlija, summer', year: '2024', director: 'Beograd', font: 'Unbounded', titleSize: 110 },
    { id: 'durmitor', photo: 'couple-mountain', size: '40x60cm', algorithm: 'floyd-steinberg', mode: 'quadtone', theme: 'Ultraviolet Cream',
      title: 'Our first trip', subtitle: 'Durmitor', year: '2023', director: 'Jelena & Nikola', titleSize: 84 },
    { id: 'petrovic', photo: 'family-field', size: 'A4', algorithm: 'noise', mode: 'tritone', theme: 'Warm Analog Film',
      title: 'Porodica Petrović', year: '2024', director: 'Summer', order: ['header', 'title', 'image', 'footer'], font: 'Playfair Display', titleSize: 80 },
    { id: 'knez', photo: 'bg-street', size: '12x18in', algorithm: 'stucki', mode: 'duotone', theme: 'Graphite Rose',
      title: 'Knez Mihailova', subtitle: 'Stari grad', year: '1870', director: 'Beograd', titleSize: 80 },
    { id: 'alps', photo: 'lake-snow', size: '50x70cm', algorithm: 'bayer-8', mode: 'quadtone', theme: 'Ice & Steel',
      title: 'Above the clouds', year: '2022', director: 'Dolomiti', align: 'right', titleSize: 84 },
    { id: 'mila-luka', photo: 'couple-wall', size: '30x40cm', algorithm: 'threshold', mode: 'monochrome', mono: { dark: '#E8491D', light: '#F6F1E7' },
      title: 'Mila + Luka', subtitle: 'Est. Dorćol', year: '2022', director: 'Wedding day', font: 'Syne', titleSize: 96 },
    { id: 'kiki', photo: 'cat-white', size: 'A4', algorithm: 'bayer-2', mode: 'quadtone', theme: 'Midnight Coral',
      title: 'Kiki', subtitle: 'Queen of the windowsill', year: '2018', director: 'Calico', font: 'Unbounded', titleSize: 120 },
    { id: 'wildflowers', photo: 'couple-flowers', size: '50x70cm', algorithm: 'sierra', mode: 'tritone', theme: 'Desert Sunset',
      title: 'Wildflowers', subtitle: 'The day you said yes', year: '2025', director: 'Vojvodina', font: 'Playfair Display', titleSize: 92, align: 'center' },
    { id: 'bella', photo: 'dogmom-hug', size: '8x10in', algorithm: 'halftone', mode: 'duotone', theme: 'Midnight Coral',
      title: 'Bella', subtitle: 'Snow dog, warm heart', year: '2022', director: 'Samoyed', font: 'Unbounded', titleSize: 110 },
    { id: 'rex', photo: 'dogdad-black', size: 'A4', algorithm: 'jarvis', mode: 'quadtone', theme: 'Forest Dusk',
      title: 'Rex', subtitle: 'Hiking buddy since day one', year: '2021', director: 'Border collie', order: ['header', 'title', 'image', 'footer'], titleSize: 120 },
    { id: 'zemun', photo: 'bg-rooftops', size: '30x40cm', algorithm: 'burkes', mode: 'quadtone', theme: 'Desert Sunset',
      title: 'Zemun', subtitle: 'Gardoš rooftops', year: '1896', director: 'Beograd', titleSize: 104 },
    { id: 'louise', photo: 'lake-louise', size: '61x91cm', algorithm: 'halftone', mode: 'tritone', theme: 'Ice & Steel',
      title: 'Lake Louise', subtitle: 'Banff', year: '2019', director: 'Honeymoon', align: 'center', titleSize: 84 },
    { id: 'baby', photo: 'family-baby', size: 'A3', algorithm: 'atkinson', mode: 'duotone', theme: 'Graphite Rose',
      title: 'Hello, Sofija', subtitle: '3.2 kg of pure joy', year: '2025', director: 'Welcome home', font: 'Playfair Display', titleSize: 84 },
    { id: 'pobednik', photo: 'bg-pobednik', size: '40x60cm', algorithm: 'bayer-4', mode: 'duotone', theme: 'Blueprint Tech',
      title: 'Pobednik', subtitle: 'Kalemegdan', year: '1928', director: 'Beograd', font: 'Syne', titleSize: 110, align: 'right' },
    { id: 'deda', photo: 'grandpa-walk', size: '40x50cm', algorithm: 'floyd-steinberg', mode: 'quadtone', theme: 'Warm Analog Film',
      title: 'Deda i ja', subtitle: 'Sunday walks', year: '2024', director: 'Family', order: ['header', 'title', 'image', 'footer'], font: 'Playfair Display', titleSize: 96 },
    { id: 'jelena-maja', photo: 'friends-sea', size: '12x18in', algorithm: 'lines', mode: 'duotone', theme: 'Electric Sunset',
      title: 'Summer \'24', subtitle: 'Jelena & Maja, Budva', year: '2024', director: 'Best friends', font: 'Unbounded', titleSize: 104 },
    { id: 'buba', photo: 'car-beetle', size: '13x18cm', algorithm: 'threshold', mode: 'monochrome', mono: { dark: '#1F4F5A', light: '#F3EEE4' },
      title: 'Buba', subtitle: 'My first car', year: '1972', director: 'Volkswagen', titleSize: 120 },
    // One photo, many looks (landing "same photo" section)
    { id: 'kiki-halftone', photo: 'cat-white', size: '30x40cm', algorithm: 'halftone', mode: 'duotone', theme: 'Ice & Steel',
      title: 'Kiki', subtitle: 'Halftone', year: '2018', director: 'Calico', titleSize: 120 },
    { id: 'kiki-ascii', photo: 'cat-white', size: 'A4', algorithm: 'ascii', mode: 'duotone', theme: 'Desert Sunset', asciiText: 'KIKI ', invert: true, threshold: 30,
      title: 'Kiki', subtitle: 'Her name, in letters', year: '2018', director: 'Calico', font: 'Syne', titleSize: 120 },
    { id: 'kiki-lines', photo: 'cat-white', size: '40x50cm', algorithm: 'lines', mode: 'tritone', theme: 'Blueprint Tech',
      title: 'Kiki', subtitle: 'Line screen', year: '2018', director: 'Calico', order: ['header', 'title', 'image', 'footer'], titleSize: 120 },
    { id: 'kiki-pop', photo: 'cat-white', size: '8x10in', algorithm: 'threshold', mode: 'monochrome', mono: { dark: '#E8491D', light: '#F6F1E7' },
      title: 'KIKI', subtitle: 'Two colors, no fuss', year: '2018', director: 'Calico', font: 'Unbounded', titleSize: 120, align: 'center' },
    { id: 'kiki-film', photo: 'cat-white', size: '20x30cm', algorithm: 'atkinson', mode: 'quadtone', theme: 'Warm Analog Film',
      title: 'Kiki', subtitle: 'Queen of the windowsill', year: '2018', director: 'Calico', font: 'Playfair Display', titleSize: 110 },
    { id: 'kiki-poster-look', photo: 'cat-white', size: '20x30cm', algorithm: 'threshold', mode: 'quadtone', theme: 'Electric Sunset', steps: 7,
      title: '', year: '', director: '', raw: true },
];

function buildOptions(spec: ShowcaseSpec): DitherOptions {
    const o: DitherOptions = JSON.parse(JSON.stringify(DEFAULT_OPTIONS));
    o.algorithm = spec.algorithm;
    o.colorMode = spec.mode;
    o.threshold = spec.threshold ?? 128;
    o.brightness = spec.brightness ?? 0;
    o.asciiText = spec.asciiText ?? '';
    o.invert = spec.invert ?? false;
    o.contrast = spec.contrast ?? 0;
    if (spec.mono) o.monochromeColors = spec.mono;
    if (spec.theme) {
        const q = QUADTONE_THEMES.find(t => t.name === spec.theme);
        const t3 = TRITONE_THEMES.find(t => t.name === spec.theme);
        const d = DUOTONE_THEMES.find(t => t.name === spec.theme);
        if (q) o.quadtoneColors = { color1: q.shadow, color2: q.midShadow, color3: q.midHighlight, color4: q.highlight };
        if (t3) o.tritoneColors = { color1: t3.shadow, color2: t3.mid, color3: t3.highlight };
        if (d) o.duotoneColors = { color1: d.shadow, color2: d.highlight };
        o.selectedThemeName = spec.theme;
    }
    o.palette = computePaletteFromColorMode(o);
    if (spec.steps) {
        o.strictSwatches = false;
        o.paletteSteps = spec.steps;
        o.palette = interpolateColors(o.palette.map(c => rgbToHex(c[0], c[1], c[2])), spec.steps).map(hex => hexToRgb(hex));
    }
    const ink = spec.ink ?? '#141414';
    o.poster = {
        ...o.poster,
        aspectRatio: spec.size,
        title: spec.title,
        subtitle: spec.subtitle ?? '',
        showSubtitle: !!spec.subtitle,
        year: spec.year,
        director: spec.director,
        description: [spec.description ?? ''],
        titleFont: spec.font ?? 'Inter',
        titleFontSize: spec.titleSize ?? 48,
        subtitleFontSize: 20,
        titleAlignment: spec.align ?? 'left',
        layoutOrder: spec.order ?? ['header', 'image', 'title', 'footer'],
        paperColor: spec.paper ?? '#FFFFFF',
        textColor: ink, titleColor: ink, subtitleColor: ink, directorTextColor: ink,
        listColor: ink, descriptionColor: ink, yearColor: ink,
        imagePadding: spec.imagePadding ?? 'same-as-poster',
        resolution: 'low',
    };
    return o;
}

async function renderSpec(spec: ShowcaseSpec): Promise<Blob> {
    const opts = buildOptions(spec);
    const res = await fetch(`/_src/${spec.photo}.jpg`);
    const file = new File([await res.blob()], `${spec.photo}.jpg`, { type: 'image/jpeg' });
    let canvas: HTMLCanvasElement;
    if (spec.raw) {
        const imageData = await getDitheredImageData(file, opts, 960);
        canvas = document.createElement('canvas');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        canvas.getContext('2d')!.putImageData(imageData, 0, 0);
    } else {
        const dims = getPosterDimensions(opts, spec.size, 'low');
        const imageData = await getDitheredImageData(file, opts, Math.max(dims.width, dims.height));
        canvas = await drawPosterToCanvas(opts, imageData, dims);
    }
    return new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/jpeg', 0.88));
}

export function PosterStudio() {
    const [urls, setUrls] = useState<Record<string, string>>({});
    const [log, setLog] = useState<string[]>([]);

    const renderAll = async (save: boolean) => {
        const only = new URLSearchParams(location.search).get('only')?.split(',');
        for (const spec of SHOWCASE.filter(x => !only || only.includes(x.id))) {
            try {
                const blob = await renderSpec(spec);
                setUrls(u => ({ ...u, [spec.id]: URL.createObjectURL(blob) }));
                if (save) await fetch(`/__save?name=${spec.id}.jpg`, { method: 'POST', body: blob });
                setLog(l => [...l, `${spec.id} ok ${Math.round(blob.size / 1024)} kB`]);
            } catch (err) {
                setLog(l => [...l, `${spec.id} FAILED ${String(err)}`]);
            }
        }
        setLog(l => [...l, 'done']);
    };

    return (
        <div className="p-6 space-y-4">
            <div className="flex gap-2">
                <button onClick={() => renderAll(false)} className="px-4 py-2 rounded-full bg-ink text-paper text-sm">Render</button>
                <button onClick={() => renderAll(true)} className="px-4 py-2 rounded-full border border-ink text-sm">Render + save</button>
            </div>
            <pre id="studio-log" className="text-xs">{log.join('\n')}</pre>
            <div className="grid grid-cols-4 gap-4">
                {SHOWCASE.map(s => (
                    <figure key={s.id} className="bg-white p-2 shadow-card">
                        {urls[s.id] ? <img src={urls[s.id]} alt="" className="w-full" /> : <div className="aspect-[3/4] bg-line" />}
                        <figcaption className="text-xs mt-1">{s.id} · {s.size} · {s.algorithm}</figcaption>
                    </figure>
                ))}
            </div>
        </div>
    );
}
