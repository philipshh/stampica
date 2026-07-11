// Single source of truth for pricing (RSD).
// Used by the frontend (Cart, Checkout) and the API (order totals, emails).

export type PosterSize = 'A5' | 'A4' | 'A3';
export type FrameOption = 'none' | 'black' | 'white';

export const SIZE_PRICE: Record<PosterSize, number> = { A5: 700, A4: 900, A3: 1100 };
export const FRAME_EXTRA: Record<FrameOption, number> = { none: 0, black: 1000, white: 1000 };
export const SHIPPING_COST = 200;
export const FREE_SHIPPING_THRESHOLD = 4000;

export interface PricedItem {
  size: string;
  frame: string;
  quantity: number;
}

export function itemPrice(item: PricedItem): number {
  const size = SIZE_PRICE[item.size as PosterSize] ?? 0;
  const frame = FRAME_EXTRA[item.frame as FrameOption] ?? 0;
  return (size + frame) * item.quantity;
}

export function orderTotals(items: PricedItem[]) {
  const subtotal = items.reduce((sum, item) => sum + itemPrice(item), 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  return { subtotal, shipping, total: subtotal + shipping };
}
