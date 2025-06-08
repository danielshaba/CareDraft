const CACHE_NAME = 'caredraft-v1';
const STATIC_CACHE = 'caredraft-static-v1';
const DYNAMIC_CACHE = 'caredraft-dynamic-v1';
const DRAFT_CACHE = 'caredraft-drafts-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/draft-builder',
  '/knowledge-hub',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
];

// API endpoints that should be cached
const CACHEABLE_APIS = [
  '/api/search',
  '/api/research/sessions',
  '/api/documents',
  '/api/drafts',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker: Static assets cached');
        self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Failed to cache static assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== DRAFT_CACHE &&
                cacheName !== CACHE_NAME) {
              console.log('🗑️ Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activated');
        self.clients.claim();
      })
  );
});

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle different types of requests
  if (request.method === 'GET') {
    if (url.pathname.startsWith('/api/')) {
      // API requests - network first, then cache
      event.respondWith(handleApiRequest(request));
    } else if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
      // Static assets - cache first, then network
      event.respondWith(handleStaticAsset(request));
    } else {
      // HTML pages - stale while revalidate
      event.respondWith(handlePageRequest(request));
    }
  } else if (request.method === 'POST' || request.method === 'PUT') {
    // Handle background sync for write operations
    event.respondWith(handleWriteRequest(request));
  }
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const shouldCache = CACHEABLE_APIS.some(api => url.pathname.startsWith(api));
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && shouldCache) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    if (shouldCache) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        console.log('📱 Service Worker: Serving API from cache', request.url);
        
        // Add offline indicator header
        const headers = new Headers(cachedResponse.headers);
        headers.set('X-Served-From', 'cache');
        headers.set('X-Cache-Date', cachedResponse.headers.get('Date') || '');
        
        return new Response(cachedResponse.body, {
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          headers: headers
        });
      }
    }
    
    // Return offline response
    return createOfflineResponse(request);
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Serve from cache and update in background
    updateCacheInBackground(request);
    return cachedResponse;
  }
  
  try {
    // Not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return fallback for images
    if (request.url.match(/\.(png|jpg|jpeg|gif|svg)$/)) {
      return new Response(
        '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#f0f0f0"/><text x="100" y="100" text-anchor="middle" dy=".3em" fill="#666">Image unavailable</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    
    throw error;
  }
}

// Handle page requests with stale-while-revalidate
async function handlePageRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Serve stale content immediately
    updateCacheInBackground(request);
    return cachedResponse;
  }
  
  try {
    // Not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Serve offline page
    return caches.match('/offline') || createOfflineResponse(request);
  }
}

// Handle write requests with background sync
async function handleWriteRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    // Store for background sync
    await storeForBackgroundSync(request);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Request queued for background sync',
        offline: true
      }),
      {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Update cache in background
async function updateCacheInBackground(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse);
    }
  } catch (error) {
    // Ignore background update failures
    console.warn('Background cache update failed', error);
  }
}

// Store request for background sync
async function storeForBackgroundSync(request) {
  const requestData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.text(),
    timestamp: Date.now()
  };
  
  // Store in IndexedDB or use registration.sync
  try {
    // Register background sync
    await self.registration.sync.register('background-sync');
    
    // Store request data
    const cache = await caches.open(DRAFT_CACHE);
    const response = new Response(JSON.stringify(requestData));
    await cache.put('sync-' + Date.now(), response);
    
    console.log('📥 Service Worker: Request stored for background sync');
  } catch (error) {
    console.error('Failed to store request for background sync', error);
  }
}

// Create offline response
function createOfflineResponse(request) {
  const url = new URL(request.url);
  
  if (url.pathname.startsWith('/api/')) {
    return new Response(
      JSON.stringify({
        error: 'Network unavailable',
        message: 'This request requires an internet connection',
        offline: true,
        cached: false
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  return new Response(
    '<!DOCTYPE html><html><head><title>Offline - CareDraft</title><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:system-ui,sans-serif;text-align:center;padding:2rem;background:#f8fafc}.container{max-width:500px;margin:0 auto;background:white;padding:2rem;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.1)}.icon{font-size:4rem;margin-bottom:1rem}h1{color:#334155;margin-bottom:1rem}p{color:#64748b;line-height:1.6}.retry-btn{background:#3b82f6;color:white;border:none;padding:0.75rem 1.5rem;border-radius:6px;cursor:pointer;margin-top:1rem}</style></head><body><div class="container"><div class="icon">📱</div><h1>You\'re Offline</h1><p>CareDraft is currently unavailable. Please check your internet connection and try again. Some cached content may still be available.</p><button class="retry-btn" onclick="window.location.reload()">Try Again</button></div></body></html>',
    {
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    }
  );
}

// Background sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Service Worker: Background sync triggered');
    event.waitUntil(performBackgroundSync());
  }
});

// Perform background sync
async function performBackgroundSync() {
  try {
    const cache = await caches.open(DRAFT_CACHE);
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('sync-')) {
        try {
          const response = await cache.match(request);
          const requestData = await response.json();
          
          // Retry the request
          const retryResponse = await fetch(requestData.url, {
            method: requestData.method,
            headers: requestData.headers,
            body: requestData.body
          });
          
          if (retryResponse.ok) {
            // Success - remove from sync queue
            await cache.delete(request);
            console.log('✅ Service Worker: Background sync successful', requestData.url);
            
            // Notify client of successful sync
            self.clients.matchAll().then(clients => {
              clients.forEach(client => {
                client.postMessage({
                  type: 'SYNC_SUCCESS',
                  url: requestData.url
                });
              });
            });
          }
        } catch (error) {
          console.warn('Background sync failed for request', error);
        }
      }
    }
  } catch (error) {
    console.error('Background sync error', error);
  }
}

// Push notification event
self.addEventListener('push', (event) => {
  console.log('🔔 Service Worker: Push notification received');
  
  const options = {
    body: 'New collaboration update available',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'collaboration-update',
    actions: [
      {
        action: 'view',
        title: 'View Update',
        icon: '/icon-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icon-dismiss.png'
      }
    ]
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.message || options.body;
    options.tag = data.tag || options.tag;
  }
  
  event.waitUntil(
    self.registration.showNotification('CareDraft', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

// Message event - handle messages from clients
self.addEventListener('message', (event) => {
  console.log('💬 Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'PERFORMANCE_ALERT') {
    // Handle performance alerts
    console.warn('⚠️ Performance alert:', event.data.data);
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('🎯 Service Worker: Script loaded');
