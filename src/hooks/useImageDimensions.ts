import { useState, useEffect } from 'react';

export function useImageDimensions(imageFile: File | null): { width: number; height: number } | null {
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

    useEffect(() => {
        if (!imageFile) {
            setImageDimensions(null);
            return;
        }

        const url = URL.createObjectURL(imageFile);
        const img = new Image();
        img.onload = () => {
            setImageDimensions({ width: img.width, height: img.height });
            URL.revokeObjectURL(url);
        };
        img.src = url;
    }, [imageFile]);

    return imageDimensions;
}
