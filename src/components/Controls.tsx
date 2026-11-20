import React from 'react';
import { DitherOptions } from '../lib/dither';
import { DesignControls } from './controls/DesignControls';
import { LayoutControls } from './controls/LayoutControls';
import { AdjustmentControls } from './controls/AdjustmentControls';
import { ProjectControls } from './controls/ProjectControls';
import { PosterProject } from '../lib/storage';
import { Download, Upload, Copy, ShoppingCart } from 'lucide-react';
import { useT } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';

interface ControlsProps {
    options: DitherOptions;
    onOptionsChange: (options: DitherOptions) => void;
    onExport: () => void;
    onCopy: () => void;
    onOrder: () => void;
    onUploadClick: () => void;
    imageDimensions: { width: number; height: number } | null;
    imageFile: File | null;
    onProjectLoad: (project: PosterProject) => void;
    isAdmin?: boolean;
    cartCount?: number;
}

export const Controls: React.FC<ControlsProps> = ({
    options,
    onOptionsChange,
    onExport,
    onCopy,
    onOrder,
    onUploadClick,
    imageDimensions,
    imageFile,
    onProjectLoad,
    isAdmin = false,
    cartCount = 0,
}) => {
    const { t } = useT();
    const [activeTab, setActiveTab] = React.useState<'design' | 'layout' | 'adjust' | 'saved'>('adjust');
    const [advanced, setAdvanced] = React.useState(() => localStorage.getItem('stampicaAdvanced') === 'true');

    const toggleAdvanced = () => {
        setAdvanced(v => {
            localStorage.setItem('stampicaAdvanced', String(!v));
            return !v;
        });
    };

    return (
        <div className="w-full md:w-80 bg-paper flex flex-col h-full text-xs md:border-r border-line">
            {/* Tabs */}
            <div className="px-3 pt-3 pb-2 flex-shrink-0">
                <div className="grid grid-cols-4 bg-line/50 rounded-lg p-1 gap-1">
                    {(['adjust', 'design', 'layout', 'saved'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-2.5 md:py-2 text-center uppercase transition-all rounded-md text-[11px] md:text-[10px] tracking-wide font-semibold ${activeTab === tab ? 'bg-surface text-ink shadow-sm' : 'text-ink-faint hover:text-ink'}`}
                        >
                            {tab === 'design' ? t('tabDesign') : tab === 'layout' ? t('tabLayout') : tab === 'adjust' ? t('tabEffects') : t('tabSaved')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scrollable content */}
            <div key={activeTab} className="flex-1 min-h-0 overflow-y-auto p-3 pt-1 space-y-3 custom-scrollbar animate-in fade-in duration-150">
                {activeTab === 'design' && (
                    <DesignControls options={options} onOptionsChange={onOptionsChange} advanced={advanced} />
                )}
                {activeTab === 'layout' && (
                    <LayoutControls options={options} onOptionsChange={onOptionsChange} imageDimensions={imageDimensions} advanced={advanced} />
                )}
                {activeTab === 'adjust' && (
                    <AdjustmentControls options={options} onOptionsChange={onOptionsChange} imageFile={imageFile} advanced={advanced} />
                )}
                {activeTab === 'saved' && (
                    <ProjectControls
                        options={options}
                        imageFile={imageFile}
                        onProjectLoad={onProjectLoad}
                        isAdmin={isAdmin}
                    />
                )}

                {/* Advanced toggle — applies to design / layout / effects tabs */}
                {activeTab !== 'saved' && (
                    <button
                        onClick={toggleAdvanced}
                        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-dashed border-line text-ink-faint hover:text-ink hover:border-ink/30 transition-colors"
                    >
                        <span className="text-[10px] uppercase tracking-[0.14em] font-semibold">{t('advancedControls')}</span>
                        <span className={`relative w-8 h-[18px] rounded-full transition-colors ${advanced ? 'bg-ink' : 'bg-line'}`}>
                            <span className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-surface shadow transition-all ${advanced ? 'left-[18px]' : 'left-[2px]'}`} />
                        </span>
                    </button>
                )}
            </div>

            {/* Footer Actions — Desktop */}
            <div className="hidden md:flex flex-col gap-2 p-3 border-t border-line bg-paper flex-shrink-0">
                <div className="flex gap-2">
                    <button
                        onClick={onUploadClick}
                        className="flex-1 bg-surface border border-line text-ink font-semibold py-2.5 rounded-full hover:border-ink/40 transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                    >
                        <Upload className="w-3.5 h-3.5" />
                        {t('tabUpload')}
                    </button>
                    <button
                        onClick={onOrder}
                        className="flex-1 bg-ink text-paper font-semibold py-2.5 rounded-full hover:bg-black transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                    >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        {t('addToCart')}
                    </button>
                </div>
                {/* View cart — shown when cart has items */}
                {cartCount > 0 && (
                    <Link
                        to="/cart"
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-full text-xs uppercase tracking-wider bg-line/60 text-ink hover:bg-line transition-colors font-semibold"
                    >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        {t('viewCart')}
                        <span className="bg-vermilion text-paper text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{cartCount}</span>
                    </Link>
                )}
                {/* Admin-only actions */}
                {isAdmin && (
                    <div className="flex gap-2">
                        <button
                            onClick={onCopy}
                            className="flex-1 bg-surface border border-line text-ink-soft hover:text-ink hover:border-ink/40 transition-colors flex items-center justify-center gap-2 py-2 rounded-full text-xs uppercase tracking-wider"
                        >
                            <Copy className="w-3.5 h-3.5" />
                            {t('copy')}
                        </button>
                        <button
                            onClick={onExport}
                            className="flex-1 bg-surface border border-line text-ink-soft hover:text-ink hover:border-ink/40 transition-colors flex items-center justify-center gap-2 py-2 rounded-full text-xs uppercase tracking-wider"
                        >
                            <Download className="w-3.5 h-3.5" />
                            {t('export')}
                        </button>
                    </div>
                )}
            </div>

            {/* Footer Actions — Mobile */}
            <div className="flex md:hidden gap-2 border-t border-line flex-shrink-0 bg-paper px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                <button
                    onClick={onUploadClick}
                    className="press flex-1 h-12 flex items-center justify-center gap-2 rounded-full border border-line bg-surface text-ink text-sm font-semibold"
                >
                    <Upload className="w-4 h-4" />
                    {t('tabUpload')}
                </button>
                <button
                    onClick={onOrder}
                    className="press flex-[1.4] h-12 flex items-center justify-center gap-2 rounded-full bg-ink text-paper text-sm font-semibold"
                >
                    <ShoppingCart className="w-4 h-4" />
                    {t('addToCart')}
                </button>
                {isAdmin && (
                    <>
                        <div className="w-px bg-line" />
                        <button
                            onClick={onCopy}
                            className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-ink-soft hover:text-ink hover:bg-line/40 transition-colors"
                        >
                            <Copy className="w-4 h-4" />
                            <span className="text-[8px] uppercase tracking-widest">{t('copy')}</span>
                        </button>
                        <div className="w-px bg-line" />
                        <button
                            onClick={onExport}
                            className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-ink-soft hover:text-ink hover:bg-line/40 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            <span className="text-[8px] uppercase tracking-widest">{t('export')}</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
