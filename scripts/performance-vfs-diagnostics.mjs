/** Optional, isolated benchmark counters; never loaded by the application. */
export async function installVfsDiagnostics(page) {
  return page.evaluate(async () => {
    const moduleUrl = globalThis.performance
      .getEntriesByType('resource')
      .map((entry) => entry.name)
      .find((name) =>
        /\/packages\/database\/src\/encryption-vfs\.ts(?:\?|$)/.test(name)
      );
    if (!moduleUrl) throw new Error('Encryption VFS module was not loaded');
    const { EncryptionVFS } = await import(moduleUrl);
    const instances = new WeakSet();
    const files = new Map();
    const statements = new Map();
    let phaseTimer;
    let attached = 0;
    const metricFor = (pathname, name) => {
      let file = files.get(pathname);
      if (!file) {
        file = {
          methods: {},
          locks: { shared: 0, redundantShared: 0, newShared: 0, fullUnlock: 0 },
        };
        files.set(pathname, file);
      }
      let metric = file.methods[name];
      if (!metric) {
        metric = {
          calls: 0,
          elapsedMs: 0,
          maxMs: 0,
          bytes: 0,
          activeWritableCalls: 0,
          writableOpened: 0,
          failures: 0,
        };
        file.methods[name] = metric;
      }
      return { file, metric };
    };
    const recordFlags = (file, flags) => {
      if (flags === undefined) return;
      file.flags = flags;
      file.types = Object.entries({
        mainDatabase: 0x100,
        tempDatabase: 0x200,
        transientDatabase: 0x400,
        rollbackJournal: 0x800,
        tempJournal: 0x1000,
        statementJournal: 0x2000,
      })
        .filter(([, mask]) => flags & mask)
        .map(([type]) => type);
      file.deleteOnClose = Boolean(flags & 0x8);
    };
    const attach = (base) => {
      if (instances.has(base)) return;
      instances.add(base);
      attached++;
      const heldLocks = new Map();
      for (const name of [
        'jOpen',
        'jClose',
        'jRead',
        'jWrite',
        'jFileSize',
        'jTruncate',
        'jSync',
        'jLock',
        'jUnlock',
      ]) {
        const original = base[name];
        base[name] = async function (...args) {
          const handle = name === 'jOpen' ? args[1] : args[0];
          const opened = base.mapIdToFile?.get(handle);
          const pathname =
            opened?.pathname ||
            (name === 'jOpen' ? args[0] : `handle:${handle}`);
          const { file, metric } = metricFor(pathname, name);
          recordFlags(file, opened?.flags);
          const wasWritable = Boolean(opened?.writable);
          const previousLock = heldLocks.get(handle) || 0;
          metric.calls++;
          if (wasWritable) metric.activeWritableCalls++;
          if (name === 'jRead' || name === 'jWrite')
            metric.bytes += args[1].byteLength;
          const started = globalThis.performance.now();
          try {
            const result = await original.apply(this, args);
            if (result !== 0) metric.failures++;
            if (result === 0) {
              const current = base.mapIdToFile?.get(handle);
              if (current)
                recordFlags(
                  metricFor(current.pathname, name).file,
                  current.flags
                );
              if (!wasWritable && current?.writable) metric.writableOpened++;
              if (name === 'jFileSize')
                file.lastStatBytes = Number(args[1].getBigInt64(0, true));
              if (name === 'jLock') {
                if (args[1] === 1) {
                  file.locks.shared++;
                  if (previousLock === 0) file.locks.newShared++;
                  else file.locks.redundantShared++;
                }
                heldLocks.set(handle, Math.max(previousLock, args[1]));
              } else if (name === 'jUnlock') {
                if (args[1] === 0 && previousLock !== 0)
                  file.locks.fullUnlock++;
                heldLocks.set(handle, Math.min(previousLock, args[1]));
              } else if (name === 'jOpen' || name === 'jClose') {
                heldLocks.delete(handle);
              }
            }
            return result;
          } catch (error) {
            metric.failures++;
            throw error;
          } finally {
            const duration = globalThis.performance.now() - started;
            metric.elapsedMs += duration;
            metric.maxMs = Math.max(metric.maxMs, duration);
          }
        };
      }
    };
    const originalInitialize = EncryptionVFS.prototype.initialize;
    EncryptionVFS.prototype.initialize = async function (...args) {
      attach(this.baseVFS);
      return originalInitialize.apply(this, args);
    };
    const databaseModuleUrl = globalThis.performance
      .getEntriesByType('resource')
      .map((entry) => entry.name)
      .find((name) =>
        /\/packages\/database\/src\/wa-sqlite\.ts(?:\?|$)/.test(name)
      );
    if (databaseModuleUrl) {
      const { Database } = await import(databaseModuleUrl);
      for (const method of [
        'runAsync',
        'queryAsync',
        'queryOneAsync',
        'executeSql',
      ]) {
        const original = Database.prototype[method];
        Database.prototype[method] = async function (sql, ...args) {
          // Operation/table labels only: no SQL values, records or encryption keys.
          const action = sql.trim().split(/\s+/, 1)[0].toUpperCase();
          const table = sql.match(
            /(?:UPDATE(?:\s+OR\s+FAIL)?|INSERT(?:\s+OR\s+FAIL)?\s+INTO|DELETE\s+FROM|FROM)\s+"?([a-z_]+)/i
          )?.[1];
          const stamp =
            action === 'WITH' || /SET updated_at = CASE id/.test(sql);
          const label = `${stamp ? 'STAMP' : action}${table ? ` ${table}` : ''}`;
          let metric = statements.get(label);
          if (!metric) {
            metric = { calls: 0, settled: 0, failures: 0, elapsedMs: 0 };
            statements.set(label, metric);
          }
          metric.calls++;
          const started = globalThis.performance.now();
          try {
            return await original.call(this, sql, ...args);
          } catch (error) {
            metric.failures++;
            throw error;
          } finally {
            metric.settled++;
            metric.elapsedMs += globalThis.performance.now() - started;
          }
        };
      }
    }
    const diagnostics = {
      reset() {
        files.clear();
        statements.clear();
      },
      startPhase(phase) {
        globalThis.clearInterval(phaseTimer);
        diagnostics.reset();
        const started = globalThis.performance.now();
        const report = () =>
          console.log(
            `BENCHMARK_VFS_PHASE ${phase} ${Math.round(globalThis.performance.now() - started)}ms ${JSON.stringify(diagnostics.snapshot())}`
          );
        report();
        phaseTimer = globalThis.setInterval(report, 1000);
      },
      stopPhase() {
        globalThis.clearInterval(phaseTimer);
        return diagnostics.snapshot();
      },
      snapshot() {
        return {
          attached,
          statements: Object.fromEntries(
            [...statements].map(([label, metric]) => [
              label,
              {
                ...metric,
                elapsedMs: Math.round(metric.elapsedMs * 10) / 10,
              },
            ])
          ),
          files: Object.fromEntries(
            [...files].map(([pathname, file]) => [
              pathname,
              {
                ...file,
                methods: Object.fromEntries(
                  Object.entries(file.methods).map(([name, metric]) => [
                    name,
                    {
                      ...metric,
                      elapsedMs: Math.round(metric.elapsedMs * 10) / 10,
                      maxMs: Math.round(metric.maxMs * 10) / 10,
                    },
                  ])
                ),
              },
            ])
          ),
        };
      },
    };
    globalThis.__fluxbyVfsDiagnostics = diagnostics;
    return moduleUrl;
  });
}
