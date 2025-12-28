export interface PaymentConfig {
  priceId: string;
  productName: string;
  amount: number; // in cents
  currency: string;
}

export interface UserEntitlement {
  id: string;
  userId: string;
  exportUnlocked: boolean;
  exportUnlockedAt?: string;
  stripeCustomerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentReceipt {
  id: string;
  userId: string;
  stripePaymentIntentId: string;
  stripeCheckoutSessionId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  productName: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutSession {
  id: string;
  userId: string;
  stripeSessionId: string;
  status: 'open' | 'complete' | 'expired';
  amount: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCheckoutRequest {
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutResponse {
  sessionId: string;
  url: string;
  expiresAt: string;
}