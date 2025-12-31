import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// For GitHub Pages: VITE_BASE_URL is set during CI
// For local development: use '/app/'
const base = process.env.VITE_BASE_URL
  ? `${process.env.VITE_BASE_URL}app/`
  : '/app/';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'redirect-root-app',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/app') {
            res.writeHead(301, { Location: '/app/' });
            res.end();
            return;
          }
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    // Exclude wa-sqlite from optimization to avoid WASM loading issues
    exclude: ['@journeyapps/wa-sqlite'],
  },
  server: {
    port: 5178, // Web app runs on separate port for dev
    strictPort: true,
    // Headers required for SharedArrayBuffer (SQLite WASM)
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  build: {
    // Required headers for SharedArrayBuffer (needed for SQLite WASM)
    rollupOptions: {
      output: {
        manualChunks: {
          'wa-sqlite': ['@journeyapps/wa-sqlite'],
        },
      },
    },
  },
  base, // Dynamic base path for deployment
});
