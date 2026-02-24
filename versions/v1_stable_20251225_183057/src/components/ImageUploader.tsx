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
            className="border-2 border-dashed border-neutral-700 rounded-xl p-12 flex flex-col items-center justify-center text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer bg-neutral-900/50"
            onClick={() => document.getElementById('file-input')?.click()}
        >
            <Upload className="w-12 h-12 mb-4" />
            <p className="text-lg font-medium">Drop image here or click to upload</p>
            <p className="text-sm mt-2 text-neutral-500">Supports PNG, JPG, WebP</p>
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
