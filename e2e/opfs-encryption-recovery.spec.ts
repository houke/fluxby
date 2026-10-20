import { expect } from '@playwright/test';
import { test } from './browser-test';
import { setupApp, dismissOnboardingTour, unlockTestApp } from './fixtures';

test('OPFS demo setup survives encrypted reload and unlock with intact records', async ({
  page,
  baseURL,
}, testInfo) => {
  test.setTimeout(150000);
  test.skip(
    !baseURL || ['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname),
    'Requires the production OPFS path on a local HTTPS development origin'
  );
  await setupApp(page);
  await dismissOnboardingTour(page);

  const inspect = () =>
    page.evaluate(async () => {
      const { getGlobalDatabase } =
        await import('/app/src/lib/db-singleton.ts');
      const db = getGlobalDatabase();
      const integrity = await db.queryOneAsync('PRAGMA integrity_check');
      const count = await db.queryOneAsync(
        'SELECT COUNT(*) AS count FROM transactions WHERE is_deleted = 0'
      );
      const root = await navigator.storage.getDirectory();
      const handle = await root.getFileHandle('fluxby.db');
      const file = await handle.getFile();
      return {
        integrity,
        count: count.count,
        physicalSize: file.size,
        header: Array.from(
          new Uint8Array(await file.slice(0, 16).arrayBuffer())
        ),
      };
    });

  const before = await inspect();
  expect(before.integrity).toEqual({ integrity_check: 'ok' });
  expect(before.count).toBeGreaterThan(0);
  expect(before.physicalSize % 4124).toBe(0);
  expect(String.fromCharCode(...before.header)).not.toBe('SQLite format 3\0');

  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Unlock', exact: true })
  ).toBeVisible({
    timeout: 30000,
  });
  await unlockTestApp(page);
  await expect(
    page.getByRole('link', { name: 'Dashboard', exact: true })
  ).toBeVisible({
    timeout: 30000,
  });
  const after = await inspect();
  expect(after.integrity).toEqual({ integrity_check: 'ok' });
  expect(after.count).toBe(before.count);
  expect(after.physicalSize % 4124).toBe(0);
  expect(String.fromCharCode(...after.header)).not.toBe('SQLite format 3\0');
  await testInfo.attach('encrypted-opfs-recovery', {
    body: JSON.stringify({ before, after }, null, 2),
    contentType: 'application/json',
  });
});
