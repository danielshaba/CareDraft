import { test, expect } from '@playwright/test';

test.describe('CareDraft Basic Tests', () => {
  test('should be able to run Playwright tests', async ({ page }) => {
    // This is a basic test to verify Playwright is working
    // We'll start with a simple navigation test
    
    // For now, let's test that we can navigate to a basic page
    // We'll use a simple HTML page or external site for initial testing
    await page.goto('data:text/html,<html><head><title>CareDraft Test</title></head><body><h1>CareDraft Testing</h1><p>Playwright is working!</p></body></html>');
    
    // Check that the page loaded
    await expect(page).toHaveTitle('CareDraft Test');
    
    // Check that we can find elements
    const heading = page.locator('h1');
    await expect(heading).toHaveText('CareDraft Testing');
    
    const paragraph = page.locator('p');
    await expect(paragraph).toHaveText('Playwright is working!');
  });

  test('should handle basic browser interactions', async ({ page }) => {
    // Test basic browser functionality
    await page.goto('data:text/html,<html><body><button id="test-btn">Click me</button><div id="result"></div><script>document.getElementById("test-btn").onclick = () => document.getElementById("result").textContent = "Clicked!";</script></body></html>');
    
    // Click the button
    await page.click('#test-btn');
    
    // Check the result
    const result = page.locator('#result');
    await expect(result).toHaveText('Clicked!');
  });

  test('should work on different viewport sizes', async ({ page }) => {
    // Test responsive behavior
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile size
    
    await page.goto('data:text/html,<html><body><div style="width: 100%; background: red; height: 50px;">Mobile Test</div></body></html>');
    
    const div = page.locator('div');
    await expect(div).toBeVisible();
    
    // Change to desktop size
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(div).toBeVisible();
  });
}); 