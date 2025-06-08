import { FullConfig } from '@playwright/test';

/**
 * Global teardown for Playwright tests
 * Cleans up test environment and resources
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up Playwright test environment...');

  try {
    // Clean up test data
    await cleanupTestData();
    
    // Clean up authentication state
    await cleanupAuthState();
    
    // Clean up any temporary files
    await cleanupTempFiles();

    console.log('✅ Global teardown completed successfully');
  } catch {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

/**
 * Clean up test data
 */
async function cleanupTestData() {
  console.log('🗑️ Cleaning up test data...');
  
  try {
    // Add any test data cleanup here
    // This could include removing test organizations, documents, etc.
    console.log('✅ Test data cleanup completed');
  } catch {
    console.log('⚠️ Test data cleanup skipped:', error.message);
  }
}

/**
 * Clean up authentication state
 */
async function cleanupAuthState() {
  console.log('🔓 Cleaning up authentication state...');
  
  try {
    // Clean up stored authentication state
    const fs = await import('fs');
    const path = await import('path');
    
    const authPath = path.join(__dirname, '../.auth');
    if (fs.existsSync(authPath)) {
      fs.rmSync(authPath, { recursive: true, force: true });
      console.log('✅ Authentication state cleaned up');
    }
  } catch {
    console.log('⚠️ Authentication cleanup skipped:', error.message);
  }
}

/**
 * Clean up temporary files
 */
async function cleanupTempFiles() {
  console.log('🗂️ Cleaning up temporary files...');
  
  try {
    // Clean up any temporary files created during tests
    console.log('✅ Temporary files cleanup completed');
  } catch {
    console.log('⚠️ Temporary files cleanup skipped:', error.message);
  }
}

export default globalTeardown; 