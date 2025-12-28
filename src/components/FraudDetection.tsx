import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logSecurityEvent } from '../lib/security';

interface FraudDetectionProps {
  onSuspiciousActivity?: (details: string) => void;
}

export default function FraudDetection({ onSuspiciousActivity }: FraudDetectionProps) {
  const { user } = useAuth();

  useEffect(() => {
    // Monitor for suspicious payment patterns
    const monitorPaymentActivity = () => {
      const paymentAttempts = JSON.parse(localStorage.getItem('payment-attempts') || '[]');
      const now = Date.now();
      const recentAttempts = paymentAttempts.filter((attempt: number) => now - attempt < 300000); // 5 minutes

      if (recentAttempts.length > 3) {
        const details = `Rapid payment attempts detected: ${recentAttempts.length} attempts in 5 minutes`;
        logSecurityEvent({
          type: 'suspicious_activity',
          details,
          userId: user?.id,
          severity: 'high'
        });
        onSuspiciousActivity?.(details);
      }
    };

    // Monitor for unusual export patterns
    const monitorExportActivity = () => {
      const exportAttempts = JSON.parse(localStorage.getItem('export-attempts') || '[]');
      const now = Date.now();
      const recentExports = exportAttempts.filter((attempt: number) => now - attempt < 3600000); // 1 hour

      if (recentExports.length > 10) {
        const details = `Unusual export pattern: ${recentExports.length} exports in 1 hour`;
        logSecurityEvent({
          type: 'suspicious_activity',
          details,
          userId: user?.id,
          severity: 'medium'
        });
        onSuspiciousActivity?.(details);
      }
    };

    // Monitor for rapid account creation patterns
    const monitorAccountActivity = () => {
      if (user) {
        const accountCreated = new Date(user.created_at || '').getTime();
        const now = Date.now();
        const accountAge = now - accountCreated;

        // Flag accounts that immediately try to export without building content
        if (accountAge < 300000) { // 5 minutes
          const hasContent = localStorage.getItem('resume-draft');
          if (!hasContent) {
            const details = 'New account attempting export without content creation';
            logSecurityEvent({
              type: 'suspicious_activity',
              details,
              userId: user.id,
              severity: 'medium'
            });
          }
        }
      }
    };

    // Set up monitoring intervals
    const paymentMonitor = setInterval(monitorPaymentActivity, 60000); // Every minute
    const exportMonitor = setInterval(monitorExportActivity, 300000); // Every 5 minutes
    const accountMonitor = setTimeout(monitorAccountActivity, 10000); // After 10 seconds

    return () => {
      clearInterval(paymentMonitor);
      clearInterval(exportMonitor);
      clearTimeout(accountMonitor);
    };
  }, [user, onSuspiciousActivity]);

  // Track payment attempts
  const trackPaymentAttempt = () => {
    const attempts = JSON.parse(localStorage.getItem('payment-attempts') || '[]');
    attempts.push(Date.now());
    // Keep only last 10 attempts
    localStorage.setItem('payment-attempts', JSON.stringify(attempts.slice(-10)));
  };

  // Track export attempts
  const trackExportAttempt = () => {
    const attempts = JSON.parse(localStorage.getItem('export-attempts') || '[]');
    attempts.push(Date.now());
    // Keep only last 20 attempts
    localStorage.setItem('export-attempts', JSON.stringify(attempts.slice(-20)));
  };

  // Expose tracking functions to parent components
  useEffect(() => {
    (window as any).trackPaymentAttempt = trackPaymentAttempt;
    (window as any).trackExportAttempt = trackExportAttempt;

    return () => {
      delete (window as any).trackPaymentAttempt;
      delete (window as any).trackExportAttempt;
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}