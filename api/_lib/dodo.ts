import DodoPayments from 'dodopayments';

// Env:
//   DODO_PAYMENTS_API_KEY       secret key (dodo_test_… or dodo_live_…)
//   DODO_PAYMENTS_WEBHOOK_KEY   webhook signing secret (whsec_…)
//   DODO_PAYMENTS_ENVIRONMENT   'test_mode' | 'live_mode' (defaults to test_mode)
//   DODO_PRODUCT_ID             the "Poster design (digital download)" product
export function dodoEnvironment(): 'test_mode' | 'live_mode' {
  return process.env.DODO_PAYMENTS_ENVIRONMENT === 'live_mode' ? 'live_mode' : 'test_mode';
}

let client: DodoPayments | null = null;

export function getDodo(): DodoPayments {
  if (!client) {
    client = new DodoPayments({
      bearerToken: process.env.DODO_PAYMENTS_API_KEY,
      webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY ?? null,
      environment: dodoEnvironment(),
    });
  }
  return client;
}

/**
 * DODO_PRODUCT_ID is the launch-price product; DODO_REGULAR_PRODUCT_ID is the
 * regular-price one, used after the launch ends. If the regular product isn't
 * configured yet we keep charging the launch price rather than failing checkout.
 */
export function dodoProductId(launch: boolean): string {
  const launchId = process.env.DODO_PRODUCT_ID;
  if (!launchId) throw new Error('DODO_PRODUCT_ID not configured');
  if (launch) return launchId;
  const regularId = process.env.DODO_REGULAR_PRODUCT_ID;
  if (!regularId) {
    console.warn('[dodo] DODO_REGULAR_PRODUCT_ID not set; charging the launch price');
    return launchId;
  }
  return regularId;
}

/**
 * "5 poster designs" bundle products, priced at 4 designs, so the Dodo page reads
 * "5 designs × 1" instead of a confusing "quantity 4". DODO_BUNDLE_PRODUCT_ID is the
 * launch bundle, DODO_REGULAR_BUNDLE_PRODUCT_ID the regular one. Returns null when
 * not configured; checkout then falls back to charging single designs.
 */
export function dodoBundleProductId(launch: boolean): string | null {
  const launchId = process.env.DODO_BUNDLE_PRODUCT_ID || null;
  if (launch) return launchId;
  return process.env.DODO_REGULAR_BUNDLE_PRODUCT_ID || launchId;
}

/** Cart lines for n designs: whole bundles of 5, plus the remaining single designs. */
export function dodoCart(designs: number, launch: boolean, bundleSize: number, paid: number) {
  const single = dodoProductId(launch);
  const bundle = dodoBundleProductId(launch);
  if (!bundle) return [{ product_id: single, quantity: paid }];
  const bundles = Math.floor(designs / bundleSize);
  const rest = designs % bundleSize;
  return [
    ...(bundles > 0 ? [{ product_id: bundle, quantity: bundles }] : []),
    ...(rest > 0 ? [{ product_id: single, quantity: rest }] : []),
  ];
}
