import React from 'react';
import { DitherOptions } from '../lib/dither';
import { DesignControls } from './controls/DesignControls';
import { LayoutControls } from './controls/LayoutControls';
import { AdjustmentControls } from './controls/AdjustmentControls';
import { ProjectControls } from './controls/ProjectControls';
import { PosterProject } from '../lib/storage';
import { Download, Copy, ShoppingCart } from 'lucide-react';
import { useT } from '../contexts/LanguageContext';

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
}) => {
    const { t } = useT();
    const [activeTab, setActiveTab] = React.useState<'design' | 'layout' | 'adjust' | 'saved'>('adjust');

    return (
        <div className="w-full md:w-80 bg-paper flex flex-col h-full text-xs md:border-r border-line">
            {/* Tabs */}
            <div className="px-3 pt-3 pb-2 flex-shrink-0">
                {/* 'saved' (drafts) is hidden for now: the cart already keeps designs until checkout */}
                <div className="flex gap-2 items-stretch">
                <div className="flex-1 grid grid-cols-3 bg-line/50 rounded-lg p-1 gap-1">
                    {(['adjust', 'design', 'layout'] as const).map(tab => (
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
            </div>

            {/* Scrollable content */}
            <div key={activeTab} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 pt-1 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-3 space-y-3 custom-scrollbar animate-in fade-in duration-150">
                {activeTab === 'design' && (
                    <DesignControls options={options} onOptionsChange={onOptionsChange} onUploadClick={onUploadClick} hasImage={!!imageFile} />
                )}
                {activeTab === 'layout' && (
                    <LayoutControls options={options} onOptionsChange={onOptionsChange} imageDimensions={imageDimensions} />
                )}
                {activeTab === 'adjust' && (
                    <AdjustmentControls options={options} onOptionsChange={onOptionsChange} imageFile={imageFile} />
                )}
                {activeTab === 'saved' && (
                    <ProjectControls
                        options={options}
                        imageFile={imageFile}
                        onProjectLoad={onProjectLoad}
                        isAdmin={isAdmin}
                    />
                )}

            </div>

            {/* Footer Actions — Desktop */}
            <div className="hidden md:flex flex-col gap-2 p-3 border-t border-line bg-paper flex-shrink-0">
                <div className="flex gap-2">
                    <button
                        onClick={onOrder}
                        className="flex-1 bg-ink text-paper font-semibold py-2.5 rounded-full hover:bg-black transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                    >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        {t('addToCart')}
                    </button>
                </div>
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
            {isAdmin && (
            <div className="flex md:hidden gap-2 border-t border-line flex-shrink-0 bg-paper px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                {(
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
            )}
        </div>
    );
};
