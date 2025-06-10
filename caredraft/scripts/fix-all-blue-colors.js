#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

console.log('🔧 Fixing All Deprecated Blue Colors in CareDraft...\n');

// Comprehensive blue color mapping to brand colors
const colorMappings = {
  // Background colors
  'bg-blue-50': 'bg-brand-50',
  'bg-blue-100': 'bg-brand-100', 
  'bg-blue-200': 'bg-brand-200',
  'bg-blue-300': 'bg-brand-300',
  'bg-blue-400': 'bg-brand-400',
  'bg-blue-500': 'bg-brand-500',
  'bg-blue-600': 'bg-brand-600',
  'bg-blue-700': 'bg-brand-700',
  'bg-blue-800': 'bg-brand-800',
  'bg-blue-900': 'bg-brand-900',
  
  // Text colors
  'text-blue-50': 'text-brand-50',
  'text-blue-100': 'text-brand-100',
  'text-blue-200': 'text-brand-200',
  'text-blue-300': 'text-brand-300',
  'text-blue-400': 'text-brand-400',
  'text-blue-500': 'text-brand-500',
  'text-blue-600': 'text-brand-600',
  'text-blue-700': 'text-brand-700',
  'text-blue-800': 'text-brand-800',
  'text-blue-900': 'text-brand-900',
  
  // Border colors
  'border-blue-50': 'border-brand-50',
  'border-blue-100': 'border-brand-100',
  'border-blue-200': 'border-brand-200',
  'border-blue-300': 'border-brand-300',
  'border-blue-400': 'border-brand-400',
  'border-blue-500': 'border-brand-500',
  'border-blue-600': 'border-brand-600',
  'border-blue-700': 'border-brand-700',
  'border-blue-800': 'border-brand-800',
  'border-blue-900': 'border-brand-900',
  
  // Hover states
  'hover:bg-blue-50': 'hover:bg-brand-50',
  'hover:bg-blue-100': 'hover:bg-brand-100',
  'hover:bg-blue-200': 'hover:bg-brand-200',
  'hover:bg-blue-300': 'hover:bg-brand-300',
  'hover:bg-blue-400': 'hover:bg-brand-400',
  'hover:bg-blue-500': 'hover:bg-brand-500',
  'hover:bg-blue-600': 'hover:bg-brand-600',
  'hover:bg-blue-700': 'hover:bg-brand-700',
  'hover:bg-blue-800': 'hover:bg-brand-800',
  'hover:bg-blue-900': 'hover:bg-brand-900',
  
  'hover:text-blue-50': 'hover:text-brand-50',
  'hover:text-blue-100': 'hover:text-brand-100',
  'hover:text-blue-200': 'hover:text-brand-200',
  'hover:text-blue-300': 'hover:text-brand-300',
  'hover:text-blue-400': 'hover:text-brand-400',
  'hover:text-blue-500': 'hover:text-brand-500',
  'hover:text-blue-600': 'hover:text-brand-600',
  'hover:text-blue-700': 'hover:text-brand-700',
  'hover:text-blue-800': 'hover:text-brand-800',
  'hover:text-blue-900': 'hover:text-brand-900',
  
  'hover:border-blue-50': 'hover:border-brand-50',
  'hover:border-blue-100': 'hover:border-brand-100',
  'hover:border-blue-200': 'hover:border-brand-200',
  'hover:border-blue-300': 'hover:border-brand-300',
  'hover:border-blue-400': 'hover:border-brand-400',
  'hover:border-blue-500': 'hover:border-brand-500',
  'hover:border-blue-600': 'hover:border-brand-600',
  'hover:border-blue-700': 'hover:border-brand-700',
  'hover:border-blue-800': 'hover:border-brand-800',
  'hover:border-blue-900': 'hover:border-brand-900',
  
  // Focus states
  'focus:bg-blue-50': 'focus:bg-brand-50',
  'focus:bg-blue-100': 'focus:bg-brand-100',
  'focus:bg-blue-200': 'focus:bg-brand-200',
  'focus:bg-blue-300': 'focus:bg-brand-300',
  'focus:bg-blue-400': 'focus:bg-brand-400',
  'focus:bg-blue-500': 'focus:bg-brand-500',
  'focus:bg-blue-600': 'focus:bg-brand-600',
  'focus:bg-blue-700': 'focus:bg-brand-700',
  'focus:bg-blue-800': 'focus:bg-brand-800',
  'focus:bg-blue-900': 'focus:bg-brand-900',
  
  'focus:text-blue-50': 'focus:text-brand-50',
  'focus:text-blue-100': 'focus:text-brand-100',
  'focus:text-blue-200': 'focus:text-brand-200',
  'focus:text-blue-300': 'focus:text-brand-300',
  'focus:text-blue-400': 'focus:text-brand-400',
  'focus:text-blue-500': 'focus:text-brand-500',
  'focus:text-blue-600': 'focus:text-brand-600',
  'focus:text-blue-700': 'focus:text-brand-700',
  'focus:text-blue-800': 'focus:text-brand-800',
  'focus:text-blue-900': 'focus:text-brand-900',
  
  'focus:border-blue-50': 'focus:border-brand-50',
  'focus:border-blue-100': 'focus:border-brand-100',
  'focus:border-blue-200': 'focus:border-brand-200',
  'focus:border-blue-300': 'focus:border-brand-300',
  'focus:border-blue-400': 'focus:border-brand-400',
  'focus:border-blue-500': 'focus:border-brand-500',
  'focus:border-blue-600': 'focus:border-brand-600',
  'focus:border-blue-700': 'focus:border-brand-700',
  'focus:border-blue-800': 'focus:border-brand-800',
  'focus:border-blue-900': 'focus:border-brand-900',
  
  // Ring colors
  'ring-blue-50': 'ring-brand-50',
  'ring-blue-100': 'ring-brand-100',
  'ring-blue-200': 'ring-brand-200',
  'ring-blue-300': 'ring-brand-300',
  'ring-blue-400': 'ring-brand-400',
  'ring-blue-500': 'ring-brand-500',
  'ring-blue-600': 'ring-brand-600',
  'ring-blue-700': 'ring-brand-700',
  'ring-blue-800': 'ring-brand-800',
  'ring-blue-900': 'ring-brand-900',
  
  // Focus ring colors
  'focus:ring-blue-50': 'focus:ring-brand-50',
  'focus:ring-blue-100': 'focus:ring-brand-100',
  'focus:ring-blue-200': 'focus:ring-brand-200',
  'focus:ring-blue-300': 'focus:ring-brand-300',
  'focus:ring-blue-400': 'focus:ring-brand-400',
  'focus:ring-blue-500': 'focus:ring-brand-500',
  'focus:ring-blue-600': 'focus:ring-brand-600',
  'focus:ring-blue-700': 'focus:ring-brand-700',
  'focus:ring-blue-800': 'focus:ring-brand-800',
  'focus:ring-blue-900': 'focus:ring-brand-900',
  
  // Gradient colors
  'from-blue-50': 'from-brand-50',
  'from-blue-100': 'from-brand-100',
  'from-blue-200': 'from-brand-200',
  'from-blue-300': 'from-brand-300',
  'from-blue-400': 'from-brand-400',
  'from-blue-500': 'from-brand-500',
  'from-blue-600': 'from-brand-600',
  'from-blue-700': 'from-brand-700',
  'from-blue-800': 'from-brand-800',
  'from-blue-900': 'from-brand-900',
  
  'to-blue-50': 'to-brand-50',
  'to-blue-100': 'to-brand-100',
  'to-blue-200': 'to-brand-200',
  'to-blue-300': 'to-brand-300',
  'to-blue-400': 'to-brand-400',
  'to-blue-500': 'to-brand-500',
  'to-blue-600': 'to-brand-600',
  'to-blue-700': 'to-brand-700',
  'to-blue-800': 'to-brand-800',
  'to-blue-900': 'to-brand-900',
  
  'via-blue-50': 'via-brand-50',
  'via-blue-100': 'via-brand-100',
  'via-blue-200': 'via-brand-200',
  'via-blue-300': 'via-brand-300',
  'via-blue-400': 'via-brand-400',
  'via-blue-500': 'via-brand-500',
  'via-blue-600': 'via-brand-600',
  'via-blue-700': 'via-brand-700',
  'via-blue-800': 'via-brand-800',
  'via-blue-900': 'via-brand-900',
};

