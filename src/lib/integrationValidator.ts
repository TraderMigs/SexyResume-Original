// Integration validation utilities for live environment checks

export interface ValidationResult {
  isValid: boolean;
  service: string;
  status: 'connected' | 'configured' | 'missing' | 'invalid';
  message: string;
  details?: any;
}

export class IntegrationValidator {
  
  static async validateSupabase(): Promise<ValidationResult> {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      return {
        isValid: false,
        service: 'Supabase',
        status: 'missing',
        message: 'Missing Supabase environment variables'
      };
    }

    if (url.includes('placeholder') || key.includes('placeholder')) {
      return {
        isValid: false,
        service: 'Supabase',
        status: 'invalid',
        message: 'Placeholder values detected in Supabase configuration'
      };
    }

    try {
      // Test connection
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase.from('users').select('id').limit(1);
      
      if (error) {
        return {
          isValid: false,
          service: 'Supabase',
          status: 'configured',
          message: `Connection failed: ${error.message}`,
          details: error
        };
      }

      return {
        isValid: true,
        service: 'Supabase',
        status: 'connected',
        message: 'Successfully connected to Supabase'
      };
    } catch (error: any) {
      return {
        isValid: false,
        service: 'Supabase',
        status: 'invalid',
        message: `Connection error: ${error.message}`,
        details: error
      };
    }
  }

  static async validateStripe(): Promise<ValidationResult> {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    
    if (!key) {
      return {
        isValid: false,
        service: 'Stripe',
        status: 'missing',
        message: 'Missing VITE_STRIPE_PUBLISHABLE_KEY'
      };
    }

    if (key.includes('placeholder')) {
      return {
        isValid: false,
        service: 'Stripe',
        status: 'invalid',
        message: 'Placeholder value detected in Stripe configuration'
      };
    }

    if (!key.startsWith('pk_test_') && !key.startsWith('pk_live_')) {
      return {
        isValid: false,
        service: 'Stripe',
        status: 'invalid',
        message: 'Invalid Stripe publishable key format'
      };
    }

    try {
      // Test Stripe configuration by checking payment endpoint
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payments/entitlement`, {
        method: 'OPTIONS'
      });

      return {
        isValid: response.ok,
        service: 'Stripe',
        status: response.ok ? 'connected' : 'configured',
        message: response.ok ? 'Stripe integration functional' : 'Stripe configured but payment endpoint not responding'
      };
    } catch (error: any) {
      return {
        isValid: false,
        service: 'Stripe',
        status: 'configured',
        message: `Stripe endpoint test failed: ${error.message}`
      };
    }
  }

  static async validateOpenAI(): Promise<ValidationResult> {
    try {
      // Test AI parsing endpoint (OpenAI is configured server-side)
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-resume`, {
        method: 'OPTIONS'
      });

      if (response.ok) {
        return {
          isValid: true,
          service: 'OpenAI',
          status: 'connected',
          message: 'AI parsing endpoint responding'
        };
      } else {
        return {
          isValid: false,
          service: 'OpenAI',
          status: 'configured',
          message: 'AI parsing endpoint not responding - may need OpenAI API key'
        };
      }
    } catch (error: any) {
      return {
        isValid: false,
        service: 'OpenAI',
        status: 'missing',
        message: `AI endpoint test failed: ${error.message}`
      };
    }
  }

  static async validatePostHog(): Promise<ValidationResult> {
    const key = import.meta.env.VITE_POSTHOG_KEY;
    const host = import.meta.env.VITE_POSTHOG_HOST;
    
    if (!key) {
      return {
        isValid: false,
        service: 'PostHog',
        status: 'missing',
        message: 'Missing VITE_POSTHOG_KEY - analytics disabled'
      };
    }

    return {
      isValid: true,
      service: 'PostHog',
      status: 'configured',
      message: 'PostHog analytics configured'
    };
  }

  static async validateSentry(): Promise<ValidationResult> {
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    
    if (!dsn) {
      return {
        isValid: false,
        service: 'Sentry',
        status: 'missing',
        message: 'Missing VITE_SENTRY_DSN - error monitoring disabled'
      };
    }

    return {
      isValid: true,
      service: 'Sentry',
      status: 'configured',
      message: 'Sentry error monitoring configured'
    };
  }

  static async validateAllIntegrations(): Promise<ValidationResult[]> {
    console.log('🔍 Validating all integrations...');
    
    const results = await Promise.all([
      this.validateSupabase(),
      this.validateStripe(),
      this.validateOpenAI(),
      this.validatePostHog(),
      this.validateSentry()
    ]);

    // Log results
    results.forEach(result => {
      const icon = result.isValid ? '✅' : '❌';
      console.log(`${icon} ${result.service}: ${result.message}`);
    });

    return results;
  }

  static async testDatabaseMigrations(): Promise<{ applied: string[]; missing: string[] }> {
    const expectedMigrations = [
      '20250926165411_azure_pebble.sql',
      '20250927105340_holy_meadow.sql', 
      '20250927112956_heavy_recipe.sql',
      '20250927115808_dawn_frost.sql',
      '20250927120000_cover_letters.sql',
      '20250927123118_steep_bush.sql',
      '20250927130513_heavy_delta.sql',
      '20250927150311_shy_hall.sql',
      '20250927165407_curly_hall.sql',
      '20250927173835_bronze_violet.sql',
      '20250927181213_sweet_snowflake.sql',
      '20250927182013_light_recipe.sql'
    ];

    const applied: string[] = [];
    const missing: string[] = [];

    try {
      const { supabase } = await import('../lib/supabase');
      
      // Test core tables that should exist after migrations
      const tablesToCheck = [
        'users', 'resumes', 'exports', 'user_entitlements', 
        'payment_receipts', 'cover_letters', 'admin_logs',
        'data_retention_policies', 'job_roles', 'analytics_events'
      ];

      for (const table of tablesToCheck) {
        try {
          const { error } = await supabase.from(table).select('id').limit(1);
          if (!error) {
            applied.push(`Table ${table} exists`);
          } else {
            missing.push(`Table ${table} missing: ${error.message}`);
          }
        } catch (error: any) {
          missing.push(`Table ${table} error: ${error.message}`);
        }
      }
    } catch (error: any) {
      missing.push(`Database connection failed: ${error.message}`);
    }

    return { applied, missing };
  }

  static async testEdgeFunctions(): Promise<{ working: string[]; failing: string[] }> {
    const functions = [
      'auth',
      'parse-resume', 
      'ai-enhance',
      'job-matching',
      'cover-letter',
      'export-resume',
      'payments',
      'analytics',
      'admin',
      'data-purge'
    ];

    const working: string[] = [];
    const failing: string[] = [];

    for (const func of functions) {
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${func}`, {
          method: 'OPTIONS'
        });
        
        if (response.ok) {
          working.push(func);
        } else {
          failing.push(`${func}: HTTP ${response.status}`);
        }
      } catch (error: any) {
        failing.push(`${func}: ${error.message}`);
      }
    }

    return { working, failing };
  }
}

// Auto-run validation on import in development
if (import.meta.env.DEV) {
  setTimeout(() => {
    IntegrationValidator.validateAllIntegrations();
  }, 3000);
}