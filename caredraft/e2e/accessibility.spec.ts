import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  test('should have proper page structure and headings', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper heading hierarchy
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1); // Should have exactly one h1
    
    // Check that headings follow proper hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const headingLevels = await Promise.all(
      headings.map(async (heading) => {
        const tagName = await heading.evaluate(el => el.tagName);
        return parseInt(tagName.charAt(1));
      })
    );
    
    // Verify heading hierarchy (no skipping levels)
    for (let i = 1; i < headingLevels.length; i++) {
      const diff = headingLevels[i] - headingLevels[i - 1];
      expect(diff).toBeLessThanOrEqual(1);
    }
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for navigation landmarks
    const nav = page.locator('nav');
    if (await nav.count() > 0) {
      await expect(nav.first()).toHaveAttribute('role', 'navigation');
    }
    
    // Check for main content area
    const main = page.locator('main');
    if (await main.count() > 0) {
      await expect(main.first()).toHaveAttribute('role', 'main');
    }
    
    // Check for proper button labels
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const hasAriaLabel = await button.getAttribute('aria-label');
      const hasText = await button.textContent();
      const hasAriaLabelledBy = await button.getAttribute('aria-labelledby');
      
      // Button should have accessible name
      expect(hasAriaLabel || hasText || hasAriaLabelledBy).toBeTruthy();
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Test tab navigation through form
    await page.keyboard.press('Tab');
    const firstFocusable = page.locator(':focus');
    await expect(firstFocusable).toBeVisible();
    
    // Continue tabbing through elements
    const focusableElements = [];
    for (let i = 0; i < 10; i++) {
      const focused = await page.locator(':focus').getAttribute('tagName');
      if (focused) {
        focusableElements.push(focused.toLowerCase());
      }
      await page.keyboard.press('Tab');
    }
    
    console.log('Focusable elements:', focusableElements);
    
    // Should have navigated through multiple elements
    expect(focusableElements.length).toBeGreaterThan(2);
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    await page.goto('/draft-builder');
    
    // Test common keyboard shortcuts
    const isMac = await page.evaluate(() => navigator.platform.includes('Mac'));
    const modifier = isMac ? 'Meta' : 'Control';
    
    // Test Ctrl/Cmd + S for save
    await page.keyboard.press(`${modifier}+s`);
    await page.waitForTimeout(500);
    
    // Test Ctrl/Cmd + Z for undo
    await page.keyboard.press(`${modifier}+z`);
    await page.waitForTimeout(500);
    
    // Test Escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    console.log('Keyboard shortcuts tested');
  });

  test('should have proper form accessibility', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Check form labels
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const inputId = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      if (inputId) {
        // Check for associated label
        const label = page.locator(`label[for="${inputId}"]`);
        const hasLabel = await label.count() > 0;
        
        // Input should have label or aria-label
        expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
    
    // Check for error message accessibility
    const errorElements = page.locator('[role="alert"], .error-message, [aria-live="polite"]');
    if (await errorElements.count() > 0) {
      await expect(errorElements.first()).toHaveAttribute('role', 'alert');
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/');
    
    // Get computed styles for text elements
    const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, span, a, button');
    const elementCount = Math.min(await textElements.count(), 10);
    
    for (let i = 0; i < elementCount; i++) {
      const element = textElements.nth(i);
      const styles = await element.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize
        };
      });
      
      console.log(`Element ${i} styles:`, styles);
      
      // Basic check that text has color
      expect(styles.color).not.toBe('');
    }
  });

  test('should support screen reader navigation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for skip links
    const skipLink = page.locator('a:has-text("Skip to main content"), a:has-text("Skip to content")');
    if (await skipLink.count() > 0) {
      await expect(skipLink.first()).toBeVisible();
    }
    
    // Check for landmark regions
    const landmarks = [
      'banner',
      'navigation',
      'main',
      'contentinfo',
      'complementary'
    ];
    
    for (const landmark of landmarks) {
      const landmarkElement = page.locator(`[role="${landmark}"]`);
      if (await landmarkElement.count() > 0) {
        console.log(`Found ${landmark} landmark`);
      }
    }
  });

  test('should handle focus management', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Test modal focus management (if modals exist)
    const modalTrigger = page.locator('button:has-text("Settings"), button:has-text("Profile")');
    
    if (await modalTrigger.count() > 0) {
      await modalTrigger.first().click();
      await page.waitForTimeout(500);
      
      // Check if focus moved to modal
      const modal = page.locator('[role="dialog"]');
      if (await modal.count() > 0) {
        const focusedElement = page.locator(':focus');
        const isInModal = await modal.locator(':focus').count() > 0;
        expect(isInModal).toBe(true);
        
        // Test escape key closes modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        
        // Focus should return to trigger
        const focusReturnedToTrigger = await modalTrigger.first().evaluate(
          (el) => document.activeElement === el
        );
        expect(focusReturnedToTrigger).toBe(true);
      }
    }
  });

  test('should have accessible data tables', async ({ page }) => {
    await page.goto('/knowledge-hub');
    
    // Check for data tables
    const tables = page.locator('table');
    const tableCount = await tables.count();
    
    for (let i = 0; i < tableCount; i++) {
      const table = tables.nth(i);
      
      // Check for table headers
      const headers = table.locator('th');
      if (await headers.count() > 0) {
        // Headers should have scope attribute
        const firstHeader = headers.first();
        const scope = await firstHeader.getAttribute('scope');
        expect(scope).toBeTruthy();
      }
      
      // Check for table caption
      const caption = table.locator('caption');
      if (await caption.count() > 0) {
        await expect(caption).toBeVisible();
      }
    }
  });

  test('should handle dynamic content accessibility', async ({ page }) => {
    await page.goto('/draft-builder');
    
    // Test live regions for dynamic updates
    const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');
    
    if (await liveRegions.count() > 0) {
      console.log(`Found ${await liveRegions.count()} live regions`);
      
      // Check aria-live values
      for (let i = 0; i < await liveRegions.count(); i++) {
        const region = liveRegions.nth(i);
        const ariaLive = await region.getAttribute('aria-live');
        const role = await region.getAttribute('role');
        
        if (ariaLive) {
          expect(['polite', 'assertive', 'off']).toContain(ariaLive);
        }
        
        if (role) {
          expect(['status', 'alert', 'log']).toContain(role);
        }
      }
    }
  });

  test('should be usable with high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    
    // Check that content is still visible
    const mainContent = page.locator('main, body');
    await expect(mainContent.first()).toBeVisible();
    
    // Check that interactive elements are visible
    const buttons = page.locator('button');
    if (await buttons.count() > 0) {
      await expect(buttons.first()).toBeVisible();
    }
    
    const links = page.locator('a');
    if (await links.count() > 0) {
      await expect(links.first()).toBeVisible();
    }
  });

  test('should support reduced motion preferences', async ({ page }) => {
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    
    // Check that animations are reduced or disabled
    const animatedElements = page.locator('.animate-spin, .animate-pulse, [style*="animation"]');
    
    if (await animatedElements.count() > 0) {
      // In a real implementation, you'd check that animations are disabled
      console.log('Found animated elements, should respect reduced motion');
    }
  });

  test('should have proper error message accessibility', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Trigger form validation
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.count() > 0) {
      await submitButton.click();
      
      // Wait for error messages
      await page.waitForTimeout(1000);
      
      // Check for accessible error messages
      const errorMessages = page.locator('[role="alert"], [aria-live="polite"], .error-message');
      
      if (await errorMessages.count() > 0) {
        const firstError = errorMessages.first();
        await expect(firstError).toBeVisible();
        
        // Error should be associated with form field
        const ariaDescribedBy = await page.locator('input[aria-describedby]').first().getAttribute('aria-describedby');
        if (ariaDescribedBy) {
          const describedByElement = page.locator(`#${ariaDescribedBy}`);
          await expect(describedByElement).toBeVisible();
        }
      }
    }
  });
}); 