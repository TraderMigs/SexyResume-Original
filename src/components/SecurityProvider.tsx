import React, { createContext, useContext, useEffect, useState } from 'react';
import { validateEnvironment } from '../lib/envValidation';
import { rateLimiter, logSecurityEvent } from '../lib/security';

interface SecurityContextType {
  isSecure: boolean;
  checkRateLimit: (key: string) => boolean;
  logSecurityEvent: typeof logSecurityEvent;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within SecurityProvider');
  }
  return context;
}

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [isSecure, setIsSecure] = useState(false);

  useEffect(() => {
    // Validate environment on startup
    const validation = validateEnvironment();
    
    // In development, be more lenient with placeholder values
    if (import.meta.env.DEV) {
      setIsSecure(true); // Allow development to continue
    } else {
      setIsSecure(validation.isValid);
    }

    if (!validation.isValid) {
      if (import.meta.env.PROD) {
        console.error('Security validation failed:', validation.errors);
      } else {
        console.warn('Development mode - Security validation warnings:', validation.errors);
      }
    }

    // Set up security monitoring
    const handleSecurityViolation = (event: SecurityPolicyViolationEvent) => {
      logSecurityEvent({
        type: 'suspicious_activity',
        details: `CSP violation: ${event.violatedDirective}`,
        ip: 'unknown'
      });
    };

    document.addEventListener('securitypolicyviolation', handleSecurityViolation);

    return () => {
      document.removeEventListener('securitypolicyviolation', handleSecurityViolation);
    };
  }, []);

  const checkRateLimit = (key: string): boolean => {
    return rateLimiter.isAllowed(key);
  };

  return (
    <SecurityContext.Provider value={{
      isSecure,
      checkRateLimit,
      logSecurityEvent
    }}>
      {children}
    </SecurityContext.Provider>
  );
}