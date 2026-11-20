import { useEffect, useRef } from 'react';
import { ChevronsLeftRight } from 'lucide-react';

interface BeforeAfterProps {
    before: string;
    after: string;
    beforeLabel: string;
    afterLabel: string;
    ariaLabel: string;
    width: number;
    height: number;
}

// Drag (or arrow keys) to reveal the poster over the original photo.
// Position lives in a CSS variable so dragging never re-renders React.
export function BeforeAfter({ before, after, beforeLabel, afterLabel, ariaLabel, width, height }: BeforeAfterProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const posRef = useRef(50);
    const hintRaf = useRef<number>();

    const setPos = (value: number) => {
        const v = Math.max(0, Math.min(100, value));
        posRef.current = v;
        const el = rootRef.current;
        if (!el) return;
        el.style.setProperty('--pos', `${v}%`);
        el.setAttribute('aria-valuenow', String(Math.round(v)));
    };

    const cancelHint = () => {
        if (hintRaf.current) cancelAnimationFrame(hintRaf.current);
        hintRaf.current = undefined;
    };

    // One-time hint when first visible: glide from mostly-poster to the middle.
    useEffect(() => {
        const el = rootRef.current;
        if (!el) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setPos(50);
            return;
        }
        setPos(82);
        const io = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            io.disconnect();
            const start = performance.now();
            const from = posRef.current;
            const tick = (now: number) => {
                const t = Math.min(1, (now - start) / 900);
                const eased = 1 - Math.pow(1 - t, 3);
                setPos(from + (50 - from) * eased);
                if (t < 1) hintRaf.current = requestAnimationFrame(tick);
            };
            hintRaf.current = requestAnimationFrame(tick);
        }, { threshold: 0.6 });
        io.observe(el);
        return () => { io.disconnect(); cancelHint(); };
    }, []);

    const fromPointer = (clientX: number) => {
        const rect = rootRef.current!.getBoundingClientRect();
        setPos(((clientX - rect.left) / rect.width) * 100);
    };

    return (
        <div
            ref={rootRef}
            role="slider"
            tabIndex={0}
            aria-label={ariaLabel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={50}
            className="relative select-none touch-pan-y cursor-ew-resize overflow-hidden bg-white shadow-sheet border border-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion"
            style={{ aspectRatio: `${width} / ${height}`, ['--pos' as string]: '50%' }}
            onPointerDown={e => {
                cancelHint();
                e.currentTarget.setPointerCapture(e.pointerId);
                fromPointer(e.clientX);
            }}
            onPointerMove={e => {
                if (e.currentTarget.hasPointerCapture(e.pointerId)) fromPointer(e.clientX);
            }}
            onKeyDown={e => {
                const step = e.shiftKey ? 20 : 5;
                if (e.key === 'ArrowLeft') { cancelHint(); setPos(posRef.current - step); e.preventDefault(); }
                if (e.key === 'ArrowRight') { cancelHint(); setPos(posRef.current + step); e.preventDefault(); }
                if (e.key === 'Home') { cancelHint(); setPos(0); e.preventDefault(); }
                if (e.key === 'End') { cancelHint(); setPos(100); e.preventDefault(); }
            }}
        >
            <img src={before} alt="" width={width} height={height} loading="lazy" draggable={false}
                className="absolute inset-0 w-full h-full object-cover" />
            <img src={after} alt="" width={width} height={height} loading="lazy" draggable={false}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ clipPath: 'inset(0 0 0 var(--pos))', imageRendering: 'pixelated' }} />

            <span className="absolute left-3 bottom-3 px-2.5 py-1 rounded-full bg-white/90 text-ink text-xs font-medium">{beforeLabel}</span>
            <span className="absolute right-3 bottom-3 px-2.5 py-1 rounded-full bg-ink/85 text-paper text-xs font-medium">{afterLabel}</span>

            {/* Handle */}
            <div className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(20,20,18,0.15)]" style={{ left: 'var(--pos)', transform: 'translateX(-50%)' }}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-card flex items-center justify-center text-ink">
                    <ChevronsLeftRight size={18} aria-hidden="true" />
                </div>
            </div>
        </div>
    );
}
