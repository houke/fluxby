import { defineConfig, type ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// For GitHub Pages: VITE_BASE_URL is set during CI
// For local development: use '/app/'
// For Tauri: use relative paths
const isTauri = process.env.TAURI_ENV_PLATFORM !== undefined;
const base = isTauri
  ? ''
  : process.env.VITE_BASE_URL
    ? `${process.env.VITE_BASE_URL}app/`
    : '/app/';

// In dev mode, resolve workspace packages to their source files
// This allows hot-reload without needing to rebuild packages
const isDev = process.env.NODE_ENV !== 'production';
const packagesPath = path.resolve(__dirname, '../../packages');

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    // Only add redirect middleware when not in Tauri mode
    ...(!isTauri
      ? [
          {
            name: 'redirect-root-app',
            configureServer(server: ViteDevServer) {
              server.middlewares.use(
                (
                  req: IncomingMessage,
                  res: ServerResponse,
                  next: () => void
                ) => {
                  if (req.url === '/app') {
                    res.writeHead(301, { Location: '/app/' });
                    res.end();
                    return;
                  }
                  next();
                }
              );
            },
          },
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // In dev mode, resolve @fluxby/* packages to source files for hot-reload
      ...(isDev && {
        '@fluxby/shared': path.resolve(packagesPath, 'shared/src/index.ts'),
        '@fluxby/database': path.resolve(packagesPath, 'database/src/index.ts'),
        '@fluxby/database/web': path.resolve(
          packagesPath,
          'database/src/adapters/web.ts'
        ),
        '@fluxby/database/tauri': path.resolve(
          packagesPath,
          'database/src/adapters/tauri.ts'
        ),
        '@fluxby/database/node': path.resolve(
          packagesPath,
          'database/src/adapters/node.ts'
        ),
        '@fluxby/core': path.resolve(packagesPath, 'core/src/index.ts'),
      }),
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
          // Keep all recharts modules in one chunk to avoid circular dependency warnings
          recharts: ['recharts'],
        },
      },
    },
  },
  base, // Dynamic base path for deployment
});
