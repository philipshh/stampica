import React from 'react';

interface FramedPosterProps {
    src: string;
    alt?: string;
    className?: string;
    style?: React.CSSProperties;
    /** thin = hero and wall thumbnails, regular = large views */
    weight?: 'thin' | 'regular';
    eager?: boolean;
}

/** A poster in a thin black frame with a white mat, as if hung on a wall. */
export function FramedPoster({ src, alt = '', className = '', style, weight = 'thin', eager = false }: FramedPosterProps) {
    const frame = weight === 'thin' ? 'p-[5px]' : 'p-2';
    const mat = weight === 'thin' ? 'p-2' : 'p-3 md:p-4';
    return (
        <div className={`bg-ink ${frame} shadow-sheet ${className}`} style={style}>
            <div className={`bg-white ${mat}`}>
                <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} draggable={false} className="block w-full h-auto" />
            </div>
        </div>
    );
}
