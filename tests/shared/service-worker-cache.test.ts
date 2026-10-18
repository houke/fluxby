import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

describe('service worker cache lifetime', () => {
  it.each(['web', 'landing'])(
    'retains two builds per scope and preserves other deployments: %s',
    async (app) => {
      const origin = 'https://fluxby.example';
      const stores = new Map<string, Map<string, Response>>();
      let online = true;
      let storageDelay: Promise<void> | undefined;
      let failWrites = false;
      const networkRequests: string[] = [];
      const claim = vi.fn<() => Promise<void> | undefined>();
      const failAsset =
        app === 'web' ? '/app/assets/failed.js' : '/assets/failed.js';
      const key = (request: string | { url: string }) =>
        new URL(typeof request === 'string' ? request : request.url, origin)
          .href;
      const caches = {
        keys: async () => [...stores.keys()],
        delete: async (name: string) => stores.delete(name),
        match: async (request: string | { url: string }) => {
          for (const store of stores.values()) {
            const response = store.get(key(request));
            if (response) return response.clone();
          }
        },
        open: async (name: string) => {
          await storageDelay;
          if (!stores.has(name)) stores.set(name, new Map());
          const store = stores.get(name);
          if (!store) throw new Error('Cache was not created');
          return {
            keys: async () => [...store.keys()].map((url) => ({ url })),
            match: async (request: string | { url: string }) =>
              store.get(key(request))?.clone(),
            addAll: async (assets: string[]) => {
              for (const asset of assets) {
                if (asset === failAsset) throw new Error('Asset unavailable');
                store.set(key(asset), new Response(key(asset)));
              }
            },
            put: async (
              request: string | { url: string },
              response: Response
            ) => {
              if (failWrites) throw new Error('Storage quota exceeded');
              store.set(key(request), response);
            },
          };
        },
      };
      const makeWorker = (base: string, revision: string) => {
        const handlers = new Map<string, (event: unknown) => void>();
        const pendingFetch: Promise<unknown>[] = [];
        const source = readFileSync(`apps/${app}/public/sw.js`, 'utf8')
          .replace(
            "const BUILD_REVISION = 'development';",
            `const BUILD_REVISION = '${revision}';`
          )
          .replace(
            'const BUILD_ASSETS = [];',
            `const BUILD_ASSETS = ['${base}assets/${revision}.js'];`
          );
        const cacheName = runInNewContext(`${source}\nCACHE_NAME;`, {
          URL,
          Headers,
          Response,
          caches,
          location: { origin },
          fetch: async (request: { url: string }) => {
            if (!online) throw new Error('Offline');
            networkRequests.push(request.url);
            return new Response(request.url);
          },
          self: {
            location: { origin },
            registration: { scope: `${origin}${base}` },
            addEventListener: (
              event: string,
              handler: (event: unknown) => void
            ) => handlers.set(event, handler),
            skipWaiting: () => undefined,
            clients: { claim },
          },
        });
        return {
          cacheName,
          pendingFetch,
          finishFetch: () => Promise.all(pendingFetch.splice(0)),
          run: async (event: string) => {
            const pending: Promise<unknown>[] = [];
            handlers.get(event)?.({
              waitUntil: (promise: Promise<unknown>) => pending.push(promise),
            });
            await Promise.all(pending);
          },
          fetch: async (url: string) => {
            let response: Promise<Response> | undefined;
            handlers.get('fetch')?.({
              request: { url, method: 'GET' },
              waitUntil: (promise: Promise<unknown>) =>
                pendingFetch.push(promise),
              respondWith: (promise: Promise<Response>) => (response = promise),
            });
            return response;
          },
        };
      };
      const base = app === 'web' ? '/app/' : '/';
      const foreignBase = app === 'web' ? '/repository/app/' : '/repository/';
      const foreign = makeWorker(foreignBase, 'foreign');
      await foreign.run('install');
      await foreign.run('activate');
      let previous;
      for (const revision of ['first', 'second', 'third', 'fourth']) {
        const worker = makeWorker(base, revision);
        await worker.run('install');
        await worker.run('activate');
        expect(stores.has(foreign.cacheName)).toBe(true);
        expect(stores.size).toBe(revision === 'first' ? 2 : 3);
        if (previous) {
          online = false;
          const response = await worker.fetch(
            `${origin}${base}assets/${previous}.js`
          );
          expect(await response?.text()).toBe(
            `${origin}${base}assets/${previous}.js`
          );
          online = true;
        }
        previous = revision;
      }

      const failed = makeWorker(base, 'failed');
      await expect(failed.run('install')).rejects.toThrow('Asset unavailable');
      expect(stores.has(failed.cacheName)).toBe(false);
      expect(stores.has(foreign.cacheName)).toBe(true);
      expect(stores.size).toBe(3);

      const worker = makeWorker(base, 'fifth');
      await worker.run('install');

      // Activation must stay alive until clients.claim finishes.
      let releaseClaim!: () => void;
      const claimDelay = new Promise<void>(
        (resolve) => (releaseClaim = resolve)
      );
      claim.mockClear();
      claim.mockReturnValueOnce(claimDelay);
      let activated = false;
      const activation = worker.run('activate').then(() => (activated = true));
      await vi.waitFor(() => expect(claim).toHaveBeenCalledOnce());
      expect(activated).toBe(false);
      releaseClaim();
      await activation;
      expect(activated).toBe(true);

      // A slow cache must not delay a successful network response. The event
      // still keeps the write alive, including after the response is consumed.
      let releaseStorage!: () => void;
      storageDelay = new Promise((resolve) => (releaseStorage = resolve));
      const runtimeUrl = `${origin}${base}assets/runtime.js`;
      try {
        const response = await worker.fetch(runtimeUrl);
        expect(await response?.text()).toBe(runtimeUrl);
        expect(worker.pendingFetch).toHaveLength(1);
        expect(stores.get(worker.cacheName)?.has(runtimeUrl)).toBe(false);
      } finally {
        releaseStorage();
      }
      await worker.finishFetch();
      const cached = stores.get(worker.cacheName)?.get(runtimeUrl);
      expect(await cached?.text()).toBe(runtimeUrl);

      // Quota failures must not reject successful requests or fetch lifetimes.
      storageDelay = undefined;
      failWrites = true;
      const quotaUrl = `${origin}${base}assets/quota.js`;
      expect(await (await worker.fetch(quotaUrl))?.text()).toBe(quotaUrl);
      await expect(worker.finishFetch()).resolves.toEqual([undefined]);

      // Another scope's cache cannot supply this deployment's missing assets.
      const missingUrl = `${origin}${base}assets/missing.js`;
      stores.get(foreign.cacheName)?.set(missingUrl, new Response('Foreign'));
      online = false;
      await expect(worker.fetch(missingUrl)).rejects.toThrow('Offline');

      // Content-hashed assets never change, so cached copies skip the network.
      online = true;
      failWrites = false;
      const hashedUrl = `${origin}${base}assets/index-AbC12_-9.js`;
      stores.get(worker.cacheName)?.set(hashedUrl, new Response('Cached'));
      networkRequests.length = 0;
      expect(await (await worker.fetch(hashedUrl))?.text()).toBe('Cached');
      expect(networkRequests).toEqual([]);
      // Unhashed files stay network-first so updates appear immediately.
      const unhashedUrl = `${origin}${base}index.html`;
      stores.get(worker.cacheName)?.set(unhashedUrl, new Response('Stale'));
      expect(await (await worker.fetch(unhashedUrl))?.text()).toBe(unhashedUrl);
      expect(networkRequests).toEqual([unhashedUrl]);
      await worker.finishFetch();
    }
  );
});
