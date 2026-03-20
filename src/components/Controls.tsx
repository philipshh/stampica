import React from 'react';
import { DitherOptions } from '../lib/dither';
import { DesignControls } from './controls/DesignControls';
import { LayoutControls } from './controls/LayoutControls';
import { AdjustmentControls } from './controls/AdjustmentControls';
import { ProjectControls } from './controls/ProjectControls';
import { PosterProject } from '../lib/storage';
import { Download, Upload, Copy, ShoppingCart } from 'lucide-react';

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
    isAdmin = false
}) => {


    const [activeTab, setActiveTab] = React.useState<'design' | 'layout' | 'adjust' | 'saved'>('design');

    return (
        <div className="w-full md:w-80 bg-black flex flex-col h-full text-xs md:border-r border-neutral-800" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Tabs */}
            <div className="px-3 pt-3 pb-2 border-b border-neutral-800 flex-shrink-0">
                <div className="grid grid-cols-4 bg-neutral-900 rounded-lg p-1 gap-1">
                    {(['design', 'layout', 'adjust', 'saved'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-2 text-center uppercase transition-all rounded-md text-[10px] tracking-wide font-medium ${activeTab === tab ? 'bg-neutral-700 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'}`}
                        >
                            {tab === 'adjust' ? 'Effects' : tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scrollable content — key forces remount + fade on tab change */}
            <div key={activeTab} className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 custom-scrollbar animate-in fade-in duration-150">
                {activeTab === 'design' && (
                    <DesignControls options={options} onOptionsChange={onOptionsChange} />
                )}
                {activeTab === 'layout' && (
                    <LayoutControls options={options} onOptionsChange={onOptionsChange} imageDimensions={imageDimensions} />
                )}
                {activeTab === 'adjust' && (
                    <AdjustmentControls options={options} onOptionsChange={onOptionsChange} />
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
            <div className="hidden md:flex flex-col gap-2 p-3 border-t border-neutral-800 bg-black flex-shrink-0">
                {/* Primary actions */}
                <div className="flex gap-2">
                    <button
                        onClick={onUploadClick}
                        className="flex-1 bg-neutral-900 text-white font-bold py-2.5 rounded-lg hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                    >
                        <Upload className="w-3.5 h-3.5" />
                        Upload
                    </button>
                    <button
                        onClick={onOrder}
                        className="flex-1 bg-white text-black font-bold py-2.5 rounded-lg hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                    >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        Order
                    </button>
                </div>
                {/* Admin-only actions */}
                {isAdmin && (
                    <div className="flex gap-2">
                        <button
                            onClick={onCopy}
                            className="flex-1 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 py-2 rounded-lg text-xs uppercase tracking-wider"
                            title="Copy image"
                        >
                            <Copy className="w-3.5 h-3.5" />
                            Copy
                        </button>
                        <button
                            onClick={onExport}
                            className="flex-1 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 py-2 rounded-lg text-xs uppercase tracking-wider"
                            title="Download hi-res"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Download
                        </button>
                    </div>
                )}
            </div>

            {/* Footer Actions — Mobile */}
            <div className="flex md:hidden border-t border-neutral-800 flex-shrink-0">
                <button
                    onClick={onUploadClick}
                    className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
                >
                    <Upload className="w-4 h-4" />
                    <span className="text-[8px] uppercase tracking-widest">Upload</span>
                </button>
                <div className="w-px bg-neutral-800" />
                <button
                    onClick={onOrder}
                    className="flex-1 flex flex-col items-center justify-center gap-1 py-3 bg-white text-black hover:bg-neutral-200 transition-colors"
                >
                    <ShoppingCart className="w-4 h-4" />
                    <span className="text-[8px] uppercase tracking-widest font-bold">Order</span>
                </button>
                {isAdmin && (
                    <>
                        <div className="w-px bg-neutral-800" />
                        <button
                            onClick={onCopy}
                            className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
                        >
                            <Copy className="w-4 h-4" />
                            <span className="text-[8px] uppercase tracking-widest">Copy</span>
                        </button>
                        <div className="w-px bg-neutral-800" />
                        <button
                            onClick={onExport}
                            className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            <span className="text-[8px] uppercase tracking-widest">Save</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
