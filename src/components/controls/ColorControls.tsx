import React from 'react';
import { DitherOptions } from '../../lib/dither';

interface ColorControlsProps {
    options: DitherOptions;
    onOptionsChange: (options: DitherOptions) => void;
}

export const ColorControls: React.FC<ColorControlsProps> = ({ options, onOptionsChange }) => {

    const handleThemeChange = (theme: 'light' | 'dark') => {
        const isDark = theme === 'dark';
        onOptionsChange({
            ...options,
            theme,
            poster: {
                ...options.poster,
                paperColor: isDark ? '#1A1A1A' : '#F3F3F3',
                textColor: isDark ? '#F3F3F3' : '#000000',
                titleColor: isDark ? '#F3F3F3' : '#000000',
                subtitleColor: isDark ? '#F3F3F3' : '#000000',
                directorTextColor: isDark ? '#999999' : '#000000',
                listColor: isDark ? '#F3F3F3' : '#000000',
                descriptionColor: isDark ? '#F3F3F3' : '#000000',
                yearColor: isDark ? '#F3F3F3' : '#000000',
            }
        });
    };

    const handleResetColors = () => {
        const isDark = options.theme === 'dark';
        onOptionsChange({
            ...options,
            poster: {
                ...options.poster,
                paperColor: isDark ? '#1A1A1A' : '#F3F3F3',
                textColor: isDark ? '#F3F3F3' : '#000000',
                titleColor: isDark ? '#F3F3F3' : '#000000',
                subtitleColor: isDark ? '#F3F3F3' : '#000000',
                directorTextColor: isDark ? '#999999' : '#000000',
                listColor: isDark ? '#F3F3F3' : '#000000',
                descriptionColor: isDark ? '#F3F3F3' : '#000000',
                yearColor: isDark ? '#F3F3F3' : '#000000',
                imageBackgroundColor: 'none'
            }
        });
    };

    const renderColorPicker = (label: string, value: string, onChange: (val: string) => void) => (
        <div className="space-y-1">
            <label className="text-[10px] text-neutral-400 tracking-wider block">{label}</label>
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-8 h-8 bg-transparent cursor-pointer border-none p-0"
                />
                <span className="text-[10px] text-neutral-500 uppercase">{value}</span>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-200">
            {/* Theme Selector */}
            <div className="space-y-2">
                <label className="text-[10px] text-neutral-400 tracking-wider font-bold">Theme</label>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => handleThemeChange('light')}
                        className={`py-2 border border-neutral-800 hover:border-neutral-600 transition-colors uppercase text-[10px] ${options.theme === 'light' ? 'bg-neutral-800 text-white' : 'text-neutral-400'}`}
                    >
                        Light
                    </button>
                    <button
                        onClick={() => handleThemeChange('dark')}
                        className={`py-2 border border-neutral-800 hover:border-neutral-600 transition-colors uppercase text-[10px] ${options.theme === 'dark' ? 'bg-neutral-800 text-white' : 'text-neutral-400'}`}
                    >
                        Dark
                    </button>
                </div>
            </div>

            {/* Paper Color Presets */}
            <div className="space-y-2">
                <label className="text-[10px] text-neutral-400 tracking-wider font-bold">Paper Color Presets</label>
                <div className="grid grid-cols-3 gap-2">
                    <button
                        onClick={() => onOptionsChange({
                            ...options,
                            poster: { ...options.poster, paperColor: '#F3F3F3' }
                        })}
                        className="group relative py-2 border border-neutral-800 hover:border-neutral-600 transition-colors"
                        style={{ backgroundColor: '#F3F3F3' }}
                    >
                        <span className="text-[10px] text-neutral-800 uppercase">Light</span>
                    </button>
                    <button
                        onClick={() => onOptionsChange({
                            ...options,
                            poster: { ...options.poster, paperColor: '#1A1A1A' }
                        })}
                        className="group relative py-2 border border-neutral-800 hover:border-neutral-600 transition-colors"
                        style={{ backgroundColor: '#1A1A1A' }}
                    >
                        <span className="text-[10px] text-neutral-200 uppercase">Dark</span>
                    </button>
                    <button
                        onClick={() => onOptionsChange({
                            ...options,
                            poster: { ...options.poster, paperColor: '#f5f4e1' }
                        })}
                        className="group relative py-2 border border-neutral-800 hover:border-neutral-600 transition-colors"
                        style={{ backgroundColor: '#f5f4e1' }}
                    >
                        <span className="text-[10px] text-neutral-800 uppercase">Vintage</span>
                    </button>
                </div>
            </div>

            {/* Poster Colors */}
            <div className="space-y-4">
                <label className="text-[10px] text-neutral-400 tracking-wider font-bold">Poster Colors</label>

                <div className="grid grid-cols-2 gap-4">
                    {renderColorPicker('Paper', options.poster.paperColor, (val) => onOptionsChange({ ...options, poster: { ...options.poster, paperColor: val } }))}
                    {renderColorPicker('Body Text', options.poster.textColor, (val) => onOptionsChange({ ...options, poster: { ...options.poster, textColor: val } }))}
                    {renderColorPicker('Title', options.poster.titleColor || options.poster.textColor, (val) => onOptionsChange({ ...options, poster: { ...options.poster, titleColor: val } }))}
                    {renderColorPicker('Subtitle', options.poster.subtitleColor || options.poster.textColor, (val) => onOptionsChange({ ...options, poster: { ...options.poster, subtitleColor: val } }))}
                    {renderColorPicker('Director', options.poster.directorTextColor, (val) => onOptionsChange({ ...options, poster: { ...options.poster, directorTextColor: val } }))}
                    {renderColorPicker('List', options.poster.listColor || options.poster.textColor, (val) => onOptionsChange({ ...options, poster: { ...options.poster, listColor: val } }))}
                    {renderColorPicker('Description', options.poster.descriptionColor || options.poster.textColor, (val) => onOptionsChange({ ...options, poster: { ...options.poster, descriptionColor: val } }))}
                    {renderColorPicker('Year', options.poster.yearColor || options.poster.textColor, (val) => onOptionsChange({ ...options, poster: { ...options.poster, yearColor: val } }))}
                    {renderColorPicker('Icon', options.poster.iconSection.iconColor, (val) => onOptionsChange({ ...options, poster: { ...options.poster, iconSection: { ...options.poster.iconSection, iconColor: val } } }))}
                    {renderColorPicker('Icon Text', options.poster.iconSection.textColor, (val) => onOptionsChange({ ...options, poster: { ...options.poster, iconSection: { ...options.poster.iconSection, textColor: val } } }))}
                </div>

                {/* Image Background */}
                <div className="space-y-1 pt-2 border-t border-neutral-800">
                    <label className="text-[10px] text-neutral-400 tracking-wider block">Image background</label>
                    <div className="grid grid-cols-3 gap-1">
                        <button
                            onClick={() => onOptionsChange({
                                ...options,
                                poster: { ...options.poster, imageBackgroundColor: 'none' }
                            })}
                            className={`py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] uppercase ${options.poster.imageBackgroundColor === 'none' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                        >
                            None
                        </button>
                        <button
                            onClick={() => onOptionsChange({
                                ...options,
                                poster: { ...options.poster, imageBackgroundColor: '#e0ded2' }
                            })}
                            className={`py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] uppercase ${options.poster.imageBackgroundColor === '#e0ded2' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                        >
                            Preset
                        </button>
                        <button
                            onClick={() => {
                                if (options.poster.imageBackgroundColor === 'none' || options.poster.imageBackgroundColor === '#e0ded2') {
                                    onOptionsChange({
                                        ...options,
                                        poster: { ...options.poster, imageBackgroundColor: '#ffffff' }
                                    });
                                }
                            }}
                            className={`py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] uppercase ${options.poster.imageBackgroundColor !== 'none' && options.poster.imageBackgroundColor !== '#e0ded2' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                        >
                            Custom
                        </button>
                    </div>
                    {options.poster.imageBackgroundColor !== 'none' && options.poster.imageBackgroundColor !== '#e0ded2' && (
                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="color"
                                value={options.poster.imageBackgroundColor}
                                onChange={(e) => onOptionsChange({
                                    ...options,
                                    poster: { ...options.poster, imageBackgroundColor: e.target.value }
                                })}
                                className="w-8 h-8 bg-transparent cursor-pointer border-none p-0"
                            />
                            <span className="text-[10px] text-neutral-500 uppercase">{options.poster.imageBackgroundColor}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Reset Button */}
            <button
                onClick={handleResetColors}
                className="w-full py-2 border border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-white transition-colors uppercase text-[10px]"
            >
                Reset to Default
            </button>
        </div>
    );
};
