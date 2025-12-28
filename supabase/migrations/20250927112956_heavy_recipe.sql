/*
  # Payment System for Export Unlocking

  1. New Tables
    - `user_entitlements` - Track what users have purchased
    - `payment_receipts` - Store payment records for accounting
    - `checkout_sessions` - Track Stripe checkout sessions

  2. Security
    - Enable RLS on all tables
    - Users can only see their own data
    - Server-side entitlement verification

  3. Indexes
    - Performance indexes on user lookups
*/

-- User entitlements table
CREATE TABLE IF NOT EXISTS public.user_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  export_unlocked boolean DEFAULT false,
  export_unlocked_at timestamptz,
  stripe_customer_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Payment receipts table for accounting
CREATE TABLE IF NOT EXISTS public.payment_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id text NOT NULL UNIQUE,
  stripe_checkout_session_id text,
  amount integer NOT NULL, -- Amount in cents
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
  product_name text NOT NULL DEFAULT 'Resume+CoverLetter Export',
  receipt_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Checkout sessions table for tracking
CREATE TABLE IF NOT EXISTS public.checkout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_session_id text NOT NULL UNIQUE,
  status text NOT NULL CHECK (status IN ('open', 'complete', 'expired')) DEFAULT 'open',
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  success_url text NOT NULL,
  cancel_url text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_entitlements_user_id ON public.user_entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_user_id ON public.payment_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_stripe_payment_intent_id ON public.payment_receipts(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_user_id ON public.checkout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_stripe_session_id ON public.checkout_sessions(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_expires_at ON public.checkout_sessions(expires_at);

-- Enable Row Level Security
ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

-- User entitlements policies
CREATE POLICY "Users can read own entitlements"
  ON public.user_entitlements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own entitlements"
  ON public.user_entitlements
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Payment receipts policies (read-only for users)
CREATE POLICY "Users can read own payment receipts"
  ON public.payment_receipts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Checkout sessions policies
CREATE POLICY "Users can read own checkout sessions"
  ON public.checkout_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to create user entitlement on user creation
CREATE OR REPLACE FUNCTION public.create_user_entitlement()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_entitlements (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create entitlement for new users
CREATE TRIGGER create_user_entitlement_trigger
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_entitlement();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_payments_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_entitlements_updated_at
  BEFORE UPDATE ON public.user_entitlements
  FOR EACH ROW EXECUTE FUNCTION public.update_payments_updated_at();

CREATE TRIGGER update_payment_receipts_updated_at
  BEFORE UPDATE ON public.payment_receipts
  FOR EACH ROW EXECUTE FUNCTION public.update_payments_updated_at();

CREATE TRIGGER update_checkout_sessions_updated_at
  BEFORE UPDATE ON public.checkout_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_payments_updated_at();

-- Function to clean up expired checkout sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_checkout_sessions()
RETURNS void AS $$
BEGIN
  UPDATE public.checkout_sessions 
  SET status = 'expired' 
  WHERE expires_at < now() AND status = 'open';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;