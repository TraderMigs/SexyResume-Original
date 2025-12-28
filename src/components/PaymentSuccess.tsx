import React, { useEffect, useState } from 'react';
import { usePayments } from '../hooks/usePayments';
import { CheckCircle, Download, FileText, Loader, Clock } from 'lucide-react';

interface PaymentSuccessProps {
  onClose: () => void;
}

export default function PaymentSuccess({ onClose }: PaymentSuccessProps) {
  const { refreshEntitlement, entitlement } = usePayments();
  const [retryCount, setRetryCount] = useState(0);
  const [isWaiting, setIsWaiting] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const MAX_RETRIES = 5;
  const RETRY_DELAYS = [2000, 3000, 5000, 8000, 12000]; // Exponential backoff

  useEffect(() => {
    // Track elapsed time for user feedback
    const timeTracker = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timeTracker);
  }, []);

  useEffect(() => {
    // Retry logic with exponential backoff
    const attemptRefresh = async () => {
      if (retryCount >= MAX_RETRIES) {
        setIsWaiting(false);
        return;
      }

      const delay = RETRY_DELAYS[retryCount] || 12000;
      const timer = setTimeout(async () => {
        await refreshEntitlement();
        setRetryCount(prev => prev + 1);
      }, delay);

      return () => clearTimeout(timer);
    };

    attemptRefresh();
  }, [retryCount, refreshEntitlement]);

  // Check if entitlement is unlocked
  useEffect(() => {
    if (entitlement?.exportUnlocked) {
      setIsWaiting(false);
    }
  }, [entitlement]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6 text-center">
          {isWaiting ? (
            // Processing state
            <>
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Loader className="w-8 h-8 text-blue-600 animate-spin" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment...</h2>
              <p className="text-gray-600 mb-4">
                Your payment was successful! We're unlocking your premium features.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center space-x-2 text-blue-800 mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Processing for {timeElapsed} seconds...</span>
                </div>
                <p className="text-xs text-blue-700">
                  This usually takes 5-10 seconds. Hang tight!
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Retry attempt: {retryCount + 1} of {MAX_RETRIES}
                </p>
              </div>

              {retryCount >= 3 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-amber-800">
                    Taking longer than expected? Don't worry - your payment is secure.
                    You can close this and refresh the page in a moment.
                  </p>
                </div>
              )}
            </>
          ) : (
            // Success state
            <>
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
              <p className="text-gray-600 mb-6">
                Welcome to Sexy Resume! Your premium features have been unlocked. You can now create and export professional resumes and cover letters without any restrictions.
              </p>
            </>
          )}

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">What's unlocked:</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Download className="w-4 h-4 text-green-500" />
                <span>Professional resume templates</span>
              </div>
              <div className="flex items-center space-x-2">
                <Download className="w-4 h-4 text-green-500" />
                <span>Unlimited PDF, Word & HTML exports</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-green-500" />
                <span>AI-powered cover letter generation</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>No watermarks or restrictions</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isWaiting}
            className="w-full px-6 py-3 bg-sexy-pink-600 text-white rounded-lg hover:bg-sexy-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isWaiting ? 'Please wait...' : 'Continue to Export'}
          </button>

          {!isWaiting && retryCount >= MAX_RETRIES && !entitlement?.exportUnlocked && (
            <p className="mt-4 text-sm text-amber-600">
              If you still don't see your unlocked features, please refresh the page or contact support.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}