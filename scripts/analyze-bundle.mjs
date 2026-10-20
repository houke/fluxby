/**
 * Report what the startup (entry) chunk of an app contains.
 *
 * Usage: node scripts/analyze-bundle.mjs [web|landing] [top=40]
 *
 * Builds in memory (nothing is written to dist/) and prints the entry chunk's
 * raw and gzip size, then its largest contributors grouped by npm package or
 * source file. Sizes per module are pre-minification rendered lengths, so use
 * them to rank contributors, not as exact byte counts.
 */
import { gzipSync } from 'node:zlib';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = resolve(fileURLToPath(import.meta.url), '../..');
const app = process.argv[2] || 'web';
const top = Number(process.argv[3] || 40);
if (!['web', 'landing'].includes(app)) {
  console.error('Usage: node scripts/analyze-bundle.mjs [web|landing] [top]');
  process.exit(1);
}

const appDir = resolve(root, 'apps', app);
process.chdir(appDir);
process.env.NODE_ENV = 'production';

const groups = new Map();
let entry;

function groupName(id) {
  const marker = 'node_modules/';
  const index = id.lastIndexOf(marker);
  if (index >= 0) {
    const parts = id.slice(index + marker.length).split('/');
    return parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
  }
  return id
    .replace(`${appDir}/`, '')
    .replace(/.*\/packages\//, 'packages/')
    .replace(/\?.*$/, '');
}

await build({
  configFile: resolve(appDir, 'vite.config.ts'),
  logLevel: 'silent',
  build: { write: false },
  plugins: [
    {
      name: 'fluxby-analyze-entry',
      generateBundle(_options, bundle) {
        for (const chunk of Object.values(bundle)) {
          if (chunk.type !== 'chunk' || !chunk.isEntry) continue;
          entry = chunk;
          for (const [id, module] of Object.entries(chunk.modules)) {
            const name = groupName(id);
            groups.set(name, (groups.get(name) || 0) + module.renderedLength);
          }
        }
      },
    },
  ],
});

if (!entry) {
  console.error('No entry chunk found.');
  process.exit(1);
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
console.log(
  `${app} entry ${entry.fileName}: ${kb(Buffer.byteLength(entry.code))} raw, ` +
    `${kb(gzipSync(entry.code).length)} gzip\n`
);
console.log('Largest contributors (pre-minification):');
for (const [name, size] of [...groups.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, top)) {
  console.log(`${kb(size).padStart(10)}  ${name}`);
}
