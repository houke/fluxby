import React from 'react';
import ReactDOM from 'react-dom/client';
import { consumeSessionRedirect, getRedirectToRestore } from '@fluxby/shared';
import App from './App.tsx';
import './index.css';

// GitHub Pages SPA fallback: a custom 404.html stores the original URL in sessionStorage
// and redirects to the base URL. Restore that original URL before React Router mounts.
const pendingRedirect = consumeSessionRedirect(window.sessionStorage);
if (pendingRedirect) {
  const basePath = import.meta.env.BASE_URL || '/';
  const restored = getRedirectToRestore(pendingRedirect, basePath);
  if (restored) {
    window.history.replaceState(null, '', restored);
  }
}

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Register service worker for offline support
// Uses Network-First strategy to always serve fresh content when online
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const basePath = import.meta.env.BASE_URL || '/';
    const swPath = `${basePath}sw.js`;
    navigator.serviceWorker
      .register(swPath, { scope: basePath })
      .then((registration) => {
        // Check for updates periodically
        setInterval(
          () => {
            registration.update();
          },
          60 * 60 * 1000
        ); // Check every hour

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // New content is available, you could show a notification here
                // eslint-disable-next-line no-console
                console.log('New content available, refresh to update.');
              }
            });
          }
        });

        // eslint-disable-next-line no-console
        console.log('Landing SW registered:', registration.scope);
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.log('Landing SW registration failed:', error);
      });
  });
}
