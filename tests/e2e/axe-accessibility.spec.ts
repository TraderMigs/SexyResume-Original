import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Ensure axe-report directory exists
test.beforeAll(async () => {
  try {
    mkdirSync('axe-report', { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
});

test.describe('Axe Accessibility Testing', () => {
  test('landing page accessibility', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();

    // Save detailed report
    writeFileSync(
      join('axe-report', 'landing.json'),
      JSON.stringify(accessibilityScanResults, null, 2)
    );

    // Log summary
    console.log(`Landing page: ${accessibilityScanResults.violations.length} violations, ${accessibilityScanResults.passes.length} passes`);

    // FAIL on any violations to block CI
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('upload modal accessibility', async ({ page }) => {
    await page.goto('/');
    
    // Open upload modal
    await page.click('button:has-text("Upload Resume")');
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();

    writeFileSync(
      join('axe-report', 'upload.json'),
      JSON.stringify(accessibilityScanResults, null, 2)
    );

    console.log(`Upload modal: ${accessibilityScanResults.violations.length} violations, ${accessibilityScanResults.passes.length} passes`);

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('parse review workspace accessibility', async ({ page }) => {
    await page.goto('/');
    
    // Fill some basic data to enable parse review simulation
    await page.fill('[placeholder="John Doe"]', 'Test User');
    await page.fill('[placeholder="john@example.com"]', 'test@example.com');
    
    // Navigate to personal info tab (simulates parse review state)
    await page.click('button:has-text("Personal Info")');
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();

    writeFileSync(
      join('axe-report', 'parse-review.json'),
      JSON.stringify(accessibilityScanResults, null, 2)
    );

    console.log(`Parse review: ${accessibilityScanResults.violations.length} violations, ${accessibilityScanResults.passes.length} passes`);

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('template selector accessibility', async ({ page }) => {
    await page.goto('/');
    
    // Fill minimal data to enable template selection
    await page.fill('[placeholder="John Doe"]', 'Test User');
    
    // Navigate to template tab
    await page.click('button:has-text("Template")');
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();

    writeFileSync(
      join('axe-report', 'template-selector.json'),
      JSON.stringify(accessibilityScanResults, null, 2)
    );

    console.log(`Template selector: ${accessibilityScanResults.violations.length} violations, ${accessibilityScanResults.passes.length} passes`);

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('export page accessibility', async ({ page }) => {
    await page.goto('/');
    
    // Fill minimal data to enable export
    await page.fill('[placeholder="John Doe"]', 'Test User');
    await page.fill('[placeholder="john@example.com"]', 'test@example.com');
    
    // Navigate to export tab
    await page.click('button:has-text("Export")');
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();

    writeFileSync(
      join('axe-report', 'export.json'),
      JSON.stringify(accessibilityScanResults, null, 2)
    );

    console.log(`Export page: ${accessibilityScanResults.violations.length} violations, ${accessibilityScanResults.passes.length} passes`);

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.afterAll(async () => {
  // Generate summary report
  const { generateAxeSummary } = await import('../../scripts/generate-axe-summary.js');
  await generateAxeSummary();
});