import React, { useEffect, useRef, useState } from 'react';
import { DitherOptions, DitherAlgorithm, EFFECTS, EffectCategory } from '../../lib/dither';
import DitherWorker from '../../lib/worker?worker';
import { releaseCanvas } from '../../lib/canvasMemory';
import { useT } from '../../contexts/LanguageContext';
import type { TranslationKey } from '../../i18n/translations';

const THUMB = 108;

const CATEGORY_LABELS: Record<EffectCategory, TranslationKey> = {
    classic: 'catClassic',
    diffusion: 'catDiffusion',
    pattern: 'catPattern',
};

/** Load the source image (or a procedural sample) as a square, center-cropped thumbnail */
function loadSource(file: File | null): Promise<ImageData> {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = THUMB;
        canvas.height = THUMB;
        const ctx = canvas.getContext('2d')!;

        if (!file) {
            // Procedural sample: diagonal gradient + sphere, shows dither character well
            const bg = ctx.createLinearGradient(0, 0, THUMB, THUMB);
            bg.addColorStop(0, '#ffffff');
            bg.addColorStop(1, '#000000');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, THUMB, THUMB);
            const sph = ctx.createRadialGradient(THUMB * 0.42, THUMB * 0.36, 4, THUMB * 0.5, THUMB * 0.45, THUMB * 0.4);
            sph.addColorStop(0, '#f8f8f8');
            sph.addColorStop(1, '#141414');
            ctx.fillStyle = sph;
            ctx.beginPath();
            ctx.arc(THUMB * 0.5, THUMB * 0.45, THUMB * 0.32, 0, Math.PI * 2);
            ctx.fill();
            const data = ctx.getImageData(0, 0, THUMB, THUMB);
            releaseCanvas(canvas);
            resolve(data);
            return;
        }

        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const scale = Math.max(THUMB / img.width, THUMB / img.height);
            const w = img.width * scale;
            const h = img.height * scale;
            ctx.drawImage(img, (THUMB - w) / 2, (THUMB - h) / 2, w, h);
            URL.revokeObjectURL(url);
            const data = ctx.getImageData(0, 0, THUMB, THUMB);
            releaseCanvas(canvas);
            img.src = '';
            resolve(data);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(ctx.getImageData(0, 0, THUMB, THUMB));
        };
        img.src = url;
    });
}

const Thumb: React.FC<{
    imageData: ImageData | null;
    label: string;
    active: boolean;
    onClick: () => void;
}> = ({ imageData, label, active, onClick }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !imageData) return;
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext('2d')!;
        ctx.putImageData(imageData, 0, 0);
    }, [imageData]);

    return (
        <button
            onClick={onClick}
            className={`relative rounded-lg overflow-hidden border transition-all aspect-square bg-white group ${
                active ? 'border-vermilion ring-1 ring-vermilion' : 'border-line hover:border-ink/40'
            }`}
            title={label}
        >
            {imageData ? (
                <canvas ref={canvasRef} className="w-full h-full block" style={{ imageRendering: 'pixelated' }} />
            ) : (
                <div className="w-full h-full animate-pulse bg-line/60" />
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent pt-3 pb-0.5 px-1 pointer-events-none">
                <span className={`block text-center text-[8px] uppercase tracking-wider truncate ${active ? 'text-white font-bold' : 'text-white/90'}`}>
                    {label}
                </span>
            </div>
        </button>
    );
};

interface EffectsGalleryProps {
    options: DitherOptions;
    onOptionsChange: (options: DitherOptions) => void;
    imageFile: File | null;
}

export const EffectsGallery: React.FC<EffectsGalleryProps> = ({ options, onOptionsChange, imageFile }) => {
    const { t } = useT();
    const [previews, setPreviews] = useState<Record<string, ImageData>>({});

    // In grid mode fall back to the first filled slot's image
    const sourceFile = imageFile ?? options.grid.images.find((s) => s.file)?.file ?? null;

    // Settings that change how every effect thumbnail looks
    const settingsKey = JSON.stringify([
        sourceFile ? `${sourceFile.name}-${sourceFile.size}-${sourceFile.lastModified}` : 'sample',
        options.palette,
        options.brightness,
        options.contrast,
        options.gamma,
        options.invert,
        options.threshold,
        options.colorPipeline,
        options.asciiText,
    ]);

    // One worker for the gallery's lifetime; each batch is tagged so stale results are ignored
    const workerRef = useRef<Worker | null>(null);
    const batchRef = useRef(0);
    useEffect(() => {
        const worker = new DitherWorker();
        worker.onmessage = (e: MessageEvent<{ imageData?: ImageData; jobId?: string; error?: string }>) => {
            const { imageData, jobId } = e.data;
            if (!imageData || !jobId) return;
            const [batch, effectId] = jobId.split(':');
            if (Number(batch) !== batchRef.current) return;
            setPreviews((prev) => ({ ...prev, [effectId]: imageData }));
        };
        workerRef.current = worker;
        return () => { worker.terminate(); workerRef.current = null; };
    }, []);

    useEffect(() => {
        let cancelled = false;
        // Wait for sliders to settle so thumbnails don't compete with the main preview
        const timer = setTimeout(async () => {
            const source = await loadSource(sourceFile);
            if (cancelled || !workerRef.current) return;
            const batch = ++batchRef.current;
            for (const effect of EFFECTS) {
                const thumbOptions: DitherOptions = { ...options, algorithm: effect.id, pointSize: 1 };
                workerRef.current.postMessage({ imageData: source, options: thumbOptions, jobId: `${batch}:${effect.id}` });
            }
        }, 450);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settingsKey]);

    const select = (algo: DitherAlgorithm) => onOptionsChange({ ...options, algorithm: algo });

    const categories: EffectCategory[] = ['classic', 'diffusion', 'pattern'];

    return (
        <div className="space-y-2">
            {categories.map((cat) => (
                <div key={cat}>
                    <div className="text-[9px] uppercase tracking-widest text-ink-faint mb-1.5 select-none">
                        {t(CATEGORY_LABELS[cat])}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                        {EFFECTS.filter((e) => e.category === cat).map((effect) => (
                            <Thumb
                                key={effect.id}
                                imageData={previews[effect.id] ?? null}
                                label={effect.label}
                                active={options.algorithm === effect.id}
                                onClick={() => select(effect.id)}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
