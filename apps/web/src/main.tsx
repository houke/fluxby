import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { consumeSessionRedirect, getRedirectToRestore } from '@fluxby/shared';
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

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>
  );
}

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
