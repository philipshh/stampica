import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useT } from '../contexts/LanguageContext';
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

// ── Sizes section: rectangles proportional to real paper sizes ────────────────
// A3 297×420mm, A4 210×297mm, A5 148×210mm
const SIZE_SPECS: { size: PosterSize; w: number }[] = [
  { size: 'A5', w: 90 },
  { size: 'A4', w: 127 },
  { size: 'A3', w: 180 },
];

/** A poster pinned to the wall with a piece of translucent tape. */
function TapedPoster({ src, rotate, className = '', width = 200, delay = 0 }: {
  src: string; rotate: number; className?: string; width?: number; delay?: number;
}) {
  return (
    <div
      className={`absolute animate-fade-up ${className}`}
      style={{ width, transform: `rotate(${rotate}deg)`, animationDelay: `${delay}s` }}
    >
      <div className="relative bg-white p-2 pb-3 shadow-sheet border border-line">
        <div
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-14 h-5 bg-vermilion/20 backdrop-blur-[1px]"
          style={{ transform: `translateX(-50%) rotate(${-rotate * 0.6}deg)` }}
        />
        <img src={src} alt="" width={width} height={Math.round(width * 1.414)} loading="eager"
          className="w-full aspect-[1/1.414] object-cover" draggable={false} />
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function Landing() {
  const { user } = useAuth();
  const { t } = useT();

  const source = CAROUSEL_IMAGES;

  const steps = [
    { img: '/carousel/poster-2.png', title: t('howStep1Title'), text: t('howStep1Text') },
    { img: '/carousel/poster-7.png', title: t('howStep2Title'), text: t('howStep2Text') },
    { img: '/carousel/poster-4.png', title: t('howStep3Title'), text: t('howStep3Text') },
  ];

  return (
    <div className="bg-paper text-ink">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-[1.1fr_1fr] gap-10 items-center min-h-[72dvh] py-16 md:py-20">
          <div className="relative z-10">
            <h1
              className="font-display font-semibold text-5xl md:text-7xl leading-[1.02] tracking-tight animate-fade-up"
              style={{ animationDelay: '0.05s' }}
            >
              {t('heroPre')}
              <em className="text-vermilion">{t('heroEm')}</em>
              {t('heroPost')}
            </h1>
            <p
              className="mt-6 text-ink-soft text-lg leading-relaxed max-w-md animate-fade-up"
              style={{ animationDelay: '0.2s' }}
            >
              {t('landingSubtitle')}
            </p>
            <div className="mt-8 flex items-center gap-4 animate-fade-up" style={{ animationDelay: '0.35s' }}>
              <Link
                to="/create"
                className="px-8 py-3.5 bg-ink text-paper font-semibold rounded-full hover:bg-black transition-colors text-base"
              >
                {t('create')}
              </Link>
              {user && (
                <Link
                  to="/orders"
                  className="px-6 py-3.5 text-ink font-medium border-b-2 border-ink/20 hover:border-ink transition-colors"
                >
                  {t('orders')}
                </Link>
              )}
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 flex items-center justify-center border border-line rounded-full hover:border-ink transition-colors text-ink"
                title="@stampica_studio on Instagram"
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
            </div>
          </div>

          {/* Taped poster collage — desktop */}
          <div className="relative hidden md:block h-[480px]">
            <TapedPoster src="/carousel/poster-3.png" rotate={-4} className="left-0 top-6" width={210} delay={0.3} />
            <TapedPoster src="/carousel/poster-6.png" rotate={3} className="left-[46%] top-24" width={200} delay={0.45} />
            <TapedPoster src="/carousel/poster-9.png" rotate={-2} className="left-[22%] top-56" width={185} delay={0.6} />
          </div>

          {/* Single taped poster — mobile */}
          <div className="relative md:hidden h-[320px] -mx-2">
            <TapedPoster src="/carousel/poster-3.png" rotate={-3} className="left-[6%] top-4" width={170} delay={0.3} />
            <TapedPoster src="/carousel/poster-6.png" rotate={4} className="right-[6%] top-16" width={160} delay={0.45} />
          </div>
        </div>
      </section>

      {/* ── Poster marquee ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-12 border-b border-line bg-canvas">
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-canvas to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-canvas to-transparent z-10 pointer-events-none" />
        <div className="flex items-start animate-marquee" style={{ width: 'max-content' }}>
          {[...source, ...source].map((item, i) => (
            <div
              key={i}
              className="flex-shrink-0 mx-3 bg-white p-1.5 shadow-card border border-line"
              style={{ width: 150, marginTop: i % 2 === 0 ? 0 : 20, transform: `rotate(${i % 3 === 0 ? -1.5 : i % 3 === 1 ? 1 : 0}deg)` }}
            >
              <img src={item} alt="" width={150} height={212} loading="lazy"
                className="w-full aspect-[1/1.414] object-cover" draggable={false} />
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-24 md:py-32 w-full">
        <h2 className="font-display font-semibold text-4xl md:text-5xl mb-14 md:mb-20 tracking-tight">
          {t('howItWorksTitle')}
        </h2>
        <div className="grid md:grid-cols-3 gap-12 md:gap-10">
          {steps.map((step, i) => (
            <div key={i} className="flex md:flex-col gap-5 md:gap-0 items-start">
              <div className="relative flex-shrink-0 w-24 md:w-40 md:mb-6">
                <div className="bg-white p-1.5 shadow-card border border-line" style={{ transform: `rotate(${i === 1 ? 1.5 : -1.5}deg)` }}>
                  <img
                    src={step.img}
                    alt=""
                    width={160}
                    height={226}
                    loading="lazy"
                    className="w-full aspect-[1/1.414] object-cover"
                  />
                </div>
                <span className="absolute -top-3 -left-3 w-9 h-9 rounded-full bg-vermilion text-paper font-display font-semibold text-sm flex items-center justify-center shadow-card">
                  {i + 1}
                </span>
              </div>
              <div>
                <h3 className="font-display font-semibold text-xl md:text-2xl mb-2">{step.title}</h3>
                <p className="text-ink-soft text-sm leading-relaxed">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Sizes & prices ───────────────────────────────────────────────── */}
      <section className="border-y border-line bg-surface">
        <div className="max-w-5xl mx-auto px-6 py-24 md:py-32 w-full">
          <h2 className="font-display font-semibold text-4xl md:text-5xl mb-14 md:mb-20 tracking-tight text-right">
            {t('pricingTitle')}
          </h2>
          <div className="flex items-end justify-center gap-6 md:gap-12">
            {SIZE_SPECS.map(({ size, w }) => (
              <div key={size} className="flex flex-col items-center gap-4">
                <div
                  className="border border-ink/25 bg-white shadow-card flex items-center justify-center"
                  style={{ width: `clamp(${w * 0.5}px, ${w / 5}vw, ${w}px)`, aspectRatio: '1 / 1.414' }}
                >
                  <span className="font-display font-semibold text-xl md:text-2xl text-ink">{size}</span>
                </div>
                <p className="text-sm md:text-base">
                  <span className="font-semibold">{SIZE_PRICE[size]}</span>{' '}
                  <span className="text-ink-faint">{t('pricingDin')}</span>
                </p>
              </div>
            ))}
          </div>
          <div className="mt-14 max-w-md mx-auto space-y-2 text-sm md:text-base">
            <div className="flex justify-between text-ink-soft">
              <span>{t('pricingFrame')}</span>
              <span className="text-ink font-medium">+{FRAME_EXTRA.black} {t('pricingDin')}</span>
            </div>
            <div className="flex justify-between text-ink-soft">
              <span>{t('pricingShipping')}</span>
              <span className="text-ink font-medium">
                {SHIPPING_COST} {t('pricingDin')} · {t('pricingFreeShipping', { amount: FREE_SHIPPING_THRESHOLD })}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="px-6 py-28 md:py-40 text-center">
        <h2 className="font-display font-semibold text-4xl md:text-6xl max-w-3xl mx-auto mb-10 leading-tight tracking-tight">
          {t('finalCtaTitle')}
        </h2>
        <Link
          to="/create"
          className="inline-block px-10 py-4 bg-ink text-paper font-semibold rounded-full hover:bg-black transition-colors text-lg"
        >
          {t('create')}
        </Link>
      </section>
    </div>
  );
}
