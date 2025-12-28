import React, { useState, useEffect } from 'react';
import { Shield, Cookie, Settings, X, Check } from 'lucide-react';

interface CookieConsentProps {
  onConsentChange: (consents: ConsentPreferences) => void;
}

export interface ConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export default function CookieConsent({ onConsentChange }: CookieConsentProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consents, setConsents] = useState<ConsentPreferences>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    preferences: false
  });

  useEffect(() => {
    // Check if user has already made consent choices
    const savedConsent = localStorage.getItem('cookie-consent');
    if (!savedConsent) {
      setShowBanner(true);
    } else {
      try {
        const parsed = JSON.parse(savedConsent);
        setConsents(parsed);
        onConsentChange(parsed);
      } catch (error) {
        setShowBanner(true);
      }
    }
  }, [onConsentChange]);

  const handleAcceptAll = () => {
    const allConsents = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true
    };
    saveConsent(allConsents);
  };

  const handleAcceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false
    };
    saveConsent(necessaryOnly);
  };

  const handleCustomSave = () => {
    saveConsent(consents);
  };

  const saveConsent = (preferences: ConsentPreferences) => {
    localStorage.setItem('cookie-consent', JSON.stringify(preferences));
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setConsents(preferences);
    onConsentChange(preferences);
    setShowBanner(false);
    setShowDetails(false);
  };

  const updateConsent = (type: keyof ConsentPreferences, value: boolean) => {
    if (type === 'necessary') return; // Cannot disable necessary cookies
    setConsents(prev => ({ ...prev, [type]: value }));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      {!showDetails ? (
        // Simple banner
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-start space-x-3 flex-1">
              <Cookie className="w-6 h-6 text-sexy-pink-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-900 mb-1">We use cookies to enhance your experience</h3>
                <p className="text-sm text-gray-600">
                  We use necessary cookies for core functionality and optional cookies for analytics and personalization. 
                  <button 
                    onClick={() => setShowDetails(true)}
                    className="text-sexy-pink-600 hover:text-sexy-pink-700 underline ml-1"
                  >
                    Learn more
                  </button>
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleAcceptNecessary}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Necessary Only
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 bg-sexy-pink-600 text-white rounded-lg hover:bg-sexy-pink-700 transition-colors text-sm"
              >
                Accept All
              </button>
              <button
                onClick={() => setShowDetails(true)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Detailed preferences
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-white rounded-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Shield className="w-6 h-6 text-sexy-pink-600" />
                <h2 className="text-xl font-semibold text-gray-900">Cookie Preferences</h2>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Necessary Cookies</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Required for basic site functionality, authentication, and security.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Always Active</span>
                    <div className="w-10 h-6 bg-sexy-pink-600 rounded-full flex items-center justify-end px-1">
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Analytics Cookies</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Help us understand how you use our site to improve your experience.
                    </p>
                  </div>
                  <button
                    onClick={() => updateConsent('analytics', !consents.analytics)}
                    className={`w-10 h-6 rounded-full flex items-center transition-colors ${
                      consents.analytics ? 'bg-sexy-pink-600 justify-end' : 'bg-gray-300 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full mx-1"></div>
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Marketing Cookies</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Used to show you relevant content and advertisements.
                    </p>
                  </div>
                  <button
                    onClick={() => updateConsent('marketing', !consents.marketing)}
                    className={`w-10 h-6 rounded-full flex items-center transition-colors ${
                      consents.marketing ? 'bg-sexy-pink-600 justify-end' : 'bg-gray-300 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full mx-1"></div>
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Preference Cookies</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Remember your settings and preferences for a better experience.
                    </p>
                  </div>
                  <button
                    onClick={() => updateConsent('preferences', !consents.preferences)}
                    className={`w-10 h-6 rounded-full flex items-center transition-colors ${
                      consents.preferences ? 'bg-sexy-pink-600 justify-end' : 'bg-gray-300 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full mx-1"></div>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleAcceptNecessary}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Necessary Only
              </button>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleCustomSave}
                  className="px-4 py-2 border border-sexy-pink-300 text-sexy-pink-700 rounded-lg hover:bg-sexy-pink-50 transition-colors"
                >
                  Save Preferences
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-4 py-2 bg-sexy-pink-600 text-white rounded-lg hover:bg-sexy-pink-700 transition-colors"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}