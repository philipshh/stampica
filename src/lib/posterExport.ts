import { DitherOptions, WorkerResponse } from './dither';
import { drawPosterToCanvas, getPosterDimensions } from './posterRenderer';
import Worker from './worker?worker';

const COLOR_MODE_LABELS: Record<string, string> = {
    monochrome: 'Mono',
    duotone: 'Duo',
    tritone: 'Tri',
    quadtone: 'Quad',
    rgb: 'RGB',
};

export function buildExportFileName(options: DitherOptions): string {
    const colorLabel = COLOR_MODE_LABELS[options.colorMode] || 'Mono';
    const resLabel = options.poster.resolution === 'high' ? 'Print' : 'Web';
    const title = options.poster.title || 'Untitled';
    const posterSize = options.poster.aspectRatio;
    const format = options.poster.exportFormat || 'png';
    return `${title} ${posterSize} ${colorLabel} ${resLabel}.${format}`;
}

export function getDitheredImageData(
    file: File,
    ditherOptions: DitherOptions,
    resolution?: number
): Promise<ImageData> {
    return Promise.race([
        new Promise<ImageData>((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.src = url;
            img.onload = () => {
                let w = img.width;
                let h = img.height;

                if (resolution) {
                    const scale = resolution / Math.max(w, h);
                    w = Math.round(w * scale);
                    h = Math.round(h * scale);
                }

                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0, w, h);
                const imageData = ctx.getImageData(0, 0, w, h);
                URL.revokeObjectURL(url);

                const exportWorker = new Worker();
                exportWorker.onmessage = (e: MessageEvent<WorkerResponse>) => {
                    resolve(e.data.imageData);
                    exportWorker.terminate();
                };
                exportWorker.onerror = (err) => {
                    exportWorker.terminate();
                    reject(err);
                };
                exportWorker.postMessage({ imageData, options: ditherOptions });
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Image failed to load for export'));
            };
        }),
        new Promise<ImageData>((_, reject) =>
            setTimeout(() => reject(new Error('Export processing timeout')), 15000)
        ),
    ]);
}

export async function exportPoster(options: DitherOptions, imageFile: File | null): Promise<void> {
    const isGrid = options.imageMode === 'grid';

    if (!options.poster.enabled) {
        if (!isGrid && !imageFile) {
            alert('Please upload an image to export a dithered image.');
            return;
        }
        if (isGrid && !options.grid.images.some((s) => s.file)) {
            alert('Please upload images to the grid to export.');
            return;
        }
    }

    const exportOptions = { ...options };
    let finalImageData: ImageData | null = null;

    if (isGrid) {
        const updatedGridImages = await Promise.all(
            options.grid.images.map(async (slot) => {
                if (slot.file) {
                    const data = await getDitheredImageData(slot.file, exportOptions, options.previewResolution);
                    return { ...slot, processedImageData: data };
                }
                return slot;
            })
        );
        exportOptions.grid = { ...exportOptions.grid, images: updatedGridImages };
    } else if (imageFile) {
        finalImageData = await getDitheredImageData(imageFile, exportOptions, options.previewResolution);
    }

    const fileName = buildExportFileName(options);
    const format = options.poster.exportFormat || 'png';

    if (options.poster.enabled) {
        try {
            const dimensions = getPosterDimensions(options, options.poster.aspectRatio, options.poster.resolution);
            const canvas = await drawPosterToCanvas(exportOptions, finalImageData, dimensions);

            canvas.toBlob((blob) => {
                if (!blob) { alert('Failed to export poster - canvas blob is empty'); return; }
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = fileName;
                link.href = url;
                link.click();
                URL.revokeObjectURL(url);
            }, `image/${format}`);
        } catch (error) {
            console.error('Poster export failed:', error);
            alert('Export failed: ' + error);
        }
        return;
    }

    const dataToExport =
        finalImageData ||
        (isGrid ? exportOptions.grid.images.find((s) => s.processedImageData)?.processedImageData : null);

    if (dataToExport) {
        const canvas = document.createElement('canvas');
        canvas.width = dataToExport.width;
        canvas.height = dataToExport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
            ctx.putImageData(dataToExport, 0, 0);
            canvas.toBlob((blob) => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = fileName;
                link.href = url;
                link.click();
                URL.revokeObjectURL(url);
            }, 'image/png');
        }
    }
}

export async function copyPosterToClipboard(
    options: DitherOptions,
    processedImage: ImageData | null
): Promise<void> {
    if (options.poster.enabled) {
        try {
            const dimensions = getPosterDimensions(options, options.poster.aspectRatio, options.poster.resolution);
            const canvas = await drawPosterToCanvas(options, processedImage, dimensions);
            canvas.toBlob(async (blob) => {
                if (!blob) return;
                try {
                    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
                } catch (err) {
                    console.error('Failed to copy to clipboard:', err);
                }
            }, 'image/png');
        } catch (error) {
            console.error('Poster copy failed:', error);
        }
        return;
    }

    if (processedImage) {
        const canvas = document.createElement('canvas');
        canvas.width = processedImage.width;
        canvas.height = processedImage.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
            ctx.putImageData(processedImage, 0, 0);
            canvas.toBlob(async (blob) => {
                if (!blob) return;
                try {
                    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
                } catch (err) {
                    console.error('Failed to copy to clipboard:', err);
                }
            }, 'image/png');
        }
    }
}

// ── Blob exports for order attachments ───────────────────────────────────────

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('Canvas to blob failed'))),
            type,
            quality,
        );
    });
}

/** Low-res JPEG preview (~800px wide) — fast, using already-processed ImageData */
export async function exportPosterPreviewBlob(
    options: DitherOptions,
    processedImage: ImageData | null,
): Promise<Blob | null> {
    if (!options.poster.enabled || !processedImage) return null;
    try {
        const previewOptions: DitherOptions = {
            ...options,
            poster: { ...options.poster, resolution: 'low' },
        };
        const dimensions = getPosterDimensions(previewOptions, previewOptions.poster.aspectRatio, 'low');
        const canvas = await drawPosterToCanvas(previewOptions, processedImage, dimensions);
        return await canvasToBlob(canvas, 'image/jpeg', 0.75);
    } catch {
        return null;
    }
}

/** Hi-res PNG — re-processes the image at full export resolution using the original file */
export async function exportPosterHiResBlob(
    options: DitherOptions,
    imageFile: File | null,
): Promise<Blob | null> {
    if (!options.poster.enabled || !imageFile) return null;
    try {
        const hiResOptions: DitherOptions = {
            ...options,
            poster: { ...options.poster, resolution: 'high' },
        };
        const dimensions = getPosterDimensions(hiResOptions, hiResOptions.poster.aspectRatio, 'high');
        const resolution = Math.max(dimensions.width, dimensions.height);
        const processedData = await getDitheredImageData(imageFile, hiResOptions, resolution);
        const canvas = await drawPosterToCanvas(hiResOptions, processedData, dimensions);
        return await canvasToBlob(canvas, 'image/png');
    } catch {
        return null;
    }
}
