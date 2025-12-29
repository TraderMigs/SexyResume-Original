import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { sentry, initSentry } from '../shared/sentry.ts';

initSentry();

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

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

if (!stripeSecret) {
  throw new Error('STRIPE_SECRET_KEY is not configured');
}

if (!stripeWebhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
}

const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'SexyResume',
    version: '1.0.0',
  },
});

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  try {
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkWebhookRateLimit(clientIP)) {
      return new Response('Rate limit exceeded', { 
        status: 429,
        headers: { 'Retry-After': '60' }
      });
    }

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('No signature found', { status: 400 });
    }

    const body = await req.text();

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
    } catch (error: any) {
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

  const { data: existingEvent } = await supabase
    .from('webhook_events')
    .select('id, processed_at')
    .eq('stripe_event_id', event.id)
    .maybeSingle();

  if (existingEvent) {
    return;
  }

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
    return;
  }

  if (!('customer' in stripeData)) {
    return;
  }

  if (event.type === 'payment_intent.succeeded' && event.data.object.invoice === null) {
    return;
  }

  const { customer: customerId } = stripeData;

  if (!customerId || typeof customerId !== 'string') {
    return;
  } else {
    let isSubscription = true;

    if (event.type === 'checkout.session.completed') {
      const { mode } = stripeData as Stripe.Checkout.Session;
      isSubscription = mode === 'subscription';
    }

    const { mode, payment_status } = stripeData as Stripe.Checkout.Session;

    if (isSubscription) {
      await syncCustomerFromStripe(customerId);
    } else if (mode === 'payment' && payment_status === 'paid') {
      try {
        const {
          id: checkout_session_id,
          payment_intent,
          amount_subtotal,
          amount_total,
          currency,
          client_reference_id,
        } = stripeData as Stripe.Checkout.Session;

        let userId = client_reference_id;

        if (!userId) {
          try {
            const fullSession = await stripe.checkout.sessions.retrieve(checkout_session_id, {
              expand: ['customer']
            });
            userId = fullSession.metadata?.user_id || fullSession.client_reference_id;
          } catch (err) {
            return;
          }
        }

        if (!userId) {
          return;
        }

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
          return;
        }

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
      } catch (error) {
        return;
      }
    }
  }
}

async function syncCustomerFromStripe(customerId: string) {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    if (subscriptions.data.length === 0) {
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
        throw new Error('Failed to update subscription status in database');
      }
    }

    const subscription = subscriptions.data[0];

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
      throw new Error('Failed to sync subscription in database');
    }
  } catch (error) {
    throw error;
  }
}
```

---

## 📍 **STEP 4: COMMIT**

Scroll down, type commit message:
```
Add webhook secret validation and fix app name
