import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const INSTAGRAM_URL = 'https://instagram.com/stampica.studio';

export function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-full bg-neutral-950 text-white flex flex-col items-center justify-center px-6 py-20 text-center">
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
  );
}
