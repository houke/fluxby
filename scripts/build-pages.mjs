import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const root = process.cwd();
const siteDir = path.join(root, 'dist');

function run(cmd, args, extraEnv = {}) {
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    cwd: root,
    env: { ...process.env, ...extraEnv },
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

async function copyDir(from, to) {
  if (!existsSync(from)) {
    throw new Error(`Missing directory: ${from}`);
  }
  await ensureDir(path.dirname(to));
  await rm(to, { recursive: true, force: true });
  await cp(from, to, { recursive: true });
}

async function copyFileIfExists(from, to) {
  if (!existsSync(from)) return;
  await ensureDir(path.dirname(to));
  await cp(from, to);
}

function normalizeBaseUrl(raw) {
  if (!raw) return undefined;
  if (raw === '/') return '/';
  return raw.endsWith('/') ? raw : `${raw}/`;
}

async function main() {
  const baseUrl = normalizeBaseUrl(process.env.VITE_BASE_URL);
  const env = baseUrl ? { VITE_BASE_URL: baseUrl } : {};

  // 1) Build dependencies + OpenAPI
  run('npm', ['run', 'build:packages']);
  run('npm', ['run', 'generate:api']);

  // 2) Build web + landing for the same base URL
  run('npm', ['run', 'build', '-w', 'apps/web'], env);
  run('npm', ['run', 'build', '-w', 'apps/landing'], env);

  // 3) Assemble GitHub Pages folder
  await rm(siteDir, { recursive: true, force: true });
  await ensureDir(siteDir);

  // Landing at /
  await copyDir(path.join(root, 'apps', 'landing', 'dist'), siteDir);

  // Web app at /app/
  await copyDir(
    path.join(root, 'apps', 'web', 'dist'),
    path.join(siteDir, 'app')
  );

  // Bypass Jekyll on GitHub Pages
  await writeFile(path.join(siteDir, '.nojekyll'), '');

  // SPA routing on GitHub Pages: serve 404.html for unknown paths, then redirect back to
  // the correct SPA entry (landing or /app/) and let the app restore the original URL.
  const injectedBase = baseUrl ?? '/';
  const notFoundHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Not Found</title>
  </head>
  <body>
    <script>
      (function () {
        var base = ${JSON.stringify(injectedBase)};
        var path = window.location.pathname || '/';
        var search = window.location.search || '';
        var hash = window.location.hash || '';

        try {
          sessionStorage.setItem('__fluxby_redirect__', path + search + hash);
        } catch (e) {
          // ignore
        }

        function stripBase(p) {
          if (base === '/' && p.startsWith('/')) return p.slice(1);
          if (p.startsWith(base)) return p.slice(base.length);
          return p.charAt(0) === '/' ? p.slice(1) : p;
        }

        var relative = stripBase(path);
        var target = base;
        if (relative === 'app' || relative.indexOf('app/') === 0) {
          target = base + 'app/';
        }

        window.location.replace(target);
      })();
    </script>
  </body>
</html>
`;
  await writeFile(path.join(siteDir, '404.html'), notFoundHtml);

  // Optional custom domain
  await copyFileIfExists(path.join(root, 'CNAME'), path.join(siteDir, 'CNAME'));

  // Sanity checks
  const landingIndex = path.join(siteDir, 'index.html');
  const appIndex = path.join(siteDir, 'app', 'index.html');
  if (!existsSync(landingIndex)) {
    throw new Error(`Missing landing index: ${landingIndex}`);
  }
  if (!existsSync(appIndex)) {
    throw new Error(`Missing app index: ${appIndex}`);
  }

  console.warn(`\n✅ GitHub Pages site assembled at: ${siteDir}`);
  if (baseUrl) {
    console.warn(`   Base URL: ${baseUrl}`);
  } else {
    console.warn('   Base URL: / (default)');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
