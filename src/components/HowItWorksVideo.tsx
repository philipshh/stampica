import { useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';

interface Props {
    playLabel: string;
    pauseLabel: string;
    title: string;
}

// Landscape cut on desktop, portrait cut on phones; only the chosen file is fetched.
// Never autoplays: a play/pause button starts it with sound.
export function HowItWorksVideo({ playLabel, pauseLabel, title }: Props) {
    const [portrait] = useState(() => !window.matchMedia('(min-width: 768px)').matches);
    const [playing, setPlaying] = useState(false);
    const [started, setStarted] = useState(false);
    const ref = useRef<HTMLVideoElement>(null);
    const name = portrait ? 'portrait' : 'landscape';

    const toggle = () => {
        const v = ref.current;
        if (!v) return;
        if (v.paused) v.play().catch(() => {});
        else v.pause();
    };

    return (
        <div className={`relative mx-auto overflow-hidden rounded-2xl border border-line bg-surface shadow-sheet ${portrait ? 'max-w-[360px]' : 'w-full'}`}
            style={{ aspectRatio: portrait ? '9 / 16' : '16 / 9' }}>
            <video
                ref={ref}
                src={`/video/how-it-works-${name}.mp4`}
                poster={`/video/how-it-works-${name}.jpg`}
                playsInline
                preload="none"
                aria-label={title}
                onPlay={() => { setPlaying(true); setStarted(true); }}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
                onClick={toggle}
                className="absolute inset-0 w-full h-full object-cover cursor-pointer"
            />
            {/* Big centred play button until the first play; a small corner control after that */}
            {!started ? (
                <button
                    onClick={toggle}
                    aria-label={playLabel}
                    className="press absolute inset-0 m-auto w-20 h-20 rounded-full bg-ink text-paper flex items-center justify-center shadow-sheet hover:bg-black transition-colors"
                >
                    <Play size={30} className="ml-1" fill="currentColor" aria-hidden="true" />
                </button>
            ) : (
                <button
                    onClick={toggle}
                    aria-label={playing ? pauseLabel : playLabel}
                    className="press absolute right-3 bottom-3 flex items-center gap-2 rounded-full bg-ink/80 text-paper px-3.5 py-2 text-xs font-medium backdrop-blur-sm hover:bg-ink transition-colors"
                >
                    {playing ? <Pause size={14} fill="currentColor" aria-hidden="true" /> : <Play size={14} fill="currentColor" aria-hidden="true" />}
                    {playing ? pauseLabel : playLabel}
                </button>
            )}
        </div>
    );
}
