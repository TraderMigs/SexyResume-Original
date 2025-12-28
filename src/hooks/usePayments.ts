import { useState, useEffect } from 'react';
import { UserEntitlement, CreateCheckoutRequest, CreateCheckoutResponse } from '../types/payment';
import { useAuth } from '../contexts/AuthContext';
import { isStripeConfigured } from '../lib/paymentConfig';

interface UsePaymentsReturn {
  entitlement: UserEntitlement | null;
  loading: boolean;
  error: string | null;
  isStripeConfigured: boolean;
  createCheckoutSession: (request: CreateCheckoutRequest) => Promise<CreateCheckoutResponse>;
  refreshEntitlement: () => Promise<void>;
  clearError: () => void;
}

export function usePayments(): UsePaymentsReturn {
  const { user, session } = useAuth();
  const [entitlement, setEntitlement] = useState<UserEntitlement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user entitlement when authenticated
  useEffect(() => {
    if (user && session) {
      refreshEntitlement();
    } else {
      setEntitlement(null);
    }
  }, [user, session]);

  const refreshEntitlement = async () => {
    if (!session) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payments/entitlement`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load entitlement');
      }

      const data = await response.json();
      setEntitlement(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createCheckoutSession = async (request: CreateCheckoutRequest): Promise<CreateCheckoutResponse> => {
    if (!session) throw new Error('Not authenticated');

    try {
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: 'price_1RntxwRrIlnVe6VQGCrp5lxU',
          success_url: request.successUrl,
          cancel_url: request.cancelUrl,
          mode: 'payment'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const data = await response.json();
      return {
        sessionId: data.sessionId,
        url: data.url,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes from now
      };
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const clearError = () => setError(null);

  return {
    entitlement,
    loading,
    error,
    isStripeConfigured: isStripeConfigured(),
    createCheckoutSession,
    refreshEntitlement,
    clearError,
  };
}