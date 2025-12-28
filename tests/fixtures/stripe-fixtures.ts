/**
 * Stripe test fixtures for E2E testing
 * Uses Stripe CLI test mode fixtures for predictable behavior
 *
 * Reference: https://stripe.com/docs/testing
 */

/**
 * Stripe test card numbers
 */
export const STRIPE_TEST_CARDS = {
  // Successful payment
  SUCCESS: '4242424242424242',
  // Requires authentication (3D Secure)
  AUTHENTICATION: '4000002500003155',
  // Declined card
  DECLINED: '4000000000000002',
  // Insufficient funds
  INSUFFICIENT_FUNDS: '4000000000009995',
} as const;

/**
 * Stripe test checkout session data
 */
export interface StripeTestCheckoutSession {
  id: string;
  customer: string;
  payment_intent: string;
  payment_status: string;
  amount_total: number;
  currency: string;
  mode: string;
  client_reference_id?: string;
}

/**
 * Generate a test checkout session for webhook testing
 */
export function generateTestCheckoutSession(userId: string): StripeTestCheckoutSession {
  const timestamp = Date.now();
  return {
    id: `cs_test_${timestamp}`,
    customer: `cus_test_${timestamp}`,
    payment_intent: `pi_test_${timestamp}`,
    payment_status: 'paid',
    amount_total: 700, // $7.00 in cents
    currency: 'usd',
    mode: 'payment',
    client_reference_id: userId,
  };
}

/**
 * Generate Stripe webhook event for testing
 */
export function generateStripeWebhookEvent(
  type: string,
  data: any,
  eventId?: string
): any {
  return {
    id: eventId || `evt_test_${Date.now()}`,
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: data,
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: `req_${Date.now()}`,
      idempotency_key: null,
    },
    type,
  };
}

/**
 * Stripe checkout.session.completed event
 */
export function generateCheckoutSessionCompletedEvent(
  userId: string,
  eventId?: string
) {
  const session = generateTestCheckoutSession(userId);
  return generateStripeWebhookEvent(
    'checkout.session.completed',
    session,
    eventId
  );
}

/**
 * Test webhook signature generation
 * Note: In actual tests, use Stripe CLI to forward webhooks
 */
export function generateTestWebhookSignature(
  payload: string,
  timestamp: number,
  secret: string
): string {
  // This is a placeholder - real signatures require HMAC SHA256
  // In actual tests, use Stripe CLI to generate real signatures
  return `t=${timestamp},v1=test_signature_${Date.now()}`;
}

/**
 * Stripe test mode tokens
 */
export const STRIPE_TEST_TOKENS = {
  // Test publishable key (placeholder)
  PUBLISHABLE_KEY: 'pk_test_51234567890',
  // Test secret key (placeholder)
  SECRET_KEY: 'sk_test_51234567890',
  // Test webhook secret (placeholder)
  WEBHOOK_SECRET: 'whsec_test_51234567890',
} as const;

/**
 * Expected entitlement after successful payment
 */
export interface ExpectedEntitlement {
  userId: string;
  hasPaid: boolean;
  paymentProvider: 'stripe';
  stripeCustomerId: string;
  amount: number;
  currency: string;
  paidAt: string;
}

/**
 * Generate expected entitlement for verification
 */
export function generateExpectedEntitlement(
  userId: string,
  session: StripeTestCheckoutSession
): ExpectedEntitlement {
  return {
    userId,
    hasPaid: true,
    paymentProvider: 'stripe',
    stripeCustomerId: session.customer,
    amount: session.amount_total,
    currency: session.currency,
    paidAt: new Date().toISOString(),
  };
}
