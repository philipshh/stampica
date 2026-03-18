import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme: string;
              size: string;
              shape: string;
              text: string;
            },
          ) => void;
        };
      };
    };
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

export function GoogleLoginButton({ onSuccess }: { onSuccess?: () => void }) {
  const { loginWithGoogle } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) {
      setError('Google login is not configured (missing client ID).');
      return;
    }

    function initGSI() {
      if (!window.google || !buttonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async ({ credential }) => {
          setError(null);
          setIsLoading(true);
          try {
            await loginWithGoogle(credential);
            onSuccess?.();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
          } finally {
            setIsLoading(false);
          }
        },
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text: 'continue_with',
      });
    }

    if (window.google) {
      initGSI();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = initGSI;
    script.onerror = () => setError('Failed to load Google sign-in. Check your connection.');
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, [loginWithGoogle, onSuccess]);

  return (
    <div className="flex flex-col items-center gap-3">
      {isLoading ? (
        <div className="text-sm text-neutral-500 dark:text-neutral-400">Signing in…</div>
      ) : (
        <div ref={buttonRef} />
      )}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg max-w-xs text-center">
          {error}
        </p>
      )}
    </div>
  );
}
