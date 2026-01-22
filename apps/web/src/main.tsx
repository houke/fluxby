import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { consumeSessionRedirect, getRedirectToRestore } from '@fluxby/shared';
import { initializeSettingsCache } from '@fluxby/database';
import App from './App';
import './index.css';

// GitHub Pages SPA fallback: a custom 404.html stores the original URL in sessionStorage
// and redirects to /app/. Restore that original URL before React Router mounts.
const pendingRedirect = consumeSessionRedirect(window.sessionStorage);
if (pendingRedirect) {
  const basePath = import.meta.env.BASE_URL || '/app/';
  const restored = getRedirectToRestore(pendingRedirect, basePath);
  if (restored) {
    window.history.replaceState(null, '', restored);
  }
}

// Force trailing slash for consistent routing
// This prevents issues with base path mismatch
const basePath = import.meta.env.BASE_URL || '/app/';
if (
  window.location.pathname === basePath.replace(/\/$/, '') && // e.g., /app without trailing slash
  !window.location.pathname.endsWith('/')
) {
  // Redirect to add trailing slash
  window.location.replace(
    window.location.pathname +
      '/' +
      window.location.search +
      window.location.hash
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
    mutations: {
      retry: 0,
    },
  },
});

const rootElement = document.getElementById('root');

// Show error on screen for debugging (especially in Tauri where console isn't visible)
function showErrorOnScreen(message: string, error: unknown) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText =
    'position:fixed;top:0;left:0;right:0;bottom:0;background:#1a1a2e;color:#fff;padding:40px;font-family:monospace;white-space:pre-wrap;overflow:auto;z-index:99999';
  errorDiv.innerHTML = `<h1 style="color:#f87171">App Initialization Error</h1><p>${message}</p><pre style="background:#0f0f1a;padding:20px;border-radius:8px;margin-top:20px">${error instanceof Error ? error.stack || error.message : String(error)}</pre>`;
  document.body.appendChild(errorDiv);
}

/**
 * Register service worker and wait for it to be ready.
 * This is critical for iOS Safari where OPFS operations may hang
 * without the Cross-Origin Isolation headers provided by the SW.
 *
 * On first visit, we need the SW to be active before OPFS operations.
 * On subsequent visits, the SW is already controlling the page.
 */
async function ensureServiceWorkerReady(): Promise<void> {
  const isTauri = '__TAURI__' in window;

  // Skip SW in Tauri - it uses native storage
  if (isTauri || !('serviceWorker' in navigator)) {
    // eslint-disable-next-line no-console
    console.log('[SW] Skipped (Tauri or no SW support)');
    return;
  }

  const swPath = `${basePath}sw.js`;

  try {
    // Check if we already have an active SW controlling this page
    if (navigator.serviceWorker.controller) {
      // eslint-disable-next-line no-console
      console.log('[SW] Already controlling page');
      return;
    }

    // eslint-disable-next-line no-console
    console.log('[SW] First visit - registering and waiting for activation...');

    // Register the service worker
    const registration = await navigator.serviceWorker.register(swPath, {
      scope: basePath,
    });
    // eslint-disable-next-line no-console
    console.log('[SW] Registered:', registration.scope);

    // Wait for the SW to be ready (installed and activated)
    // This ensures COOP/COEP headers will be applied on next navigation
    await navigator.serviceWorker.ready;
    // eslint-disable-next-line no-console
    console.log('[SW] Ready');

    // For first-time visitors, the SW won't control the page until reload.
    // Check if we need to reload to get the SW-provided headers.
    // Only do this on browsers that need it (check for cross-origin isolation)
    const needsCOI =
      typeof SharedArrayBuffer === 'undefined' &&
      !navigator.serviceWorker.controller;

    if (needsCOI) {
      // eslint-disable-next-line no-console
      console.log(
        '[SW] First visit without COI - reloading to activate SW headers...'
      );
      // Small delay to ensure SW is fully ready
      await new Promise((resolve) => setTimeout(resolve, 100));
      // Reload to get the SW-controlled page with proper headers
      window.location.reload();
      // Return a never-resolving promise since we're reloading
      return new Promise(() => {
        /* noop - waiting for reload */
      });
    }
  } catch (error) {
    // SW registration failed - continue without it
    // This is not fatal, but OPFS performance may be degraded
    console.warn('[SW] Registration failed:', error);
  }
}

// Initialize OPFS settings cache before rendering
// This allows synchronous access to settings during initial render
async function initializeApp() {
  try {
    // Log environment info
    const isTauri = '__TAURI__' in window;
    // eslint-disable-next-line no-console
    console.log('[Init] Environment:', {
      isTauri,
      userAgent: navigator.userAgent,
    });

    await initializeSettingsCache();
    // eslint-disable-next-line no-console
    console.log('[Init] Settings cache initialized');
  } catch (error) {
    // OPFS might not be available (e.g., in some browsers or Tauri)
    console.warn('Failed to initialize OPFS settings cache:', error);
    // Don't show error - this is expected in Tauri
  }

  if (rootElement) {
    try {
      createRoot(rootElement).render(
        <StrictMode>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </StrictMode>
      );
      // eslint-disable-next-line no-console
      console.log('[Init] React app rendered');
    } catch (error) {
      console.error('[Init] Failed to render React app:', error);
      showErrorOnScreen('Failed to render React app', error);
    }
  } else {
    showErrorOnScreen(
      'Root element not found',
      new Error('document.getElementById("root") returned null')
    );
  }
}

// Bootstrap: Register SW first (critical for iOS Safari OPFS), then initialize app
// This prevents hangs on first visit where OPFS needs cross-origin isolation
ensureServiceWorkerReady().then(initializeApp);
