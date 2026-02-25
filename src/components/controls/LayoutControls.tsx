import React, { useState } from 'react';
import { DitherOptions } from '../../lib/dither';
import { getPosterDimensions } from '../../lib/posterRenderer';
import { GripVertical, Eye, EyeOff } from 'lucide-react';

interface LayoutControlsProps {
    options: DitherOptions;
    onOptionsChange: (options: DitherOptions) => void;
    imageDimensions: { width: number; height: number } | null;
}

export const LayoutControls: React.FC<LayoutControlsProps> = ({ options, onOptionsChange, imageDimensions }) => {
    const [draggedItem, setDraggedItem] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedItem(index);
        e.dataTransfer.effectAllowed = 'move';
        // Transparent drag image or default
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedItem === null) return;
        if (draggedItem !== index) {
            const newOrder = [...options.poster.layoutOrder];
            const item = newOrder[draggedItem];
            newOrder.splice(draggedItem, 1);
            newOrder.splice(index, 0, item);

            onOptionsChange({
                ...options,
                poster: { ...options.poster, layoutOrder: newOrder }
            });
            setDraggedItem(index);
        }
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
    };

    const toggleSection = (section: string) => {
        const poster = { ...options.poster };
        switch (section) {
            case 'header': poster.showHeader = !poster.showHeader; break;
            case 'title': poster.showTitle = !poster.showTitle; break;
            case 'image': poster.showImage = !poster.showImage; break;
            case 'footer': poster.showFooter = !poster.showFooter; break;
            case 'list':
                poster.listSection = { ...poster.listSection, enabled: !poster.listSection.enabled };
                break;
            case 'icons':
                poster.iconSection = { ...poster.iconSection, enabled: !poster.iconSection.enabled };
                break;
        }
        onOptionsChange({ ...options, poster });
    };

    const isSectionEnabled = (section: string) => {
        switch (section) {
            case 'header': return options.poster.showHeader;
            case 'title': return options.poster.showTitle;
            case 'image': return options.poster.showImage;
            case 'footer': return options.poster.showFooter;
            case 'list': return options.poster.listSection.enabled;
            case 'icons': return options.poster.iconSection.enabled;
            default: return false;
        }
    };

    const getSectionLabel = (section: string) => {
        switch (section) {
            case 'header': return 'Header';
            case 'title': return 'Title';
            case 'image': return 'Image';
            case 'footer': return 'Footer';
            case 'list': return 'List';
            case 'icons': return 'Icons';
            default: return section;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-200">
            <div className="space-y-4">
                {/* Layout Reordering */}
                <div className="space-y-2">
                    <label className="text-[10px] text-neutral-400 tracking-wider block">Layout Order</label>
                    <div className="space-y-1">
                        {options.poster.layoutOrder.map((section, index) => (
                            <div
                                key={section}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                className={`flex items-center gap-2 p-2 bg-neutral-900 border border-neutral-800 rounded group cursor-move ${draggedItem === index ? 'opacity-50' : ''}`}
                            >
                                <GripVertical className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400" />
                                <span className="flex-1 text-xs uppercase text-neutral-300">{getSectionLabel(section)}</span>
                                <button
                                    onClick={() => toggleSection(section)}
                                    className="text-neutral-500 hover:text-white transition-colors"
                                >
                                    {isSectionEnabled(section) ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Shuffle and Reset Buttons */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <button
                            onClick={() => {
                                const shuffled = [...options.poster.layoutOrder].sort(() => Math.random() - 0.5);
                                onOptionsChange({
                                    ...options,
                                    poster: { ...options.poster, layoutOrder: shuffled }
                                });
                            }}
                            className="px-3 py-2 bg-neutral-800 text-neutral-300 text-[10px] uppercase tracking-wider font-medium rounded hover:bg-neutral-700 hover:text-white transition-colors flex items-center justify-center gap-2"
                        >
                            <span>🎲</span> Shuffle
                        </button>
                        <button
                            onClick={() => {
                                onOptionsChange({
                                    ...options,
                                    poster: {
                                        ...options.poster,
                                        layoutOrder: ['header', 'image', 'title', 'icons', 'list', 'footer']
                                    }
                                });
                            }}
                            className="px-3 py-2 border border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-white transition-colors uppercase text-[10px]"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Padding and Margins */}
                <div className="p-3 bg-neutral-900/50 rounded-lg border border-neutral-800 space-y-3 animate-in fade-in slide-in-from-top-1">
                    {/* Padding Size */}
                    <div className="space-y-1">
                        <label className="text-[10px] text-neutral-400 tracking-wider block">Poster padding</label>
                        <div className="grid grid-cols-3 gap-1">
                            {(['S', 'M', 'L'] as const).map((size) => (
                                <button
                                    key={size}
                                    onClick={() => onOptionsChange({
                                        ...options,
                                        poster: { ...options.poster, paddingSize: size }
                                    })}
                                    className={`py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] uppercase ${options.poster.paddingSize === size ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Image Padding */}
                    <div className="space-y-1">
                        <label className="text-[10px] text-neutral-400 tracking-wider block">Image padding</label>
                        <div className="grid grid-cols-2 gap-1">
                            <button
                                onClick={() => onOptionsChange({
                                    ...options,
                                    poster: { ...options.poster, imagePadding: 'none' }
                                })}
                                className={`py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] uppercase ${options.poster.imagePadding === 'none' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                            >
                                None
                            </button>
                            <button
                                onClick={() => onOptionsChange({
                                    ...options,
                                    poster: { ...options.poster, imagePadding: 'same-as-poster' }
                                })}
                                className={`py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] uppercase ${options.poster.imagePadding === 'same-as-poster' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                            >
                                Same as Poster
                            </button>
                        </div>
                    </div>
                    {/* Image Scale */}
                    <div className="space-y-1">
                        <label className="text-[10px] text-neutral-400 tracking-wider block">Image scale</label>
                        <div className="grid grid-cols-3 gap-1">
                            {(['fit', 'fill', 'original'] as const).map((scale) => (
                                <button
                                    key={scale}
                                    onClick={() => onOptionsChange({
                                        ...options,
                                        poster: { ...options.poster, imageScale: scale }
                                    })}
                                    className={`py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] uppercase ${options.poster.imageScale === scale ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                                >
                                    {scale}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Image Alignment */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] text-neutral-400 tracking-wider block">Image Align X</label>
                            <div className="grid grid-cols-3 gap-1">
                                {(['left', 'center', 'right'] as const).map((align) => (
                                    <button
                                        key={align}
                                        onClick={() => onOptionsChange({
                                            ...options,
                                            poster: { ...options.poster, imageAlignX: align }
                                        })}
                                        className={`py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] uppercase ${options.poster.imageAlignX === align ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                                    >
                                        {align.charAt(0)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-neutral-400 tracking-wider block">Image Align Y</label>
                            <div className="grid grid-cols-3 gap-1">
                                {(['top', 'center', 'bottom'] as const).map((align) => (
                                    <button
                                        key={align}
                                        onClick={() => onOptionsChange({
                                            ...options,
                                            poster: { ...options.poster, imageAlignY: align }
                                        })}
                                        className={`py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] uppercase ${options.poster.imageAlignY === align ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                                    >
                                        {align.charAt(0)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Layout Gap */}
                    <div className="space-y-1">
                        <label className="text-[10px] text-neutral-400 tracking-wider block">Layout Gap</label>
                        <div className="flex gap-1 items-center">
                            {[16, 24, 32, 40].map((size) => (
                                <button
                                    key={size}
                                    onClick={() => onOptionsChange({
                                        ...options,
                                        poster: { ...options.poster, gap: size }
                                    })}
                                    className={`flex-1 py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] ${options.poster.gap === size ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                                >
                                    {size}
                                </button>
                            ))}
                            <input
                                type="number"
                                value={options.poster.gap}
                                onChange={(e) => onOptionsChange({
                                    ...options,
                                    poster: { ...options.poster, gap: parseInt(e.target.value) || 0 }
                                })}
                                className="w-12 py-1 bg-neutral-900 border border-neutral-800 text-white text-[10px] text-center focus:outline-none focus:border-neutral-600 rounded"
                            />
                        </div>
                    </div>

                    {/* Poster Sizes */}
                    <div className="space-y-1">
                        <label className="text-[10px] text-neutral-400 tracking-wider block uppercase">Poster Sizes</label>
                        <div className="grid grid-cols-4 gap-1">
                            {(['A5', 'A4', 'A3', 'A2'] as const).map((size) => {
                                const cmLabels: { [key: string]: string } = {
                                    'A5': '14.8x21',
                                    'A4': '21x29.7',
                                    'A3': '29.7x42',
                                    'A2': '42x59.4'
                                };
                                return (
                                <button
                                    key={size}
                                    onClick={() => {
                                        const baseDims = getPosterDimensions(options, options.poster.aspectRatio || 'A2', options.poster.resolution || 'high');
                                        onOptionsChange({
                                            ...options,
                                            poster: {
                                                ...options.poster,
                                                aspectRatio: size,
                                                customDimensions: {
                                                    width: baseDims.width,
                                                    height: baseDims.height,
                                                    keepRatio: true
                                                }
                                            }
                                        })
                                    }}
                                    className={`py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[8px] uppercase flex flex-col items-center justify-center ${options.poster.aspectRatio === size ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-500'}`}
                                    title={`${size} (${cmLabels[size]})`}
                                >
                                    <div>{size}</div>
                                    <div className="text-[7px] opacity-70">{cmLabels[size]}</div>
                                </button>
                                );
                            })}
                        </div>
                    </div>

                    {options.poster.aspectRatio === 'custom' && (
                        <div className="space-y-3 pt-3 border-t border-neutral-800 animate-in fade-in slide-in-from-top-1">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-neutral-500 uppercase tracking-tighter">Width (px)</label>
                                    <input
                                        type="number"
                                        value={options.poster.customDimensions?.width || 2000}
                                        onChange={(e) => {
                                            const w = parseInt(e.target.value) || 0;
                                            const dims = { ...options.poster.customDimensions! };
                                            if (dims.keepRatio && dims.width > 0) {
                                                const ratio = dims.height / dims.width;
                                                dims.height = Math.round(w * ratio);
                                            }
                                            dims.width = w;
                                            onOptionsChange({
                                                ...options,
                                                poster: { ...options.poster, customDimensions: dims }
                                            });
                                        }}
                                        className="w-full bg-neutral-900 border border-neutral-800 text-white px-2 py-1.5 text-xs focus:outline-none focus:border-neutral-600 rounded"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-neutral-500 uppercase tracking-tighter">Height (px)</label>
                                    <input
                                        type="number"
                                        value={options.poster.customDimensions?.height || 2000}
                                        onChange={(e) => {
                                            const h = parseInt(e.target.value) || 0;
                                            const dims = { ...options.poster.customDimensions! };
                                            if (dims.keepRatio && dims.height > 0) {
                                                const ratio = dims.width / dims.height;
                                                dims.width = Math.round(h * ratio);
                                            }
                                            dims.height = h;
                                            onOptionsChange({
                                                ...options,
                                                poster: { ...options.poster, customDimensions: dims }
                                            });
                                        }}
                                        className="w-full bg-neutral-900 border border-neutral-800 text-white px-2 py-1.5 text-xs focus:outline-none focus:border-neutral-600 rounded"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={options.poster.customDimensions?.keepRatio || false}
                                        onChange={(e) => {
                                            const dims = { ...options.poster.customDimensions!, keepRatio: e.target.checked };
                                            onOptionsChange({
                                                ...options,
                                                poster: { ...options.poster, customDimensions: dims }
                                            });
                                        }}
                                        className="sr-only peer"
                                    />
                                    <div className="w-6 h-3 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-2 after:w-2 after:transition-all peer-checked:bg-white/20 relative"></div>
                                    <span className="text-[10px] text-neutral-400 uppercase">Lock Aspect Ratio</span>
                                </label>

                                <button
                                    onClick={() => {
                                        if (imageDimensions) {
                                            const dims = {
                                                ...options.poster.customDimensions!,
                                                width: imageDimensions.width,
                                                height: imageDimensions.height
                                            };
                                            onOptionsChange({
                                                ...options,
                                                poster: { ...options.poster, customDimensions: dims }
                                            });
                                        } else {
                                            // Fallback to DOM if imageDimensions not available (e.g. grid mode)
                                            const img = document.querySelector('canvas') || document.querySelector('img');
                                            if (img) {
                                                const w = img instanceof HTMLCanvasElement ? img.width : (img as HTMLImageElement).naturalWidth;
                                                const h = img instanceof HTMLCanvasElement ? img.height : (img as HTMLImageElement).naturalHeight;
                                                if (w && h) {
                                                    const dims = { ...options.poster.customDimensions!, width: w, height: h };
                                                    onOptionsChange({
                                                        ...options,
                                                        poster: { ...options.poster, customDimensions: dims }
                                                    });
                                                }
                                            } else {
                                                alert('Please upload an image first to match dimensions.');
                                            }
                                        }
                                    }}
                                    className={`w-full py-1.5 border border-dashed transition-colors text-[9px] uppercase ${imageDimensions ? 'border-neutral-700 text-neutral-300 hover:border-white hover:text-white' : 'border-neutral-800 text-neutral-600 cursor-not-allowed'}`}
                                >
                                    Match Canvas to Image Size
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
