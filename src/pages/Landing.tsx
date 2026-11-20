import { useState } from 'react';
import { BeforeAfter } from '../components/BeforeAfter';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useT } from '../contexts/LanguageContext';
import { DIGITAL_PRICE } from '../../shared/pricing';
import { POSTER_SIZES, SIZE_FAMILIES, sizesInFamily } from '../lib/posterSizes';

const INSTAGRAM_URL = 'https://instagram.com/stampica_studio';

// Real-photo showcase posters (rendered by /dev/posters) and the original
// movie posters, interleaved so the marquee shows both directions.
const SHOWCASE = ['ana-marko', 'luna', 'hram', 'mila-luka', 'wildflowers', 'kiki', 'durmitor', 'bella', 'max', 'zemun', 'sava', 'baby', 'petrovic', 'pobednik', 'alps', 'deda', 'knez', 'jelena-maja', 'rex', 'louise', 'buba']
  .map(id => `/showcase/${id}.jpg`);
const MOVIE_POSTERS = Array.from({ length: 11 }, (_, i) => `/carousel/poster-${i + 1}.png`);
// Effect names stay untranslated: they match the labels in the editor
const LOOKS: { id: string; label?: string; big?: boolean }[] = [
  { id: 'kiki-ascii', big: true },
  { id: 'kiki-halftone', label: 'Halftone' },
  { id: 'kiki-pop', label: 'Threshold' },
  { id: 'kiki-lines', label: 'Lines' },
  { id: 'kiki-film', label: 'Atkinson' },
];
const CAROUSEL_IMAGES: string[] = SHOWCASE.flatMap((src, i) => (MOVIE_POSTERS[i] ? [src, MOVIE_POSTERS[i]] : [src]));

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
          className="w-full h-auto" draggable={false} />
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function Landing() {
  const { user } = useAuth();
  const { t } = useT();
  // A different trio of showcase posters on every visit
  const [featured] = useState(() => [...SHOWCASE].sort(() => Math.random() - 0.5).slice(0, 3));

  const source = CAROUSEL_IMAGES;

  const steps = [
    { img: '/showcase/max.jpg', title: t('howStep1Title'), text: t('howStep1Text') },
    { img: '/showcase/durmitor.jpg', title: t('howStep2Title'), text: t('howStep2Text') },
    { img: '/showcase/sava.jpg', title: t('howStep3Title'), text: t('howStep3Text') },
  ];

  return (
    <div className="bg-paper text-ink">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-[1.1fr_1fr] gap-10 items-center min-h-[72dvh] py-16 md:py-20">
          <div className="relative z-10">
            <h1
              className="font-display font-extrabold text-5xl md:text-7xl leading-[1.1] tracking-[-0.03em] pb-1 animate-fade-up"
              style={{ animationDelay: '0.05s' }}
            >
              {t('heroPre')}
              <em className="text-vermilion italic">{t('heroEm')}</em>
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
                className="press px-8 py-3.5 bg-ink text-paper font-semibold rounded-full hover:bg-black transition-colors text-base"
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
            <TapedPoster src={featured[0]} rotate={-4} className="left-0 top-6" width={210} delay={0.3} />
            <TapedPoster src={featured[1]} rotate={3} className="left-[46%] top-24" width={200} delay={0.45} />
            <TapedPoster src={featured[2]} rotate={-2} className="left-[22%] top-56" width={185} delay={0.6} />
          </div>

          {/* Single taped poster — mobile */}
          <div className="relative md:hidden h-[320px] -mx-2">
            <TapedPoster src={featured[0]} rotate={-3} className="left-[6%] top-4" width={170} delay={0.3} />
            <TapedPoster src={featured[1]} rotate={4} className="right-[6%] top-16" width={160} delay={0.45} />
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
                className="w-full h-auto" draggable={false} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Before / after ─────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-24 md:py-32 w-full grid md:grid-cols-[1fr_1.1fr] gap-12 md:gap-20 items-center">
        <div className="md:order-2 max-w-md">
          <h2 className="font-display font-extrabold text-4xl md:text-5xl tracking-[-0.02em] leading-[1.05]">
            {t('beforeAfterTitle')}
          </h2>
          <p className="mt-5 text-ink-soft text-base md:text-lg leading-relaxed">{t('beforeAfterText')}</p>
          <Link to="/create" className="press mt-8 inline-block px-8 py-3.5 bg-ink text-paper font-semibold rounded-full hover:bg-black transition-colors">
            {t('create')}
          </Link>
        </div>
        <div className="md:order-1 w-full max-w-[420px] mx-auto md:mx-0">
          <BeforeAfter
            before="/showcase/kiki-photo.jpg"
            after="/showcase/kiki-dither.jpg"
            beforeLabel={t('photoLabel')}
            afterLabel={t('posterLabel')}
            ariaLabel={t('beforeAfterAria')}
            width={640}
            height={960}
          />
        </div>
      </section>

      {/* ── One photo, many looks ──────────────────────────────────────── */}
      <section className="bg-surface border-y border-line">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32 w-full">
          <h2 className="font-display font-extrabold text-4xl md:text-6xl tracking-[-0.03em] leading-[1.02] max-w-2xl">
            {t('onePhotoTitle')}
          </h2>
          <p className="mt-5 text-ink-soft text-base md:text-lg leading-relaxed max-w-[48ch]">{t('onePhotoText')}</p>
          <div className="mt-14 grid grid-cols-2 md:grid-cols-12 gap-x-5 gap-y-10 items-start">
            {LOOKS.map((look, i) => (
              <figure
                key={look.id}
                className={look.big ? 'col-span-2 md:col-span-6 md:row-span-2' : `md:col-span-3 ${i % 2 ? 'md:mt-16' : ''}`}
              >
                <div className="poster-lift bg-white p-1.5 border border-line shadow-card">
                  <img src={`/showcase/${look.id}.jpg`} alt="" width={480} height={680} loading="lazy" className="w-full h-auto" />
                </div>
                <figcaption className="mt-3 text-sm text-ink-soft">{look.label ?? t('looksAscii')}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-24 md:py-32 w-full">
        <h2 className="font-display font-extrabold text-4xl md:text-5xl mb-14 md:mb-20 tracking-[-0.02em]">
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
                    className="w-full h-auto"
                  />
                </div>
                <span className="absolute -top-3 -left-3 w-9 h-9 rounded-full bg-vermilion text-paper font-display font-bold text-sm flex items-center justify-center shadow-card">
                  {i + 1}
                </span>
              </div>
              <div>
                <h3 className="font-display font-bold text-xl md:text-2xl mb-2 tracking-[-0.01em]">{step.title}</h3>
                <p className="text-ink-soft text-sm leading-relaxed">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Sizes & prices ───────────────────────────────────────────────── */}
      <section className="border-y border-line bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32 w-full grid md:grid-cols-[0.9fr_1.1fr] gap-14 md:gap-16 items-center">
          <div>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl tracking-[-0.02em] leading-[1.05]">
              {t('pricingDigitalTitle')}
            </h2>
            <p className="mt-5 text-ink-soft text-base md:text-lg leading-relaxed max-w-[42ch]">
              {t('pricingDigitalText', { count: POSTER_SIZES.length })}
            </p>
            <p className="mt-8 flex items-baseline gap-2">
              <span className="font-display font-extrabold text-6xl tracking-[-0.03em]">{DIGITAL_PRICE}</span>
              <span className="text-ink-soft">{t('pricingPerDesign')}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-x-5 gap-y-10">
            {SIZE_FAMILIES.map(family => {
              const sizes = sizesInFamily(family.id);
              const ratio = sizes[0].widthMm / sizes[0].heightMm;
              return (
                <div key={family.id} className="flex flex-col">
                  <div className="h-24 flex items-end mb-4">
                    <div
                      className="bg-white border border-ink/20 shadow-card"
                      style={{ height: '100%', aspectRatio: `${ratio}` }}
                    />
                  </div>
                  <p className="font-display font-bold text-lg tracking-[-0.01em]">{family.label}</p>
                  <ul className="mt-1 text-sm text-ink-soft leading-relaxed">
                    {sizes.map(sz => <li key={sz.id} className="whitespace-nowrap">{sz.label}</li>)}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="px-6 py-28 md:py-40 text-center bg-vermilion text-ink">
        <h2 className="font-display font-extrabold text-4xl md:text-6xl max-w-3xl mx-auto mb-10 leading-[1.05] tracking-[-0.03em]">
          {t('finalCtaTitle')}
        </h2>
        <Link
          to="/create"
          className="press inline-block px-10 py-4 bg-ink text-paper font-semibold rounded-full hover:bg-black transition-colors text-lg"
        >
          {t('create')}
        </Link>
      </section>
    </div>
  );
}
