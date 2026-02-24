import { useState, useEffect, useRef } from 'react';
import { DitherCanvas } from './components/DitherCanvas';
import { PosterCanvas } from './components/PosterCanvas';
import { Controls } from './components/Controls';
import { DitherOptions, WorkerMessage, WorkerResponse, TitleFont, BodyFont, LayoutOrder } from './lib/dither';
import { drawPosterToCanvas } from './lib/posterRenderer';
import { generateRandomColor, generateRandomPalette } from './lib/colorUtils';
import Worker from './lib/worker?worker';

function App() {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [processedImage, setProcessedImage] = useState<ImageData | null>(null);
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

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
        pixelSize: 1,
        invert: false,
        colorMode: 'monochrome',
        monochromeColors: { dark: '#121212', light: '#ffffff' },
        duotoneColors: { color1: '#121212', color2: '#ff4400' },
        tritoneColors: { color1: '#121212', color2: '#ff4400', color3: '#4848f9' },
        quadtoneColors: { color1: '#121212', color2: '#ff4400', color3: '#ffffff', color4: '#4848f9' },
        paperTexture: 'none',
        paperTextureOpacity: 0,
        theme: 'light',
        designMode: 'poster',
        poster: {
            enabled: true,
            title: 'Naslov postera',
            subtitle: '',
            year: '2025',
            description: [
                'Ovo je primer postera sa prilagodljivim rasporedom elemenata. Moguće je menjati layout, boje slike i sadržaj svakog dela.'
            ],
            paperColor: '#F3F3F3',
            textColor: '#1A1A1A',
            titleColor: '#1A1A1A',
            subtitleColor: '#1A1A1A',
            directorTextColor: '#666666',
            listColor: '#1A1A1A',
            descriptionColor: '#1A1A1A',
            yearColor: '#1A1A1A',
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
            paddingSize: 'S',
            imagePadding: 'same-as-poster',
            titleMargin: 'S',
            subtitleMargin: 'S',
            descriptionColumns: 1,
            imageBackgroundColor: 'none',
            layoutOrder: ['header', 'title', 'image', 'icons', 'list', 'footer'],
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
                    { icon: 'star', text: '120 min' },
                    { icon: 'star', text: '8.5' },
                    { icon: 'star', text: '1994' },
                    { icon: 'star', text: 'EN' }
                ],
                width: 100,
                alignment: 'center',
                iconSize: 24,
                iconColor: '#1A1A1A',
                textColor: '#1A1A1A',
            },
            titleFont: 'Inter',
            bodyFont: 'Inter',
            imageRoundedCorners: 'none',
            showSubtitle: true,
            subtitleFontSize: 16,
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
                        setImageFile(file);
                    }
                    break;
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, []);

    // Helper function to calculate poster dimensions based on aspect ratio
    const getPosterDimensions = (aspectRatio: string, resolution: 'high' | 'low' = 'high'): { width: number; height: number } => {
        const POSTER_SIZES = {
            'A4': { width: 2480, height: 3508 },
            'A3': { width: 3508, height: 4961 },
            'A2': { width: 4961, height: 7016 }, // Default
            'A1': { width: 7016, height: 9933 },
            'A0': { width: 9933, height: 14043 },
            '18x24': { width: 5400, height: 7200 },
            '24x36': { width: 7200, height: 10800 },
            '27x40': { width: 8100, height: 12000 },
        };

        const size = POSTER_SIZES[aspectRatio as keyof typeof POSTER_SIZES] || POSTER_SIZES['A2'];

        if (resolution === 'low') {
            // Low res: fixed width 1080px, maintain aspect ratio
            const LOW_RES_WIDTH = 1080;
            const ratio = size.height / size.width;
            return {
                width: LOW_RES_WIDTH,
                height: Math.round(LOW_RES_WIDTH * ratio)
            };
        }

        return size;
    };

    const workerRef = useRef<Worker>();
    const posterRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<number>();

    // Initialize Worker
    useEffect(() => {
        workerRef.current = new Worker();
        workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
            setProcessedImage(e.data.imageData);
        };

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    // Helper function to convert hex to RGB
    const hexToRgb = (hex: string): [number, number, number] => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
            : [0, 0, 0];
    };

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

        setOptions(prev => ({ ...prev, palette: newPalette }));
    }, [
        options.colorMode,
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

    const handleRandomizeAll = () => {
        const titleFonts: TitleFont[] = ['Inter', 'Syne', 'Playfair Display', 'Unbounded', 'Lato', 'Roboto'];
        const bodyFonts: BodyFont[] = ['Inter', 'Roboto', 'Open Sans', 'Lato'];
        // Randomize order of sections
        const baseSections = ['header', 'title', 'image', 'icons', 'list', 'footer'];
        const randomLayout = [...baseSections].sort(() => Math.random() - 0.5);

        const alignments: ('left' | 'center' | 'right')[] = ['left', 'center', 'right'];
        const colorModes: ('monochrome' | 'duotone' | 'tritone')[] = ['monochrome', 'duotone', 'tritone'];
        const paddingSizes: ('S' | 'M' | 'L')[] = ['S', 'M', 'L'];

        const randomTitleFont = titleFonts[Math.floor(Math.random() * titleFonts.length)];
        const randomBodyFont = bodyFonts[Math.floor(Math.random() * bodyFonts.length)];
        const randomAlignment = alignments[Math.floor(Math.random() * alignments.length)];
        const randomColorMode = colorModes[Math.floor(Math.random() * colorModes.length)];
        const randomPadding = paddingSizes[Math.floor(Math.random() * paddingSizes.length)];

        const newOptions = { ...options };

        // Randomize Poster Settings
        newOptions.poster = {
            ...newOptions.poster,
            titleFont: randomTitleFont,
            bodyFont: randomBodyFont,
            layoutOrder: randomLayout,
            titleAlignment: randomAlignment,
            paperColor: generateRandomColor(),
            textColor: generateRandomColor(),
            titleColor: generateRandomColor(),
            subtitleColor: generateRandomColor(),
            directorTextColor: generateRandomColor(),
            listColor: generateRandomColor(),
            descriptionColor: generateRandomColor(),
            yearColor: generateRandomColor(),
            paddingSize: randomPadding,
        };

        // Randomize Color Mode & Colors
        newOptions.colorMode = randomColorMode;

        // Always randomize colors for the selected mode
        if (randomColorMode === 'monochrome') {
            newOptions.monochromeColors = { dark: generateRandomColor(), light: generateRandomColor() };
        } else if (randomColorMode === 'duotone') {
            newOptions.duotoneColors = generateRandomPalette('duotone') as any;
        } else if (randomColorMode === 'tritone') {
            newOptions.tritoneColors = generateRandomPalette('tritone') as any;
        }

        setOptions(newOptions);
    };

    // Process Image with Debounce and Downscaling
    useEffect(() => {
        if (!imageFile || !workerRef.current) return;

        // Clear previous timer
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }



        // Debounce by 100ms
        timerRef.current = setTimeout(() => {
            const img = new Image();
            img.src = URL.createObjectURL(imageFile);
            img.onload = () => {
                // Calculate scaled dimensions for preview (max 800px width)
                const MAX_PREVIEW_WIDTH = 800;
                setImageDimensions({ width: img.width, height: img.height });
                let previewWidth = img.width;
                let previewHeight = img.height;

                if (previewWidth > MAX_PREVIEW_WIDTH) {
                    const scale = MAX_PREVIEW_WIDTH / previewWidth;
                    previewWidth = MAX_PREVIEW_WIDTH;
                    previewHeight = Math.round(img.height * scale);
                }

                const canvas = document.createElement('canvas');
                canvas.width = previewWidth;
                canvas.height = previewHeight;
                const ctx = canvas.getContext('2d')!;

                // Draw scaled image
                ctx.drawImage(img, 0, 0, previewWidth, previewHeight);
                const imageData = ctx.getImageData(0, 0, previewWidth, previewHeight);

                const message: WorkerMessage = {
                    imageData,
                    options,
                };
                workerRef.current?.postMessage(message);
            };

            // Clean up object URL in the onload or if it fails, but here we just let it be for now as it's small
        }, 50); // Fast debounce for responsiveness

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [imageFile, options]);

    const handleExport = async () => {
        if (options.poster.enabled && posterRef.current) {
            // Export Poster - use the same processed image as preview
            try {

                // Use the current processed image from preview (already dithered)
                const dimensions = getPosterDimensions(options.poster.aspectRatio, options.poster.resolution);
                const canvas = await drawPosterToCanvas(options, processedImage, dimensions);

                const format = options.poster.exportFormat || 'png';
                const link = document.createElement('a');
                link.download = `yup-poster.${format}`;
                link.href = canvas.toDataURL(`image/${format}`, format === 'jpeg' ? 1.0 : undefined);
                link.click();

            } catch (error) {
                console.error('Poster export failed:', error);
            }
        } else if (processedImage) {
            // Export Dithered Image
            const canvas = document.createElement('canvas');
            canvas.width = processedImage.width;
            canvas.height = processedImage.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.putImageData(processedImage, 0, 0);
                const link = document.createElement('a');
                link.download = 'dithered-image.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            }
        } else if (imageFile && workerRef.current) {
            // If no processed image yet, process the full image for export

            const img = new Image();
            img.src = URL.createObjectURL(imageFile);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                const exportWorker = new Worker();
                exportWorker.onmessage = (e: MessageEvent<WorkerResponse>) => {
                    const exportCanvas = document.createElement('canvas');
                    exportCanvas.width = e.data.imageData.width;
                    exportCanvas.height = e.data.imageData.height;
                    const exportCtx = exportCanvas.getContext('2d')!;
                    exportCtx.putImageData(e.data.imageData, 0, 0);

                    const link = document.createElement('a');
                    link.download = 'dithered-image.png';
                    link.href = exportCanvas.toDataURL('image/png');
                    link.click();

                    exportWorker.terminate();
                };

                exportWorker.postMessage({
                    imageData,
                    options,
                });
            };
        }
    };

    const handleCopyImage = async () => {
        if (options.poster.enabled && posterRef.current) {
            try {
                const dimensions = getPosterDimensions(options.poster.aspectRatio, options.poster.resolution);
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

    const handleMovieSelect = async (movie: { title: string; director: string; year: string; plot: string; posterUrl: string; actors?: string }) => {
        // Parse actors list - take at least 6 if available
        const actorsList = movie.actors ? movie.actors.split(',').map(a => a.trim()).slice(0, 6) : [];

        // Update text details immediately (no image fetching)
        setOptions(prev => ({
            ...prev,
            poster: {
                ...prev.poster,
                title: movie.title,
                director: movie.director,
                year: movie.year,
                description: [movie.plot],
                descriptionColumns: 1,
                // Auto-populate list section with actors if available
                listSection: {
                    ...prev.poster.listSection,
                    enabled: actorsList.length > 0,
                    content: actorsList,
                    columns: actorsList.length > 4 ? 2 : 1 // Auto-adjust columns based on count
                }
            }
        }));
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
                    onMovieSelect={handleMovieSelect}
                    imageFile={imageFile}
                    onRandomizeAll={handleRandomizeAll}
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
