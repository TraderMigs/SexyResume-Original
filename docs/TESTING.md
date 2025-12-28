# Testing Guide

This document outlines the testing strategy and practices for SexyResume.com.

## Testing Stack

- **Unit/Integration**: Vitest + React Testing Library
- **E2E**: Playwright with cross-browser testing
- **Accessibility**: axe-core + @axe-core/playwright
- **Visual Regression**: Playwright screenshots
- **API Testing**: Vitest with mocked endpoints

## Test Categories

### 1. Unit Tests (`src/**/*.test.tsx`)
Test individual components and hooks in isolation.

```bash
npm run test:unit          # Run once with coverage
npm run test:watch         # Watch mode for development
```

**Coverage Targets:**
- Functions: 70%
- Branches: 70%
- Lines: 70%
- Statements: 70%

### 2. Integration Tests
Test component interactions and data flow.

**Key Areas:**
- Form validation and submission
- Template selection and customization
- Resume data persistence
- Authentication flows

### 3. E2E Tests (`tests/e2e/*.spec.ts`)
Test complete user journeys across browsers.

```bash
npm run test:e2e           # Run all E2E tests
npm run test:e2e:ui        # Run with Playwright UI
```

**Critical Flows:**
- Resume building: signup → upload → parse → template → export
- Payment: checkout → webhook → unlock → export
- Cover letter: generate → edit → export

### 4. Accessibility Tests
Ensure WCAG 2.2 A/AA compliance.

```bash
npm run test:a11y          # Playwright accessibility tests
npm run lint:a11y          # axe-core CLI audit
```

**WCAG 2.2 Targets:**
- **Level A**: Keyboard access, alt text, form labels
- **Level AA**: Color contrast (4.5:1), focus indicators, error identification

### 5. Visual Regression Tests
Prevent unintended UI changes.

```bash
npm run test:visual        # Screenshot comparison tests
```

**Covered Areas:**
- Resume preview rendering
- Template variations
- Mobile responsive layouts
- Dark mode compatibility

## CI/CD Pipeline

### Pull Request Gates
1. **Lint & Type Check** - Code quality and type safety
2. **Unit Tests** - Component and hook testing
3. **Accessibility Tests** - WCAG compliance
4. **E2E Tests** - Critical user flows
5. **Visual Regression** - UI consistency

### Deployment Gates
- All PR gates must pass
- Security audit (npm audit)
- Build verification
- Performance budget check

## Writing Tests

### Component Tests
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
  
  it('handles user interaction', async () => {
    const user = userEvent.setup();
    const mockFn = vi.fn();
    
    render(<ComponentName onClick={mockFn} />);
    await user.click(screen.getByRole('button'));
    
    expect(mockFn).toHaveBeenCalled();
  });
});
```

### E2E Tests
```typescript
import { test, expect } from '@playwright/test';

test('user flow description', async ({ page }) => {
  await page.goto('/');
  
  // Interact with page
  await page.fill('input[name="email"]', 'test@example.com');
  await page.click('button:has-text("Submit")');
  
  // Assert results
  await expect(page.locator('text=Success')).toBeVisible();
});
```

### Accessibility Tests
```typescript
import AxeBuilder from '@axe-core/playwright';

test('accessibility compliance', async ({ page }) => {
  await page.goto('/');
  
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
    
  expect(results.violations).toEqual([]);
});
```

## Test Data Management

### Mock Data
- Use consistent mock data across tests
- Store in `src/test/fixtures/`
- Include edge cases and error scenarios

### API Mocking
- Mock Supabase client in tests
- Use MSW for API endpoint mocking
- Test both success and failure scenarios

## Performance Testing

### Bundle Analysis
```bash
npm run build
npx vite-bundle-analyzer dist
```

### Core Web Vitals
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

## Debugging Tests

### Failed Tests
1. Check test output and error messages
2. Review screenshots/videos in `test-results/`
3. Use Playwright trace viewer for E2E failures
4. Run tests in headed mode for debugging

### Visual Regression Failures
1. Review diff images in `test-results/`
2. Update baselines if changes are intentional
3. Check for timing issues or animations

## Continuous Improvement

### Metrics to Track
- Test coverage percentage
- Test execution time
- Flaky test identification
- Accessibility score trends

### Regular Reviews
- Weekly: Review failed tests and flaky tests
- Monthly: Update test coverage targets
- Quarterly: Review testing strategy and tools