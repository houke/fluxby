import { chmod, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const root = process.cwd();
const distRoot = path.join(root, 'dist');

function run(cmd, args) {
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    cwd: root,
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

async function copyDir(from, to) {
  if (!existsSync(from)) return;
  await ensureDir(path.dirname(to));
  await rm(to, { recursive: true, force: true });
  await cp(from, to, { recursive: true });
}

async function copyFileIfExists(from, to) {
  if (!existsSync(from)) return;
  await ensureDir(path.dirname(to));
  await cp(from, to);
}

async function main() {
  // 1) Build everything using the existing monorepo build
  run('npm', ['run', 'build']);

  // 2) Recreate root dist/
  await rm(distRoot, { recursive: true, force: true });
  await ensureDir(distRoot);

  // 3) Copy build outputs into a single root dist folder, preserving layout
  //    so the API's relative data directory logic keeps working.
  await copyDir(
    path.join(root, 'apps', 'api', 'dist'),
    path.join(distRoot, 'apps', 'api', 'dist')
  );

  // Preserve ESM semantics for the built API when running from dist/
  await copyFileIfExists(
    path.join(root, 'apps', 'api', 'package.json'),
    path.join(distRoot, 'apps', 'api', 'package.json')
  );

  // API runtime reads schema.sql relative to its compiled db/ folder
  await copyFileIfExists(
    path.join(root, 'apps', 'api', 'src', 'db', 'schema.sql'),
    path.join(distRoot, 'apps', 'api', 'dist', 'db', 'schema.sql')
  );

  await copyDir(
    path.join(root, 'apps', 'web', 'dist'),
    path.join(distRoot, 'apps', 'web', 'dist')
  );

  await copyDir(
    path.join(root, 'packages', 'shared', 'dist'),
    path.join(distRoot, 'packages', 'shared', 'dist')
  );
  await copyFileIfExists(
    path.join(root, 'packages', 'shared', 'package.json'),
    path.join(distRoot, 'packages', 'shared', 'package.json')
  );

  const apiPackage = JSON.parse(
    await readFile(path.join(root, 'apps', 'api', 'package.json'), 'utf8')
  );
  const runtimePackage = {
    name: 'fluxby-production',
    version: apiPackage.version,
    private: true,
    type: 'module',
    dependencies: {
      ...apiPackage.dependencies,
      '@fluxby/shared': 'file:packages/shared',
    },
  };
  await writeFile(
    path.join(distRoot, 'package.json'),
    `${JSON.stringify(runtimePackage, null, 2)}\n`
  );

  // 4) Create an empty runtime data directory. Never package a developer's
  // local financial database or stale desktop installers into this artifact.
  await ensureDir(path.join(distRoot, 'data'));

  // 5) Start script for production-style runs
  const startShPath = path.join(distRoot, 'start.sh');
  await writeFile(
    startShPath,
    `#!/usr/bin/env sh\n\nset -e\n\nDIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"\n\nif [ ! -d "$DIR/node_modules" ]; then\n  echo "Missing production dependencies. Run: npm install --omit=dev --prefix $DIR" >&2\n  exit 1\nfi\n\nexport NODE_ENV=production\nexport SERVE_WEB_DIST=1\n\nexec node "$DIR/apps/api/dist/index.js"\n`
  );
  await chmod(startShPath, 0o755);

  // Touch a marker file
  const marker = path.join(distRoot, '.built');
  await writeFile(marker, new Date().toISOString());

  // Basic sanity checks
  const apiEntry = path.join(distRoot, 'apps', 'api', 'dist', 'index.js');
  const webIndex = path.join(distRoot, 'apps', 'web', 'dist', 'index.html');
  if (!existsSync(apiEntry)) {
    throw new Error(`Missing API build output: ${apiEntry}`);
  }
  if (!existsSync(webIndex)) {
    throw new Error(`Missing web build output: ${webIndex}`);
  }

  // Optional: print final layout summary

  console.warn(`\n✅ Assembled root dist folder at: ${distRoot}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
