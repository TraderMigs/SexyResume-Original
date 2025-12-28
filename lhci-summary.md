# Lighthouse CI - Quick Reference

**Status:** ✅ Configured and Ready
**Last Build:** 2025-10-03
**Build Time:** 7.25s

---

## Current Performance Budget Status

### Bundle Sizes (Gzipped)

| Resource | Current | Budget | Usage | Status |
|----------|---------|--------|-------|--------|
| **CSS** | 5.98 KB | 100 KB | 6.0% | ✅ Excellent |
| **JavaScript** | 192.52 KB | 300 KB | 64.2% | ✅ Good |

**Total JS Breakdown:**
- `index.js`: 111.09 KB (main app code)
- `vendor.js`: 45.61 KB (React, etc.)
- `supabase.js`: 35.73 KB (Supabase client)
- `sentry.js`: 0.09 KB (error tracking)

**Analysis:**
- ✅ Well under all budgets
- ✅ Room for growth (107 KB JS, 94 KB CSS available)
- ✅ Good code splitting achieved
- 🎯 Main bundle could be further split with lazy loading

---

## Score Thresholds

Configured to FAIL CI if scores drop below:

| Category | Threshold | Pages Tested |
|----------|-----------|--------------|
| Performance | ≥90 | Landing, Pricing |
| Accessibility | ≥95 | Landing, Pricing |
| Best Practices | ≥85 | Landing, Pricing |
| SEO | ≥90 | Landing, Pricing |

---

## Quick Commands

```bash
# Run Lighthouse CI locally
npm run lhci:local

# Just run against built dist
npm run lhci

# Generate summary report
npm run lhci:report

# View results
cat lhci-summary.md
ls -la .lighthouseci/
```

---

## CI Behavior

### When It Runs
- ✅ Every push to main/develop
- ✅ Every pull request
- ✅ Automatically on PR updates

### What It Does
1. Builds production bundle
2. Starts preview server
3. Runs Lighthouse (3 runs per URL)
4. Checks against thresholds
5. Generates reports
6. Comments on PR
7. **FAILS if budgets exceeded**

### PR Comment Example

```markdown
## 🔍 Lighthouse CI Results

### Landing Page
✅ Performance: 92/100 (≥90)
✅ Accessibility: 98/100 (≥95)
✅ Best Practices: 87/100 (≥85)
✅ SEO: 95/100 (≥90)

### Performance Budgets
✅ JavaScript: 192 KB / 300 KB
✅ CSS: 6 KB / 100 KB

All checks passed! 🎉
```

---

## Common Optimizations

### If JS Budget Exceeded (>300KB)

1. **Code Splitting**
   ```tsx
   // Lazy load heavy components
   const AdminDashboard = lazy(() => import('./AdminDashboard'));
   ```

2. **Tree Shaking**
   ```tsx
   // Use named imports
   import { Button } from 'components'; // ❌
   import Button from 'components/Button'; // ✅
   ```

3. **Bundle Analysis**
   ```bash
   npm install --save-dev vite-bundle-visualizer
   npm run build
   # Review the generated report
   ```

### If CSS Budget Exceeded (>100KB)

1. **Purge Unused Tailwind**
   ```js
   // tailwind.config.js
   module.exports = {
     content: ['./src/**/*.{js,jsx,ts,tsx}'],
     // Automatically removes unused classes
   }
   ```

2. **Critical CSS**
   ```tsx
   // Inline critical CSS in index.html
   <style>{criticalCSS}</style>
   ```

### If Performance Score < 90

**Check these metrics:**
- First Contentful Paint (FCP): < 2s
- Largest Contentful Paint (LCP): < 2.5s
- Total Blocking Time (TBT): < 300ms
- Cumulative Layout Shift (CLS): < 0.1

**Quick fixes:**
- Optimize images (WebP, lazy loading)
- Defer non-critical JS
- Preload critical resources
- Minimize main thread work

---

## Configuration Files

### lighthouserc.json
Main configuration file with:
- URLs to test
- Score thresholds
- Performance budgets
- Assertion rules

### .github/workflows/lighthouse-ci.yml
GitHub Actions workflow that:
- Triggers on push/PR
- Runs audits
- Posts results
- Fails on violations

### scripts/generate-lhci-summary.js
Report generator that:
- Parses LHCI results
- Formats markdown report
- Extracts actionable recommendations
- Highlights failing audits

---

## Troubleshooting

### "Categories:performance": expected >=0.90, got 0.85

**Cause:** Performance score below threshold

**Fix:**
1. Run locally: `npm run lhci:local`
2. Review failing audits in `.lighthouseci/`
3. Apply recommended optimizations
4. Re-test until score ≥90

### "Resource-summary:script:size": expected <=307200, got 350000

**Cause:** JavaScript bundle too large

**Fix:**
1. Analyze bundle: `npx vite-bundle-visualizer`
2. Identify large dependencies
3. Replace or remove heavy packages
4. Use code splitting
5. Verify: `npm run build` (check gzip sizes)

### Preview server won't start

**Cause:** Port 4173 already in use

**Fix:**
```bash
# Kill existing process
lsof -ti:4173 | xargs kill -9

# Or use different port in lighthouserc.json
```

---

## Baseline Performance

**Current Status (2025-10-03):**

| Metric | Value |
|--------|-------|
| CSS Size | 5.98 KB ✅ |
| JS Size | 192.52 KB ✅ |
| Budget Usage | 64.2% of JS budget |
| Build Time | 7.25s |
| Files Generated | 6 (3 JS, 1 CSS, 2 maps) |

**Trends to Monitor:**
- ⬆️ Bundle growth over time
- ⬆️ Build time increases
- ⬇️ Performance scores
- 🎯 Core Web Vitals

---

## Resources

- [Lighthouse Docs](https://developer.chrome.com/docs/lighthouse/)
- [LHCI GitHub](https://github.com/GoogleChrome/lighthouse-ci)
- [Web Vitals](https://web.dev/vitals/)
- [Performance Budgets](https://web.dev/performance-budgets-101/)

---

**🚀 Lighthouse CI is now protecting your performance budgets on every PR!**
