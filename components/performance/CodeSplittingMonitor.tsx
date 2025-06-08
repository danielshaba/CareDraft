'use client';

import React, { useEffect, useState } from 'react';

interface ChunkLoadMetric {
  name: string;
  loadTime: number;
  size?: number;
  timestamp: number;
}

interface CodeSplittingMetrics {
  totalChunks: number;
  averageLoadTime: number;
  slowestChunk: ChunkLoadMetric | null;
  fastestChunk: ChunkLoadMetric | null;
  totalSize: number;
}

export function useCodeSplittingMetrics() {
  const [metrics, setMetrics] = useState<CodeSplittingMetrics>({
    totalChunks: 0,
    averageLoadTime: 0,
    slowestChunk: null,
    fastestChunk: null,
    totalSize: 0,
  });

  const [chunkLoads, setChunkLoads] = useState<ChunkLoadMetric[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry) => {
        if (entry.name.includes('_next/static/chunks/') || entry.name.includes('.js')) {
          const metric: ChunkLoadMetric = {
            name: entry.name.split('/').pop() || entry.name,
            loadTime: entry.duration,
            size: (entry as any).transferSize || 0,
            timestamp: Date.now(),
          };

          setChunkLoads(prev => {
            const updated = [...prev, metric];
            
            // Calculate metrics
            const totalChunks = updated.length;
            const averageLoadTime = updated.reduce((sum, chunk) => sum + chunk.loadTime, 0) / totalChunks;
            const slowestChunk = updated.reduce((slowest, chunk) => 
              !slowest || chunk.loadTime > slowest.loadTime ? chunk : slowest
            );
            const fastestChunk = updated.reduce((fastest, chunk) => 
              !fastest || chunk.loadTime < fastest.loadTime ? chunk : fastest
            );
            const totalSize = updated.reduce((sum, chunk) => sum + (chunk.size || 0), 0);

            setMetrics({
              totalChunks,
              averageLoadTime,
              slowestChunk,
              fastestChunk,
              totalSize,
            });

            return updated;
          });
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });

    return () => observer.disconnect();
  }, []);

  return { metrics, chunkLoads };
}

export function CodeSplittingMonitor({ 
  showDetails = false 
}: { 
  showDetails?: boolean 
}) {
  const { metrics, chunkLoads } = useCodeSplittingMetrics();

  if (process.env.NODE_ENV !== 'development' && !showDetails) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border rounded-lg shadow-lg p-4 max-w-sm z-50">
      <h3 className="font-semibold text-sm mb-2">Code Splitting Metrics</h3>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span>Total Chunks:</span>
          <span className="font-mono">{metrics.totalChunks}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Avg Load Time:</span>
          <span className="font-mono">{metrics.averageLoadTime.toFixed(2)}ms</span>
        </div>
        
        <div className="flex justify-between">
          <span>Total Size:</span>
          <span className="font-mono">{(metrics.totalSize / 1024).toFixed(1)}KB</span>
        </div>

        {metrics.slowestChunk && (
          <div className="pt-2 border-t">
            <div className="text-red-600">
              <div>Slowest: {metrics.slowestChunk.name}</div>
              <div className="font-mono">{metrics.slowestChunk.loadTime.toFixed(2)}ms</div>
            </div>
          </div>
        )}

        {metrics.fastestChunk && (
          <div className="text-green-600">
            <div>Fastest: {metrics.fastestChunk.name}</div>
            <div className="font-mono">{metrics.fastestChunk.loadTime.toFixed(2)}ms</div>
          </div>
        )}
      </div>

      {showDetails && chunkLoads.length > 0 && (
        <details className="mt-3">
          <summary className="text-xs cursor-pointer">Recent Loads</summary>
          <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
            {chunkLoads.slice(-5).map((chunk, index) => (
              <div key={index} className="text-xs flex justify-between">
                <span className="truncate flex-1">{chunk.name}</span>
                <span className="font-mono ml-2">{chunk.loadTime.toFixed(1)}ms</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

// Hook to track component load times
export function useComponentLoadTime(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} rendered in ${loadTime.toFixed(2)}ms`);
      }

      // Send to analytics if available
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as any).gtag('event', 'component_render_time', {
          component_name: componentName,
          render_time: Math.round(loadTime),
        });
      }
    };
  }, [componentName]);
}

// Bundle size analyzer component
export function BundleSizeAnalyzer() {
  const [bundleInfo, setBundleInfo] = useState<{
    chunks: Array<{ name: string; size: number }>;
    totalSize: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Analyze loaded chunks
    const analyzeBundle = () => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      const chunks = scripts
        .filter(script => script.src.includes('_next/static/chunks/'))
        .map(script => ({
          name: script.src.split('/').pop() || 'unknown',
          size: 0, // Size would need to be fetched or estimated
        }));

      const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
      
      setBundleInfo({ chunks, totalSize });
    };

    // Run analysis after initial load
    setTimeout(analyzeBundle, 2000);
  }, []);

  if (process.env.NODE_ENV !== 'development' || !bundleInfo) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-white border rounded-lg shadow-lg p-4 max-w-xs z-50">
      <h3 className="font-semibold text-sm mb-2">Bundle Analysis</h3>
      
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Loaded Chunks:</span>
          <span className="font-mono">{bundleInfo.chunks.length}</span>
        </div>
        
        <details>
          <summary className="cursor-pointer">Chunk Details</summary>
          <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
            {bundleInfo.chunks.map((chunk, index) => (
              <div key={index} className="text-xs">
                {chunk.name}
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
} 