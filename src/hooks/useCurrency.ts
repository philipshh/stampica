import { useEffect, useState } from 'react';
import { API_BASE } from '../lib/api';
import { currencyForCountry, type Currency } from '../../shared/pricing';

// The currency follows the visitor's country (as Dodo charges), not the site language.
const KEY = 'stampica_currency';
const VALID: Currency[] = ['USD', 'EUR', 'RSD'];

function initialGuess(): Currency {
  try {
    const forced = new URLSearchParams(window.location.search).get('currency')?.toUpperCase() as Currency | undefined;
    if (forced && VALID.includes(forced)) return forced;
    const stored = localStorage.getItem(KEY) as Currency | null;
    if (stored && VALID.includes(stored)) return stored;
  } catch { /* storage blocked */ }
  return Intl.DateTimeFormat().resolvedOptions().timeZone === 'Europe/Belgrade' ? 'RSD' : 'USD';
}

let current: Currency | null = null;
let lookup: Promise<Currency> | null = null;

function detect(): Promise<Currency> {
  if (!lookup) {
    lookup = fetch(`${API_BASE}/api/health`)
      .then(r => r.json())
      .then((d: { country?: string | null }) => {
        if (!d.country) return current ?? initialGuess();
        const c = currencyForCountry(d.country);
        try { localStorage.setItem(KEY, c); } catch { /* ignore */ }
        return c;
      })
      .catch(() => current ?? initialGuess());
  }
  return lookup;
}

export function useCurrency(): Currency {
  const [currency, setCurrency] = useState<Currency>(() => (current ??= initialGuess()));
  useEffect(() => {
    // A ?currency= override in the URL wins (handy for checking each price)
    if (new URLSearchParams(window.location.search).has('currency')) return;
    let alive = true;
    detect().then(c => { current = c; if (alive) setCurrency(c); });
    return () => { alive = false; };
  }, []);
  return currency;
}
