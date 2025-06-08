import { useCallback, useEffect, useState, useRef } from 'react';
import { 
  cacheService, 
  researchCacheManager, 
  documentCacheManager,
  CacheKeyGenerator,
  CACHE_PRESETS,
  type CacheConfig
} from '@/lib/services/cache-service';

// Hook for cached data fetching
export function useCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  config?: Partial<CacheConfig>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const finalConfig: CacheConfig = {
    ttl: config?.ttl || CACHE_PRESETS.research.ttl,
    maxSize: config?.maxSize || CACHE_PRESETS.research.maxSize,
    staleWhileRevalidate: config?.staleWhileRevalidate ?? CACHE_PRESETS.research.staleWhileRevalidate,
    tags: config?.tags || [],
  };

  const fetchData = useCallback(async (forceRefresh = false) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      setError(null);

      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = cacheService.get<T>(key);
        if (cached) {
          setData(cached);
          setLoading(false);
          return cached;
        }
      }

      // Fetch fresh data
      const result = await fetchFn();
      
      // Check if request was aborted
      if (abortControllerRef.current.signal.aborted) {
        return;
      }

      // Cache the result
      cacheService.set(key, result, finalConfig);
      setData(result);
      
      return result;
    } catch {
      if (!abortControllerRef.current.signal.aborted) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, [key, fetchFn, finalConfig]);

  const refresh = useCallback(() => fetchData(true), [fetchData]);
  
  const invalidate = useCallback(() => {
    cacheService.delete(key);
    if (finalConfig.tags) {
      finalConfig.tags.forEach(tag => cacheService.invalidateByTag(tag));
    }
  }, [key, finalConfig.tags]);

  useEffect(() => {
    fetchData();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    invalidate,
  };
}

// Hook for research session caching
export function useCachedResearchSession(sessionId: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        // Try cache first
        const cached = researchCacheManager.getCachedResearchSession(sessionId);
        if (cached) {
          setData(cached);
          setLoading(false);
          return;
        }

        // Simulate API call - replace with actual API endpoint
        const response = await fetch(`/api/research/sessions/${sessionId}`);
        if (response.ok) {
          const sessionData = await response.json();
          await researchCacheManager.cacheResearchSession(sessionId, sessionData);
          setData(sessionData);
        }
      } catch {
        console.error('Error fetching research session:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  const updateSession = useCallback(async (updates: unknown) => {
    try {
      // Optimistically update cache
      const updatedData = { ...data, ...updates };
      await researchCacheManager.cacheResearchSession(sessionId, updatedData);
      setData(updatedData);

      // Update on server - replace with actual API call
      await fetch(`/api/research/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch {
      console.error('Error updating research session:', error);
      // Invalidate cache on error
      researchCacheManager.invalidateResearchSession(sessionId);
    }
  }, [sessionId, data]);

  const invalidateSession = useCallback(() => {
    researchCacheManager.invalidateResearchSession(sessionId);
    setData(null);
  }, [sessionId]);

  return {
    data,
    loading,
    updateSession,
    invalidateSession,
  };
}

// Hook for document metadata caching
export function useCachedDocumentMetadata(documentId: string) {
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        // Try cache first
        const cached = documentCacheManager.getCachedDocumentMetadata(documentId);
        if (cached) {
          setMetadata(cached);
          setLoading(false);
          return;
        }

        // Simulate API call - replace with actual API endpoint
        const response = await fetch(`/api/documents/${documentId}/metadata`);
        if (response.ok) {
          const metadataData = await response.json();
          await documentCacheManager.cacheDocumentMetadata(documentId, metadataData);
          setMetadata(metadataData);
        }
      } catch {
        console.error('Error fetching document metadata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [documentId]);

  const invalidateDocument = useCallback(() => {
    documentCacheManager.invalidateDocument(documentId);
    setMetadata(null);
  }, [documentId]);

  return {
    metadata,
    loading,
    invalidateDocument,
  };
}

// Hook for search results caching
export function useCachedSearchResults(query: string, filters: unknown = {}) {
  const [results, setResults] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastQuery, setLastQuery] = useState<string>('');

  const searchKey = CacheKeyGenerator.generateKey('search_results', { query, filters });

  useEffect(() => {
    if (!query.trim() || query === lastQuery) {
      return;
    }

    const performSearch = async () => {
      try {
        setLoading(true);
        
        // Try cache first
        const cached = researchCacheManager.getCachedSearchResults(query, filters);
        if (cached) {
          setResults(cached);
          setLoading(false);
          setLastQuery(query);
          return;
        }

        // Simulate API call - replace with actual search API
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, filters }),
        });

        if (response.ok) {
          const searchResults = await response.json();
          await researchCacheManager.cacheSearchResults(query, filters, searchResults);
          setResults(searchResults);
          setLastQuery(query);
        }
      } catch {
        console.error('Error performing search:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, filters, lastQuery]);

  const clearSearch = useCallback(() => {
    setResults([]);
    setLastQuery('');
    researchCacheManager.invalidateSearchResults();
  }, []);

  return {
    results,
    loading,
    clearSearch,
  };
}

// Hook for cache statistics monitoring
export function useCacheStats() {
  const [stats, setStats] = useState(cacheService.getStats());

  useEffect(() => {
    const updateStats = () => {
      setStats(cacheService.getStats());
    };

    // Update stats every 5 seconds
    const interval = setInterval(updateStats, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const clearCache = useCallback(() => {
    cacheService.clear();
    setStats(cacheService.getStats());
  }, []);

  return {
    stats,
    clearCache,
  };
}

// Hook for cache invalidation management
export function useCacheInvalidation() {
  const invalidateByTag = useCallback((tag: string) => {
    cacheService.invalidateByTag(tag);
  }, []);

  const invalidateKey = useCallback((key: string) => {
    cacheService.delete(key);
  }, []);

  const clearAllCache = useCallback(() => {
    cacheService.clear();
  }, []);

  return {
    invalidateByTag,
    invalidateKey,
    clearAllCache,
  };
}

// Hook for prefetching data
export function usePrefetch() {
  const prefetch = useCallback(async <T>(
    key: string,
    fetchFn: () => Promise<T>,
    config?: Partial<CacheConfig>
  ) => {
    // Don't prefetch if data already exists in cache
    if (cacheService.has(key)) {
      return;
    }

    try {
      const data = await fetchFn();
      const finalConfig: CacheConfig = {
        ttl: config?.ttl || CACHE_PRESETS.research.ttl,
        maxSize: config?.maxSize || CACHE_PRESETS.research.maxSize,
        staleWhileRevalidate: config?.staleWhileRevalidate ?? true,
        tags: config?.tags || [],
      };
      
      cacheService.set(key, data, finalConfig);
    } catch {
      console.warn('Prefetch failed for key:', key, error);
    }
  }, []);

  return { prefetch };
} 