async function fixBlueColors() {
  try {
    // Get all relevant files
    const files = await glob('**/*.{tsx,jsx,ts,js,css}', {
      ignore: ['node_modules/**', '.next/**', 'scripts/**', 'final-qa-report.json', 'accessibility-audit-report.json']
    });

    let totalReplacements = 0;
    let filesModified = 0;

    console.log(`📁 Found ${files.length} files to process...\n`);

    for (const file of files) {
      let content = fs.readFileSync(file, 'utf8');
      let originalContent = content;
      let fileReplacements = 0;

      // Apply all color mappings
      for (const [oldColor, newColor] of Object.entries(colorMappings)) {
        const regex = new RegExp(oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const matches = content.match(regex);
        if (matches) {
          content = content.replace(regex, newColor);
          fileReplacements += matches.length;
        }
      }

      // Special cases for border-t, border-b, etc.
      const borderVariants = [
        'border-t-blue-', 'border-b-blue-', 'border-l-blue-', 'border-r-blue-',
        'border-x-blue-', 'border-y-blue-'
      ];
      
      for (const variant of borderVariants) {
        for (let i = 50; i <= 900; i += 50) {
          if (i === 150 || i === 250 || i === 350 || i === 450 || i === 550 || i === 650 || i === 750 || i === 850) continue;
          const oldColor = `${variant}${i}`;
          const newColor = oldColor.replace('blue', 'brand');
          const regex = new RegExp(oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
          const matches = content.match(regex);
          if (matches) {
            content = content.replace(regex, newColor);
            fileReplacements += matches.length;
          }
        }
      }

      // Save file if modified
      if (content !== originalContent) {
        fs.writeFileSync(file, content);
        filesModified++;
        totalReplacements += fileReplacements;
        console.log(`✅ ${file}: ${fileReplacements} replacements`);
      }
    }

    console.log(`\n🎉 Blue Color Fix Complete!`);
    console.log(`📁 Files modified: ${filesModified}`);
    console.log(`🔄 Total replacements: ${totalReplacements}`);
    
    if (totalReplacements === 0) {
      console.log(`✨ No deprecated blue colors found - all good!`);
    }

  } catch (error) {
    console.error('❌ Error fixing blue colors:', error.message);
    process.exit(1);
  }
}

fixBlueColors(); 