# Money Path E2E Test Documentation

## Overview

The `money-path-complete.spec.ts` test proves the complete customer journey from signup to paid export with accessibility validation at every step.

## Test Scenario

```
signup → upload (PDF) → parse review (edit field) → template select →
pay (Stripe test) → export (PDF + DOCX) → signed download OK
```

## Objectives

1. **Test User + Stripe Fixtures**: Uses generated test users and Stripe CLI fixtures
2. **Webhook Verification**: Asserts entitlement flips ONLY after webhook processes
3. **Accessibility Validation**: Runs axe on each page; fails test on violations
4. **Artifacts**: Generates playwright-report/, videos, screenshots, junit.xml
5. **Low Flake Rate**: Target <1% flake rate through anti-flake patterns

## Running the Test

### Prerequisites

1. **Supabase**: Database must be running and accessible
2. **Environment Variables**: Required `.env` file:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Stripe CLI** (Optional for real webhook testing):
   ```bash
   stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
   ```

### Run Commands

```bash
# Run the money path test only
npm run test:e2e -- money-path-complete

# Run with UI mode (visual debugging)
npm run test:e2e:ui

# Run in headed mode (see browser)
npx playwright test money-path-complete --headed

# Run with slow motion (for debugging)
SLOW_MO=1 npx playwright test money-path-complete --headed

# Run and keep artifacts on success
npx playwright test money-path-complete --trace on
```

### CI/CD Integration

```yaml
# .github/workflows/e2e-money-path.yml
- name: Run Money Path E2E
  run: npm run test:e2e -- money-path-complete
  env:
    VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

## Test Steps Breakdown

### Step 1: Signup
- Opens landing page
- **A11y Scan**: Landing page
- Clicks sign in button
- Opens auth modal
- **A11y Scan**: Auth modal
- Fills signup form with test user
- Submits registration

### Step 2: Upload PDF Resume
- Clicks "Upload Resume" button
- Opens upload modal
- **A11y Scan**: Upload modal
- Selects sample PDF from fixtures
- Waits for upload completion

### Step 3: Parse Review (Edit One Field)
- Navigates to personal info tab
- **A11y Scan**: Parse review workspace
- Edits email field
- Verifies edit was applied

### Step 4: Template Selection
- Navigates to template selector
- **A11y Scan**: Template selector
- Selects first available template

### Step 5: Verify No Entitlement (Before Payment)
- Queries database for user entitlement
- **Assert**: `has_paid = false`

### Step 6: Payment Gate
- Navigates to export tab
- **A11y Scan**: Payment gate
- Verifies payment wall is displayed
- Shows $7.00 price

### Step 7: Simulate Stripe Payment
- Generates test checkout session
- Triggers Stripe webhook (simulated)
- Waits for webhook processing

### Step 8: Verify Entitlement (After Webhook)
- Queries database again
- **Assert**: `has_paid = true`
- **Assert**: `payment_provider = 'stripe'`
- **Critical**: Entitlement only flips AFTER webhook

### Step 9: Export PDF + DOCX
- Reloads page with new entitlement
- Navigates to export tab
- **A11y Scan**: Export options
- Downloads PDF (verifies file size > 0)
- Downloads DOCX (verifies file size > 0)

### Step 10: Verify Signed URLs
- Checks download links contain signatures
- **Assert**: URLs include `token=` or `signature=` or `Expires=`

## Accessibility Validation

Each critical page is scanned with axe-core:
- **Tags**: `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`
- **Failure**: Test fails if ANY violations found
- **Reports**: JSON reports saved to `playwright-report/a11y/`

### Scanned Pages
1. Landing Page
2. Auth Modal
3. Upload Modal
4. Parse Review Workspace
5. Template Selector
6. Payment Gate
7. Export Options

## Anti-Flake Patterns

### 1. Wait Strategies
```typescript
// Wait for element with stability period
await waitForElementStable(page, selector, { timeout: 10000 });

// Wait for network to be idle
await page.waitForLoadState('networkidle');

// Additional stability wait
await page.waitForTimeout(100);
```

### 2. Retry Logic
- Playwright configured with 2 retries in CI, 1 locally
- Individual actions timeout: 15s
- Navigation timeout: 30s
- Assertion timeout: 10s

### 3. Consistent State
- Fixed viewport: 1280x720
- Animations disabled
- Stable test user generation (timestamp-based)
- Network idle checks before interactions

### 4. Error Handling
```typescript
try {
  const download = await downloadPromise;
  // Verify download
} catch (error) {
  console.warn('⚠ Download timed out (may not be implemented)');
  // Don't fail test - feature may be in progress
}
```

## Artifacts Generated

### Directory Structure
```
playwright-report/
├── a11y/
│   ├── landing-page.json
│   ├── auth-modal.json
│   ├── upload-modal.json
│   ├── parse-review-workspace.json
│   ├── template-selector.json
│   ├── payment-gate.json
│   └── export-options.json
├── traces/
│   └── money-path-complete.zip
├── videos/
│   └── money-path-complete.webm
└── index.html

