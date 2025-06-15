import { NextRequest, NextResponse } from 'next/server';
import { HTTPCacheHeaders, CACHE_PRESETS } from '@/lib/services/cache-service';

// Cache strategy configuration
interface CacheStrategy {
  ttl: number; // Cache duration in milliseconds
  staleWhileRevalidate?: number; // SWR duration in milliseconds
  mustRevalidate?: boolean; // Force revalidation
  public?: boolean; // Public or private cache
  tags?: string[]; // Cache tags for invalidation
}

// API response with cache headers
export class CachedResponse {
  static json<T>(data: T, strategy: CacheStrategy, init?: ResponseInit): NextResponse<T> {
    const headers = new Headers(init?.headers);
    
    // Add cache headers
    const cacheHeaders = HTTPCacheHeaders.generateHeaders(strategy.ttl, {
      staleWhileRevalidate: strategy.staleWhileRevalidate,
      mustRevalidate: strategy.mustRevalidate,
      public: strategy.public,
    });
    
    Object.entries(cacheHeaders).forEach(([key, value]) => {
      headers.set(key, value as string);
    });
    
    // Add custom cache tags
    if (strategy.tags) {
      headers.set('Cache-Tags', strategy.tags.join(','));
    }
    
    // Add Vary header for conditional requests
    headers.set('Vary', 'Accept-Encoding, If-None-Match, If-Modified-Since');
    
    return NextResponse.json(data, {
      ...init,
      headers,
    });
  }

  static notModified(etag?: string): NextResponse {
    const headers = new Headers();
    if (etag) {
      headers.set('ETag', etag);
    }
    headers.set('Cache-Control', 'max-age=0, must-revalidate');
    
    return new NextResponse(null, {
      status: 304,
      headers,
    });
  }

  static withConditionalHeaders<T>(
    request: NextRequest,
    data: T,
    strategy: CacheStrategy,
    etag?: string,
    lastModified?: Date
  ): NextResponse<T> | NextResponse {
    const conditionalHeaders = HTTPCacheHeaders.parseConditionalHeaders(request);
    
    // Check if client has current version
    if (etag && conditionalHeaders.ifNoneMatch === etag) {
      return this.notModified(etag);
    }
    
    if (lastModified && conditionalHeaders.ifModifiedSince) {
      if (lastModified <= conditionalHeaders.ifModifiedSince) {
        return this.notModified(etag);
      }
    }
    
    // Return data with cache headers
    const headers = new Headers();
    const cacheHeaders = HTTPCacheHeaders.generateHeaders(strategy.ttl, {
      staleWhileRevalidate: strategy.staleWhileRevalidate,
      mustRevalidate: strategy.mustRevalidate,
      public: strategy.public,
      etag,
      lastModified,
    });
    
    Object.entries(cacheHeaders).forEach(([key, value]) => {
      headers.set(key, value as string);
    });
    
    if (strategy.tags) {
      headers.set('Cache-Tags', strategy.tags.join(','));
    }
    
    headers.set('Vary', 'Accept-Encoding, If-None-Match, If-Modified-Since');
    
    return NextResponse.json(data, { headers });
  }
}

// Predefined cache strategies
export const CACHE_STRATEGIES = {
  // Research session data (frequently updated)
  researchSession: {
    ttl: CACHE_PRESETS.session.ttl,
    staleWhileRevalidate: 5 * 60 * 1000, // 5 minutes
    public: false,
    tags: ['research_sessions'],
  },
  
  // Document metadata (rarely updated)
  documentMetadata: {
    ttl: CACHE_PRESETS.documents.ttl,
    staleWhileRevalidate: 60 * 60 * 1000, // 1 hour
    public: true,
    tags: ['document_metadata'],
  },
  
  // Search results (moderately updated)
  searchResults: {
    ttl: CACHE_PRESETS.research.ttl,
    staleWhileRevalidate: 15 * 60 * 1000, // 15 minutes
    public: false,
    tags: ['search_results'],
  },
  
  // User profiles (occasionally updated)
  userProfile: {
    ttl: CACHE_PRESETS.profiles.ttl,
    staleWhileRevalidate: 30 * 60 * 1000, // 30 minutes
    public: false,
    tags: ['user_profiles'],
  },
  
  // Static content (rarely updated)
  staticContent: {
    ttl: CACHE_PRESETS.static.ttl,
    staleWhileRevalidate: 24 * 60 * 60 * 1000, // 24 hours
    public: true,
    tags: ['static_content'],
  },
  
  // Real-time data (frequently updated)
  realtime: {
    ttl: CACHE_PRESETS.realtime.ttl,
    staleWhileRevalidate: 10 * 1000, // 10 seconds
    public: false,
    mustRevalidate: true,
    tags: ['realtime'],
  },
} as const;

