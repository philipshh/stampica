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
}

export const Controls: React.FC<ControlsProps> = ({
    options,
    onOptionsChange,
    onExport,
    onCopy,
    onUploadClick,
    imageDimensions,
    imageFile,
    onProjectLoad
}) => {


    const [activeTab, setActiveTab] = React.useState<'design' | 'layout' | 'adjust' | 'saved'>('design');

    return (
        <div className="w-80 bg-black flex flex-col h-full text-xs tracking-wider font-mono border-r border-neutral-800">
            <div className="p-6 border-b border-neutral-800">
                <div className="flex justify-center items-center mb-6">
                    <img src="/logo.png" alt="Stampica" className="h-10 w-auto object-contain" />
                </div>

                {/* Tabs */}
                <div className="grid grid-cols-4 border border-neutral-800 rounded p-1 gap-1">
                    <button
                        onClick={() => setActiveTab('design')}
                        className={`py-2 text-center uppercase transition-colors rounded-sm text-[8px] ${activeTab === 'design' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'}`}
                    >
                        Design
                    </button>
                    <button
                        onClick={() => setActiveTab('layout')}
                        className={`py-2 text-center uppercase transition-colors rounded-sm text-[8px] ${activeTab === 'layout' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'}`}
                    >
                        Layout
                    </button>
                    <button
                        onClick={() => setActiveTab('adjust')}
                        className={`py-2 text-center uppercase transition-colors rounded-sm text-[8px] ${activeTab === 'adjust' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'}`}
                    >
                        Effects
                    </button>
                    <button
                        onClick={() => setActiveTab('saved')}
                        className={`py-2 text-center uppercase transition-colors rounded-sm text-[8px] ${activeTab === 'saved' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'}`}
                    >
                        Saved
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
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
            <div className="p-6 border-t border-neutral-800 space-y-3 bg-black">
                <button
                    onClick={onExport}
                    className="w-full bg-white text-black font-bold py-4 uppercase tracking-widest hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
                >
                    <Download className="w-4 h-4" />
                    Download
                </button>
                <button
                    onClick={onCopy}
                    className="w-full bg-neutral-900 text-white font-bold py-4 uppercase tracking-widest hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                >
                    <Copy className="w-4 h-4" />
                    Copy Image
                </button>
                <button
                    onClick={onUploadClick}
                    className="relative w-full bg-neutral-900 text-white font-bold py-4 uppercase tracking-widest hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 z-10"
                >
                    <Upload className="w-4 h-4" />
                    Upload Image
                </button>
            </div>
        </div >
    );
};
