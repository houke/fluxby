import { test as base, webkit } from '@playwright/test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

// Playwright's ephemeral WebKit contexts reject OPFS getDirectory on macOS.
// A disposable persistent profile supports the storage path used by Fluxby.
export const test = base.extend({
  page: async (
    { context, browserName, baseURL, ignoreHTTPSErrors },
    use,
    testInfo
  ) => {
    const useWithDiagnostics = async (
      page: import('@playwright/test').Page
    ) => {
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));
      try {
        await use(page);
      } finally {
        if (testInfo.status !== testInfo.expectedStatus && errors.length) {
          const path = testInfo.outputPath('browser-errors.txt');
          await writeFile(path, errors.join('\n'));
          await testInfo.attach('browser-errors', {
            path,
            contentType: 'text/plain',
          });
        }
      }
    };
    if (browserName !== 'webkit') {
      await useWithDiagnostics(await context.newPage());
      return;
    }
    const root = resolve('.nexus/tmp/playwright-webkit');
    await mkdir(root, { recursive: true });
    const profile = await mkdtemp(resolve(root, 'profile-'));
    const persistentContext = await webkit.launchPersistentContext(profile, {
      baseURL,
      ignoreHTTPSErrors,
      headless: true,
    });
    const page =
      persistentContext.pages()[0] ?? (await persistentContext.newPage());
    // macOS WebKit can share OPFS backing across disposable profile paths.
    // Mount a unique owned root instead of clearing the shared origin storage.
    const storageRoot = `playwright-fluxby-${randomUUID()}`;
    await page.addInitScript((name) => {
      // WebKit drops an override on a recreated StorageManager wrapper. Keep
      // the mount on its prototype so every wrapper uses the same owned root.
      const storagePrototype = Object.getPrototypeOf(navigator.storage);
      const getDirectory = storagePrototype.getDirectory;
      storagePrototype.getDirectory = async function (this: StorageManager) {
        const root = await getDirectory.call(this);
        return root.getDirectoryHandle(name, { create: true });
      };
    }, storageRoot);
    try {
      await useWithDiagnostics(page);
    } finally {
      try {
        const target = baseURL ?? page.url();
        // Destroy the app page first to release native file/stream handles.
        await page.close();
        if (target.startsWith('http')) {
          const cleanup = await persistentContext.newPage();
          const url = new URL('/__playwright_opfs_cleanup__', target).href;
          await cleanup.route(url, (route) =>
            route.fulfill({ contentType: 'text/html', body: '<!doctype html>' })
          );
          await cleanup.goto(url);
          await cleanup.evaluate(async (name) => {
            const root = await navigator.storage.getDirectory();
            try {
              await root.removeEntry(name, { recursive: true });
            } catch (error) {
              if (!(
                error instanceof DOMException && error.name === 'NotFoundError'
              ))
                throw error;
            }
          }, storageRoot);
        }
      } finally {
        await persistentContext.close();
        await rm(profile, { recursive: true, force: true });
      }
    }
  },
});
