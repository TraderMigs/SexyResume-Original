import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { sentry, initSentry } from '../shared/sentry.ts';

// Initialize Sentry for error monitoring
initSentry();

// Rate limiting for webhook endpoint
const webhookRateLimit = new Map<string, number[]>();

function checkWebhookRateLimit(identifier: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  const requests = webhookRateLimit.get(identifier) || [];
  const recentRequests = requests.filter(time => time > windowStart);
  
  if (recentRequests.length >= maxRequests) {
    return false;
  }
  
  recentRequests.push(now);
  webhookRateLimit.set(identifier, recentRequests);
  return true;
}

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  try {
    // Rate limiting check
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkWebhookRateLimit(clientIP)) {
      return new Response('Rate limit exceeded', { 
        status: 429,
        headers: { 'Retry-After': '60' }
      });
    }

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // get the signature from the header
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('No signature found', { status: 400 });
    }

    // get the raw body
    const body = await req.text();

    // verify the webhook signature
    let event: Stripe.Event;

    try {
      // Use Stripe's official verification method
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);

      // Log security event for failed webhook verification
      console.error('SECURITY: Invalid webhook signature attempt', {
        ip: clientIP,
        signature: signature?.substring(0, 20) + '...',
        timestamp: new Date().toISOString()
      });

      // Send security alert to Sentry
      sentry.captureMessage(
        'Webhook signature verification failed',
        'error',
        {
          function_name: 'stripe-webhook',
          ip: clientIP,
          error_type: 'signature_verification_failed'
        }
      );

      return new Response(`Webhook signature verification failed: ${error.message}`, { status: 400 });
    }

    EdgeRuntime.waitUntil(handleEvent(event));

    return Response.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);

    // Send error to Sentry
    sentry.captureException(error as Error, {
      function_name: 'stripe-webhook',
      error_stage: 'webhook_processing'
    });

    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleEvent(event: Stripe.Event) {
  const stripeData = event?.data?.object ?? {};

  if (!stripeData) {
    return;
  }

  // CRITICAL: Check for duplicate events (replay protection)
  const { data: existingEvent } = await supabase
    .from('webhook_events')
    .select('id, processed_at')
    .eq('stripe_event_id', event.id)
    .maybeSingle();

  if (existingEvent) {
    console.warn(`⚠️ Duplicate event detected: ${event.id}`);
    console.warn(`Originally processed at: ${existingEvent.processed_at}`);
    console.warn('Ignoring duplicate event (replay protection)');
    return;
  }

  // Log the event immediately to prevent race conditions
  const { error: logError } = await supabase
    .from('webhook_events')
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      processed_at: new Date().toISOString(),
      customer_id: ('customer' in stripeData && typeof stripeData.customer === 'string')
        ? stripeData.customer
        : null,
      metadata: {
        livemode: event.livemode,
        api_version: event.api_version,
      }
    });

  if (logError) {
    // If we can't log the event, it might be a race condition (duplicate insert)
    // This is acceptable - the unique constraint will prevent duplicate processing
    console.warn('Event logging failed (possibly duplicate):', logError);
    return;
  }

  console.info(`✅ Event logged: ${event.id} (${event.type})`);

  if (!('customer' in stripeData)) {
    return;
  }

  // for one time payments, we only listen for the checkout.session.completed event
  if (event.type === 'payment_intent.succeeded' && event.data.object.invoice === null) {
    return;
  }

  const { customer: customerId } = stripeData;

  if (!customerId || typeof customerId !== 'string') {
    console.error(`No customer received on event: ${JSON.stringify(event)}`);
  } else {
    let isSubscription = true;

    if (event.type === 'checkout.session.completed') {
      const { mode } = stripeData as Stripe.Checkout.Session;

      isSubscription = mode === 'subscription';

      console.info(`Processing ${isSubscription ? 'subscription' : 'one-time payment'} checkout session`);
    }

    const { mode, payment_status } = stripeData as Stripe.Checkout.Session;

    if (isSubscription) {
      console.info(`Starting subscription sync for customer: ${customerId}`);
      await syncCustomerFromStripe(customerId);
    } else if (mode === 'payment' && payment_status === 'paid') {
      try {
        // Extract the necessary information from the session
        const {
          id: checkout_session_id,
          payment_intent,
          amount_subtotal,
          amount_total,
          currency,
          client_reference_id,
        } = stripeData as Stripe.Checkout.Session;

        // Get user_id from session metadata
        let userId = client_reference_id;

        // If not in client_reference_id, fetch full session to get metadata
        if (!userId) {
          try {
            const fullSession = await stripe.checkout.sessions.retrieve(checkout_session_id, {
              expand: ['customer']
            });
            userId = fullSession.metadata?.user_id || fullSession.client_reference_id;
          } catch (err) {
            console.error('Failed to retrieve session metadata:', err);
          }
        }

        if (!userId) {
          console.error('No user_id found in session. Cannot update entitlement.');
          console.error('Session ID:', checkout_session_id);
          return;
        }

        console.info(`Processing payment for user: ${userId}`);

        // Insert the order into the stripe_orders table
        const { error: orderError } = await supabase.from('stripe_orders').insert({
          checkout_session_id,
          payment_intent_id: payment_intent,
          customer_id: customerId,
          amount_subtotal,
          amount_total,
          currency,
          payment_status,
          status: 'completed',
        });

        if (orderError) {
          console.error('Error inserting order:', orderError);
          return;
        }

        // CRITICAL FIX: Update user entitlement to unlock exports
        const { error: entitlementError } = await supabase
          .from('user_entitlements')
          .upsert({
            user_id: userId,
            export_unlocked: true,
            export_unlocked_at: new Date().toISOString(),
            stripe_customer_id: customerId,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          });

        if (entitlementError) {
          console.error('CRITICAL: Failed to update entitlement:', entitlementError);
          // Continue to log receipt even if entitlement fails
        } else {
          console.info(`✅ Entitlement unlocked for user: ${userId}`);
        }

        // Log payment receipt for accounting
        const { error: receiptError } = await supabase
          .from('payment_receipts')
          .insert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_payment_intent_id: payment_intent as string,
            stripe_checkout_session_id: checkout_session_id,
            amount: amount_total,
            currency,
            status: 'succeeded',
            created_at: new Date().toISOString(),
          });

        if (receiptError) {
          console.error('Error logging payment receipt:', receiptError);
        } else {
          console.info(`✅ Payment receipt logged for user: ${userId}`);
        }

        console.info(`✅ Successfully processed one-time payment for session: ${checkout_session_id}`);
      } catch (error) {
        console.error('Error processing one-time payment:', error);
      }
    }
  }
}

