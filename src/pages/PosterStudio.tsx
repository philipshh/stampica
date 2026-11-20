import { useState } from 'react';
import { DitherAlgorithm, DitherOptions, TitleFont } from '../lib/dither';
import { DEFAULT_OPTIONS } from '../lib/defaultOptions';
import { computePaletteFromColorMode, QUADTONE_THEMES, TRITONE_THEMES, DUOTONE_THEMES } from '../lib/colorUtils';
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
    { id: 'miso', photo: 'cat-dark', size: 'A3', algorithm: 'ascii', mode: 'duotone', mono: undefined, theme: 'Cold Neon Night',
      title: 'Mišo', subtitle: 'Chief napping officer', year: '2020', director: 'Tabby', brightness: 30, contrast: 45, paper: '#111111', ink: '#F2F2EE', font: 'Syne', titleSize: 110, imagePadding: 'none' },
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
];

function buildOptions(spec: ShowcaseSpec): DitherOptions {
    const o: DitherOptions = JSON.parse(JSON.stringify(DEFAULT_OPTIONS));
    o.algorithm = spec.algorithm;
    o.colorMode = spec.mode;
    o.threshold = spec.threshold ?? 128;
    o.brightness = spec.brightness ?? 0;
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
    const dims = getPosterDimensions(opts, spec.size, 'low');
    const imageData = await getDitheredImageData(file, opts, Math.max(dims.width, dims.height));
    const canvas = await drawPosterToCanvas(opts, imageData, dims);
    return new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/jpeg', 0.88));
}

export function PosterStudio() {
    const [urls, setUrls] = useState<Record<string, string>>({});
    const [log, setLog] = useState<string[]>([]);

    const renderAll = async (save: boolean) => {
        for (const spec of SHOWCASE) {
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
