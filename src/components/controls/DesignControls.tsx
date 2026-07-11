import React from 'react';
import { DitherOptions } from '../../lib/dither';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { SectionCard } from './SectionCard';
import { useT } from '../../contexts/LanguageContext';

interface DesignControlsProps {
    options: DitherOptions;
    onOptionsChange: (options: DitherOptions) => void;
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs text-neutral-500 block">{label}</label>
            {children}
        </div>
    );
}

const inputClass = "w-full bg-neutral-800 border border-neutral-700 text-white px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-neutral-500 transition-colors";

const sizeBtn = (active: boolean) =>
    `flex-1 py-1.5 rounded-lg border transition-colors text-[10px] ${active ? 'bg-white text-black border-transparent' : 'border-neutral-700 text-neutral-500 hover:border-neutral-500'}`;

export const DesignControls: React.FC<DesignControlsProps> = ({ options, onOptionsChange }) => {
    const { t } = useT();
    if (options.designMode !== 'poster') return null;

    const p = options.poster;
    const set = (patch: Partial<typeof p>) => onOptionsChange({ ...options, poster: { ...p, ...patch } });

    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-left-2 duration-200">
            <SectionCard title={t('sectionTextContent')}>
                {/* Director */}
                <Field label={t('fieldDirector')}>
                    <input type="text" value={p.director} onChange={e => set({ director: e.target.value })} className={inputClass} />
                </Field>

                {/* Title */}
                <Field label={
                    <span className="flex items-center justify-between">
                        <span>{t('fieldTitle')}</span>
                        <div className="flex gap-1">
                            {(['left', 'center', 'right'] as const).map(align => (
                                <button key={align} onClick={() => set({ titleAlignment: align })}
                                    className={`p-1 rounded transition-colors ${p.titleAlignment === align ? 'text-white bg-neutral-700' : 'text-neutral-600 hover:text-neutral-300'}`}>
                                    {align === 'left' && <AlignLeft className="w-3 h-3" />}
                                    {align === 'center' && <AlignCenter className="w-3 h-3" />}
                                    {align === 'right' && <AlignRight className="w-3 h-3" />}
                                </button>
                            ))}
                        </div>
                    </span>
                }>
                    <input type="text" value={p.title} onChange={e => set({ title: e.target.value })} className={inputClass} />
                    <div className="flex gap-1 mt-1.5">
                        {[40, 48, 56, 64].map(size => (
                            <button key={size} onClick={() => set({ titleFontSize: size })} className={sizeBtn(p.titleFontSize === size)}>{size}</button>
                        ))}
                        <input type="number" value={p.titleFontSize} onChange={e => set({ titleFontSize: parseInt(e.target.value) || 48 })}
                            className="w-12 py-1.5 bg-neutral-800 border border-neutral-700 text-white text-[10px] text-center focus:outline-none focus:border-neutral-500 rounded-lg" />
                    </div>
                </Field>

                {/* Subtitle */}
                <Field label={t('fieldSubtitle')}>
                    <input type="text" value={p.subtitle} onChange={e => set({ subtitle: e.target.value })} className={inputClass} />
                    <div className="flex gap-1 mt-1.5">
                        {[16, 24, 32, 40].map(size => (
                            <button key={size} onClick={() => set({ subtitleFontSize: size })} className={sizeBtn(p.subtitleFontSize === size)}>{size}</button>
                        ))}
                        <input type="number" value={p.subtitleFontSize} onChange={e => set({ subtitleFontSize: parseInt(e.target.value) || 16 })}
                            className="w-12 py-1.5 bg-neutral-800 border border-neutral-700 text-white text-[10px] text-center focus:outline-none focus:border-neutral-500 rounded-lg" />
                    </div>
                </Field>

                {/* Year */}
                <Field label={t('fieldYear')}>
                    <input type="text" value={p.year} onChange={e => set({ year: e.target.value })} className={inputClass} />
                </Field>

                {/* Description */}
                <Field label={t('fieldDescription')}>
                    <textarea
                        value={p.description[0] || ''}
                        onChange={e => set({ description: [e.target.value], descriptionColumns: 1 })}
                        rows={3}
                        placeholder="Description..."
                        className={`${inputClass} resize-none`}
                    />
                </Field>
            </SectionCard>

            <SectionCard title={t('sectionCastCredits')}>
                <Field label={
                    <span className="flex items-center justify-between">
                        <span>{t('fieldListItems')}</span>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-neutral-800 rounded-lg border border-neutral-700 px-1.5 h-6">
                                <span className="text-[9px] text-neutral-500 uppercase">Cols</span>
                                <select value={p.listSection.columns || 1}
                                    onChange={e => set({ listSection: { ...p.listSection, columns: Number(e.target.value) as 1 | 2 | 3 | 4 } })}
                                    className="bg-transparent text-white text-[10px] focus:outline-none appearance-none cursor-pointer w-4 text-center">
                                    <option value={1}>1</option>
                                    <option value={2}>2</option>
                                    <option value={3}>3</option>
                                    <option value={4}>4</option>
                                </select>
                            </div>
                            <div className="flex gap-1">
                                {(['left', 'center', 'right'] as const).map(align => (
                                    <button key={align} onClick={() => set({ listSection: { ...p.listSection, alignment: align } })}
                                        className={`p-1 rounded transition-colors ${p.listSection.alignment === align ? 'text-white bg-neutral-700' : 'text-neutral-600 hover:text-neutral-300'}`}>
                                        {align === 'left' && <AlignLeft className="w-3 h-3" />}
                                        {align === 'center' && <AlignCenter className="w-3 h-3" />}
                                        {align === 'right' && <AlignRight className="w-3 h-3" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </span>
                }>
                    <textarea
                        value={p.listSection.content.join('\n')}
                        onChange={e => set({ listSection: { ...p.listSection, content: e.target.value.split('\n') } })}
                        rows={5}
                        placeholder="Enter items (one per line)..."
                        className={`${inputClass} resize-none font-mono`}
                    />
                </Field>
            </SectionCard>
        </div>
    );
};
