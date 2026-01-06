var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// For GitHub Pages: VITE_BASE_URL is set during CI
// For local development: use '/app/'
// For Tauri: use relative paths
var isTauri = process.env.TAURI_ENV_PLATFORM !== undefined;
var base = isTauri
  ? ''
  : process.env.VITE_BASE_URL
    ? ''.concat(process.env.VITE_BASE_URL, 'app/')
    : '/app/';
// In dev mode, resolve workspace packages to their source files
// This allows hot-reload without needing to rebuild packages
var isDev = process.env.NODE_ENV !== 'production';
var packagesPath = path.resolve(__dirname, '../../packages');
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'redirect-root-app',
      configureServer: function (server) {
        server.middlewares.use(function (req, res, next) {
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
    alias: __assign(
      { '@': path.resolve(__dirname, './src') },
      isDev && {
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
      }
    ),
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
  base: base,
});
