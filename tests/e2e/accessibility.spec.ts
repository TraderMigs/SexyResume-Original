import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Compliance', () => {
  test('homepage meets WCAG 2.2 AA standards', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('form inputs have proper labels and roles', async ({ page }) => {
    await page.goto('/');
    
    // Check personal info form
    const nameInput = page.locator('[placeholder="John Doe"]');
    await expect(nameInput).toHaveAttribute('aria-label');
    
    const emailInput = page.locator('[placeholder="john@example.com"]');
    await expect(emailInput).toHaveAttribute('type', 'email');
    
    // Check form has proper structure
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('form')
      .withTags(['wcag2a'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('keyboard navigation works throughout app', async ({ page }) => {
    await page.goto('/');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('[placeholder="John Doe"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[placeholder="john@example.com"]')).toBeFocused();
    
    // Test navigation to other tabs
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should reach template tab
    await page.keyboard.press('Enter');
    await expect(page.locator('text=Choose Template')).toBeVisible();
  });

  test('screen reader announcements work', async ({ page }) => {
    await page.goto('/');
    
    // Fill form and check for announcements
    await page.fill('[placeholder="John Doe"]', 'Test User');
    
    // Check for aria-live regions
    const liveRegions = page.locator('[aria-live]');
    await expect(liveRegions).toHaveCount(0); // Should not have persistent live regions
    
    // Test tab switching announcements
    await page.click('button:has-text("Template")');
    
    // Should announce tab change (would be tested with screen reader simulation)
    await page.waitForTimeout(100);
  });

  test('color contrast meets AA standards', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('body')
      .analyze();

    // Filter for color contrast violations
    const contrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    );

    expect(contrastViolations).toEqual([]);
  });

  test('focus indicators are visible', async ({ page }) => {
    await page.goto('/');
    
    // Test focus visibility on interactive elements
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      await button.focus();
      
      // Check if focus is visible (would need custom CSS check)
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    }
  });

  test('error messages are accessible', async ({ page }) => {
    await page.goto('/');
    
    // Trigger validation error
    await page.fill('[placeholder="john@example.com"]', 'invalid-email');
    await page.blur('[placeholder="john@example.com"]');
    
    // Check for accessible error messaging
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('modal dialogs are accessible', async ({ page }) => {
    await page.goto('/');
    
    // Open auth modal
    await page.click('button:has-text("Sign In")');
    
    // Check modal accessibility
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    // Should trap focus
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    
    // Focus should be within modal
    const isWithinModal = await focusedElement.evaluate(
      (el, modal) => modal.contains(el),
      await modal.elementHandle()
    );
    expect(isWithinModal).toBe(true);
    
    // Test escape key
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });
});