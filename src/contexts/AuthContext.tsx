import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  picture?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const TOKEN_KEY = 'stampica_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      try {
        // Decode JWT payload (no verification — server will verify on each request)
        const payload = JSON.parse(atob(stored.split('.')[1]));
        const isExpired = payload.exp * 1000 < Date.now();
        if (!isExpired) {
          setToken(stored);
          const picture = localStorage.getItem('stampica_picture') ?? undefined;
          setUser({ id: payload.userId, email: payload.email, name: payload.name, role: payload.role, picture });
        } else {
          localStorage.removeItem(TOKEN_KEY);
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  async function loginWithGoogle(idToken: string) {
    // Extract picture from Google's credential token before sending to backend
    let picture: string | undefined;
    try {
      const googlePayload = JSON.parse(atob(idToken.split('.')[1]));
      picture = googlePayload.picture;
      if (picture) localStorage.setItem('stampica_picture', picture);
    } catch {}

    const res = await fetch(`${API_BASE}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (!res.ok) {
      const { error } = (await res.json()) as { error: string };
      throw new Error(error ?? 'Login failed');
    }

    const { token: jwt, user: userData } = (await res.json()) as {
      token: string;
      user: AuthUser;
    };

    localStorage.setItem(TOKEN_KEY, jwt);
    setToken(jwt);
    setUser({ ...userData, picture });
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('stampica_picture');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
