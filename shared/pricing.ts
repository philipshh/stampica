// Single source of truth for pricing, shared by the frontend and the API.
// Must match the product price set in the Dodo dashboard (DODO_PRODUCT_ID).
// Dodo converts it to the buyer's local currency at checkout.

/** One design, every size. In US cents. */
export const DIGITAL_PRICE_CENTS = 499;

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
