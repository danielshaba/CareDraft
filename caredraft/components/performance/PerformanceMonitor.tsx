'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  usePerformanceMonitoring, 
  useServiceWorker, 
  useBackgroundSync 
} from '@/lib/services/performance-monitoring';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Zap, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  Download,
  Server,
  Eye,
  Gauge
} from 'lucide-react';

interface PerformanceMonitorProps {
  showDetailed?: boolean;
}

export function PerformanceMonitor({ showDetailed = false }: PerformanceMonitorProps) {
  const { 
    metrics, 
    performanceScore, 
    isMonitoring, 
    startMonitoring, 
    stopMonitoring,
    clearMetrics 
  } = usePerformanceMonitoring();
  
  const { 
    isOnline, 
    isRegistered, 
    updateAvailable, 
    cacheSize, 
    updateServiceWorker, 
    clearCaches 
  } = useServiceWorker();
  
  const { hasPendingSync, lastSyncTime } = useBackgroundSync();

  const [expanded, setExpanded] = useState(false);

  // Format metrics for display
  const formatMetric = (value: number, unit: string) => {
    if (unit === 'ms') {
      return value < 1000 ? `${Math.round(value)}ms` : `${(value / 1000).toFixed(1)}s`;
    }
    if (unit === 'score') {
      return Math.round(value * 100);
    }
    return Math.round(value);
  };

  const getMetricColor = (name: string, value: number) => {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 800, poor: 1800 },
    };
    
    const threshold = thresholds[name as keyof typeof thresholds];
    if (!threshold) return 'text-gray-600';
    
    if (value <= threshold.good) return 'text-emerald-600';
    if (value <= threshold.poor) return 'text-amber-600';
    return 'text-red-600';
  };

  const formatCacheSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (!showDetailed && !expanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-80 bg-white/95 backdrop-blur-sm border shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                <CardTitle className="text-sm">Performance</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-emerald-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(true)}
                  className="h-6 w-6 p-0"
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>Score:</span>
                <Badge 
                  variant={performanceScore >= 90 ? "default" : performanceScore >= 70 ? "secondary" : "destructive"}
                  className="text-xs"
                >
                  {Math.round(performanceScore)}
                </Badge>
              </div>
              {updateAvailable && (
                <Button
                  size="sm"
                  onClick={updateServiceWorker}
                  className="w-full h-6 text-xs"
                >
                  Update Available
                </Button>
              )}
              {hasPendingSync && (
                <div className="flex items-center gap-1 text-xs text-amber-600">
                  <RefreshCw className="h-3 w-3" />
                  Sync Pending
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={expanded ? "fixed inset-4 z-50" : ""}>
      <Card className={expanded ? "h-full bg-white" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Performance Monitor
              </CardTitle>
              <CardDescription>
                Real-time performance metrics and service worker status
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {expanded && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExpanded(false)}
                >
                  Minimize
                </Button>
              )}
              <Button
                variant={isMonitoring ? "destructive" : "default"}
                size="sm"
                onClick={isMonitoring ? stopMonitoring : startMonitoring}
              >
                {isMonitoring ? 'Stop' : 'Start'} Monitoring
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className={expanded ? "h-full overflow-y-auto" : ""}>
          <div className="grid gap-6">
            
            {/* Core Web Vitals */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Core Web Vitals
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {['LCP', 'FID', 'CLS', 'FCP', 'TTFB'].map((metricName) => {
                  const metric = metrics.find(m => m.name === metricName);
                  return (
                    <Card key={metricName}>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold mb-1">
                            {metric ? (
                              <span className={getMetricColor(metricName, metric.value)}>
                                {formatMetric(metric.value, metricName === 'CLS' ? 'score' : 'ms')}
                              </span>
                            ) : (
                              <span className="text-gray-400">--</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">{metricName}</div>
                          {metric && (
                            <Badge 
                              variant={
                                metric.rating === 'good' ? 'default' :
                                metric.rating === 'needs-improvement' ? 'secondary' : 'destructive'
                              }
                              className="text-xs mt-1"
                            >
                              {metric.rating}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Performance Score */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Overall Performance</h3>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">
                      <span className={
                        performanceScore >= 90 ? 'text-emerald-600' :
                        performanceScore >= 70 ? 'text-amber-600' : 'text-red-600'
                      }>
                        {Math.round(performanceScore)}
                      </span>
                    </div>
                    <Progress value={performanceScore} className="mb-2" />
                    <div className="text-sm text-gray-600">Performance Score</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Service Worker Status */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Server className="h-4 w-4" />
                Service Worker
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <Badge variant={isRegistered ? "default" : "secondary"}>
                        {isRegistered ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Network</span>
                      <div className="flex items-center gap-1">
                        {isOnline ? (
                          <Wifi className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <WifiOff className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">
                          {isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Cache Size</span>
                      <span className="text-sm font-medium">
                        {formatCacheSize(cacheSize)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Background Sync</span>
                      <div className="flex items-center gap-1">
                        {hasPendingSync ? (
                          <RefreshCw className="h-4 w-4 text-amber-500 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        )}
                        <span className="text-sm">
                          {hasPendingSync ? 'Pending' : 'Up to date'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Actions */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Actions</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearMetrics}
                  disabled={metrics.length === 0}
                >
                  Clear Metrics
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCaches}
                  disabled={cacheSize === 0}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Clear Cache
                </Button>
                
                {updateAvailable && (
                  <Button
                    size="sm"
                    onClick={updateServiceWorker}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Update App
                  </Button>
                )}
              </div>
            </div>

            {/* Recent Metrics Table */}
            {showDetailed && metrics.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Recent Metrics</h3>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b">
                          <tr>
                            <th className="p-3 text-left text-sm font-medium">Metric</th>
                            <th className="p-3 text-left text-sm font-medium">Value</th>
                            <th className="p-3 text-left text-sm font-medium">Rating</th>
                            <th className="p-3 text-left text-sm font-medium">URL</th>
                            <th className="p-3 text-left text-sm font-medium">Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {metrics.slice(-10).map((metric, index) => (
                            <tr key={index} className="border-b">
                              <td className="p-3 text-sm font-medium">{metric.name}</td>
                              <td className={`p-3 text-sm ${getMetricColor(metric.name, metric.value)}`}>
                                {formatMetric(metric.value, metric.name === 'CLS' ? 'score' : 'ms')}
                              </td>
                              <td className="p-3">
                                <Badge 
                                  variant={
                                    metric.rating === 'good' ? 'default' :
                                    metric.rating === 'needs-improvement' ? 'secondary' : 'destructive'
                                  }
                                  className="text-xs"
                                >
                                  {metric.rating}
                                </Badge>
                              </td>
                              <td className="p-3 text-sm text-gray-600 max-w-[200px] truncate">
                                {metric.url}
                              </td>
                              <td className="p-3 text-sm text-gray-600">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {new Date(metric.timestamp).toLocaleTimeString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 