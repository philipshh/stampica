import React, { useState, useEffect } from 'react';
import { DitherOptions, ColorPreset } from '../../lib/dither';
import { generateRandomPalette } from '../../lib/colorUtils';
import { Save, Minus, Plus } from 'lucide-react';

interface AdjustmentControlsProps {
    options: DitherOptions;
    onOptionsChange: (options: DitherOptions) => void;
}

const SliderField: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (val: number) => void;
    suffix?: string;
}> = ({ label, value, min, max, step, onChange, suffix = '' }) => {
    const handleMinus = () => onChange(Math.max(min, value - step));
    const handlePlus = () => onChange(Math.min(max, value + step));

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-neutral-400 tracking-wider">
                <label>{label}</label>
                <span className="text-neutral-500 font-mono">{Math.round(value * 100) / 100}{suffix}</span>
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={handleMinus}
                    className="w-5 h-5 rounded-full border border-neutral-800 flex items-center justify-center text-neutral-500 hover:text-white hover:border-neutral-600 transition-colors"
                >
                    <Minus className="w-3 h-3" />
                </button>
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="flex-1 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
                />
                <button
                    onClick={handlePlus}
                    className="w-5 h-5 rounded-full border border-neutral-800 flex items-center justify-center text-neutral-500 hover:text-white hover:border-neutral-600 transition-colors"
                >
                    <Plus className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
};

