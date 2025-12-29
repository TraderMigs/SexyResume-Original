export interface SecurityConfig {
  maxFileSize: number;
  allowedFileTypes: string[];
  maxRequestsPerMinute: number;
  sessionTimeoutMinutes: number;
}

export const SECURITY_CONFIG: SecurityConfig = {
  maxFileSize: 10 * 1024 * 1024,
  allowedFileTypes: ['.pdf', '.docx', '.doc', '.txt'],
  maxRequestsPerMinute: 60,
  sessionTimeoutMinutes: 120
};

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
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .substring(0, 10000);
}

export function validateFileSecure(file: File): { isValid: boolean; error?: string } {
  const basicValidation = validateFile(file);
  if (!basicValidation.isValid) {
    return basicValidation;
  }

  const fileName = file.name.toLowerCase();
  
  const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.js', '.php', '.asp', '.jsp', '.jar', '.com', '.pif'];
  if (suspiciousExtensions.some(ext => fileName.endsWith(ext))) {
    return { isValid: false, error: 'File type not allowed for security reasons' };
  }

  const extensionCount = (file.name.match(/\./g) || []).length;
  if (extensionCount > 1) {
    return { isValid: false, error: 'Files with multiple extensions are not allowed' };
  }

  const suspiciousNames = ['autorun', 'desktop.ini', 'thumbs.db', '.htaccess', 'web.config'];
  if (suspiciousNames.some(name => fileName.includes(name))) {
    return { isValid: false, error: 'File name not allowed' };
  }

  return { isValid: true };
}

export function validateFile(file: File): { isValid: boolean; error?: string } {
  if (file.size > SECURITY_CONFIG.maxFileSize) {
    return {
      isValid: false,
      error: `File size exceeds ${SECURITY_CONFIG.maxFileSize / (1024 * 1024)}MB limit`
    };
  }

  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!SECURITY_CONFIG.allowedFileTypes.includes(extension)) {
    return {
      isValid: false,
      error: `File type not allowed. Supported types: ${SECURITY_CONFIG.allowedFileTypes.join(', ')}`
    };
  }

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

export function validateURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  isAllowed(key: string, maxRequests: number = SECURITY_CONFIG.maxRequestsPerMinute): boolean {
    const now = Date.now();
    const windowStart = now - 60000;
    
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

export function getSecureSessionConfig() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'strict' as const,
    maxAge: SECURITY_CONFIG.sessionTimeoutMinutes * 60 * 1000
  };
}

export function getCSPDirectives(): string {
  const directives = [
    "default-src 'self'",
    "script-src 'self' https://js.stripe.com https://app.posthog.com https://*.sentry.io",
    "style-src 'self' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com https://app.posthog.com https://*.sentry.io",
    "frame-src https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ];
  
  return directives.join('; ');
}

export function containsPII(text: string): boolean {
  const piiPatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/,
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
    /\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/
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

  if (import.meta.env.PROD && typeof window !== 'undefined') {
    fetch('/api/security-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(securityEvent)
    }).catch(() => {});
  }
}

export function validatePasswordStrength(password: string): { isValid: boolean; error?: string; score: number } {
  let score = 0;
  const issues: string[] = [];

  if (password.length < 12) {
    issues.push('at least 12 characters');
  } else {
    score += 25;
  }

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

  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    issues.push('avoid common passwords');
    score = Math.max(0, score - 50);
  }

  const isValid = issues.length === 0;
  const error = issues.length > 0 ? `Password must include: ${issues.join(', ')}` : undefined;

  return { isValid, error, score };
}
