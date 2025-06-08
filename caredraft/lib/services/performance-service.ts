'use client'

// Performance monitoring utilities for CareDraft
export class PerformanceService {
  private static instance: PerformanceService
  private observers: Map<string, PerformanceObserver> = new Map()
  private metrics: Map<string, number> = new Map()

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService()
    }
    return PerformanceService.instance
  }

  // Core Web Vitals monitoring
  initializeWebVitals() {
    if (typeof window === 'undefined') return

    // Largest Contentful Paint (LCP)
    this.observeLCP()
    
    // First Input Delay (FID)
    this.observeFID()
    
    // Cumulative Layout Shift (CLS)
    this.observeCLS()
    
    // First Contentful Paint (FCP)
    this.observeFCP()
  }

  private observeLCP() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        
        this.metrics.set('LCP', lastEntry.startTime)
        this.reportMetric('LCP', lastEntry.startTime)
      })
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.set('LCP', observer)
    }
  }

  private observeFID() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: unknown) => {
          this.metrics.set('FID', entry.processingStart - entry.startTime)
          this.reportMetric('FID', entry.processingStart - entry.startTime)
        })
      })
      
      observer.observe({ entryTypes: ['first-input'] })
      this.observers.set('FID', observer)
    }
  }

  private observeCLS() {
    if ('PerformanceObserver' in window) {
      let clsValue = 0
      
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: unknown) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
            this.metrics.set('CLS', clsValue)
            this.reportMetric('CLS', clsValue)
          }
        })
      })
      
      observer.observe({ entryTypes: ['layout-shift'] })
      this.observers.set('CLS', observer)
    }
  }

  private observeFCP() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: unknown) => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.set('FCP', entry.startTime)
            this.reportMetric('FCP', entry.startTime)
          }
        })
      })
      
      observer.observe({ entryTypes: ['paint'] })
      this.observers.set('FCP', observer)
    }
  }

  // Resource timing analysis
  analyzeResourceLoading() {
    if (typeof window === 'undefined') return

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    
    const imageResources = resources.filter(r => 
      r.initiatorType === 'img' || 
      r.name.match(/\.(jpg|jpeg|png|webp|avif|gif|svg)$/i)
    )
    
    const scriptResources = resources.filter(r => 
      r.initiatorType === 'script' || 
      r.name.match(/\.js$/i)
    )
    
    const styleResources = resources.filter(r => 
      r.initiatorType === 'css' || 
      r.name.match(/\.css$/i)
    )

    return {
      images: this.analyzeResourceGroup(imageResources),
      scripts: this.analyzeResourceGroup(scriptResources),
      styles: this.analyzeResourceGroup(styleResources),
      total: this.analyzeResourceGroup(resources)
    }
  }

  private analyzeResourceGroup(resources: PerformanceResourceTiming[]) {
    const totalSize = resources.reduce((acc, r) => acc + (r.transferSize || 0), 0)
    const avgLoadTime = resources.length > 0 
      ? resources.reduce((acc, r) => acc + r.duration, 0) / resources.length 
      : 0

    return {
      count: resources.length,
      totalSize: totalSize,
      avgLoadTime: avgLoadTime,
      slowestResource: resources.reduce((slowest, current) => 
        current.duration > (slowest?.duration || 0) ? current : slowest, 
        null as PerformanceResourceTiming | null
      )
    }
  }

  // Image loading optimization
  preloadCriticalImages(imageUrls: string[]) {
    if (typeof window === 'undefined') return

    imageUrls.forEach(url => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = url
      document.head.appendChild(link)
    })
  }

  // Lazy loading intersection observer for images
  createImageObserver(callback?: (entry: IntersectionObserverEntry) => void) {
    if (typeof window === 'undefined') return null

    return new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          const src = img.dataset.src
          
                     if (src) {
             img.src = src
             img.removeAttribute('data-src')
           }
          
          callback?.(entry)
        }
      })
    }, {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    })
  }

  // Font optimization
  preloadFonts(fontUrls: string[]) {
    if (typeof window === 'undefined') return

    fontUrls.forEach(url => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'font'
      link.type = 'font/woff2'
      link.crossOrigin = 'anonymous'
      link.href = url
      document.head.appendChild(link)
    })
  }

  // Performance budget monitoring
  checkPerformanceBudget() {
    const budget = {
      LCP: 2500, // milliseconds
      FID: 100,  // milliseconds  
      CLS: 0.1,  // score
      FCP: 1800, // milliseconds
      totalSize: 3 * 1024 * 1024, // 3MB
      imageSize: 1.5 * 1024 * 1024, // 1.5MB
      scriptSize: 1 * 1024 * 1024   // 1MB
    }

    const results = {
      passed: true,
      violations: [] as string[]
    }

    // Check Core Web Vitals
    const lcp = this.metrics.get('LCP')
    if (lcp && lcp > budget.LCP) {
      results.passed = false
      results.violations.push(`LCP exceeds budget: ${lcp}ms > ${budget.LCP}ms`)
    }

    const fid = this.metrics.get('FID')
    if (fid && fid > budget.FID) {
      results.passed = false
      results.violations.push(`FID exceeds budget: ${fid}ms > ${budget.FID}ms`)
    }

    const cls = this.metrics.get('CLS')
    if (cls && cls > budget.CLS) {
      results.passed = false
      results.violations.push(`CLS exceeds budget: ${cls} > ${budget.CLS}`)
    }

    const fcp = this.metrics.get('FCP')
    if (fcp && fcp > budget.FCP) {
      results.passed = false
      results.violations.push(`FCP exceeds budget: ${fcp}ms > ${budget.FCP}ms`)
    }

    // Check resource sizes
    const resourceAnalysis = this.analyzeResourceLoading()
    if (resourceAnalysis) {
      if (resourceAnalysis.total.totalSize > budget.totalSize) {
        results.passed = false
        results.violations.push(`Total size exceeds budget: ${resourceAnalysis.total.totalSize} > ${budget.totalSize}`)
      }

      if (resourceAnalysis.images.totalSize > budget.imageSize) {
        results.passed = false
        results.violations.push(`Image size exceeds budget: ${resourceAnalysis.images.totalSize} > ${budget.imageSize}`)
      }

      if (resourceAnalysis.scripts.totalSize > budget.scriptSize) {
        results.passed = false
        results.violations.push(`Script size exceeds budget: ${resourceAnalysis.scripts.totalSize} > ${budget.scriptSize}`)
      }
    }

    return results
  }

  // Metric reporting
  private reportMetric(name: string, value: number) {
    // In a real application, this would send to analytics
    console.log(`[Performance] ${name}: ${value}`)
    
    // You can integrate with analytics services here
    // Example: gtag('event', 'web_vitals', { name, value })
  }

  // Get all metrics
  getMetrics() {
    return Object.fromEntries(this.metrics)
  }

  // Cleanup observers
  cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()
  }
}

