// Single source of truth for pricing, shared by the frontend and the API.
// Must match the product price set in the Dodo dashboard (DODO_PRODUCT_ID).
// Dodo converts it to the buyer's local currency at checkout.

/** One design, every size. In US cents. */
export const DIGITAL_PRICE_CENTS = 499;

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
