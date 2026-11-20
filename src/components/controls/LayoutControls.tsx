import React, { useState } from 'react';
import { DitherOptions } from '../../lib/dither';
import { SIZE_FAMILIES, sizesInFamily, getPosterSize } from '../../lib/posterSizes';
import { GripVertical, Eye, EyeOff, Dices } from 'lucide-react';
import { SectionCard } from './SectionCard';
import { useT } from '../../contexts/LanguageContext';

interface LayoutControlsProps {
    options: DitherOptions;
    onOptionsChange: (options: DitherOptions) => void;
    imageDimensions: { width: number; height: number } | null;
    advanced?: boolean;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs text-ink-faint block">{label}</label>
            {children}
        </div>
    );
}

const segBtn = (active: boolean) =>
    `flex-1 py-1.5 rounded-lg border transition-colors text-[10px] uppercase ${active ? 'bg-ink text-paper border-transparent' : 'border-line text-ink-faint hover:border-ink/40 hover:text-ink'}`;

export const LayoutControls: React.FC<LayoutControlsProps> = ({ options, onOptionsChange, advanced = false }) => {
    const [draggedItem, setDraggedItem] = useState<number | null>(null);
    const { t } = useT();

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

    const getSectionLabel = (section: string): string => ({
        header: t('sectHeader'), title: t('fieldTitle'), image: t('sectImage'),
        footer: t('sectFooter'), list: t('sectList'), icons: t('sectIcons'),
    }[section] ?? section);

    const p = options.poster;
    const set = (patch: Partial<typeof p>) => onOptionsChange({ ...options, poster: { ...p, ...patch } });

    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-200">
            {advanced && <SectionCard title={t('sectionLayoutOrder')}>
                <div className="space-y-1.5">
                    {p.layoutOrder.filter(s => s !== 'icons').map((section, index) => (
                        <div
                            key={section}
                            draggable
                            onDragStart={e => handleDragStart(e, index)}
                            onDragOver={e => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`flex items-center gap-2 px-3 py-2 bg-surface border border-line rounded-lg group cursor-move transition-opacity ${draggedItem === index ? 'opacity-40' : ''}`}
                        >
                            <GripVertical className="w-3.5 h-3.5 text-ink-faint/70 group-hover:text-ink-soft flex-shrink-0" />
                            <span className="flex-1 text-xs text-ink">{getSectionLabel(section)}</span>
                            <button onClick={() => toggleSection(section)} className="text-ink-faint hover:text-ink transition-colors">
                                {isSectionEnabled(section) ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => set({ layoutOrder: [...p.layoutOrder].sort(() => Math.random() - 0.5) })}
                        className="py-2 bg-ink/5 text-ink text-xs rounded-lg hover:bg-ink/10 transition-colors flex items-center justify-center gap-1.5"
                    >
                        <Dices className="w-3.5 h-3.5" /> {t('btnShuffle')}
                    </button>
                    <button
                        onClick={() => set({ layoutOrder: ['header', 'image', 'title', 'list', 'footer'] })}
                        className="py-2 rounded-lg border border-line text-ink-faint hover:border-ink/40 hover:text-ink transition-colors text-xs"
                    >
                        {t('btnReset')}
                    </button>
                </div>
            </SectionCard>}

            <SectionCard title={t('sectionPosterSize')}>
                <div className="space-y-3">
                    {SIZE_FAMILIES.map(family => {
                        const sizes = sizesInFamily(family.id);
                        const ratio = sizes[0].widthMm / sizes[0].heightMm;
                        const activeFamily = getPosterSize(p.aspectRatio).family === family.id;
                        return (
                            <div key={family.id}>
                                <div className={`flex items-center gap-2 mb-1.5 text-[10px] ${activeFamily ? 'text-ink font-semibold' : 'text-ink-faint'}`}>
                                    <span
                                        className={`inline-block border ${activeFamily ? 'border-ink bg-ink/10' : 'border-ink-faint/50'}`}
                                        style={{ height: 14, width: Math.round(14 * ratio) }}
                                    />
                                    {family.label}
                                </div>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {sizes.map(size => (
                                        <button key={size.id}
                                            onClick={() => set({ aspectRatio: size.id })}
                                            className={`py-1.5 rounded-lg border transition-colors text-[10px] whitespace-nowrap ${getPosterSize(p.aspectRatio).id === size.id ? 'bg-ink text-paper border-transparent font-semibold' : 'border-line text-ink-soft hover:border-ink/40 hover:text-ink'}`}
                                        >
                                            {size.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </SectionCard>

            <SectionCard title={t('sectionSpacing')}>
                <Field label={t('fieldPosterPadding')}>
                    <div className="grid grid-cols-3 gap-1.5">
                        {(['S', 'M', 'L'] as const).map(size => (
                            <button key={size} onClick={() => set({ paddingSize: size })}
                                className={`py-1.5 rounded-lg border transition-colors text-xs uppercase ${p.paddingSize === size ? 'bg-ink text-paper border-transparent' : 'border-line text-ink-faint hover:border-ink/40 hover:text-ink'}`}>
                                {size}
                            </button>
                        ))}
                    </div>
                </Field>

                <Field label={t('fieldLayoutGap')}>
                    <div className="flex gap-1.5">
                        {[16, 24, 32, 40].map(size => (
                            <button key={size} onClick={() => set({ gap: size })} className={segBtn(p.gap === size)}>{size}</button>
                        ))}
                        <input type="number" value={p.gap}
                            onChange={e => set({ gap: parseInt(e.target.value) || 0 })}
                            className="w-12 py-1.5 bg-surface border border-line text-ink text-[10px] text-center focus:outline-none focus:border-ink/40 rounded-lg" />
                    </div>
                </Field>
            </SectionCard>

            {advanced && <SectionCard title={t('sectionImage')}>
                <Field label={t('fieldImagePadding')}>
                    <div className="grid grid-cols-2 gap-1.5">
                        {(['none', 'same-as-poster'] as const).map(v => (
                            <button key={v} onClick={() => set({ imagePadding: v })}
                                className={`py-1.5 rounded-lg border transition-colors text-[10px] uppercase ${p.imagePadding === v ? 'bg-ink text-paper border-transparent' : 'border-line text-ink-faint hover:border-ink/40 hover:text-ink'}`}>
                                {v === 'none' ? 'None' : 'Same'}
                            </button>
                        ))}
                    </div>
                </Field>

                <Field label={t('fieldImageScale')}>
                    <div className="grid grid-cols-3 gap-1.5">
                        {(['fit', 'fill', 'original'] as const).map(v => (
                            <button key={v} onClick={() => set({ imageScale: v })}
                                className={`py-1.5 rounded-lg border transition-colors text-[10px] uppercase ${p.imageScale === v ? 'bg-ink text-paper border-transparent' : 'border-line text-ink-faint hover:border-ink/40 hover:text-ink'}`}>
                                {v}
                            </button>
                        ))}
                    </div>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                    <Field label={t('fieldAlignX')}>
                        <div className="grid grid-cols-3 gap-1">
                            {(['left', 'center', 'right'] as const).map(v => (
                                <button key={v} onClick={() => set({ imageAlignX: v })}
                                    className={`py-1.5 rounded-lg border transition-colors text-[10px] uppercase ${p.imageAlignX === v ? 'bg-ink text-paper border-transparent' : 'border-line text-ink-faint hover:border-ink/40 hover:text-ink'}`}>
                                    {v.charAt(0)}
                                </button>
                            ))}
                        </div>
                    </Field>
                    <Field label={t('fieldAlignY')}>
                        <div className="grid grid-cols-3 gap-1">
                            {(['top', 'center', 'bottom'] as const).map(v => (
                                <button key={v} onClick={() => set({ imageAlignY: v })}
                                    className={`py-1.5 rounded-lg border transition-colors text-[10px] uppercase ${p.imageAlignY === v ? 'bg-ink text-paper border-transparent' : 'border-line text-ink-faint hover:border-ink/40 hover:text-ink'}`}>
                                    {v.charAt(0)}
                                </button>
                            ))}
                        </div>
                    </Field>
                </div>
            </SectionCard>}
        </div>
    );
};
