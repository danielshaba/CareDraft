import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load homepage within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`Homepage load time: ${loadTime}ms`);
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should load dashboard within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`Dashboard load time: ${loadTime}ms`);
    
    // Dashboard should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should load draft builder efficiently', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/draft-builder');
    
    // Wait for editor to be ready
    await page.waitForSelector('[contenteditable="true"], textarea', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`Draft builder load time: ${loadTime}ms`);
    
    // Draft builder should load within 4 seconds
    expect(loadTime).toBeLessThan(4000);
  });

  test('should handle large document efficiently', async ({ page }) => {
    await page.goto('/draft-builder');
    
    // Wait for editor
    const editor = page.locator('[contenteditable="true"], textarea').first();
    await expect(editor).toBeVisible();
    
    // Generate large content
    const largeContent = 'This is a test paragraph. '.repeat(1000); // ~26KB of text
    
    const startTime = Date.now();
    await editor.click();
    await editor.fill(largeContent);
    
    // Wait for content to be processed
    await page.waitForTimeout(1000);
    
    const processingTime = Date.now() - startTime;
    console.log(`Large document processing time: ${processingTime}ms`);
    
    // Should handle large content within 3 seconds
    expect(processingTime).toBeLessThan(3000);
    
    // Verify content was actually loaded
    await expect(editor).toContainText('This is a test paragraph');
  });

  test('should handle rapid typing efficiently', async ({ page }) => {
    await page.goto('/draft-builder');
    
    const editor = page.locator('[contenteditable="true"], textarea').first();
    await expect(editor).toBeVisible();
    await editor.click();
    
    const startTime = Date.now();
    
    // Simulate rapid typing
    const words = ['performance', 'testing', 'rapid', 'typing', 'response', 'time'];
    for (const word of words) {
      await editor.type(word + ' ', { delay: 50 }); // 50ms between characters
    }
    
    const typingTime = Date.now() - startTime;
    console.log(`Rapid typing response time: ${typingTime}ms`);
    
    // Should handle rapid typing smoothly
    expect(typingTime).toBeLessThan(2000);
  });

  test('should handle navigation efficiently', async ({ page }) => {
    // Test navigation between different sections
    const routes = ['/dashboard', '/knowledge-hub', '/draft-builder', '/settings'];
    const navigationTimes: number[] = [];
    
    for (const route of routes) {
      const startTime = Date.now();
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      const navTime = Date.now() - startTime;
      navigationTimes.push(navTime);
      console.log(`Navigation to ${route}: ${navTime}ms`);
    }
    
    // Average navigation time should be under 2 seconds
    const avgNavTime = navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length;
    expect(avgNavTime).toBeLessThan(2000);
  });
});

