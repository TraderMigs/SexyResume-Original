import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

if (!stripeSecret) throw new Error('STRIPE_SECRET_KEY is not configured');
if (!stripeWebhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET is not configured');

const stripe = new Stripe(stripeSecret, {
  appInfo: { name: 'SexyResume', version: '1.0.0' },
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    const signature = req.headers.get('stripe-signature');
    if (!signature) return new Response('No signature', { status: 400 });

    const body = await req.text();

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(`Signature failed: ${err.message}`, { status: 400 });
    }

    EdgeRuntime.waitUntil(handleEvent(event));
    return Response.json({ received: true });

  } catch (err: any) {
    console.error('Webhook error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});

async function handleEvent(event: Stripe.Event) {
  console.log(`Processing event: ${event.type} (${event.id})`);

  const stripeData = event?.data?.object ?? {};

  // Replay protection
  const { data: existingEvent } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .maybeSingle();

  if (existingEvent) {
    console.log(`Event ${event.id} already processed, skipping`);
    return;
  }

  // Log the event
  await supabase.from('webhook_events').insert({
    stripe_event_id: event.id,
    event_type: event.type,
    processed_at: new Date().toISOString(),
    customer_id: ('customer' in stripeData && typeof stripeData.customer === 'string')
      ? stripeData.customer : null,
    metadata: { livemode: event.livemode, api_version: event.api_version },
  });

  if (event.type === 'checkout.session.completed') {
    await handleCheckoutCompleted(stripeData as Stripe.Checkout.Session);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { mode, payment_status } = session;

  console.log(`Checkout completed: mode=${mode} payment_status=${payment_status}`);

  // One-time payment unlock ($7 export)
  if (mode === 'payment' && payment_status === 'paid') {
    const {
      id: checkout_session_id,
      payment_intent,
      amount_subtotal,
      amount_total,
      currency,
      customer: customerId,
      client_reference_id,
    } = session;

    // Get userId — prefer client_reference_id, fall back to customer metadata
    let userId = client_reference_id;

    if (!userId && customerId && typeof customerId === 'string') {
      try {
        const fullSession = await stripe.checkout.sessions.retrieve(checkout_session_id, {
          expand: ['customer']
        });
        userId = fullSession.metadata?.user_id || fullSession.client_reference_id;
      } catch (err) {
        console.error('Failed to retrieve full session:', err);
      }
    }

    if (!userId) {
      console.error('No userId found for checkout session', checkout_session_id);
      return;
    }

    console.log(`Unlocking export for user: ${userId}`);

    // ── CRITICAL: Write entitlement FIRST, independently ──────────────────
    const { error: entitlementError } = await supabase
      .from('user_entitlements')
      .upsert({
        user_id: userId,
        export_unlocked: true,
        export_unlocked_at: new Date().toISOString(),
        stripe_customer_id: customerId as string,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (entitlementError) {
      console.error('CRITICAL: Failed to write user_entitlements:', entitlementError);
    } else {
      console.log(`✅ Export unlocked for user ${userId}`);
    }

    // ── Record the order (non-blocking) ───────────────────────────────────
    if (customerId && typeof customerId === 'string') {
      const { error: orderError } = await supabase.from('stripe_orders').insert({
        checkout_session_id,
        payment_intent_id: typeof payment_intent === 'string' ? payment_intent : String(payment_intent ?? ''),
        customer_id: customerId,
        amount_subtotal: amount_subtotal ?? 0,
        amount_total: amount_total ?? 0,
        currency: currency ?? 'usd',
        payment_status: 'paid',
        status: 'completed',
      });
      if (orderError) console.error('stripe_orders insert error (non-blocking):', orderError);
    }

    // ── Record the receipt (non-blocking) ─────────────────────────────────
    const { error: receiptError } = await supabase.from('payment_receipts').insert({
      user_id: userId,
      stripe_customer_id: customerId as string,
      stripe_payment_intent_id: typeof payment_intent === 'string' ? payment_intent : null,
      amount: amount_total ?? 0,
      currency: currency ?? 'usd',
      status: 'succeeded',
    });
    if (receiptError) console.error('payment_receipts insert error (non-blocking):', receiptError);

  } else if (mode === 'subscription') {
    // Subscription flow
    const customerId = typeof session.customer === 'string' ? session.customer : null;
    if (customerId) await syncSubscriptionFromStripe(customerId);
  }
}

async function syncSubscriptionFromStripe(customerId: string) {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    if (subscriptions.data.length === 0) {
      await supabase.from('stripe_subscriptions').upsert(
        { customer_id: customerId, status: 'not_started' },
        { onConflict: 'customer_id' }
      );
      return;
    }

    const sub = subscriptions.data[0];
    await supabase.from('stripe_subscriptions').upsert({
      customer_id: customerId,
      subscription_id: sub.id,
      price_id: sub.items.data[0].price.id,
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
      cancel_at_period_end: sub.cancel_at_period_end,
      ...(sub.default_payment_method && typeof sub.default_payment_method !== 'string' ? {
        payment_method_brand: sub.default_payment_method.card?.brand ?? null,
        payment_method_last4: sub.default_payment_method.card?.last4 ?? null,
      } : {}),
      status: sub.status,
    }, { onConflict: 'customer_id' });

  } catch (err) {
    console.error('syncSubscriptionFromStripe error:', err);
  }
}
