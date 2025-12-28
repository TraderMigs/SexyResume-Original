import posthog from 'posthog-js';

// Global consent state
let analyticsConsent = false;

// Initialize PostHog for analytics
export function initAnalytics(hasConsent: boolean = false) {
  analyticsConsent = hasConsent;
  
  // PostHog initialization disabled to prevent fetch errors
  // To enable: configure VITE_POSTHOG_KEY and VITE_POSTHOG_HOST in .env
  if (import.meta.env.DEV || !hasConsent) {
    console.log('PostHog analytics disabled - configure environment variables to enable');
    return;
  }
  
  // Initialize PostHog only with consent
  if (import.meta.env.VITE_POSTHOG_KEY && hasConsent) {
    posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
      api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
      opt_out_capturing_by_default: true, // Require explicit opt-in
      respect_dnt: true,
      disable_session_recording: !hasConsent,
      disable_surveys: true,
      disable_toolbar: true
    });
    
    // Opt in to capturing only with consent
    posthog.opt_in_capturing();
  }
}

// Update consent status
export function updateAnalyticsConsent(hasConsent: boolean) {
  analyticsConsent = hasConsent;
  
  if (typeof posthog !== 'undefined') {
    if (hasConsent) {
      posthog.opt_in_capturing();
    } else {
      posthog.opt_out_capturing();
    }
  }
}

// Analytics event types
export interface AnalyticsEvent {
  // Resume building events
  'resume_section_completed': { section: string; completion_percentage: number };
  'template_selected': { template_id: string; recommendation_score?: number };
  'template_customized': { template_id: string; customization_type: string };
  
  // Upload and parsing events
  'parse_started': { file_type: string; file_size: number };
  'parse_completed': { confidence: number; sections_found: number; duration_ms: number };
  'parse_review_opened': { confidence: number; fields_count: number };
  'parse_review_completed': { corrections_made: number; final_confidence: number };
  
  // Export events
  'export_preview_requested': { format: string; template: string };
  'export_started': { format: string; template: string; watermarked: boolean };
  'export_completed': { format: string; file_size: number; duration_ms: number };
  'export_failed': { format: string; error_type: string };
  
  // Payment events
  'checkout_started': { product: string; amount: number };
  'checkout_completed': { product: string; amount: number; payment_method: string };
  'checkout_abandoned': { product: string; step: string };
  
  // Cover letter events
  'cover_letter_generation_started': { tone: string; length: string; has_job_description: boolean };
  'cover_letter_generated': { word_count: number; sections_count: number; duration_ms: number };
  'cover_letter_edited': { edit_count: number; word_count_change: number };
  
  // User journey events
  'user_registered': { source?: string };
  'user_signed_in': { method: string };
  'feature_unlocked': { feature: string; payment_amount: number };
}

// Track analytics events
export function trackEvent<T extends keyof AnalyticsEvent>(
  event: T,
  properties: AnalyticsEvent[T] & { user_id?: string }
) {
  // Only track if user has consented
  if (!analyticsConsent) {
    return;
  }
  
  // Remove any PII from properties
  const sanitizedProperties = sanitizeAnalyticsProperties(properties);
  
  if (typeof posthog !== 'undefined') {
    posthog.capture(event, sanitizedProperties);
  }
}

// Sanitize analytics properties to remove PII
function sanitizeAnalyticsProperties(properties: Record<string, any>): Record<string, any> {
  const sanitized = { ...properties };
  
  // Remove PII fields
  const piiFields = [
    'email', 'phone', 'fullName', 'name', 'address', 'location',
    'personalInfo', 'userData', 'userEmail', 'userName', 'user_id'
  ];
  
  piiFields.forEach(field => {
    delete sanitized[field];
  });
  
  // Recursively sanitize nested objects
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeAnalyticsProperties(sanitized[key]);
    }
  });
  
  return;
}

// Track page views
export function trackPageView(path: string, title?: string) {
  if (!analyticsConsent || typeof posthog === 'undefined') {
    return;
  }
  
  posthog.capture('$pageview', {
    $current_url: path,
    $title: title
  });
  return;
}

// Track user identification (without PII)
export function identifyUser(userId: string, traits?: Record<string, any>) {
  if (!analyticsConsent || typeof posthog === 'undefined') {
    return;
  }
  
  // Only identify with non-PII traits
  const sanitizedTraits = traits ? sanitizeAnalyticsProperties(traits) : {};
  posthog.identify(userId, sanitizedTraits);
  return;
}

// Track conversion funnel steps
export function trackFunnelStep(funnel: string, step: string, properties?: Record<string, any>) {
  trackEvent('funnel_step' as any, {
    funnel,
    step,
    ...properties
  });
}

// Performance tracking
export function trackPerformance(metric: string, value: number, unit: string = 'ms') {
  posthog.capture('performance_metric', {
    metric,
    value,
    unit,
    timestamp: Date.now()
  });
}

// Error tracking (non-PII)
export function trackError(error: Error, context?: Record<string, any>) {
  const sanitizedContext = context ? { ...context } : {};
  // Remove PII from context
  delete sanitizedContext.email;
  delete sanitizedContext.personalInfo;
  delete sanitizedContext.userData;
  
  posthog.capture('error_occurred', {
    error_message: error.message,
    error_stack: error.stack?.substring(0, 500), // Truncate stack trace
    context: sanitizedContext
  });
}

// Helper functions
function shouldSendToTelemetry(event: string): boolean {
  const telemetryEvents = [
    'parse_completed',
    'export_completed',
    'checkout_completed',
    'cover_letter_generated'
  ];
  return telemetryEvents.includes(event);
}

async function sendToTelemetry(event: string, properties: Record<string, any>) {
  try {
    // Send to custom telemetry endpoint if needed
    await fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, properties, timestamp: Date.now() })
    });
  } catch (error) {
    console.warn('Telemetry failed:', error);
  }
}