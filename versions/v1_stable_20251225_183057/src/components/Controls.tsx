import React from 'react';
import { DitherOptions } from '../lib/dither';
import { DesignControls } from './controls/DesignControls';
import { LayoutControls } from './controls/LayoutControls';
import { AdjustmentControls } from './controls/AdjustmentControls';
import { ColorControls } from './controls/ColorControls';
import { Download, Upload, Copy, Shuffle } from 'lucide-react';

interface ControlsProps {
    options: DitherOptions;
    onOptionsChange: (options: DitherOptions) => void;
    onExport: () => void;
    onCopy: () => void;
    onUploadClick: () => void;
    onMovieSelect: (movie: { title: string; director: string; year: string; plot: string; posterUrl: string; actors?: string }) => void;
    imageFile: File | null;
    onRandomizeAll: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
    options,
    onOptionsChange,
    onExport,
    onCopy,
    onUploadClick,
    onMovieSelect,
    imageFile,
    onRandomizeAll
}) => {


    const [activeTab, setActiveTab] = React.useState<'design' | 'layout' | 'adjust' | 'colors'>('design');

    return (
        <div className="w-80 bg-black flex flex-col h-full text-xs tracking-wider font-mono border-r border-neutral-800">
            <div className="p-6 border-b border-neutral-800">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-xl font-bold tracking-widest uppercase text-white">Moments</h1>
                    <button
                        onClick={onRandomizeAll}
                        className="p-2 text-neutral-500 hover:text-white transition-colors"
                        title="Randomize All"
                    >
                        <Shuffle className="w-4 h-4" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="grid grid-cols-4 border border-neutral-800 rounded p-1 gap-1">
                    <button
                        onClick={() => setActiveTab('design')}
                        className={`py-2 text-center uppercase transition-colors rounded-sm text-[10px] ${activeTab === 'design' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'}`}
                    >
                        Design
                    </button>
                    <button
                        onClick={() => setActiveTab('layout')}
                        className={`py-2 text-center uppercase transition-colors rounded-sm text-[10px] ${activeTab === 'layout' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'}`}
                    >
                        Layout
                    </button>
                    <button
                        onClick={() => setActiveTab('adjust')}
                        className={`py-2 text-center uppercase transition-colors rounded-sm text-[10px] ${activeTab === 'adjust' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'}`}
                    >
                        Effects
                    </button>
                    <button
                        onClick={() => setActiveTab('colors')}
                        className={`py-2 text-center uppercase transition-colors rounded-sm text-[10px] ${activeTab === 'colors' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'}`}
                    >
                        Colors
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {activeTab === 'design' && (
                    <DesignControls options={options} onOptionsChange={onOptionsChange} onMovieSelect={onMovieSelect} />
                )}
                {activeTab === 'layout' && (
                    <LayoutControls options={options} onOptionsChange={onOptionsChange} />
                )}
                {activeTab === 'adjust' && (
                    <AdjustmentControls options={options} onOptionsChange={onOptionsChange} />
                )}
                {activeTab === 'colors' && (
                    <ColorControls options={options} onOptionsChange={onOptionsChange} imageFile={imageFile} />
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
