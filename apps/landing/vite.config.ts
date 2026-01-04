import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import { resolve } from 'path';

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

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5177, // Landing page port
    proxy: {
      // Proxy /app to the web app dev server
      // The web app is configured with base: '/app/' so we forward requests directly
      '/app': {
        target: 'http://localhost:5178',
        changeOrigin: true,
        // Don't rewrite the path - the web app expects /app/ base
      },
      // Proxy API calls for developers building their own interfaces
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
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
