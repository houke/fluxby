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

initializeApp();

// Register service worker for PWA support and COI headers
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Use the base path from Vite for correct SW path
    const basePath = import.meta.env.BASE_URL || '/app/';
    const swPath = `${basePath}sw.js`;

    navigator.serviceWorker
      .register(swPath, { scope: basePath })
      .then((registration) => {
        // eslint-disable-next-line no-console
        console.log('SW registered:', registration.scope);
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.log('SW registration failed:', error);
      });
  });
}
