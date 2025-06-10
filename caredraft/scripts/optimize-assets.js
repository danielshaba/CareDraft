#!/usr/bin/env node

/**
 * Asset Optimization Script for CareDraft
 * Optimizes images, CSS, and overall performance
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AssetOptimizer {
  constructor() {
    this.optimizations = [];
    this.errors = [];
  }

  // Check if required assets exist
  checkAssetStructure() {
    console.log('📁 Checking asset structure...');
    
    const requiredAssets = [
      'public/favicon.ico',
      'public/caredraft-logo.svg',
      'app/globals.css',
    ];

    const missingAssets = [];
    
    requiredAssets.forEach(asset => {
      if (!fs.existsSync(asset)) {
        missingAssets.push(asset);
      }
    });

    if (missingAssets.length > 0) {
      console.log('⚠️  Missing assets:');
      missingAssets.forEach(asset => console.log(`   - ${asset}`));
      this.errors.push(`Missing assets: ${missingAssets.join(', ')}`);
    } else {
      console.log('✅ All required assets found');
      this.optimizations.push('Asset structure verified');
    }
  }

  // Optimize CSS bundle
  optimizeCSS() {
    console.log('\n🎨 Optimizing CSS...');
    
    try {
      // Check if Tailwind config exists
      if (fs.existsSync('tailwind.config.ts')) {
        console.log('✅ Tailwind configuration found');
        this.optimizations.push('Tailwind CSS configured');
      }

      // Check PostCSS config
      if (fs.existsSync('postcss.config.mjs')) {
        console.log('✅ PostCSS optimization configured');
        this.optimizations.push('PostCSS optimization enabled');
      }

      // Verify CSS variables are properly defined
      const globalCSS = fs.readFileSync('app/globals.css', 'utf8');
      if (globalCSS.includes('@theme') && globalCSS.includes('--color-brand-')) {
        console.log('✅ Brand colors properly configured in CSS');
        this.optimizations.push('Brand color system implemented');
      } else {
        console.log('⚠️  Brand colors may not be properly configured');
        this.errors.push('Brand colors not found in globals.css');
      }

    } catch (error) {
      console.error('❌ CSS optimization check failed:', error.message);
      this.errors.push(`CSS optimization error: ${error.message}`);
    }
  }

  // Check image optimization setup
  checkImageOptimization() {
    console.log('\n🖼️  Checking image optimization...');
    
    try {
      // Check Next.js config for image optimization
      const nextConfig = fs.readFileSync('next.config.ts', 'utf8');
      
      if (nextConfig.includes('images:') && nextConfig.includes('formats:')) {
        console.log('✅ Next.js image optimization configured');
        this.optimizations.push('Next.js image optimization enabled');
      }

      // Check if optimized image component exists
      if (fs.existsSync('components/ui/optimized-image.tsx')) {
        console.log('✅ Optimized image component available');
        this.optimizations.push('Custom image optimization component created');
      }

    } catch (error) {
      console.error('❌ Image optimization check failed:', error.message);
      this.errors.push(`Image optimization error: ${error.message}`);
    }
  }

  // Performance optimizations check
  checkPerformanceOptimizations() {
    console.log('\n⚡ Checking performance optimizations...');
    
    try {
      const nextConfig = fs.readFileSync('next.config.ts', 'utf8');
      
      const optimizations = [
        { check: 'optimizePackageImports', name: 'Package import optimization' },
        { check: 'optimizeCss', name: 'CSS optimization' },
        { check: 'compress:', name: 'Compression enabled' },
        { check: 'turbo:', name: 'Turbopack configuration' },
      ];

      optimizations.forEach(({ check, name }) => {
        if (nextConfig.includes(check)) {
          console.log(`✅ ${name} enabled`);
          this.optimizations.push(name);
        } else {
          console.log(`⚠️  ${name} not found`);
        }
      });

    } catch (error) {
      console.error('❌ Performance check failed:', error.message);
      this.errors.push(`Performance check error: ${error.message}`);
    }
  }

  // Bundle analysis
  analyzeBundleSize() {
    console.log('\n📊 Analyzing bundle configuration...');
    
    try {
      // Check if bundle analyzer is available
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      if (packageJson.devDependencies && packageJson.devDependencies['@next/bundle-analyzer']) {
        console.log('✅ Bundle analyzer available');
        this.optimizations.push('Bundle analyzer configured');
      } else {
        console.log('ℹ️  Bundle analyzer not installed (optional)');
      }

      // Check for webpack optimizations
      const nextConfig = fs.readFileSync('next.config.ts', 'utf8');
      if (nextConfig.includes('webpack:') && nextConfig.includes('optimization')) {
        console.log('✅ Webpack optimizations configured');
        this.optimizations.push('Webpack bundle optimization enabled');
      }

    } catch (error) {
      console.error('❌ Bundle analysis failed:', error.message);
      this.errors.push(`Bundle analysis error: ${error.message}`);
    }
  }

  // Font optimization check
  checkFontOptimization() {
    console.log('\n🔤 Checking font optimization...');
    
    try {
      // Check if fonts are properly configured
      const layoutFile = 'app/layout.tsx';
      if (fs.existsSync(layoutFile)) {
        const layout = fs.readFileSync(layoutFile, 'utf8');
        
        if (layout.includes('next/font') && layout.includes('display:')) {
          console.log('✅ Font optimization configured');
          this.optimizations.push('Font loading optimization enabled');
        } else {
          console.log('⚠️  Font optimization may not be configured');
        }
      }

      // Check CSS for font-display
      const globalCSS = fs.readFileSync('app/globals.css', 'utf8');
      if (globalCSS.includes('font-display') || globalCSS.includes('swap')) {
        console.log('✅ Font display optimization found');
        this.optimizations.push('Font display optimization configured');
      }

    } catch (error) {
      console.error('❌ Font optimization check failed:', error.message);
      this.errors.push(`Font optimization error: ${error.message}`);
    }
  }

  // Generate optimization report
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalOptimizations: this.optimizations.length,
        totalErrors: this.errors.length,
        status: this.errors.length === 0 ? 'OPTIMIZED' : 'NEEDS_ATTENTION',
      },
      optimizations: this.optimizations,
      errors: this.errors,
      recommendations: this.generateRecommendations(),
    };

    return report;
  }

  // Generate recommendations based on findings
  generateRecommendations() {
    const recommendations = [];

    if (this.errors.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        title: 'Fix Critical Issues',
        description: 'Address the errors found during optimization check',
        actions: this.errors,
      });
    }

    if (!this.optimizations.includes('Bundle analyzer configured')) {
      recommendations.push({
        priority: 'MEDIUM',
        title: 'Add Bundle Analyzer',
        description: 'Install @next/bundle-analyzer to monitor bundle size',
        actions: ['npm install --save-dev @next/bundle-analyzer'],
      });
    }

    if (this.optimizations.length >= 8) {
      recommendations.push({
        priority: 'LOW',
        title: 'Performance Monitoring',
        description: 'Consider adding performance monitoring tools',
        actions: ['Set up Core Web Vitals monitoring', 'Add performance budgets'],
      });
    }

    return recommendations;
  }

  // Display results
  displayResults(report) {
    console.log('\n🔍 ASSET OPTIMIZATION REPORT');
    console.log('='.repeat(50));
    
    console.log('\n📊 SUMMARY:');
    console.log(`Status: ${report.summary.status}`);
    console.log(`Optimizations: ${report.summary.totalOptimizations}`);
    console.log(`Issues: ${report.summary.totalErrors}`);

    if (report.optimizations.length > 0) {
      console.log('\n✅ OPTIMIZATIONS ENABLED:');
      report.optimizations.forEach(opt => {
        console.log(`   • ${opt}`);
      });
    }

    if (report.errors.length > 0) {
      console.log('\n❌ ISSUES FOUND:');
      report.errors.forEach(error => {
        console.log(`   • ${error}`);
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

    console.log('\n✨ OPTIMIZATION ANALYSIS COMPLETE!');
  }

  // Run full optimization check
  async run() {
    console.log('🚀 Starting Asset Optimization Analysis for CareDraft...\n');
    
    this.checkAssetStructure();
    this.optimizeCSS();
    this.checkImageOptimization();
    this.checkPerformanceOptimizations();
    this.analyzeBundleSize();
    this.checkFontOptimization();
    
    const report = this.generateReport();
    this.displayResults(report);

    // Save detailed report
    fs.writeFileSync(
      path.join(process.cwd(), 'asset-optimization-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('\n📄 Detailed report saved to: asset-optimization-report.json');
    
    return report;
  }
}

// Run the optimizer
if (require.main === module) {
  const optimizer = new AssetOptimizer();
  optimizer.run().catch(console.error);
}

module.exports = AssetOptimizer; 