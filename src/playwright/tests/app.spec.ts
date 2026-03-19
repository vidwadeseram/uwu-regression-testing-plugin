import { test, expect } from '@playwright/test';

// Example test suite for uwu-regression-testing-plugin
// These tests demonstrate common patterns for workspace testing

test.describe('Basic Application Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/.*/);
    
    // Check for common elements
    await expect(page.getByRole('heading')).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('navigation works correctly', async ({ page }) => {
    await page.goto('/');
    
    // Find and click a navigation link
    const navLinks = page.getByRole('navigation').getByRole('link');
    const firstLink = navLinks.first();
    
    if (await firstLink.isVisible()) {
      await firstLink.click();
      await expect(page).not.toHaveURL('/');
    }
  });

  test('form submission works', async ({ page }) => {
    await page.goto('/contact');
    
    // Look for a form
    const form = page.locator('form');
    if (await form.isVisible()) {
      // Fill form fields if they exist
      const nameInput = form.locator('input[name="name"], input[type="text"]').first();
      const emailInput = form.locator('input[name="email"], input[type="email"]').first();
      const submitButton = form.locator('button[type="submit"], input[type="submit"]').first();
      
      if (await nameInput.isVisible()) {
        await nameInput.fill('Test User');
      }
      
      if (await emailInput.isVisible()) {
        await emailInput.fill('test@example.com');
      }
      
      if (await submitButton.isVisible()) {
        await submitButton.click();
        // Wait for some response or redirect
        await page.waitForTimeout(1000);
      }
    }
  });
});

test.describe('API Endpoint Tests', () => {
  test('health endpoint returns 200', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.status()).toBe(200);
  });

  test('API endpoints return JSON', async ({ request }) => {
    // Test common API endpoints
    const endpoints = ['/api/health', '/api/status', '/api/info'];
    
    for (const endpoint of endpoints) {
      try {
        const response = await request.get(endpoint);
        if (response.status() === 200) {
          const contentType = response.headers()['content-type'];
          expect(contentType).toContain('application/json');
        }
      } catch {
        // Endpoint may not exist, that's OK for example tests
      }
    }
  });
});

test.describe('Authentication Tests', () => {
  test('login page exists', async ({ page }) => {
    await page.goto('/login');
    
    // Check for login form elements
    const hasUsernameField = await page.locator('input[name="username"], input[type="text"]').isVisible();
    const hasPasswordField = await page.locator('input[name="password"], input[type="password"]').isVisible();
    const hasSubmitButton = await page.locator('button[type="submit"], input[type="submit"]').isVisible();
    
    // At least one login indicator should be present
    expect(hasUsernameField || hasPasswordField || hasSubmitButton).toBeTruthy();
  });

  test('protected routes redirect to login', async ({ page }) => {
    // Try accessing common protected routes
    const protectedRoutes = ['/admin', '/dashboard', '/profile', '/settings'];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      await page.waitForTimeout(500);
      
      // Check if we're still on the same page or redirected to login
      const currentUrl = page.url();
      if (!currentUrl.includes(route)) {
        // We were redirected - check if it's to a login page
        expect(currentUrl).toMatch(/login|auth|signin/i);
        break;
      }
    }
  });
});

test.describe('Responsive Design Tests', () => {
  test('mobile viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');
    
    // Check for mobile-friendly elements
    await expect(page.getByRole('main')).toBeVisible();
    
    // Hamburger menu might appear on mobile
    const hamburger = page.locator('button[aria-label*="menu"], .hamburger, .menu-toggle');
    if (await hamburger.isVisible()) {
      await hamburger.click();
      await expect(page.locator('nav[aria-expanded="true"]')).toBeVisible();
    }
  });

  test('tablet viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/');
    
    await expect(page.getByRole('main')).toBeVisible();
    // Tablet should show more content than mobile
    const mainContent = page.locator('main');
    const boundingBox = await mainContent.boundingBox();
    expect(boundingBox?.width).toBeGreaterThan(700);
  });
});

test.describe('Performance Tests', () => {
  test('page loads within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
    console.log(`Page loaded in ${loadTime}ms`);
  });

  test('LCP (Largest Contentful Paint) is reasonable', async ({ page }) => {
    // Navigate to page and wait for load
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Measure time to visible content
    await expect(page.getByRole('main')).toBeVisible({ timeout: 5000 });
  });
});

// Helper function for common assertions
export async function assertPageHasBasicStructure(page: any) {
  await expect(page).toHaveTitle(/.*/);
  await expect(page.getByRole('main')).toBeVisible();
  
  // Check for common landmarks
  const landmarks = ['header', 'main', 'footer', 'nav'];
  for (const landmark of landmarks) {
    const element = page.locator(landmark);
    if (await element.count() > 0) {
      await expect(element.first()).toBeVisible();
    }
  }
}

// Example of a data-driven test
const testPages = [
  { path: '/', title: 'Home' },
  { path: '/about', title: 'About' },
  { path: '/contact', title: 'Contact' },
];

for (const { path, title } of testPages) {
  test(`"${title}" page loads: ${path}`, async ({ page }) => {
    await page.goto(path);
    await assertPageHasBasicStructure(page);
    
    // Page-specific checks
    if (title === 'Home') {
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  });
}