export const AdjustmentControls: React.FC<AdjustmentControlsProps> = ({ options, onOptionsChange }) => {
    const [presets, setPresets] = useState<ColorPreset[]>([]);

    useEffect(() => {
        const savedPresets = localStorage.getItem('ditherColorPresets');
        if (savedPresets) {
            setPresets(JSON.parse(savedPresets));
        }
    }, []);

    const updateOption = <K extends keyof DitherOptions>(key: K, value: DitherOptions[K]) => {
        onOptionsChange({ ...options, [key]: value });
    };

    const savePreset = () => {
        if (options.colorMode === 'rgb' || options.colorMode === 'monochrome') return;

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
            mode: options.colorMode as any,
            colors: getColors() as any,
            timestamp: Date.now()
        };

        const updatedPresets = [...presets, newPreset];
        setPresets(updatedPresets);
        localStorage.setItem('ditherColorPresets', JSON.stringify(updatedPresets));
    };

    const handleRandomizeColors = () => {
        if (options.colorMode === 'duotone') {
            updateOption('duotoneColors', generateRandomPalette('duotone') as any);
        } else if (options.colorMode === 'tritone') {
            updateOption('tritoneColors', generateRandomPalette('tritone') as any);
        } else if (options.colorMode === 'quadtone') {
            updateOption('quadtoneColors', generateRandomPalette('quadtone') as any);
        }
    };

    const handleResetColors = () => {
        if (options.colorMode === 'duotone') {
            updateOption('duotoneColors', { color1: '#121212', color2: '#ff4400' });
        } else if (options.colorMode === 'tritone') {
            updateOption('tritoneColors', { color1: '#121212', color2: '#ff4400', color3: '#4848f9' });
        } else if (options.colorMode === 'quadtone') {
            updateOption('quadtoneColors', { color1: '#121212', color2: '#ff4400', color3: '#ffffff', color4: '#4848f9' });
        }
    };

    const colorModes = [
        { id: 'monochrome', label: 'Mono' },
        { id: 'duotone', label: 'Duo' },
        { id: 'tritone', label: 'Trio' },
        { id: 'quadtone', label: 'Quad' },
        { id: 'rgb', label: 'RGB' }
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-200">
            {/* Dither Algorithm Selection */}
            <div className="space-y-2">
                <label className="text-[10px] text-neutral-400 tracking-wider uppercase">Algorithm</label>
                <div className="grid grid-cols-3 gap-1">
                    {(['none', 'atkinson', 'threshold'] as const).map((algo) => (
                        <button
                            key={algo}
                            onClick={() => updateOption('algorithm', algo)}
                            className={`py-2 text-[10px] border transition-all uppercase ${options.algorithm === algo
                                ? 'bg-white text-black border-white'
                                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-600'
                                }`}
                        >
                            {algo}
                        </button>
                    ))}
                </div>
            </div>

            {/* Color Mode Selection */}
            <div className="space-y-2">
                <label className="text-[10px] text-neutral-400 tracking-wider uppercase">Color mode</label>
                <div className="grid grid-cols-5 gap-1">
                    {colorModes.map((mode) => (
                        <button
                            key={mode.id}
                            onClick={() => updateOption('colorMode', mode.id as any)}
                            className={`py-2 text-[10px] border transition-all uppercase ${options.colorMode === mode.id
                                ? 'bg-white text-black border-white'
                                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-600'
                                }`}
                        >
                            {mode.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Dither Palette Section - Moved right below color mode */}
            {(options.colorMode === 'duotone' || options.colorMode === 'tritone' || options.colorMode === 'quadtone') && (
                <div className="space-y-4 pt-2 border-t border-neutral-800">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] text-neutral-400 tracking-wider">PALETTE</label>
                        <div className="flex gap-2">
                            <button
                                onClick={handleRandomizeColors}
                                className="text-[10px] text-neutral-500 hover:text-white transition-colors"
                                title="Randomize Colors"
                            >
                                🎲
                            </button>
                            <button
                                onClick={savePreset}
                                className="text-neutral-500 hover:text-white transition-colors"
                                title="Save Preset"
                            >
                                <Save className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    {/* Compact Color Grid */}
                    <div className="grid grid-cols-4 gap-2">
                        {options.colorMode === 'duotone' && (
                            <>
                                <input
                                    type="color"
                                    value={options.duotoneColors.color1}
                                    onChange={(e) => updateOption('duotoneColors', { ...options.duotoneColors, color1: e.target.value })}
                                    className="w-full h-8 bg-transparent cursor-pointer border-none p-0"
                                />
                                <input
                                    type="color"
                                    value={options.duotoneColors.color2}
                                    onChange={(e) => updateOption('duotoneColors', { ...options.duotoneColors, color2: e.target.value })}
                                    className="w-full h-8 bg-transparent cursor-pointer border-none p-0"
                                />
                            </>
                        )}
                        {options.colorMode === 'tritone' && (
                            <>
                                <input
                                    type="color"
                                    value={options.tritoneColors.color1}
                                    onChange={(e) => updateOption('tritoneColors', { ...options.tritoneColors, color1: e.target.value })}
                                    className="w-full h-8 bg-transparent cursor-pointer border-none p-0"
                                />
                                <input
                                    type="color"
                                    value={options.tritoneColors.color2}
                                    onChange={(e) => updateOption('tritoneColors', { ...options.tritoneColors, color2: e.target.value })}
                                    className="w-full h-8 bg-transparent cursor-pointer border-none p-0"
                                />
                                <input
                                    type="color"
                                    value={options.tritoneColors.color3}
                                    onChange={(e) => updateOption('tritoneColors', { ...options.tritoneColors, color3: e.target.value })}
                                    className="w-full h-8 bg-transparent cursor-pointer border-none p-0"
                                />
                            </>
                        )}
                        {options.colorMode === 'quadtone' && (
                            <>
                                <input
                                    type="color"
                                    value={options.quadtoneColors.color1}
                                    onChange={(e) => updateOption('quadtoneColors', { ...options.quadtoneColors, color1: e.target.value })}
                                    className="w-full h-8 bg-transparent cursor-pointer border-none p-0"
                                />
                                <input
                                    type="color"
                                    value={options.quadtoneColors.color2}
                                    onChange={(e) => updateOption('quadtoneColors', { ...options.quadtoneColors, color2: e.target.value })}
                                    className="w-full h-8 bg-transparent cursor-pointer border-none p-0"
                                />
                                <input
                                    type="color"
                                    value={options.quadtoneColors.color3}
                                    onChange={(e) => updateOption('quadtoneColors', { ...options.quadtoneColors, color3: e.target.value })}
                                    className="w-full h-8 bg-transparent cursor-pointer border-none p-0"
                                />
                                <input
                                    type="color"
                                    value={options.quadtoneColors.color4}
                                    onChange={(e) => updateOption('quadtoneColors', { ...options.quadtoneColors, color4: e.target.value })}
                                    className="w-full h-8 bg-transparent cursor-pointer border-none p-0"
                                />
                            </>
                        )}
                    </div>

                    {/* Presets Dropdown */}
                    {presets.length > 0 && (
                        <div className="space-y-1">
                            <div className="relative">
                                <select
                                    onChange={(e) => {
                                        const preset = presets.find(p => p.id === e.target.value);
                                        if (preset) {
                                            if (preset.mode === 'duotone') {
                                                onOptionsChange({ ...options, colorMode: 'duotone', duotoneColors: preset.colors as any });
                                            } else if (preset.mode === 'tritone') {
                                                onOptionsChange({ ...options, colorMode: 'tritone', tritoneColors: preset.colors as any });
                                            } else if (preset.mode === 'quadtone') {
                                                onOptionsChange({ ...options, colorMode: 'quadtone', quadtoneColors: preset.colors as any });
                                            }
                                        }
                                    }}
                                    className="w-full bg-neutral-900 border border-neutral-800 text-white py-2 px-2 text-[10px] appearance-none uppercase focus:outline-none focus:border-neutral-600"
                                    value=""
                                >
                                    <option value="" disabled>Saved Presets</option>
                                    {presets.filter(p => p.mode === options.colorMode).map((preset) => (
                                        <option key={preset.id} value={preset.id}>{preset.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 text-[10px]">▼</div>
                            </div>
                            {/* Delete Button for current selection could be here, but simpler is to keep it in a list if requested. Let's stick to dropdown as asked. */}
                        </div>
                    )}

                    <button
                        onClick={handleResetColors}
                        className="w-full py-2 border border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-white transition-colors uppercase text-[10px]"
                    >
                        Reset Colors
                    </button>
                </div>
            )}

            {/* Dithering Options */}
            <div className="space-y-4 pt-2 border-t border-neutral-800">
                {options.algorithm === 'threshold' && (
                    <SliderField
                        label="Threshold"
                        value={options.threshold}
                        min={0}
                        max={255}
                        step={1}
                        onChange={(v) => updateOption('threshold', v)}
                    />
                )}

                <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 tracking-wider uppercase">Color pipeline</label>
                    <div className="relative">
                        <select
                            value={options.colorPipeline}
                            onChange={(e) => updateOption('colorPipeline', e.target.value as any)}
                            className="w-full bg-neutral-900 border border-neutral-800 text-white py-2 px-2 text-xs appearance-none uppercase focus:outline-none focus:border-neutral-600"
                        >
                            <option value="default">Default</option>
                            <option value="smooth">Smoother Transitions</option>
                            <option value="linear">Precise Linear Pattern</option>
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 text-[10px]">▼</div>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <label className="text-[10px] text-neutral-400 tracking-wider uppercase">Strict swatches</label>
                    <button
                        onClick={() => updateOption('strictSwatches', !options.strictSwatches)}
                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${options.strictSwatches ? 'bg-white' : 'bg-neutral-800'
                            }`}
                    >
                        <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-black transition-transform ${options.strictSwatches ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>

                {!options.strictSwatches && options.colorMode !== 'rgb' && (
                    <SliderField
                        label="Palette Steps"
                        value={options.paletteSteps}
                        min={2}
                        max={16}
                        step={1}
                        onChange={(v) => updateOption('paletteSteps', v)}
                    />
                )}

                <SliderField
                    label="Point size"
                    value={options.pointSize}
                    min={1}
                    max={16}
                    step={1}
                    onChange={(v) => updateOption('pointSize', v)}
                />

                <SliderField
                    label="Preview Resolution"
                    value={options.previewResolution}
                    min={400}
                    max={2400}
                    step={100}
                    onChange={(v) => updateOption('previewResolution', v)}
                />
            </div>

            {/* Effects Section */}
            <div className="space-y-4 pt-4 border-t border-neutral-800">
                <SliderField label="Brightness" value={options.brightness} min={-100} max={100} step={1} onChange={(v) => updateOption('brightness', v)} />
                <SliderField label="Contrast" value={options.contrast} min={-100} max={100} step={1} onChange={(v) => updateOption('contrast', v)} />
                <SliderField label="Gamma" value={options.gamma} min={0.1} max={3} step={0.1} onChange={(v) => updateOption('gamma', v)} />

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
                <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 tracking-wider uppercase">Paper Texture</label>
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

                {options.paperTexture !== 'none' && (
                    <SliderField
                        label="Texture Opacity"
                        value={options.paperTextureOpacity}
                        min={0}
                        max={100}
                        step={1}
                        onChange={(v) => updateOption('paperTextureOpacity', v)}
                        suffix="%"
                    />
                )}
            </div>
        </div >
    );
};
