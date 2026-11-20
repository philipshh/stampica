import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface Props {
    soundOnLabel: string;
    soundOffLabel: string;
    title: string;
}

// Landscape cut on desktop, portrait cut on phones; only the chosen file is fetched.
// Plays muted while on screen (browsers only autoplay muted) and pauses off screen.
export function HowItWorksVideo({ soundOnLabel, soundOffLabel, title }: Props) {
    const [portrait] = useState(() => !window.matchMedia('(min-width: 768px)').matches);
    const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const [muted, setMuted] = useState(true);
    const ref = useRef<HTMLVideoElement>(null);
    const name = portrait ? 'portrait' : 'landscape';

    useEffect(() => {
        const v = ref.current;
        if (!v || reduced) return;
        const io = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) v.play().catch(() => {});
            else v.pause();
        }, { threshold: 0.4 });
        io.observe(v);
        return () => io.disconnect();
    }, [reduced]);

    const toggleSound = () => {
        const v = ref.current;
        if (!v) return;
        v.muted = !v.muted;
        setMuted(v.muted);
        if (!v.muted && v.paused) v.play().catch(() => {});
    };

    return (
        <div className={`relative mx-auto overflow-hidden rounded-2xl border border-line bg-surface shadow-sheet ${portrait ? 'max-w-[360px]' : 'w-full'}`}
            style={{ aspectRatio: portrait ? '9 / 16' : '16 / 9' }}>
            <video
                ref={ref}
                src={`/video/how-it-works-${name}.mp4`}
                poster={`/video/how-it-works-${name}.jpg`}
                muted
                loop
                playsInline
                preload="none"
                controls={reduced}
                aria-label={title}
                className="absolute inset-0 w-full h-full object-cover"
            />
            {!reduced && (
                <button
                    onClick={toggleSound}
                    aria-label={muted ? soundOnLabel : soundOffLabel}
                    className="press absolute right-3 bottom-3 flex items-center gap-2 rounded-full bg-ink/80 text-paper px-3.5 py-2 text-xs font-medium backdrop-blur-sm hover:bg-ink transition-colors"
                >
                    {muted ? <VolumeX size={15} aria-hidden="true" /> : <Volume2 size={15} aria-hidden="true" />}
                    {muted ? soundOnLabel : soundOffLabel}
                </button>
            )}
        </div>
    );
}
