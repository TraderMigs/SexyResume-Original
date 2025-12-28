import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')
const PAYMENT_CONFIG = {
  priceId: Deno.env.get('STRIPE_PRICE_ID') || 'price_1234567890',
  productName: 'Resume+CoverLetter Export',
  amount: 700, // $7.00 in cents
  currency: 'usd'
}

interface CreateCheckoutRequest {
  successUrl: string
  cancelUrl: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const action = pathParts[pathParts.length - 1]

    switch (action) {
      case 'checkout':
        return await createCheckoutSession(req, supabaseClient)
      
      case 'webhook':
        return await handleWebhook(req, supabaseClient)
      
      case 'entitlement':
        return await getEntitlement(req, supabaseClient)
      
      default:
        throw new Error('Invalid endpoint')
    }

  } catch (error) {
    console.error('Payment error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function createCheckoutSession(req: Request, supabaseClient: any) {
  if (!STRIPE_SECRET_KEY) {
    throw new Error('Stripe not configured')
  }

  // Get user from auth header
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    throw new Error('No authorization header')
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  const { successUrl, cancelUrl }: CreateCheckoutRequest = await req.json()

  if (!successUrl || !cancelUrl) {
    throw new Error('Success and cancel URLs are required')
  }

  // Check if user already has export unlocked
  const { data: entitlement } = await supabaseClient
    .from('user_entitlements')
    .select('export_unlocked')
    .eq('user_id', user.id)
    .single()

  if (entitlement?.export_unlocked) {
    throw new Error('Export already unlocked for this user')
  }

  // Create Stripe checkout session
  const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      'mode': 'payment',
      'line_items[0][price]': PAYMENT_CONFIG.priceId,
      'line_items[0][quantity]': '1',
      'success_url': successUrl,
      'cancel_url': cancelUrl,
      'client_reference_id': user.id,
      'customer_email': user.email || '',
      'expires_at': Math.floor((Date.now() + 30 * 60 * 1000) / 1000).toString(), // 30 minutes
      'metadata[user_id]': user.id,
      'metadata[product_name]': PAYMENT_CONFIG.productName,
    }),
  })

  if (!stripeResponse.ok) {
    const error = await stripeResponse.text()
    throw new Error(`Stripe error: ${error}`)
  }

  const session = await stripeResponse.json()

  // Store checkout session in database
  const { error: dbError } = await supabaseClient
    .from('checkout_sessions')
    .insert({
      user_id: user.id,
      stripe_session_id: session.id,
      amount: PAYMENT_CONFIG.amount,
      currency: PAYMENT_CONFIG.currency,
      success_url: successUrl,
      cancel_url: cancelUrl,
      expires_at: new Date(session.expires_at * 1000).toISOString()
    })

  if (dbError) {
    console.error('Failed to store checkout session:', dbError)
  }

  return new Response(
    JSON.stringify({
      sessionId: session.id,
      url: session.url,
      expiresAt: new Date(session.expires_at * 1000).toISOString()
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
}

async function handleWebhook(req: Request, supabaseClient: any) {
  if (!STRIPE_WEBHOOK_SECRET) {
    throw new Error('Webhook secret not configured')
  }

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    throw new Error('No Stripe signature')
  }

  // Verify webhook signature
  const signatureElements = signature.split(',')
  const timestamp = signatureElements.find(el => el.startsWith('t='))?.split('=')[1]
  const signatures = signatureElements.filter(el => el.startsWith('v1='))

  if (!timestamp || signatures.length === 0) {
    throw new Error('Invalid signature format')
  }

  // Simple signature verification (in production, use Stripe's library)
  const expectedSignature = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(STRIPE_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  ).then(key => 
    crypto.subtle.sign('HMAC', key, new TextEncoder().encode(timestamp + '.' + body))
  ).then(signature => 
    Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  )

  const providedSignature = signatures[0].split('=')[1]
  
  if (expectedSignature !== providedSignature) {
    throw new Error('Invalid signature')
  }

  const event = JSON.parse(body)

  console.log('Webhook event:', event.type, event.id)

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object, supabaseClient)
      break
    
    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event.data.object, supabaseClient)
      break
    
    default:
      console.log('Unhandled event type:', event.type)
  }

  return new Response('ok', { headers: corsHeaders })
}

async function handleCheckoutCompleted(session: any, supabaseClient: any) {
  const userId = session.client_reference_id || session.metadata?.user_id
  
  if (!userId) {
    console.error('No user ID in checkout session')
    return
  }

  console.log('Processing checkout completion for user:', userId)

  // Update checkout session status
  await supabaseClient
    .from('checkout_sessions')
    .update({ status: 'complete' })
    .eq('stripe_session_id', session.id)

  // Unlock export for user
  const { error: entitlementError } = await supabaseClient
    .from('user_entitlements')
    .upsert({
      user_id: userId,
      export_unlocked: true,
      export_unlocked_at: new Date().toISOString(),
      stripe_customer_id: session.customer
    }, {
      onConflict: 'user_id'
    })

  if (entitlementError) {
    console.error('Failed to update entitlement:', entitlementError)
  }

  // Create payment receipt
  if (session.payment_intent) {
    await supabaseClient
      .from('payment_receipts')
      .insert({
        user_id: userId,
        stripe_payment_intent_id: session.payment_intent,
        stripe_checkout_session_id: session.id,
        amount: session.amount_total,
        currency: session.currency,
        status: 'succeeded',
        product_name: session.metadata?.product_name || PAYMENT_CONFIG.productName,
        receipt_url: session.receipt_url
      })
  }

  console.log('Export unlocked for user:', userId)
}

async function handlePaymentSucceeded(paymentIntent: any, supabaseClient: any) {
  // This is a fallback in case checkout.session.completed doesn't fire
  const userId = paymentIntent.metadata?.user_id
  
  if (!userId) {
    console.error('No user ID in payment intent')
    return
  }

  console.log('Processing payment success for user:', userId)

  // Check if we already processed this payment
  const { data: existingReceipt } = await supabaseClient
    .from('payment_receipts')
    .select('id')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .single()

  if (existingReceipt) {
    console.log('Payment already processed:', paymentIntent.id)
    return
  }

  // Unlock export for user
  await supabaseClient
    .from('user_entitlements')
    .upsert({
      user_id: userId,
      export_unlocked: true,
      export_unlocked_at: new Date().toISOString(),
      stripe_customer_id: paymentIntent.customer
    }, {
      onConflict: 'user_id'
    })

  // Create payment receipt
  await supabaseClient
    .from('payment_receipts')
    .insert({
      user_id: userId,
      stripe_payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'succeeded',
      product_name: paymentIntent.metadata?.product_name || PAYMENT_CONFIG.productName
    })

  console.log('Export unlocked via payment intent for user:', userId)
}

async function getEntitlement(req: Request, supabaseClient: any) {
  // Get user from auth header
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    throw new Error('No authorization header')
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  // Get user entitlement
  const { data: entitlement, error } = await supabaseClient
    .from('user_entitlements')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    throw error
  }

  return new Response(
    JSON.stringify(entitlement || { 
      user_id: user.id, 
      export_unlocked: false 
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
}