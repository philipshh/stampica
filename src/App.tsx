import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, X, ArrowLeft } from 'lucide-react';
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
import { loadScaledImageData } from './lib/canvasMemory';
import translations from './i18n/translations';
import { usePasteHandler } from './hooks/usePasteHandler';



const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3];


function App() {

    const { user } = useAuth();
    const { addItem, items: cartItems } = useCart();
    const { t, lang } = useT();
    const [showCartModal, setShowCartModal] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [processedImage, setProcessedImage] = useState<ImageData | null>(null);
    // Placeholder poster text follows the UI language
    const [options, setOptions] = useState<DitherOptions>(() => ({
        ...DEFAULT_OPTIONS,
        poster: { ...DEFAULT_OPTIONS.poster, title: t('defaultPosterTitle'), director: t('defaultPosterDirector'), description: [t('defaultPosterDesc')] },
    }));

    // Only the panel that's on screen is built: a hidden second panel would also
    // render every effect thumbnail in its own worker.
    const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 768px)').matches);
    useEffect(() => {
        const mq = window.matchMedia('(min-width: 768px)');
        const onChange = () => setIsDesktop(mq.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);
    const posterRef = useRef<HTMLDivElement>(null);
    const previewBusyRef = useRef(false);
    const previewPendingRef = useRef<{ file: File; opts: DitherOptions } | null>(null);
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

    // On language switch, swap any sample text the user hasn't edited yet
    useEffect(() => {
        const other = lang === 'en' ? 'sr' : 'en';
        const tr = (l: 'en' | 'sr', k: 'defaultPosterTitle' | 'defaultPosterDirector' | 'defaultPosterDesc') => translations[l][k];
        setOptions(prev => {
            const p = prev.poster;
            const title = p.title === tr(other, 'defaultPosterTitle') ? tr(lang, 'defaultPosterTitle') : p.title;
            const director = p.director === tr(other, 'defaultPosterDirector') ? tr(lang, 'defaultPosterDirector') : p.director;
            const description = p.description.map(d => d === tr(other, 'defaultPosterDesc') ? tr(lang, 'defaultPosterDesc') : d);
            if (title === p.title && director === p.director && description.every((d, i) => d === p.description[i])) return prev;
            return { ...prev, poster: { ...p, title, director, description } };
        });
    }, [lang, draftReady]);

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
            return new Promise((resolve, reject) => {
                const jobId = Math.random().toString(36).substring(7);
                loadScaledImageData(file, opts.previewResolution).then((source) => {
                    const worker = workerRef.current;
                    if (!worker) return reject(new Error('worker gone'));
                    // Send a copy of the cached pixels and hand its memory to the worker (no second copy)
                    const imageData = new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);

                    const done = () => {
                        clearTimeout(timeout);
                        worker.removeEventListener('message', handleResponse);
                        worker.removeEventListener('error', handleError);
                    };
                    const handleResponse = (e: MessageEvent<WorkerResponse | WorkerErrorResponse>) => {
                        if (e.data.jobId !== jobId) return;
                        done();
                        if ('imageData' in e.data) resolve(e.data.imageData);
                        else reject(new Error(e.data.error));
                    };
                    const handleError = () => { done(); reject(new Error('worker crashed')); };
                    // Never leave the preview waiting forever
                    const timeout = setTimeout(() => { done(); reject(new Error('preview timed out')); }, 30000);
                    worker.addEventListener('message', handleResponse);
                    worker.addEventListener('error', handleError);
                    worker.postMessage({ imageData, options: opts, jobId }, [imageData.data.buffer]);
                }).catch(reject);
            });
        };

        timerRef.current = setTimeout(async () => {
            if (options.imageMode === 'single') {
                if (!imageFile) {
                    if (!options.poster.textOnly) return;
                    setProcessedImage(null);
                    return;
                }
                // Latest wins: while one job runs, keep only the newest settings. Dragging a
                // slider then skips the in-between steps instead of queueing every one.
                const job = { file: imageFile, opts: options };
                if (previewBusyRef.current) { previewPendingRef.current = job; return; }
                previewBusyRef.current = true;
                try {
                    let next: typeof job | null = job;
                    while (next) {
                        previewPendingRef.current = null;
                        try {
                            setProcessedImage(await processImage(next.file, next.opts));
                        } catch (err) {
                            console.warn('[preview]', err);
                        }
                        next = previewPendingRef.current;
                    }
                } finally {
                    previewBusyRef.current = false;
                }
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
        }, options.imageMode === 'single' ? 0 : 50); // single: no wait, the busy check above skips stale steps

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
        <div className="flex w-full flex-1 min-h-0 bg-paper text-ink overflow-hidden font-sans md:flex-row flex-col">

        {/* Phones: one slim editor bar replaces the site header and the bottom Add to cart bar */}
        <div className="md:hidden flex-shrink-0 flex items-center gap-2 pl-1 pr-2 h-12 box-content pt-[env(safe-area-inset-top)] bg-paper border-b border-line">
            <Link to="/" aria-label={t('home')} className="press w-11 h-11 flex items-center justify-center rounded-full text-ink">
                <ArrowLeft size={20} />
            </Link>
            <div className="flex-1" />
            <Link to="/cart" aria-label={t('viewCart')} className="press relative w-11 h-11 flex items-center justify-center rounded-full text-ink">
                <ShoppingCart size={20} />
                {cartItems.length > 0 && (
                    <span className="absolute top-1 right-0.5 min-w-4 h-4 px-1 flex items-center justify-center bg-vermilion text-paper text-[9px] font-bold rounded-full leading-none">
                        {cartItems.length > 9 ? '9+' : cartItems.length}
                    </span>
                )}
            </Link>
            <button
                onClick={handleOrderPoster}
                className="press h-9 px-4 flex items-center gap-1.5 rounded-full bg-ink text-paper text-sm font-semibold"
            >
                {t('addToCart')}
            </button>
        </div>

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
                {isDesktop && <Controls
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
                />}
            </aside>

            {/* Main content */}
            <main className="flex-1 flex flex-col relative min-w-0 bg-canvas workspace-grid overflow-hidden">
                {/* Canvas area */}
                <div ref={canvasWrapperRef} className="basis-[46%] flex-none md:flex-1 md:basis-auto min-h-0 relative overflow-hidden">

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
                    {!isDesktop && <Controls
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
                    />}
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
