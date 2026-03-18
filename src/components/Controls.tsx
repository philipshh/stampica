import React from 'react';
import { DitherOptions } from '../lib/dither';
import { DesignControls } from './controls/DesignControls';
import { LayoutControls } from './controls/LayoutControls';
import { AdjustmentControls } from './controls/AdjustmentControls';
import { ProjectControls } from './controls/ProjectControls';
import { PosterProject } from '../lib/storage';
import { Download, Upload, Copy } from 'lucide-react';

interface ControlsProps {
    options: DitherOptions;
    onOptionsChange: (options: DitherOptions) => void;
    onExport: () => void;
    onCopy: () => void;
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
    onUploadClick,
    imageDimensions,
    imageFile,
    onProjectLoad,
    isAdmin = false
}) => {


    const [activeTab, setActiveTab] = React.useState<'design' | 'layout' | 'adjust' | 'saved'>('design');

    return (
        <div className="w-full md:w-80 bg-black flex flex-col h-full text-xs md:border-r border-neutral-800" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Header: logo (desktop only) + tabs */}
            <div className="px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 border-b border-neutral-800 flex-shrink-0">
                <div className="hidden md:flex justify-center items-center mb-6">
                    <img src="/logo.png" alt="Stampica" className="h-10 w-auto object-contain" />
                </div>

                {/* Tabs */}
                <div className="grid grid-cols-4 border border-neutral-800 rounded p-1 gap-1">
                    {(['design', 'layout', 'adjust', 'saved'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-2 text-center uppercase transition-colors rounded-sm text-[8px] ${activeTab === tab ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'}`}
                        >
                            {tab === 'adjust' ? 'Effects' : tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-8 custom-scrollbar">
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
                    />
                )}
            </div>

            {/* Footer Actions */}
            {/* Desktop: single row */}
            <div className="hidden md:flex items-center gap-2 p-4 border-t border-neutral-800 bg-black flex-shrink-0">
                <button
                    onClick={onUploadClick}
                    className="flex-1 bg-neutral-900 text-white font-bold py-3 rounded uppercase tracking-widest hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 text-xs"
                >
                    <Upload className="w-4 h-4" />
                    Upload Image
                </button>
                <button
                    onClick={onCopy}
                    className="w-10 h-10 rounded bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors flex items-center justify-center flex-shrink-0"
                    title="Copy Image"
                >
                    <Copy className="w-4 h-4" />
                </button>
                {isAdmin && (
                    <button
                        onClick={onExport}
                        className="w-10 h-10 rounded bg-white text-black hover:bg-neutral-200 transition-colors flex items-center justify-center flex-shrink-0"
                        title="Download"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Mobile: compact horizontal row */}
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
                    onClick={onCopy}
                    className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
                >
                    <Copy className="w-4 h-4" />
                    <span className="text-[8px] uppercase tracking-widest">Copy</span>
                </button>
                <div className="w-px bg-neutral-800" />
                <button
                    onClick={onExport}
                    className="flex-1 flex flex-col items-center justify-center gap-1 py-3 bg-white text-black hover:bg-neutral-200 transition-colors"
                >
                    <Download className="w-4 h-4" />
                    <span className="text-[8px] uppercase tracking-widest font-bold">Download</span>
                </button>
            </div>
        </div>
    );
};
