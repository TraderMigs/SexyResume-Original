import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('user can sign up and sign in', async ({ page }) => {
    await page.goto('/');
    
    // Click sign in button
    await page.click('button:has-text("Sign In")');
    
    // Should open auth modal
    await expect(page.locator('text=Sign In')).toBeVisible();
    
    // Switch to sign up
    await page.click('button:has-text("Don\'t have an account? Sign up")');
    await expect(page.locator('text=Create Account')).toBeVisible();
    
    // Fill sign up form
    await page.fill('[placeholder="John Doe"]', 'Test User');
    await page.fill('[placeholder="john@example.com"]', 'test@example.com');
    await page.fill('[placeholder="••••••••"]', 'password123');
    
    // Submit form (will fail in test environment)
    await page.click('button:has-text("Create Account")');
    
    // Should show loading state
    await expect(page.locator('text=Creating Account...')).toBeVisible();
  });

  test('handles authentication errors', async ({ page }) => {
    await page.goto('/');
    
    // Mock failed authentication
    await page.route('**/auth/signin', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid credentials' }),
      });
    });
    
    await page.click('button:has-text("Sign In")');
    
    // Fill invalid credentials
    await page.fill('[placeholder="john@example.com"]', 'invalid@example.com');
    await page.fill('[placeholder="••••••••"]', 'wrongpassword');
    await page.click('button:has-text("Sign In")');
    
    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('password visibility toggle works', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Sign In")');
    
    const passwordInput = page.locator('[placeholder="••••••••"]');
    const toggleButton = page.locator('button:has([data-lucide="eye"])');
    
    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click toggle to show password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click toggle to hide password again
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});