import React, { useState } from 'react';
import { DitherOptions } from '../../lib/dither';
import { SIZE_FAMILIES, sizesInFamily, getPosterSize, POSTER_SIZES } from '../../lib/posterSizes';
import { GripVertical, Eye, EyeOff, Dices, ChevronDown, AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd, AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd } from 'lucide-react';
import {
    DndContext, closestCenter, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SectionCard } from './SectionCard';
import { useT } from '../../contexts/LanguageContext';

interface LayoutControlsProps {
    options: DitherOptions;
    onOptionsChange: (options: DitherOptions) => void;
    imageDimensions: { width: number; height: number } | null;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs text-ink-faint block">{label}</label>
            {children}
            {hint && <p className="text-[11px] leading-snug text-ink-faint">{hint}</p>}
        </div>
    );
}

const segBtn = (active: boolean) =>
    `flex-1 py-1.5 min-h-11 md:min-h-0 rounded-lg border transition-colors text-[10px] uppercase ${active ? 'bg-ink text-paper border-transparent' : 'border-line text-ink-faint hover:border-ink/40 hover:text-ink'}`;

// The sizes most people print at; the rest sit behind "Show all sizes"
const POPULAR_SIZE_IDS = ['A4', 'A3', 'A2', '30x40cm', '50x70cm', '18x24in'];

const sizeBtn = (active: boolean) =>
    `py-1.5 min-h-11 md:min-h-0 rounded-lg border transition-colors text-[10px] whitespace-nowrap ${active ? 'bg-ink text-paper border-transparent font-semibold' : 'border-line text-ink-soft hover:border-ink/40 hover:text-ink'}`;

function SortableRow({ id, label, enabled, onToggle }: { id: string; label: string; enabled: boolean; onToggle: () => void }) {
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={`relative flex items-center gap-1 pr-1 md:pl-1 bg-surface border border-line rounded-lg ${isDragging ? 'z-10 shadow-card opacity-90' : ''}`}
        >
            {/* Only the grip drags, so swiping over the rest of the row scrolls the list */}
            <button
                ref={setActivatorNodeRef}
                {...attributes}
                {...listeners}
                aria-label={label}
                className="flex items-center justify-center w-12 md:w-8 self-stretch min-h-14 md:min-h-9 cursor-grab active:cursor-grabbing"
                style={{ touchAction: 'none' }}
            >
                <GripVertical className="w-5 h-5 md:w-3.5 md:h-3.5 text-ink-faint flex-shrink-0" />
            </button>
            <span className="flex-1 text-sm md:text-xs text-ink select-none">{label}</span>
            <button onClick={onToggle} aria-pressed={enabled} className="w-12 h-12 md:w-7 md:h-7 flex items-center justify-center text-ink-faint hover:text-ink transition-colors">
                {enabled ? <Eye className="w-5 h-5 md:w-3.5 md:h-3.5" /> : <EyeOff className="w-5 h-5 md:w-3.5 md:h-3.5" />}
            </button>
        </div>
    );
}

