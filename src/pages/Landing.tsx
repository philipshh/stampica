import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useRef } from 'react';

const INSTAGRAM_URL = 'https://instagram.com/stampica_studio';

const CAROUSEL_IMAGES: string[] = [
  '/carousel/poster-1.png',
  '/carousel/poster-2.png',
  '/carousel/poster-3.png',
  '/carousel/poster-4.png',
  '/carousel/poster-5.png',
  '/carousel/poster-6.png',
  '/carousel/poster-7.png',
  '/carousel/poster-8.png',
  '/carousel/poster-9.png',
  '/carousel/poster-10.png',
  '/carousel/poster-11.png',
];

// ── Arch carousel constants ────────────────────────────────────────────────────
const R = 1200;           // ring radius in px — larger = flatter arch
const CARD_W = 160;
const CARD_H = Math.round(CARD_W * 1.414); // A4 ratio ≈ 226
const CAROUSEL_H = 340;
// Ring center is below the visible strip; cards at 12 o'clock start ~20px from top
const RING_CY = R + CARD_H / 2 + 20;
const SPEED = 360 / 130000; // degrees per ms → full revolution in ~130 s

function cardTransform(i: number, n: number, rot: number): string {
  const deg = (i / n) * 360 + rot;
  const rad = (deg * Math.PI) / 180;
  const x = Math.sin(rad) * R;
  const y = -Math.cos(rad) * R + RING_CY;
  return `translateX(${x - CARD_W / 2}px) translateY(${y - CARD_H / 2}px)`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function Landing() {
  const { user } = useAuth();

  const source = CAROUSEL_IMAGES.length > 0
    ? CAROUSEL_IMAGES
    : Array.from({ length: 10 }, (_, i) => `__ph_${i}`);

  // Triple so cards are tightly packed and the loop is seamless
  const track = [...source, ...source, ...source];

  const ringRef = useRef<HTMLDivElement>(null);
  const rotRef = useRef(0);

  useEffect(() => {
    let raf: number;
    let last: number | undefined;
    const n = track.length;

    function tick(now: number) {
      if (last !== undefined) {
        rotRef.current = (rotRef.current + (now - last) * SPEED) % 360;
      }
      last = now;

      if (ringRef.current) {
        const cards = ringRef.current.children;
        for (let i = 0; i < cards.length; i++) {
          (cards[i] as HTMLElement).style.transform = cardTransform(i, n, rotRef.current);
        }
      }

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [track.length]);

  return (
    <div className="relative min-h-full bg-neutral-950 text-white flex flex-col overflow-hidden">
      {/* Hero — bottom padding leaves room for the arch */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center"
        style={{ paddingBottom: CAROUSEL_H + 40 }}
      >
        <div className="space-y-4 max-w-xl mb-10">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-none">
            Stampica
          </h1>
          <p className="text-neutral-400 text-lg md:text-xl leading-relaxed">
            Design dithered posters, order prints — delivered to your door.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            to="/create"
            className="px-8 py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-neutral-100 transition-colors text-base"
          >
            Create poster
          </Link>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3.5 border border-neutral-700 text-white font-semibold rounded-xl hover:border-neutral-400 transition-colors text-base"
          >
            See examples
          </a>
          {user && (
            <Link
              to="/orders"
              className="px-8 py-3.5 border border-neutral-700 text-white font-semibold rounded-xl hover:border-neutral-400 transition-colors text-base"
            >
              Your orders
            </Link>
          )}
        </div>
      </div>

      {/* Arch carousel — absolutely pinned to bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none"
        style={{ height: CAROUSEL_H }}
      >
        {/* Top fade blends into hero */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-neutral-950 to-transparent z-10" />
        {/* Side fades */}
        <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-neutral-950 to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-neutral-950 to-transparent z-10" />

        {/* Cards — positioned by rAF loop */}
        <div ref={ringRef} className="absolute inset-0">
          {track.map((item, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                width: CARD_W,
                height: CARD_H,
                transform: cardTransform(i, track.length, 0),
              }}
            >
              {item.startsWith('__ph_') ? (
                <div className="w-full h-full bg-neutral-900 border border-neutral-800" />
              ) : (
                <img
                  src={item}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
