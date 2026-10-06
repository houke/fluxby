/**
 * Fluxby Landing Page Service Worker
 * Provides offline support for landing page, docs, and help center
 * Uses Network-First strategy to always serve fresh content when online
 */

/* global self, caches, URL, fetch, location */

const BASE_PATH = new URL('./', self.registration.scope).pathname;
const CACHE_PREFIX = `fluxby-landing-${encodeURIComponent(BASE_PATH)}-v1-`;
const BUILD_REVISION = 'development';
const CACHE_NAME = `${CACHE_PREFIX}${BUILD_REVISION}`;
// The production build fills this list with every page chunk and dependency.
const BUILD_ASSETS = [];

// Static assets to precache
const PRECACHE_ASSETS = [
  BASE_PATH,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}favicon.svg`,
  ...BUILD_ASSETS,
];

// Patterns for cacheable content (docs, help, static assets)
const CACHEABLE_PATTERNS = ['docs', 'help', 'assets/', 'fonts/'].map(
  (path) => `${BASE_PATH}${path}`
);

// Install event - precache core assets
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
        let legacyIsOwned = false;
        if (BASE_PATH === '/' && cacheNames.includes('fluxby-landing-v1')) {
          const legacy = await caches.open('fluxby-landing-v1');
          const requests = await legacy.keys();
          legacyIsOwned = requests.every((request) => {
            const path = new URL(request.url).pathname;
            return (
              PRECACHE_ASSETS.includes(path) ||
              CACHEABLE_PATTERNS.some((pattern) => path.startsWith(pattern))
            );
          });
        }
        const previousBuilds = cacheNames.filter(
          (name) =>
            (name.startsWith(CACHE_PREFIX) ||
              (name === 'fluxby-landing-v1' && legacyIsOwned)) &&
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
  if (BASE_PATH === '/' && cacheNames.includes('fluxby-landing-v1')) {
    const legacy = await caches.open('fluxby-landing-v1');
    const requests = await legacy.keys();
    if (
      requests.every((entry) => {
        const path = new URL(entry.url).pathname;
        return (
          PRECACHE_ASSETS.includes(path) ||
          CACHEABLE_PATTERNS.some((pattern) => path.startsWith(pattern))
        );
      })
    ) {
      return legacy.match(request);
    }
  }
}

/**
 * Check if a request path should be cached
 */
function isCacheable(url) {
  const pathname = url.pathname;

  // Don't cache /app/* - that has its own service worker
  if (pathname.startsWith(`${BASE_PATH}app`)) {
    return false;
  }

  // Don't cache API requests
  if (pathname.startsWith(`${BASE_PATH}api`)) {
    return false;
  }

  // Cache docs, help, and static assets
  for (const pattern of CACHEABLE_PATTERNS) {
    if (pathname.startsWith(pattern)) {
      return true;
    }
  }

  // Cache the root and any direct HTML pages
  if (pathname === BASE_PATH || pathname.endsWith('.html')) {
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
  if (url.pathname.startsWith(`${BASE_PATH}app`)) {
    return;
  }

  // Skip API requests
  if (url.pathname.startsWith(`${BASE_PATH}api`)) {
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

        return networkResponse;
      } catch (error) {
        // Network failed, try cache
        const cachedResponse = await matchCachedResponse(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // If navigating to a page and no cache, try to return cached index.html
        // This enables client-side routing to work offline
        if (request.mode === 'navigate') {
          const currentCache = await caches.open(CACHE_NAME);
          const cachedIndex = await currentCache.match(
            `${BASE_PATH}index.html`
          );
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
  // Only accept messages from same origin (CodeQL js/missing-origin-check)
  if (event.origin && event.origin !== self.location.origin) return;

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
