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
import { PosterProject, saveDraft, loadDraft } from './lib/storage';
import { computePaletteFromColorMode, interpolateColors, rgbToHex } from './lib/colorUtils';
import { exportPoster, copyPosterToClipboard, exportPosterPreviewBlob } from './lib/posterExport';
import { useImageDimensions } from './hooks/useImageDimensions';
import { useDitherWorker } from './hooks/useDitherWorker';
import { getPosterSize } from './lib/posterSizes';
import { DEFAULT_OPTIONS } from './lib/defaultOptions';
import { usePasteHandler } from './hooks/usePasteHandler';



const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3];


function App() {

    const { user } = useAuth();
    const { addItem, items: cartItems } = useCart();
    const { t } = useT();
    const [showCartModal, setShowCartModal] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [processedImage, setProcessedImage] = useState<ImageData | null>(null);
    // Placeholder poster text follows the UI language
    const [options, setOptions] = useState<DitherOptions>(() => ({
        ...DEFAULT_OPTIONS,
        poster: { ...DEFAULT_OPTIONS.poster, title: t('defaultPosterTitle'), description: [t('defaultPosterDesc')] },
    }));

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

    // Restore the design in progress, then keep it saved as the user works
    const [draftReady, setDraftReady] = useState(false);
    useEffect(() => {
        loadDraft()
            .then(draft => {
                if (!draft) return;
                const restored = draft.options as DitherOptions;
                // Blob URLs die with the page; rebuild them from the stored files
                restored.grid = {
                    ...restored.grid,
                    images: restored.grid.images.map(slot => (slot.file ? { ...slot, src: URL.createObjectURL(slot.file) } : slot)),
                };
                setOptions(restored);
                if (draft.image) setImageFile(draft.image);
            })
            .catch(err => console.warn('[draft] restore failed', err))
            .finally(() => setDraftReady(true));
    }, []);

    useEffect(() => {
        if (!draftReady) return;
        const id = setTimeout(() => {
            saveDraft({ options, image: imageFile, savedAt: Date.now() }).catch(err => console.warn('[draft] save failed', err));
        }, 600);
        return () => clearTimeout(id);
    }, [options, imageFile, draftReady]);

    // No pull-to-refresh / overscroll bounce while editing (iOS 16+, Android Chrome)
    useEffect(() => {
        const html = document.documentElement;
        const prev = [html.style.overscrollBehaviorY, document.body.style.overscrollBehaviorY];
        html.style.overscrollBehaviorY = 'none';
        document.body.style.overscrollBehaviorY = 'none';
        return () => { [html.style.overscrollBehaviorY, document.body.style.overscrollBehaviorY] = prev; };
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
                if (!imageFile) {
                    if (!options.poster.textOnly) return;
                    setProcessedImage(null);
                    return;
                }
                const result = await processImage(imageFile, options);
                setProcessedImage(result);
            } else {
                const settingsHash = JSON.stringify([
                    options.algorithm, options.threshold, options.palette,
                    options.brightness, options.contrast, options.gamma, options.pointSize,
                    options.previewResolution, options.colorPipeline, options.invert, options.asciiText,
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
        options.asciiText,
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

    const sizeSpec = getPosterSize(options.poster.aspectRatio);
    const aspectRatioValue = `${sizeSpec.widthMm} / ${sizeSpec.heightMm}`;

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

    const posterFrameBase: React.CSSProperties = {
        aspectRatio: aspectRatioValue,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(20, 20, 18, 0.22), 0 2px 8px rgba(20, 20, 18, 0.10)',
        border: '1px solid #DDDDD8',
        background: '#fff',
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
        <div className="flex w-full flex-1 bg-paper text-ink overflow-hidden font-sans md:flex-row flex-col">

        {/* Add-to-cart modal */}
        {showCartModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
                <div className="bg-surface border border-line rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-ink/5 flex items-center justify-center flex-shrink-0">
                                <ShoppingCart size={18} className="text-ink" />
                            </div>
                            <div>
                                <p className="font-semibold text-ink text-sm">{t('addedToCart')}</p>
                                <p className="text-xs text-ink-soft mt-0.5">{t('addedToCartDesc')}</p>
                            </div>
                        </div>
                        <button onClick={() => setShowCartModal(false)} className="text-ink-faint hover:text-ink transition-colors ml-2 flex-shrink-0">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowCartModal(false)}
                            className="flex-1 py-2.5 rounded-full border border-line text-sm text-ink-soft hover:text-ink hover:border-ink/40 transition-colors"
                        >
                            {t('continuecreating')}
                        </button>
                        <Link
                            to="/cart"
                            onClick={() => setShowCartModal(false)}
                            className="flex-1 py-2.5 rounded-full bg-ink text-paper text-sm font-semibold text-center hover:bg-black transition-colors"
                        >
                            {t('goToCart')}
                        </Link>
                    </div>
                </div>
            </div>
        )}
            {/* Sidebar — hidden on mobile, fixed width on desktop */}
            <aside className="hidden md:flex md:w-80 flex-shrink-0 md:z-20 bg-paper md:flex-col">
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
            <main className="flex-1 flex flex-col relative min-w-0 bg-canvas workspace-grid overflow-hidden">
                {/* Canvas area */}
                <div ref={canvasWrapperRef} className="basis-[40%] flex-none md:flex-1 md:basis-auto min-h-0 relative overflow-hidden">

                    {/* Floating zoom controls — top left */}
                    <div className="absolute top-2 left-2 md:top-3 md:left-3 z-20 flex items-center gap-1 bg-surface border border-line rounded-full px-1.5 md:px-2 py-1 md:py-1.5 shadow-card select-none">
                        <button
                            onClick={handleZoomOut}
                            disabled={zoom === 'fit' || zoom <= 0.25}
                            className="w-9 h-9 md:w-6 md:h-6 flex items-center justify-center rounded-full hover:bg-line/50 disabled:opacity-30 text-base md:text-sm font-bold text-ink transition-colors cursor-pointer disabled:cursor-default"
                            title="Zoom out"
                        >
                            −
                        </button>
                        <span className="text-xs font-medium min-w-[36px] text-center tabular-nums text-ink">
                            {zoom === 'fit' ? 'Fit' : `${Math.round((zoom as number) * 100)}%`}
                        </span>
                        <button
                            onClick={handleZoomIn}
                            disabled={typeof zoom === 'number' && zoom >= 3}
                            className="w-9 h-9 md:w-6 md:h-6 flex items-center justify-center rounded-full hover:bg-line/50 disabled:opacity-30 text-base md:text-sm font-bold text-ink transition-colors cursor-pointer disabled:cursor-default"
                            title="Zoom in"
                        >
                            +
                        </button>
                        {zoom !== 'fit' && (
                            <>
                                <div className="w-px h-3 bg-line mx-0.5" />
                                <button
                                    onClick={() => setZoom('fit')}
                                    className="text-xs font-medium px-2 py-2 md:py-0.5 rounded-full text-ink-soft hover:text-ink hover:bg-line/50 transition-colors cursor-pointer"
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
                        aria-label="Refresh preview"
                        className="absolute bottom-2 right-2 md:bottom-3 md:right-3 z-20 w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-surface border border-line text-ink hover:bg-line/40 transition-colors shadow-card cursor-pointer text-sm"
                        title="Refresh preview"
                    >
                        ↺
                    </button>

                    {/* Stable wrapper — measured for accurate fit calculation */}
                    <div ref={innerCanvasRef} className="w-full h-full">
                        {zoom === 'fit' ? (
                            <div className="w-full h-full p-4 md:p-8 flex items-center justify-center overflow-hidden">
                                <div style={{ ...posterFrameBase, width: `${fitWidth}px` }}>
                                    {posterContent}
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-full overflow-auto p-4 md:p-8">
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '100%', minWidth: 'max-content' }}>
                                    <div style={{ ...posterFrameBase, width: `${700 * (zoom as number)}px`, flexShrink: 0 }}>
                                        {posterContent}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile controls take the larger share of the screen; hidden on desktop */}
                <div className="flex-1 min-h-0 flex md:hidden bg-paper border-t border-line overflow-hidden">
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
