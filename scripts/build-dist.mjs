import { chmod, cp, mkdir, rm, writeFile } from 'node:fs/promises';
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

  // 4) Create dist/data and copy an existing DB if present
  await ensureDir(path.join(distRoot, 'data'));
  await copyFileIfExists(
    path.join(root, 'data', 'fluxby.db'),
    path.join(distRoot, 'data', 'fluxby.db')
  );

  // 5) Start script for production-style runs
  const startShPath = path.join(distRoot, 'start.sh');
  await writeFile(
    startShPath,
    `#!/usr/bin/env sh\n\nset -e\n\nDIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"\n\nexport NODE_ENV=production\nexport SERVE_WEB_DIST=1\n\nexec node "$DIR/apps/api/dist/index.js"\n`
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
