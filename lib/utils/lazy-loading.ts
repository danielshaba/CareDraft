'use client';

import { useState, useEffect, useRef, RefObject } from 'react';

// Intersection Observer hook for lazy loading components
export function useIntersectionObserver(
  threshold = 0.1,
  rootMargin = '50px'
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, hasIntersected]);

  return { elementRef, isIntersecting, hasIntersected };
}

// Component lazy loading with intersection observer
export function LazyComponent({
  children,
  fallback = <div className="h-32 bg-gray-100 animate-pulse rounded" />,
  threshold = 0.1,
  rootMargin = '50px',
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
}) {
  const { elementRef, hasIntersected } = useIntersectionObserver(threshold, rootMargin);

  return (
    <div ref={elementRef}>
      {hasIntersected ? children : fallback}
    </div>
  );
}

// Prefetch utility for critical routes
export const prefetchRoute = (href: string) => {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  }
};

// Preload critical components
export const preloadComponents = () => {
  if (typeof window !== 'undefined') {
    // Preload critical components that are likely to be used
    import('@/components/draft-builder/DraftBuilderInterface');
    import('@/components/shared/DocumentPreview');
    import('@/components/research/ResearchSessionViewer');
    
    // Preload critical routes
    prefetchRoute('/dashboard/draft-builder');
    prefetchRoute('/dashboard/knowledge-hub');
    prefetchRoute('/dashboard/brainstorm');
  }
};

// Performance timing utilities
export const measureComponentLoad = (componentName: string) => {
  const startTime = performance.now();
  
  return () => {
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} loaded in ${loadTime.toFixed(2)}ms`);
    }
    
    // Send to analytics in production
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'component_load_time', {
        component_name: componentName,
        load_time: Math.round(loadTime),
      });
    }
  };
}; 