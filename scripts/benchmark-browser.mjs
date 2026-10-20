/* global navigator */
/** Isolated Chromium benchmark of the real browser database and UI. */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { URL } from 'node:url';
import { Buffer } from 'node:buffer';
import { setTimeout } from 'node:timers';
import { installVfsDiagnostics } from './performance-vfs-diagnostics.mjs';

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
const idleWindows = Number(process.env.PERFORMANCE_IDLE_WINDOWS || '3');
if (
  importSizes.length === 0 ||
  importSizes.some((count) => !Number.isSafeInteger(count) || count <= 0)
) {
  throw new Error('PERFORMANCE_IMPORT_ROWS must be positive integers');
}
if (!Number.isSafeInteger(idleWindows) || idleWindows <= 0) {
  throw new Error('PERFORMANCE_IDLE_WINDOWS must be a positive integer');
}
const minimizeForBackground =
  process.env.PERFORMANCE_BACKGROUND_MODE === 'minimize';
const collectVfsDiagnostics =
  process.env.PERFORMANCE_VFS_DIAGNOSTICS === 'true';
const browser = await chromium.launch({ headless: !minimizeForBackground });
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
  if (
    message.text().startsWith('BENCHMARK_PROGRESS') ||
    message.text().startsWith('BENCHMARK_VFS')
  )
    console.log(message.text());
  if (message.type() === 'error') errors.push(message.text());
});
const report = {
  timestamp: new Date().toISOString(),
  base,
  browser: browser.version(),
  mode: 'development',
  isolatedContext: true,
  idleWindows,
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
  if (collectVfsDiagnostics) await installVfsDiagnostics(page);
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
  if (collectVfsDiagnostics) await installVfsDiagnostics(page);
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
  report.databaseSettings = await page.evaluate(async (path) => {
    const { getGlobalDatabase } = await import(path);
    const db = getGlobalDatabase();
    const settings = {};
    for (const name of [
      'cache_size',
      'cache_spill',
      'page_count',
      'page_size',
      'journal_mode',
      'synchronous',
    ]) {
      settings[name] = await db.queryOneAsync(`PRAGMA ${name}`);
    }
    return settings;
  }, singletonsPath);
  console.log(
    JSON.stringify({
      stage: 'databaseSettings',
      result: report.databaseSettings,
    })
  );
  report.storage = await page.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    const file = await (await root.getFileHandle('fluxby.db')).getFile();
    return {
      backend: file.size > 0 ? 'opfs' : 'indexeddb',
      encrypted:
        file.size > 0 &&
        !(await file.slice(0, 16).text()).startsWith('SQLite format 3'),
    };
  });
  if (
    new URL(base).hostname === 'fluxby.local' &&
    (report.storage.backend !== 'opfs' || !report.storage.encrypted)
  ) {
    throw new Error('Expected encrypted OPFS storage on fluxby.local');
  }
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
  // Keep the synthetic rows in the browser's default current-month filter.
  // A fixed month silently turns the rendering benchmark into an empty view.
  const importMonth = await page.evaluate(() => {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  for (const count of importSizes) {
    const csv = [
      '"Date","Name / Description","Account","Counterparty","Debit/credit","Amount (EUR)","Transaction type","Notifications"',
      ...Array.from(
        { length: count },
        (_, i) =>
          `"${importMonth}${String((i % 28) + 1).padStart(2, '0')}","Perf merchant ${count}-${i % 10}","NL91ABNA0417164300","NL89ABNA0400404040","Debit","${((i % 499) + 1) / 100}","Payment terminal","Quoted, note ${count}-${i} with ""word"""`
      ),
    ].join('\n');
    const result = await page.evaluate(
      async ({ path, csv, options, diagnostic }) => {
        const { getDataService } = await import(path);
        const service = getDataService();
        const started = performance.now();
        let lastProgress = -1;
        if (diagnostic) globalThis.__fluxbyVfsDiagnostics.reset();
        const result = await service.importCsv(csv, {
          ...options,
          onProgress: (current, total) => {
            if (current % 1000 === 0 && current !== lastProgress) {
              lastProgress = current;
              console.log(
                `BENCHMARK_PROGRESS ${current}/${total} ${Math.round(performance.now() - started)}ms`
              );
              if (diagnostic)
                console.log(
                  `BENCHMARK_VFS ${current}/${total} ${JSON.stringify(globalThis.__fluxbyVfsDiagnostics.snapshot())}`
                );
            }
          },
        });
        return {
          elapsedMs: Math.round(performance.now() - started),
          imported: result.imported,
          skipped: result.skipped,
          errors: result.errors.length,
          ...(diagnostic
            ? { vfs: globalThis.__fluxbyVfsDiagnostics.snapshot() }
            : {}),
        };
      },
      {
        path: singletonsPath,
        csv,
        options: importOptions,
        diagnostic: collectVfsDiagnostics,
      }
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
  if (process.env.PERFORMANCE_TRACE === 'true') {
    await cdp.send('Tracing.start', {
      categories: 'devtools.timeline,v8,disabled-by-default-v8.cpu_profiler',
      transferMode: 'ReturnAsStream',
    });
  }
  let before = await metrics();
  for (let i = 0; i < idleWindows; i++) {
    await page.waitForTimeout(20000);
    const after = await metrics();
    const transactionViewVisible = await page
      .locator('[data-onboarding="transaction-row"]')
      .first()
      .isVisible();
    report.idle.push({
      elapsedSeconds: (i + 1) * 20,
      sampleSeconds: +(after.Timestamp - before.Timestamp).toFixed(3),
      rendererTaskSeconds: +(after.TaskDuration - before.TaskDuration).toFixed(
        3
      ),
      rendererTaskPercent: +(
        ((after.TaskDuration - before.TaskDuration) /
          (after.Timestamp - before.Timestamp)) *
        100
      ).toFixed(2),
      scriptSeconds: +(after.ScriptDuration - before.ScriptDuration).toFixed(3),
      layoutSeconds: +(after.LayoutDuration - before.LayoutDuration).toFixed(3),
      jsHeapMB: +(after.JSHeapUsedSize / 1048576).toFixed(2),
      nodes: after.Nodes,
      documents: after.Documents,
      frames: after.Frames,
      state: 'visible',
      transactionViewVisible,
    });
    before = after;
    console.log(JSON.stringify({ stage: 'idle', result: report.idle.at(-1) }));
    if (!transactionViewVisible) {
      throw new Error('Transaction view disappeared during idle measurement');
    }
  }
  let windowId;
  // Read page state while JavaScript can still execute. A Runtime.evaluate on
  // a truly frozen page waits indefinitely until the page is resumed.
  let backgroundVisibilityState;
  if (minimizeForBackground) {
    ({ windowId } = await cdp.send('Browser.getWindowForTarget'));
    await cdp.send('Browser.setWindowBounds', {
      windowId,
      bounds: { windowState: 'minimized' },
    });
    await page.waitForFunction(() => globalThis.document.hidden, undefined, {
      polling: 100,
      timeout: 10000,
    });
    backgroundVisibilityState = await page.evaluate(
      () => globalThis.document.visibilityState
    );
  } else {
    backgroundVisibilityState = await page.evaluate(
      () => globalThis.document.visibilityState
    );
    await cdp.send('Page.setWebLifecycleState', { state: 'frozen' });
  }
  before = await metrics();
  await new Promise((resolve) => setTimeout(resolve, 10000));
  const frozen = await metrics();
  report.idle.push({
    elapsedSeconds: idleWindows * 20 + 10,
    state: minimizeForBackground ? 'minimized' : 'cdp-freeze-request',
    visibilityState: backgroundVisibilityState,
    visibilityObservation: minimizeForBackground
      ? 'after-minimizing'
      : 'before-freeze-request',
    sampleSeconds: +(frozen.Timestamp - before.Timestamp).toFixed(3),
    rendererTaskSeconds: +(frozen.TaskDuration - before.TaskDuration).toFixed(
      3
    ),
    rendererTaskPercent: +(
      ((frozen.TaskDuration - before.TaskDuration) /
        (frozen.Timestamp - before.Timestamp)) *
      100
    ).toFixed(2),
    scriptSeconds: +(frozen.ScriptDuration - before.ScriptDuration).toFixed(3),
    layoutSeconds: +(frozen.LayoutDuration - before.LayoutDuration).toFixed(3),
    jsHeapMB: +(frozen.JSHeapUsedSize / 1048576).toFixed(2),
  });
  if (minimizeForBackground) {
    await cdp.send('Browser.setWindowBounds', {
      windowId,
      bounds: { windowState: 'normal' },
    });
    await page.bringToFront();
    await page.waitForFunction(() => !globalThis.document.hidden, undefined, {
      polling: 100,
      timeout: 10000,
    });
  } else {
    await cdp.send('Page.setWebLifecycleState', { state: 'active' });
  }
  if (process.env.PERFORMANCE_TRACE === 'true') {
    const completed = new Promise((resolve) =>
      cdp.once('Tracing.tracingComplete', resolve)
    );
    await cdp.send('Tracing.end');
    const { stream } = await completed;
    let trace = '';
    try {
      while (true) {
        const chunk = await cdp.send('IO.read', { handle: stream });
        trace += chunk.base64Encoded
          ? Buffer.from(chunk.data, 'base64').toString('utf8')
          : chunk.data;
        if (chunk.eof) break;
      }
    } finally {
      await cdp.send('IO.close', { handle: stream });
    }
    await mkdir(resolve(output, '..'), { recursive: true });
    report.idleTrace = output.replace(/\.json$/, '-idle-trace.json');
    await writeFile(report.idleTrace, trace);
  }
  await unlockIfNeeded();
  const restored = await page.evaluate(async (path) => {
    const { getDataService } = await import(path);
    const service = getDataService();
    console.log('BENCHMARK_BACKUP_EXPORT_START');
    const exportStarted = performance.now();
    const diagnostics = globalThis.__fluxbyVfsDiagnostics;
    diagnostics?.startPhase('export');
    let backup;
    try {
      backup = await service.exportAll();
    } finally {
      diagnostics?.stopPhase();
    }
    const exportMs = Math.round(performance.now() - exportStarted);
    console.log(`BENCHMARK_BACKUP_EXPORT_COMPLETE ${exportMs}ms`);
    const db = (await import(path)).getGlobalDatabase();
    const countRows = async () =>
      (
        await db.queryAsync(
          'SELECT COUNT(*) AS count FROM transactions WHERE is_deleted = 0'
        )
      )[0].count;
    const before = await countRows();
    const started = performance.now();
    console.log(`BENCHMARK_RESTORE_START ${before} rows`);
    diagnostics?.startPhase('restore');
    try {
      await service.importAll(backup);
      return {
        success: true,
        before,
        after: await countRows(),
        elapsedMs: Math.round(performance.now() - started),
        exportMs,
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
    } finally {
      diagnostics?.stopPhase();
    }
  }, singletonsPath);
  report.restore = restored;
  console.log(JSON.stringify({ stage: 'restore', result: restored }));
  if (
    !restored.success ||
    restored.before !== importedRows ||
    restored.after !== importedRows
  ) {
    throw new Error('Backup restore did not preserve every imported row');
  }
  const integrityAfterRestore = await page.evaluate(async (path) => {
    const { getGlobalDatabase } = await import(path);
    return getGlobalDatabase().queryAsync('PRAGMA integrity_check');
  }, singletonsPath);
  report.restore.integrity = integrityAfterRestore;
  if (integrityAfterRestore[0]?.integrity_check !== 'ok') {
    throw new Error('SQLite integrity_check failed after restore');
  }
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
