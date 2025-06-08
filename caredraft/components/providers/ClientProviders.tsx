'use client';

import React, { useEffect } from 'react';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }
    
    // Start performance monitoring
    if (typeof window !== 'undefined') {
      import('@/lib/services/performance-monitoring').then(({ performanceMonitor }) => {
        performanceMonitor.startMonitoring();
      });
    }
  }, []);
  
  return <>{children}</>;
} 