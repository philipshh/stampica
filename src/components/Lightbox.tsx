import { useEffect, useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface LightboxProps {
  src?: string;
  srcs?: string[];
  initialIndex?: number;
  alt?: string;
  onClose: () => void;
}

export function Lightbox({ src, srcs, initialIndex = 0, alt = 'Preview', onClose }: LightboxProps) {
  const images = srcs ?? (src ? [src] : []);
  const [idx, setIdx] = useState(Math.min(initialIndex, Math.max(0, images.length - 1)));
  const touchStartX = useRef<number | null>(null);

  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);
  const multi = images.length > 1;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (multi && e.key === 'ArrowLeft') prev();
      if (multi && e.key === 'ArrowRight') next();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, multi]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) dx < 0 ? next() : prev();
    touchStartX.current = null;
  }

  if (images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 text-white transition-colors z-10"
      >
        <X size={18} />
      </button>

      {multi && (
        <button
          onClick={e => { e.stopPropagation(); prev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-white transition-colors z-10"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      <img
        src={images[idx]}
        alt={alt}
        className="max-h-[90vh] max-w-[90vw] object-contain shadow-2xl"
        onClick={e => e.stopPropagation()}
      />

      {multi && (
        <button
          onClick={e => { e.stopPropagation(); next(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-white transition-colors z-10"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {multi && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); setIdx(i); }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
