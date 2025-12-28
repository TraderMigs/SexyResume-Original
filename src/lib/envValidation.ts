// Environment variable validation for production security

interface RequiredEnvVars {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_STRIPE_PUBLISHABLE_KEY: string;
}

interface OptionalEnvVars {
  VITE_SENTRY_DSN?: string;
  VITE_POSTHOG_KEY?: string;
  VITE_POSTHOG_HOST?: string;
  VITE_STRIPE_PRICE_ID?: string;
}

export function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required environment variables
  const requiredVars: (keyof RequiredEnvVars)[] = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_STRIPE_PUBLISHABLE_KEY'
  ];

  requiredVars.forEach(varName => {
    const value = import.meta.env[varName];
    if (!value) {
      errors.push(`Missing required environment variable: ${varName}`);
    } else if (!value.includes('your_') && !value.includes('placeholder')) {
      // Validate format
      switch (varName) {
        case 'VITE_SUPABASE_URL':
          if (!value.startsWith('https://') || !value.includes('supabase.co')) {
            errors.push(`Invalid Supabase URL format: ${varName}`);
          }
          break;
        case 'VITE_SUPABASE_ANON_KEY':
          if (!value.startsWith('eyJ')) {
            errors.push(`Invalid Supabase anon key format: ${varName}`);
          }
          break;
        case 'VITE_STRIPE_PUBLISHABLE_KEY':
          if (!value.startsWith('pk_test_') && !value.startsWith('pk_live_')) {
            errors.push(`Invalid Stripe publishable key format: ${varName}`);
          }
          break;
      }
    } else if (import.meta.env.PROD) {
        // Only error on placeholders in production
      errors.push(`Environment variable ${varName} contains placeholder value`);
    }
  });

  // Validate production-specific requirements
  if (import.meta.env.PROD) {
    if (!import.meta.env.VITE_SENTRY_DSN) {
      console.warn('Sentry DSN recommended for production error monitoring');
    }
    
    if (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_')) {
      errors.push('Test Stripe keys detected in production build');
    }
  } else {
    // Development mode warnings
    if (import.meta.env.VITE_SUPABASE_URL?.includes('placeholder')) {
      console.warn('Using placeholder Supabase URL in development mode');
    }
    if (import.meta.env.VITE_SUPABASE_ANON_KEY?.includes('placeholder')) {
      console.warn('Using placeholder Supabase anon key in development mode');
    }
    if (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.includes('placeholder')) {
      console.warn('Using placeholder Stripe key in development mode');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Initialize environment validation
export function initEnvironmentValidation() {
  const validation = validateEnvironment();
  
  if (!validation.isValid) {
    console.error('Environment validation failed:', validation.errors);
    
    if (import.meta.env.PROD) {
      // In production, show user-friendly error
      document.body.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f3f4f6; font-family: system-ui;">
          <div style="background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); max-width: 400px; text-align: center;">
            <h1 style="color: #dc2626; margin-bottom: 1rem;">Configuration Error</h1>
            <p style="color: #6b7280; margin-bottom: 1rem;">The application is not properly configured. Please contact support.</p>
            <p style="color: #9ca3af; font-size: 0.875rem;">Error ID: ENV_VALIDATION_FAILED</p>
          </div>
        </div>
      `;
      throw new Error('Environment validation failed in production');
    } else {
      // In development, show warnings but continue
      console.warn('Development mode: Some environment variables are missing or contain placeholders');
    }
  }
  
  return validation;
}