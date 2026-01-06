import { defineConfig } from 'vitest/config';
import path from 'path';

const packagesPath = path.resolve(__dirname, './packages');

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'apps/api/src/**/*.ts',
        'apps/web/src/**/*.{ts,tsx}',
        'packages/shared/src/**/*.ts',
      ],
      exclude: [
        '**/*.d.ts',
        '**/node_modules/**',
        '**/dist/**',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
    },
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './apps/web/src'),
      '@api': path.resolve(__dirname, './apps/api/src'),
      '@shared': path.resolve(__dirname, './packages/shared/src'),
      // Resolve workspace packages to source files for testing
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
    },
  },
});
