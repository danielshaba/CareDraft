import { LRUCache } from 'lru-cache';

// Cache configuration interface
interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum cache size
  staleWhileRevalidate?: boolean; // Allow stale data while revalidating
  tags?: string[]; // Cache tags for invalidation
}

// Cache entry interface
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  tags?: string[];
  etag?: string;
  lastModified?: string;
}

// Cache key generation
export class CacheKeyGenerator {
  static generateKey(prefix: string, params: Record<string, unknown>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    return `${prefix}:${btoa(sortedParams)}`;
  }

  static generateTaggedKey(prefix: string, id: string | number): string {
    return `${prefix}:${id}`;
  }
}

// Memory cache implementation
export class MemoryCache {
  private cache: LRUCache<string, CacheEntry>;
  private tagMap: Map<string, Set<string>>;

  constructor(options: { max: number; ttl: number }) {
    this.cache = new LRUCache({
      max: options.max,
      ttl: options.ttl,
      updateAgeOnGet: true,
      updateAgeOnHas: true,
    });
    this.tagMap = new Map();
  }

  set<T>(key: string, data: T, config: CacheConfig): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: config.ttl,
      tags: config.tags,
    };

    this.cache.set(key, entry, { ttl: config.ttl });

    // Update tag map
    if (config.tags) {
      config.tags.forEach(tag => {
        if (!this.tagMap.has(tag)) {
          this.tagMap.set(tag, new Set());
        }
        this.tagMap.get(tag)!.add(key);
      });
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): void {
    const entry = this.cache.get(key);
    if (entry?.tags) {
      entry.tags.forEach(tag => {
        const tagSet = this.tagMap.get(tag);
        if (tagSet) {
          tagSet.delete(key);
          if (tagSet.size === 0) {
            this.tagMap.delete(tag);
          }
        }
      });
    }
    this.cache.delete(key);
  }

  invalidateByTag(tag: string): void {
    const keys = this.tagMap.get(tag);
    if (keys) {
      keys.forEach(key => this.cache.delete(key));
      this.tagMap.delete(tag);
    }
  }

  clear(): void {
    this.cache.clear();
    this.tagMap.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      max: this.cache.max,
      tags: this.tagMap.size,
    };
  }
}

// HTTP cache headers utility
export class HTTPCacheHeaders {
  static generateHeaders(ttl: number, options?: {
    staleWhileRevalidate?: number;
    mustRevalidate?: boolean;
    public?: boolean;
    etag?: string;
    lastModified?: Date;
  }): HeadersInit {
    const headers: HeadersInit = {};
    
    const maxAge = Math.floor(ttl / 1000);
    let cacheControl = options?.public ? 'public' : 'private';
    cacheControl += `, max-age=${maxAge}`;
    
    if (options?.staleWhileRevalidate) {
      cacheControl += `, stale-while-revalidate=${Math.floor(options.staleWhileRevalidate / 1000)}`;
    }
    
    if (options?.mustRevalidate) {
      cacheControl += ', must-revalidate';
    }
    
    headers['Cache-Control'] = cacheControl;
    
    if (options?.etag) {
      headers['ETag'] = options.etag;
    }
    
    if (options?.lastModified) {
      headers['Last-Modified'] = options.lastModified.toUTCString();
    }
    
    return headers;
  }

  static parseConditionalHeaders(request: Request): {
    ifNoneMatch?: string;
    ifModifiedSince?: Date;
  } {
    const ifNoneMatch = request.headers.get('If-None-Match');
    const ifModifiedSinceStr = request.headers.get('If-Modified-Since');
    const ifModifiedSince = ifModifiedSinceStr ? new Date(ifModifiedSinceStr) : undefined;
    
    return {
      ifNoneMatch: ifNoneMatch || undefined,
      ifModifiedSince,
    };
  }
}

// Cache presets for different data types
export const CACHE_PRESETS = {
  // Fast-changing data
  realtime: {
    ttl: 30 * 1000, // 30 seconds
    maxSize: 100,
    staleWhileRevalidate: true,
  },
  
  // User session data
  session: {
    ttl: 15 * 60 * 1000, // 15 minutes
    maxSize: 50,
    staleWhileRevalidate: true,
  },
  
  // Research results
  research: {
    ttl: 60 * 60 * 1000, // 1 hour
    maxSize: 200,
    staleWhileRevalidate: true,
  },
  
  // Document metadata
  documents: {
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    maxSize: 500,
    staleWhileRevalidate: true,
  },
  
  // User profiles
  profiles: {
    ttl: 4 * 60 * 60 * 1000, // 4 hours
    maxSize: 100,
    staleWhileRevalidate: true,
  },
  
  // Static content
  static: {
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxSize: 1000,
    staleWhileRevalidate: false,
  },
} as const;

// Main cache service
export class CacheService {
  private static instance: CacheService;
  private memoryCache: MemoryCache;
  
  private constructor() {
    this.memoryCache = new MemoryCache({
      max: 1000,
      ttl: 60 * 60 * 1000, // 1 hour default
    });
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // Get data from cache with fallback to fetch function
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    config: CacheConfig
  ): Promise<T> {
    // Try to get from memory cache first
    const cached = this.memoryCache.get<T>(key);
    if (cached) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetchFn();
    
    // Store in cache
    this.memoryCache.set(key, data, config);
    
    return data;
  }

