import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const INSTAGRAM_URL = 'https://instagram.com/stampica_studio';

// Drop poster images into /public/carousel/ and list them here.
// Any aspect ratio works — they're displayed as portrait cards.
const CAROUSEL_IMAGES: string[] = [
  // '/carousel/poster-1.jpg',
  // '/carousel/poster-2.jpg',
];

export function Landing() {
  const { user } = useAuth();
  const hasImages = CAROUSEL_IMAGES.length > 0;
  // Duplicate for seamless infinite loop
  const track = hasImages ? [...CAROUSEL_IMAGES, ...CAROUSEL_IMAGES] : [];

  return (
    <div className="min-h-full bg-neutral-950 text-white flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
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

      {/* Carousel */}
      <div className="w-full overflow-hidden border-t border-neutral-800 py-8 bg-neutral-950">
        {hasImages ? (
          <div className="flex animate-carousel" style={{ width: 'max-content' }}>
            {track.map((src, i) => (
              <div
                key={i}
                className="flex-shrink-0 mx-3 w-40 md:w-52 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900"
                style={{ aspectRatio: '1 / 1.414' }}
              >
                <img
                  src={src}
                  alt={`Poster ${(i % CAROUSEL_IMAGES.length) + 1}`}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        ) : (
          // Placeholder row shown until images are added
          <div className="flex gap-3 px-4 justify-center flex-wrap opacity-30">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-40 md:w-52 rounded-xl border border-neutral-800 bg-neutral-900"
                style={{ aspectRatio: '1 / 1.414' }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="h-8" />
    </div>
  );
}
