#!/usr/bin/env node

/**
 * CSS Analysis Script for CareDraft
 * Analyzes Tailwind CSS usage and identifies optimization opportunities
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class CSSAnalyzer {
  constructor() {
    this.usedClasses = new Set();
    this.componentFiles = [];
    this.tailwindClasses = new Set();
  }

  // Scan all component files for CSS classes
  async scanComponentFiles() {
    const patterns = [
      'app/**/*.{js,ts,jsx,tsx}',
      'components/**/*.{js,ts,jsx,tsx}',
      'pages/**/*.{js,ts,jsx,tsx}',
    ];

    for (const pattern of patterns) {
      const files = glob.sync(pattern, { cwd: process.cwd() });
      this.componentFiles.push(...files);
    }

    console.log(`📁 Found ${this.componentFiles.length} component files to analyze`);
  }

  // Extract CSS classes from component files
  extractClassesFromFiles() {
    const classRegex = /className=["']([^"']*)["']/g;
    const classRegex2 = /class=["']([^"']*)["']/g;

    this.componentFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Extract className attributes
        let match;
        while ((match = classRegex.exec(content)) !== null) {
          const classes = match[1].split(/\s+/).filter(cls => cls.length > 0);
          classes.forEach(cls => this.usedClasses.add(cls));
        }

        // Extract class attributes (for regular HTML)
        while ((match = classRegex2.exec(content)) !== null) {
          const classes = match[1].split(/\s+/).filter(cls => cls.length > 0);
          classes.forEach(cls => this.usedClasses.add(cls));
        }
      } catch (error) {
        console.warn(`⚠️  Could not read file: ${file}`);
      }
    });

    console.log(`🎨 Found ${this.usedClasses.size} unique CSS classes in use`);
  }

  // Analyze class usage patterns
  analyzeUsagePatterns() {
    const patterns = {
      colors: new Set(),
      spacing: new Set(),
      typography: new Set(),
      layout: new Set(),
      brand: new Set(),
      deprecated: new Set(),
    };

    this.usedClasses.forEach(cls => {
      // Brand classes
      if (cls.includes('brand') || cls.includes('teal')) {
        patterns.brand.add(cls);
      }
      // Color classes
      else if (cls.match(/(text-|bg-|border-).+-(50|100|200|300|400|500|600|700|800|900)/)) {
        patterns.colors.add(cls);
      }
      // Typography
      else if (cls.match(/(text-|font-|leading-|tracking-)/)) {
        patterns.typography.add(cls);
      }
      // Spacing
      else if (cls.match(/(p-|m-|px-|py-|mx-|my-|pt-|pb-|pl-|pr-|mt-|mb-|ml-|mr-)/)) {
        patterns.spacing.add(cls);
      }
      // Layout
      else if (cls.match(/(flex|grid|w-|h-|max-|min-)/)) {
        patterns.layout.add(cls);
      }
      // Potentially deprecated classes
      else if (cls.includes('blue-') || cls.includes('primary-light') || cls.includes('primary-dark')) {
        patterns.deprecated.add(cls);
      }
    });

    return patterns;
  }

  // Generate optimization recommendations
  generateRecommendations(patterns) {
    const recommendations = [];

    // Check for deprecated brand classes
    if (patterns.deprecated.size > 0) {
      recommendations.push({
        type: 'CRITICAL',
        title: 'Deprecated Brand Classes Found',
        count: patterns.deprecated.size,
        classes: Array.from(patterns.deprecated).slice(0, 10),
        description: 'These classes should be updated to use the new brand color system',
      });
    }

    // Check for excessive color variants
    const colorCounts = {};
    patterns.colors.forEach(cls => {
      const base = cls.replace(/-\d+$/, '');
      colorCounts[base] = (colorCounts[base] || 0) + 1;
    });

    const excessiveColors = Object.entries(colorCounts)
      .filter(([, count]) => count > 5)
      .map(([base, count]) => ({ base, count }));

    if (excessiveColors.length > 0) {
      recommendations.push({
        type: 'INFO',
        title: 'High Color Variant Usage',
        description: 'Consider consolidating these color variants for consistency',
        data: excessiveColors,
      });
    }

    // Check brand class usage
    recommendations.push({
      type: 'SUCCESS',
      title: 'Brand Class Usage',
      count: patterns.brand.size,
      classes: Array.from(patterns.brand),
      description: 'Brand classes are being used consistently',
    });

    return recommendations;
  }

  // Generate report
  generateReport() {
    const patterns = this.analyzeUsagePatterns();
    const recommendations = this.generateRecommendations(patterns);

    const report = {
      summary: {
        totalFiles: this.componentFiles.length,
        totalClasses: this.usedClasses.size,
        brandClasses: patterns.brand.size,
        deprecatedClasses: patterns.deprecated.size,
      },
      patterns,
      recommendations,
    };

    return report;
  }

  // Display results
  displayResults(report) {
    console.log('\n🔍 CSS ANALYSIS REPORT');
    console.log('='.repeat(50));
    
    console.log('\n📊 SUMMARY:');
    console.log(`Files analyzed: ${report.summary.totalFiles}`);
    console.log(`Unique classes: ${report.summary.totalClasses}`);
    console.log(`Brand classes: ${report.summary.brandClasses}`);
    console.log(`Deprecated classes: ${report.summary.deprecatedClasses}`);

    console.log('\n🎯 RECOMMENDATIONS:');
    report.recommendations.forEach(rec => {
      const icon = rec.type === 'CRITICAL' ? '🚨' : 
                   rec.type === 'WARNING' ? '⚠️' : 
                   rec.type === 'SUCCESS' ? '✅' : 'ℹ️';
      
      console.log(`\n${icon} ${rec.title}`);
      console.log(`   ${rec.description}`);
      
      if (rec.count) {
        console.log(`   Count: ${rec.count}`);
      }
      
      if (rec.classes) {
        console.log(`   Examples: ${rec.classes.slice(0, 5).join(', ')}${rec.classes.length > 5 ? '...' : ''}`);
      }
      
      if (rec.data) {
        rec.data.slice(0, 3).forEach(item => {
          console.log(`   ${item.base}: ${item.count} variants`);
        });
      }
    });

    console.log('\n✨ OPTIMIZATION COMPLETE!');
  }

  // Run full analysis
  async run() {
    console.log('🚀 Starting CSS Analysis for CareDraft...\n');
    
    await this.scanComponentFiles();
    this.extractClassesFromFiles();
    const report = this.generateReport();
    this.displayResults(report);

    // Save detailed report
    fs.writeFileSync(
      path.join(process.cwd(), 'css-analysis-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('\n📄 Detailed report saved to: css-analysis-report.json');
  }
}

// Run the analyzer
if (require.main === module) {
  const analyzer = new CSSAnalyzer();
  analyzer.run().catch(console.error);
}

module.exports = CSSAnalyzer; 