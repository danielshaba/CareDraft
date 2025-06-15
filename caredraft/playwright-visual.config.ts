import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration specifically for visual regression testing
 * Optimized for consistent screenshot comparison across environments
 */
export default defineConfig({
  testDir: './e2e/visual',
  testMatch: '**/*.visual.spec.ts',
  
  /* Visual regression tests should run serially for consistency */
  fullyParallel: false,
  workers: 1,
  
  /* Retry on CI for visual stability */
  retries: process.env.CI ? 3 : 1,
  
  /* Strict mode for visual tests */
  forbidOnly: !!process.env.CI,
  
  /* Specialized reporter for visual tests */
  reporter: [
    ['html', { outputFolder: 'playwright-visual-report' }],
    ['json', { outputFile: 'playwright-visual-report/results.json' }],
    ['list', { printSteps: true }]
  ],

  use: {
    baseURL: 'http://localhost:3000',
    
    /* Visual regression specific settings */
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    
    /* Consistent viewport for visual tests */
    viewport: { width: 1280, height: 720 },
    
    /* Wait for fonts and images to load */
    actionTimeout: 15000,
    navigationTimeout: 30000,
    
    /* Consistent browser settings */
    launchOptions: {
      args: [
        '--disable-web-security',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--font-render-hinting=none',
        '--disable-font-subpixel-positioning'
      ]
    }
  },

  /* Expect configuration for visual comparisons */
  expect: {
    /* Visual comparison thresholds */
    toHaveScreenshot: { 
      threshold: 0.2,
      animations: 'disabled'
    },
    toMatchSnapshot: {
      threshold: 0.2
    },
    timeout: 10000
  },

  /* Projects optimized for visual consistency */
  projects: [
    {
      name: 'chromium-visual',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1
      },
    },
    {
      name: 'webkit-visual',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1
      },
    },
    {
      name: 'firefox-visual', 
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1
      },
    },
    /* Mobile visual testing */
    {
      name: 'mobile-visual',
      use: { 
        ...devices['iPhone 12'],
        deviceScaleFactor: 1
      },
    }
  ],

  /* Development server configuration */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  /* Global setup for visual tests */
  globalSetup: './e2e/visual/visual-setup.ts',

  /* Output directories */
  outputDir: 'test-results-visual/',
  
  /* Test timeout */
  timeout: 60 * 1000,
}); 