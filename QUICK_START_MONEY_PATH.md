# Quick Start: Money Path E2E Test

## 🚀 Run the Test (5 minutes)

### Prerequisites
```bash
# 1. Install dependencies (if not already done)
npm install

# 2. Install Playwright browsers
npx playwright install chromium

# 3. Ensure .env file exists with:
# VITE_SUPABASE_URL=your-supabase-url
# VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Run Commands

```bash
# Run money path test (headless, fastest)
npm run test:e2e:money

# Run with visible browser (see what's happening)
npm run test:e2e:money:headed

# Run with debug mode (slow motion + inspector)
npm run test:e2e:money:debug

# Run with Playwright UI (best for development)
npm run test:e2e:ui
```

## 📊 What the Test Does

### Complete Flow (10 Steps)
1. **Signup**: Creates test user and opens auth modal
2. **Upload**: Uploads sample PDF resume
3. **Parse Review**: Edits one field (email)
4. **Template**: Selects resume template
5. **Pre-Payment Check**: Verifies `has_paid = false`
6. **Payment Gate**: Shows $7.00 paywall
7. **Webhook**: Simulates Stripe payment webhook
8. **Post-Payment Check**: Verifies `has_paid = true` ✨
9. **Export**: Downloads PDF + DOCX
10. **Verify**: Checks signed download URLs

### Accessibility Scans (7 Pages)
✅ Landing Page
✅ Auth Modal
✅ Upload Modal
✅ Parse Review Workspace
✅ Template Selector
✅ Payment Gate
✅ Export Options

**Any violations = Test FAILS** ❌

## 📁 Artifacts Generated

After running, check:
```bash
playwright-report/          # HTML report with full details
├── a11y/                   # Accessibility scan results
├── traces/                 # Playwright traces (on retry)
└── index.html              # Open this in browser

test-results/
├── junit.xml               # For CI integration
├── results.json            # JSON report
└── videos/                 # Videos (on failure)
```

### View Results
```bash
# Open HTML report
npx playwright show-report

# View trace file (if available)
npx playwright show-trace playwright-report/traces/money-path-complete.zip
```

## ✅ Success Indicators

### Test Passes When:
- ✅ All 10 steps complete without errors
- ✅ Zero accessibility violations across all 7 pages
- ✅ Entitlement is `false` before webhook
- ✅ Entitlement is `true` after webhook
- ✅ PDF and DOCX download successfully
- ✅ Download URLs are signed

### Test Fails When:
- ❌ Any step times out or errors
- ❌ ANY accessibility violation found
- ❌ Entitlement doesn't flip after webhook
- ❌ Downloads fail or files are empty
- ❌ URLs are not signed

## 🐛 Troubleshooting

### Test hangs or fails?

1. **Check Supabase connection**:
   ```bash
   cat .env | grep SUPABASE
   ```

2. **Run with visible browser**:
   ```bash
   npm run test:e2e:money:headed
   ```

3. **Check console output** for error messages

4. **View accessibility violations**:
   ```bash
   cat playwright-report/a11y/landing-page.json | grep -A5 violations
   ```

### Common Issues

**"Cannot find module '@playwright/test'"**
```bash
npm install @playwright/test @axe-core/playwright --save-dev
```

**"Browser not found"**
```bash
npx playwright install chromium
```

**"Timeout waiting for element"**
- Check if dev server is running
- Increase timeouts in test file
- Check network connection

**"Accessibility violations found"**
- Review `playwright-report/a11y/*.json` files
- Fix violations in source code
- Re-run test

## 📈 Measuring Flake Rate

Run multiple times to verify reliability:
```bash
# Run 10 times
for i in {1..10}; do
  echo "Run $i:"
  npm run test:e2e:money
done
```

**Target**: 9+ passes out of 10 runs (<10% flake rate)
**Goal**: 99+ passes out of 100 runs (<1% flake rate)

## 🔧 Advanced Usage

### Run specific browser
```bash
npx playwright test money-path-complete --project=chromium
npx playwright test money-path-complete --project=firefox
npx playwright test money-path-complete --project=webkit
```

### Enable slow motion
```bash
SLOW_MO=1 npm run test:e2e:money:headed
```

### Keep artifacts on success
```bash
npx playwright test money-path-complete --trace on
```

### Run in CI mode
```bash
CI=true npm run test:e2e:money
```

## 📚 Full Documentation

For complete details, see:
- `tests/e2e/README.md` - Comprehensive test documentation
- `MONEY_PATH_TEST_COMPLETE.md` - Implementation details
- `tests/fixtures/` - Test data fixtures

## 🎯 Quick Checklist

Before running the test:
- [ ] Dependencies installed (`npm install`)
- [ ] Playwright browsers installed (`npx playwright install`)
- [ ] `.env` file configured with Supabase credentials
- [ ] Dev server can start (`npm run dev`)
- [ ] Database is accessible

After running the test:
- [ ] Check `playwright-report/index.html` for results
- [ ] Review accessibility reports in `playwright-report/a11y/`
- [ ] Verify JUnit XML generated at `test-results/junit.xml`
- [ ] Check for video/screenshots if test failed

## 💡 Tips

1. **First time?** Use `npm run test:e2e:money:headed` to see what's happening
2. **Debugging?** Use `npm run test:e2e:ui` for interactive mode
3. **CI setup?** Use the GitHub Actions workflow in `.github/workflows/money-path-e2e.yml`
4. **Slow test?** Normal runtime is 60-90 seconds for complete flow
5. **Flaky?** Check anti-flake patterns in test implementation

## 🆘 Need Help?

1. Check console output for specific error messages
2. View `playwright-report/index.html` for detailed timeline
3. Open trace file if available: `npx playwright show-trace`
4. Review accessibility violations in `playwright-report/a11y/`
5. Increase test timeout if needed (currently 180s)

---

**Status**: Ready to run! 🚀

Run `npm run test:e2e:money` to start the test.
