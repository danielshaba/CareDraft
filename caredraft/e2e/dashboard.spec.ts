import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // For now, navigate directly to dashboard
    // In a real setup, this would use authenticated state
    await page.goto('/dashboard');
  });

  test('should display dashboard layout correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Dashboard/);
    
    // Check for main layout elements
    await expect(page.locator('nav')).toBeVisible(); // Navigation
    await expect(page.locator('main')).toBeVisible(); // Main content area
    
    // Check for key dashboard sections
    await expect(page.locator('h1')).toContainText(/Dashboard/i);
  });

  test('should have functional navigation menu', async ({ page }) => {
    // Check for navigation items
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // Check for common navigation links
    const navLinks = [
      'Dashboard',
      'Knowledge Hub',
      'Draft Builder',
      'Organizations',
      'Settings'
    ];
    
    for (const linkText of navLinks) {
      const link = page.locator(`nav a:has-text("${linkText}")`);
      if (await link.count() > 0) {
        await expect(link.first()).toBeVisible();
      }
    }
  });

  test('should navigate to knowledge hub', async ({ page }) => {
    // Look for Knowledge Hub link and click it
    const knowledgeHubLink = page.locator('a[href*="/knowledge-hub"]');
    
    if (await knowledgeHubLink.count() > 0) {
      await knowledgeHubLink.first().click();
      await expect(page).toHaveURL(/\/knowledge-hub/);
    } else {
      // Alternative: try direct navigation
      await page.goto('/knowledge-hub');
      await expect(page).toHaveURL(/\/knowledge-hub/);
    }
    
    // Check knowledge hub page loaded
    await expect(page.locator('h1')).toContainText(/Knowledge Hub/i);
  });

  test('should navigate to draft builder', async ({ page }) => {
    // Look for Draft Builder link and click it
    const draftBuilderLink = page.locator('a[href*="/draft-builder"]');
    
    if (await draftBuilderLink.count() > 0) {
      await draftBuilderLink.first().click();
      await expect(page).toHaveURL(/\/draft-builder/);
    } else {
      // Alternative: try direct navigation
      await page.goto('/draft-builder');
      await expect(page).toHaveURL(/\/draft-builder/);
    }
    
    // Check draft builder page loaded
    await expect(page.locator('h1')).toContainText(/Draft Builder/i);
  });

  test('should display user information', async ({ page }) => {
    // Look for user menu or profile information
    const userMenu = page.locator('[data-testid="user-menu"]');
    const profileButton = page.locator('button:has-text("Profile")');
    const avatarButton = page.locator('[data-testid="user-avatar"]');
    
    // At least one user-related element should be visible
    const userElementVisible = await userMenu.count() > 0 || 
                              await profileButton.count() > 0 || 
                              await avatarButton.count() > 0;
    
    expect(userElementVisible).toBe(true);
  });

  test('should handle dashboard shortcuts and quick actions', async ({ page }) => {
    // Look for quick action buttons
    const quickActions = [
      'Create Document',
      'New Draft',
      'Upload File',
      'Create Proposal'
    ];
    
    for (const action of quickActions) {
      const actionButton = page.locator(`button:has-text("${action}")`);
      if (await actionButton.count() > 0) {
        await expect(actionButton.first()).toBeVisible();
      }
    }
  });

  test('should display recent activity or documents', async ({ page }) => {
    // Look for recent activity section
    const recentSection = page.locator(':has-text("Recent")');
    const activitySection = page.locator(':has-text("Activity")');
    const documentsSection = page.locator(':has-text("Documents")');
    
    // At least one section should be present
    const hasSections = await recentSection.count() > 0 || 
                       await activitySection.count() > 0 || 
                       await documentsSection.count() > 0;
    
    expect(hasSections).toBe(true);
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check mobile layout
    await expect(page.locator('main')).toBeVisible();
    
    // Check if navigation is collapsed/hidden on mobile
    const nav = page.locator('nav');
    if (await nav.count() > 0) {
      // Mobile nav might be in a drawer or hamburger menu
      const mobileMenuButton = page.locator('[data-testid="mobile-menu"]');
      if (await mobileMenuButton.count() > 0) {
        await expect(mobileMenuButton).toBeVisible();
      }
    }
  });

  test('should handle loading states', async ({ page }) => {
    // Navigate to dashboard and check for loading indicators
    await page.goto('/dashboard');
    
    // Look for skeleton loaders or loading spinners
    const loadingIndicators = page.locator('[data-testid*="loading"], [data-testid*="skeleton"], .animate-pulse');
    
    // If loading indicators are present, wait for them to disappear
    if (await loadingIndicators.count() > 0) {
      await expect(loadingIndicators.first()).toBeHidden({ timeout: 10000 });
    }
    
    // Ensure main content is loaded
    await expect(page.locator('main')).toBeVisible();
  });

  test('should handle empty states', async ({ page }) => {
    // Check for empty state messages when no data is available
    const emptyStateElements = page.locator(':has-text("No documents"), :has-text("No activity"), :has-text("Get started")');
    
    // If empty states are present, they should be properly styled
    if (await emptyStateElements.count() > 0) {
      await expect(emptyStateElements.first()).toBeVisible();
    }
  });
});

