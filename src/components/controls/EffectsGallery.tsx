import React, { useEffect, useRef, useState } from 'react';
import { DitherOptions, DitherAlgorithm, EFFECTS, EffectCategory } from '../../lib/dither';
import DitherWorker from '../../lib/worker?worker';

const THUMB = 108;

const CATEGORY_LABELS: Record<EffectCategory, string> = {
    classic: 'Classic',
    diffusion: 'Diffusion',
    pattern: 'Pattern',
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
            resolve(ctx.getImageData(0, 0, THUMB, THUMB));
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
            resolve(ctx.getImageData(0, 0, THUMB, THUMB));
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
            className={`relative rounded-lg overflow-hidden border transition-all aspect-square bg-neutral-900 group ${
                active ? 'border-white ring-1 ring-white' : 'border-neutral-800 hover:border-neutral-500'
            }`}
            title={label}
        >
            {imageData ? (
                <canvas ref={canvasRef} className="w-full h-full block" style={{ imageRendering: 'pixelated' }} />
            ) : (
                <div className="w-full h-full animate-pulse bg-neutral-800" />
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent pt-3 pb-0.5 px-1 pointer-events-none">
                <span className={`block text-center text-[8px] uppercase tracking-wider truncate ${active ? 'text-white font-bold' : 'text-neutral-300'}`}>
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
    ]);

    useEffect(() => {
        let cancelled = false;
        let worker: Worker | null = null;

        const timer = setTimeout(async () => {
            const source = await loadSource(sourceFile);
            if (cancelled) return;

            worker = new DitherWorker();
            worker.onmessage = (e: MessageEvent<{ imageData?: ImageData; jobId?: string; error?: string }>) => {
                if (cancelled) return;
                const { imageData, jobId } = e.data;
                if (imageData && jobId) {
                    setPreviews((prev) => ({ ...prev, [jobId]: imageData }));
                }
            };

            for (const effect of EFFECTS) {
                const thumbOptions: DitherOptions = {
                    ...options,
                    algorithm: effect.id,
                    pointSize: 1,
                };
                worker.postMessage({ imageData: source, options: thumbOptions, jobId: effect.id });
            }
        }, 250);

        return () => {
            cancelled = true;
            clearTimeout(timer);
            if (worker) worker.terminate();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settingsKey]);

    const select = (algo: DitherAlgorithm) => onOptionsChange({ ...options, algorithm: algo });

    const categories: EffectCategory[] = ['classic', 'diffusion', 'pattern'];

    return (
        <div className="space-y-2">
            {categories.map((cat) => (
                <div key={cat}>
                    <div className="text-[9px] uppercase tracking-widest text-neutral-600 mb-1.5 select-none">
                        {CATEGORY_LABELS[cat]}
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
