import { PaymentConfig } from '../types/payment';

export const PAYMENT_CONFIG: PaymentConfig = {
  priceId: import.meta.env.VITE_STRIPE_PRICE_ID || 'price_1RntxwRrIlnVe6VQGCrp5lxU',
  productName: 'Sexy Resume',
  amount: 700, // $7.00 in cents
  currency: 'usd'
};

// Check if Stripe is configured with proper validation
export const isStripeConfigured = () => {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  
  // Validate key format and ensure it's not a placeholder
  if (!key || key.includes('your_') || key.includes('placeholder')) {
    return false;
  }
  
  // Check for proper Stripe key format
  return key.startsWith('pk_test_') || key.startsWith('pk_live_');
};