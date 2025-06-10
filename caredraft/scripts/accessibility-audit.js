#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

console.log('🔍 Starting Comprehensive Accessibility Audit for CareDraft...\n');

class AccessibilityAuditor {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.successes = [];
    this.stats = {
      totalFiles: 0,
      componentsAnalyzed: 0,
      accessibilityFeatures: 0,
      criticalIssues: 0,
      warnings: 0,
      aScore: 0
    };
  }

  // Check semantic HTML usage
  checkSemanticHTML(content, filename) {
    const semanticElements = [
      'header', 'nav', 'main', 'section', 'article', 'aside', 'footer',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
    ];
    
    let semanticCount = 0;
    semanticElements.forEach(element => {
      const regex = new RegExp(`<${element}[^>]*>`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        semanticCount += matches.length;
      }
    });

    if (semanticCount > 0) {
      this.successes.push(`✅ ${filename}: ${semanticCount} semantic HTML elements found`);
      this.stats.accessibilityFeatures += semanticCount;
    }

    // Check for div soup (too many non-semantic divs)
    const divMatches = content.match(/<div[^>]*>/gi) || [];
    const semanticRatio = divMatches.length > 0 ? semanticCount / divMatches.length : 1;
    
    if (semanticRatio < 0.1 && divMatches.length > 10) {
      this.warnings.push(`⚠️  ${filename}: Low semantic HTML ratio (${Math.round(semanticRatio * 100)}%) - consider using more semantic elements`);
      this.stats.warnings++;
    }
  }

  // Check ARIA attributes and labels
  checkARIAAndLabels(content, filename) {
    const ariaAttributes = [
      'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-expanded',
      'aria-hidden', 'aria-live', 'aria-atomic', 'aria-relevant', 'aria-busy',
      'role', 'aria-checked', 'aria-selected', 'aria-pressed'
    ];

    let ariaCount = 0;
    ariaAttributes.forEach(attr => {
      const regex = new RegExp(`${attr}=`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        ariaCount += matches.length;
      }
    });

    if (ariaCount > 0) {
      this.successes.push(`✅ ${filename}: ${ariaCount} ARIA attributes found`);
      this.stats.accessibilityFeatures += ariaCount;
    }

    // Check for missing alt text on images
    const imgTags = content.match(/<img[^>]*>/gi) || [];
    const imagesWithoutAlt = imgTags.filter(img => !img.includes('alt='));
    
    if (imagesWithoutAlt.length > 0) {
      this.issues.push(`❌ ${filename}: ${imagesWithoutAlt.length} images missing alt text`);
      this.stats.criticalIssues++;
    }

    // Check for Next.js Image components without alt
    const nextImageRegex = /<Image[^>]*(?!.*alt=)/gi;
    const nextImagesWithoutAlt = content.match(nextImageRegex) || [];
    
    if (nextImagesWithoutAlt.length > 0) {
      this.issues.push(`❌ ${filename}: ${nextImagesWithoutAlt.length} Next.js Image components missing alt text`);
      this.stats.criticalIssues++;
    }
  }

  // Check form accessibility
  checkFormAccessibility(content, filename) {
    // Check for label associations
    const labelMatches = content.match(/<label[^>]*for=["']([^"']+)["'][^>]*>/gi) || [];
    const inputMatches = content.match(/<input[^>]*id=["']([^"']+)["'][^>]*>/gi) || [];
    
    if (labelMatches.length > 0) {
      this.successes.push(`✅ ${filename}: ${labelMatches.length} properly labeled form elements`);
      this.stats.accessibilityFeatures += labelMatches.length;
    }

    // Check for aria-label on inputs without visible labels
    const ariaLabeledInputs = content.match(/<input[^>]*aria-label=/gi) || [];
    if (ariaLabeledInputs.length > 0) {
      this.successes.push(`✅ ${filename}: ${ariaLabeledInputs.length} inputs with aria-label`);
      this.stats.accessibilityFeatures += ariaLabeledInputs.length;
    }

    // Check for placeholder-only inputs (accessibility issue)
    const placeholderOnlyInputs = content.match(/<input[^>]*placeholder=[^>]*(?!.*aria-label)(?!.*<label)/gi) || [];
    if (placeholderOnlyInputs.length > 0) {
      this.warnings.push(`⚠️  ${filename}: ${placeholderOnlyInputs.length} inputs rely only on placeholder text`);
      this.stats.warnings++;
    }
  }

  // Check keyboard navigation
  checkKeyboardNavigation(content, filename) {
    // Check for tabindex usage
    const tabindexMatches = content.match(/tabindex=/gi) || [];
    if (tabindexMatches.length > 0) {
      this.successes.push(`✅ ${filename}: ${tabindexMatches.length} elements with custom tab order`);
      this.stats.accessibilityFeatures += tabindexMatches.length;
    }

    // Check for negative tabindex (should be avoided)
    const negativeTabindex = content.match(/tabindex=["']-\d+["']/gi) || [];
    if (negativeTabindex.length > 0) {
      this.warnings.push(`⚠️  ${filename}: ${negativeTabindex.length} elements with negative tabindex`);
      this.stats.warnings++;
    }

    // Check for keyboard event handlers
    const keyboardEvents = content.match(/(onKeyDown|onKeyUp|onKeyPress)=/gi) || [];
    if (keyboardEvents.length > 0) {
      this.successes.push(`✅ ${filename}: ${keyboardEvents.length} keyboard event handlers`);
      this.stats.accessibilityFeatures += keyboardEvents.length;
    }
  }

  // Check focus management
  checkFocusManagement(content, filename) {
    // Check for focus-visible classes
    const focusVisibleClasses = content.match(/focus-visible:/gi) || [];
    if (focusVisibleClasses.length > 0) {
      this.successes.push(`✅ ${filename}: ${focusVisibleClasses.length} focus-visible styles`);
      this.stats.accessibilityFeatures += focusVisibleClasses.length;
    }

    // Check for focus: classes in general
    const focusClasses = content.match(/focus:/gi) || [];
    if (focusClasses.length > 0) {
      this.successes.push(`✅ ${filename}: ${focusClasses.length} focus styles`);
      this.stats.accessibilityFeatures += focusClasses.length;
    }

    // Check for outline-none without replacement
    const outlineNone = content.match(/outline-none/gi) || [];
    const customFocusStyles = content.match(/(ring-|border-.*focus|focus.*ring)/gi) || [];
    
    if (outlineNone.length > 0 && customFocusStyles.length === 0) {
      this.issues.push(`❌ ${filename}: ${outlineNone.length} elements with outline-none but no custom focus styles`);
      this.stats.criticalIssues++;
    }
  }

  // Check color contrast considerations
  checkColorContrast(content, filename) {
    // Check for color-only information indicators
    const colorPatterns = [
      /text-red-/gi, /text-green-/gi, /text-yellow-/gi, /text-blue-/gi,
      /bg-red-/gi, /bg-green-/gi, /bg-yellow-/gi, /bg-blue-/gi
    ];

    let colorOnlyElements = 0;
    colorPatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      colorOnlyElements += matches.length;
    });

    if (colorOnlyElements > 0) {
      // Check if there are also text indicators
      const textIndicators = content.match(/(error|success|warning|info|alert)/gi) || [];
      if (textIndicators.length === 0) {
        this.warnings.push(`⚠️  ${filename}: ${colorOnlyElements} color-coded elements may need text alternatives`);
        this.stats.warnings++;
      } else {
        this.successes.push(`✅ ${filename}: Color coding supplemented with text indicators`);
        this.stats.accessibilityFeatures++;
      }
    }
  }

  // Check responsive and mobile accessibility
  checkMobileAccessibility(content, filename) {
    // Check for responsive classes
    const responsiveClasses = content.match(/(sm:|md:|lg:|xl:)/gi) || [];
    if (responsiveClasses.length > 0) {
      this.successes.push(`✅ ${filename}: ${responsiveClasses.length} responsive design classes`);
      this.stats.accessibilityFeatures += Math.min(responsiveClasses.length, 10); // Cap contribution
    }

    // Check for touch-friendly sizes
    const touchClasses = content.match(/(p-\d+|px-\d+|py-\d+|w-\d+|h-\d+)/gi) || [];
    if (touchClasses.length > 0) {
      this.successes.push(`✅ ${filename}: Touch-friendly sizing classes detected`);
      this.stats.accessibilityFeatures++;
    }
  }

  // Analyze a single file
  analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const filename = path.basename(filePath);
    
    this.stats.totalFiles++;
    if (filePath.includes('/components/')) {
      this.stats.componentsAnalyzed++;
    }

    this.checkSemanticHTML(content, filename);
    this.checkARIAAndLabels(content, filename);
    this.checkFormAccessibility(content, filename);
    this.checkKeyboardNavigation(content, filename);
    this.checkFocusManagement(content, filename);
    this.checkColorContrast(content, filename);
    this.checkMobileAccessibility(content, filename);
  }

  // Calculate accessibility score
  calculateScore() {
    const totalChecks = this.stats.accessibilityFeatures + this.stats.criticalIssues + this.stats.warnings;
    if (totalChecks === 0) return 75; // Default score if no accessibility features detected

    const positiveScore = this.stats.accessibilityFeatures * 2;
    const negativeScore = (this.stats.criticalIssues * 10) + (this.stats.warnings * 3);
    
    const rawScore = Math.max(0, (positiveScore - negativeScore) / totalChecks * 100);
    return Math.min(100, Math.max(50, rawScore)); // Ensure score is between 50-100
  }

  // Generate comprehensive report
  generateReport() {
    this.stats.aScore = Math.round(this.calculateScore());

    console.log('🎯 ACCESSIBILITY AUDIT SUMMARY');
    console.log('==========================================\n');

    // Overall score and grade
    let grade = 'F';
    if (this.stats.aScore >= 95) grade = 'A+';
    else if (this.stats.aScore >= 90) grade = 'A';
    else if (this.stats.aScore >= 85) grade = 'B+';
    else if (this.stats.aScore >= 80) grade = 'B';
    else if (this.stats.aScore >= 75) grade = 'C+';
    else if (this.stats.aScore >= 70) grade = 'C';
    else if (this.stats.aScore >= 65) grade = 'D';

    console.log(`📊 ACCESSIBILITY SCORE: ${this.stats.aScore}% (Grade: ${grade})`);
    console.log(`📁 Files Analyzed: ${this.stats.totalFiles}`);
    console.log(`🧩 Components Analyzed: ${this.stats.componentsAnalyzed}`);
    console.log(`✨ Accessibility Features Found: ${this.stats.accessibilityFeatures}`);
    console.log(`❌ Critical Issues: ${this.stats.criticalIssues}`);
    console.log(`⚠️  Warnings: ${this.stats.warnings}\n`);

    // Critical issues
    if (this.issues.length > 0) {
      console.log('❌ CRITICAL ACCESSIBILITY ISSUES:');
      console.log('==========================================');
      this.issues.forEach(issue => console.log(issue));
      console.log('');
    }

    // Warnings
    if (this.warnings.length > 0) {
      console.log('⚠️  ACCESSIBILITY WARNINGS:');
      console.log('==========================================');
      this.warnings.slice(0, 10).forEach(warning => console.log(warning)); // Show top 10
      if (this.warnings.length > 10) {
        console.log(`... and ${this.warnings.length - 10} more warnings`);
      }
      console.log('');
    }

    // Successes (show top achievements)
    if (this.successes.length > 0) {
      console.log('✅ ACCESSIBILITY STRENGTHS:');
      console.log('==========================================');
      this.successes.slice(0, 15).forEach(success => console.log(success)); // Show top 15
      if (this.successes.length > 15) {
        console.log(`... and ${this.successes.length - 15} more accessibility features`);
      }
      console.log('');
    }

    // Recommendations
    console.log('💡 ACCESSIBILITY RECOMMENDATIONS:');
    console.log('==========================================');

    if (this.stats.aScore >= 90) {
      console.log('🌟 EXCELLENT (A-grade)');
      console.log('   Your application demonstrates excellent accessibility practices');
      console.log('   → Consider automated testing with tools like axe-core');
      console.log('   → Test with actual screen readers');
      console.log('   → Conduct user testing with people with disabilities');
    } else if (this.stats.aScore >= 80) {
      console.log('👍 GOOD (B-grade)');
      console.log('   Your application has good accessibility foundation');
      console.log('   → Address critical issues first');
      console.log('   → Improve ARIA labeling consistency');
      console.log('   → Test keyboard navigation thoroughly');
    } else if (this.stats.aScore >= 70) {
      console.log('📈 NEEDS IMPROVEMENT (C-grade)');
      console.log('   Your application needs accessibility improvements');
      console.log('   → Focus on critical issues immediately');
      console.log('   → Add missing alt text for images');
      console.log('   → Improve form labeling');
      console.log('   → Add proper focus management');
    } else {
      console.log('🚨 REQUIRES IMMEDIATE ATTENTION (D/F-grade)');
      console.log('   Your application has significant accessibility barriers');
      console.log('   → Address all critical issues immediately');
      console.log('   → Implement basic ARIA labeling');
      console.log('   → Add semantic HTML structure');
      console.log('   → Ensure keyboard navigation works');
    }

    console.log('\n✨ ACCESSIBILITY AUDIT COMPLETE!');
    console.log(`📄 Detailed findings: ${this.issues.length + this.warnings.length + this.successes.length} total items\n`);

    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      score: this.stats.aScore,
      grade: grade,
      stats: this.stats,
      issues: this.issues,
      warnings: this.warnings,
      successes: this.successes
    };

    fs.writeFileSync('accessibility-audit-report.json', JSON.stringify(reportData, null, 2));
    console.log('📄 Detailed report saved to: accessibility-audit-report.json\n');
  }
}

// Run the audit
async function runAccessibilityAudit() {
  const auditor = new AccessibilityAuditor();

  try {
    // Find all relevant files
    const patterns = [
      'app/**/*.{tsx,jsx,ts,js}',
      'components/**/*.{tsx,jsx,ts,js}',
      'pages/**/*.{tsx,jsx,ts,js}' // In case of pages directory
    ];

    let allFiles = [];
    for (const pattern of patterns) {
      const files = await glob(pattern, { ignore: ['node_modules/**', '.next/**'] });
      allFiles = allFiles.concat(files);
    }

    // Remove duplicates
    allFiles = [...new Set(allFiles)];

    console.log(`📄 Found ${allFiles.length} files to analyze\n`);

    // Analyze each file
    allFiles.forEach(file => {
      try {
        auditor.analyzeFile(file);
      } catch (error) {
        console.log(`⚠️  Error analyzing ${file}: ${error.message}`);
      }
    });

    // Generate report
    auditor.generateReport();

  } catch (error) {
    console.error('Error during accessibility audit:', error.message);
    process.exit(1);
  }
}

// Run the audit
runAccessibilityAudit(); 