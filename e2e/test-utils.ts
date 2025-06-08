import { Page, expect } from '@playwright/test';

/**
 * Test utilities for CareDraft E2E tests
 */

/**
 * Wait for page to be fully loaded
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('body');
}

/**
 * Sign in with test credentials
 */
export async function signIn(page: Page, email?: string, password?: string) {
  const testEmail = email || process.env.E2E_TEST_EMAIL || 'test@caredraft.co.uk';
  const testPassword = password || process.env.E2E_TEST_PASSWORD || 'TestPassword123!';
  
  await page.goto('/sign-in');
  
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  const submitButton = page.locator('button[type="submit"]');
  
  if (await emailInput.count() > 0) {
    await emailInput.fill(testEmail);
    await passwordInput.fill(testPassword);
    await submitButton.click();
    
    // Wait for navigation or error
    await page.waitForLoadState('networkidle');
  }
}

/**
 * Navigate to a specific section
 */
export async function navigateToSection(page: Page, section: string) {
  const sectionMap: Record<string, string> = {
    dashboard: '/dashboard',
    'knowledge-hub': '/knowledge-hub',
    'draft-builder': '/draft-builder',
    settings: '/settings',
    organizations: '/organizations'
  };
  
  const url = sectionMap[section] || section;
  await page.goto(url);
  await waitForPageLoad(page);
}

/**
 * Find and interact with editor
 */
export async function getEditor(page: Page) {
  const editorSelectors = [
    '[contenteditable="true"]',
    'textarea',
    '.tiptap',
    '[data-testid="document-editor"]'
  ];
  
  for (const selector of editorSelectors) {
    const element = page.locator(selector);
    if (await element.count() > 0) {
      return element.first();
    }
  }
  
  return null;
}

/**
 * Type text in editor
 */
export async function typeInEditor(page: Page, text: string) {
  const editor = await getEditor(page);
  if (editor) {
    await editor.click();
    await editor.fill(text);
    return true;
  }
  return false;
}

/**
 * Save document
 */
export async function saveDocument(page: Page) {
  const saveButtons = [
    'button:has-text("Save")',
    'button[title*="Save"]',
    '[data-testid="save-document"]',
    'button:has([data-icon="save"])'
  ];
  
  for (const selector of saveButtons) {
    const button = page.locator(selector);
    if (await button.count() > 0) {
      await button.first().click();
      await page.waitForTimeout(1000);
      return true;
    }
  }
  
  // Try keyboard shortcut
  const isMac = await page.evaluate(() => navigator.platform.includes('Mac'));
  const modifier = isMac ? 'Meta' : 'Control';
  await page.keyboard.press(`${modifier}+s`);
  await page.waitForTimeout(1000);
  return true;
}

/**
 * Check for loading states
 */
export async function waitForLoadingToComplete(page: Page) {
  const loadingSelectors = [
    '[data-testid*="loading"]',
    '[data-testid*="skeleton"]',
    '.animate-pulse',
    '.loading-spinner',
    '.skeleton'
  ];
  
  for (const selector of loadingSelectors) {
    const elements = page.locator(selector);
    if (await elements.count() > 0) {
      await expect(elements.first()).toBeHidden({ timeout: 10000 });
    }
  }
}

/**
 * Check for error messages
 */
export async function checkForErrors(page: Page) {
  const errorSelectors = [
    '[role="alert"]',
    '.error-message',
    '[data-testid*="error"]',
    '.text-red-500',
    '.text-destructive'
  ];
  
  const errors = [];
  for (const selector of errorSelectors) {
    const elements = page.locator(selector);
    const count = await elements.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const text = await elements.nth(i).textContent();
        if (text && text.trim()) {
          errors.push(text.trim());
        }
      }
    }
  }
  
  return errors;
}

/**
 * Take screenshot with timestamp
 */
export async function takeTimestampedScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  });
}

/**
 * Check accessibility basics
 */
export async function checkBasicAccessibility(page: Page) {
  // Check for h1
  const h1 = page.locator('h1');
  const h1Count = await h1.count();
  expect(h1Count).toBeGreaterThanOrEqual(1);
  
  // Check for main content
  const main = page.locator('main');
  if (await main.count() > 0) {
    await expect(main.first()).toBeVisible();
  }
  
  // Check for navigation
  const nav = page.locator('nav');
  if (await nav.count() > 0) {
    await expect(nav.first()).toBeVisible();
  }
}

/**
 * Test keyboard navigation
 */
export async function testKeyboardNavigation(page: Page, steps: number = 5) {
  const focusedElements = [];
  
  for (let i = 0; i < steps; i++) {
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    if (await focused.count() > 0) {
      const tagName = await focused.evaluate(el => el.tagName.toLowerCase());
      focusedElements.push(tagName);
    }
  }
  
  return focusedElements;
}

/**
 * Check responsive design
 */
export async function testResponsiveDesign(page: Page) {
  const viewports = [
    { width: 375, height: 667, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1920, height: 1080, name: 'desktop' }
  ];
  
  const results = [];
  
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(500);
    
    // Check if main content is visible
    const main = page.locator('main, body');
    const isVisible = await main.first().isVisible();
    
    results.push({
      viewport: viewport.name,
      size: `${viewport.width}x${viewport.height}`,
      mainContentVisible: isVisible
    });
  }
  
  return results;
}

/**
 * Performance measurement helper
 */
export async function measurePerformance(page: Page, action: () => Promise<void>) {
  const startTime = Date.now();
  await action();
  const endTime = Date.now();
  return endTime - startTime;
}

/**
 * Wait for network to be idle
 */
export async function waitForNetworkIdle(page: Page, timeout: number = 30000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Check for console errors
 */
export async function checkConsoleErrors(page: Page) {
  const errors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  return errors;
} 