  // Set data in cache
  set<T>(key: string, data: T, config: CacheConfig): void {
    this.memoryCache.set(key, data, config);
  }

  // Get data from cache
  get<T>(key: string): T | null {
    return this.memoryCache.get<T>(key);
  }

  // Check if key exists in cache
  has(key: string): boolean {
    return this.memoryCache.has(key);
  }

  // Delete specific key
  delete(key: string): void {
    this.memoryCache.delete(key);
  }

  // Invalidate by tag
  invalidateByTag(tag: string): void {
    this.memoryCache.invalidateByTag(tag);
  }

  // Clear all cache
  clear(): void {
    this.memoryCache.clear();
  }

  // Get cache statistics
  getStats() {
    return this.memoryCache.getStats();
  }
}

// Research-specific cache utilities
export class ResearchCacheManager {
  private cacheService: CacheService;

  constructor() {
    this.cacheService = CacheService.getInstance();
  }

  // Cache research session data
  async cacheResearchSession(sessionId: string, data: unknown): Promise<void> {
    const key = CacheKeyGenerator.generateTaggedKey('research_session', sessionId);
    this.cacheService.set(key, data, {
      ...CACHE_PRESETS.research,
      tags: ['research_sessions', `session_${sessionId}`],
    });
  }

  // Get cached research session
  getCachedResearchSession(sessionId: string): unknown | null {
    const key = CacheKeyGenerator.generateTaggedKey('research_session', sessionId);
    return this.cacheService.get(key);
  }

  // Cache search results
  async cacheSearchResults(query: string, filters: unknown, results: unknown): Promise<void> {
    const key = CacheKeyGenerator.generateKey('search_results', { query, filters });
    this.cacheService.set(key, results, {
      ...CACHE_PRESETS.research,
      tags: ['search_results', 'research_data'],
    });
  }

  // Get cached search results
  getCachedSearchResults(query: string, filters: unknown): unknown | null {
    const key = CacheKeyGenerator.generateKey('search_results', { query, filters });
    return this.cacheService.get(key);
  }

  // Invalidate research session cache
  invalidateResearchSession(sessionId: string): void {
    this.cacheService.invalidateByTag(`session_${sessionId}`);
  }

  // Invalidate all search results
  invalidateSearchResults(): void {
    this.cacheService.invalidateByTag('search_results');
  }
}

// Document cache manager
export class DocumentCacheManager {
  private cacheService: CacheService;

  constructor() {
    this.cacheService = CacheService.getInstance();
  }

  // Cache document metadata
  async cacheDocumentMetadata(documentId: string, metadata: unknown): Promise<void> {
    const key = CacheKeyGenerator.generateTaggedKey('document_metadata', documentId);
    this.cacheService.set(key, metadata, {
      ...CACHE_PRESETS.documents,
      tags: ['document_metadata', `document_${documentId}`],
    });
  }

  // Get cached document metadata
  getCachedDocumentMetadata(documentId: string): unknown | null {
    const key = CacheKeyGenerator.generateTaggedKey('document_metadata', documentId);
    return this.cacheService.get(key);
  }

  // Cache document list
  async cacheDocumentList(filters: unknown, documents: unknown[]): Promise<void> {
    const key = CacheKeyGenerator.generateKey('document_list', filters);
    this.cacheService.set(key, documents, {
      ...CACHE_PRESETS.documents,
      tags: ['document_lists'],
    });
  }

  // Get cached document list
  getCachedDocumentList(filters: unknown): unknown[] | null {
    const key = CacheKeyGenerator.generateKey('document_list', filters);
    return this.cacheService.get(key);
  }

  // Invalidate document cache
  invalidateDocument(documentId: string): void {
    this.cacheService.invalidateByTag(`document_${documentId}`);
  }

  // Invalidate all document lists
  invalidateDocumentLists(): void {
    this.cacheService.invalidateByTag('document_lists');
  }
}

// Export singleton instances
export const cacheService = CacheService.getInstance();
export const researchCacheManager = new ResearchCacheManager();
export const documentCacheManager = new DocumentCacheManager();

// Cache-aware fetch wrapper
export async function cachedFetch<T>(
  url: string,
  options: RequestInit & { 
    cacheKey?: string;
    cacheConfig?: CacheConfig;
    skipCache?: boolean;
  } = {}
): Promise<T> {
  const { cacheKey, cacheConfig, skipCache, ...fetchOptions } = options;
  
  // Generate cache key if not provided
  const key = cacheKey || CacheKeyGenerator.generateKey('fetch', { url, options: fetchOptions });
  
  // Skip cache if requested
  if (skipCache) {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
  
  // Use cache service with default config
  const defaultConfig = CACHE_PRESETS.research;
  const config = cacheConfig || defaultConfig;
  
  return cacheService.getOrFetch(
    key,
    async () => {
      const response = await fetch(url, fetchOptions);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    config
  );
} 