#!/usr/bin/env node

/**
 * CareDraft Accessibility Testing Script
 * Verifies WCAG AA compliance for brand color implementation
 */

const fs = require('fs');
const path = require('path');

// Brand color palette for testing (Accessibility Improved)
const BRAND_COLORS = {
  primary: '#2A6F6F',      // Darkened for WCAG AA compliance
  primaryDark: '#1F4949',  // Even darker for emphasis
  primaryLight: '#EAF7F7',
  neutralDark: '#333333',
  neutralLight: '#F5F5F5',
  white: '#FFFFFF',
  black: '#000000'
};

// WCAG color contrast calculation
function getLuminance(hex) {
  const rgb = hexToRgb(hex);
  const [r, g, b] = rgb.map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null;
}

function getContrastRatio(color1, color2) {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

function checkWCAGCompliance(foreground, background) {
  const ratio = getContrastRatio(foreground, background);
  return {
    ratio: ratio.toFixed(2),
    AA_normal: ratio >= 4.5, // WCAG AA for normal text
    AA_large: ratio >= 3.0,  // WCAG AA for large text
    AAA_normal: ratio >= 7.0, // WCAG AAA for normal text
    AAA_large: ratio >= 4.5   // WCAG AAA for large text
  };
}

// Comprehensive color contrast testing
function testColorContrasts() {
  console.log('🎨 CareDraft Brand Color Accessibility Testing\n');
  console.log('='.repeat(60));
  
  const testCombinations = [
    // Primary brand on white backgrounds
    { name: 'Primary Teal on White', fg: BRAND_COLORS.primary, bg: BRAND_COLORS.white },
    { name: 'Primary Dark on White', fg: BRAND_COLORS.primaryDark, bg: BRAND_COLORS.white },
    { name: 'Neutral Dark on White', fg: BRAND_COLORS.neutralDark, bg: BRAND_COLORS.white },
    
    // Text on brand backgrounds
    { name: 'White on Primary Teal', fg: BRAND_COLORS.white, bg: BRAND_COLORS.primary },
    { name: 'White on Primary Dark', fg: BRAND_COLORS.white, bg: BRAND_COLORS.primaryDark },
    { name: 'Black on Primary Light', fg: BRAND_COLORS.black, bg: BRAND_COLORS.primaryLight },
    { name: 'Neutral Dark on Primary Light', fg: BRAND_COLORS.neutralDark, bg: BRAND_COLORS.primaryLight },
    
    // Neutral combinations
    { name: 'Neutral Dark on Neutral Light', fg: BRAND_COLORS.neutralDark, bg: BRAND_COLORS.neutralLight },
    { name: 'White on Neutral Dark', fg: BRAND_COLORS.white, bg: BRAND_COLORS.neutralDark },
    
    // Critical UI combinations
    { name: 'Primary on Neutral Light', fg: BRAND_COLORS.primary, bg: BRAND_COLORS.neutralLight },
    { name: 'Primary Dark on Neutral Light', fg: BRAND_COLORS.primaryDark, bg: BRAND_COLORS.neutralLight }
  ];
  
  let passCount = 0;
  let totalTests = testCombinations.length;
  
  testCombinations.forEach((test, index) => {
    const result = checkWCAGCompliance(test.fg, test.bg);
    const status = result.AA_normal ? '✅ PASS' : '❌ FAIL';
    const level = result.AAA_normal ? 'AAA' : (result.AA_normal ? 'AA' : 'BELOW AA');
    
    console.log(`\n${index + 1}. ${test.name}`);
    console.log(`   Foreground: ${test.fg} | Background: ${test.bg}`);
    console.log(`   Contrast Ratio: ${result.ratio}:1`);
    console.log(`   WCAG Level: ${level} | Status: ${status}`);
    console.log(`   Normal Text: AA ${result.AA_normal ? '✅' : '❌'} | AAA ${result.AAA_normal ? '✅' : '❌'}`);
    console.log(`   Large Text:  AA ${result.AA_large ? '✅' : '❌'} | AAA ${result.AAA_large ? '✅' : '❌'}`);
    
    if (result.AA_normal) passCount++;
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 ACCESSIBILITY SUMMARY:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed WCAG AA: ${passCount}/${totalTests} (${Math.round(passCount/totalTests*100)}%)`);
  
  if (passCount === totalTests) {
    console.log(`   🎉 ALL TESTS PASSED! Colors meet WCAG AA standards.`);
  } else {
    console.log(`   ⚠️  ${totalTests - passCount} test(s) failed. Review color combinations.`);
  }
  
  return { passed: passCount, total: totalTests };
}

// Check for hardcoded color values in components
function scanForHardcodedColors(dir = './') {
  console.log('\n🔍 Scanning for hardcoded color values...\n');
  
  const colorPatterns = [
    /#[a-fA-F0-9]{6}/g,  // Hex colors
    /#[a-fA-F0-9]{3}/g,   // Short hex colors
    /rgb\([^)]+\)/g,      // RGB colors
    /rgba\([^)]+\)/g,     // RGBA colors
    /hsl\([^)]+\)/g,      // HSL colors
    /hsla\([^)]+\)/g      // HSLA colors
  ];
  
  const excludePatterns = [
    /\.git/,
    /node_modules/,
    /\.next/,
    /dist/,
    /build/,
    /coverage/,
    /\.md$/,
    /\.json$/,
    /\.lock$/,
    /package-lock\.json$/,
    /yarn\.lock$/,
    /tailwind\.config/,
    /globals\.css$/
  ];
  
  const findings = [];
  
  function scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, lineNum) => {
        colorPatterns.forEach(pattern => {
          const matches = line.match(pattern);
          if (matches) {
            matches.forEach(match => {
              // Skip common safe patterns
              if (match === '#000000' || match === '#ffffff' || match === '#000' || match === '#fff') return;
              if (match.includes('var(')) return; // CSS variables
              
              findings.push({
                file: filePath,
                line: lineNum + 1,
                color: match,
                context: line.trim()
              });
            });
          }
        });
      });
    } catch (error) {
      // Ignore file read errors
    }
  }
  
  function scanDirectory(dirPath) {
    try {
      const entries = fs.readdirSync(dirPath);
      
      entries.forEach(entry => {
        const fullPath = path.join(dirPath, entry);
        const stat = fs.statSync(fullPath);
        
        // Skip excluded paths
        if (excludePatterns.some(pattern => pattern.test(fullPath))) {
          return;
        }
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (stat.isFile() && /\.(tsx?|jsx?|css|scss)$/.test(entry)) {
          scanFile(fullPath);
        }
      });
    } catch (error) {
      // Ignore directory read errors
    }
  }
  
  scanDirectory(dir);
  
  if (findings.length === 0) {
    console.log('✅ No hardcoded colors found! All colors use Tailwind classes or CSS variables.');
  } else {
    console.log(`⚠️  Found ${findings.length} hardcoded color value(s):`);
    findings.forEach((finding, index) => {
      console.log(`\n${index + 1}. ${finding.file}:${finding.line}`);
      console.log(`   Color: ${finding.color}`);
      console.log(`   Context: ${finding.context}`);
    });
  }
  
  return findings;
}

// Generate color usage guide
function generateColorGuide() {
  console.log('\n📖 CareDraft Brand Color Usage Guide\n');
  console.log('='.repeat(60));
  
  const guide = {
    'Primary Brand Color': {
      color: BRAND_COLORS.primary,
      tailwind: 'bg-brand-primary, text-brand-primary',
      usage: 'Primary buttons, links, brand elements, call-to-action'
    },
    'Primary Dark (Accent)': {
      color: BRAND_COLORS.primaryDark,
      tailwind: 'bg-brand-primary-dark, text-brand-primary-dark',
      usage: 'Hover states, emphasis, secondary actions'
    },
    'Primary Light (Background)': {
      color: BRAND_COLORS.primaryLight,
      tailwind: 'bg-brand-primary-light',
      usage: 'Subtle backgrounds, card backgrounds, section highlights'
    },
    'Neutral Dark (High Contrast)': {
      color: BRAND_COLORS.neutralDark,
      tailwind: 'text-neutral-dark, bg-neutral-dark',
      usage: 'Body text, high-contrast elements'
    },
    'Neutral Light (Subtle)': {
      color: BRAND_COLORS.neutralLight,
      tailwind: 'bg-neutral-light, border-neutral-light',
      usage: 'Subtle borders, page backgrounds, dividers'
    }
  };
  
  Object.entries(guide).forEach(([name, info]) => {
    console.log(`${name}:`);
    console.log(`  Color: ${info.color}`);
    console.log(`  Tailwind: ${info.tailwind}`);
    console.log(`  Usage: ${info.usage}`);
    console.log('');
  });
  
  console.log('Best Practices:');
  console.log('• Use brand-primary for primary actions and brand elements');
  console.log('• Use brand-primary-dark for hover states and emphasis');
  console.log('• Use brand-primary-light for subtle backgrounds');
  console.log('• Ensure 4.5:1 contrast ratio for normal text');
  console.log('• Ensure 3:1 contrast ratio for large text (18px+ or 14px+ bold)');
  console.log('• Test with screen readers and keyboard navigation');
  console.log('• Verify colors work in both light and dark themes');
}

// Main execution
function main() {
  console.log('🚀 Starting CareDraft Accessibility Testing...\n');
  
  // Test color contrasts
  const contrastResults = testColorContrasts();
  
  // Scan for hardcoded colors
  const hardcodedColors = scanForHardcodedColors('./components');
  
  // Generate usage guide
  generateColorGuide();
  
  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('🏁 ACCESSIBILITY TESTING COMPLETE\n');
  
  const allPassed = contrastResults.passed === contrastResults.total && hardcodedColors.length === 0;
  
  if (allPassed) {
    console.log('🎉 SUCCESS: All accessibility tests passed!');
    console.log('✅ Color contrasts meet WCAG AA standards');
    console.log('✅ No hardcoded colors found');
    console.log('✅ Brand colors properly implemented');
  } else {
    console.log('⚠️  Issues found:');
    if (contrastResults.passed < contrastResults.total) {
      console.log(`❌ ${contrastResults.total - contrastResults.passed} color contrast tests failed`);
    }
    if (hardcodedColors.length > 0) {
      console.log(`❌ ${hardcodedColors.length} hardcoded colors found`);
    }
  }
  
  console.log('\nRecommendations:');
  console.log('• Run manual screen reader testing');
  console.log('• Test keyboard navigation throughout the app');
  console.log('• Verify colors in different browsers and devices');
  console.log('• Test with users who have color vision deficiencies');
  
  return allPassed;
}

// Run the tests
if (require.main === module) {
  main();
}

module.exports = { testColorContrasts, scanForHardcodedColors, generateColorGuide, main }; 