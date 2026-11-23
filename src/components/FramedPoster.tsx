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

/**
 * A poster in a thin black frame, as if hung on a wall. No mat: the print runs
 * edge to edge so paper effects (glue, folds, crumples) reach the frame.
 */
export function FramedPoster({ src, alt = '', className = '', style, weight = 'thin', eager = false }: FramedPosterProps) {
    const frame = weight === 'thin' ? 'p-[5px]' : 'p-2';
    return (
        <div className={`bg-ink ${frame} shadow-sheet ${className}`} style={style}>
            <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} draggable={false} className="block w-full h-auto bg-white" />
        </div>
    );
}
