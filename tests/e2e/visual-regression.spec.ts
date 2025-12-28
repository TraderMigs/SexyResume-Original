import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('resume preview renders consistently', async ({ page }) => {
    await page.goto('/');
    
    // Fill sample data
    await page.fill('[placeholder="John Doe"]', 'John Smith');
    await page.fill('[placeholder="john@example.com"]', 'john.smith@example.com');
    await page.fill('[placeholder="+1 (555) 123-4567"]', '+1 (555) 123-4567');
    await page.fill('[placeholder="New York, NY"]', 'San Francisco, CA');
    await page.fill('textarea[placeholder*="professional background"]', 
      'Experienced software engineer with 5+ years in full-stack development');

    // Add experience
    await page.click('button:has-text("Add Experience")');
    await page.fill('[placeholder="Company Name"]', 'Tech Innovations Inc');
    await page.fill('[placeholder="Job Title"]', 'Senior Software Engineer');
    await page.fill('input[type="month"]', '2020-01');
    await page.check('input[type="checkbox"]:near(:text("Current position"))');
    await page.fill('input[placeholder*="Increased sales"]', 'Led development of microservices architecture');

    // Navigate to preview
    await page.click('button:has-text("Preview")');
    
    // Wait for preview to load
    await page.waitForSelector('.resume-preview', { timeout: 5000 });
    
    // Take screenshot for visual regression
    await expect(page.locator('.resume-preview')).toHaveScreenshot('resume-preview-modern.png');
  });

  test('template variations render correctly', async ({ page }) => {
    await page.goto('/');
    
    // Fill minimal data
    await page.fill('[placeholder="John Doe"]', 'Template Test');
    await page.fill('[placeholder="john@example.com"]', 'template@test.com');
    
    // Navigate to template selection
    await page.click('button:has-text("Template")');
    
    // Test each template
    const templates = ['Modern Professional', 'Classic Professional', 'Creative Portfolio', 'Minimal Clean', 'Executive Leadership'];
    
    for (const template of templates) {
      await page.click(`text=${template}`);
      await page.click('button:has-text("Preview")');
      
      // Wait for template to render
      await page.waitForTimeout(1000);
      
      // Take screenshot
      const templateId = template.toLowerCase().replace(/\s+/g, '-');
      await expect(page.locator('.resume-preview')).toHaveScreenshot(`template-${templateId}.png`);
      
      // Go back to template selection
      await page.click('button:has-text("Template")');
    }
  });

  test('mobile responsive design', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Should show mobile-optimized layout
    await expect(page.locator('.grid-cols-1')).toBeVisible();
    
    // Take mobile screenshot
    await expect(page).toHaveScreenshot('mobile-layout.png');
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page).toHaveScreenshot('tablet-layout.png');
  });

  test('dark mode compatibility', async ({ page }) => {
    // Enable dark mode preference
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    
    // Fill some data
    await page.fill('[placeholder="John Doe"]', 'Dark Mode Test');
    
    // Take screenshot to verify dark mode styling
    await expect(page).toHaveScreenshot('dark-mode.png');
  });
});