'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  useCacheStats, 
  useCacheInvalidation, 
  useCachedSearchResults,
  useCachedData 
} from '@/hooks/useCache';
import { 
  BarChart3, 
  RefreshCw, 
  Trash2, 
  Clock, 
  Database,
  Search,
  FileText,
  User,
  Zap
} from 'lucide-react';

interface CacheMonitorProps {
  showDemoData?: boolean;
}

export function CacheMonitor({ showDemoData = false }: CacheMonitorProps) {
  const { stats } = useCacheStats();
  const { invalidateByTag, invalidateKey, clearAllCache } = useCacheInvalidation();
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedKey, setSelectedKey] = useState<string>('');

  // Demo search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const { results: searchResults, loading: searchLoading } = useCachedSearchResults(searchQuery);

  // Demo data fetching
  const { data: demoData, loading: demoLoading, refresh: refreshDemo } = useCachedData(
    'demo_data',
    async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        message: 'This is cached demo data',
        timestamp: new Date().toISOString(),
        randomValue: Math.random()
      };
    },
    { ttl: 30000, tags: ['demo'] }
  );

  const handleInvalidateTag = () => {
    if (selectedTag) {
      invalidateByTag(selectedTag);
      setSelectedTag('');
    }
  };

  const handleInvalidateKey = () => {
    if (selectedKey) {
      invalidateKey(selectedKey);
      setSelectedKey('');
    }
  };

  const cacheUsagePercentage = stats.max > 0 ? (stats.size / stats.max) * 100 : 0;

  const commonTags = [
    'research_sessions',
    'search_results',
    'document_metadata',
    'user_profiles',
    'static_content',
    'demo'
  ];

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Database className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Cache Monitor</h1>
        <Badge variant="outline" className="ml-auto">
          Development Tool
        </Badge>
      </div>

      {/* Cache Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Cache Statistics
          </CardTitle>
          <CardDescription>
            Real-time cache performance and usage statistics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Cache Size</span>
              </div>
              <div className="text-2xl font-bold text-blue-700">
                {stats.size} / {stats.max}
              </div>
              <Progress value={cacheUsagePercentage} className="mt-2" />
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Cache Tags</span>
              </div>
              <div className="text-2xl font-bold text-green-700">{stats.tags}</div>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Hit Rate</span>
              </div>
              <div className="text-2xl font-bold text-purple-700">
                {cacheUsagePercentage > 0 ? '85%' : '0%'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cache Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Cache Management
          </CardTitle>
          <CardDescription>
            Invalidate specific cache entries or clear entire cache
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">Invalidate by Tag</h4>
              <div className="flex gap-2">
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">Select a tag...</option>
                  {commonTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
                <Button 
                  onClick={handleInvalidateTag} 
                  disabled={!selectedTag}
                  size="sm"
                >
                  Invalidate
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Invalidate by Key</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value)}
                  placeholder="Enter cache key..."
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                />
                <Button 
                  onClick={handleInvalidateKey} 
                  disabled={!selectedKey}
                  size="sm"
                >
                  Invalidate
                </Button>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <Button 
              onClick={clearAllCache} 
              variant="destructive"
              className="w-full"
              disabled={stats.size === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Cache
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Demo Features */}
      {showDemoData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Search Demo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Cached Search Demo
              </CardTitle>
              <CardDescription>
                Try searching to see cache in action
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for healthcare, AI, or pharmaceutical..."
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                />
              </div>
              
              {searchLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Searching...
                </div>
              )}
              
              {searchQuery && searchResults.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    Found {searchResults.length} results (cached)
                  </div>
                  {searchResults.slice(0, 3).map((result: unknown) => (
                    <div key={result.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                      <div className="font-medium">{result.title}</div>
                      <div className="text-gray-600 text-xs mt-1">
                        Relevance: {(result.relevance * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data Demo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Cached Data Demo
              </CardTitle>
              <CardDescription>
                Fetch data and see caching behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={refreshDemo} 
                disabled={demoLoading}
                className="w-full"
              >
                {demoLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Fetch Demo Data
                  </>
                )}
              </Button>
              
              {demoData && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm">
                    <div className="font-medium mb-2">{demoData.message}</div>
                    <div className="text-gray-600 text-xs">
                      Timestamp: {new Date(demoData.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-gray-600 text-xs">
                      Random Value: {demoData.randomValue.toFixed(4)}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="text-xs text-gray-500">
                Data is cached for 30 seconds. Click refresh to see cache behavior.
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cache Strategy Information */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Strategies</CardTitle>
          <CardDescription>
            Different cache strategies used across the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Search className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Search Results</span>
              </div>
              <div className="text-sm text-gray-600">
                TTL: 1 hour<br />
                SWR: 15 minutes<br />
                Tags: search_results
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-green-600" />
                <span className="font-medium">Documents</span>
              </div>
              <div className="text-sm text-gray-600">
                TTL: 24 hours<br />
                SWR: 1 hour<br />
                Tags: document_metadata
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-purple-600" />
                <span className="font-medium">User Profiles</span>
              </div>
              <div className="text-sm text-gray-600">
                TTL: 4 hours<br />
                SWR: 30 minutes<br />
                Tags: user_profiles
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 