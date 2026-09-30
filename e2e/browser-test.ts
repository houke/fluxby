import { test as base, webkit } from '@playwright/test';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

// Playwright's ephemeral WebKit contexts reject OPFS getDirectory on macOS.
// A disposable persistent profile supports the storage path used by Fluxby.
export const test = base.extend({
  page: async ({ context, browserName, baseURL, ignoreHTTPSErrors }, use) => {
    if (browserName !== 'webkit') {
      await use(await context.newPage());
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
    try {
      await use(
        persistentContext.pages()[0] ?? (await persistentContext.newPage())
      );
    } finally {
      await persistentContext.close();
      await rm(profile, { recursive: true, force: true });
    }
  },
});
