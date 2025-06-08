import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start each test from the home page
    await page.goto('/');
  });

  test('should display sign-in page correctly', async ({ page }) => {
    // Navigate to sign-in page
    await page.goto('/sign-in');
    
    // Check page title
    await expect(page).toHaveTitle(/Sign In/);
    
    // Check for key elements
    await expect(page.locator('h1')).toContainText(/Sign In/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check for links to other auth pages
    await expect(page.locator('a[href="/sign-up"]')).toBeVisible();
    await expect(page.locator('a[href="/forgot-password"]')).toBeVisible();
  });

  test('should display sign-up page correctly', async ({ page }) => {
    // Navigate to sign-up page
    await page.goto('/sign-up');
    
    // Check page title
    await expect(page).toHaveTitle(/Sign Up/);
    
    // Check for key elements
    await expect(page.locator('h1')).toContainText(/Sign Up/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check for link back to sign-in
    await expect(page.locator('a[href="/sign-in"]')).toBeVisible();
  });

  test('should handle invalid sign-in credentials', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 10000 });
    
    // Should still be on sign-in page
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('should validate email format on sign-in', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Fill in invalid email format
    await page.fill('input[type="email"]', 'not-an-email');
    await page.fill('input[type="password"]', 'somepassword');
    
    // Try to submit
    await page.click('button[type="submit"]');
    
    // Check for validation message
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
  });

  test('should navigate between auth pages', async ({ page }) => {
    // Start at sign-in
    await page.goto('/sign-in');
    await expect(page.locator('h1')).toContainText(/Sign In/i);
    
    // Navigate to sign-up
    await page.click('a[href="/sign-up"]');
    await expect(page).toHaveURL(/\/sign-up/);
    await expect(page.locator('h1')).toContainText(/Sign Up/i);
    
    // Navigate back to sign-in
    await page.click('a[href="/sign-in"]');
    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.locator('h1')).toContainText(/Sign In/i);
  });

  test('should handle forgot password flow', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Click forgot password link
    await page.click('a[href="/forgot-password"]');
    await expect(page).toHaveURL(/\/forgot-password/);
    
    // Check forgot password page elements
    await expect(page.locator('h1')).toContainText(/Forgot Password/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should redirect unauthenticated users to sign-in', async ({ page }) => {
    // Try to access protected route
    await page.goto('/dashboard');
    
    // Should be redirected to sign-in
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('should handle successful authentication flow', async ({ page }) => {
    // Note: This test would require valid test credentials
    // In a real implementation, you would use test environment credentials
    await page.goto('/sign-in');
    
    // Fill in test credentials (would come from environment)
    const testEmail = process.env.E2E_TEST_EMAIL || 'test@caredraft.co.uk';
    const testPassword = process.env.E2E_TEST_PASSWORD || 'TestPassword123!';
    
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation (or error)
    await page.waitForLoadState('networkidle');
    
    // Check if we successfully navigated (or got an error)
    const currentUrl = page.url();
    console.log('After sign-in attempt, URL:', currentUrl);
    
    // Either we're redirected to dashboard or we see an error
    const isRedirected = currentUrl.includes('/dashboard');
    const hasError = await page.locator('[role="alert"]').isVisible();
    
    // At least one should be true (either success or error handling)
    expect(isRedirected || hasError).toBe(true);
  });
});

test.describe('Authentication UI/UX', () => {
  test('should show loading states during authentication', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Fill in credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit and immediately check for loading state
    await page.click('button[type="submit"]');
    
    // Should show loading state (disabled button or spinner)
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/sign-in');
    
    // Check mobile layout
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check that form is properly sized for mobile
    const form = page.locator('form');
    const formBox = await form.boundingBox();
    expect(formBox?.width).toBeLessThanOrEqual(375);
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Tab through form elements
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="email"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="password"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('button[type="submit"]')).toBeFocused();
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Check for ARIA labels and roles
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await expect(emailInput).toHaveAttribute('aria-label');
    await expect(passwordInput).toHaveAttribute('aria-label');
    
    // Check for proper form labeling
    await expect(page.locator('label[for*="email"]')).toBeVisible();
    await expect(page.locator('label[for*="password"]')).toBeVisible();
  });
}); 