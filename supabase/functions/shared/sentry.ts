/**
 * Sentry error monitoring for Supabase Edge Functions
 * PII-free error tracking with context
 */

interface SentryEvent {
  message: string;
  level: 'error' | 'warning' | 'info';
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  timestamp?: string;
  environment?: string;
}

interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
}

class EdgeSentry {
  private config: SentryConfig | null = null;

  initialize(dsn: string, environment: string = 'production') {
    if (!dsn || dsn === 'your_sentry_dsn_here') {
      console.warn('Sentry DSN not configured, error tracking disabled');
      return;
    }

    this.config = {
      dsn,
      environment,
      release: Deno.env.get('DENO_DEPLOYMENT_ID') || 'dev',
    };

    console.log(`Sentry initialized for ${environment}`);
  }

  /**
   * Capture an exception with PII protection
   */
  captureException(error: Error, context?: Record<string, any>) {
    if (!this.config) return;

    const sanitizedContext = this.sanitizeContext(context || {});

    const event: SentryEvent = {
      message: error.message,
      level: 'error',
      tags: {
        function: sanitizedContext.function_name || 'unknown',
        error_type: error.name,
      },
      extra: {
        stack: error.stack?.substring(0, 500), // Truncate stack trace
        context: sanitizedContext,
      },
      timestamp: new Date().toISOString(),
      environment: this.config.environment,
    };

    this.sendToSentry(event);
  }

  /**
   * Capture a message with context
   */
  captureMessage(message: string, level: 'error' | 'warning' | 'info' = 'info', context?: Record<string, any>) {
    if (!this.config) return;

    const sanitizedContext = this.sanitizeContext(context || {});

    const event: SentryEvent = {
      message,
      level,
      tags: {
        function: sanitizedContext.function_name || 'unknown',
      },
      extra: sanitizedContext,
      timestamp: new Date().toISOString(),
      environment: this.config.environment,
    };

    this.sendToSentry(event);
  }

  /**
   * Sanitize context to remove PII
   */
  private sanitizeContext(context: Record<string, any>): Record<string, any> {
    const sanitized = { ...context };

    // Remove PII fields
    const piiFields = [
      'email', 'phone', 'fullName', 'name', 'address', 'location',
      'personalInfo', 'userData', 'user_email', 'user_name',
      'ip_address', 'credit_card', 'ssn', 'password', 'token'
    ];

    piiFields.forEach(field => {
      delete sanitized[field];
    });

    // Recursively sanitize nested objects
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        if (Array.isArray(sanitized[key])) {
          sanitized[key] = sanitized[key].map((item: any) =>
            typeof item === 'object' ? this.sanitizeContext(item) : item
          );
        } else {
          sanitized[key] = this.sanitizeContext(sanitized[key]);
        }
      }
    });

    return sanitized;
  }

  /**
   * Send event to Sentry (simplified for Deno environment)
   */
  private async sendToSentry(event: SentryEvent) {
    if (!this.config) return;

    try {
      // Parse DSN to extract project details
      const dsnUrl = new URL(this.config.dsn);
      const projectId = dsnUrl.pathname.substring(1);
      const publicKey = dsnUrl.username;
      const sentryUrl = `https://${dsnUrl.host}/api/${projectId}/store/`;

      // Construct Sentry envelope format
      const envelope = {
        event_id: crypto.randomUUID(),
        timestamp: event.timestamp,
        platform: 'deno',
        sdk: {
          name: 'supabase-edge-functions',
          version: '1.0.0',
        },
        environment: this.config.environment,
        release: this.config.release,
        level: event.level,
        message: event.message,
        tags: event.tags || {},
        extra: event.extra || {},
      };

      // Send to Sentry asynchronously (fire and forget)
      fetch(sentryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${publicKey}, sentry_client=supabase-edge-functions/1.0.0`,
        },
        body: JSON.stringify(envelope),
      }).catch(err => {
        console.error('Failed to send event to Sentry:', err.message);
      });
    } catch (error) {
      console.error('Sentry error:', error);
    }
  }
}

// Export singleton instance
export const sentry = new EdgeSentry();

// Initialize from environment
export function initSentry() {
  const dsn = Deno.env.get('SENTRY_DSN');
  const environment = Deno.env.get('DENO_ENV') || 'production';

  if (dsn) {
    sentry.initialize(dsn, environment);
  }
}
