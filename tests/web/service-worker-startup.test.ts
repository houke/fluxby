/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import { registerAppServiceWorker } from '../../apps/web/src/lib/service-worker';

describe('app service worker startup', () => {
  it.each(['/app/', '/repository/app/'])(
    'waits for the app worker while preserving a parent landing worker: %s',
    async (basePath) => {
      let state: ServiceWorkerState = 'installing';
      const listeners = new Set<() => void>();
      const appWorker = {
        get state() {
          return state;
        },
        addEventListener: (_event: string, listener: () => void) =>
          listeners.add(listener),
        removeEventListener: (_event: string, listener: () => void) =>
          listeners.delete(listener),
      };
      const parent = { unregister: vi.fn() };
      const container = {
        controller: { scriptURL: new URL('/sw.js', location.href).href },
        register: vi.fn().mockResolvedValue({ installing: appWorker }),
        getRegistrations: vi.fn().mockResolvedValue([parent]),
        get ready() {
          throw new Error('The parent worker ready promise must not be used');
        },
      };
      let settled = false;
      const waiting = registerAppServiceWorker(
        container as unknown as ServiceWorkerContainer,
        basePath
      ).then(() => {
        settled = true;
      });
      await Promise.resolve();
      expect(settled).toBe(false);
      expect(container.register).toHaveBeenCalledWith(
        new URL(`${basePath}sw.js`, location.href).href,
        { scope: basePath }
      );
      state = 'activated';
      listeners.forEach((listener) => listener());
      await waiting;
      expect(settled).toBe(true);
      expect(listeners.size).toBe(0);
      expect(container.getRegistrations).not.toHaveBeenCalled();
      expect(parent.unregister).not.toHaveBeenCalled();
    }
  );

  it('rejects a failed installation and releases its listener', async () => {
    let state: ServiceWorkerState = 'installing';
    const listeners = new Set<() => void>();
    const container = {
      register: vi.fn().mockResolvedValue({
        installing: {
          get state() {
            return state;
          },
          addEventListener: (_event: string, listener: () => void) =>
            listeners.add(listener),
          removeEventListener: (_event: string, listener: () => void) =>
            listeners.delete(listener),
        },
      }),
    };
    const waiting = registerAppServiceWorker(
      container as unknown as ServiceWorkerContainer,
      '/app/'
    );
    await Promise.resolve();
    state = 'redundant';
    listeners.forEach((listener) => listener());
    await expect(waiting).rejects.toThrow(
      'App service worker installation failed'
    );
    expect(listeners.size).toBe(0);
  });
});
