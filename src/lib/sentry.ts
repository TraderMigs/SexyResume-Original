import * as Sentry from '@sentry/react';

// Initialize Sentry for error monitoring
export function initSentry() {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true, // Protect PII
          blockAllMedia: true,
        }),
      ],
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.01,
      replaysOnErrorSampleRate: 1.0,
      beforeSend(event) {
        // Filter out PII and sensitive data
        if (event.user) {
          delete event.user.email;
          delete event.user.ip_address;
        }
        
        // Remove sensitive form data
        if (event.request?.data) {
          const data = event.request.data;
          if (typeof data === 'object') {
            delete data.personalInfo;
            delete data.email;
            delete data.phone;
            delete data.fullName;
          }
        }
        
        return event;
      },
    });
  }
}

// Custom error boundary component
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Performance monitoring
export function capturePerformance(name: string, operation: () => Promise<any>) {
  return Sentry.startSpan({ name }, async () => {
    const start = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - start;
      
      Sentry.addBreadcrumb({
        message: `${name} completed`,
        level: 'info',
        data: { duration: `${duration.toFixed(2)}ms` }
      });
      
      return result;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { operation: name },
        extra: { duration: `${(performance.now() - start).toFixed(2)}ms` }
      });
      throw error;
    }
  });
}