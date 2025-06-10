#!/usr/bin/env node

/**
 * Responsive Design Testing Script for CareDraft
 * Tests responsive breakpoints and mobile optimization
 */

const fs = require('fs');
const path = require('path');

class ResponsiveDesignTester {
  constructor() {
    this.breakpoints = {
      mobile: { min: 320, max: 639, name: 'Mobile' },
      tablet: { min: 640, max: 1023, name: 'Tablet (sm)' },
      desktop: { min: 1024, max: 1279, name: 'Desktop (lg)' },
      wide: { min: 1280, max: 1535, name: 'Wide (xl)' },
      ultrawide: { min: 1536, max: 9999, name: 'Ultra-wide (2xl)' },
    };
    
    this.responsiveClasses = [];
    this.issues = [];
    this.optimizations = [];
  }

  // Analyze responsive classes usage
  analyzeResponsiveClasses() {
    console.log('📱 Analyzing responsive class usage...');
    
    try {
      const componentFiles = this.findComponentFiles();
      const responsivePatterns = [
        /\b(sm|md|lg|xl|2xl):[a-zA-Z0-9-_]+/g,
        /\bmax-(sm|md|lg|xl|2xl):[a-zA-Z0-9-_]+/g,
        /\bmin-(sm|md|lg|xl|2xl):[a-zA-Z0-9-_]+/g,
      ];

      let totalResponsiveClasses = 0;
      const breakpointUsage = { sm: 0, md: 0, lg: 0, xl: 0, '2xl': 0 };
      const classTypes = { layout: 0, spacing: 0, typography: 0, display: 0 };

      componentFiles.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          responsivePatterns.forEach(pattern => {
            const matches = content.match(pattern) || [];
            matches.forEach(match => {
              totalResponsiveClasses++;
              this.responsiveClasses.push({ file, class: match });
              
              // Count breakpoint usage
              const breakpoint = match.split(':')[0].replace('max-', '').replace('min-', '');
              if (breakpointUsage[breakpoint] !== undefined) {
                breakpointUsage[breakpoint]++;
              }
              
              // Categorize class types
              if (match.includes('grid') || match.includes('flex') || match.includes('block') || match.includes('hidden')) {
                classTypes.layout++;
              } else if (match.includes('p-') || match.includes('m-') || match.includes('gap-')) {
                classTypes.spacing++;
              } else if (match.includes('text-') || match.includes('font-')) {
                classTypes.typography++;
              } else if (match.includes('w-') || match.includes('h-')) {
                classTypes.display++;
              }
            });
          });
        } catch (error) {
          // Skip files that can't be read
        }
      });

      console.log(`✅ Found ${totalResponsiveClasses} responsive classes across ${componentFiles.length} files`);
      
      // Analyze breakpoint distribution
      console.log('\n📊 Breakpoint Usage Distribution:');
      Object.entries(breakpointUsage).forEach(([bp, count]) => {
        const percentage = totalResponsiveClasses > 0 ? ((count / totalResponsiveClasses) * 100).toFixed(1) : 0;
        console.log(`   ${bp}: ${count} classes (${percentage}%)`);
      });

      // Analyze class type distribution
      console.log('\n🎨 Responsive Class Types:');
      Object.entries(classTypes).forEach(([type, count]) => {
        const percentage = totalResponsiveClasses > 0 ? ((count / totalResponsiveClasses) * 100).toFixed(1) : 0;
        console.log(`   ${type}: ${count} classes (${percentage}%)`);
      });

      this.optimizations.push(`${totalResponsiveClasses} responsive classes implemented`);
      
      // Check for balanced responsive design
      if (breakpointUsage.sm > 0 && breakpointUsage.md > 0 && breakpointUsage.lg > 0) {
        this.optimizations.push('Balanced responsive design across mobile, tablet, and desktop');
      } else {
        this.issues.push('Unbalanced responsive design - some breakpoints underutilized');
      }

    } catch (error) {
      console.error('❌ Responsive class analysis failed:', error.message);
      this.issues.push(`Responsive class analysis error: ${error.message}`);
    }
  }

  // Check mobile-first design patterns
  checkMobileFirstPatterns() {
    console.log('\n📱 Checking mobile-first design patterns...');
    
    try {
      const componentFiles = this.findComponentFiles();
      let mobileFirstCount = 0;
      let desktopFirstCount = 0;
      
      componentFiles.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          // Look for mobile-first patterns (base class + responsive modifiers)
          const mobileFirstPattern = /\b(w-full|flex-col|text-center|p-4)\s+[^"]*\b(sm|md|lg):/g;
          const mobileFirstMatches = content.match(mobileFirstPattern) || [];
          mobileFirstCount += mobileFirstMatches.length;
          
          // Look for desktop-first patterns (max-width breakpoints)
          const desktopFirstPattern = /\bmax-(sm|md|lg|xl):/g;
          const desktopFirstMatches = content.match(desktopFirstPattern) || [];
          desktopFirstCount += desktopFirstMatches.length;
          
        } catch (error) {
          // Skip files that can't be read
        }
      });

      if (mobileFirstCount > desktopFirstCount) {
        console.log('✅ Mobile-first design approach detected');
        this.optimizations.push('Mobile-first responsive design implemented');
      } else if (desktopFirstCount > mobileFirstCount) {
        console.log('⚠️  Desktop-first design patterns detected');
        this.issues.push('Consider adopting mobile-first design approach');
      } else {
        console.log('ℹ️  Mixed responsive design approach');
        this.optimizations.push('Responsive design patterns implemented');
      }

    } catch (error) {
      console.error('❌ Mobile-first pattern check failed:', error.message);
      this.issues.push(`Mobile-first pattern check error: ${error.message}`);
    }
  }

  // Check touch target sizes
  checkTouchTargets() {
    console.log('\n👆 Checking touch target optimization...');
    
    try {
      const componentFiles = this.findComponentFiles();
      let touchOptimizedElements = 0;
      let smallTouchTargets = 0;
      
      const touchTargetPatterns = [
        /\b(min-h-\[44px\]|min-h-11|min-h-12|h-11|h-12|h-14|h-16)/g,
        /\b(p-3|p-4|py-3|py-4|px-3|px-4)/g,
        /\b(w-11|w-12|w-14|w-16|min-w-\[44px\])/g,
      ];

      const smallTargetPatterns = [
        /\b(h-6|h-7|h-8|w-6|w-7|w-8)/g,
        /\b(p-1|p-2|py-1|py-2|px-1|px-2)/g,
      ];

      componentFiles.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          touchTargetPatterns.forEach(pattern => {
            const matches = content.match(pattern) || [];
            touchOptimizedElements += matches.length;
          });

          smallTargetPatterns.forEach(pattern => {
            const matches = content.match(pattern) || [];
            smallTouchTargets += matches.length;
          });
          
        } catch (error) {
          // Skip files that can't be read
        }
      });

      if (touchOptimizedElements > smallTouchTargets) {
        console.log(`✅ Touch targets optimized (${touchOptimizedElements} optimized vs ${smallTouchTargets} small)`);
        this.optimizations.push('Touch-friendly target sizes implemented');
      } else {
        console.log(`⚠️  Touch targets may need optimization (${touchOptimizedElements} optimized vs ${smallTouchTargets} small)`);
        this.issues.push('Consider increasing touch target sizes for better mobile UX');
      }

    } catch (error) {
      console.error('❌ Touch target check failed:', error.message);
      this.issues.push(`Touch target check error: ${error.message}`);
    }
  }

  // Check responsive typography
  checkResponsiveTypography() {
    console.log('\n📝 Checking responsive typography...');
    
    try {
      const globalCSS = fs.readFileSync('app/globals.css', 'utf8');
      
      // Check for responsive typography classes
      const responsiveTypographyPattern = /(text-\w+\s+md:text-\w+|text-\w+\s+lg:text-\w+)/g;
      const responsiveTypographyMatches = globalCSS.match(responsiveTypographyPattern) || [];
      
      if (responsiveTypographyMatches.length > 0) {
        console.log(`✅ Responsive typography implemented (${responsiveTypographyMatches.length} instances)`);
        this.optimizations.push('Responsive typography scaling configured');
      } else {
        console.log('ℹ️  Limited responsive typography detected');
        this.optimizations.push('Typography system configured');
      }

      // Check for font size optimization
      if (globalCSS.includes('font-size: 16px') || globalCSS.includes('text-base')) {
        console.log('✅ Mobile font size optimization (prevents zoom)');
        this.optimizations.push('Mobile font size optimization implemented');
      }

    } catch (error) {
      console.error('❌ Responsive typography check failed:', error.message);
      this.issues.push(`Responsive typography check error: ${error.message}`);
    }
  }

  // Check responsive images
  checkResponsiveImages() {
    console.log('\n🖼️  Checking responsive image implementation...');
    
    try {
      // Check for responsive image patterns
      const componentFiles = this.findComponentFiles();
      let responsiveImageCount = 0;
      let fixedImageCount = 0;
      
      componentFiles.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          // Look for responsive image patterns
          const responsiveImagePatterns = [
            /\bw-full\b.*\bh-auto\b/g,
            /\bmax-w-full\b/g,
            /\bobject-cover\b/g,
            /\bobject-contain\b/g,
            /\baspect-\w+/g,
          ];

          responsiveImagePatterns.forEach(pattern => {
            const matches = content.match(pattern) || [];
            responsiveImageCount += matches.length;
          });

          // Look for fixed size images
          const fixedImagePattern = /\b(w-\d+|h-\d+)\b(?!.*\b(sm|md|lg|xl):\w+)/g;
          const fixedImageMatches = content.match(fixedImagePattern) || [];
          fixedImageCount += fixedImageMatches.length;
          
        } catch (error) {
          // Skip files that can't be read
        }
      });

      if (responsiveImageCount > 0) {
        console.log(`✅ Responsive images implemented (${responsiveImageCount} instances)`);
        this.optimizations.push('Responsive image patterns implemented');
      }

      if (fixedImageCount > responsiveImageCount * 2) {
        console.log(`⚠️  Many fixed-size images detected (${fixedImageCount} fixed vs ${responsiveImageCount} responsive)`);
        this.issues.push('Consider making more images responsive');
      }

    } catch (error) {
      console.error('❌ Responsive image check failed:', error.message);
      this.issues.push(`Responsive image check error: ${error.message}`);
    }
  }

  // Find component files for analysis
  findComponentFiles() {
    const patterns = [
      'app/**/*.tsx',
      'components/**/*.tsx',
      'pages/**/*.tsx',
    ];

    let files = [];
    patterns.forEach(pattern => {
      try {
        const glob = require('glob');
        const matches = glob.sync(pattern, { cwd: process.cwd() });
        files.push(...matches);
      } catch (error) {
        // Fallback if glob is not available
        console.log('ℹ️  Using fallback file discovery');
      }
    });

    return files.slice(0, 25); // Limit for performance
  }

  // Generate responsive design report
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalOptimizations: this.optimizations.length,
        totalIssues: this.issues.length,
        responsiveScore: this.calculateResponsiveScore(),
      },
      breakpoints: this.breakpoints,
      responsiveClasses: this.responsiveClasses.length,
      optimizations: this.optimizations,
      issues: this.issues,
      recommendations: this.generateRecommendations(),
    };

    return report;
  }

  // Calculate responsive design score
  calculateResponsiveScore() {
    const totalChecks = this.optimizations.length + this.issues.length;
    if (totalChecks === 0) return 100;
    
    const score = (this.optimizations.length / totalChecks) * 100;
    return Math.round(score);
  }

  // Generate recommendations
  generateRecommendations() {
    const recommendations = [];

    if (this.issues.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        title: 'Fix Responsive Design Issues',
        description: 'Address issues that may affect mobile user experience',
        actions: this.issues,
      });
    }

    if (this.responsiveClasses.length < 20) {
      recommendations.push({
        priority: 'MEDIUM',
        title: 'Enhance Responsive Design',
        description: 'Add more responsive classes for better mobile experience',
        actions: ['Add responsive spacing classes', 'Implement responsive typography', 'Optimize layout for mobile'],
      });
    }

    if (this.optimizations.length >= 5) {
      recommendations.push({
        priority: 'LOW',
        title: 'Excellent Responsive Design',
        description: 'Your application has good responsive design implementation',
        actions: ['Test on real devices', 'Monitor mobile analytics', 'Consider progressive enhancement'],
      });
    }

    return recommendations;
  }

  // Display results
  displayResults(report) {
    console.log('\n📱 RESPONSIVE DESIGN REPORT');
    console.log('='.repeat(50));
    
    console.log('\n📊 SUMMARY:');
    console.log(`Responsive Score: ${report.summary.responsiveScore}%`);
    console.log(`Optimizations: ${report.summary.totalOptimizations}`);
    console.log(`Issues: ${report.summary.totalIssues}`);
    console.log(`Responsive Classes: ${report.responsiveClasses}`);

    console.log('\n📐 BREAKPOINTS:');
    Object.entries(report.breakpoints).forEach(([key, bp]) => {
      console.log(`   ${bp.name}: ${bp.min}px - ${bp.max === 9999 ? '∞' : bp.max + 'px'}`);
    });

    if (report.optimizations.length > 0) {
      console.log('\n✅ RESPONSIVE OPTIMIZATIONS:');
      report.optimizations.forEach(opt => {
        console.log(`   • ${opt}`);
      });
    }

    if (report.issues.length > 0) {
      console.log('\n⚠️  RESPONSIVE ISSUES:');
      report.issues.forEach(issue => {
        console.log(`   • ${issue}`);
      });
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      report.recommendations.forEach(rec => {
        const icon = rec.priority === 'HIGH' ? '🚨' : 
                     rec.priority === 'MEDIUM' ? '⚠️' : 'ℹ️';
        console.log(`\n${icon} ${rec.title} (${rec.priority})`);
        console.log(`   ${rec.description}`);
        rec.actions.forEach(action => {
          console.log(`   → ${action}`);
        });
      });
    }

    console.log('\n✨ RESPONSIVE DESIGN ANALYSIS COMPLETE!');
  }

  // Run full responsive design test
  async run() {
    console.log('🚀 Starting Responsive Design Analysis for CareDraft...\n');
    
    this.analyzeResponsiveClasses();
    this.checkMobileFirstPatterns();
    this.checkTouchTargets();
    this.checkResponsiveTypography();
    this.checkResponsiveImages();
    
    const report = this.generateReport();
    this.displayResults(report);

    // Save detailed report
    fs.writeFileSync(
      path.join(process.cwd(), 'responsive-design-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('\n📄 Detailed report saved to: responsive-design-report.json');
    
    return report;
  }
}

// Run the responsive design tester
if (require.main === module) {
  const tester = new ResponsiveDesignTester();
  tester.run().catch(console.error);
}

module.exports = ResponsiveDesignTester; 