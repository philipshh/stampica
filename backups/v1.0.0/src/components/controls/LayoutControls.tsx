import React, { useState } from 'react';
import { DitherOptions } from '../../lib/dither';
import { GripVertical, Eye, EyeOff } from 'lucide-react';

interface LayoutControlsProps {
    options: DitherOptions;
    onOptionsChange: (options: DitherOptions) => void;
}

export const LayoutControls: React.FC<LayoutControlsProps> = ({ options, onOptionsChange }) => {
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
                                        layoutOrder: ['header', 'title', 'image', 'icons', 'list', 'footer']
                                    }
                                });
                            }}
                            className="px-3 py-2 border border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-white transition-colors uppercase text-[10px]"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Font Groups */}
                <div className="space-y-4 pt-4 border-t border-neutral-800">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] text-neutral-400 tracking-wider">Fonts</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    const titleFonts = ['Inter', 'Syne', 'Playfair Display', 'Unbounded', 'Lato', 'Roboto'];
                                    const bodyFonts = ['Inter', 'Roboto', 'Open Sans', 'Lato'];
                                    onOptionsChange({
                                        ...options,
                                        poster: {
                                            ...options.poster,
                                            titleFont: titleFonts[Math.floor(Math.random() * titleFonts.length)] as any,
                                            bodyFont: bodyFonts[Math.floor(Math.random() * bodyFonts.length)] as any
                                        }
                                    });
                                }}
                                className="text-[10px] text-neutral-500 hover:text-white transition-colors flex items-center gap-1"
                            >
                                <span>🎲</span> Randomize
                            </button>
                            <button
                                onClick={() => onOptionsChange({
                                    ...options,
                                    poster: {
                                        ...options.poster,
                                        titleFont: 'Inter',
                                        bodyFont: 'Inter'
                                    }
                                })}
                                className="text-[10px] text-neutral-500 hover:text-white transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* Title Font */}
                    <div className="space-y-1">
                        <label className="text-[10px] text-neutral-500">Title Font</label>
                        <div className="relative">
                            <select
                                value={options.poster.titleFont || 'Inter'}
                                onChange={(e) => onOptionsChange({
                                    ...options,
                                    poster: { ...options.poster, titleFont: e.target.value as any }
                                })}
                                className="w-full bg-neutral-900 border border-neutral-800 text-white py-2 px-2 text-xs appearance-none focus:outline-none focus:border-neutral-600"
                            >
                                <option value="Inter">Inter</option>
                                <option value="Syne">Syne</option>
                                <option value="Playfair Display">Playfair Display</option>
                                <option value="Unbounded">Unbounded</option>
                                <option value="Lato">Lato</option>
                                <option value="Roboto">Roboto</option>
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 text-[10px]">▼</div>
                        </div>
                    </div>

                    {/* Body Font */}
                    <div className="space-y-1">
                        <label className="text-[10px] text-neutral-500">Body Font</label>
                        <div className="relative">
                            <select
                                value={options.poster.bodyFont || 'Inter'}
                                onChange={(e) => onOptionsChange({
                                    ...options,
                                    poster: { ...options.poster, bodyFont: e.target.value as any }
                                })}
                                className="w-full bg-neutral-900 border border-neutral-800 text-white py-2 px-2 text-xs appearance-none focus:outline-none focus:border-neutral-600"
                            >
                                <option value="Inter">Inter</option>
                                <option value="Roboto">Roboto</option>
                                <option value="Open Sans">Open Sans</option>
                                <option value="Lato">Lato</option>
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 text-[10px]">▼</div>
                        </div>
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

                    {/* Title Margin */}
                    <div className="space-y-1">
                        <label className="text-[10px] text-neutral-400 tracking-wider">Title Margin top</label>
                        <div className="grid grid-cols-3 gap-1">
                            {(['S', 'M', 'L'] as const).map((size) => (
                                <button
                                    key={size}
                                    onClick={() => onOptionsChange({
                                        ...options,
                                        poster: { ...options.poster, titleMargin: size }
                                    })}
                                    className={`py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] ${options.poster.titleMargin === size ? 'bg-neutral-800 text-white' : 'text-neutral-500'
                                        }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Subtitle Margin */}
                    <div className="space-y-1">
                        <label className="text-[10px] text-neutral-400 tracking-wider">Subtitle Margin top</label>
                        <div className="grid grid-cols-3 gap-1">
                            {(['S', 'M', 'L'] as const).map((size) => (
                                <button
                                    key={size}
                                    onClick={() => onOptionsChange({
                                        ...options,
                                        poster: { ...options.poster, subtitleMargin: size }
                                    })}
                                    className={`py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] ${options.poster.subtitleMargin === size ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="h-px bg-neutral-800 my-4" />

                {/* Image Alignment */}
                <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 tracking-wider block">Image alignment</label>
                    <div className="w-1/2">
                        <div className="grid grid-cols-3 gap-1 p-2 bg-neutral-900 border border-neutral-800 rounded">
                            {(['top', 'center', 'bottom'] as const).map((y) =>
                                (['left', 'center', 'right'] as const).map((x) => {
                                    const isActive = options.poster.imageAlignX === x && options.poster.imageAlignY === y;
                                    return (
                                        <button
                                            key={`${x}-${y}`}
                                            onClick={() => onOptionsChange({
                                                ...options,
                                                poster: {
                                                    ...options.poster,
                                                    imageAlignX: x,
                                                    imageAlignY: y
                                                }
                                            })}
                                            className={`w-full aspect-square rounded transition-colors ${isActive
                                                ? 'bg-white'
                                                : 'bg-neutral-700 hover:bg-neutral-600'
                                                }`}
                                            title={`${y} ${x}`}
                                        />
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Image Scale */}
                <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 tracking-wider">Image scale</label>
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

                {/* Image Rounded Corners */}
                <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 tracking-wider">Image Corner Radius</label>
                    <select
                        value={options.poster.imageRoundedCorners || 'none'}
                        onChange={(e) => onOptionsChange({
                            ...options,
                            poster: { ...options.poster, imageRoundedCorners: e.target.value as 'none' | 'S' | 'M' | 'L' }
                        })}
                        className="w-full bg-neutral-900 border border-neutral-800 text-white py-2 px-2 text-xs appearance-none uppercase focus:outline-none focus:border-neutral-600"
                    >
                        <option value="none">None</option>
                        <option value="S">Small (16px)</option>
                        <option value="M">Medium (40px)</option>
                        <option value="L">Large (64px)</option>
                    </select>
                </div>



                {/* Title Size */}
                <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 tracking-wider">Title size</label>
                    <div className="grid grid-cols-5 gap-1">
                        {[48, 56, 64, 72, 80, 96, 120].map((size) => (
                            <button
                                key={size}
                                onClick={() => onOptionsChange({
                                    ...options,
                                    poster: { ...options.poster, titleFontSize: size }
                                })}
                                className={`py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] ${options.poster.titleFontSize === size ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Subtitle Size */}
                <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 tracking-wider">Subtitle size</label>
                    <div className="grid grid-cols-5 gap-1">
                        {[16, 20, 24, 32, 40].map((size) => (
                            <button
                                key={size}
                                onClick={() => onOptionsChange({
                                    ...options,
                                    poster: { ...options.poster, subtitleFontSize: size }
                                })}
                                className={`py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] ${options.poster.subtitleFontSize === size ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer Layout */}
                <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 tracking-wider">Footer layout</label>
                    <div className="grid grid-cols-2 gap-1">
                        <button
                            onClick={() => onOptionsChange({
                                ...options,
                                poster: { ...options.poster, footerLayout: 'standard' }
                            })}
                            className={`py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] uppercase ${options.poster.footerLayout === 'standard' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                        >
                            Text / Year
                        </button>
                        <button
                            onClick={() => onOptionsChange({
                                ...options,
                                poster: { ...options.poster, footerLayout: 'reversed' }
                            })}
                            className={`py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] uppercase ${options.poster.footerLayout === 'reversed' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                        >
                            Year / Text
                        </button>
                    </div>
                </div>

                {/* Poster Sizes */}
                <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 tracking-wider block">Poster Sizes</label>
                    <div className="grid grid-cols-4 gap-1">
                        {(['A4', 'A3', 'A2', 'A1', 'A0', '18x24', '24x36', '27x40'] as const).map((size) => (
                            <button
                                key={size}
                                onClick={() => onOptionsChange({
                                    ...options,
                                    poster: { ...options.poster, aspectRatio: size }
                                })}
                                className={`py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] uppercase ${options.poster.aspectRatio === size ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Export Format */}
                <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 tracking-wider block">Export format</label>
                    <div className="grid grid-cols-2 gap-1">
                        <button
                            onClick={() => onOptionsChange({
                                ...options,
                                poster: { ...options.poster, exportFormat: 'png' }
                            })}
                            className={`py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] uppercase ${options.poster.exportFormat === 'png' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                        >
                            PNG
                        </button>
                        <button
                            onClick={() => onOptionsChange({
                                ...options,
                                poster: { ...options.poster, exportFormat: 'jpeg' }
                            })}
                            className={`py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] uppercase ${options.poster.exportFormat === 'jpeg' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                        >
                            JPEG
                        </button>
                    </div>
                </div>

                {/* Export Resolution */}
                <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 tracking-wider block">Export resolution</label>
                    <div className="grid grid-cols-2 gap-1">
                        <button
                            onClick={() => onOptionsChange({
                                ...options,
                                poster: { ...options.poster, resolution: 'high' }
                            })}
                            className={`py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] uppercase ${options.poster.resolution === 'high' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                        >
                            Hi-res (Print)
                        </button>
                        <button
                            onClick={() => onOptionsChange({
                                ...options,
                                poster: { ...options.poster, resolution: 'low' }
                            })}
                            className={`py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] uppercase ${options.poster.resolution === 'low' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                        >
                            Low-res (Web)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
