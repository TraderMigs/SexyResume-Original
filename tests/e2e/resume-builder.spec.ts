import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Resume Builder E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('complete resume building flow', async ({ page }) => {
    // Fill personal information
    await page.fill('[placeholder="John Doe"]', 'Jane Smith');
    await page.fill('[placeholder="john@example.com"]', 'jane@example.com');
    await page.fill('[placeholder="+1 (555) 123-4567"]', '+1 (555) 987-6543');
    await page.fill('[placeholder="New York, NY"]', 'San Francisco, CA');
    
    // Add professional summary
    await page.fill('textarea[placeholder*="professional background"]', 
      'Experienced software engineer with expertise in React and Node.js');

    // Navigate to experience tab
    await page.click('button:has-text("Work Experience")');
    
    // Add work experience
    await page.click('button:has-text("Add Experience")');
    await page.fill('[placeholder="Company Name"]', 'Tech Corp');
    await page.fill('[placeholder="Job Title"]', 'Senior Developer');
    await page.fill('input[type="month"]', '2020-01');
    await page.check('input[type="checkbox"]:near(:text("Current position"))');
    
    // Add achievement
    await page.fill('input[placeholder*="Increased sales"]', 'Led team of 5 developers');

    // Navigate to template selection
    await page.click('button:has-text("Template")');
    
    // Select a template
    await page.click('.template-card:has-text("Modern Professional")');
    
    // Navigate to preview
    await page.click('button:has-text("Preview")');
    
    // Verify preview shows content
    await expect(page.locator('.resume-preview')).toContainText('Jane Smith');
    await expect(page.locator('.resume-preview')).toContainText('Tech Corp');
    
    // Navigate to export
    await page.click('button:has-text("Export")');
    
    // Should show payment gate for non-authenticated user
    await expect(page.locator('text=Sign In Required')).toBeVisible();
  });

  test('template recommendation system', async ({ page }) => {
    // Fill in tech-focused resume data
    await page.fill('[placeholder="John Doe"]', 'Alex Developer');
    await page.fill('textarea[placeholder*="professional background"]', 
      'Full-stack software engineer with React, Node.js, and AWS experience');

    // Add technical skills
    await page.click('button:has-text("Skills")');
    await page.click('button:has-text("Add Skill")');
    await page.fill('[placeholder="JavaScript, Leadership, etc."]', 'JavaScript');
    await page.selectOption('select', 'Technical');
    await page.selectOption('select', 'Advanced');

    // Navigate to template selection
    await page.click('button:has-text("Template")');
    
    // Should show AI recommendations
    await expect(page.locator('text=AI Recommendations')).toBeVisible();
    await expect(page.locator('.recommendation-card')).toBeVisible();
    
    // Should recommend Modern template for tech role
    await expect(page.locator('text=Modern design appeals to tech companies')).toBeVisible();
  });

  test('export preview functionality', async ({ page }) => {
    // Fill minimal data
    await page.fill('[placeholder="John Doe"]', 'Test User');
    await page.fill('[placeholder="john@example.com"]', 'test@example.com');
    
    // Navigate to export
    await page.click('button:has-text("Export")');
    
    // For authenticated users, should show export options
    // For non-authenticated, should show sign-in prompt
    const hasSignInPrompt = await page.locator('text=Sign In Required').isVisible();
    
    if (!hasSignInPrompt) {
      // Test export format selection
      await page.click('.format-option:has-text("PDF")');
      await expect(page.locator('.format-option:has-text("PDF")')).toHaveClass(/border-sexy-pink-500/);
      
      // Test preview mode
      await page.check('input[id="preview"]');
      await expect(page.locator('text=Preview Mode (Free)')).toBeVisible();
    }
  });

  test('accessibility compliance', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('keyboard navigation', async ({ page }) => {
    // Test tab navigation through form
    await page.keyboard.press('Tab');
    await expect(page.locator('[placeholder="John Doe"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[placeholder="john@example.com"]')).toBeFocused();
    
    // Test tab navigation in template selector
    await page.click('button:has-text("Template")');
    await page.keyboard.press('Tab');
    
    // Should be able to navigate templates with keyboard
    const firstTemplate = page.locator('.template-card').first();
    await expect(firstTemplate).toBeFocused();
  });

  test('responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Should show mobile-friendly layout
    await expect(page.locator('.grid-cols-1')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Should show tablet layout
    await expect(page.locator('.md\\:grid-cols-2')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Should show full desktop layout
    await expect(page.locator('.lg\\:grid-cols-3')).toBeVisible();
  });
});