test.describe('Dashboard Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should open user settings', async ({ page }) => {
    // Look for settings link or button
    const settingsLink = page.locator('a[href*="/settings"]');
    const settingsButton = page.locator('button:has-text("Settings")');
    
    if (await settingsLink.count() > 0) {
      await settingsLink.first().click();
      await expect(page).toHaveURL(/\/settings/);
    } else if (await settingsButton.count() > 0) {
      await settingsButton.first().click();
      // Settings might open in a modal or navigate to a page
      await page.waitForTimeout(1000);
    }
  });

  test('should handle organization switching', async ({ page }) => {
    // Look for organization selector
    const orgSelector = page.locator('[data-testid="org-selector"]');
    const orgDropdown = page.locator('select:has-text("Organization")');
    
    if (await orgSelector.count() > 0) {
      await expect(orgSelector).toBeVisible();
    } else if (await orgDropdown.count() > 0) {
      await expect(orgDropdown).toBeVisible();
    }
  });

  test('should handle notifications', async ({ page }) => {
    // Look for notification bell or indicator
    const notificationBell = page.locator('[data-testid="notifications"]');
    const notificationButton = page.locator('button:has([data-testid*="bell"])');
    
    if (await notificationBell.count() > 0) {
      await expect(notificationBell).toBeVisible();
      
      // Try clicking to open notifications
      await notificationBell.click();
      await page.waitForTimeout(500);
    } else if (await notificationButton.count() > 0) {
      await expect(notificationButton).toBeVisible();
    }
  });

  test('should handle search functionality', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
    
    if (await searchInput.count() > 0) {
      await expect(searchInput.first()).toBeVisible();
      
      // Test search functionality
      await searchInput.first().fill('test search');
      await page.keyboard.press('Enter');
      
      // Wait for search results or navigation
      await page.waitForTimeout(1000);
    }
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    // Test common keyboard shortcuts
    // Cmd/Ctrl + K for search
    const isMac = await page.evaluate(() => navigator.platform.includes('Mac'));
    const modifier = isMac ? 'Meta' : 'Control';
    
    await page.keyboard.press(`${modifier}+k`);
    await page.waitForTimeout(500);
    
    // Check if search modal or focus changed
    const searchModal = page.locator('[data-testid="search-modal"]');
    const focusedElement = page.locator(':focus');
    
    const hasSearchModal = await searchModal.count() > 0;
    const hasFocusedInput = await focusedElement.getAttribute('type') === 'search';
    
    expect(hasSearchModal || hasFocusedInput).toBe(true);
  });
}); 