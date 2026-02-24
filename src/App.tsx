import { useState, useEffect, useRef } from 'react';
import { DitherCanvas } from './components/DitherCanvas';
import { PosterCanvas } from './components/PosterCanvas';
import { Controls } from './components/Controls';
import { DitherOptions, WorkerResponse, Slot } from './lib/dither';
import { PosterProject } from './lib/storage';
import { drawPosterToCanvas, getPosterDimensions } from './lib/posterRenderer';
import { hexToRgb, interpolateColors } from './lib/colorUtils';
import Worker from './lib/worker?worker';

function App() {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
    const [processedImage, setProcessedImage] = useState<ImageData | null>(null);

    const [options, setOptions] = useState<DitherOptions>({
        algorithm: 'atkinson',
        threshold: 128,
        palette: [
            [0, 0, 0],       // Black
            [255, 255, 255]  // White
        ],
        brightness: 0,
        contrast: 0,
        gamma: 1,
        pointSize: 2,
        previewResolution: 1600,
        strictSwatches: true,
        paletteSteps: 4,
        colorPipeline: 'default',
        invert: false,
        colorMode: 'quadtone',
        engine: 'dg',
        accent: {
            enabled: false,
            color: { r: 255, g: 42, b: 42 },
            detectHex: '#ff0000',
            hueTolerance: 45,
            minSaturation: 0.0,
            minValue: 0.0,
            edgeBoost: true,
            edgeThreshold: 22,
            strength: 1
        },
        monochromeColors: { dark: '#000', light: '#ffffff' },
        duotoneColors: { color1: '#000', color2: '#FFFFFF' },
        tritoneColors: { color1: '#000', color2: '#4B3FA6', color3: '#FFFFFF' },
        quadtoneColors: { color1: '#000', color2: '#4B3FA6', color3: '#D19A9A', color4: '#FFFFFF' },
        paperTexture: 'none',
        paperTextureOpacity: 50,
        theme: 'light',
        designMode: 'poster',
        imageMode: 'single',
        grid: {
            enabled: false,
            layout: { rows: 2, cols: 1, id: '2x1' },
            images: [
                { id: '1' },
                { id: '2' }

            ]
        },
        poster: {
            enabled: true,
            title: 'Naslov postera',
            subtitle: '',
            year: '2025',
            description: [
                'Ovo je primer postera sa prilagodljivim rasporedom elemenata. Moguće je menjati layout, boje slike i sadržaj svakog dela.'
            ],
            paperColor: '#ffffff',
            textColor: '#000000',
            titleColor: '#000000',
            subtitleColor: '#000000',
            directorTextColor: '#000000',
            listColor: '#000000',
            descriptionColor: '#000000',
            yearColor: '#000000',
            titleFontSize: 48,
            director: 'Štampica studio',
            titleAlignment: 'left',
            footerLayout: 'standard',
            imageScale: 'fill',
            imageAlignX: 'center',
            imageAlignY: 'center',
            exportFormat: 'png',

            resolution: 'high',
            aspectRatio: 'A2',
            customDimensions: {
                width: 2000,
                height: 2000,
                keepRatio: true,
            },
            upscaleFactor: 1,
            paddingSize: 'S',
            imagePadding: 'same-as-poster',
            titleMargin: 0,
            subtitleMargin: 0,
            descriptionColumns: 1,
            imageBackgroundColor: 'none',
            layoutOrder: ['header', 'image', 'title', 'icons', 'list', 'footer'],
            showHeader: true,
            showTitle: true,
            showImage: true,
            showFooter: true,
            listSection: {
                enabled: false,
                content: [
                    'Tim Robbins',
                    'Morgan Freeman',
                    'Bob Gunton',
                    'William Sadler',
                    'Clancy Brown',
                    'Gil Bellows'
                ],
                alignment: 'left',
                columns: 4
            },
            iconSection: {
                enabled: false,
                items: [
                    { icon: 'material-symbols:star-outline', text: '120 min' },
                    { icon: 'material-symbols:star-outline', text: '8.5' },
                    { icon: 'material-symbols:star-outline', text: '1994' },
                    { icon: 'material-symbols:star-outline', text: 'EN' }
                ],
                width: 100,
                alignment: 'center',
                iconSize: 24,
                iconColor: '#000000',
                textColor: '#000000',
            },
            titleFont: 'Inter',
            bodyFont: 'Inter',
            imageRoundedCorners: 'none',
            showSubtitle: true,
            subtitleFontSize: 16,
            gap: 32,
        },
        omdbApiKey: '14e21db6', // User provided key
    });

    // Paste event listener
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (const item of items) {
                if (item.type.indexOf('image') !== -1) {
                    const file = item.getAsFile();
                    if (file) {
                        if (options.imageMode === 'single') {
                            setImageFile(file);
                        } else {
                            setOptions((prev: DitherOptions) => {
                                const newImages = [...prev.grid.images];
                                let targetIndex = newImages.findIndex(s => s.id === prev.grid.selectedSlotId);

                                if (targetIndex === -1 || (targetIndex !== -1 && newImages[targetIndex].file)) {
                                    const emptySlotIndex = newImages.findIndex(s => !s.file);
                                    if (emptySlotIndex !== -1) {
                                        targetIndex = emptySlotIndex;
                                    } else if (targetIndex === -1) {
                                        targetIndex = 0;
                                    }
                                }

                                newImages[targetIndex] = {
                                    ...newImages[targetIndex],
                                    file,
                                    src: URL.createObjectURL(file)
                                };

                                return {
                                    ...prev,
                                    grid: { ...prev.grid, images: newImages }
                                };
                            });
                        }
                    }
                    break;
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [options.imageMode]);

    // Handle Image Dimensions
    useEffect(() => {
        if (!imageFile) {
            setImageDimensions(null);
            return;
        }

        const img = new Image();
        const url = URL.createObjectURL(imageFile);
        img.onload = () => {
            setImageDimensions({ width: img.width, height: img.height });
            URL.revokeObjectURL(url);
        };
        img.src = url;
    }, [imageFile]);

    // Helper function to calculate poster dimensions based on aspect ratio
    // Removed local version, using helper from lib/posterRenderer.tsx

    const workerRef = useRef<Worker>();
    const posterRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<number>();

    // Initialize Worker
    useEffect(() => {
        workerRef.current = new Worker();
        workerRef.current.onmessage = (e: MessageEvent<WorkerResponse | any>) => {
            if (e.data && e.data.error) {
                console.error('Worker error:', e.data.error);
                try { alert(`Dither engine error: ${e.data.error}`); } catch (err) { }
                // Do not update preview
                return;
            }

            if (e.data && e.data.imageData) {
                setProcessedImage(e.data.imageData);
                // Dev sanity check: ensure no transparent pixels in processed image
                try {
                    if (import.meta.env && import.meta.env.MODE !== 'production') {
                        const d = e.data.imageData.data;
                        let count = 0;
                        for (let i = 3; i < d.length; i += 4) if (d[i] === 0) count++;
                        // eslint-disable-next-line no-console
                        console.log('[SANITY] transparent pixels:', count);
                    }
                } catch (err) { /* ignore in non-supporting envs */ }
            }
        };

        return () => {
            workerRef.current?.terminate();
        };
    }, []);



    // Update palette when color mode or custom colors change
    useEffect(() => {
        let newPalette: [number, number, number][];

        switch (options.colorMode) {
            case 'monochrome':
                newPalette = [
                    hexToRgb(options.monochromeColors.dark),
                    hexToRgb(options.monochromeColors.light)
                ];
                break;
            case 'duotone':
                newPalette = [
                    hexToRgb(options.duotoneColors.color1),
                    hexToRgb(options.duotoneColors.color2)
                ];
                break;
            case 'tritone':
                newPalette = [
                    hexToRgb(options.tritoneColors.color1),
                    hexToRgb(options.tritoneColors.color2),
                    hexToRgb(options.tritoneColors.color3)
                ];
                break;
            case 'quadtone':
                newPalette = [
                    hexToRgb(options.quadtoneColors.color1),
                    hexToRgb(options.quadtoneColors.color2),
                    hexToRgb(options.quadtoneColors.color3),
                    hexToRgb(options.quadtoneColors.color4)
                ];
                break;
            case 'rgb':
                // Full RGB palette (8 colors: CMY + RGB + black + white)
                newPalette = [
                    [0, 0, 0],       // Black
                    [255, 0, 0],     // Red
                    [0, 255, 0],     // Green
                    [0, 0, 255],     // Blue
                    [255, 255, 0],   // Yellow
                    [255, 0, 255],   // Magenta
                    [0, 255, 255],   // Cyan
                    [255, 255, 255]  // White
                ];
                break;
            default:
                newPalette = [[0, 0, 0], [255, 255, 255]];
        }

        setOptions((prev: DitherOptions) => {
            let palette: [number, number, number][];
            if (!options.strictSwatches && options.colorMode !== 'rgb') {
                const colors = newPalette.map(c => {
                    const toHex = (n: number) => {
                        const h = n.toString(16);
                        return h.length === 1 ? '0' + h : h;
                    };
                    return `#${toHex(c[0])}${toHex(c[1])}${toHex(c[2])}`;
                });
                const interpolated = interpolateColors(colors, options.paletteSteps);
                palette = interpolated.map(c => hexToRgb(c));
            } else {
                palette = newPalette;
            }
            return { ...prev, palette };
        });
    }, [
        options.colorMode,
        options.strictSwatches,
        options.paletteSteps,
        options.monochromeColors.dark,
        options.monochromeColors.light,
        options.duotoneColors.color1,
        options.duotoneColors.color2,
        options.tritoneColors.color1,
        options.tritoneColors.color2,
        options.tritoneColors.color3,
        options.quadtoneColors.color1,
        options.quadtoneColors.color2,
        options.quadtoneColors.color3,
        options.quadtoneColors.color4
    ]);

    // Process Image with Debounce and Downscaling
    useEffect(() => {
        if (!workerRef.current) return;

        // Clear previous timer
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        const processImage = (file: File, options: DitherOptions): Promise<ImageData> => {
            return new Promise((resolve) => {
                const jobId = Math.random().toString(36).substring(7);
                const img = new Image();
                img.src = URL.createObjectURL(file);
                img.onload = () => {
                    const targetLongEdge = options.previewResolution;
                    let scale = targetLongEdge / Math.max(img.width, img.height);
                    let previewWidth = Math.round(img.width * scale);
                    let previewHeight = Math.round(img.height * scale);

                    const canvas = document.createElement('canvas');
                    canvas.width = previewWidth;
                    canvas.height = previewHeight;
                    const ctx = canvas.getContext('2d')!;
                    ctx.drawImage(img, 0, 0, previewWidth, previewHeight);
                    const imageData = ctx.getImageData(0, 0, previewWidth, previewHeight);

                    const handleResponse = (e: MessageEvent<WorkerResponse | any>) => {
                        if (e.data && e.data.imageData && e.data.jobId === jobId) {
                            resolve(e.data.imageData);
                            workerRef.current?.removeEventListener('message', handleResponse);
                        }
                    };
                    workerRef.current?.addEventListener('message', handleResponse);
                    workerRef.current?.postMessage({ imageData, options, jobId });
                    URL.revokeObjectURL(img.src);
                };
            });
        };

        // Debounce by 50ms
        timerRef.current = setTimeout(async () => {
            if (options.imageMode === 'single') {
                if (!imageFile) return;
                const result = await processImage(imageFile, options);
                setProcessedImage(result);
            } else {
                // Generate current settings hash
                const settingsHash = JSON.stringify([
                    options.engine, options.algorithm, options.threshold, options.palette, options.brightness,
                    options.contrast, options.gamma, options.pointSize, options.previewResolution,
                    options.colorPipeline, options.invert, options.accent
                ]);

                // Process slots that need it
                const needsProcessing = options.grid.images.some(slot =>
                    slot.file && (!slot.processedImageData || slot.lastSettingsHash !== settingsHash)
                );

                if (needsProcessing) {
                    const updatedImages = await Promise.all(options.grid.images.map(async (slot: Slot) => {
                        if (slot.file && (!slot.processedImageData || slot.lastSettingsHash !== settingsHash)) {
                            const processed = await processImage(slot.file, options);
                            return { ...slot, processedImageData: processed, lastSettingsHash: settingsHash };
                        }
                        return slot;
                    }));

                    setOptions((prev: DitherOptions) => {
                        const mergedImages = prev.grid.images.map(prevSlot => {
                            const updatedSlot = updatedImages.find(u => u.id === prevSlot.id);
                            // Only update if the file hasn't changed since we started processing
                            if (updatedSlot && updatedSlot.file === prevSlot.file && updatedSlot.processedImageData) {
                                return {
                                    ...prevSlot,
                                    processedImageData: updatedSlot.processedImageData,
                                    lastSettingsHash: updatedSlot.lastSettingsHash
                                };
                            }
                            return prevSlot;
                        });

                        return {
                            ...prev,
                            grid: { ...prev.grid, images: mergedImages }
                        };
                    });
                }
            }
        }, 50);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [imageFile, options.imageMode,
        // Order-independent dependency for files
        [...options.grid.images].map(s => s.id + (s.file ? 'f' : 'e')).sort().join(','),
        options.algorithm, options.threshold, options.palette.map(p => p.join(',')).join('|'), options.brightness, options.contrast,
        options.gamma, options.pointSize, options.previewResolution, options.colorPipeline, options.invert, options.engine, JSON.stringify(options.accent)]);

    const handleExport = async () => {
        console.log('[EXPORT] handleExport called', { imageMode: options.imageMode, hasImageFile: !!imageFile, posterEnabled: options.poster.enabled });
        const isGrid = options.imageMode === 'grid';

        // Only require an image if we're NOT in poster mode (i.e., exporting raw dithered image)
        if (!options.poster.enabled) {
            if (!isGrid && !imageFile) {
                console.log('[EXPORT] ✗ Aborted: No image file loaded (required for dithered image export)');
                alert('Please upload an image to export a dithered image.');
                return;
            }
            if (isGrid && !options.grid.images.some(s => s.file)) {
                console.log('[EXPORT] ✗ Aborted: No grid images loaded');
                alert('Please upload images to the grid to export.');
                return;
            }
        }

        // Helper to dither image at any resolution
        const getDitheredImageData = (file: File, ditherOptions: DitherOptions, resolution?: number): Promise<ImageData> => {
            return Promise.race([
                new Promise<ImageData>((resolve, reject) => {
                    const img = new Image();
                    img.src = URL.createObjectURL(file);
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

                        const worker = new Worker();
                        worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
                            resolve(e.data.imageData);
                            worker.terminate();
                            URL.revokeObjectURL(img.src);
                        };
                        worker.onerror = (err) => {
                            worker.terminate();
                            reject(err);
                        };
                        worker.postMessage({ imageData, options: ditherOptions });
                    };
                    img.onerror = () => reject(new Error('Image failed to load in handleExport'));
                }),
                new Promise<ImageData>((_, reject) => setTimeout(() => reject(new Error('Export processing timeout')), 15000))
            ]);
        };

        const exportOptions = { ...options };
        let finalImageData: ImageData | null = null;

        if (isGrid) {
            // Processing for grid happens by updating exportOptions.grid.images with high-res dithered data
            // However, drawPosterToCanvas currently uses slot.processedImageData.
            // We need to ensure exportOptions.grid.images has the dithered data.
            const updatedGridImages = await Promise.all(options.grid.images.map(async (slot) => {
                if (slot.file) {
                    const data = await getDitheredImageData(slot.file, exportOptions, options.previewResolution);
                    return { ...slot, processedImageData: data };
                }
                return slot;
            }));
            exportOptions.grid = { ...exportOptions.grid, images: updatedGridImages };
        } else {
            if (imageFile) {
                finalImageData = await getDitheredImageData(imageFile, exportOptions, options.previewResolution);
            }
        }

        // Naming logic: Title Size ColorMode Resolution
        const colorModeLabels: Record<string, string> = {
            'monochrome': 'Mono',
            'duotone': 'Duo',
            'tritone': 'Tri',
            'quadtone': 'Quad',
            'rgb': 'RGB'
        };
        const resLabel = options.poster.resolution === 'high' ? 'Print' : 'Web';
        const colorLabel = colorModeLabels[options.colorMode] || 'Mono';
        const title = options.poster.title || 'Untitled';
        const posterSize = options.poster.aspectRatio;
        const format = options.poster.exportFormat || 'png';
        const fileName = `${title} ${posterSize} ${colorLabel} ${resLabel}.${format}`;

        if (options.poster.enabled) {
            try {
                const baseDimensions = getPosterDimensions(options, options.poster.aspectRatio, options.poster.resolution);
                const upscale = options.poster.upscaleFactor || 1;
                const dimensions = {
                    width: baseDimensions.width * upscale,
                    height: baseDimensions.height * upscale
                };

                const canvas = await drawPosterToCanvas(exportOptions, finalImageData, dimensions);

                const link = document.createElement('a');
                link.download = fileName;
                link.href = canvas.toDataURL(`image/${format}`, format === 'jpeg' ? 1.0 : undefined);
                link.click();
            } catch (error) {
                console.error('Poster export failed:', error);
                alert('Export failed: ' + error);
            }
        } else {
            // Export Dithered Image (Only for Single mode for now, or maybe the first grid image?)
            const dataToExport = finalImageData || (isGrid ? exportOptions.grid.images.find(s => s.processedImageData)?.processedImageData : null);
            if (dataToExport) {
                const canvas = document.createElement('canvas');
                canvas.width = dataToExport.width;
                canvas.height = dataToExport.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.globalAlpha = 1;
                    ctx.putImageData(dataToExport, 0, 0);
                    const link = document.createElement('a');
                    link.download = fileName;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                }
            }
        }
    };

    const handleCopyImage = async () => {
        if (options.poster.enabled && posterRef.current) {
            try {
                const dimensions = getPosterDimensions(options, options.poster.aspectRatio, options.poster.resolution);
                const canvas = await drawPosterToCanvas(options, processedImage, dimensions);

                canvas.toBlob(async (blob) => {
                    if (blob) {
                        try {
                            await navigator.clipboard.write([
                                new ClipboardItem({
                                    [blob.type]: blob
                                })
                            ]);
                            // Optional: Show success feedback
                        } catch (err) {
                            console.error('Failed to copy to clipboard:', err);
                        }
                    }
                }, 'image/png');
            } catch (error) {
                console.error('Poster copy failed:', error);
            }
        } else if (processedImage) {
            const canvas = document.createElement('canvas');
            canvas.width = processedImage.width;
            canvas.height = processedImage.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = 1;
                ctx.putImageData(processedImage, 0, 0);
                canvas.toBlob(async (blob) => {
                    if (blob) {
                        try {
                            await navigator.clipboard.write([
                                new ClipboardItem({
                                    [blob.type]: blob
                                })
                            ]);
                        } catch (err) {
                            console.error('Failed to copy to clipboard:', err);
                        }
                    }
                }, 'image/png');
            }
        }
    };

    const handleProjectLoad = async (project: PosterProject) => {
        const { getAsset } = await import('./lib/storage');

        // Deep clone options to avoid mutating original project data
        const loadedOptions = JSON.parse(JSON.stringify(project.options)) as DitherOptions;

        // 1. Handle single image (stored at options.assetId or top level assetId)
        const singleAssetId = (loadedOptions as any).assetId || project.assetId;
        if (loadedOptions.imageMode === 'single' && singleAssetId) {
            try {
                const asset = await getAsset(singleAssetId);
                if (asset?.blob) {
                    const file = new File([asset.blob], 'project-image.webp', { type: asset.blob.type });
                    setImageFile(file);
                }
            } catch (err) {
                console.error('Failed to reconstruct single image asset:', err);
            }
        }

        // 2. Handle grid images (stored in slot.assetId)
        if (loadedOptions.imageMode === 'grid' && loadedOptions.grid?.images) {
            const updatedImages = await Promise.all(loadedOptions.grid.images.map(async (slot) => {
                const slotAssetId = (slot as any).assetId;
                if (slotAssetId) {
                    try {
                        const asset = await getAsset(slotAssetId);
                        if (asset?.blob) {
                            const file = new File([asset.blob], `slot-${slot.id}.webp`, { type: asset.blob.type });
                            return { ...slot, file, src: URL.createObjectURL(file) };
                        }
                    } catch (err) {
                        console.error(`Failed to reconstruct asset for slot ${slot.id}:`, err);
                    }
                }
                return slot;
            }));
            loadedOptions.grid.images = updatedImages;
        }

        // Apply options
        setOptions(loadedOptions);
    };

    return (
        <div className="flex h-screen w-full bg-black text-white overflow-hidden font-sans">
            {/* Sidebar Controls (Left) */}
            <aside className="w-80 flex-shrink-0 z-20 h-full border-r border-neutral-800 bg-black">
                <Controls
                    options={options}
                    onOptionsChange={setOptions}
                    onExport={handleExport}
                    onCopy={handleCopyImage}
                    onUploadClick={() => document.getElementById('file-input')?.click()}
                    imageDimensions={imageDimensions}
                    imageFile={imageFile}
                    onProjectLoad={handleProjectLoad}
                />
            </aside>

            {/* Main Content Area (Right) - Preview */}
            <main className="flex-1 flex flex-col relative min-w-0 bg-neutral-950">
                <div className="flex-1 relative flex items-start justify-center p-8 overflow-auto">
                    <div className="relative">
                        {options.poster.enabled ? (
                            <PosterCanvas
                                ref={posterRef}
                                processedImage={processedImage}
                                options={options}
                                onUploadTrigger={() => document.getElementById('file-input')?.click()}
                            />
                        ) : (
                            <DitherCanvas processedImage={processedImage} />
                        )}
                    </div>
                </div>
            </main>

            {/* Hidden input for re-upload from sidebar */}
            <input
                type="file"
                id="file-input"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setImageFile(file);
                }}
            />
        </div>
    );
}

export default App;
