import React, { useState, useEffect, useRef } from 'react';
import { DitherOptions, ColorPreset } from '../../lib/dither';
import { QUADTONE_THEMES, DUOTONE_THEMES, TRITONE_THEMES } from '../../lib/colorUtils';
import { Save, Minus, Plus } from 'lucide-react';
import { SectionCard } from './SectionCard';

interface AdjustmentControlsProps {
    options: DitherOptions;
    onOptionsChange: (options: DitherOptions) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs text-neutral-500 block">{label}</label>
            {children}
        </div>
    );
}

const SliderField: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (val: number) => void;
    suffix?: string;
    defaultValue?: number;
}> = ({ label, value, min, max, step, onChange, suffix = '', defaultValue }) => {
    const canReset = defaultValue !== undefined && value !== defaultValue;
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-neutral-500">
                <span
                    className={defaultValue !== undefined ? 'cursor-pointer hover:text-white transition-colors select-none' : ''}
                    onClick={() => defaultValue !== undefined && onChange(defaultValue)}
                    title={defaultValue !== undefined ? `Reset to ${defaultValue}` : undefined}
                >
                    {label}{canReset && <span className="ml-1 text-neutral-600">↺</span>}
                </span>
                <span className="font-mono text-neutral-400">{Math.round(value * 100) / 100}{suffix}</span>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => onChange(Math.max(min, value - step))}
                    className="w-6 h-6 rounded-full border border-neutral-700 flex items-center justify-center text-neutral-500 hover:text-white hover:border-neutral-500 transition-colors flex-shrink-0">
                    <Minus className="w-2.5 h-2.5" />
                </button>
                <input type="range" min={min} max={max} step={step} value={value}
                    onChange={e => onChange(Number(e.target.value))}
                    className="flex-1 appearance-none cursor-pointer accent-white h-1 bg-neutral-700 rounded-full"
                    style={{ touchAction: 'pan-y' }} />
                <button onClick={() => onChange(Math.min(max, value + step))}
                    className="w-6 h-6 rounded-full border border-neutral-700 flex items-center justify-center text-neutral-500 hover:text-white hover:border-neutral-500 transition-colors flex-shrink-0">
                    <Plus className="w-2.5 h-2.5" />
                </button>
            </div>
        </div>
    );
};

