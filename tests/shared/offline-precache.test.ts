import { runInNewContext } from 'node:vm';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { offlinePrecache } from '../../scripts/offline-precache.mjs';
import type { OutputAsset, OutputBundle } from 'rollup';

describe('production offline route assets', () => {
  it.each([
    { app: 'web', base: '/app/' },
    { app: 'web', base: '/repository/app/' },
    { app: 'landing', base: '/' },
    { app: 'landing', base: '/repository/' },
  ])(
    'caches every lazy page and dependency at installation: $app $base',
    async ({ app, base }) => {
      const files = [
        'assets/index-123.js',
        'assets/Dashboard-456.js',
        'assets/Settings-789.js',
        'assets/recharts-234.js',
        'assets/worker-345.js',
        'assets/index-456.css',
        'assets/sqlite-567.wasm',
        ...(app === 'landing' ? ['openapi.json'] : []),
      ];
      const bundle = Object.fromEntries(
        [...files, 'assets/large-screenshot.png'].map((fileName) => [
          fileName,
          { type: 'asset', fileName, source: '' },
        ])
      ) as OutputBundle;
      const plugin = offlinePrecache({
        serviceWorkerPath: resolve(`apps/${app}/public/sw.js`),
        base,
        publicAssets: app === 'landing' ? ['openapi.json'] : [],
      });
      let emitted: OutputAsset | undefined;
      const generate = plugin.generateBundle as (
        options: object,
        bundle: OutputBundle
      ) => void;
      generate.call(
        { emitFile: (asset: OutputAsset) => (emitted = asset) },
        {},
        bundle
      );
      expect(emitted?.fileName).toBe('sw.js');

      const origin = 'https://fluxby.example';
      const store = new Map<string, Response>();
      const handlers = new Map<string, (event: unknown) => void>();
      const requests: string[] = [];
      let online = true;
      const key = (request: string | { url: string }) =>
        new URL(typeof request === 'string' ? request : request.url, origin)
          .href;
      const fetchAsset = async (request: string | { url: string }) => {
        if (!online) throw new Error('Offline');
        requests.push(key(request));
        return new Response(key(request));
      };
      const cache = {
        match: async (request: string | { url: string }) =>
          store.get(key(request))?.clone(),
        addAll: async (urls: string[]) => {
          await Promise.all(
            urls.map(async (url) => store.set(key(url), await fetchAsset(url)))
          );
        },
        put: async (request: string | { url: string }, response: Response) =>
          store.set(key(request), response),
      };
      runInNewContext(String(emitted?.source), {
        URL,
        Headers,
        Response,
        fetch: fetchAsset,
        location: { origin },
        caches: {
          open: async () => cache,
          keys: async () => [],
          match: async (request: string | { url: string }) =>
            store.get(key(request))?.clone(),
        },
        self: {
          location: { origin },
          registration: { scope: `${origin}${base}` },
          addEventListener: (
            event: string,
            handler: (event: unknown) => void
          ) => handlers.set(event, handler),
          skipWaiting: () => undefined,
        },
      });
      const pending: Promise<unknown>[] = [];
      handlers.get('install')?.({
        waitUntil: (promise: Promise<unknown>) => pending.push(promise),
      });
      await Promise.all(pending);
      expect(requests).toContain(`${origin}${base}index.html`);
      // Public precache entries must exist; a missing entry aborts installation.
      for (const request of requests) {
        const fileName = new URL(request).pathname.slice(base.length);
        if (
          fileName &&
          fileName !== 'index.html' &&
          !fileName.startsWith('assets/')
        ) {
          expect(
            existsSync(resolve(`apps/${app}/public`, fileName)),
            `Missing public precache asset: ${app}/${fileName}`
          ).toBe(true);
        }
      }
      expect(requests).not.toContain(
        `${origin}${base}assets/large-screenshot.png`
      );
      online = false;

      for (const file of files) {
        let response: Promise<Response> | undefined;
        handlers.get('fetch')?.({
          request: { url: `${origin}${base}${file}`, method: 'GET' },
          respondWith: (promise: Promise<Response>) => (response = promise),
        });
        const cached = await response;
        expect(await cached?.text()).toBe(`${origin}${base}${file}`);
        if (app === 'web') {
          expect(cached?.headers.get('Cross-Origin-Opener-Policy')).toBe(
            'same-origin'
          );
        }
      }

      let pageResponse: Promise<Response> | undefined;
      handlers.get('fetch')?.({
        request: {
          url: `${origin}${base}${app === 'web' ? 'settings' : 'help/privacy'}`,
          method: 'GET',
          mode: 'navigate',
        },
        respondWith: (promise: Promise<Response>) => (pageResponse = promise),
      });
      expect(await (await pageResponse)?.text()).toBe(
        `${origin}${base}index.html`
      );
    }
  );

  it('changes the build revision when a public schema changes without renaming', () => {
    mkdirSync(resolve('.nexus/tmp'), { recursive: true });
    const directory = mkdtempSync(resolve('.nexus/tmp/offline-precache-'));
    try {
      const workerPath = resolve(directory, 'sw.js');
      const schemaPath = resolve(directory, 'openapi.json');
      writeFileSync(
        workerPath,
        "const BUILD_ASSETS = [];\nconst BUILD_REVISION = 'development';"
      );
      const generateWorker = (schema: string) => {
        writeFileSync(schemaPath, schema);
        const plugin = offlinePrecache({
          serviceWorkerPath: workerPath,
          base: '/repository/',
          publicAssets: ['openapi.json'],
        });
        let emitted: OutputAsset | undefined;
        const generate = plugin.generateBundle as (
          options: object,
          bundle: OutputBundle
        ) => void;
        generate.call(
          { emitFile: (asset: OutputAsset) => (emitted = asset) },
          {},
          {}
        );
        return String(emitted?.source);
      };
      const first = generateWorker('{"version":1}');
      const second = generateWorker('{"version":2}');
      expect(first).toContain('/repository/openapi.json');
      expect(first).not.toBe(second);
      expect(generateWorker('{"version":2}')).toBe(second);
      writeFileSync(
        workerPath,
        "const BUILD_ASSETS = [];\nconst BUILD_REVISION = 'development';\n// Changed worker behavior"
      );
      expect(generateWorker('{"version":2}')).not.toBe(second);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('changes the revision for HTML-only and stable-name script updates', () => {
    const buildWorker = (html: string, script: string) => {
      const plugin = offlinePrecache({
        serviceWorkerPath: resolve('apps/web/public/sw.js'),
        base: '/app/',
      });
      expect(plugin.enforce).toBe('post');
      let emitted: OutputAsset | undefined;
      const generate = plugin.generateBundle as (
        options: object,
        bundle: OutputBundle
      ) => void;
      generate.call(
        { emitFile: (asset: OutputAsset) => (emitted = asset) },
        {},
        {
          'index.html': { type: 'asset', fileName: 'index.html', source: html },
          'assets/stable.js': {
            type: 'asset',
            fileName: 'assets/stable.js',
            source: script,
          },
        } as OutputBundle
      );
      return String(emitted?.source);
    };
    const first = buildWorker('<title>Fluxby</title>', 'original');
    expect(buildWorker('<title>Fluxby</title>', 'original')).toBe(first);
    expect(buildWorker('<title>Fluxby updated</title>', 'original')).not.toBe(
      first
    );
    expect(buildWorker('<title>Fluxby</title>', 'changed')).not.toBe(first);
  });
});
