// Security utilities and validation functions

export interface SecurityConfig {
  maxFileSize: number;
  allowedFileTypes: string[];
  maxRequestsPerMinute: number;
  sessionTimeoutMinutes: number;
}

export const SECURITY_CONFIG: SecurityConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['.pdf', '.docx', '.doc', '.txt'],
  maxRequestsPerMinute: 60,
  sessionTimeoutMinutes: 120
};

// Input sanitization
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .substring(0, 10000); // Limit length
}

// Enhanced file validation with security checks
export function validateFileSecure(file: File): { isValid: boolean; error?: string } {
  // Basic validation first
  const basicValidation = validateFile(file);
  if (!basicValidation.isValid) {
    return basicValidation;
  }

  // Additional security checks
  const fileName = file.name.toLowerCase();
  
  // Check for suspicious file extensions
  const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.js', '.php', '.asp', '.jsp', '.jar', '.com', '.pif'];
  if (suspiciousExtensions.some(ext => fileName.endsWith(ext))) {
    return { isValid: false, error: 'File type not allowed for security reasons' };
  }

  // Check for double extensions (e.g., file.pdf.exe)
  const extensionCount = (file.name.match(/\./g) || []).length;
  if (extensionCount > 1) {
    return { isValid: false, error: 'Files with multiple extensions are not allowed' };
  }

  // Check for suspicious file names
  const suspiciousNames = ['autorun', 'desktop.ini', 'thumbs.db', '.htaccess', 'web.config'];
  if (suspiciousNames.some(name => fileName.includes(name))) {
    return { isValid: false, error: 'File name not allowed' };
  }

  return { isValid: true };
}

// File validation
export function validateFile(file: File): { isValid: boolean; error?: string } {
  // Check file size
  if (file.size > SECURITY_CONFIG.maxFileSize) {
    return {
      isValid: false,
      error: `File size exceeds ${SECURITY_CONFIG.maxFileSize / (1024 * 1024)}MB limit`
    };
  }

  // Check file type
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!SECURITY_CONFIG.allowedFileTypes.includes(extension)) {
    return {
      isValid: false,
      error: `File type not allowed. Supported types: ${SECURITY_CONFIG.allowedFileTypes.join(', ')}`
    };
  }

  // Check for suspicious file names
  const suspiciousPatterns = [
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.scr$/i,
    /\.vbs$/i,
    /\.js$/i,
    /\.php$/i,
    /\.asp$/i,
    /\.jsp$/i
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
    return {
      isValid: false,
      error: 'File type not allowed for security reasons'
    };
  }

  return { isValid: true };
}

// URL validation
export function validateURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Phone validation
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

// Rate limiting (client-side tracking)
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  isAllowed(key: string, maxRequests: number = SECURITY_CONFIG.maxRequestsPerMinute): boolean {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window
    
    const userRequests = this.requests.get(key) || [];
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    
    return true;
  }

  reset(key: string): void {
    this.requests.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

// Session security
export function getSecureSessionConfig() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'strict' as const,
    maxAge: SECURITY_CONFIG.sessionTimeoutMinutes * 60 * 1000
  };
}

// Content Security Policy
export function getCSPDirectives(): string {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://app.posthog.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com https://app.posthog.com https://*.sentry.io",
    "frame-src https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ];
  
  return directives.join('; ');
}

// PII detection and sanitization
export function containsPII(text: string): boolean {
  const piiPatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
    /\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/ // Phone
  ];
  
  return piiPatterns.some(pattern => pattern.test(text));
}

export function sanitizePII(text: string): string {
  return text
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '***-**-****')
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '****-****-****-****')
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '***@***.***')
    .replace(/\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/g, '***-***-****');
}

// Audit logging
export function logSecurityEvent(event: {
  type: 'auth_failure' | 'auth_attempt' | 'suspicious_activity' | 'rate_limit_exceeded' | 'invalid_input' | 'file_upload_rejected' | 'admin_access_attempt';
  details: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}) {
  const securityEvent = {
    ...event,
    timestamp: new Date().toISOString(),
    userAgent: event.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'),
    severity: event.severity || 'medium'
  };

  // Log to console (in production, send to secure logging service)
  if (event.severity === 'critical' || event.severity === 'high') {
    console.error('CRITICAL SECURITY EVENT:', securityEvent);
  } else {
    console.warn('Security Event:', securityEvent);
  }

  // In production, send to Sentry or dedicated security monitoring service
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    // Send to monitoring service
    fetch('/api/security-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(securityEvent)
    }).catch(error => {
      console.error('Failed to send security event:', error);
    });
  }
}

// Password strength validation
export function validatePasswordStrength(password: string): { isValid: boolean; error?: string; score: number } {
  let score = 0;
  const issues: string[] = [];

  // Length check
  if (password.length < 12) {
    issues.push('at least 12 characters');
  } else {
    score += 25;
  }

  // Character type checks
  if (!/[A-Z]/.test(password)) {
    issues.push('uppercase letters');
  } else {
    score += 25;
  }

  if (!/[a-z]/.test(password)) {
    issues.push('lowercase letters');
  } else {
    score += 25;
  }

  if (!/\d/.test(password)) {
    issues.push('numbers');
  } else {
    score += 15;
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    issues.push('special characters');
  } else {
    score += 10;
  }

  // Common password checks
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    issues.push('avoid common passwords');
    score = Math.max(0, score - 50);
  }

  const isValid = issues.length === 0;
  const error = issues.length > 0 ? `Password must include: ${issues.join(', ')}` : undefined;

  return { isValid, error, score };
}