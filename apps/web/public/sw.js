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

const BASE_PATH = new URL('./', self.registration.scope).pathname.replace(
  /\/$/,
  ''
);
const CACHE_PREFIX = `fluxby-web-${encodeURIComponent(BASE_PATH)}-v3-`;
const BUILD_REVISION = 'development';
const CACHE_NAME = `${CACHE_PREFIX}${BUILD_REVISION}`;
// The production build fills this list with every page chunk and dependency.
const BUILD_ASSETS = [];

// Files to cache for offline support (relative to base path)
const PRECACHE_ASSETS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/favicon.svg`,
  ...BUILD_ASSETS,
];

// Install event - precache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS);
      })
      .catch(async (error) => {
        await caches.delete(CACHE_NAME);
        throw error;
      })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then(async (cacheNames) => {
        // Retire a shared legacy cache only when every entry belongs to this scope.
        let legacyIsOwned = false;
        if (cacheNames.includes('fluxby-v3')) {
          const legacy = await caches.open('fluxby-v3');
          const requests = await legacy.keys();
          legacyIsOwned = requests.every((request) =>
            new URL(request.url).pathname.startsWith(`${BASE_PATH}/`)
          );
        }
        const previousBuilds = cacheNames.filter(
          (name) =>
            (name.startsWith(CACHE_PREFIX) ||
              (name === 'fluxby-v3' && legacyIsOwned)) &&
            name !== CACHE_NAME
        );
        // Keep the preceding build for already-open tabs while bounding disk use.
        return Promise.all(
          previousBuilds.slice(0, -1).map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

/** Look only in this deployment's retained builds after the current cache. */
async function matchCachedResponse(request) {
  const currentCache = await caches.open(CACHE_NAME);
  const currentResponse = await currentCache.match(request);
  if (currentResponse) return currentResponse;

  const cacheNames = await caches.keys();
  for (const name of cacheNames.reverse()) {
    if (name === CACHE_NAME || !name.startsWith(CACHE_PREFIX)) continue;
    const response = await (await caches.open(name)).match(request);
    if (response) return response;
  }
  // Legacy versions shared a name across deployments. Only use an owned cache.
  if (cacheNames.includes('fluxby-v3')) {
    const legacy = await caches.open('fluxby-v3');
    const requests = await legacy.keys();
    if (
      requests.every((entry) =>
        new URL(entry.url).pathname.startsWith(`${BASE_PATH}/`)
      )
    ) {
      return legacy.match(request);
    }
  }
}

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
          (url.pathname === BASE_PATH ||
            url.pathname.startsWith(`${BASE_PATH}/`))
        ) {
          // Keep the write alive without delaying the network response. Storage
          // failures must not turn a successful request into an offline failure.
          const cacheResponse = networkResponse.clone();
          event.waitUntil(
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, cacheResponse))
              .catch(() => {})
          );
        }

        // Add COI headers
        return addCOIHeaders(networkResponse);
      } catch (error) {
        // Network failed - try cache (offline mode)
        if (request.method === 'GET') {
          const cachedResponse = await matchCachedResponse(request);
          if (cachedResponse) {
            return addCOIHeaders(cachedResponse);
          }
        }

        // If navigating to app and no cache, return cached index
        if (
          request.mode === 'navigate' &&
          (url.pathname === BASE_PATH ||
            url.pathname.startsWith(`${BASE_PATH}/`))
        ) {
          const currentCache = await caches.open(CACHE_NAME);
          const cachedIndex = await currentCache.match(
            `${BASE_PATH}/index.html`
          );
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
  // Only accept messages from same origin (CodeQL js/missing-origin-check)
  if (event.origin && event.origin !== self.location.origin) return;

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
