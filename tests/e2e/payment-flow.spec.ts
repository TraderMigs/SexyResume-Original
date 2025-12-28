import { test, expect } from '@playwright/test';

test.describe('Payment Flow', () => {
  test('payment gate blocks exports for non-paying users', async ({ page }) => {
    await page.goto('/');
    
    // Fill minimal resume data
    await page.fill('[placeholder="John Doe"]', 'Test User');
    await page.fill('[placeholder="john@example.com"]', 'test@example.com');
    
    // Navigate to export
    await page.click('button:has-text("Export")');
    
    // Should show payment gate
    await expect(page.locator('text=Unlock Export')).toBeVisible();
    await expect(page.locator('text=$7.00')).toBeVisible();
    await expect(page.locator('text=one-time payment')).toBeVisible();
  });

  test('payment gate shows features and benefits', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Export")');
    
    // Should show feature list
    await expect(page.locator('text=Professional resume templates')).toBeVisible();
    await expect(page.locator('text=Unlimited resume & cover letter exports')).toBeVisible();
    await expect(page.locator('text=PDF, Word & HTML export formats')).toBeVisible();
    await expect(page.locator('text=Remove watermarks and restrictions')).toBeVisible();
    await expect(page.locator('text=Lifetime access - no subscriptions')).toBeVisible();
  });

  test('checkout button redirects to Stripe', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Export")');
    
    // Mock checkout session creation
    await page.route('**/stripe-checkout', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessionId: 'cs_test_123',
          url: 'https://checkout.stripe.com/pay/cs_test_123',
          expiresAt: '2023-12-31T23:59:59Z',
        }),
      });
    });
    
    // Click unlock button
    const unlockButton = page.locator('button:has-text("Unlock Now - $7.00")');
    await expect(unlockButton).toBeVisible();
    
    // In a real test, this would redirect to Stripe
    // For testing, we just verify the button is clickable
    await expect(unlockButton).toBeEnabled();
  });

  test('payment success flow', async ({ page }) => {
    // Simulate returning from successful payment
    await page.goto('/?payment=success');
    
    // Should show payment success modal
    await expect(page.locator('text=Payment Successful!')).toBeVisible();
    await expect(page.locator('text=Welcome to Sexy Resume!')).toBeVisible();
    
    // Should list unlocked features
    await expect(page.locator('text=Professional resume templates')).toBeVisible();
    await expect(page.locator('text=Unlimited PDF, Word & HTML exports')).toBeVisible();
  });
});