// Asset optimization utilities
export class AssetOptimizationService {
  // Generate responsive image srcSet
  static generateSrcSet(basePath: string, sizes: number[]): string {
    return sizes
      .map(size => `${basePath}?w=${size} ${size}w`)
      .join(', ')
  }

  // Generate blur data URL for image placeholder
  static generateBlurDataURL(width: number = 10, height: number = 10): string {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''
    
    // Create a simple gradient blur effect
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#f3f4f6')
    gradient.addColorStop(1, '#e5e7eb')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
    
    return canvas.toDataURL()
  }

  // Check if WebP is supported
  static async isWebPSupported(): Promise<boolean> {
    if (typeof window === 'undefined') return false
    
    return new Promise(resolve => {
      const webP = new Image()
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2)
      }
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
    })
  }

  // Check if AVIF is supported
  static async isAVIFSupported(): Promise<boolean> {
    if (typeof window === 'undefined') return false
    
    return new Promise(resolve => {
      const avif = new Image()
      avif.onload = avif.onerror = () => {
        resolve(avif.height === 2)
      }
      avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
    })
  }

  // Get optimal image format based on browser support
  static async getOptimalImageFormat(): Promise<'avif' | 'webp' | 'jpeg'> {
    if (await this.isAVIFSupported()) return 'avif'
    if (await this.isWebPSupported()) return 'webp'
    return 'jpeg'
  }
}

// Hook for using performance service in React components
export function usePerformance() {
  const performanceService = PerformanceService.getInstance()
  
  return {
    initializeWebVitals: () => performanceService.initializeWebVitals(),
    analyzeResources: () => performanceService.analyzeResourceLoading(),
    checkBudget: () => performanceService.checkPerformanceBudget(),
    getMetrics: () => performanceService.getMetrics(),
    preloadImages: (urls: string[]) => performanceService.preloadCriticalImages(urls),
    createImageObserver: (callback?: (entry: IntersectionObserverEntry) => void) => 
      performanceService.createImageObserver(callback)
  }
} 