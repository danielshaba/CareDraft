import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for visual regression tests
 * Ensures consistent environment and loads fonts/assets before testing
 */
async function globalSetup(config: FullConfig) {
  console.log('🎨 Setting up visual regression test environment...');
  
  // Launch browser for setup operations
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to app and wait for fonts to load
    console.log('📍 Loading application and waiting for fonts...');
    await page.goto(config.projects[0].use?.baseURL || 'http://localhost:3000');
    
    // Wait for document to be ready
    await page.waitForLoadState('networkidle');
    
    // Wait for custom fonts to load
    await page.evaluate(() => {
      return document.fonts.ready;
    });
    
    // Preload critical pages to warm up the application
    console.log('🔥 Warming up critical application routes...');
    const criticalRoutes = [
      '/',
      '/dashboard',
      '/knowledge-hub',
      '/draft-builder'
    ];
    
    for (const route of criticalRoutes) {
      try {
        await page.goto(route);
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        await page.waitForTimeout(1000); // Allow time for animations to settle
      } catch {
        console.warn(`⚠️  Could not preload route ${route}:`, error);
      }
    }
    
    console.log('✅ Visual test environment setup complete');
    
  } catch {
    console.error('❌ Visual setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

export default globalSetup;
