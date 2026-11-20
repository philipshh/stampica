import { useState } from 'react';
import { BeforeAfter } from '../components/BeforeAfter';
import { HowItWorksVideo } from '../components/HowItWorksVideo';
import { FramedPoster } from '../components/FramedPoster';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useT } from '../contexts/LanguageContext';
import { DIGITAL_PRICE_CENTS, formatPrice } from '../../shared/pricing';
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

// ── Component ─────────────────────────────────────────────────────────────────
export function Landing() {
  const { user } = useAuth();
  const { t } = useT();
  // A different trio of showcase posters on every visit
  const [featured] = useState(() => [...SHOWCASE].sort(() => Math.random() - 0.5).slice(0, 3));

  const source = CAROUSEL_IMAGES;

  const steps = [
    { img: '/how/step-upload.jpg', title: t('howStep1Title'), text: t('howStep1Text') },
    { img: '/how/step-effect.jpg', title: t('howStep2Title'), text: t('howStep2Text') },
    { img: '/showcase/ana-marko.jpg', framed: true, title: t('howStep3Title'), text: t('howStep3Text') },
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

          {/* Gallery wall: one larger frame beside a column of two, hung straight */}
          <div className="hidden md:flex items-center justify-center gap-7 h-[520px]">
            <div className="w-[230px] animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <FramedPoster src={featured[0]} eager className="poster-lift" />
            </div>
            <div className="w-[170px] flex flex-col gap-7">
              <div className="animate-fade-up" style={{ animationDelay: '0.45s' }}>
                <FramedPoster src={featured[1]} eager className="poster-lift" />
              </div>
              <div className="animate-fade-up" style={{ animationDelay: '0.6s' }}>
                <FramedPoster src={featured[2]} eager className="poster-lift" />
              </div>
            </div>
          </div>

          {/* Phones: two frames side by side */}
          <div className="md:hidden flex items-center justify-center gap-4">
            <div className="w-[46%] animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <FramedPoster src={featured[0]} eager />
            </div>
            <div className="w-[38%] animate-fade-up" style={{ animationDelay: '0.45s' }}>
              <FramedPoster src={featured[1]} eager />
            </div>
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
              <img src={item} alt="" width={150} height={212} decoding="async"
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
            after="/showcase/kiki-poster-look.jpg"
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
        <h2 className="font-display font-extrabold text-4xl md:text-5xl mb-10 md:mb-14 tracking-[-0.02em]">
          {t('howItWorksTitle')}
        </h2>
        <div className="mb-16 md:mb-20">
          <HowItWorksVideo title={t('howItWorksTitle')} playLabel={t('videoPlay')} pauseLabel={t('videoPause')} muteLabel={t('videoMute')} unmuteLabel={t('videoUnmute')} />
        </div>
        <div className="grid md:grid-cols-3 gap-12 md:gap-10">
          {steps.map((step, i) => (
            <div key={i} className="flex md:flex-col gap-5 md:gap-0 items-start">
              <div className="relative flex-shrink-0 w-24 md:w-40 md:mb-6">
                {/* Steps 1-2 are real editor screens; step 3 is the print, framed */}
                <div
                  className={step.framed ? 'bg-ink p-1.5 md:p-2 shadow-sheet' : 'bg-white p-1.5 shadow-card border border-line rounded-sm'}
                  style={{ transform: `rotate(${i === 1 ? 1.5 : -1.5}deg)` }}
                >
                  <div className={step.framed ? 'bg-white p-2 md:p-3' : ''}>
                    <img
                      src={step.img}
                      alt=""
                      width={160}
                      height={213}
                      loading="lazy"
                      className="w-full h-auto"
                    />
                  </div>
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
              <span className="font-display font-extrabold text-6xl tracking-[-0.03em]">{formatPrice(DIGITAL_PRICE_CENTS)}</span>
              <span className="text-ink-soft">{t('pricingPerDesign')}</span>
            </p>
          </div>

          <div className="no-scrollbar flex sm:grid sm:grid-cols-3 gap-x-8 sm:gap-y-12 overflow-x-auto sm:overflow-visible snap-x snap-mandatory scroll-px-6 -mx-6 px-6 sm:mx-0 sm:px-0 pb-2">
            {SIZE_FAMILIES.map(family => {
              const sizes = sizesInFamily(family.id);
              const ratio = sizes[0].widthMm / sizes[0].heightMm;
              return (
                <div key={family.id} className="flex flex-col shrink-0 w-[46%] sm:w-auto snap-start">
                  <div className="h-36 flex items-end mb-7">
                    <div className="relative h-full" style={{ aspectRatio: `${ratio}` }}>
                      <div className="absolute inset-0 bg-white border border-ink/20 shadow-card flex flex-col items-center justify-center text-center px-1">
                        <span className="font-display font-extrabold text-base leading-tight tracking-[-0.01em]">{family.label}</span>
                        {family.label !== family.ratio.replace(/ /g, '') && (
                          <span className="mt-0.5 text-[11px] text-ink-faint whitespace-nowrap">{family.ratio}</span>
                        )}
                      </div>
                      {/* Dimension lines, like a technical drawing */}
                      <div className="absolute inset-x-0 -bottom-4 h-2 border-x border-ink/40" aria-hidden="true">
                        <div className="absolute inset-x-0 top-1/2 border-t border-ink/40" />
                      </div>
                      <div className="absolute inset-y-0 -right-4 w-2 border-y border-ink/40" aria-hidden="true">
                        <div className="absolute inset-y-0 left-1/2 border-l border-ink/40" />
                      </div>
                    </div>
                  </div>
                  <ul className="text-sm text-ink-soft leading-relaxed">
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
