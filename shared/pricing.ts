// Single source of truth for pricing, shared by the frontend and the API.
// Must match the Dodo products: DODO_PRODUCT_ID (launch price) and
// DODO_REGULAR_PRODUCT_ID (regular price, used once the launch ends).

/** One design, every size. In US cents. */
export const REGULAR_PRICE_CENTS = 699;
export const LAUNCH_PRICE_CENTS = 499;
/** Launch price ends at midnight 1 February 2027, Belgrade time. */
export const LAUNCH_ENDS_AT = Date.parse('2027-02-01T00:00:00+01:00');

export function isLaunch(now = Date.now()): boolean {
  return now < LAUNCH_ENDS_AT;
}

export function unitPriceCents(now = Date.now()): number {
  return isLaunch(now) ? LAUNCH_PRICE_CENTS : REGULAR_PRICE_CENTS;
}

/** Buy 5, pay for 4: every 5th design in the cart is free. */
export const BUNDLE_SIZE = 5;

export function freeCount(designs: number): number {
  return Math.floor(designs / BUNDLE_SIZE);
}

/** How many designs are actually charged (the Dodo quantity). */
export function paidCount(designs: number): number {
  return designs - freeCount(designs);
}

export function orderTotalCents(designs: number, now = Date.now()): number {
  return paidCount(designs) * unitPriceCents(now);
}

/**
 * Fixed prices per currency. They must match the Localized Pricing set on the
 * Dodo products (by currency). Minor units: cents for USD/EUR, para for RSD.
 */
export type Currency = 'USD' | 'EUR' | 'RSD';

const PRICES: Record<Currency, { launch: number; regular: number }> = {
  USD: { launch: 499, regular: 699 },
  EUR: { launch: 499, regular: 699 },
  RSD: { launch: 49900, regular: 69900 },
};

export function unitPrice(currency: Currency, now = Date.now()): number {
  return isLaunch(now) ? PRICES[currency].launch : PRICES[currency].regular;
}

export function regularPrice(currency: Currency): number {
  return PRICES[currency].regular;
}

export function orderTotal(designs: number, currency: Currency, now = Date.now()): number {
  return paidCount(designs) * unitPrice(currency, now);
}

/** Euro area (Bulgaria joined in 2026). Everyone else outside Serbia sees USD. */
const EURO_COUNTRIES = new Set(['AT', 'BE', 'BG', 'HR', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES']);

export function currencyForCountry(country: string | null | undefined): Currency {
  const c = (country ?? '').toUpperCase();
  if (c === 'RS') return 'RSD';
  if (EURO_COUNTRIES.has(c)) return 'EUR';
  return 'USD';
}

/** Price for display in the given currency. Language only changes the formatting. */
export function formatMoney(amount: number, currency: Currency, lang: 'en' | 'sr' = 'en'): string {
  const major = amount / 100;
  if (currency === 'RSD') {
    const n = Math.round(major).toString().replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'sr' ? '.' : ',');
    return lang === 'sr' ? `${n} din` : `${n} RSD`;
  }
  const n = lang === 'sr' ? major.toFixed(2).replace('.', ',') : major.toFixed(2);
  if (currency === 'EUR') return lang === 'sr' ? `${n} €` : `€${n}`;
  return lang === 'sr' ? `${n} $` : `$${n}`;
}
