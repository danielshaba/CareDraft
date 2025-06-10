#!/usr/bin/env node

/**
 * Fix Remaining Blue Colors Script for CareDraft
 * Automatically replaces deprecated blue color classes with brand colors
 */

const fs = require('fs');
const path = require('path');

const replacements = [
  // Focus ring colors
  { from: 'focus:ring-blue-500', to: 'focus:ring-brand-500' },
  { from: 'focus:border-blue-500', to: 'focus:border-brand-500' },
  { from: 'peer-focus:ring-blue-300', to: 'peer-focus:ring-brand-500/30' },
  { from: 'peer-checked:bg-blue-600', to: 'peer-checked:bg-brand-600' },
  
  // Gradient colors
  { from: 'to-blue-50', to: 'to-brand-50' },
  { from: 'to-blue-500', to: 'to-brand-500' },
  { from: 'to-blue-600', to: 'to-brand-600' },
  { from: 'from-blue-50', to: 'from-brand-50' },
  { from: 'from-blue-500', to: 'from-brand-500' },
  { from: 'from-blue-600', to: 'from-brand-600' },
  
  // Hover states for gradients
  { from: 'hover:to-blue-100', to: 'hover:to-brand-100' },
  { from: 'hover:to-blue-700', to: 'hover:to-brand-600' },
  { from: 'hover:from-blue-700', to: 'hover:from-brand-600' },
];

const filesToFix = [
  'components/user-management/InviteUserModal.tsx',
  'app/(auth)/onboarding/first-tender/page.tsx',
  'components/shared/ExtractionResultsPanel.tsx',
  'app/(dashboard)/tender/new/page.tsx',
  'components/brainstorm/GenerateButton.tsx',
  'app/(dashboard)/tender/[tenderId]/layout.tsx',
  'app/(dashboard)/tender/[tenderId]/summary/page.tsx',
];

function fixColorsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    replacements.forEach(({ from, to }) => {
      if (content.includes(from)) {
        content = content.replaceAll(from, to);
        modified = true;
        console.log(`  ✅ Replaced '${from}' with '${to}'`);
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`📁 Updated: ${filePath}`);
    } else {
      console.log(`📁 No changes needed: ${filePath}`);
    }
    
    return modified;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🚀 Fixing remaining blue color classes...\n');
  
  let totalFixed = 0;
  
  filesToFix.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`\n📝 Processing: ${file}`);
      if (fixColorsInFile(filePath)) {
        totalFixed++;
      }
    } else {
      console.log(`⚠️  File not found: ${file}`);
    }
  });
  
  console.log(`\n✨ Complete! Fixed colors in ${totalFixed} files.`);
  
  // Run CSS analysis again to verify
  console.log('\n🔍 Running CSS analysis to verify fixes...');
  try {
    require('./analyze-css.js');
  } catch (error) {
    console.log('ℹ️  Run "node scripts/analyze-css.js" to verify the fixes');
  }
}

if (require.main === module) {
  main();
} 