test.describe('Resource Usage Tests', () => {
  test('should not have excessive memory usage', async ({ page }) => {
    await page.goto('/draft-builder');
    
    // Get initial memory usage
    const initialMetrics = await page.evaluate(() => {
      return {
        usedJSHeapSize: (performance as any).memory?.usedJSHeapSize || 0,
        totalJSHeapSize: (performance as any).memory?.totalJSHeapSize || 0
      };
    });
    
    // Perform memory-intensive operations
    const editor = page.locator('[contenteditable="true"], textarea').first();
    if (await editor.count() > 0) {
      await editor.click();
      
      // Add and remove content multiple times
      for (let i = 0; i < 10; i++) {
        await editor.fill(`Content iteration ${i} `.repeat(100));
        await page.waitForTimeout(100);
      }
    }
    
    // Get final memory usage
    const finalMetrics = await page.evaluate(() => {
      return {
        usedJSHeapSize: (performance as any).memory?.usedJSHeapSize || 0,
        totalJSHeapSize: (performance as any).memory?.totalJSHeapSize || 0
      };
    });
    
    const memoryIncrease = finalMetrics.usedJSHeapSize - initialMetrics.usedJSHeapSize;
    console.log(`Memory increase: ${memoryIncrease / 1024 / 1024}MB`);
    
    // Memory increase should be reasonable (under 50MB for this test)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });

  test('should not have excessive DOM nodes', async ({ page }) => {
    await page.goto('/draft-builder');
    
    const domNodeCount = await page.evaluate(() => {
      return document.querySelectorAll('*').length;
    });
    
    console.log(`DOM node count: ${domNodeCount}`);
    
    // Should not have excessive DOM nodes (under 5000 for a typical page)
    expect(domNodeCount).toBeLessThan(5000);
  });

  test('should handle network requests efficiently', async ({ page }) => {
    // Monitor network requests
    const requests: string[] = [];
    page.on('request', request => {
      requests.push(request.url());
    });
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    console.log(`Total network requests: ${requests.length}`);
    
    // Should not make excessive requests
    expect(requests.length).toBeLessThan(50);
    
    // Check for duplicate requests
    const uniqueRequests = new Set(requests);
    const duplicateRequests = requests.length - uniqueRequests.size;
    console.log(`Duplicate requests: ${duplicateRequests}`);
    
    // Should minimize duplicate requests
    expect(duplicateRequests).toBeLessThan(5);
  });
});

test.describe('Performance Monitoring', () => {
  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Measure Core Web Vitals
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals: any = {};
          
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              vitals.FCP = navEntry.loadEventEnd - navEntry.fetchStart;
            }
            if (entry.entryType === 'largest-contentful-paint') {
              vitals.LCP = entry.startTime;
            }
            if (entry.entryType === 'first-input') {
              vitals.FID = entry.processingStart - entry.startTime;
            }
          });
          
          resolve(vitals);
        });
        
        observer.observe({ entryTypes: ['navigation', 'largest-contentful-paint', 'first-input'] });
        
        // Fallback if no entries are captured
        setTimeout(() => resolve({}), 3000);
      });
    });
    
    console.log('Core Web Vitals:', vitals);
    
    // Basic performance assertions
    if ((vitals as any).LCP) {
      expect((vitals as any).LCP).toBeLessThan(2500); // LCP should be under 2.5s
    }
    if ((vitals as any).FID) {
      expect((vitals as any).FID).toBeLessThan(100); // FID should be under 100ms
    }
  });

  test('should have efficient rendering performance', async ({ page }) => {
    await page.goto('/draft-builder');
    
    // Measure rendering performance
    const renderingMetrics = await page.evaluate(() => {
      const startTime = performance.now();
      
      // Force a reflow
      document.body.offsetHeight;
      
      return {
        renderTime: performance.now() - startTime,
        paintEntries: performance.getEntriesByType('paint').length
      };
    });
    
    console.log('Rendering metrics:', renderingMetrics);
    
    // Rendering should be efficient
    expect(renderingMetrics.renderTime).toBeLessThan(16); // Under one frame (60fps)
  });

  test('should handle concurrent operations efficiently', async ({ page }) => {
    await page.goto('/draft-builder');
    
    const editor = page.locator('[contenteditable="true"], textarea').first();
    await expect(editor).toBeVisible();
    
    const startTime = Date.now();
    
    // Simulate concurrent operations
    await Promise.all([
      editor.fill('Concurrent content 1'),
      page.locator('button').first().click().catch(() => {}), // Ignore errors
      page.keyboard.press('Escape'),
      page.mouse.move(100, 100)
    ]);
    
    const concurrentTime = Date.now() - startTime;
    console.log(`Concurrent operations time: ${concurrentTime}ms`);
    
    // Should handle concurrent operations smoothly
    expect(concurrentTime).toBeLessThan(1000);
  });

  test('should maintain performance under load', async ({ page }) => {
    await page.goto('/draft-builder');
    
    const editor = page.locator('[contenteditable="true"], textarea').first();
    await expect(editor).toBeVisible();
    
    const operationTimes: number[] = [];
    
    // Perform multiple operations and measure each
    for (let i = 0; i < 10; i++) {
      const startTime = Date.now();
      
      await editor.click();
      await editor.fill(`Performance test content ${i}`);
      await page.waitForTimeout(100);
      
      const operationTime = Date.now() - startTime;
      operationTimes.push(operationTime);
    }
    
    console.log('Operation times:', operationTimes);
    
    // Performance should not degrade significantly
    const firstOperation = operationTimes[0];
    const lastOperation = operationTimes[operationTimes.length - 1];
    const degradation = lastOperation / firstOperation;
    
    expect(degradation).toBeLessThan(2); // Should not be more than 2x slower
  });
}); 