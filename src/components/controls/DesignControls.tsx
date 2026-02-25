import React from 'react';
import { DitherOptions } from '../../lib/dither';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface DesignControlsProps {
    options: DitherOptions;
    onOptionsChange: (options: DitherOptions) => void;
}

export const DesignControls: React.FC<DesignControlsProps> = ({ options, onOptionsChange }) => {

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-200">

            {options.designMode === 'poster' && (
                <>
                    {/* Text Fields */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] text-neutral-400 tracking-wider">Director</label>
                            <input
                                type="text"
                                value={options.poster.director}
                                onChange={(e) => onOptionsChange({
                                    ...options,
                                    poster: { ...options.poster, director: e.target.value }
                                })}
                                className="w-full bg-neutral-900 border border-neutral-800 text-white px-2 py-2 text-xs focus:outline-none focus:border-neutral-600"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] text-neutral-400 tracking-wider flex justify-between items-center">
                                <span>Title</span>
                                <div className="flex gap-1">
                                    {(['left', 'center', 'right'] as const).map((align) => (
                                        <button
                                            key={align}
                                            onClick={() => onOptionsChange({
                                                ...options,
                                                poster: { ...options.poster, titleAlignment: align }
                                            })}
                                            className={`p-1 rounded hover:bg-neutral-800 transition-colors ${options.poster.titleAlignment === align ? 'text-white bg-neutral-800' : 'text-neutral-500'}`}
                                            title={`Align ${align}`}
                                        >
                                            {align === 'left' && <AlignLeft className="w-3 h-3" />}
                                            {align === 'center' && <AlignCenter className="w-3 h-3" />}
                                            {align === 'right' && <AlignRight className="w-3 h-3" />}
                                        </button>
                                    ))}
                                </div>
                            </label>
                            <input
                                type="text"
                                value={options.poster.title}
                                onChange={(e) => onOptionsChange({
                                    ...options,
                                    poster: { ...options.poster, title: e.target.value }
                                })}
                                className="w-full bg-neutral-900 border border-neutral-800 text-white px-2 py-2 text-xs focus:outline-none focus:border-neutral-600"
                            />
                            <div className="mt-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-neutral-500">Title Size</label>
                                    <div className="flex gap-1 items-center">
                                        {[40, 48, 56, 64].map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => onOptionsChange({
                                                    ...options,
                                                    poster: { ...options.poster, titleFontSize: size }
                                                })}
                                                className={`flex-1 py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] ${options.poster.titleFontSize === size ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                        <input
                                            type="number"
                                            value={options.poster.titleFontSize}
                                            onChange={(e) => onOptionsChange({
                                                ...options,
                                                poster: { ...options.poster, titleFontSize: parseInt(e.target.value) || 48 }
                                            })}
                                            className="w-12 py-1 bg-neutral-900 border border-neutral-800 text-white text-[10px] text-center focus:outline-none focus:border-neutral-600 rounded"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] text-neutral-400 tracking-wider">Subtitle</label>
                            <input
                                type="text"
                                value={options.poster.subtitle}
                                onChange={(e) => onOptionsChange({
                                    ...options,
                                    poster: { ...options.poster, subtitle: e.target.value }
                                })}
                                className="w-full bg-neutral-900 border border-neutral-800 text-white px-2 py-2 text-xs focus:outline-none focus:border-neutral-600"
                            />
                            <div className="mt-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-neutral-500">Subtitle Size</label>
                                    <div className="flex gap-1 items-center">
                                        {[16, 24, 32, 40].map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => onOptionsChange({
                                                    ...options,
                                                    poster: { ...options.poster, subtitleFontSize: size }
                                                })}
                                                className={`flex-1 py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] ${options.poster.subtitleFontSize === size ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                        <input
                                            type="number"
                                            value={options.poster.subtitleFontSize}
                                            onChange={(e) => onOptionsChange({
                                                ...options,
                                                poster: { ...options.poster, subtitleFontSize: parseInt(e.target.value) || 16 }
                                            })}
                                            className="w-12 py-1 bg-neutral-900 border border-neutral-800 text-white text-[10px] text-center focus:outline-none focus:border-neutral-600 rounded"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1 mt-2">
                                    <label className="text-[10px] text-neutral-500">Gap to Title</label>
                                    <div className="flex gap-1 items-center">
                                        {[8, 16, 24].map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => onOptionsChange({
                                                    ...options,
                                                    poster: { ...options.poster, subtitleMargin: size }
                                                })}
                                                className={`flex-1 py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] ${options.poster.subtitleMargin === size ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                        <input
                                            type="number"
                                            value={options.poster.subtitleMargin}
                                            onChange={(e) => onOptionsChange({
                                                ...options,
                                                poster: { ...options.poster, subtitleMargin: parseInt(e.target.value) || 16 }
                                            })}
                                            className="w-12 py-1 bg-neutral-900 border border-neutral-800 text-white text-[10px] text-center focus:outline-none focus:border-neutral-600 rounded"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] text-neutral-400 tracking-wider">Year</label>
                            <input
                                type="text"
                                value={options.poster.year}
                                onChange={(e) => onOptionsChange({
                                    ...options,
                                    poster: { ...options.poster, year: e.target.value }
                                })}
                                className="w-full bg-neutral-900 border border-neutral-800 text-white px-2 py-2 text-xs focus:outline-none focus:border-neutral-600"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] text-neutral-400 tracking-wider">Description</label>
                            <textarea
                                value={options.poster.description[0] || ''}
                                onChange={(e) => {
                                    const newDesc = [e.target.value];
                                    onOptionsChange({
                                        ...options,
                                        poster: { ...options.poster, description: newDesc, descriptionColumns: 1 }
                                    });
                                }}
                                rows={3}
                                placeholder="Description..."
                                className="w-full bg-neutral-900 border border-neutral-800 text-white px-2 py-2 text-xs focus:outline-none focus:border-neutral-600 resize-none"
                            />
                        </div>

                        {/* List Content */}
                        <div className="space-y-2 pt-4 border-t border-neutral-800">
                            <label className="text-[10px] text-neutral-400 tracking-wider flex justify-between items-center">
                                <span>List Content</span>
                                <div className="flex gap-2 items-center">
                                    {/* Columns Selector */}
                                    <div className="flex items-center gap-1 bg-neutral-900 rounded border border-neutral-800 px-1 h-6">
                                        <span className="text-[8px] text-neutral-500 uppercase">Cols</span>
                                        <select
                                            value={options.poster.listSection.columns || 1}
                                            onChange={(e) => onOptionsChange({
                                                ...options,
                                                poster: {
                                                    ...options.poster,
                                                    listSection: { ...options.poster.listSection, columns: Number(e.target.value) as 1 | 2 | 3 | 4 }
                                                }
                                            })}
                                            className="bg-transparent text-white text-[10px] focus:outline-none appearance-none cursor-pointer w-4 text-center"
                                        >
                                            <option value={1}>1</option>
                                            <option value={2}>2</option>
                                            <option value={3}>3</option>
                                            <option value={4}>4</option>
                                        </select>
                                    </div>

                                    <div className="flex gap-1">
                                        {(['left', 'center', 'right'] as const).map((align) => (
                                            <button
                                                key={align}
                                                onClick={() => onOptionsChange({
                                                    ...options,
                                                    poster: {
                                                        ...options.poster,
                                                        listSection: { ...options.poster.listSection, alignment: align }
                                                    }
                                                })}
                                                className={`p-1 rounded hover:bg-neutral-800 transition-colors ${options.poster.listSection.alignment === align ? 'text-white bg-neutral-800' : 'text-neutral-500'}`}
                                                title={`Align ${align}`}
                                            >
                                                {align === 'left' && <AlignLeft className="w-3 h-3" />}
                                                {align === 'center' && <AlignCenter className="w-3 h-3" />}
                                                {align === 'right' && <AlignRight className="w-3 h-3" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </label>
                            <textarea
                                value={options.poster.listSection.content.join('\n')}
                                onChange={(e) => onOptionsChange({
                                    ...options,
                                    poster: {
                                        ...options.poster,
                                        listSection: {
                                            ...options.poster.listSection,
                                            content: e.target.value.split('\n')
                                        }
                                    }
                                })}
                                rows={5}
                                placeholder="Enter items (one per line)..."
                                className="w-full bg-neutral-900 border border-neutral-800 text-white px-2 py-2 text-xs focus:outline-none focus:border-neutral-600 resize-none font-mono"
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
