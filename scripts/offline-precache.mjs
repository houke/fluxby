import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';

/** Preserve offline navigation when pages are split into lazy-loaded chunks. */
export function offlinePrecache({
  serviceWorkerPath,
  base,
  publicAssets = [],
}) {
  return {
    name: 'fluxby-offline-precache',
    apply: 'build',
    // Include the generated HTML, which Vite emits after normal user plugins.
    enforce: 'post',
    generateBundle(_options, bundle) {
      const assetBase = base.endsWith('/') ? base : `${base}/`;
      const buildAssets = Object.values(bundle)
        .map((asset) => asset.fileName)
        .filter((fileName) => /\.(js|css|wasm)$/.test(fileName))
        .concat(publicAssets);
      const assets = [...new Set(buildAssets)]
        .sort()
        .map((fileName) => `${assetBase}${fileName}`);
      const revision = createHash('sha256').update(JSON.stringify(assets));
      for (const asset of Object.values(bundle).sort((first, second) =>
        first.fileName.localeCompare(second.fileName)
      )) {
        // HTML and files with stable names can change without changing the list.
        if (!/\.(html|js|css|wasm)$/.test(asset.fileName)) continue;
        revision.update(asset.fileName);
        revision.update(asset.type === 'chunk' ? asset.code : asset.source);
      }
      // Public files keep their names across builds, so include their contents.
      for (const fileName of [...publicAssets].sort()) {
        revision.update(fileName);
        revision.update(
          readFileSync(resolve(dirname(serviceWorkerPath), fileName))
        );
      }
      const template = readFileSync(serviceWorkerPath, 'utf8');
      revision.update(template);
      const marker = 'const BUILD_ASSETS = [];';
      const revisionMarker = "const BUILD_REVISION = 'development';";
      if (!template.includes(marker) || !template.includes(revisionMarker)) {
        throw new Error(`Missing offline asset marker in ${serviceWorkerPath}`);
      }
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: template
          .replace(marker, `const BUILD_ASSETS = ${JSON.stringify(assets)};`)
          .replace(
            revisionMarker,
            `const BUILD_REVISION = '${revision.digest('hex').slice(0, 16)}';`
          ),
      });
    },
  };
}
