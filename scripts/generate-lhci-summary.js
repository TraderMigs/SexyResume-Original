#!/usr/bin/env node

/**
 * Generate Lighthouse CI Summary Report
 *
 * Parses Lighthouse CI results and creates a markdown summary with:
 * - Score summaries for all pages
 * - Performance budget status
 * - Failing audits with actionable fixes
 * - Resource size breakdown
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const LHCI_DIR = '.lighthouseci';
const OUTPUT_FILE = 'lhci-summary.md';

// Score thresholds
const THRESHOLDS = {
  performance: { min: 90, label: 'Performance' },
  accessibility: { min: 95, label: 'Accessibility' },
  'best-practices': { min: 85, label: 'Best Practices' },
  seo: { min: 90, label: 'SEO' }
};

// Budget limits (in bytes)
const BUDGETS = {
  script: { max: 307200, label: 'JavaScript (gzipped)' }, // 300KB
  stylesheet: { max: 102400, label: 'CSS (gzipped)' }, // 100KB
  document: { max: 51200, label: 'HTML' }, // 50KB
  font: { max: 204800, label: 'Fonts' }, // 200KB
  image: { max: 512000, label: 'Images' }, // 500KB
  total: { max: 512000, label: 'Total Page Weight' } // 500KB
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function getScoreEmoji(score) {
  if (score >= 0.9) return '🟢';
  if (score >= 0.5) return '🟠';
  return '🔴';
}

function getStatusEmoji(passed) {
  return passed ? '✅' : '❌';
}

function findLatestManifest() {
  if (!existsSync(LHCI_DIR)) {
    console.error(`Directory ${LHCI_DIR} does not exist`);
    return null;
  }

  const files = readdirSync(LHCI_DIR);
  const manifestFiles = files.filter(f => f.startsWith('manifest') && f.endsWith('.json'));

  if (manifestFiles.length === 0) {
    console.error('No manifest files found');
    return null;
  }

  // Get the most recent manifest
  const latestManifest = manifestFiles.sort().reverse()[0];
  return join(LHCI_DIR, latestManifest);
}

function parseManifest() {
  const manifestPath = findLatestManifest();
  if (!manifestPath) return null;

  try {
    const content = readFileSync(manifestPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error parsing manifest:', error);
    return null;
  }
}

function loadLighthouseReport(path) {
  try {
    const content = readFileSync(path, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error loading report:', error);
    return null;
  }
}

function analyzeBudgets(report) {
  const budgetStatus = {};
  const audits = report.audits;

  // Check resource summary
  if (audits['resource-summary']) {
    const summary = audits['resource-summary'].details;
    if (summary && summary.items) {
      summary.items.forEach(item => {
        const type = item.resourceType;
        const size = item.transferSize || 0;

        if (BUDGETS[type]) {
          const budget = BUDGETS[type];
          budgetStatus[type] = {
            size,
            budget: budget.max,
            passed: size <= budget.max,
            label: budget.label
          };
        }
      });
    }
  }

  // Check total byte weight
  if (audits['total-byte-weight']) {
    const totalSize = audits['total-byte-weight'].numericValue || 0;
    budgetStatus.total = {
      size: totalSize,
      budget: BUDGETS.total.max,
      passed: totalSize <= BUDGETS.total.max,
      label: BUDGETS.total.label
    };
  }

  return budgetStatus;
}

function getFailingAudits(report) {
  const failing = [];
  const audits = report.audits;

  for (const [id, audit] of Object.entries(audits)) {
    if (audit.score !== null && audit.score < 1 && audit.score < 0.9) {
      failing.push({
        id,
        title: audit.title,
        description: audit.description,
        score: audit.score,
        numericValue: audit.numericValue,
        displayValue: audit.displayValue
      });
    }
  }

  return failing.sort((a, b) => a.score - b.score);
}

function getActionableRecommendations(audit) {
  const recommendations = {
    'unused-javascript': 'Remove unused JavaScript code. Use code splitting and lazy loading to reduce initial bundle size.',
    'unused-css-rules': 'Remove unused CSS rules. Use tools like PurgeCSS or built-in Vite CSS tree-shaking.',
    'render-blocking-resources': 'Eliminate render-blocking resources. Inline critical CSS and defer non-critical resources.',
    'unminified-css': 'Minify CSS files. This is typically done automatically in production builds.',
    'unminified-javascript': 'Minify JavaScript files. Ensure production build is being used.',
    'uses-long-cache-ttl': 'Set long cache lifetimes on static assets. Configure cache-control headers.',
    'modern-image-formats': 'Use modern image formats like WebP or AVIF for better compression.',
    'offscreen-images': 'Defer offscreen images. Use lazy loading with loading="lazy" attribute.',
    'uses-responsive-images': 'Serve appropriately-sized images. Use srcset and sizes attributes.',
    'efficient-animated-content': 'Use video formats for animated content instead of GIF.',
    'total-byte-weight': 'Reduce overall page weight. Optimize images, remove unused code, enable compression.',
    'dom-size': 'Avoid an excessive DOM size. Simplify component structure and use virtualization for long lists.',
    'bootup-time': 'Reduce JavaScript execution time. Split code, defer non-critical scripts.',
    'mainthread-work-breakdown': 'Minimize main-thread work. Optimize expensive operations and use web workers.',
    'largest-contentful-paint': 'Optimize LCP by improving server response times and resource loading.',
    'cumulative-layout-shift': 'Reduce CLS by setting explicit dimensions on images and avoiding dynamic content insertion.',
    'total-blocking-time': 'Reduce TBT by breaking up long tasks and deferring non-critical JavaScript.'
  };

  return recommendations[audit.id] || 'Review the Lighthouse documentation for specific recommendations.';
}

function generateSummary() {
  const manifest = parseManifest();
  if (!manifest) {
    console.error('Could not parse manifest');
    return;
  }

  let markdown = '# Lighthouse CI Report\n\n';
  markdown += `**Generated:** ${new Date().toISOString()}\n`;
  markdown += `**Number of Runs:** ${manifest.length}\n\n`;
  markdown += '---\n\n';

  // Process each URL
  for (const run of manifest) {
    const url = new URL(run.url).pathname;
    const pageName = url === '/' ? 'Landing Page' : url.substring(1).charAt(0).toUpperCase() + url.substring(2);

    markdown += `## ${pageName}\n\n`;
    markdown += `**URL:** ${run.url}\n`;
    markdown += `**Timestamp:** ${new Date(run.fetchTime).toLocaleString()}\n\n`;

    // Load the report
    const reportPath = join(LHCI_DIR, run.jsonPath);
    const report = loadLighthouseReport(reportPath);

    if (!report) {
      markdown += '⚠️ Could not load report\n\n';
      continue;
    }

    // Score summary
    markdown += '### 📊 Scores\n\n';
    markdown += '| Category | Score | Status | Threshold |\n';
    markdown += '|----------|-------|--------|----------|\n';

    const categories = report.categories;
    let allPassed = true;

    for (const [key, threshold] of Object.entries(THRESHOLDS)) {
      if (categories[key]) {
        const score = categories[key].score;
        const passed = score >= threshold.min / 100;
        const emoji = getScoreEmoji(score);
        const status = getStatusEmoji(passed);

        if (!passed) allPassed = false;

        markdown += `| ${emoji} ${threshold.label} | ${Math.round(score * 100)} | ${status} | ${threshold.min} |\n`;
      }
    }

    markdown += '\n';

    if (!allPassed) {
      markdown += '⚠️ **Some thresholds not met**\n\n';
    }

    // Performance budgets
    markdown += '### 💰 Performance Budgets\n\n';
    const budgets = analyzeBudgets(report);

    markdown += '| Resource | Size | Budget | Status |\n';
    markdown += '|----------|------|--------|--------|\n';

    for (const [type, status] of Object.entries(budgets)) {
      const emoji = getStatusEmoji(status.passed);
      markdown += `| ${status.label} | ${formatBytes(status.size)} | ${formatBytes(status.budget)} | ${emoji} |\n`;
    }

    markdown += '\n';

    // Failing audits
    const failingAudits = getFailingAudits(report);

    if (failingAudits.length > 0) {
      markdown += '### ❌ Failing Audits\n\n';

      failingAudits.slice(0, 10).forEach((audit, index) => {
        markdown += `#### ${index + 1}. ${audit.title}\n\n`;
        markdown += `**Score:** ${Math.round(audit.score * 100)}/100\n\n`;

        if (audit.displayValue) {
          markdown += `**Value:** ${audit.displayValue}\n\n`;
        }

        markdown += `**Description:** ${audit.description}\n\n`;
        markdown += `**💡 Fix:** ${getActionableRecommendations(audit)}\n\n`;
      });

      if (failingAudits.length > 10) {
        markdown += `*... and ${failingAudits.length - 10} more failing audits*\n\n`;
      }
    } else {
      markdown += '### ✅ All Audits Passing\n\n';
    }

    markdown += '---\n\n';
  }

  // Summary section
  markdown += '## Summary\n\n';
  markdown += 'Review the failing audits above and apply the recommended fixes.\n\n';
  markdown += '### Next Steps\n\n';
  markdown += '1. Address critical performance issues first\n';
  markdown += '2. Optimize resource sizes to meet budgets\n';
  markdown += '3. Run Lighthouse CI locally to verify fixes: `npx lhci autorun`\n';
  markdown += '4. Re-test after making changes\n\n';
  markdown += '### Resources\n\n';
  markdown += '- [Lighthouse Performance Scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/)\n';
  markdown += '- [Web Vitals](https://web.dev/vitals/)\n';
  markdown += '- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)\n\n';

  // Write summary
  writeFileSync(OUTPUT_FILE, markdown);
  console.log(`✅ Generated ${OUTPUT_FILE}`);
}

// Run
generateSummary();
