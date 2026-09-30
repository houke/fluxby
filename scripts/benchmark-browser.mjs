/** Isolated Chromium benchmark of the real browser database and UI. */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { URL } from 'node:url';
import { Buffer } from 'node:buffer';
import { setTimeout } from 'node:timers';

const base =
  process.env.PERFORMANCE_BASE_URL || 'https://fluxby.local:5177/app/';
const output = resolve(
  process.env.PERFORMANCE_OUTPUT ||
    '.nexus/tmp/app-review-performance/browser.json'
);
const password = 'PerformanceTest1234';
const importSizes = (process.env.PERFORMANCE_IMPORT_ROWS || '1000,10000')
  .split(',')
  .map((value) => Number(value.trim()));
if (
  importSizes.length === 0 ||
  importSizes.some((count) => !Number.isSafeInteger(count) || count <= 0)
) {
  throw new Error('PERFORMANCE_IMPORT_ROWS must be positive integers');
}
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  ignoreHTTPSErrors: true,
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('framenavigated', (frame) => {
  if (frame === page.mainFrame())
    console.log(`BENCHMARK_NAV ${new Date().toISOString()} ${frame.url()}`);
});
page.on('crash', () => console.log('BENCHMARK_CRASH'));
page.on('console', (message) => {
  if (message.text().startsWith('BENCHMARK_PROGRESS'))
    console.log(message.text());
  if (message.type() === 'error') errors.push(message.text());
});
const report = {
  timestamp: new Date().toISOString(),
  base,
  browser: browser.version(),
  mode: 'development',
  isolatedContext: true,
  startup: {},
  imports: [],
  queries: [],
  idle: [],
  restore: null,
  errors,
};
const elapsed = (started) =>
  Math.round((performance.now() - started) * 10) / 10;
