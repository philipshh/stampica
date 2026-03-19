import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const INSTAGRAM_URL = 'https://instagram.com/stampica_studio';

// Drop poster images into /public/carousel/ and list them here.
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

// Placeholders used when no real images are configured
const PLACEHOLDERS = [
  'from-neutral-800 to-neutral-900',
  'from-neutral-700 to-neutral-900',
  'from-neutral-800 to-neutral-950',
  'from-neutral-600 to-neutral-900',
  'from-neutral-800 to-neutral-800',
  'from-neutral-700 to-neutral-800',
  'from-neutral-800 to-neutral-900',
  'from-neutral-700 to-neutral-950',
];

export function Landing() {
  const { user } = useAuth();

  const source = CAROUSEL_IMAGES.length > 0 ? CAROUSEL_IMAGES : PLACEHOLDERS;
  // Duplicate for seamless infinite loop
  const track = [...source, ...source];

  return (
    <div className="relative min-h-full bg-neutral-950 text-white flex flex-col overflow-hidden">
      {/* Hero — extra bottom padding leaves visual room for the carousel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 pb-52 text-center">
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

      {/* Carousel — absolutely pinned to the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-52 overflow-hidden pointer-events-none">
        {/* Top-to-bottom fade so cards blend into the background */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-neutral-950 to-transparent z-10" />
        {/* Left / right edge fades */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-neutral-950 to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-neutral-950 to-transparent z-10" />

        <div
          className="flex items-start animate-carousel pointer-events-auto"
          style={{ width: 'max-content', willChange: 'transform', paddingTop: '16px' }}
        >
          {track.map((item, i) => {
            const isReal = CAROUSEL_IMAGES.length > 0;
            const isEven = i % 2 === 0;

            return (
              <div
                key={i}
                className="flex-shrink-0 mx-2 w-28 md:w-36 rounded-xl overflow-hidden border border-neutral-800"
                style={{
                  aspectRatio: '1 / 1.414',
                  marginTop: isEven ? '0px' : '28px',
                }}
              >
                {isReal ? (
                  <img
                    src={item}
                    alt=""
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${item}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
