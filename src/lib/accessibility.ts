// Accessibility utilities and WCAG 2.2 compliance helpers

export interface A11yConfig {
  announceChanges: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  focusVisible: boolean;
}

// Screen reader announcements
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Focus management
export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
  
  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };
  
  element.addEventListener('keydown', handleTabKey);
  firstElement?.focus();
  
  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
}

// Color contrast checker
export function checkContrast(foreground: string, background: string): {
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
} {
  const getLuminance = (color: string) => {
    const rgb = hexToRgb(color);
    if (!rgb) return 0;
    
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  
  return {
    ratio,
    wcagAA: ratio >= 4.5,
    wcagAAA: ratio >= 7
  };
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Keyboard navigation helpers
export function handleArrowNavigation(
  event: KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  onSelect: (index: number) => void
) {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      const nextIndex = (currentIndex + 1) % items.length;
      items[nextIndex]?.focus();
      onSelect(nextIndex);
      break;
      
    case 'ArrowUp':
      event.preventDefault();
      const prevIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
      items[prevIndex]?.focus();
      onSelect(prevIndex);
      break;
      
    case 'Home':
      event.preventDefault();
      items[0]?.focus();
      onSelect(0);
      break;
      
    case 'End':
      event.preventDefault();
      items[items.length - 1]?.focus();
      onSelect(items.length - 1);
      break;
  }
}

// Form validation with accessibility
export function validateFormField(
  value: string,
  rules: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: string) => string | null;
  }
): { isValid: boolean; error: string | null; ariaDescribedBy?: string } {
  if (rules.required && !value.trim()) {
    return {
      isValid: false,
      error: 'This field is required',
      ariaDescribedBy: 'error-required'
    };
  }
  
  if (rules.minLength && value.length < rules.minLength) {
    return {
      isValid: false,
      error: `Must be at least ${rules.minLength} characters`,
      ariaDescribedBy: 'error-min-length'
    };
  }
  
  if (rules.maxLength && value.length > rules.maxLength) {
    return {
      isValid: false,
      error: `Must be no more than ${rules.maxLength} characters`,
      ariaDescribedBy: 'error-max-length'
    };
  }
  
  if (rules.pattern && !rules.pattern.test(value)) {
    return {
      isValid: false,
      error: 'Invalid format',
      ariaDescribedBy: 'error-pattern'
    };
  }
  
  if (rules.custom) {
    const customError = rules.custom(value);
    if (customError) {
      return {
        isValid: false,
        error: customError,
        ariaDescribedBy: 'error-custom'
      };
    }
  }
  
  return { isValid: true, error: null };
}

// WCAG 2.2 compliance checkers
export function checkWCAGCompliance(element: HTMLElement): {
  focusable: boolean;
  hasLabel: boolean;
  hasRole: boolean;
  contrastOk: boolean;
  keyboardAccessible: boolean;
  hasAriaDescribedBy: boolean;
  hasValidAriaAttributes: boolean;
} {
  const computedStyle = window.getComputedStyle(element);
  
  // Check for aria-describedby
  const hasAriaDescribedBy = !!element.getAttribute('aria-describedby');
  
  // Validate ARIA attributes
  const ariaAttributes = Array.from(element.attributes).filter(attr => attr.name.startsWith('aria-'));
  const hasValidAriaAttributes = ariaAttributes.every(attr => {
    // Basic ARIA attribute validation
    const validAriaAttributes = [
      'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-hidden', 
      'aria-expanded', 'aria-controls', 'aria-live', 'aria-atomic',
      'aria-invalid', 'aria-required', 'aria-disabled', 'aria-readonly'
    ];
    return validAriaAttributes.includes(attr.name);
  });
  
  return {
    focusable: element.tabIndex >= 0 || ['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'A'].includes(element.tagName),
    hasLabel: !!(element.getAttribute('aria-label') || element.getAttribute('aria-labelledby') || element.querySelector('label')),
    hasRole: !!element.getAttribute('role'),
    contrastOk: checkContrast(computedStyle.color, computedStyle.backgroundColor).wcagAA,
    keyboardAccessible: element.tabIndex !== -1,
    hasAriaDescribedBy,
    hasValidAriaAttributes
  };
}

// Accessibility testing utilities
export function runA11yAudit(container: HTMLElement = document.body): {
  errors: Array<{ element: HTMLElement; issue: string; severity: 'error' | 'warning' }>;
  score: number;
} {
  const errors: Array<{ element: HTMLElement; issue: string; severity: 'error' | 'warning' }> = [];
  
  // Check for missing alt text on images
  container.querySelectorAll('img').forEach(img => {
    if (!img.alt && !img.getAttribute('aria-hidden')) {
      errors.push({
        element: img,
        issue: 'Image missing alt text',
        severity: 'error'
      });
    }
  });
  
  // Check for form inputs without labels
  container.querySelectorAll('input, select, textarea').forEach(input => {
    const hasLabel = input.getAttribute('aria-label') || 
                    input.getAttribute('aria-labelledby') || 
                    container.querySelector(`label[for="${input.id}"]`);
    
    if (!hasLabel) {
      errors.push({
        element: input as HTMLElement,
        issue: 'Form input missing label',
        severity: 'error'
      });
    }
  });
  
  // Check for buttons without accessible names
  container.querySelectorAll('button').forEach(button => {
    const hasName = button.textContent?.trim() || 
                   button.getAttribute('aria-label') || 
                   button.getAttribute('aria-labelledby');
    
    if (!hasName) {
      errors.push({
        element: button,
        issue: 'Button missing accessible name',
        severity: 'error'
      });
    }
  });
  
  // Check for proper error message associations
  container.querySelectorAll('input[aria-invalid="true"]').forEach(input => {
    const hasErrorDescription = input.getAttribute('aria-describedby');
    if (!hasErrorDescription) {
      errors.push({
        element: input as HTMLElement,
        issue: 'Invalid input missing error description',
        severity: 'error'
      });
    }
  });

  // Check for proper landmark regions
  const hasMain = container.querySelector('main, [role="main"]');
  const hasNav = container.querySelector('nav, [role="navigation"]');
  
  if (!hasMain) {
    errors.push({
      element: container,
      issue: 'Missing main landmark region',
      severity: 'warning'
    });
  }

  // Check for heading hierarchy
  const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let lastLevel = 0;
  
  headings.forEach(heading => {
    const level = parseInt(heading.tagName.charAt(1));
    if (level > lastLevel + 1) {
      errors.push({
        element: heading as HTMLElement,
        issue: `Heading level skipped (h${lastLevel} to h${level})`,
        severity: 'warning'
      });
    }
    lastLevel = level;
  });
  
  const totalChecks = container.querySelectorAll('img, input, select, textarea, button, h1, h2, h3, h4, h5, h6').length;
  const errorCount = errors.filter(e => e.severity === 'error').length;
  const score = totalChecks > 0 ? Math.max(0, (totalChecks - errorCount) / totalChecks * 100) : 100;
  
  return { errors, score };
}