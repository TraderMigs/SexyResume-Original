import React, { useState } from 'react';
import { usePayments } from '../hooks/usePayments';
import { useAuth } from '../contexts/AuthContext';
import { PAYMENT_CONFIG } from '../lib/paymentConfig';
import { trackEvent } from '../lib/analytics';
import { CreditCard, Lock, Shield, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface PaymentGateProps {
  children: React.ReactNode;
  feature: string;
  onUnlocked?: () => void;
}

export default function PaymentGate({ children, feature, onUnlocked }: PaymentGateProps) {
  const { user } = useAuth();
  const { entitlement, loading, error, isStripeConfigured, createCheckoutSession, clearError } = usePayments();
  const [isProcessing, setIsProcessing] = useState(false);

  // If user is not authenticated, show sign-in prompt
  if (!user) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center py-8">
          <Lock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sign In Required</h3>
          <p className="text-gray-600">
            Please sign in to unlock {feature} features.
          </p>
        </div>
      </div>
    );
  }

  // If Stripe is not configured, show configuration message
  if (!isStripeConfigured) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Payment System Not Configured</h3>
          <p className="text-gray-600">
            Payment processing is not yet set up. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  // If loading entitlement, show spinner
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center py-8">
          <Loader className="w-8 h-8 text-sexy-pink-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }

  // If user has unlocked exports, show the children
  if (entitlement?.exportUnlocked) {
    return <>{children}</>;
  }

  // Show payment gate
  const handlePurchase = async () => {
    try {
      setIsProcessing(true);
      clearError();

      // Track checkout started event
      trackEvent('checkout_started', {
        product: 'export_unlock',
        amount: PAYMENT_CONFIG.EXPORT_UNLOCK_PRICE,
        currency: 'usd',
        trigger_source: 'export_button'
      });

      const currentUrl = window.location.href;
      const successUrl = `${currentUrl}?payment=success`;
      const cancelUrl = `${currentUrl}?payment=canceled`;

      const { url } = await createCheckoutSession({
        successUrl,
        cancelUrl,
      });

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Checkout failed:', error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="text-center py-8">
        <div className="bg-gradient-to-br from-sexy-pink-100 to-sexy-cyan-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
          <CreditCard className="w-8 h-8 text-sexy-pink-600" />
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Unlock {feature}</h3>
        <p className="text-gray-600 mb-6">
          Get unlimited exports in PDF, Word, and HTML formats with professional styling.
        </p>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="text-center mb-4">
            <span className="text-3xl font-bold text-gray-900">${(PAYMENT_CONFIG.amount / 100).toFixed(2)}</span>
            <span className="text-gray-600 ml-2">one-time payment</span>
          </div>
          
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Professional resume templates & styling</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Unlimited resume & cover letter exports</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>PDF, Word & HTML export formats</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Remove watermarks and restrictions</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Lifetime access - no subscriptions</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        <button
          onClick={handlePurchase}
          disabled={isProcessing}
          className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-sexy-pink-600 text-white rounded-lg hover:bg-sexy-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isProcessing ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>Redirecting to checkout...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              <span>Unlock Now - $7.00</span>
            </>
          )}
        </button>

        <div className="mt-6 flex items-center justify-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Shield className="w-3 h-3" />
            <span>Secure payment</span>
          </div>
          <span>•</span>
          <span>Powered by Stripe</span>
          <span>•</span>
          <span>No recurring charges</span>
        </div>
      </div>
    </div>
  );
}