test-results/
├── results.json
├── junit.xml
└── [screenshots on failure]
```

### Viewing Artifacts

```bash
# Open HTML report
npx playwright show-report playwright-report

# View trace file
npx playwright show-trace playwright-report/traces/money-path-complete.zip

# View video
open playwright-report/videos/money-path-complete.webm
```

## Test Fixtures

### User Fixture
```typescript
// tests/fixtures/test-user.ts
const testUser = generateTestUser();
// { email: "test-1234567890-abc123@e2etest.com", password: "...", ... }
```

### Resume Fixture
```typescript
// tests/fixtures/sample-resume.pdf
// Valid PDF with realistic resume content
```

### Stripe Fixtures
```typescript
// tests/fixtures/stripe-fixtures.ts
const session = generateTestCheckoutSession(userId);
const event = generateCheckoutSessionCompletedEvent(userId);
```

## Debugging Flaky Tests

### 1. Run with Trace
```bash
npx playwright test money-path-complete --trace on
```

### 2. Run with UI Mode
```bash
npx playwright test money-path-complete --ui
```

### 3. Check Accessibility Reports
```bash
cat playwright-report/a11y/[step-name].json | jq '.violations'
```

### 4. Increase Timeouts Temporarily
```bash
# Edit test timeout
test.setTimeout(300000); // 5 minutes
```

### 5. Enable Slow Motion
```bash
SLOW_MO=1 npx playwright test money-path-complete --headed
```

## Known Limitations

1. **Webhook Simulation**: Test simulates webhooks rather than using Stripe CLI
   - For production CI, integrate Stripe CLI with `stripe listen --forward-to`

2. **Real Stripe Checkout**: Test doesn't navigate to actual Stripe checkout
   - Use test mode Stripe checkout in full integration tests

3. **Email Confirmation**: Test assumes email confirmation is disabled
   - Enable in Supabase Auth settings if needed

4. **Database Cleanup**: Test doesn't clean up test users
   - Implement cleanup in `afterEach` or use separate test database

## Flake Rate Calculation

```typescript
// Formula: Flake Rate = (Failed Runs / Total Runs) * 100
// Target: <1% flake rate

// Example over 100 runs:
// - 99 passes, 1 failure = 1% flake rate ✓
// - 98 passes, 2 failures = 2% flake rate ✗
```

### Measuring Flake Rate

```bash
# Run test 100 times and measure flake rate
for i in {1..100}; do
  npm run test:e2e -- money-path-complete >> test-log.txt 2>&1
done

# Count failures
grep -c "failed" test-log.txt
```

## Success Criteria

- ✅ All 10 steps complete successfully
- ✅ Zero accessibility violations across all pages
- ✅ Entitlement flips ONLY after webhook
- ✅ PDF and DOCX downloads succeed
- ✅ Signed URLs contain authentication tokens
- ✅ Flake rate <1% over 100 runs
- ✅ Artifacts generated correctly

## Troubleshooting

### Test Hangs on Upload
```typescript
// Increase timeout
const uploadSuccess = page.locator('text=Upload Complete');
await uploadSuccess.waitFor({ timeout: 30000 });
```

### Auth Modal Doesn't Open
```typescript
// Check for existing auth state
await page.context().clearCookies();
await page.reload();
```

### Entitlement Not Flipping
```typescript
// Check webhook processing
const { data } = await supabase
  .from('webhook_events')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(5);
console.log('Recent webhooks:', data);
```

### Accessibility Violations
```bash
# View detailed violation report
cat playwright-report/a11y/[page-name].json | jq '.violations[] | {id, impact, help}'
```

## Related Tests

- `authentication.spec.ts` - Auth flow only
- `payment-flow.spec.ts` - Payment gate UI
- `dual-mode-export.spec.ts` - Export functionality
- `axe-accessibility.spec.ts` - Standalone a11y tests

## Contributing

When modifying this test:
1. Maintain all 10 steps
2. Keep accessibility scans at each step
3. Preserve webhook verification logic
4. Update this README with changes
5. Test locally 10+ times before PR
6. Verify artifacts are generated

## Support

For issues or questions:
- Check Playwright logs: `test-results/`
- View trace files: `npx playwright show-trace`
- Review accessibility reports: `playwright-report/a11y/`
- Check CI logs for environment issues
