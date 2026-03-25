import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, X } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { useCart } from './contexts/CartContext';
import { useT } from './contexts/LanguageContext';
import { DitherCanvas } from './components/DitherCanvas';
import { PosterCanvas } from './components/PosterCanvas';
import { Controls } from './components/Controls';
import { DitherOptions, WorkerResponse, WorkerErrorResponse, Slot, StoredDitherOptions } from './lib/dither';
import { PosterProject } from './lib/storage';
import { computePaletteFromColorMode, interpolateColors, rgbToHex } from './lib/colorUtils';
import { exportPoster, copyPosterToClipboard, exportPosterPreviewBlob } from './lib/posterExport';
import { useImageDimensions } from './hooks/useImageDimensions';
import { useDitherWorker } from './hooks/useDitherWorker';
import { usePasteHandler } from './hooks/usePasteHandler';


const ASPECT_RATIO_VALUES: Record<string, string> = {
    A5: '148 / 210',
    A4: '210 / 297',
    A3: '297 / 420',
    A2: '420 / 594',
};

const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3];

const DEFAULT_OPTIONS: DitherOptions = {
    algorithm: 'atkinson',
    threshold: 128,
    palette: [
        [0, 0, 0],
        [255, 255, 255],
    ],
    brightness: 0,
    contrast: 0,
    gamma: 1,
    pointSize: 2,
    previewResolution: 2000,
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
        strength: 1,
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
        images: [{ id: '1' }, { id: '2' }],
    },
    poster: {
        enabled: true,
        title: 'Naslov postera',
        subtitle: '',
        year: '2025',
        description: [
            'Ovo je primer postera sa prilagodljivim rasporedom elemenata. Moguće je menjati layout, boje slike i sadržaj svakog dela.',
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
        aspectRatio: 'A4',
        customDimensions: { width: 2000, height: 2000, keepRatio: true },
        upscaleFactor: 4,
        paddingSize: 'M',
        imagePadding: 'same-as-poster',
        titleMargin: 0,
        subtitleMargin: 0,
        descriptionColumns: 1,
        imageBackgroundColor: 'none',
        layoutOrder: ['header', 'image', 'title', 'list', 'footer'],
        showHeader: true,
        showTitle: true,
        showImage: true,
        showFooter: true,
        listSection: {
            enabled: false,
            content: ['Tim Robbins', 'Morgan Freeman', 'Bob Gunton', 'William Sadler', 'Clancy Brown', 'Gil Bellows'],
            alignment: 'left',
            columns: 4,
        },
        iconSection: {
            enabled: false,
            items: [
                { icon: 'material-symbols:star-outline', text: '120 min' },
                { icon: 'material-symbols:star-outline', text: '8.5' },
                { icon: 'material-symbols:star-outline', text: '1994' },
                { icon: 'material-symbols:star-outline', text: 'EN' },
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
    omdbApiKey: import.meta.env.VITE_OMDB_API_KEY ?? '',
};

function App() {

    const { user } = useAuth();
    const { addItem, items: cartItems } = useCart();
    const { t } = useT();
    const [showCartModal, setShowCartModal] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [processedImage, setProcessedImage] = useState<ImageData | null>(null);
    const [options, setOptions] = useState<DitherOptions>(DEFAULT_OPTIONS);

    const posterRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout>>();
    const canvasWrapperRef = useRef<HTMLDivElement>(null);
    const innerCanvasRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
    const [innerCanvasSize, setInnerCanvasSize] = useState({ w: 0, h: 0 });

    const imageDimensions = useImageDimensions(imageFile);
    const workerRef = useDitherWorker(setProcessedImage);

    const handleGridFile = (file: File) => {
        setOptions((prev) => {
            const newImages = [...prev.grid.images];
            let targetIndex = newImages.findIndex((s) => s.id === prev.grid.selectedSlotId);

            if (targetIndex === -1 || newImages[targetIndex].file) {
                const emptySlotIndex = newImages.findIndex((s) => !s.file);
                if (emptySlotIndex !== -1) targetIndex = emptySlotIndex;
                else if (targetIndex === -1) targetIndex = 0;
            }

            newImages[targetIndex] = { ...newImages[targetIndex], file, src: URL.createObjectURL(file) };
            return { ...prev, grid: { ...prev.grid, images: newImages } };
        });
    };

    usePasteHandler(options.imageMode, setImageFile, handleGridFile);

    // Track canvas wrapper size (outer, including toolbar)
    useEffect(() => {
        const el = canvasWrapperRef.current;
        if (!el) return;
        const ro = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect;
            setContainerSize({ w: width, h: height });
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Track inner canvas area size (below toolbar, before padding) for accurate fit calculation
    useEffect(() => {
        const el = innerCanvasRef.current;
        if (!el) return;
        const ro = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect;
            setInnerCanvasSize({ w: width, h: height });
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Sync palette when color mode or custom colors change
    useEffect(() => {
        const basePalette = computePaletteFromColorMode(options);

        let palette: [number, number, number][];
        if (!options.strictSwatches && options.colorMode !== 'rgb') {
            const hexColors = basePalette.map((c) => rgbToHex(c[0], c[1], c[2]));
            const interpolated = interpolateColors(hexColors, options.paletteSteps);
            palette = interpolated.map((hex) => {
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                return [r, g, b];
            });
        } else {
            palette = basePalette;
        }

        setOptions((prev) => ({ ...prev, palette }));
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
        options.quadtoneColors.color4,
    ]);

    // Process image through dither worker with debounce
    useEffect(() => {
        if (!workerRef.current) return;
        if (timerRef.current) clearTimeout(timerRef.current);

        const processImage = (file: File, opts: DitherOptions): Promise<ImageData> => {
            return new Promise((resolve) => {
                const jobId = Math.random().toString(36).substring(7);
                const url = URL.createObjectURL(file);
                const img = new Image();
                img.src = url;
                img.onload = () => {
                    const scale = opts.previewResolution / Math.max(img.width, img.height);
                    const previewWidth = Math.round(img.width * scale);
                    const previewHeight = Math.round(img.height * scale);

                    const canvas = document.createElement('canvas');
                    canvas.width = previewWidth;
                    canvas.height = previewHeight;
                    const ctx = canvas.getContext('2d')!;
                    ctx.drawImage(img, 0, 0, previewWidth, previewHeight);
                    const imageData = ctx.getImageData(0, 0, previewWidth, previewHeight);
                    URL.revokeObjectURL(url);

                    const handleResponse = (e: MessageEvent<WorkerResponse | WorkerErrorResponse>) => {
                        if ('imageData' in e.data && e.data.jobId === jobId) {
                            resolve(e.data.imageData);
                            workerRef.current?.removeEventListener('message', handleResponse);
                        }
                    };
                    workerRef.current?.addEventListener('message', handleResponse);
                    workerRef.current?.postMessage({ imageData, options: opts, jobId });
                };
            });
        };

        timerRef.current = setTimeout(async () => {
            if (options.imageMode === 'single') {
                if (!imageFile) return;
                const result = await processImage(imageFile, options);
                setProcessedImage(result);
            } else {
                const settingsHash = JSON.stringify([
                    options.engine, options.algorithm, options.threshold, options.palette,
                    options.brightness, options.contrast, options.gamma, options.pointSize,
                    options.previewResolution, options.colorPipeline, options.invert, options.accent,
                ]);

                const needsProcessing = options.grid.images.some(
                    (slot) => slot.file && (!slot.processedImageData || slot.lastSettingsHash !== settingsHash)
                );

                if (!needsProcessing) return;

                const updatedImages = await Promise.all(
                    options.grid.images.map(async (slot: Slot) => {
                        if (slot.file && (!slot.processedImageData || slot.lastSettingsHash !== settingsHash)) {
                            const processed = await processImage(slot.file, options);
                            return { ...slot, processedImageData: processed, lastSettingsHash: settingsHash };
                        }
                        return slot;
                    })
                );

                setOptions((prev) => {
                    const mergedImages = prev.grid.images.map((prevSlot) => {
                        const updated = updatedImages.find((u) => u.id === prevSlot.id);
                        if (updated && updated.file === prevSlot.file && updated.processedImageData) {
                            return { ...prevSlot, processedImageData: updated.processedImageData, lastSettingsHash: updated.lastSettingsHash };
                        }
                        return prevSlot;
                    });
                    return { ...prev, grid: { ...prev.grid, images: mergedImages } };
                });
            }
        }, 50);

        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [
        imageFile,
        options.imageMode,
        [...options.grid.images].map((s) => s.id + (s.file ? 'f' : 'e')).sort().join(','),
        options.algorithm,
        options.threshold,
        options.palette.map((p) => p.join(',')).join('|'),
        options.brightness,
        options.contrast,
        options.gamma,
        options.pointSize,
        options.previewResolution,
        options.colorPipeline,
        options.invert,
        options.engine,
        JSON.stringify(options.accent),
    ]);

    const handleExport = () => exportPoster(options, imageFile);
    const handleCopyImage = () => copyPosterToClipboard(options, processedImage);

    const handleProjectLoad = async (project: PosterProject) => {
        const { getAsset } = await import('./lib/storage');
        const loadedOptions = JSON.parse(JSON.stringify(project.options)) as StoredDitherOptions;

        const singleAssetId = loadedOptions.assetId ?? (project as PosterProject & { assetId?: string }).assetId;
        if (loadedOptions.imageMode === 'single' && singleAssetId) {
            try {
                const asset = await getAsset(singleAssetId);
                if (asset?.blob) {
                    setImageFile(new File([asset.blob], 'project-image.webp', { type: asset.blob.type }));
                }
            } catch (err) {
                console.error('Failed to reconstruct single image asset:', err);
            }
        }

        if (loadedOptions.imageMode === 'grid' && loadedOptions.grid?.images) {
            loadedOptions.grid.images = await Promise.all(
                loadedOptions.grid.images.map(async (slot) => {
                    const slotAssetId = (slot as Slot & { assetId?: string }).assetId;
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
                })
            );
        }

        setOptions(loadedOptions);
    };

    const aspectRatioValue = ASPECT_RATIO_VALUES[options.poster.aspectRatio] ?? '420 / 594';

    const [zoom, setZoom] = useState<number | 'fit'>('fit');
    const [refreshKey, setRefreshKey] = useState(0);

    const handleZoomOut = () => setZoom(prev => {
        if (prev === 'fit') return 'fit';
        const idx = ZOOM_STEPS.findIndex(z => z >= prev);
        return ZOOM_STEPS[Math.max(0, idx - 1)];
    });

    const handleZoomIn = () => setZoom(prev => {
        if (prev === 'fit') return 1;
        const idx = ZOOM_STEPS.findIndex(z => z >= prev);
        return ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, idx + 1)];
    });

    const posterContent = options.poster.enabled ? (
        <PosterCanvas
            key={refreshKey}
            ref={posterRef}
            processedImage={processedImage}
            options={options}
            onUploadTrigger={() => document.getElementById('file-input')?.click()}
        />
    ) : (
        <DitherCanvas processedImage={processedImage} />
    );

    // Compute fit dimensions using inner canvas area size (below toolbar, contentRect excludes padding)
    const arParts = aspectRatioValue.split('/').map(s => parseFloat(s.trim()));
    const posterAR = (arParts[0] || 420) / (arParts[1] || 594);
    // innerCanvasSize is the stable wrapper below the toolbar; subtract only the canvas padding (p-4 mobile / p-8 desktop)
    const canvasPad = innerCanvasSize.w < 560 ? 32 : 64;
    const availW = Math.max(0, innerCanvasSize.w - canvasPad);
    const availH = Math.max(0, innerCanvasSize.h - canvasPad);
    let fitWidth = containerSize.w > 0 ? Math.min(700, availW) : 700;
    if (availH > 0 && fitWidth / posterAR > availH) {
        fitWidth = availH * posterAR;
    }
    fitWidth = Math.max(50, Math.round(fitWidth));

    const BASE_BORDER = 16;
    const fitBorder = Math.max(2, Math.round(BASE_BORDER * fitWidth / 700));
    const zoomBorder = typeof zoom === 'number' ? Math.max(2, Math.round(BASE_BORDER * zoom)) : fitBorder;

    const posterFrameBase: React.CSSProperties = {
        aspectRatio: aspectRatioValue,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    };

    async function handleOrderPoster() {
        const previewBlob = await exportPosterPreviewBlob(options, processedImage);
        const previewBlobUrl = previewBlob ? URL.createObjectURL(previewBlob) : '';
        const size = (['A5', 'A4', 'A3'] as const).includes(options.poster.aspectRatio as 'A5' | 'A4' | 'A3')
            ? (options.poster.aspectRatio as 'A5' | 'A4' | 'A3')
            : 'A4';
        addItem({
            options,
            imageFile,
            processedImage,
            previewBlob: previewBlob ?? null,
            previewBlobUrl,
            size,
            quantity: 1,
            frame: 'none',
        });
        setShowCartModal(true);
    }

    return (
        <div className="flex w-full flex-1 bg-black text-white overflow-hidden font-sans md:flex-row flex-col">

        {/* Add-to-cart modal */}
        {showCartModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                                <ShoppingCart size={18} className="text-white" />
                            </div>
                            <div>
                                <p className="font-semibold text-white text-sm">{t('addedToCart')}</p>
                                <p className="text-xs text-neutral-400 mt-0.5">{t('addedToCartDesc')}</p>
                            </div>
                        </div>
                        <button onClick={() => setShowCartModal(false)} className="text-neutral-600 hover:text-white transition-colors ml-2 flex-shrink-0">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowCartModal(false)}
                            className="flex-1 py-2.5 rounded-xl border border-neutral-700 text-sm text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors"
                        >
                            {t('continuecreating')}
                        </button>
                        <Link
                            to="/cart"
                            onClick={() => setShowCartModal(false)}
                            className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-semibold text-center hover:bg-neutral-100 transition-colors"
                        >
                            {t('goToCart')}
                        </Link>
                    </div>
                </div>
            </div>
        )}
            {/* Sidebar — hidden on mobile, fixed width on desktop */}
            <aside className="hidden md:flex md:w-80 flex-shrink-0 md:z-20 border-r border-neutral-800 bg-black md:flex-col">
                <Controls
                    options={options}
                    onOptionsChange={setOptions}
                    onExport={handleExport}
                    onCopy={handleCopyImage}
                    onOrder={handleOrderPoster}
                    onUploadClick={() => document.getElementById('file-input')?.click()}
                    imageDimensions={imageDimensions}
                    imageFile={imageFile}
                    onProjectLoad={handleProjectLoad}
                    isAdmin={user?.role === 'admin'}
                    cartCount={cartItems.length}
                />
            </aside>

            {/* Main content */}
            <main className="flex-1 flex flex-col relative min-w-0 bg-[#D0D0D0] overflow-hidden">
                {/* Canvas area */}
                <div ref={canvasWrapperRef} className="flex-1 min-h-0 relative overflow-hidden">

                    {/* Floating zoom controls — top left */}
                    <div className="absolute top-3 left-3 z-20 flex items-center gap-1 bg-black/75 backdrop-blur-sm rounded-full px-2 py-1.5 shadow-lg select-none">
                        <button
                            onClick={handleZoomOut}
                            disabled={zoom === 'fit' || zoom <= 0.25}
                            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 disabled:opacity-30 text-sm font-bold text-white transition-colors cursor-pointer disabled:cursor-default"
                            title="Zoom out"
                        >
                            −
                        </button>
                        <span className="text-xs font-medium min-w-[36px] text-center tabular-nums text-white">
                            {zoom === 'fit' ? 'Fit' : `${Math.round((zoom as number) * 100)}%`}
                        </span>
                        <button
                            onClick={handleZoomIn}
                            disabled={typeof zoom === 'number' && zoom >= 3}
                            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 disabled:opacity-30 text-sm font-bold text-white transition-colors cursor-pointer disabled:cursor-default"
                            title="Zoom in"
                        >
                            +
                        </button>
                        {zoom !== 'fit' && (
                            <>
                                <div className="w-px h-3 bg-white/20 mx-0.5" />
                                <button
                                    onClick={() => setZoom('fit')}
                                    className="text-xs font-medium px-2 py-0.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                                    title="Fit to screen"
                                >
                                    Fit
                                </button>
                            </>
                        )}
                    </div>

                    {/* Floating refresh — bottom right */}
                    <button
                        onClick={() => setRefreshKey(k => k + 1)}
                        className="absolute bottom-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/75 backdrop-blur-sm text-white hover:bg-black/90 transition-colors shadow-lg cursor-pointer text-sm"
                        title="Refresh preview"
                    >
                        ↺
                    </button>

                    {/* Stable wrapper — measured for accurate fit calculation */}
                    <div ref={innerCanvasRef} className="w-full h-full">
                        {zoom === 'fit' ? (
                            <div className="w-full h-full bg-[#D0D0D0] p-4 md:p-8 flex items-center justify-center overflow-hidden">
                                <div style={{ ...posterFrameBase, width: `${fitWidth}px`, border: `${fitBorder}px solid black` }}>
                                    {posterContent}
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-full bg-[#D0D0D0] overflow-auto p-4 md:p-8">
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '100%', minWidth: 'max-content' }}>
                                    <div style={{ ...posterFrameBase, width: `${700 * (zoom as number)}px`, border: `${zoomBorder}px solid black`, flexShrink: 0 }}>
                                        {posterContent}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile controls — flex-1 so it takes equal space as canvas on mobile, hidden on desktop */}
                <div className="flex-1 min-h-0 flex md:hidden bg-black border-t border-neutral-800 overflow-hidden">
                    <Controls
                        options={options}
                        onOptionsChange={setOptions}
                        onExport={handleExport}
                        onCopy={handleCopyImage}
                        onOrder={handleOrderPoster}
                        onUploadClick={() => document.getElementById('file-input')?.click()}
                        imageDimensions={imageDimensions}
                        imageFile={imageFile}
                        onProjectLoad={handleProjectLoad}
                        isAdmin={user?.role === 'admin'}
                        cartCount={cartItems.length}
                    />
                </div>
            </main>

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
