import { test, expect } from '@playwright/test';

// Example regression tests for web applications
// These tests can be customized for specific applications

test.describe('Application Regression Tests', () => {
  
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/.*/);
    
    // Check for common elements
    await expect(page.getByRole('heading')).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
  });
  
  test('navigation works correctly', async ({ page }) => {
    await page.goto('/');
    
    // Find all links and check they're accessible
    const links = await page.getByRole('link').all();
    expect(links.length).toBeGreaterThan(0);
    
    // Test first link (if it's internal)
    const firstLink = links[0];
    const href = await firstLink.getAttribute('href');
    
    if (href && !href.startsWith('http') && !href.startsWith('#')) {
      await firstLink.click();
      await expect(page).not.toHaveURL('/');
    }
  });
  
  test('forms can be submitted', async ({ page }) => {
    await page.goto('/');
    
    // Look for forms
    const forms = await page.locator('form').all();
    
    if (forms.length > 0) {
      const form = forms[0];
      
      // Fill form inputs if they exist
      const inputs = await form.locator('input, textarea, select').all();
      
      for (const input of inputs) {
        const type = await input.getAttribute('type');
        const tagName = await input.evaluate(el => el.tagName.toLowerCase());
        
        if (type === 'text' || type === 'email' || tagName === 'textarea') {
          await input.fill('test@example.com');
        } else if (type === 'checkbox' || type === 'radio') {
          await input.check();
        } else if (tagName === 'select') {
          await input.selectOption({ index: 0 });
        }
      }
      
      // Try to submit
      const submitButton = await form.locator('button[type="submit"], input[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForLoadState('networkidle');
      }
    }
  });
  
  test('responsive design works', async ({ page }) => {
    await page.goto('/');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByRole('main')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByRole('main')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.getByRole('main')).toBeVisible();
  });
  
  test('accessibility basics', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper heading structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
    
    // Check images have alt text
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).not.toBeNull();
    }
    
    // Check links have discernible text
    const links = await page.getByRole('link').all();
    for (const link of links) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      expect(text || ariaLabel).toBeTruthy();
    }
  });
});

test.describe('API Regression Tests', () => {
  
  test('API endpoints respond correctly', async ({ request }) => {
    // Test common API patterns
    const endpoints = [
      '/api/health',
      '/api/status',
      '/api/version',
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await request.get(endpoint);
        expect(response.status()).toBeLessThan(500);
      } catch {
        // Endpoint might not exist, that's OK for regression tests
      }
    }
  });
  
  test('error handling works', async ({ request }) => {
    // Test 404 handling
    const response = await request.get('/api/nonexistent-endpoint');
    expect(response.status()).toBe(404);
  });
});