const modulePath = (name) => `${new URL(base).pathname}src/lib/${name}.ts`;
const isVisible = async (locator) => locator.isVisible().catch(() => false);
async function unlockIfNeeded() {
  const lock = page.getByText(/unlock fluxby/i);
  if (await isVisible(lock)) {
    await page.locator('input[type=password]').fill(password);
    await page.getByRole('button', { name: /^unlock$/i }).click();
  }
}
async function dismissTour() {
  const welcome = page.getByRole('heading', { name: /welcome to fluxby/i });
  if (await isVisible(welcome))
    await page.getByRole('button', { name: /get started/i }).click();
  const skip = page.getByRole('button', { name: /^skip$/i });
  if (await isVisible(skip)) await skip.click();
  const explore = page.getByRole('button', { name: /import my transactions/i });
  if (await isVisible(explore)) await explore.click();
}
try {
  let started = performance.now();
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page
    .getByRole('button', { name: /english/i })
    .waitFor({ timeout: 30000 });
  report.startup.freshToSetupMs = elapsed(started);
  await page.getByRole('button', { name: /english/i }).click();
  await page.locator('input[type=text]').first().fill('Performance Test');
  await page.getByRole('button', { name: /^next$/i }).click();
  await page.getByRole('radio', { name: /import my transactions/i }).check();
  await page.locator('input[placeholder="Master password..."]').fill(password);
  await page.locator('input[placeholder="Confirm password..."]').fill(password);
  await page.getByRole('button', { name: /get started/i }).click();
  await page.waitForTimeout(2000);
  await unlockIfNeeded();
  await page
    .getByRole('link', { name: /^dashboard$/i })
    .waitFor({ timeout: 30000 });
  await dismissTour();
  // Reload once to measure encrypted startup separately from interactive setup.
  started = performance.now();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByText(/unlock fluxby/i).waitFor({ timeout: 30000 });
  report.startup.encryptedToLockMs = elapsed(started);
  started = performance.now();
  await unlockIfNeeded();
  await page
    .getByRole('link', { name: /^dashboard$/i })
    .waitFor({ timeout: 30000 });
  await dismissTour();
  report.startup.unlockToReadyMs = elapsed(started);
  console.log(JSON.stringify({ stage: 'startup', result: report.startup }));

  const singletonsPath = modulePath('db-singleton');
  const ids = await page.evaluate(async (path) => {
    const { getDataService, getGlobalDatabase } = await import(path);
    const service = getDataService();
    const profiles = await service.getProfiles();
    const profile = profiles.find((item) => item.type === 'personal');
    if (!profile) throw new Error('Missing isolated personal profile');
    const account = await service.createAccount({
      iban: 'NL91ABNA0417164300',
      name: 'Performance account',
      bank: 'ing',
      type: 'checking',
    });
    const tables = await getGlobalDatabase().queryAsync(
      'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1'
    );
    return {
      accountId: account.id,
      profileId: profile.id,
      schemaVersion: tables[0]?.version,
    };
  }, singletonsPath);
  report.schemaVersion = ids.schemaVersion;
  const importOptions = {
    accountId: ids.accountId,
    filename: 'synthetic-performance.csv',
    bank: 'ing',
    direction: 'Debit/credit',
    mapping: {
      date: 'Date',
      amount: 'Amount (EUR)',
      description: 'Name / Description',
      iban: 'Account',
      counterparty: 'Counterparty',
      notes: 'Notifications',
      paymentMethod: 'Transaction type',
    },
  };
  let importedRows = 0;
  for (const count of importSizes) {
    const csv = [
      '"Date","Name / Description","Account","Counterparty","Debit/credit","Amount (EUR)","Transaction type","Notifications"',
      ...Array.from(
        { length: count },
        (_, i) =>
          `"202609${String((i % 28) + 1).padStart(2, '0')}","Perf merchant ${count}-${i % 10}","NL91ABNA0417164300","NL89ABNA0400404040","Debit","${((i % 499) + 1) / 100}","Payment terminal","Quoted, note ${count}-${i} with ""word"""`
      ),
    ].join('\n');
    const result = await page.evaluate(
      async ({ path, csv, options }) => {
        const { getDataService } = await import(path);
        const service = getDataService();
        const started = performance.now();
        let lastProgress = -1;
        const result = await service.importCsv(csv, {
          ...options,
          onProgress: (current, total) => {
            if (current % 1000 === 0 && current !== lastProgress) {
              lastProgress = current;
              console.log(
                `BENCHMARK_PROGRESS ${current}/${total} ${Math.round(performance.now() - started)}ms`
              );
            }
          },
        });
        return {
          elapsedMs: Math.round(performance.now() - started),
          imported: result.imported,
          skipped: result.skipped,
          errors: result.errors.length,
        };
      },
      { path: singletonsPath, csv, options: importOptions }
    );
    report.imports.push({
      rows: count,
      bytes: Buffer.byteLength(csv),
      ...result,
    });
    console.log(
      JSON.stringify({ stage: 'import', result: report.imports.at(-1) })
    );
    if (result.imported !== count || result.errors)
      throw new Error('Synthetic CSV import did not preserve every row');
    importedRows += result.imported;
    const integrity = await page.evaluate(async (path) => {
      const { getGlobalDatabase } = await import(path);
      return getGlobalDatabase().queryAsync('PRAGMA integrity_check');
    }, singletonsPath);
    report.imports.at(-1).integrity = integrity;
    if (integrity[0]?.integrity_check !== 'ok')
      throw new Error('SQLite integrity_check failed after import');
    const timings = await page.evaluate(
      async ({ path, accountId }) => {
        const { getDataService } = await import(path);
        const service = getDataService();
        const samples = [];
        let count;
        for (let i = 0; i < 5; i++) {
          const started = performance.now();
          const rows = await service.getTransactions({
            accountId,
            limit: '100',
            offset: '0',
          });
          samples.push(Math.round((performance.now() - started) * 10) / 10);
          count = rows.length;
        }
        return { pageRows: count, samplesMs: samples };
      },
      { path: singletonsPath, accountId: ids.accountId }
    );
    report.queries.push({
      datasetRows: importedRows,
      ...timings,
    });
  }
  started = performance.now();
  await page.getByRole('link', { name: /^transactions$/i }).click();
  await page
    .locator('[data-onboarding="transaction-row"]')
    .first()
    .waitFor({ timeout: 30000 });
  report.transactionList = {
    firstRenderedRowMs: elapsed(started),
    rowsInDom: await page
      .locator('[data-onboarding="transaction-row"]')
      .count(),
  };
  console.log(
    JSON.stringify({ stage: 'render', result: report.transactionList })
  );
  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');
  const metrics = async () =>
    Object.fromEntries(
      (await cdp.send('Performance.getMetrics')).metrics.map((item) => [
        item.name,
        item.value,
      ])
    );
  let before = await metrics();
  for (let i = 0; i < 3; i++) {
    await page.waitForTimeout(20000);
    const after = await metrics();
    report.idle.push({
      elapsedSeconds: (i + 1) * 20,
      rendererTaskSeconds: +(after.TaskDuration - before.TaskDuration).toFixed(
        3
      ),
      rendererTaskPercent: +(
        ((after.TaskDuration - before.TaskDuration) / 20) *
        100
      ).toFixed(2),
      jsHeapMB: +(after.JSHeapUsedSize / 1048576).toFixed(2),
      nodes: after.Nodes,
      documents: after.Documents,
      frames: after.Frames,
      state: 'visible',
    });
    before = after;
    console.log(JSON.stringify({ stage: 'idle', result: report.idle.at(-1) }));
  }
  await cdp.send('Page.setWebLifecycleState', { state: 'frozen' });
  before = await metrics();
  await new Promise((resolve) => setTimeout(resolve, 10000));
  const frozen = await metrics();
  report.idle.push({
    elapsedSeconds: 70,
    state: 'frozen',
    rendererTaskSeconds: +(frozen.TaskDuration - before.TaskDuration).toFixed(
      3
    ),
    rendererTaskPercent: +(
      ((frozen.TaskDuration - before.TaskDuration) / 10) *
      100
    ).toFixed(2),
    jsHeapMB: +(frozen.JSHeapUsedSize / 1048576).toFixed(2),
  });
  await cdp.send('Page.setWebLifecycleState', { state: 'active' });
  await unlockIfNeeded();
  const restored = await page.evaluate(async (path) => {
    const { getDataService } = await import(path);
    const service = getDataService();
    const backup = await service.exportAll();
    const db = (await import(path)).getGlobalDatabase();
    const countRows = async () =>
      (
        await db.queryAsync(
          'SELECT COUNT(*) AS count FROM transactions WHERE is_deleted = 0'
        )
      )[0].count;
    const before = await countRows();
    const started = performance.now();
    try {
      await service.importAll(backup);
      return {
        success: true,
        before,
        after: await countRows(),
        elapsedMs: Math.round(performance.now() - started),
        tables: backup.tableManifest,
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        before,
        after: await countRows(),
        elapsedMs: Math.round(performance.now() - started),
      };
    }
  }, singletonsPath);
  report.restore = restored;
  console.log(JSON.stringify({ stage: 'restore', result: restored }));
} catch (error) {
  report.failure = error.message;
  const detail = page.locator('details');
  if (await detail.isVisible().catch(() => false))
    report.errorDetails = await detail.innerText();
  report.bodyAtFailure = (await page.locator('body').innerText()).slice(
    0,
    4000
  );
  console.error(error.message);
  await page
    .screenshot({
      path: output.replace(/\.json$/, '-failure.png'),
      fullPage: true,
    })
    .catch(() => undefined);
  process.exitCode = 1;
} finally {
  await mkdir(resolve(output, '..'), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  await context.close();
  await browser.close();
  console.log(`Performance report saved: ${output}`);
}