export const LayoutControls: React.FC<LayoutControlsProps> = ({ options, onOptionsChange }) => {
    const { t } = useT();
    const [showAllSizes, setShowAllSizes] = useState(false);

    // Pointer covers mouse and pen; touch waits a beat so a swipe still scrolls the panel
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id) return;
        const order = options.poster.layoutOrder;
        const from = order.indexOf(active.id as string);
        const to = order.indexOf(over.id as string);
        if (from < 0 || to < 0) return;
        onOptionsChange({ ...options, poster: { ...options.poster, layoutOrder: arrayMove(order, from, to) } });
    };

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
    const sortable = p.layoutOrder.filter(s => s !== 'icons');
    const current = getPosterSize(p.aspectRatio);
    // Keep the chosen size visible even when it isn't a popular one
    const popular = POSTER_SIZES.filter(s => POPULAR_SIZE_IDS.includes(s.id) || s.id === current.id);

    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-200">
            <SectionCard title={t('sectionLayoutOrder')}>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={sortable} strategy={verticalListSortingStrategy}>
                        <div className="space-y-1.5">
                            {sortable.map(section => (
                                <SortableRow
                                    key={section}
                                    id={section}
                                    label={getSectionLabel(section)}
                                    enabled={isSectionEnabled(section)}
                                    onToggle={() => toggleSection(section)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => set({ layoutOrder: [...p.layoutOrder].sort(() => Math.random() - 0.5) })}
                        className="py-2 min-h-11 md:min-h-0 bg-ink/5 text-ink text-xs rounded-lg hover:bg-ink/10 transition-colors flex items-center justify-center gap-1.5"
                    >
                        <Dices className="w-3.5 h-3.5" /> {t('btnShuffle')}
                    </button>
                    <button
                        onClick={() => set({ layoutOrder: ['header', 'image', 'title', 'list', 'footer'] })}
                        className="py-2 min-h-11 md:min-h-0 rounded-lg border border-line text-ink-faint hover:border-ink/40 hover:text-ink transition-colors text-xs"
                    >
                        {t('btnReset')}
                    </button>
                </div>
            </SectionCard>

            <SectionCard title={t('sectionPosterSize')}>
                {showAllSizes ? (
                    <div className="space-y-3">
                        {SIZE_FAMILIES.map(family => {
                            const sizes = sizesInFamily(family.id);
                            const ratio = sizes[0].widthMm / sizes[0].heightMm;
                            const activeFamily = current.family === family.id;
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
                                            <button key={size.id} onClick={() => set({ aspectRatio: size.id })} className={sizeBtn(current.id === size.id)}>
                                                {size.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-1.5">
                        {popular.map(size => (
                            <button key={size.id} onClick={() => set({ aspectRatio: size.id })} className={sizeBtn(current.id === size.id)}>
                                {size.label}
                            </button>
                        ))}
                    </div>
                )}
                <button
                    onClick={() => setShowAllSizes(v => !v)}
                    aria-expanded={showAllSizes}
                    className="w-full flex items-center justify-center gap-1 py-3 md:py-1.5 text-[11px] font-semibold text-ink-soft hover:text-ink transition-colors"
                >
                    {showAllSizes ? t('showFewerSizes') : t('showAllSizes')}
                    <ChevronDown className={`w-3 h-3 transition-transform ${showAllSizes ? 'rotate-180' : ''}`} />
                </button>
            </SectionCard>

            <SectionCard title={t('sectionSpacing')}>
                <Field label={t('fieldPosterPadding')} hint={t('hintPosterPadding')}>
                    <div className="grid grid-cols-3 gap-1.5">
                        {(['S', 'M', 'L'] as const).map(size => (
                            <button key={size} onClick={() => set({ paddingSize: size })}
                                className={`py-1.5 min-h-11 md:min-h-0 rounded-lg border transition-colors text-xs uppercase ${p.paddingSize === size ? 'bg-ink text-paper border-transparent' : 'border-line text-ink-faint hover:border-ink/40 hover:text-ink'}`}>
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
                            className="w-12 py-1.5 min-h-11 md:min-h-0 bg-surface border border-line text-ink text-[10px] text-center focus:outline-none focus:border-ink/40 rounded-lg" />
                    </div>
                </Field>
            </SectionCard>

            {<SectionCard title={t('sectionImage')}>
                <Field label={t('fieldImagePadding')}>
                    <div className="grid grid-cols-2 gap-1.5">
                        {(['none', 'same-as-poster'] as const).map(v => (
                            <button key={v} onClick={() => set({ imagePadding: v })}
                                className={`py-1.5 min-h-11 md:min-h-0 rounded-lg border transition-colors text-[10px] uppercase ${p.imagePadding === v ? 'bg-ink text-paper border-transparent' : 'border-line text-ink-faint hover:border-ink/40 hover:text-ink'}`}>
                                {v === 'none' ? t('optFullBleed') : t('optWithMargin')}
                            </button>
                        ))}
                    </div>
                </Field>

                <Field label={t('fieldImageScale')}>
                    <div className="grid grid-cols-3 gap-1.5">
                        {(['fit', 'fill', 'original'] as const).map(v => (
                            <button key={v} onClick={() => set({ imageScale: v })}
                                className={`py-1.5 min-h-11 md:min-h-0 rounded-lg border transition-colors text-[10px] uppercase ${p.imageScale === v ? 'bg-ink text-paper border-transparent' : 'border-line text-ink-faint hover:border-ink/40 hover:text-ink'}`}>
                                {v === 'fill' ? t('optFill') : v === 'fit' ? t('optFit') : t('optOriginal')}
                            </button>
                        ))}
                    </div>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                    <Field label={t('fieldAlignX')}>
                        <div className="grid grid-cols-3 gap-1">
                            {(['left', 'center', 'right'] as const).map(v => (
                                <button key={v} onClick={() => set({ imageAlignX: v })} aria-label={v} title={v}
                                    className={`py-1.5 min-h-11 md:min-h-0 flex items-center justify-center rounded-lg border transition-colors ${p.imageAlignX === v ? 'bg-ink text-paper border-transparent' : 'border-line text-ink-faint hover:border-ink/40 hover:text-ink'}`}>
                                    {v === 'left' ? <AlignHorizontalJustifyStart className="w-3.5 h-3.5" /> : v === 'center' ? <AlignHorizontalJustifyCenter className="w-3.5 h-3.5" /> : <AlignHorizontalJustifyEnd className="w-3.5 h-3.5" />}
                                </button>
                            ))}
                        </div>
                    </Field>
                    <Field label={t('fieldAlignY')}>
                        <div className="grid grid-cols-3 gap-1">
                            {(['top', 'center', 'bottom'] as const).map(v => (
                                <button key={v} onClick={() => set({ imageAlignY: v })} aria-label={v} title={v}
                                    className={`py-1.5 min-h-11 md:min-h-0 flex items-center justify-center rounded-lg border transition-colors ${p.imageAlignY === v ? 'bg-ink text-paper border-transparent' : 'border-line text-ink-faint hover:border-ink/40 hover:text-ink'}`}>
                                    {v === 'top' ? <AlignVerticalJustifyStart className="w-3.5 h-3.5" /> : v === 'center' ? <AlignVerticalJustifyCenter className="w-3.5 h-3.5" /> : <AlignVerticalJustifyEnd className="w-3.5 h-3.5" />}
                                </button>
                            ))}
                        </div>
                    </Field>
                </div>
            </SectionCard>}
        </div>
    );
};
