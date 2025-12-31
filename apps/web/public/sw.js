/**
 * COI (Cross-Origin Isolation) Service Worker
 * Enables SharedArrayBuffer for high-performance SQLite OPFS
 *
 * This service worker adds the necessary headers to enable cross-origin isolation,
 * which is required for SharedArrayBuffer (used by SQLite WASM for better performance).
 *
 * Uses Network-First strategy to always serve fresh content when online.
 */

/* global self, caches, URL, Headers, Response, fetch, location */

const CACHE_NAME = 'fluxby-v3';
const BASE_PATH = '/app';

// Files to cache for offline support (relative to base path)
const PRECACHE_ASSETS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/favicon.svg`,
];

// Install event - precache assets
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
          .filter((name) => name.startsWith('fluxby-v') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - Network-First with COI headers
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip API requests
  if (url.pathname.startsWith('/api')) {
    return;
  }

  event.respondWith(
    (async () => {
      // Network-First: Always try to get fresh content when online
      try {
        const networkResponse = await fetch(request);

        // Cache successful GET responses for app routes
        if (
          request.method === 'GET' &&
          networkResponse.ok &&
          url.pathname.startsWith(BASE_PATH)
        ) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
        }

        // Add COI headers
        return addCOIHeaders(networkResponse);
      } catch (error) {
        // Network failed - try cache (offline mode)
        if (request.method === 'GET') {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return addCOIHeaders(cachedResponse);
          }
        }

        // If navigating to app and no cache, return cached index
        if (request.mode === 'navigate' && url.pathname.startsWith(BASE_PATH)) {
          const cachedIndex = await caches.match(`${BASE_PATH}/index.html`);
          if (cachedIndex) {
            return addCOIHeaders(cachedIndex);
          }
        }

        throw error;
      }
    })()
  );
});

/**
 * Add Cross-Origin Isolation headers to response
 * Required for SharedArrayBuffer
 */
function addCOIHeaders(response) {
  // Clone the response to modify headers
  const newHeaders = new Headers(response.headers);

  // Add Cross-Origin headers for SharedArrayBuffer support
  newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
  newHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }

  if (event.data === 'clearCache') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});
