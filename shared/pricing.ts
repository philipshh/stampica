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
 * Rough USD->RSD rate for showing Serbian visitors a dinar figure. Display only:
 * the charge is always in USD and Dodo/the bank converts it. Update now and then.
 */
export const USD_TO_RSD = 100;

/** Price for display. Serbian shows an approximate dinar amount, rounded to 10. */
export function formatPrice(cents: number, lang: 'en' | 'sr' = 'en'): string {
  if (lang === 'sr') return `≈ ${Math.round((cents / 100) * USD_TO_RSD / 10) * 10} RSD`;
  return `$${(cents / 100).toFixed(2)}`;
}
