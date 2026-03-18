import React, { useState } from 'react';
import { DitherOptions } from '../../lib/dither';
import { getPosterDimensions } from '../../lib/posterRenderer';
import { GripVertical, Eye, EyeOff } from 'lucide-react';

interface LayoutControlsProps {
    options: DitherOptions;
    onOptionsChange: (options: DitherOptions) => void;
    imageDimensions: { width: number; height: number } | null;
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-800">
                <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">{title}</h3>
            </div>
            <div className="p-4 space-y-4">
                {children}
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs text-neutral-500 block">{label}</label>
            {children}
        </div>
    );
}

const segBtn = (active: boolean) =>
    `flex-1 py-1.5 rounded-lg border transition-colors text-[10px] uppercase ${active ? 'bg-white text-black border-transparent' : 'border-neutral-700 text-neutral-500 hover:border-neutral-500'}`;

export const LayoutControls: React.FC<LayoutControlsProps> = ({ options, onOptionsChange }) => {
    const [draggedItem, setDraggedItem] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedItem(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedItem === null || draggedItem === index) return;
        const newOrder = [...options.poster.layoutOrder];
        const item = newOrder[draggedItem];
        newOrder.splice(draggedItem, 1);
        newOrder.splice(index, 0, item);
        onOptionsChange({ ...options, poster: { ...options.poster, layoutOrder: newOrder } });
        setDraggedItem(index);
    };

    const handleDragEnd = () => setDraggedItem(null);

    const toggleSection = (section: string) => {
        const poster = { ...options.poster };
        switch (section) {
            case 'header': poster.showHeader = !poster.showHeader; break;
            case 'title': poster.showTitle = !poster.showTitle; break;
            case 'image': poster.showImage = !poster.showImage; break;
            case 'footer': poster.showFooter = !poster.showFooter; break;
            case 'list': poster.listSection = { ...poster.listSection, enabled: !poster.listSection.enabled }; break;
            case 'icons': poster.iconSection = { ...poster.iconSection, enabled: !poster.iconSection.enabled }; break;
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

    const getSectionLabel = (section: string) =>
        ({ header: 'Header', title: 'Title', image: 'Image', footer: 'Footer', list: 'List', icons: 'Icons' }[section] ?? section);

    const p = options.poster;
    const set = (patch: Partial<typeof p>) => onOptionsChange({ ...options, poster: { ...p, ...patch } });

    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-200">
            <SectionCard title="Layout order">
                <div className="space-y-1.5">
                    {p.layoutOrder.filter(s => s !== 'icons').map((section, index) => (
                        <div
                            key={section}
                            draggable
                            onDragStart={e => handleDragStart(e, index)}
                            onDragOver={e => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`flex items-center gap-2 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg group cursor-move transition-opacity ${draggedItem === index ? 'opacity-40' : ''}`}
                        >
                            <GripVertical className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-400 flex-shrink-0" />
                            <span className="flex-1 text-xs text-neutral-300">{getSectionLabel(section)}</span>
                            <button onClick={() => toggleSection(section)} className="text-neutral-500 hover:text-white transition-colors">
                                {isSectionEnabled(section) ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => set({ layoutOrder: [...p.layoutOrder].sort(() => Math.random() - 0.5) })}
                        className="py-2 bg-neutral-800 text-neutral-300 text-xs rounded-lg hover:bg-neutral-700 hover:text-white transition-colors flex items-center justify-center gap-1.5"
                    >
                        🎲 Shuffle
                    </button>
                    <button
                        onClick={() => set({ layoutOrder: ['header', 'image', 'title', 'list', 'footer'] })}
                        className="py-2 rounded-lg border border-neutral-700 text-neutral-500 hover:border-neutral-500 hover:text-white transition-colors text-xs"
                    >
                        Reset
                    </button>
                </div>
            </SectionCard>

            <SectionCard title="Poster size">
                <Field label="Format">
                    <div className="grid grid-cols-3 gap-1.5">
                        {(['A5', 'A4', 'A3'] as const).map(size => {
                            const cmLabels: Record<string, string> = { A5: '14.8×21', A4: '21×29.7', A3: '29.7×42' };
                            return (
                                <button key={size}
                                    onClick={() => {
                                        const baseDims = getPosterDimensions(options, options.poster.aspectRatio || 'A4', options.poster.resolution || 'high');
                                        set({ aspectRatio: size, customDimensions: { width: baseDims.width, height: baseDims.height, keepRatio: true } });
                                    }}
                                    className={`py-2 rounded-lg border transition-colors flex flex-col items-center text-[9px] uppercase ${p.aspectRatio === size ? 'bg-white text-black border-transparent font-bold' : 'border-neutral-700 text-neutral-500 hover:border-neutral-500'}`}
                                >
                                    <span>{size}</span>
                                    <span className="opacity-60 mt-0.5">{cmLabels[size]}</span>
                                </button>
                            );
                        })}
                    </div>
                </Field>
            </SectionCard>

            <SectionCard title="Spacing">
                <Field label="Poster padding">
                    <div className="grid grid-cols-3 gap-1.5">
                        {(['S', 'M', 'L'] as const).map(size => (
                            <button key={size} onClick={() => set({ paddingSize: size })}
                                className={`py-1.5 rounded-lg border transition-colors text-xs uppercase ${p.paddingSize === size ? 'bg-white text-black border-transparent' : 'border-neutral-700 text-neutral-500 hover:border-neutral-500'}`}>
                                {size}
                            </button>
                        ))}
                    </div>
                </Field>

                <Field label="Layout gap">
                    <div className="flex gap-1.5">
                        {[16, 24, 32, 40].map(size => (
                            <button key={size} onClick={() => set({ gap: size })} className={segBtn(p.gap === size)}>{size}</button>
                        ))}
                        <input type="number" value={p.gap}
                            onChange={e => set({ gap: parseInt(e.target.value) || 0 })}
                            className="w-12 py-1.5 bg-neutral-800 border border-neutral-700 text-white text-[10px] text-center focus:outline-none focus:border-neutral-500 rounded-lg" />
                    </div>
                </Field>
            </SectionCard>

            <SectionCard title="Image">
                <Field label="Padding">
                    <div className="grid grid-cols-2 gap-1.5">
                        {(['none', 'same-as-poster'] as const).map(v => (
                            <button key={v} onClick={() => set({ imagePadding: v })}
                                className={`py-1.5 rounded-lg border transition-colors text-[10px] uppercase ${p.imagePadding === v ? 'bg-white text-black border-transparent' : 'border-neutral-700 text-neutral-500 hover:border-neutral-500'}`}>
                                {v === 'none' ? 'None' : 'Same'}
                            </button>
                        ))}
                    </div>
                </Field>

                <Field label="Scale">
                    <div className="grid grid-cols-3 gap-1.5">
                        {(['fit', 'fill', 'original'] as const).map(v => (
                            <button key={v} onClick={() => set({ imageScale: v })}
                                className={`py-1.5 rounded-lg border transition-colors text-[10px] uppercase ${p.imageScale === v ? 'bg-white text-black border-transparent' : 'border-neutral-700 text-neutral-500 hover:border-neutral-500'}`}>
                                {v}
                            </button>
                        ))}
                    </div>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                    <Field label="Align X">
                        <div className="grid grid-cols-3 gap-1">
                            {(['left', 'center', 'right'] as const).map(v => (
                                <button key={v} onClick={() => set({ imageAlignX: v })}
                                    className={`py-1.5 rounded-lg border transition-colors text-[10px] uppercase ${p.imageAlignX === v ? 'bg-white text-black border-transparent' : 'border-neutral-700 text-neutral-500 hover:border-neutral-500'}`}>
                                    {v.charAt(0)}
                                </button>
                            ))}
                        </div>
                    </Field>
                    <Field label="Align Y">
                        <div className="grid grid-cols-3 gap-1">
                            {(['top', 'center', 'bottom'] as const).map(v => (
                                <button key={v} onClick={() => set({ imageAlignY: v })}
                                    className={`py-1.5 rounded-lg border transition-colors text-[10px] uppercase ${p.imageAlignY === v ? 'bg-white text-black border-transparent' : 'border-neutral-700 text-neutral-500 hover:border-neutral-500'}`}>
                                    {v.charAt(0)}
                                </button>
                            ))}
                        </div>
                    </Field>
                </div>
            </SectionCard>
        </div>
    );
};