const ThemeSelect: React.FC<{
    currentValue: string;
    themes: { name: string; colors: string[] }[];
    onSelect: (name: string) => void;
}> = ({ currentValue, themes, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropStyle, setDropStyle] = useState<React.CSSProperties>({});
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (!triggerRef.current?.contains(e.target as Node) && !dropdownRef.current?.contains(e.target as Node)) setIsOpen(false);
        };
        const handleScroll = (e: Event) => {
            if (dropdownRef.current?.contains(e.target as Node)) return;
            setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('scroll', handleScroll, true);
        return () => { document.removeEventListener('mousedown', handleClick); document.removeEventListener('scroll', handleScroll, true); };
    }, [isOpen]);

    const open = () => {
        if (!triggerRef.current) return setIsOpen(v => !v);
        const r = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - r.bottom - 8;
        const spaceAbove = r.top - 8;
        const dropH = Math.min(240, themes.length * 32 + 8);
        const goDown = spaceBelow >= dropH || spaceBelow >= spaceAbove;
        setDropStyle(goDown
            ? { position: 'fixed', left: r.left, width: r.width, top: r.bottom + 4, maxHeight: Math.min(240, spaceBelow), zIndex: 9999 }
            : { position: 'fixed', left: r.left, width: r.width, bottom: window.innerHeight - r.top + 4, maxHeight: Math.min(240, spaceAbove), zIndex: 9999 });
        setIsOpen(v => !v);
    };

    const selectedTheme = themes.find(t => t.name === currentValue);

    return (
        <div className="relative w-full">
            <button ref={triggerRef} onClick={open}
                className="w-full bg-neutral-800 border border-neutral-700 text-white py-2 px-3 text-xs rounded-lg flex items-center justify-between hover:border-neutral-500 transition-colors">
                <div className="flex items-center gap-2 overflow-hidden">
                    {selectedTheme && (
                        <div className="flex -space-x-1 flex-shrink-0">
                            {selectedTheme.colors.map((c, i) => (
                                <div key={i} className="w-3 h-3 rounded-full border border-black" style={{ backgroundColor: c }} />
                            ))}
                        </div>
                    )}
                    <span className="truncate">{currentValue || 'Select theme'}</span>
                </div>
                <span className="text-neutral-500 text-[8px] ml-1">{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && (
                <div ref={dropdownRef} style={dropStyle}
                    className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-y-auto shadow-2xl p-1 space-y-0.5">
                    {themes.map(theme => (
                        <button key={theme.name} onClick={() => { onSelect(theme.name); setIsOpen(false); }}
                            className="w-full px-3 py-2 text-xs text-left hover:bg-neutral-800 flex items-center gap-2 transition-colors rounded-lg">
                            <div className="flex -space-x-1 flex-shrink-0">
                                {theme.colors.map((c, i) => <div key={i} className="w-3 h-3 rounded-full border border-black" style={{ backgroundColor: c }} />)}
                            </div>
                            <span className={`truncate ${theme.name === currentValue ? 'text-white font-semibold' : 'text-neutral-400'}`}>{theme.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export const AdjustmentControls: React.FC<AdjustmentControlsProps> = ({ options, onOptionsChange }) => {
    const [presets, setPresets] = useState<ColorPreset[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('ditherColorPresets');
        if (saved) setPresets(JSON.parse(saved));
    }, []);

    const update = <K extends keyof DitherOptions>(key: K, value: DitherOptions[K]) =>
        onOptionsChange({ ...options, [key]: value });

    const savePreset = () => {
        if (options.colorMode === 'rgb' || options.colorMode === 'monochrome') return;
        const name = prompt('Enter preset name:');
        if (!name) return;
        const getColors = () => {
            if (options.colorMode === 'duotone') return options.duotoneColors;
            if (options.colorMode === 'tritone') return options.tritoneColors;
            return options.quadtoneColors;
        };
        const newPreset: ColorPreset = { id: Date.now().toString(), name, mode: options.colorMode as any, colors: getColors() as any, timestamp: Date.now() };
        const updated = [...presets, newPreset];
        setPresets(updated);
        localStorage.setItem('ditherColorPresets', JSON.stringify(updated));
    };

    const handleThemeSelect = (themeName: string) => {
        const qTheme = QUADTONE_THEMES.find(t => t.name === themeName);
        const tTheme = TRITONE_THEMES.find(t => t.name === themeName);
        const dTheme = DUOTONE_THEMES.find(t => t.name === themeName);
        const newOptions = { ...options, selectedThemeName: themeName };
        if (qTheme) newOptions.quadtoneColors = { color1: qTheme.shadow, color2: qTheme.midShadow, color3: qTheme.midHighlight, color4: qTheme.highlight };
        if (tTheme) newOptions.tritoneColors = { color1: tTheme.shadow, color2: tTheme.mid, color3: tTheme.highlight };
        if (dTheme) newOptions.duotoneColors = { color1: dTheme.shadow, color2: dTheme.highlight };
        onOptionsChange(newOptions);
    };

    const segBtn = (active: boolean) =>
        `py-1.5 rounded-lg border transition-colors text-[10px] uppercase ${active ? 'bg-white text-black border-transparent' : 'border-neutral-700 text-neutral-500 hover:border-neutral-500'}`;

    const colorModes = [
        { id: 'monochrome', label: 'Mono' }, { id: 'duotone', label: 'Duo' },
        { id: 'tritone', label: 'Trio' }, { id: 'quadtone', label: 'Quad' }, { id: 'rgb', label: 'RGB' }
    ];

    const hasPalette = options.colorMode === 'duotone' || options.colorMode === 'tritone' || options.colorMode === 'quadtone';

    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-200">
            <SectionCard title="Dither">
                <Field label="Algorithm">
                    <div className="grid grid-cols-3 gap-1.5">
                        {(options.engine === 'dg' ? ['atkinson', 'floyd', 'threshold'] : ['none', 'atkinson', 'threshold']).map(algo => (
                            <button key={algo} onClick={() => update('algorithm', algo as any)} className={segBtn(options.algorithm === algo)}>
                                {algo}
                            </button>
                        ))}
                    </div>
                </Field>

                <Field label="Color mode">
                    <div className="grid grid-cols-5 gap-1">
                        {colorModes.map(mode => (
                            <button key={mode.id} onClick={() => update('colorMode', mode.id as any)} className={segBtn(options.colorMode === mode.id)}>
                                {mode.label}
                            </button>
                        ))}
                    </div>
                </Field>

                <SliderField label="Threshold" value={options.threshold} min={0} max={255} step={1} defaultValue={128} onChange={v => update('threshold', v)} />
                <SliderField label="Point size" value={options.pointSize} min={1} max={16} step={1} defaultValue={2} onChange={v => update('pointSize', v)} />
            </SectionCard>

            {hasPalette && (
                <SectionCard title="Palette">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-neutral-500">Theme preset</span>
                        <button onClick={savePreset} className="text-neutral-500 hover:text-white transition-colors" title="Save preset">
                            <Save className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <ThemeSelect
                        currentValue={options.selectedThemeName || ''}
                        themes={
                            options.colorMode === 'duotone' ? DUOTONE_THEMES.map(t => ({ name: t.name, colors: [t.shadow, t.highlight] })) :
                            options.colorMode === 'tritone' ? TRITONE_THEMES.map(t => ({ name: t.name, colors: [t.shadow, t.mid, t.highlight] })) :
                            QUADTONE_THEMES.map(t => ({ name: t.name, colors: [t.shadow, t.midShadow, t.midHighlight, t.highlight] }))
                        }
                        onSelect={handleThemeSelect}
                    />

                    <div className="grid grid-cols-4 gap-2 mt-1">
                        {options.colorMode === 'duotone' && (
                            <>
                                <input type="color" value={options.duotoneColors.color1} onChange={e => onOptionsChange({ ...options, duotoneColors: { ...options.duotoneColors, color1: e.target.value }, selectedThemeName: undefined })} className="w-full h-8 bg-transparent cursor-pointer border-none p-0" />
                                <input type="color" value={options.duotoneColors.color2} onChange={e => onOptionsChange({ ...options, duotoneColors: { ...options.duotoneColors, color2: e.target.value }, selectedThemeName: undefined })} className="w-full h-8 bg-transparent cursor-pointer border-none p-0" />
                            </>
                        )}
                        {options.colorMode === 'tritone' && (
                            <>
                                <input type="color" value={options.tritoneColors.color1} onChange={e => onOptionsChange({ ...options, tritoneColors: { ...options.tritoneColors, color1: e.target.value }, selectedThemeName: undefined })} className="w-full h-8 bg-transparent cursor-pointer border-none p-0" />
                                <input type="color" value={options.tritoneColors.color2} onChange={e => onOptionsChange({ ...options, tritoneColors: { ...options.tritoneColors, color2: e.target.value }, selectedThemeName: undefined })} className="w-full h-8 bg-transparent cursor-pointer border-none p-0" />
                                <input type="color" value={options.tritoneColors.color3} onChange={e => onOptionsChange({ ...options, tritoneColors: { ...options.tritoneColors, color3: e.target.value }, selectedThemeName: undefined })} className="w-full h-8 bg-transparent cursor-pointer border-none p-0" />
                            </>
                        )}
                        {options.colorMode === 'quadtone' && (
                            <>
                                <input type="color" value={options.quadtoneColors.color1} onChange={e => onOptionsChange({ ...options, quadtoneColors: { ...options.quadtoneColors, color1: e.target.value }, selectedThemeName: undefined })} className="w-full h-8 bg-transparent cursor-pointer border-none p-0" />
                                <input type="color" value={options.quadtoneColors.color2} onChange={e => onOptionsChange({ ...options, quadtoneColors: { ...options.quadtoneColors, color2: e.target.value }, selectedThemeName: undefined })} className="w-full h-8 bg-transparent cursor-pointer border-none p-0" />
                                <input type="color" value={options.quadtoneColors.color3} onChange={e => onOptionsChange({ ...options, quadtoneColors: { ...options.quadtoneColors, color3: e.target.value }, selectedThemeName: undefined })} className="w-full h-8 bg-transparent cursor-pointer border-none p-0" />
                                <input type="color" value={options.quadtoneColors.color4} onChange={e => onOptionsChange({ ...options, quadtoneColors: { ...options.quadtoneColors, color4: e.target.value }, selectedThemeName: undefined })} className="w-full h-8 bg-transparent cursor-pointer border-none p-0" />
                            </>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleThemeSelect(QUADTONE_THEMES[Math.floor(Math.random() * QUADTONE_THEMES.length)].name)}
                            className="py-2 bg-neutral-800 text-neutral-300 text-xs rounded-lg hover:bg-neutral-700 hover:text-white transition-colors flex items-center justify-center gap-1.5">
                            🎲 Shuffle
                        </button>
                        <button onClick={() => handleThemeSelect('Base Reference')}
                            className="py-2 rounded-lg border border-neutral-700 text-neutral-500 hover:border-neutral-500 hover:text-white transition-colors text-xs">
                            Reset
                        </button>
                    </div>

                    {presets.filter(p => p.mode === options.colorMode).length > 0 && (
                        <div className="relative">
                            <select
                                onChange={e => {
                                    const preset = presets.find(p => p.id === e.target.value);
                                    if (!preset) return;
                                    if (preset.mode === 'duotone') onOptionsChange({ ...options, colorMode: 'duotone', duotoneColors: preset.colors as any });
                                    else if (preset.mode === 'tritone') onOptionsChange({ ...options, colorMode: 'tritone', tritoneColors: preset.colors as any });
                                    else if (preset.mode === 'quadtone') onOptionsChange({ ...options, colorMode: 'quadtone', quadtoneColors: preset.colors as any });
                                }}
                                className="w-full bg-neutral-800 border border-neutral-700 text-white py-2 px-3 text-xs rounded-lg appearance-none focus:outline-none focus:border-neutral-500"
                                value="">
                                <option value="" disabled>Saved presets</option>
                                {presets.filter(p => p.mode === options.colorMode).map(preset => (
                                    <option key={preset.id} value={preset.id}>{preset.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 text-[8px]">▼</div>
                        </div>
                    )}
                </SectionCard>
            )}

            <SectionCard title="Image adjustments">
                <SliderField label="Brightness" value={options.brightness} min={-100} max={100} step={1} defaultValue={0} onChange={v => update('brightness', v)} />
                <SliderField label="Contrast" value={options.contrast} min={-100} max={100} step={1} defaultValue={0} onChange={v => update('contrast', v)} />
                <SliderField label="Gamma" value={options.gamma} min={0.1} max={3} step={0.1} defaultValue={1} onChange={v => update('gamma', v)} />
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => update('invert', !options.invert)}
                        className={`py-2 rounded-lg border transition-colors text-xs uppercase ${options.invert ? 'bg-white text-black border-transparent' : 'border-neutral-700 text-neutral-500 hover:border-neutral-500'}`}>
                        Invert
                    </button>
                    <button onClick={() => onOptionsChange({ ...options, brightness: 0, contrast: 0, gamma: 1, invert: false })}
                        className="py-2 rounded-lg border border-neutral-700 text-neutral-500 hover:border-neutral-500 hover:text-white transition-colors text-xs">
                        Reset
                    </button>
                </div>
            </SectionCard>

            <SectionCard title="Paper texture">
                <div className="relative">
                    <select value={options.paperTexture} onChange={e => update('paperTexture', e.target.value as any)}
                        className="w-full bg-neutral-800 border border-neutral-700 text-white py-2 px-3 text-xs rounded-lg appearance-none focus:outline-none focus:border-neutral-500">
                        <option value="none">None</option>
                        <option value="texture-1">Crumpled Paper</option>
                        <option value="texture-2">Speckled Paper</option>
                        <option value="texture-3">Smooth Paper</option>
                        <option value="folded">Folded Paper</option>
                        <option value="glue">Glued Paper</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 text-[8px]">▼</div>
                </div>
                {options.paperTexture !== 'none' && (
                    <SliderField label="Opacity" value={options.paperTextureOpacity} min={0} max={100} step={1} onChange={v => update('paperTextureOpacity', v)} suffix="%" />
                )}
            </SectionCard>
        </div>
    );
};
