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

export function dodoProductId(): string {
  const id = process.env.DODO_PRODUCT_ID;
  if (!id) throw new Error('DODO_PRODUCT_ID not configured');
  return id;
}
