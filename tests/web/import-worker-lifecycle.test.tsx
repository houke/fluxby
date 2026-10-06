/** @vitest-environment jsdom */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useImportWorker } from '@/hooks/useImportWorker';
import { DEFAULT_IMPORT_OPTIONS } from '@/lib/importers/import-options';
import type { WorkerResponse } from '@/workers/import-worker';

class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();

  constructor() {
    FakeWorker.instances.push(this);
  }

  emit(data: WorkerResponse) {
    this.onmessage?.(new MessageEvent('message', { data }));
  }
}

const messages = {
  importCancelled: 'Parsing cancelled',
  unknownError: 'Unknown parsing error',
  error: 'Parsing failed',
};
const preview = {
  headers: ['Date', 'Amount'],
  sampleRows: [{ Date: '2026-10-01', Amount: '-10' }],
  totalRows: 1,
};

describe('Import worker lifecycle', () => {
  beforeEach(() => {
    FakeWorker.instances = [];
    vi.stubGlobal('Worker', FakeWorker);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('rejects superseded parsing and ignores late messages from its retired worker', async () => {
    const { result } = renderHook(() => useImportWorker(messages));
    let first!: ReturnType<typeof result.current.parseCSV>;
    act(() => {
      first = result.current.parseCSV('old CSV');
    });
    const firstOutcome = first.catch((error: Error) => error);
    const oldWorker = FakeWorker.instances[0];
    const oldHandler = oldWorker.onmessage;
    if (!oldHandler) throw new Error('Worker has no message handler');
    let second!: ReturnType<typeof result.current.parseCSV>;
    act(() => {
      second = result.current.parseCSV('new CSV');
    });
    const secondResolved = vi.fn();
    void second.then(secondResolved);

    expect(await firstOutcome).toEqual(new Error(messages.importCancelled));
    expect(oldWorker.terminate).toHaveBeenCalledTimes(1);
    expect(oldWorker.onmessage).toBeNull();
    act(() => {
      oldHandler(
        new MessageEvent('message', {
          data: { type: 'preview', data: preview },
        })
      );
      oldHandler(
        new MessageEvent('message', {
          data: { type: 'progress', progress: 90 },
        })
      );
    });
    expect(secondResolved).not.toHaveBeenCalled();
    expect(result.current.progress).toBe(0);
    expect(result.current.isProcessing).toBe(true);

    act(() => FakeWorker.instances[1].emit({ type: 'preview', data: preview }));
    expect(await second).toEqual(preview);
    expect(result.current.isProcessing).toBe(false);
  });

  it.each(['reset', 'abort'] as const)(
    '%s terminates active work, rejects its promise and allows a fresh parse',
    async (action) => {
      const { result } = renderHook(() => useImportWorker(messages));
      let pending!: ReturnType<typeof result.current.parseCSV>;
      act(() => {
        pending = result.current.parseCSV('CSV');
      });
      const outcome = pending.catch((error: Error) => error);
      const worker = FakeWorker.instances[0];

      act(() => result.current[action]());
      expect(await outcome).toEqual(new Error(messages.importCancelled));
      expect(worker.terminate).toHaveBeenCalledTimes(1);
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.error).toBe(
        action === 'abort' ? messages.importCancelled : null
      );

      let fresh!: ReturnType<typeof result.current.parseCSV>;
      act(() => {
        fresh = result.current.parseCSV('fresh CSV');
      });
      expect(FakeWorker.instances).toHaveLength(2);
      act(() =>
        FakeWorker.instances[1].emit({ type: 'preview', data: preview })
      );
      expect(await fresh).toEqual(preview);
    }
  );

  it('settles pending work and releases the worker on unmount', async () => {
    const { result, unmount } = renderHook(() => useImportWorker(messages));
    let pending!: ReturnType<typeof result.current.parseCSV>;
    act(() => {
      pending = result.current.parseCSV('CSV');
    });
    const outcome = pending.catch((error: Error) => error);
    const worker = FakeWorker.instances[0];

    unmount();

    expect(await outcome).toEqual(new Error(messages.importCancelled));
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(worker.onmessage).toBeNull();
    expect(worker.onerror).toBeNull();
  });

  it('reuses a completed worker and forwards full-parse mapping', async () => {
    const { result } = renderHook(() => useImportWorker(messages));
    let first!: ReturnType<typeof result.current.parseCSV>;
    act(() => {
      first = result.current.parseCSV('CSV');
    });
    const worker = FakeWorker.instances[0];
    act(() => worker.emit({ type: 'preview', data: preview }));
    expect(await first).toEqual(preview);

    const mapping = {
      date: 'Date',
      amount: 'Amount',
      description: 'Description',
    };
    let second!: ReturnType<typeof result.current.parseWithMapping>;
    act(() => {
      second = result.current.parseWithMapping('mapped CSV', mapping, 'ing');
    });
    expect(FakeWorker.instances).toHaveLength(1);
    expect(worker.postMessage).toHaveBeenLastCalledWith({
      type: 'parse',
      payload: { csvContent: 'mapped CSV', mapping, bank: 'ing' },
    });
    const parsed = {
      headers: preview.headers,
      rows: [],
      totalRows: 0,
      validRows: 0,
      errorRows: 0,
    };
    act(() => worker.emit({ type: 'result', data: parsed }));
    expect(await second).toEqual(parsed);
  });

  it('forwards configured preview and preparation options and settles prepared responses', async () => {
    const { result } = renderHook(() => useImportWorker(messages));
    const options = { ...DEFAULT_IMPORT_OPTIONS, delimiter: '\t' as const };
    let parsing!: ReturnType<typeof result.current.parseCSV>;
    act(() => {
      parsing = result.current.parseCSV('tab export', options);
    });
    const worker = FakeWorker.instances[0];
    expect(worker.postMessage).toHaveBeenLastCalledWith({
      type: 'parse',
      payload: { csvContent: 'tab export', options },
    });
    act(() => worker.emit({ type: 'preview', data: preview }));
    expect(await parsing).toEqual(preview);

    const mapping = {
      date: 'Date',
      amount: 'Amount',
      description: 'Description',
    };
    let preparing!: ReturnType<typeof result.current.prepareCSV>;
    act(() => {
      preparing = result.current.prepareCSV('tab export', mapping, options);
    });
    expect(worker.postMessage).toHaveBeenLastCalledWith({
      type: 'parse',
      payload: { csvContent: 'tab export', mapping, options, prepare: true },
    });
    const prepared = { csv: 'normalized CSV', mapping };
    act(() => worker.emit({ type: 'prepared', data: prepared }));
    expect(await preparing).toEqual(prepared);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.progress).toBe(100);
  });

  it.each(['message', 'runtime'] as const)(
    'retires a failed worker after a %s error',
    async (failure) => {
      const { result } = renderHook(() => useImportWorker(messages));
      let pending!: ReturnType<typeof result.current.parseCSV>;
      act(() => {
        pending = result.current.parseCSV('CSV');
      });
      const outcome = pending.catch((error: Error) => error);
      const worker = FakeWorker.instances[0];
      act(() => {
        if (failure === 'message')
          worker.emit({ type: 'error', error: 'Invalid CSV' });
        else
          worker.onerror?.(new ErrorEvent('error', { message: 'Invalid CSV' }));
      });

      expect(await outcome).toEqual(new Error('Invalid CSV'));
      expect(result.current.error).toBe('Invalid CSV');
      expect(result.current.isProcessing).toBe(false);
      expect(worker.terminate).toHaveBeenCalledTimes(1);
    }
  );

  it('does not leave processing active when constructing a worker fails', async () => {
    vi.stubGlobal(
      'Worker',
      class {
        constructor() {
          throw new Error('Worker unavailable');
        }
      }
    );
    const { result } = renderHook(() => useImportWorker(messages));
    let pending!: ReturnType<typeof result.current.parseCSV>;
    act(() => {
      pending = result.current.parseCSV('CSV');
    });

    await expect(pending).rejects.toThrow('Worker unavailable');
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBe('Worker unavailable');
  });
});
