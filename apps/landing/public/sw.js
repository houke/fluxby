/**
 * Fluxby Landing Page Service Worker
 * Provides offline support for landing page, docs, and help center
 * Uses Network-First strategy to always serve fresh content when online
 */

/* global self, caches, URL, fetch, location */

const CACHE_NAME = 'fluxby-landing-v1';

// Static assets to precache
const PRECACHE_ASSETS = ['/', '/index.html', '/favicon.svg', '/manifest.json'];

// Patterns for cacheable content (docs, help, static assets)
const CACHEABLE_PATTERNS = ['/docs', '/help', '/assets/', '/fonts/'];

// Install event - precache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(
            (name) => name.startsWith('fluxby-landing-') && name !== CACHE_NAME
          )
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

/**
 * Check if a request path should be cached
 */
function isCacheable(url) {
  const pathname = url.pathname;

  // Don't cache /app/* - that has its own service worker
  if (pathname.startsWith('/app')) {
    return false;
  }

  // Don't cache API requests
  if (pathname.startsWith('/api')) {
    return false;
  }

  // Cache docs, help, and static assets
  for (const pattern of CACHEABLE_PATTERNS) {
    if (pathname.startsWith(pattern)) {
      return true;
    }
  }

  // Cache the root and any direct HTML pages
  if (pathname === '/' || pathname.endsWith('.html')) {
    return true;
  }

  // Cache JS, CSS, images, fonts
  if (/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/.test(pathname)) {
    return true;
  }

  return false;
}

// Fetch event - Network-First with fallback to cache
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (url.origin !== location.origin || request.method !== 'GET') {
    return;
  }

  // Skip /app/* requests - handled by web app's SW
  if (url.pathname.startsWith('/app')) {
    return;
  }

  // Skip API requests
  if (url.pathname.startsWith('/api')) {
    return;
  }

  // Network-First strategy: try network, fall back to cache
  event.respondWith(
    (async () => {
      try {
        // Always try network first
        const networkResponse = await fetch(request);

        // Cache successful responses for cacheable content
        if (networkResponse.ok && isCacheable(url)) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
        }

        return networkResponse;
      } catch (error) {
        // Network failed, try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // If navigating to a page and no cache, try to return cached index.html
        // This enables client-side routing to work offline
        if (request.mode === 'navigate') {
          const cachedIndex = await caches.match('/index.html');
          if (cachedIndex) {
            return cachedIndex;
          }
        }

        // Nothing in cache, throw the original error
        throw error;
      }
    })()
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }

  if (event.data === 'clearCache') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        if (event.ports[0]) {
          event.ports[0].postMessage({ success: true });
        }
      })
    );
  }
});