// based on the excellent https://github.com/t3dotgg/stripe-recommendations
async function syncCustomerFromStripe(customerId: string) {
  try {
    // fetch latest subscription data from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    // TODO verify if needed
    if (subscriptions.data.length === 0) {
      console.info(`No active subscriptions found for customer: ${customerId}`);
      const { error: noSubError } = await supabase.from('stripe_subscriptions').upsert(
        {
          customer_id: customerId,
          subscription_status: 'not_started',
        },
        {
          onConflict: 'customer_id',
        },
      );

      if (noSubError) {
        console.error('Error updating subscription status:', noSubError);
        throw new Error('Failed to update subscription status in database');
      }
    }

    // assumes that a customer can only have a single subscription
    const subscription = subscriptions.data[0];

    // store subscription state
    const { error: subError } = await supabase.from('stripe_subscriptions').upsert(
      {
        customer_id: customerId,
        subscription_id: subscription.id,
        price_id: subscription.items.data[0].price.id,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        ...(subscription.default_payment_method && typeof subscription.default_payment_method !== 'string'
          ? {
              payment_method_brand: subscription.default_payment_method.card?.brand ?? null,
              payment_method_last4: subscription.default_payment_method.card?.last4 ?? null,
            }
          : {}),
        status: subscription.status,
      },
      {
        onConflict: 'customer_id',
      },
    );

    if (subError) {
      console.error('Error syncing subscription:', subError);
      throw new Error('Failed to sync subscription in database');
    }
    console.info(`Successfully synced subscription for customer: ${customerId}`);
  } catch (error) {
    console.error(`Failed to sync subscription for customer ${customerId}:`, error);
    throw error;
  }
}