// Utility to generate ETag from data
export function generateETag(data: unknown): string {
  const hash = Array.from(
    new Uint8Array(
      new TextEncoder().encode(JSON.stringify(data))
    )
  )
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
  
  return `"${hash}"`;
}

// Middleware for cache invalidation
export class CacheInvalidation {
  private static instance: CacheInvalidation;
  private invalidationQueue: Set<string> = new Set();
  
  static getInstance(): CacheInvalidation {
    if (!CacheInvalidation.instance) {
      CacheInvalidation.instance = new CacheInvalidation();
    }
    return CacheInvalidation.instance;
  }
  
  // Queue cache tag for invalidation
  queueInvalidation(tag: string): void {
    this.invalidationQueue.add(tag);
  }
  
  // Process invalidation queue
  async processInvalidations(): Promise<void> {
    if (this.invalidationQueue.size === 0) return;
    
    // In a real implementation, this would call your CDN/cache service API
    // For now, we'll just log the invalidations
    console.log('Invalidating cache tags:', Array.from(this.invalidationQueue));
    
    // Clear the queue
    this.invalidationQueue.clear();
  }
  
  // Get queued invalidations
  getQueuedInvalidations(): string[] {
    return Array.from(this.invalidationQueue);
  }
}

// Helper for API route caching
export function withCache<T = any>(
  handler: (request: NextRequest) => Promise<T>,
  strategy: CacheStrategy
) {
  return async (request: NextRequest): Promise<NextResponse<T> | NextResponse> => {
    try {
      const data = await handler(request);
      
      // Generate ETag for the response
      const etag = generateETag(data);
      
      // Check conditional headers
      return CachedResponse.withConditionalHeaders(
        request,
        data,
        strategy,
        etag,
        new Date()
      );
    } catch (error: unknown) {
      console.error('API handler error:', error instanceof Error ? error.message : 'Unknown error');
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Cache invalidation helper for mutations
export async function invalidateCache(tags: string[]): Promise<void> {
  const invalidation = CacheInvalidation.getInstance();
  
  tags.forEach(tag => {
    invalidation.queueInvalidation(tag);
  });
  
  // Process invalidations immediately for now
  // In production, you might batch these or process them async
  await invalidation.processInvalidations();
}

// Edge cache configuration
export const EDGE_CACHE_CONFIG = {
  // Browser cache settings
  browser: {
    maxAge: 60, // 1 minute
    sMaxAge: 300, // 5 minutes for shared caches
    staleWhileRevalidate: 86400, // 24 hours
  },
  
  // CDN cache settings
  cdn: {
    maxAge: 300, // 5 minutes
    sMaxAge: 3600, // 1 hour for shared caches
    staleWhileRevalidate: 86400, // 24 hours
  },
  
  // Static assets
  static: {
    maxAge: 31536000, // 1 year
    immutable: true,
  },
};

// Helper to set edge cache headers
export function setEdgeCacheHeaders(
  response: NextResponse,
  config: typeof EDGE_CACHE_CONFIG.browser
): void {
  const cacheControl = [];
  
  if (config.maxAge) {
    cacheControl.push(`max-age=${config.maxAge}`);
  }
  
  if (config.sMaxAge) {
    cacheControl.push(`s-maxage=${config.sMaxAge}`);
  }
  
  if (config.staleWhileRevalidate) {
    cacheControl.push(`stale-while-revalidate=${config.staleWhileRevalidate}`);
  }
  
  if ('immutable' in config && config.immutable) {
    cacheControl.push('immutable');
  }
  
  response.headers.set('Cache-Control', cacheControl.join(', '));
} 