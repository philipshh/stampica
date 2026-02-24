import React, { useState, useEffect } from 'react';
import { DitherOptions, DitherAlgorithm, ColorPreset } from '../../lib/dither';
import { generateRandomPalette } from '../../lib/colorUtils';
import { Trash2, Save } from 'lucide-react';

interface AdjustmentControlsProps {
    options: DitherOptions;
    onOptionsChange: (options: DitherOptions) => void;
}

// These global declarations will be replaced by local ones inside the component
// const pixelSizes = [1, 2, 3, 4, 5, 6, 8];
// const colorModes = ['monochrome', 'duotone', 'tritone'];

export const AdjustmentControls: React.FC<AdjustmentControlsProps> = ({ options, onOptionsChange }) => {
    const [presets, setPresets] = useState<ColorPreset[]>([]);

    useEffect(() => {
        const savedPresets = localStorage.getItem('ditherColorPresets');
        if (savedPresets) {
            setPresets(JSON.parse(savedPresets));
        }
    }, []);

    const pixelSizes = [1, 2, 4, 8, 16, 32, 64];
    const colorModes = ['monochrome', 'duotone', 'tritone', 'quadtone', 'rgb'];

    const updateOption = <K extends keyof DitherOptions>(key: K, value: DitherOptions[K]) => {
        onOptionsChange({ ...options, [key]: value });
    };

    const savePreset = () => {
        if (options.colorMode !== 'duotone' && options.colorMode !== 'tritone' && options.colorMode !== 'quadtone') return;

        const name = prompt('Enter preset name:');
        if (!name) return;

        const getColors = () => {
            if (options.colorMode === 'duotone') return options.duotoneColors;
            if (options.colorMode === 'tritone') return options.tritoneColors;
            return options.quadtoneColors;
        };

        const newPreset: ColorPreset = {
            id: Date.now().toString(),
            name,
            mode: options.colorMode,
            colors: getColors(),
            timestamp: Date.now()
        };

        const updatedPresets = [...presets, newPreset];
        setPresets(updatedPresets);
        localStorage.setItem('ditherColorPresets', JSON.stringify(updatedPresets));
    };

    const loadPreset = (preset: ColorPreset) => {
        if (preset.mode === 'duotone') {
            onOptionsChange({
                ...options,
                colorMode: 'duotone',
                duotoneColors: preset.colors as { color1: string; color2: string }
            });
        } else if (preset.mode === 'tritone') {
            onOptionsChange({
                ...options,
                colorMode: 'tritone',
                tritoneColors: preset.colors as { color1: string; color2: string; color3: string }
            });
        } else {
            onOptionsChange({
                ...options,
                colorMode: 'quadtone',
                quadtoneColors: preset.colors as { color1: string; color2: string; color3: string; color4: string }
            });
        }
    };

    const deletePreset = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updatedPresets = presets.filter(p => p.id !== id);
        setPresets(updatedPresets);
        localStorage.setItem('ditherColorPresets', JSON.stringify(updatedPresets));
    };

    const handleRandomizeColors = () => {
        if (options.colorMode === 'duotone') {
            const colors = generateRandomPalette('duotone') as { color1: string; color2: string };
            updateOption('duotoneColors', colors);
        } else if (options.colorMode === 'tritone') {
            const colors = generateRandomPalette('tritone') as { color1: string; color2: string; color3: string };
            updateOption('tritoneColors', colors);
        } else if (options.colorMode === 'quadtone') {
            const colors = generateRandomPalette('quadtone') as { color1: string; color2: string; color3: string; color4: string };
            updateOption('quadtoneColors', colors);
        }
    };

    const handleResetColors = () => {
        if (options.colorMode === 'duotone') {
            updateOption('duotoneColors', { color1: '#121212', color2: '#ff6b35' });
        } else if (options.colorMode === 'tritone') {
            updateOption('tritoneColors', { color1: '#121212', color2: '#ffff00', color3: '#0000ff' });
        } else if (options.colorMode === 'quadtone') {
            updateOption('quadtoneColors', { color1: '#121212', color2: '#ff6b35', color3: '#ffff00', color4: '#0000ff' });
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-200">
            {/* Algorithm Section */}
            <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 tracking-wider">Algorithm</label>
                <div className="relative">
                    <select
                        value={options.algorithm}
                        onChange={(e) => updateOption('algorithm', e.target.value as DitherAlgorithm)}
                        className="w-full bg-neutral-900 border border-neutral-800 text-white py-2 px-2 text-xs appearance-none uppercase focus:outline-none focus:border-neutral-600"
                    >
                        <option value="none">None</option>
                        <option value="atkinson">Atkinson</option>
                        <option value="stucki">Stucki</option>
                        <option value="threshold">Threshold</option>
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 text-[10px]">▼</div>
                </div>
            </div>

            {/* Threshold Slider - Only for Threshold algorithm */}
            {options.algorithm === 'threshold' && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex justify-between text-[10px] text-neutral-400 tracking-wider">
                        <label>Threshold</label>
                        <span className="text-neutral-500">{options.threshold}</span>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={255}
                        step={1}
                        value={options.threshold}
                        onChange={(e) => updateOption('threshold', Number(e.target.value))}
                        className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white block"
                    />
                </div>
            )}

            {/* Pixel Size */}
            <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 tracking-wider">Pixel size</label>
                <div className="grid grid-cols-7 gap-1">
                    {pixelSizes.map((size) => (
                        <button
                            key={size}
                            onClick={() => updateOption('pixelSize', size)}
                            className={`py-1 border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] ${options.pixelSize === size ? 'bg-neutral-800 text-white' : 'text-neutral-500'
                                }`}
                        >
                            {size}
                        </button>
                    ))}
                </div>
            </div>

            {/* Color Mode */}
            <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 tracking-wider">Color mode</label>
                <div className="relative">
                    <select
                        value={options.colorMode}
                        onChange={(e) => updateOption('colorMode', e.target.value as any)}
                        className="w-full bg-neutral-900 border border-neutral-800 text-white py-2 px-2 text-xs appearance-none uppercase focus:outline-none focus:border-neutral-600"
                    >
                        {colorModes.map((mode) => (
                            <option key={mode} value={mode}>
                                {mode}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 text-[10px]">▼</div>
                </div>
            </div>

            {/* Dither Palette Colors */}
            {(options.colorMode === 'duotone' || options.colorMode === 'tritone' || options.colorMode === 'quadtone') && (
                <div className="space-y-4 pt-2 border-t border-neutral-800">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] text-neutral-400 tracking-wider">Dither Palette</label>
                        <div className="flex gap-2">
                            <button
                                onClick={handleRandomizeColors}
                                className="text-[10px] text-neutral-500 hover:text-white transition-colors flex items-center gap-1"
                            >
                                <span>🎲</span> Randomize
                            </button>
                            <button
                                onClick={savePreset}
                                className="text-[10px] text-neutral-500 hover:text-white transition-colors flex items-center gap-1"
                            >
                                <Save className="w-3 h-3" /> Save
                            </button>
                        </div>
                    </div>

                    {options.colorMode === 'duotone' && (
                        <div className="space-y-2">
                            {/* Color 1 */}
                            <div className="space-y-1">
                                <label className="text-[10px] text-neutral-500">Color 1</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={options.duotoneColors.color1}
                                        onChange={(e) => updateOption('duotoneColors', { ...options.duotoneColors, color1: e.target.value })}
                                        className="w-8 h-8 bg-transparent border-0 p-0 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={options.duotoneColors.color1}
                                        onChange={(e) => updateOption('duotoneColors', { ...options.duotoneColors, color1: e.target.value })}
                                        className="flex-1 bg-neutral-900 border border-neutral-800 text-white px-2 text-xs font-mono uppercase focus:outline-none focus:border-neutral-600"
                                    />
                                </div>
                            </div>
                            {/* Color 2 */}
                            <div className="space-y-1">
                                <label className="text-[10px] text-neutral-500">Color 2</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={options.duotoneColors.color2}
                                        onChange={(e) => updateOption('duotoneColors', { ...options.duotoneColors, color2: e.target.value })}
                                        className="w-8 h-8 bg-transparent border-0 p-0 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={options.duotoneColors.color2}
                                        onChange={(e) => updateOption('duotoneColors', { ...options.duotoneColors, color2: e.target.value })}
                                        className="flex-1 bg-neutral-900 border border-neutral-800 text-white px-2 text-xs font-mono uppercase focus:outline-none focus:border-neutral-600"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {options.colorMode === 'tritone' && (
                        <div className="space-y-2">
                            {/* Color 1 */}
                            <div className="space-y-1">
                                <label className="text-[10px] text-neutral-500">Color 1</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={options.tritoneColors.color1}
                                        onChange={(e) => updateOption('tritoneColors', { ...options.tritoneColors, color1: e.target.value })}
                                        className="w-8 h-8 bg-transparent border-0 p-0 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={options.tritoneColors.color1}
                                        onChange={(e) => updateOption('tritoneColors', { ...options.tritoneColors, color1: e.target.value })}
                                        className="flex-1 bg-neutral-900 border border-neutral-800 text-white px-2 text-xs font-mono uppercase focus:outline-none focus:border-neutral-600"
                                    />
                                </div>
                            </div>
                            {/* Color 2 */}
                            <div className="space-y-1">
                                <label className="text-[10px] text-neutral-500">Color 2</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={options.tritoneColors.color2}
                                        onChange={(e) => updateOption('tritoneColors', { ...options.tritoneColors, color2: e.target.value })}
                                        className="w-8 h-8 bg-transparent border-0 p-0 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={options.tritoneColors.color2}
                                        onChange={(e) => updateOption('tritoneColors', { ...options.tritoneColors, color2: e.target.value })}
                                        className="flex-1 bg-neutral-900 border border-neutral-800 text-white px-2 text-xs font-mono uppercase focus:outline-none focus:border-neutral-600"
                                    />
                                </div>
                            </div>
                            {/* Color 3 */}
                            <div className="space-y-1">
                                <label className="text-[10px] text-neutral-500">Color 3</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={options.tritoneColors.color3}
                                        onChange={(e) => updateOption('tritoneColors', { ...options.tritoneColors, color3: e.target.value })}
                                        className="w-8 h-8 bg-transparent border-0 p-0 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={options.tritoneColors.color3}
                                        onChange={(e) => updateOption('tritoneColors', { ...options.tritoneColors, color3: e.target.value })}
                                        className="flex-1 bg-neutral-900 border border-neutral-800 text-white px-2 text-xs font-mono uppercase focus:outline-none focus:border-neutral-600"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quadtone Colors */}
                    {options.colorMode === 'quadtone' && (
                        <div className="space-y-2">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={options.quadtoneColors.color1}
                                        onChange={(e) => updateOption('quadtoneColors', { ...options.quadtoneColors, color1: e.target.value })}
                                        className="w-8 h-8 bg-transparent cursor-pointer border-none p-0"
                                    />
                                    <input
                                        type="text"
                                        value={options.quadtoneColors.color1}
                                        onChange={(e) => updateOption('quadtoneColors', { ...options.quadtoneColors, color1: e.target.value })}
                                        className="flex-1 bg-neutral-900 border border-neutral-800 text-white px-2 text-xs font-mono uppercase focus:outline-none focus:border-neutral-600"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={options.quadtoneColors.color2}
                                        onChange={(e) => updateOption('quadtoneColors', { ...options.quadtoneColors, color2: e.target.value })}
                                        className="w-8 h-8 bg-transparent cursor-pointer border-none p-0"
                                    />
                                    <input
                                        type="text"
                                        value={options.quadtoneColors.color2}
                                        onChange={(e) => updateOption('quadtoneColors', { ...options.quadtoneColors, color2: e.target.value })}
                                        className="flex-1 bg-neutral-900 border border-neutral-800 text-white px-2 text-xs font-mono uppercase focus:outline-none focus:border-neutral-600"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={options.quadtoneColors.color3}
                                        onChange={(e) => updateOption('quadtoneColors', { ...options.quadtoneColors, color3: e.target.value })}
                                        className="w-8 h-8 bg-transparent cursor-pointer border-none p-0"
                                    />
                                    <input
                                        type="text"
                                        value={options.quadtoneColors.color3}
                                        onChange={(e) => updateOption('quadtoneColors', { ...options.quadtoneColors, color3: e.target.value })}
                                        className="flex-1 bg-neutral-900 border border-neutral-800 text-white px-2 text-xs font-mono uppercase focus:outline-none focus:border-neutral-600"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={options.quadtoneColors.color4}
                                        onChange={(e) => updateOption('quadtoneColors', { ...options.quadtoneColors, color4: e.target.value })}
                                        className="w-8 h-8 bg-transparent cursor-pointer border-none p-0"
                                    />
                                    <input
                                        type="text"
                                        value={options.quadtoneColors.color4}
                                        onChange={(e) => updateOption('quadtoneColors', { ...options.quadtoneColors, color4: e.target.value })}
                                        className="flex-1 bg-neutral-900 border border-neutral-800 text-white px-2 text-xs font-mono uppercase focus:outline-none focus:border-neutral-600"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Presets List */}
                    {presets.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-neutral-800">
                            <label className="text-[10px] text-neutral-400 tracking-wider">Saved Presets</label>
                            <div className="grid grid-cols-2 gap-2">
                                {presets.filter(p => p.mode === options.colorMode).map((preset) => (
                                    <button
                                        key={preset.id}
                                        onClick={() => loadPreset(preset)}
                                        className="group relative p-2 bg-neutral-900 border border-neutral-800 rounded hover:border-neutral-600 transition-all text-left"
                                    >
                                        <div className="flex gap-1 mb-1">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.colors.color1 }} />
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.colors.color2 }} />
                                            {preset.colors.color3 && (
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.colors.color3 }} />
                                            )}
                                        </div>
                                        <div className="text-[10px] text-neutral-400 truncate pr-4">{preset.name}</div>
                                        <div
                                            onClick={(e) => deletePreset(preset.id, e)}
                                            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Reset Colors Button */}
                    <button
                        onClick={handleResetColors}
                        className="w-full py-2 border border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-white transition-colors uppercase text-[10px]"
                    >
                        Reset Colors
                    </button>
                </div>
            )}



            {/* Effects Section */}
            <div className="space-y-4 pt-2 border-t border-neutral-800">
                <div className="space-y-4">
                    {[
                        { label: 'Brightness', key: 'brightness', min: -100, max: 100, step: 1 },
                        { label: 'Contrast', key: 'contrast', min: -100, max: 100, step: 1 },
                        { label: 'Gamma', key: 'gamma', min: 0.1, max: 3, step: 0.1 },
                    ].map((control) => (
                        <div key={control.key} className="space-y-1">
                            <div className="flex justify-between text-[10px] text-neutral-400 tracking-wider">
                                <label>{control.label}</label>
                                <span className="text-neutral-500">
                                    {typeof options[control.key as keyof DitherOptions] === 'number'
                                        ? (options[control.key as keyof DitherOptions] as number)
                                        : ''}
                                </span>
                            </div>
                            <input
                                type="range"
                                min={control.min}
                                max={control.max}
                                step={control.step}
                                value={options[control.key as keyof DitherOptions] as number}
                                onChange={(e) => updateOption(control.key as keyof DitherOptions, Number(e.target.value))}
                                className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white block"
                            />
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => updateOption('invert', !options.invert)}
                        className={`py-2 border border-neutral-800 hover:border-neutral-600 transition-colors uppercase text-[10px] ${options.invert ? 'bg-neutral-800 text-white' : 'text-neutral-400'}`}
                    >
                        Invert
                    </button>
                    <button
                        onClick={() => onOptionsChange({
                            ...options,
                            brightness: 0,
                            contrast: 0,
                            gamma: 1,
                            invert: false
                        })}
                        className="py-2 border border-neutral-800 text-neutral-400 hover:border-neutral-600 transition-colors uppercase text-[10px]"
                    >
                        Reset Effects
                    </button>
                </div>
            </div>

            {/* Paper Texture Section */}
            <div className="space-y-4 pt-4 border-t border-neutral-800">
                <label className="text-[10px] text-neutral-400 tracking-wider">Paper Texture</label>

                {/* Texture Selector */}
                <div className="space-y-1">
                    <label className="text-[10px] text-neutral-500">Texture Type</label>
                    <div className="relative">
                        <select
                            value={options.paperTexture}
                            onChange={(e) => updateOption('paperTexture', e.target.value as any)}
                            className="w-full bg-neutral-900 border border-neutral-800 text-white py-2 px-2 text-xs appearance-none uppercase focus:outline-none focus:border-neutral-600"
                        >
                            <option value="none">None</option>
                            <option value="texture-1">Crumpled Paper</option>
                            <option value="texture-2">Speckled Paper</option>
                            <option value="texture-3">Smooth Paper</option>
                            <option value="folded">Folded Paper</option>
                            <option value="glue">Glued Paper</option>
                            <option value="photocopy">Photocopy</option>
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 text-[10px]">▼</div>
                    </div>
                </div>

                {/* Opacity Slider - only show when texture is selected */}
                {options.paperTexture !== 'none' && (
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-neutral-400 tracking-wider">
                            <label>Opacity</label>
                            <span className="text-neutral-500">{options.paperTextureOpacity}%</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            value={options.paperTextureOpacity}
                            onChange={(e) => updateOption('paperTextureOpacity', Number(e.target.value))}
                            className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white block"
                        />
                    </div>
                )}
            </div>


        </div>
    );
};
