-- Sample Payment Receipt Record
-- This shows what SHOULD be inserted into payment_receipts table

INSERT INTO public.payment_receipts (
  id,
  user_id,
  stripe_customer_id,
  stripe_payment_intent_id,
  stripe_charge_id,
  amount,
  currency,
  status,
  receipt_url,
  created_at
) VALUES (
  'receipt_1PqRsTExample12345',  -- Unique receipt ID
  '550e8400-e29b-41d4-a716-446655440000',  -- User ID
  'cus_ExampleCustomer123',  -- Stripe customer ID
  'pi_3PqRsTExample789xyz',  -- Payment intent ID
  'ch_3PqRsTExample456abc',  -- Charge ID
  990,  -- Amount in cents ($9.90)
  'usd',  -- Currency
  'succeeded',  -- Payment status
  'https://pay.stripe.com/receipts/payment/...',  -- Stripe receipt URL
  '2025-10-03T04:15:23.500Z'  -- Created timestamp
);

-- Expected Result:
-- {
--   "id": "receipt_1PqRsTExample12345",
--   "user_id": "550e8400-e29b-41d4-a716-446655440000",
--   "stripe_customer_id": "cus_ExampleCustomer123",
--   "stripe_payment_intent_id": "pi_3PqRsTExample789xyz",
--   "stripe_charge_id": "ch_3PqRsTExample456abc",
--   "amount": 990,
--   "currency": "usd",
--   "status": "succeeded",
--   "receipt_url": "https://pay.stripe.com/receipts/payment/...",
--   "created_at": "2025-10-03T04:15:23.500Z",
--   "updated_at": "2025-10-03T04:15:23.500Z"
-- }

-- Verification Query:
SELECT 
  pr.id,
  pr.user_id,
  pr.amount,
  pr.currency,
  pr.status,
  ue.export_unlocked,
  ue.export_unlocked_at
FROM payment_receipts pr
LEFT JOIN user_entitlements ue ON pr.user_id = ue.user_id
WHERE pr.stripe_payment_intent_id = 'pi_3PqRsTExample789xyz';

-- Expected output after proper implementation:
-- | id                          | user_id                              | amount | currency | status    | export_unlocked | export_unlocked_at           |
-- |-----------------------------|--------------------------------------|--------|----------|-----------|-----------------|------------------------------|
-- | receipt_1PqRsTExample12345  | 550e8400-e29b-41d4-a716-446655440000 | 990    | usd      | succeeded | true            | 2025-10-03T04:15:23.500Z     |

-- Current buggy state would show:
-- | id                          | user_id                              | amount | currency | status    | export_unlocked | export_unlocked_at           |
-- |-----------------------------|--------------------------------------|--------|----------|-----------|-----------------|------------------------------|
-- | receipt_1PqRsTExample12345  | 550e8400-e29b-41d4-a716-446655440000 | 990    | usd      | succeeded | false           | NULL                         |
-- ^^^ USER PAID BUT export_unlocked STILL FALSE! ^^^
