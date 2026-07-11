import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useT } from '../contexts/LanguageContext';
import { useEffect, useRef } from 'react';
import { SIZE_PRICE, FRAME_EXTRA, SHIPPING_COST, FREE_SHIPPING_THRESHOLD, PosterSize } from '../../shared/pricing';

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
const R = 1200;           // ring radius in px, larger = flatter arch
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

// ── Sizes section: rectangles proportional to real paper sizes ────────────────
// A3 297×420mm, A4 210×297mm, A5 148×210mm
const SIZE_SPECS: { size: PosterSize; w: number }[] = [
  { size: 'A5', w: 90 },
  { size: 'A4', w: 127 },
  { size: 'A3', w: 180 },
];

// ── Component ─────────────────────────────────────────────────────────────────
export function Landing() {
  const { user } = useAuth();
  const { t } = useT();

  const source = CAROUSEL_IMAGES.length > 0
    ? CAROUSEL_IMAGES
    : Array.from({ length: 10 }, (_, i) => `__ph_${i}`);

  // Triple so cards are tightly packed and the loop is seamless
  const track = [...source, ...source, ...source];

  const ringRef = useRef<HTMLDivElement>(null);
  const rotRef = useRef(0);

  useEffect(() => {
    const n = track.length;

    // Respect reduced motion: render the arch statically, no rotation loop
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (ringRef.current) {
        const cards = ringRef.current.children;
        for (let i = 0; i < cards.length; i++) {
          (cards[i] as HTMLElement).style.transform = cardTransform(i, n, 0);
        }
      }
      return;
    }

    let raf: number;
    let last: number | undefined;

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

  const steps = [
    { img: '/carousel/poster-2.png', title: t('howStep1Title'), text: t('howStep1Text') },
    { img: '/carousel/poster-7.png', title: t('howStep2Title'), text: t('howStep2Text') },
    { img: '/carousel/poster-4.png', title: t('howStep3Title'), text: t('howStep3Text') },
  ];

  return (
    <div className="bg-neutral-950 text-white">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col min-h-[100dvh] overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-start md:justify-center px-6 pt-[100px] pb-12 md:pt-20 md:pb-[380px] text-center">
          <div className="space-y-4 max-w-xl mb-10">
            <img
              src="/logo-text.svg"
              alt="Stampica"
              className="w-52 md:w-80 max-w-full mx-auto animate-fade-up"
              style={{ animationDelay: '0.05s' }}
            />
            <p
              className="text-neutral-400 text-lg md:text-xl leading-relaxed animate-fade-up"
              style={{ animationDelay: '0.2s' }}
            >
              {t('landingSubtitle')}
            </p>
          </div>

          <div
            className="flex items-center gap-3 animate-fade-up"
            style={{ animationDelay: '0.35s' }}
          >
            <Link
              to="/create"
              className="px-8 py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-neutral-100 transition-colors text-base"
            >
              {t('create')}
            </Link>

            {user && (
              <Link
                to="/orders"
                className="px-8 py-3.5 border border-neutral-700 text-white font-semibold rounded-xl hover:border-neutral-400 transition-colors text-base"
              >
                {t('orders')}
              </Link>
            )}

            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 flex items-center justify-center border border-neutral-700 rounded-xl hover:border-neutral-400 transition-colors text-white"
              title="@stampica_studio on Instagram"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
          </div>
        </div>

        {/* Arch carousel — desktop only (rAF-driven) */}
        <div
          className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none hidden md:block animate-fade-up"
          style={{ height: CAROUSEL_H, animationDelay: '0.5s' }}
        >
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-neutral-950 to-transparent z-10" />
          <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-neutral-950 to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-neutral-950 to-transparent z-10" />

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
                  <img src={item} alt="" width={CARD_W} height={CARD_H} loading="lazy" className="w-full h-full object-cover" draggable={false} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile marquee — in flow below the hero content, no CTA overlap */}
        <div
          className="md:hidden relative overflow-hidden pointer-events-none animate-fade-up"
          style={{ height: '38vh', animationDelay: '0.5s' }}
        >
          <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-neutral-950 to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-neutral-950 to-transparent z-10" />
          <div className="flex items-start animate-marquee" style={{ width: 'max-content' }}>
            {[...source, ...source].map((item, i) => (
              <div
                key={i}
                className="flex-shrink-0 mx-2"
                style={{
                  width: '220px',
                  height: 'calc(220px * 1.414)',
                  marginTop: i % 2 === 0 ? 0 : 32,
                }}
              >
                {item.startsWith('__ph_') ? (
                  <div className="w-full h-full bg-neutral-900 border border-neutral-800" />
                ) : (
                  <img src={item} alt="" width={220} height={311} loading="lazy" className="w-full h-full object-cover" draggable={false} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-24 md:py-32 w-full">
        <h2 className="font-display font-bold text-3xl md:text-5xl mb-14 md:mb-20">
          {t('howItWorksTitle')}
        </h2>
        <div className="grid md:grid-cols-3 gap-12 md:gap-10">
          {steps.map((step, i) => (
            <div key={i} className="flex md:flex-col gap-5 md:gap-0 items-start">
              <div className="relative flex-shrink-0 w-24 md:w-40 md:mb-6">
                <img
                  src={step.img}
                  alt=""
                  width={160}
                  height={226}
                  loading="lazy"
                  className="w-full aspect-[1/1.414] object-cover rounded-sm"
                />
                <span className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-cream text-neutral-950 font-display font-bold text-sm flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <div>
                <h3 className="font-display font-bold text-lg md:text-xl mb-2">{step.title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Sizes & prices ───────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-24 md:py-32 w-full">
        <h2 className="font-display font-bold text-3xl md:text-5xl mb-14 md:mb-20 text-right">
          {t('pricingTitle')}
        </h2>
        <div className="flex items-end justify-center gap-6 md:gap-12">
          {SIZE_SPECS.map(({ size, w }) => (
            <div key={size} className="flex flex-col items-center gap-4">
              <div
                className="border border-neutral-600 bg-neutral-900 flex items-center justify-center"
                style={{ width: `clamp(${w * 0.5}px, ${w / 5}vw, ${w}px)`, aspectRatio: '1 / 1.414' }}
              >
                <span className="font-display font-bold text-xl md:text-2xl text-cream">{size}</span>
              </div>
              <p className="text-sm md:text-base">
                <span className="font-semibold">{SIZE_PRICE[size]}</span>{' '}
                <span className="text-neutral-500">{t('pricingDin')}</span>
              </p>
            </div>
          ))}
        </div>
        <div className="mt-14 max-w-md mx-auto space-y-2 text-sm md:text-base">
          <div className="flex justify-between text-neutral-400">
            <span>{t('pricingFrame')}</span>
            <span className="text-white">+{FRAME_EXTRA.black} {t('pricingDin')}</span>
          </div>
          <div className="flex justify-between text-neutral-400">
            <span>{t('pricingShipping')}</span>
            <span className="text-white">
              {SHIPPING_COST} {t('pricingDin')} · {t('pricingFreeShipping', { amount: FREE_SHIPPING_THRESHOLD })}
            </span>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="px-6 py-28 md:py-40 text-center">
        <h2 className="font-display font-bold text-3xl md:text-6xl max-w-3xl mx-auto mb-10 leading-tight">
          {t('finalCtaTitle')}
        </h2>
        <Link
          to="/create"
          className="inline-block px-10 py-4 bg-white text-black font-semibold rounded-xl hover:bg-neutral-100 transition-colors text-lg"
        >
          {t('create')}
        </Link>
      </section>
    </div>
  );
}
