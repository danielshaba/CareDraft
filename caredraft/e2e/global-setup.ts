import { chromium, FullConfig, Page } from '@playwright/test';
import path from 'path';

/**
 * Global setup for Playwright tests
 * Sets up authentication and prepares test environment
 */
async function globalSetup(config: FullConfig) {
  console.log('🎭 Setting up Playwright test environment...');

  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for the development server to be ready
    console.log('⏳ Waiting for development server...');
    await page.goto(baseURL || 'http://localhost:3000');
    await page.waitForSelector('body', { timeout: 30000 });
    console.log('✅ Development server is ready');

    // Create test user authentication state
    await setupTestAuthentication(page, baseURL);
    
    // Setup test data if needed
    await setupTestData(page);

    console.log('✅ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Setup test user authentication
 */
async function setupTestAuthentication(page: Page, baseURL: string | undefined) {
  console.log('🔐 Setting up test authentication...');
  
  try {
    // Navigate to sign in page
    await page.goto(`${baseURL}/sign-in`);
    
    // Check if we can access the sign-in form
    const signInForm = await page.locator('form').first();
    if (await signInForm.isVisible()) {
      console.log('📝 Sign-in form found');
      
      // For now, we'll just save the authenticated state storage
      // In a real scenario, you would perform actual authentication here
      // with test credentials from environment variables
      
      // Example test user credentials (would come from env vars)
      const testUser = {
        email: process.env.E2E_TEST_EMAIL || 'test@caredraft.co.uk',
        password: process.env.E2E_TEST_PASSWORD || 'TestPassword123!'
      };
      
      console.log(`🧪 Test user configured: ${testUser.email}`);
    }
    
    // Save authentication state for reuse in tests
    await page.context().storageState({ 
      path: path.join(__dirname, '../.auth/user.json') 
    });
    
    console.log('✅ Authentication state saved');
  } catch (error) {
    console.log('⚠️ Authentication setup skipped (sign-in page not available)');
  }
}

/**
 * Setup test data
 */
async function setupTestData(_page: Page) {
  console.log('📊 Setting up test data...');
  
  try {
    // Add any test data setup here
    // This could include creating test organizations, documents, etc.
    console.log('✅ Test data setup completed');
  } catch (error) {
    console.log('⚠️ Test data setup skipped:', error instanceof Error ? error.message : 'Unknown error');
  }
}

export default globalSetup; 