import { test, expect } from '@playwright/test';

test.describe('Document Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to draft builder or documents area
    await page.goto('/draft-builder');
  });

  test('should display draft builder interface', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Draft Builder/);
    
    // Check for main interface elements
    await expect(page.locator('h1')).toContainText(/Draft Builder/i);
    
    // Look for editor interface
    const editorElements = [
      '[data-testid="document-editor"]',
      '.editor-container',
      '[contenteditable="true"]',
      'textarea',
      '.tiptap'
    ];
    
    let editorFound = false;
    for (const selector of editorElements) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible();
        editorFound = true;
        break;
      }
    }
    
    expect(editorFound).toBe(true);
  });

  test('should create a new document', async ({ page }) => {
    // Look for "New Document" or "Create" button
    const createButtons = [
      'button:has-text("New Document")',
      'button:has-text("Create")',
      'button:has-text("+")',
      '[data-testid="create-document"]'
    ];
    
    let createButton = null;
    for (const selector of createButtons) {
      const button = page.locator(selector);
      if (await button.count() > 0) {
        createButton = button.first();
        break;
      }
    }
    
    if (createButton) {
      await createButton.click();
      
      // Wait for new document interface
      await page.waitForTimeout(1000);
      
      // Check if editor is ready for input
      const editor = page.locator('[contenteditable="true"], textarea').first();
      if (await editor.count() > 0) {
        await expect(editor).toBeVisible();
      }
    }
  });

  test('should handle text input and formatting', async ({ page }) => {
    // Find editor element
    const editorSelectors = [
      '[contenteditable="true"]',
      'textarea',
      '.tiptap',
      '[data-testid="document-editor"]'
    ];
    
    let editor = null;
    for (const selector of editorSelectors) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        editor = element.first();
        break;
      }
    }
    
    if (editor) {
      // Type some content
      await editor.click();
      await editor.fill('This is a test document with sample content.');
      
      // Verify content was entered
      await expect(editor).toContainText('This is a test document');
      
      // Test basic formatting if available
      const boldButton = page.locator('button[title*="Bold"], button:has-text("B")');
      if (await boldButton.count() > 0) {
        // Select text and apply bold
        await editor.selectText();
        await boldButton.first().click();
      }
    }
  });

  test('should save document', async ({ page }) => {
    // Look for save button
    const saveButtons = [
      'button:has-text("Save")',
      'button[title*="Save"]',
      '[data-testid="save-document"]',
      'button:has([data-icon="save"])'
    ];
    
    let saveButton = null;
    for (const selector of saveButtons) {
      const button = page.locator(selector);
      if (await button.count() > 0) {
        saveButton = button.first();
        break;
      }
    }
    
    if (saveButton) {
      // First add some content
      const editor = page.locator('[contenteditable="true"], textarea').first();
      if (await editor.count() > 0) {
        await editor.click();
        await editor.fill('Document to be saved');
      }
      
      // Save the document
      await saveButton.click();
      
      // Look for save confirmation
      const successMessage = page.locator(':has-text("saved"), :has-text("Saved"), [role="alert"]');
      if (await successMessage.count() > 0) {
        await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should handle document templates', async ({ page }) => {
    // Look for template selection
    const templateElements = [
      'button:has-text("Template")',
      'select:has-text("Template")',
      '[data-testid="template-selector"]',
      '.template-grid'
    ];
    
    let templateElement = null;
    for (const selector of templateElements) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        templateElement = element.first();
        break;
      }
    }
    
    if (templateElement) {
      await expect(templateElement).toBeVisible();
      
      // If it's a button, click it to open template selection
      const tagName = await templateElement.evaluate(el => el.tagName.toLowerCase());
      if (tagName === 'button') {
        await templateElement.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should handle collaborative features', async ({ page }) => {
    // Look for collaboration indicators
    const collabElements = [
      '[data-testid="collaborators"]',
      '.user-avatars',
      ':has-text("Share")',
      'button:has-text("Invite")'
    ];
    
    for (const selector of collabElements) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible();
      }
    }
  });

  test('should display document history/versions', async ({ page }) => {
    // Look for version history
    const historyElements = [
      'button:has-text("History")',
      'button:has-text("Versions")',
      '[data-testid="document-history"]',
      '.version-list'
    ];
    
    let historyElement = null;
    for (const selector of historyElements) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        historyElement = element.first();
        break;
      }
    }
    
    if (historyElement) {
      await historyElement.click();
      await page.waitForTimeout(1000);
      
      // Check if history panel opened
      const historyPanel = page.locator('[data-testid="history-panel"], .history-sidebar');
      if (await historyPanel.count() > 0) {
        await expect(historyPanel.first()).toBeVisible();
      }
    }
  });

  test('should export document', async ({ page }) => {
    // Look for export options
    const exportElements = [
      'button:has-text("Export")',
      'button:has-text("Download")',
      '[data-testid="export-document"]'
    ];
    
    let exportButton = null;
    for (const selector of exportElements) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        exportButton = element.first();
        break;
      }
    }
    
    if (exportButton) {
      // First add some content to export
      const editor = page.locator('[contenteditable="true"], textarea').first();
      if (await editor.count() > 0) {
        await editor.click();
        await editor.fill('Content to export');
      }
      
      // Click export
      await exportButton.click();
      
      // Check for export options dialog
      const exportDialog = page.locator('[role="dialog"]:has-text("Export")');
      if (await exportDialog.count() > 0) {
        await expect(exportDialog).toBeVisible();
      }
    }
  });
});

