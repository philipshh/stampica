import React, { useCallback } from 'react';
import { Upload } from 'lucide-react';

interface ImageUploaderProps {
    onImageUpload: (file: File) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                onImageUpload(file);
            }
        },
        [onImageUpload]
    );

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                onImageUpload(file);
            }
        },
        [onImageUpload]
    );

    return (
        <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-line rounded-xl p-12 flex flex-col items-center justify-center text-ink-soft hover:border-ink/40 hover:text-ink transition-colors cursor-pointer bg-surface/60"
            onClick={() => document.getElementById('file-input')?.click()}
        >
            <Upload className="w-12 h-12 mb-4" />
            <p className="text-lg font-medium">Drop image here or click to upload</p>
            <p className="text-sm mt-2 text-ink-faint">Supports PNG, JPG, WebP</p>
            <input
                type="file"
                id="file-input"
                className="hidden"
                accept="image/*"
                onChange={handleChange}
            />
        </div>
    );
};
