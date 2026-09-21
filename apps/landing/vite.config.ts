import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { getLocalHttpsOptions } from '../../scripts/dev-cert.mjs';

// Read root package.json for app version
const rootPackageJson = JSON.parse(
  readFileSync(resolve(__dirname, '../../package.json'), 'utf-8')
);
const appVersion = rootPackageJson.version;

const base = process.env.VITE_BASE_URL
  ? process.env.VITE_BASE_URL.endsWith('/')
    ? process.env.VITE_BASE_URL
    : `${process.env.VITE_BASE_URL}/`
  : '/';

// In dev mode, resolve workspace packages to their source files
// This allows hot-reload without needing to rebuild packages
const isDev = process.env.NODE_ENV !== 'production';
const packagesPath = resolve(__dirname, '../../packages');
const devHost = process.env.FLUXBY_DEV_HOST;
const devPort = Number(process.env.FLUXBY_DEV_PORT || 5177);
const useLocalHttps = process.env.FLUXBY_DEV_HTTPS === 'true';
const localHttpsOptions = useLocalHttps ? getLocalHttpsOptions() : undefined;
const appProtocol = useLocalHttps ? 'https' : 'http';
const appHost = devHost || 'localhost';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      // In dev mode, resolve @fluxby/* packages to source files for hot-reload
      ...(isDev && {
        '@fluxby/shared': resolve(packagesPath, 'shared/src/index.ts'),
      }),
    },
  },
  server: {
    ...(devHost ? { host: devHost, allowedHosts: [devHost] } : {}),
    port: devPort, // Landing page port
    strictPort: true,
    ...(localHttpsOptions ? { https: localHttpsOptions } : {}),
    ...(useLocalHttps
      ? {
          hmr: {
            host: devHost,
            protocol: 'wss',
            port: devPort,
          },
        }
      : {}),
    // Headers required for SharedArrayBuffer (needed for SQLite WASM in the proxied /app)
    headers: {
      'Content-Security-Policy': "frame-ancestors 'none'",
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    proxy: {
      // Proxy /app to the web app dev server
      // The web app is configured with base: '/app/' so we forward requests directly
      '/app': {
        target: `${appProtocol}://${appHost}:5178`,
        changeOrigin: true,
        secure: false,
        // Enable WebSocket proxy for Vite HMR (Hot Module Replacement)
        // Without this, CSS updates via HMR won't work when accessing /app through the proxy
        ws: true,
      },
      // Proxy API calls for developers building their own interfaces
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // Keep TypeSafe requests same-origin during local development. The
      // provider does not send CORS headers for arbitrary local hostnames.
      '/typesafe-api': {
        target: 'https://api.typesafe.ai',
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/typesafe-api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
  },
  base, // Dynamic base path for deployment (GitHub Pages)
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
});
