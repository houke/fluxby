import type { Plugin } from 'vite';

export function offlinePrecache(options: {
  serviceWorkerPath: string;
  base: string;
  publicAssets?: string[];
}): Plugin;
