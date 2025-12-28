import React, { useState } from 'react';
import { usePayments } from '../hooks/usePayments';
import { PAYMENT_CONFIG } from '../lib/paymentConfig';
import { trackEvent } from '../lib/analytics';
import { X, CreditCard, CheckCircle, Shield, Sparkles, Zap, Lock, AlertCircle, Loader } from 'lucide-react';

interface UpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
  trigger?: string;
}

export default function UpsellModal({ isOpen, onClose, feature = 'Premium Features', trigger = 'modal' }: UpsellModalProps) {
  const { createCheckoutSession, clearError, error } = usePayments();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePurchase = async () => {
    try {
      setIsProcessing(true);
      clearError();

      // Track checkout started event
      trackEvent('checkout_started', {
        product: 'export_unlock',
        amount: PAYMENT_CONFIG.EXPORT_UNLOCK_PRICE,
        currency: 'usd',
        trigger_source: trigger
      });

      const currentUrl = window.location.origin + window.location.pathname;
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
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-sexy-pink-600 to-sexy-cyan-600 p-6 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-center mb-4">
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white text-center mb-2">
            Unlock {feature}
          </h2>
          <p className="text-white text-opacity-90 text-center">
            Create professional resumes that get you hired
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Pricing */}
          <div className="text-center mb-6 bg-gradient-to-br from-sexy-pink-50 to-sexy-cyan-50 rounded-xl p-6">
            <div className="flex items-baseline justify-center mb-2">
              <span className="text-4xl font-bold text-gray-900">
                ${(PAYMENT_CONFIG.amount / 100).toFixed(2)}
              </span>
              <span className="text-gray-600 ml-2">one-time</span>
            </div>
            <p className="text-sm text-gray-600">No subscriptions. Pay once, use forever.</p>
          </div>

          {/* Features List */}
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              What You Get:
            </h3>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 bg-green-100 rounded-full p-1">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Professional Templates</p>
                <p className="text-sm text-gray-600">5+ stunning resume designs that stand out</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 bg-green-100 rounded-full p-1">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Unlimited Exports</p>
                <p className="text-sm text-gray-600">Download as PDF, Word, or HTML - no limits</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 bg-green-100 rounded-full p-1">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">ATS-Optimized Format</p>
                <p className="text-sm text-gray-600">Get past automated resume screening systems</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 bg-green-100 rounded-full p-1">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Cover Letter Generator</p>
                <p className="text-sm text-gray-600">AI-powered cover letters for any job</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 bg-green-100 rounded-full p-1">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">No Watermarks</p>
                <p className="text-sm text-gray-600">100% professional - ready to send to employers</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 bg-sexy-pink-100 rounded-full p-1">
                <Zap className="w-5 h-5 text-sexy-pink-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Lifetime Access</p>
                <p className="text-sm text-gray-600">One payment. No recurring fees. Forever.</p>
              </div>
            </div>
          </div>

          {/* Social Proof */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2">
              <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-900 font-medium mb-1">
                  Stand out with professional resume design
                </p>
                <p className="text-xs text-blue-700">
                  ATS-optimized format increases your chances of landing interviews
                </p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* CTA Button */}
          <button
            onClick={handlePurchase}
            disabled={isProcessing}
            className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-sexy-pink-600 to-sexy-cyan-600 text-white rounded-xl hover:from-sexy-pink-700 hover:to-sexy-cyan-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {isProcessing ? (
              <>
                <Loader className="w-6 h-6 animate-spin" />
                <span>Redirecting to checkout...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-6 h-6" />
                <span>Unlock Now - ${(PAYMENT_CONFIG.amount / 100).toFixed(2)}</span>
              </>
            )}
          </button>

          {/* Trust Badges */}
          <div className="mt-6 flex items-center justify-center space-x-6 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Shield className="w-4 h-4" />
              <span>Secure Checkout</span>
            </div>
            <div className="flex items-center space-x-1">
              <Lock className="w-4 h-4" />
              <span>Encrypted Payment</span>
            </div>
          </div>

          <p className="text-center text-xs text-gray-500 mt-3">
            Powered by Stripe " Money-back guarantee
          </p>
        </div>
      </div>
    </div>
  );
}
