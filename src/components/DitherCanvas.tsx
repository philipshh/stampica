import React, { useEffect, useRef } from 'react';

interface DitherCanvasProps {
    processedImage: ImageData | null;
    isProcessing?: boolean;
}

export const DitherCanvas: React.FC<DitherCanvasProps> = ({ processedImage }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (processedImage && canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = processedImage.width;
            canvas.height = processedImage.height;
            const ctx = canvas.getContext('2d')!;
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
            try { ctx.imageSmoothingEnabled = false; } catch (e) { }
            try { (ctx as any).imageSmoothingQuality = 'low'; } catch (e) { }
            ctx.putImageData(processedImage, 0, 0);
        }
    }, [processedImage]);

    return (
        <div className="relative shadow-2xl border border-neutral-800 bg-black max-w-full max-h-full flex flex-col">
            <canvas
                ref={canvasRef}
                className="block max-w-full max-h-[calc(100vh-4rem)] w-auto h-auto object-contain image-pixelated"
                style={{ imageRendering: 'pixelated' }}
            />
        </div>
    );
};
