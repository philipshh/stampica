import { useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface Props {
    playLabel: string;
    pauseLabel: string;
    muteLabel: string;
    unmuteLabel: string;
    title: string;
}

// Landscape cut on desktop, portrait cut on phones; only the chosen file is fetched.
// Never autoplays, and always starts muted; play/pause and sound are separate controls.
export function HowItWorksVideo({ playLabel, pauseLabel, muteLabel, unmuteLabel, title }: Props) {
    const [portrait] = useState(() => !window.matchMedia('(min-width: 768px)').matches);
    const [playing, setPlaying] = useState(false);
    const [started, setStarted] = useState(false);
    const [muted, setMuted] = useState(true);
    const ref = useRef<HTMLVideoElement>(null);
    const name = portrait ? 'portrait' : 'landscape';

    const togglePlay = () => {
        const v = ref.current;
        if (!v) return;
        if (v.paused) v.play().catch(() => {});
        else v.pause();
    };

    const toggleMute = () => {
        const v = ref.current;
        if (!v) return;
        v.muted = !v.muted;
        setMuted(v.muted);
    };

    const pill = 'press flex items-center gap-2 rounded-full bg-ink/80 text-paper px-3.5 py-2 text-xs font-medium backdrop-blur-sm hover:bg-ink transition-colors';

    return (
        <div className={`relative mx-auto overflow-hidden rounded-2xl border border-line bg-surface shadow-sheet ${portrait ? '' : 'w-full'}`}
            // Portrait: never taller than the visible screen under the top bar
            style={portrait
                ? { aspectRatio: '9 / 16', width: 'min(100%, 360px, calc((100dvh - 120px) * 9 / 16))' }
                : { aspectRatio: '16 / 9' }}>
            <video
                ref={ref}
                src={`/video/how-it-works-${name}.mp4`}
                poster={`/video/how-it-works-${name}.jpg`}
                muted
                playsInline
                preload="none"
                aria-label={title}
                onPlay={() => { setPlaying(true); setStarted(true); }}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
                onClick={togglePlay}
                className="absolute inset-0 w-full h-full object-cover cursor-pointer"
            />
            {!started && (
                <button
                    onClick={togglePlay}
                    aria-label={playLabel}
                    className="press absolute inset-0 m-auto w-20 h-20 rounded-full bg-ink text-paper flex items-center justify-center shadow-sheet hover:bg-black transition-colors"
                >
                    <Play size={30} className="ml-1" fill="currentColor" aria-hidden="true" />
                </button>
            )}
            <div className="absolute right-3 bottom-3 flex gap-2">
                {started && (
                    <button onClick={togglePlay} aria-label={playing ? pauseLabel : playLabel} className={pill}>
                        {playing ? <Pause size={14} fill="currentColor" aria-hidden="true" /> : <Play size={14} fill="currentColor" aria-hidden="true" />}
                        {playing ? pauseLabel : playLabel}
                    </button>
                )}
                <button onClick={toggleMute} aria-label={muted ? unmuteLabel : muteLabel} aria-pressed={!muted} className={pill}>
                    {muted ? <VolumeX size={14} aria-hidden="true" /> : <Volume2 size={14} aria-hidden="true" />}
                    {muted ? unmuteLabel : muteLabel}
                </button>
            </div>
        </div>
    );
}