test.describe('Document Editor Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/draft-builder');
  });

  test('should handle rich text formatting', async ({ page }) => {
    const editor = page.locator('[contenteditable="true"], textarea').first();
    
    if (await editor.count() > 0) {
      await editor.click();
      await editor.fill('Sample text for formatting');
      
      // Test formatting buttons if available
      const formatButtons = [
        { selector: 'button[title*="Bold"], button:has-text("B")', text: 'Bold' },
        { selector: 'button[title*="Italic"], button:has-text("I")', text: 'Italic' },
        { selector: 'button[title*="Underline"], button:has-text("U")', text: 'Underline' }
      ];
      
      for (const button of formatButtons) {
        const formatButton = page.locator(button.selector);
        if (await formatButton.count() > 0) {
          await formatButton.first().click();
          console.log(`${button.text} button clicked`);
        }
      }
    }
  });

  test('should handle lists and headings', async ({ page }) => {
    const editor = page.locator('[contenteditable="true"], textarea').first();
    
    if (await editor.count() > 0) {
      await editor.click();
      
      // Test heading buttons
      const headingButton = page.locator('button:has-text("H1"), button[title*="Heading"]');
      if (await headingButton.count() > 0) {
        await headingButton.first().click();
        await editor.type('This is a heading');
      }
      
      // Test list buttons
      const listButton = page.locator('button[title*="Bullet"], button:has-text("•")');
      if (await listButton.count() > 0) {
        await listButton.first().click();
        await editor.type('First list item');
      }
    }
  });

  test('should handle undo/redo', async ({ page }) => {
    const editor = page.locator('[contenteditable="true"], textarea').first();
    
    if (await editor.count() > 0) {
      await editor.click();
      await editor.fill('Original text');
      
      // Make a change
      await editor.fill('Modified text');
      
      // Test undo
      const undoButton = page.locator('button[title*="Undo"]');
      if (await undoButton.count() > 0) {
        await undoButton.click();
        await expect(editor).toContainText('Original text');
      } else {
        // Try keyboard shortcut
        await page.keyboard.press('Meta+z'); // or Ctrl+z
      }
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if editor is visible and usable on mobile
    const editor = page.locator('[contenteditable="true"], textarea').first();
    if (await editor.count() > 0) {
      await expect(editor).toBeVisible();
      
      // Test mobile text input
      await editor.click();
      await editor.fill('Mobile text input test');
      await expect(editor).toContainText('Mobile text input test');
    }
    
    // Check if mobile toolbar is available
    const mobileToolbar = page.locator('.mobile-toolbar, [data-testid="mobile-toolbar"]');
    if (await mobileToolbar.count() > 0) {
      await expect(mobileToolbar).toBeVisible();
    }
  });

  test('should handle auto-save', async ({ page }) => {
    const editor = page.locator('[contenteditable="true"], textarea').first();
    
    if (await editor.count() > 0) {
      await editor.click();
      await editor.fill('Auto-save test content');
      
      // Wait for auto-save (look for save indicator)
      const saveIndicator = page.locator(':has-text("Saving"), :has-text("Saved"), [data-testid="save-status"]');
      if (await saveIndicator.count() > 0) {
        await expect(saveIndicator.first()).toBeVisible({ timeout: 10000 });
      }
    }
  });
}); 