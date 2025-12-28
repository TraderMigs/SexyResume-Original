import React, { createContext, useContext, useState, useEffect } from 'react';
import { A11yConfig } from '../lib/accessibility';

interface AccessibilityContextType {
  config: A11yConfig;
  updateConfig: (updates: Partial<A11yConfig>) => void;
  announceMessage: (message: string, priority?: 'polite' | 'assertive') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<A11yConfig>({
    announceChanges: true,
    highContrast: false,
    reducedMotion: false,
    focusVisible: true
  });

  // Detect user preferences
  useEffect(() => {
    const mediaQueries = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      highContrast: window.matchMedia('(prefers-contrast: high)'),
    };

    const updatePreferences = () => {
      setConfig(prev => ({
        ...prev,
        reducedMotion: mediaQueries.reducedMotion.matches,
        highContrast: mediaQueries.highContrast.matches,
      }));
    };

    // Initial check
    updatePreferences();

    // Listen for changes
    Object.values(mediaQueries).forEach(mq => {
      mq.addEventListener('change', updatePreferences);
    });

    return () => {
      Object.values(mediaQueries).forEach(mq => {
        mq.removeEventListener('change', updatePreferences);
      });
    };
  }, []);

  // Apply accessibility classes to document
  useEffect(() => {
    const classes = [];
    if (config.highContrast) classes.push('high-contrast');
    if (config.reducedMotion) classes.push('reduced-motion');
    if (config.focusVisible) classes.push('focus-visible');

    document.documentElement.className = classes.join(' ');
  }, [config]);

  const updateConfig = (updates: Partial<A11yConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const announceMessage = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!config.announceChanges) return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  };

  return (
    <AccessibilityContext.Provider value={{ config, updateConfig, announceMessage }}>
      {children}
    </AccessibilityContext.Provider>
  );
}