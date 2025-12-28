/*
  # Webhook Replay Protection

  1. New Tables
    - `webhook_events`
      - `id` (uuid, primary key)
      - `stripe_event_id` (text, unique) - The Stripe event ID
      - `event_type` (text) - The type of webhook event
      - `processed_at` (timestamptz) - When the event was processed
      - `customer_id` (text) - Stripe customer ID
      - `payment_intent_id` (text) - Payment intent if applicable
      - `idempotency_key` (text) - For additional safety
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `webhook_events` table
    - Service role only access (no user access)

  3. Indexes
    - Index on stripe_event_id for fast duplicate detection
    - Index on processed_at for cleanup queries
    - Index on event_type for analytics
*/

-- Create webhook_events table for replay protection
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  customer_id text,
  payment_intent_id text,
  idempotency_key text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_event_id 
  ON public.webhook_events(stripe_event_id);

CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at 
  ON public.webhook_events(processed_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type 
  ON public.webhook_events(event_type);

CREATE INDEX IF NOT EXISTS idx_webhook_events_customer_id 
  ON public.webhook_events(customer_id);

-- Enable RLS
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Service role only - no user access to webhook logs
-- (No policies means only service_role can access)

-- Add comment for documentation
COMMENT ON TABLE public.webhook_events IS 'Tracks processed Stripe webhook events for replay protection and idempotency';
COMMENT ON COLUMN public.webhook_events.stripe_event_id IS 'Unique Stripe event ID (e.g., evt_1234...)';
COMMENT ON COLUMN public.webhook_events.idempotency_key IS 'Optional idempotency key for additional safety';
COMMENT ON COLUMN public.webhook_events.metadata IS 'Additional event metadata for debugging';
