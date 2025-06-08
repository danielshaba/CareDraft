import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';
import React from 'react';

// Performance thresholds based on Core Web Vitals recommendations
export const PERFORMANCE_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
  INP: { good: 200, needsImprovement: 500 },   // Interaction to Next Paint
  CLS: { good: 0.1, needsImprovement: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
  TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte
} as const;

// Performance metric interface
interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
  navigationType: string;
  connectionType?: string;
  deviceMemory?: number;
  hardwareConcurrency?: number;
}

// Performance analytics data
interface PerformanceData {
  sessionId: string;
  userId?: string;
  metrics: PerformanceMetric[];
  pageLoadTime: number;
  resourceTiming: PerformanceResourceTiming[];
  navigationTiming: PerformanceNavigationTiming;
  userAgent: string;
  timestamp: number;
}

class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private sessionId: string;
  private metricsQueue: PerformanceMetric[] = [];
  private isMonitoring = false;
  private analyticsEndpoint = '/api/analytics/performance';
  
  constructor() {
    this.sessionId = this.generateSessionId();
  }
  
  static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }
  
  // Initialize monitoring
  startMonitoring(userId?: string): void {
    if (this.isMonitoring || typeof window === 'undefined') return;
    
    this.isMonitoring = true;
    
    // Collect Core Web Vitals
    this.collectWebVitals();
    
    // Monitor resource loading
    this.monitorResourceLoading();
    
    // Set up user interaction monitoring
    this.monitorUserInteractions();
    
    // Start periodic data transmission
    this.startPeriodicReporting();
    
    console.log('🚀 Performance monitoring started', { sessionId: this.sessionId, userId });
  }
  
  // Collect Core Web Vitals
  private collectWebVitals(): void {
    const handleMetric = (metric: Metric) => {
      const performanceMetric: PerformanceMetric = {
        id: metric.id,
        name: metric.name,
        value: metric.value,
        rating: this.getRating(metric.name, metric.value),
        timestamp: Date.now(),
        url: window.location.href,
        navigationType: this.getNavigationType(),
        connectionType: this.getConnectionType(),
        deviceMemory: this.getDeviceMemory(),
        hardwareConcurrency: navigator.hardwareConcurrency,
      };
      
      this.metricsQueue.push(performanceMetric);
      
      // Check performance budgets
      this.checkPerformanceBudget(performanceMetric);
      
      // Log critical performance issues
      if (performanceMetric.rating === 'poor') {
        console.warn('⚠️ Poor performance detected:', performanceMetric);
      }
    };
    
    // Collect all Core Web Vitals
    onCLS(handleMetric);
    onFCP(handleMetric);
    onINP(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);
  }
  
  // Monitor resource loading performance
  private monitorResourceLoading(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.analyzeResourceTiming(entry as PerformanceResourceTiming);
          }
          
          if (entry.entryType === 'navigation') {
            this.analyzeNavigationTiming(entry as PerformanceNavigationTiming);
          }
          
          if (entry.entryType === 'paint') {
            this.analyzePaintTiming(entry);
          }
        }
      });
      
      observer.observe({ entryTypes: ['resource', 'navigation', 'paint'] });
    }
  }
  
  // Monitor user interactions
  private monitorUserInteractions(): void {
    let interactionCount = 0;
    let longTaskCount = 0;
    
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          longTaskCount++;
          
          if (entry.duration > 50) {
            console.warn('🐌 Long task detected:', {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name,
            });
          }
        }
      });
      
      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch {
        console.warn('Long task monitoring not supported');
      }
    }
    
    // Monitor user interactions
    ['click', 'keydown', 'scroll'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        interactionCount++;
      }, { passive: true });
    });
    
    // Report interaction metrics periodically
    setInterval(() => {
      this.metricsQueue.push({
        id: `interaction-${Date.now()}`,
        name: 'user-interactions',
        value: interactionCount,
        rating: 'good',
        timestamp: Date.now(),
        url: window.location.href,
        navigationType: this.getNavigationType(),
      });
      
      this.metricsQueue.push({
        id: `longtask-${Date.now()}`,
        name: 'long-tasks',
        value: longTaskCount,
        rating: longTaskCount > 5 ? 'poor' : longTaskCount > 2 ? 'needs-improvement' : 'good',
        timestamp: Date.now(),
        url: window.location.href,
        navigationType: this.getNavigationType(),
      });
      
      interactionCount = 0;
      longTaskCount = 0;
    }, 30000); // Every 30 seconds
  }
  
  // Analyze resource loading
  private analyzeResourceTiming(entry: PerformanceResourceTiming): void {
    const { name, duration, transferSize, decodedBodySize } = entry;
    
    // Flag slow resources
    if (duration > 1000) {
      console.warn('🐌 Slow resource detected:', {
        name,
        duration: Math.round(duration),
        transferSize,
        decodedBodySize,
      });
    }
    
    // Flag large resources
    if (transferSize > 1000000) { // > 1MB
      console.warn('📦 Large resource detected:', {
        name,
        transferSize: Math.round(transferSize / 1024) + 'KB',
        duration: Math.round(duration),
      });
    }
  }
  
  // Analyze navigation timing
  private analyzeNavigationTiming(entry: PerformanceNavigationTiming): void {
    const pageLoadTime = entry.loadEventEnd - entry.fetchStart;
    const domContentLoadedTime = entry.domContentLoadedEventEnd - entry.fetchStart;
    const ttfb = entry.responseStart - entry.fetchStart;
    
    console.log('📊 Navigation Timing:', {
      pageLoadTime: Math.round(pageLoadTime),
      domContentLoadedTime: Math.round(domContentLoadedTime),
      ttfb: Math.round(ttfb),
    });
  }
  
  // Analyze paint timing
  private analyzePaintTiming(entry: PerformanceEntry): void {
    console.log(`🎨 ${entry.name}:`, Math.round(entry.startTime), 'ms');
  }
  
  // Check performance budgets
  private checkPerformanceBudget(metric: PerformanceMetric): void {
    const budgets = {
      LCP: 2500,
      FID: 100,
      CLS: 0.1,
      FCP: 1800,
      TTFB: 800,
    };
    
    const budget = budgets[metric.name as keyof typeof budgets];
    if (budget && metric.value > budget) {
      console.error('💸 Performance budget exceeded:', {
        metric: metric.name,
        value: metric.value,
        budget,
        exceedBy: metric.value - budget,
      });
      
      // You could trigger alerts here
      this.triggerPerformanceAlert(metric, budget);
    }
  }
  
  // Trigger performance alerts
  private triggerPerformanceAlert(metric: PerformanceMetric, budget: number): void {
    // In a real implementation, you might send this to a monitoring service
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'PERFORMANCE_ALERT',
        data: {
          metric: metric.name,
          value: metric.value,
          budget,
          timestamp: metric.timestamp,
        },
      });
    }
  }
  
  // Get rating based on thresholds
  private getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = PERFORMANCE_THRESHOLDS[metricName as keyof typeof PERFORMANCE_THRESHOLDS];
    if (!threshold) return 'good';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  }
  
  // Utility methods
  private generateSessionId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private getNavigationType(): string {
    if (typeof window !== 'undefined' && 'navigation' in performance && performance.navigation) {
      const types = ['navigate', 'reload', 'back_forward', 'prerender'];
      return types[performance.navigation.type] || 'navigate';
    }
    return 'navigate';
  }
  
  private getConnectionType(): string | undefined {
    if (typeof window !== 'undefined') {
      const nav = navigator as any;
      return nav.connection?.effectiveType || nav.mozConnection?.type || nav.webkitConnection?.type;
    }
  }
  
  private getDeviceMemory(): number | undefined {
    if (typeof window !== 'undefined') {
      const nav = navigator as any;
      return nav.deviceMemory;
    }
  }
  
  // Periodic reporting
  private startPeriodicReporting(): void {
    setInterval(() => {
      this.sendMetrics();
    }, 60000); // Every minute
    
    // Send metrics on page unload
    window.addEventListener('beforeunload', () => {
      this.sendMetrics(true);
    });
    
    // Send metrics when page becomes hidden
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.sendMetrics(true);
      }
    });
  }
  
  // Send metrics to analytics endpoint
  private async sendMetrics(isBeacon = false): Promise<void> {
    if (this.metricsQueue.length === 0) return;
    
    const data: PerformanceData = {
      sessionId: this.sessionId,
      metrics: [...this.metricsQueue],
      pageLoadTime: performance.now(),
      resourceTiming: performance.getEntriesByType('resource') as PerformanceResourceTiming[],
      navigationTiming: performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    };
    
    this.metricsQueue = []; // Clear the queue
    
    try {
      if (isBeacon && 'sendBeacon' in navigator) {
        // Use sendBeacon for reliability during page unload
        navigator.sendBeacon(this.analyticsEndpoint, JSON.stringify(data));
      } else {
        // Use fetch for regular transmission
        await fetch(this.analyticsEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }
    } catch {
      console.error('Failed to send performance metrics:', error);
      // Re-queue metrics for retry
      this.metricsQueue.unshift(...data.metrics);
    }
  }
  
  // Get current performance summary
  getPerformanceSummary(): Record<string, unknown> {
    if (typeof window === 'undefined') return {};
    
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    return {
      sessionId: this.sessionId,
      pageLoadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
      domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : 0,
      timeToFirstByte: navigation ? navigation.responseStart - navigation.fetchStart : 0,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      resourceCount: performance.getEntriesByType('resource').length,
      memoryUsage: (performance as any).memory ? {
        used: Math.round((performance as any).memory.usedJSHeapSize / 1048576),
        total: Math.round((performance as any).memory.totalJSHeapSize / 1048576),
        limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1048576),
      } : null,
    };
  }
  
  // Manual metric collection
  recordCustomMetric(name: string, value: number, rating?: 'good' | 'needs-improvement' | 'poor'): void {
    this.metricsQueue.push({
      id: `custom-${name}-${Date.now()}`,
      name,
      value,
      rating: rating || 'good',
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      navigationType: this.getNavigationType(),
    });
  }
  
  // Stop monitoring
  stopMonitoring(): void {
    this.isMonitoring = false;
    this.sendMetrics(true);
    console.log('🛑 Performance monitoring stopped');
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitoringService.getInstance();

// React hooks for performance monitoring
export function usePerformanceMonitoring(userId?: string) {
  const [metrics, setMetrics] = React.useState<PerformanceMetric[]>([]);
  const [isMonitoring, setIsMonitoring] = React.useState(false);
  const [performanceScore, setPerformanceScore] = React.useState(85);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      performanceMonitor.startMonitoring(userId);
      setIsMonitoring(true);
    }
    
    return () => {
      performanceMonitor.stopMonitoring();
    };
  }, [userId]);

  const startMonitoring = React.useCallback(() => {
    performanceMonitor.startMonitoring(userId);
    setIsMonitoring(true);
  }, [userId]);

  const stopMonitoring = React.useCallback(() => {
    performanceMonitor.stopMonitoring();
    setIsMonitoring(false);
  }, []);

  const clearMetrics = React.useCallback(() => {
    setMetrics([]);
  }, []);
  
  const recordMetric = React.useCallback((name: string, value: number, rating?: 'good' | 'needs-improvement' | 'poor') => {
    performanceMonitor.recordCustomMetric(name, value, rating);
  }, []);
  
  const getPerformanceSummary = React.useCallback(() => {
    return performanceMonitor.getPerformanceSummary();
  }, []);
  
  return {
    metrics,
    performanceScore,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearMetrics,
    recordMetric,
    getPerformanceSummary,
  };
}

// Service worker hook
export function useServiceWorker() {
  const [isRegistered, setIsRegistered] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(true);
  const [updateAvailable, setUpdateAvailable] = React.useState(false);
  const [cacheSize, setCacheSize] = React.useState(0);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const updateServiceWorker = React.useCallback(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      setUpdateAvailable(false);
    }
  }, []);

  const clearCaches = React.useCallback(async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      setCacheSize(0);
    }
  }, []);

  return {
    isRegistered,
    isOnline,
    updateAvailable,
    cacheSize,
    updateServiceWorker,
    clearCaches,
  };
}

// Background sync hook
export function useBackgroundSync() {
  const [hasPendingSync, setHasPendingSync] = React.useState(false);
  const [lastSyncTime, setLastSyncTime] = React.useState<Date | null>(null);

  React.useEffect(() => {
    // Simulate sync state
    const interval = setInterval(() => {
      setHasPendingSync(Math.random() > 0.8);
      if (Math.random() > 0.7) {
        setLastSyncTime(new Date());
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return { hasPendingSync, lastSyncTime };
} 