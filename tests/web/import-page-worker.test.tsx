/** @vitest-environment jsdom */
import React from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Import from '@/pages/Import';
import { en } from '@/lib/i18n/en';
import { nl } from '@/lib/i18n/nl';
import { importToolsTranslations } from '@/lib/i18n/import-tools';
import {
  DEFAULT_IMPORT_OPTIONS,
  type ImportOptions,
} from '@/lib/importers/import-options';
import type { WorkerMessage, WorkerResponse } from '@/workers/import-worker';

const harness = vi.hoisted(() => ({
  profileId: 'profile-a',
  language: 'en' as 'en' | 'nl',
  onDrop: null as ((files: File[]) => void) | null,
  getTypeSafeApiKey: vi.fn((): string | null => null),
  suggestImportColumnMappings: vi.fn(),
  api: {
    getImportHistory: vi.fn(async () => []),
    importGenericCSV: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
    detectRecurringPatterns: vi.fn(async () => undefined),
  },
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('@/lib/api', () => ({ api: harness.api }));
vi.mock('@/contexts/ProfileContext', () => ({
  useProfile: () => ({
    activeProfileId: harness.profileId,
    activeProfile: { id: harness.profileId, name: harness.profileId },
  }),
}));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: harness.language === 'en' ? en : nl,
    language: harness.language,
  }),
}));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => harness.toast }));
vi.mock('@/hooks/useDocumentTitle', () => ({ useDocumentTitle: vi.fn() }));
vi.mock('@/lib/typesafe-client', () => ({
  getTypeSafeApiKey: harness.getTypeSafeApiKey,
  suggestImportColumnMappings: harness.suggestImportColumnMappings,
}));
vi.mock('react-dropzone', () => ({
  useDropzone: ({ onDrop }: { onDrop: (files: File[]) => void }) => {
    harness.onDrop = onDrop;
    return {
      getRootProps: () => ({}),
      getInputProps: () => ({}),
      isDragActive: false,
    };
  },
}));
// Saved format profiles and recovery storage have their own integration tests.
// Keep their controls here so this suite exercises the actual page callbacks.
vi.mock('@/components/import/ImportTools', () => ({
  ImportRecoveryPanel: () => null,
  ImportOptionsPanel: ({
    options,
    onChange,
    onReparse,
  }: {
    options: ImportOptions;
    onChange: (options: ImportOptions) => void;
    onReparse: () => Promise<void>;
  }) => (
    <>
      <button onClick={() => void onReparse()}>Reparse test file</button>
      <button onClick={() => onChange({ ...options, decimal: '.' })}>
        Use dot decimal
      </button>
    </>
  ),
}));

class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  postMessage = vi.fn<(message: WorkerMessage) => void>();
  terminate = vi.fn();
  constructor() {
    FakeWorker.instances.push(this);
  }
  emit(data: WorkerResponse) {
    this.onmessage?.(new MessageEvent('message', { data }));
  }
  captureMessageHandler() {
    const handler = this.onmessage;
    if (!handler) throw new Error('Worker has no message handler');
    return handler;
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function file(name: string, content: string | Promise<string>) {
  const result = new File([], name, { type: 'text/csv' });
  Object.defineProperty(result, 'text', {
    value: vi.fn(() => Promise.resolve(content)),
  });
  return result;
}

function preview(description = 'Current merchant') {
  return {
    headers: ['Date', 'Amount', 'Description'],
    sampleRows: [
      { Date: '2026-10-01', Amount: '-12', Description: description },
    ],
    totalRows: 1,
  };
}

function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const tree = () => (
    <QueryClientProvider client={client}>
      <Import />
    </QueryClientProvider>
  );
  const rendered = render(tree());
  return { ...rendered, refresh: () => rendered.rerender(tree()) };
}

async function drop(upload: File) {
  const onDrop = harness.onDrop;
  if (!onDrop) throw new Error('Dropzone has no upload handler');
  await act(async () => onDrop([upload]));
}

async function completePreview(upload: File, description = 'Current merchant') {
  const nextIndex = FakeWorker.instances.length;
  await drop(upload);
  await waitFor(() => expect(FakeWorker.instances).toHaveLength(nextIndex + 1));
  const worker = FakeWorker.instances[nextIndex];
  await act(async () =>
    worker.emit({ type: 'preview', data: preview(description) })
  );
  await screen.findByRole('dialog');
  return worker;
}

describe('Import page configured worker requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    harness.profileId = 'profile-a';
    harness.language = 'en';
    harness.getTypeSafeApiKey.mockReturnValue(null);
    FakeWorker.instances = [];
    vi.stubGlobal('Worker', FakeWorker);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      queueMicrotask(() => callback(0));
      return 1;
    });
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('sends ABN tab previews and configured preparation to the worker', async () => {
    mount();
    const upload = file(
      'ABN.tab',
      '123456789\tEUR\t20261001\t100.00\t87.50\t-12.50\tShop'
    );
    const worker = await completePreview(upload);
    expect(worker.postMessage).toHaveBeenCalledWith({
      type: 'parse',
      payload: {
        csvContent: await upload.text(),
        options: { ...DEFAULT_IMPORT_OPTIONS, delimiter: '\t', decimal: '.' },
      },
    });
    fireEvent.click(
      screen.getByRole('button', { name: en.import.startImport })
    );
    await waitFor(() => expect(worker.postMessage).toHaveBeenCalledTimes(2));
    expect(worker.postMessage.mock.calls[1][0].payload).toMatchObject({
      prepare: true,
      options: { ...DEFAULT_IMPORT_OPTIONS, delimiter: '\t', decimal: '.' },
      mapping: { date: 'Date', amount: 'Amount', description: 'Description' },
    });
    expect(harness.api.importGenericCSV).not.toHaveBeenCalled();
    const result = deferred<unknown>();
    harness.api.importGenericCSV.mockReturnValueOnce(result.promise);
    await act(async () =>
      worker.emit({
        type: 'prepared',
        data: {
          csv: 'normalized CSV',
          mapping: {
            date: '__fluxby_date',
            amount: '__fluxby_amount',
            description: 'Description',
          },
        },
      })
    );
    await waitFor(() =>
      expect(harness.api.importGenericCSV).toHaveBeenCalledTimes(1)
    );
    expect(harness.api.importGenericCSV.mock.calls[0][1]).toEqual({
      date: '__fluxby_date',
      amount: '__fluxby_amount',
      description: 'Description',
    });
    await act(async () =>
      result.resolve({
        importId: 'import-1',
        filename: upload.name,
        totalInFile: 1,
        imported: 1,
        duplicatesSkipped: 0,
        parseErrors: 0,
        skippedRows: [],
      })
    );
    expect(harness.toast.success).toHaveBeenCalledTimes(1);
  });

  it('ignores a superseded slow File.text() before it can replace the newer worker', async () => {
    mount();
    const slow = deferred<string>();
    await drop(file('slow.csv', slow.promise));
    const worker = await completePreview(
      file('latest.csv', 'latest CSV'),
      'Latest merchant'
    );
    await act(async () => slow.resolve('obsolete CSV'));
    expect(FakeWorker.instances).toHaveLength(1);
    expect(worker.postMessage).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Latest merchant')).toBeTruthy();
    expect(screen.queryByText(en.import.parseFileError)).toBeNull();
  });

  it('ignores a late worker result after a new file supersedes it', async () => {
    mount();
    await drop(file('old.csv', 'old CSV'));
    await waitFor(() => expect(FakeWorker.instances).toHaveLength(1));
    const worker = FakeWorker.instances[0];
    const oldHandler = worker.captureMessageHandler();
    await completePreview(file('latest.csv', 'latest CSV'), 'Latest merchant');
    await act(async () =>
      oldHandler(
        new MessageEvent('message', {
          data: { type: 'preview', data: preview('Obsolete merchant') },
        })
      )
    );
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Latest merchant')).toBeTruthy();
    expect(screen.queryByText('Obsolete merchant')).toBeNull();
    expect(screen.queryByText(en.import.parseFileError)).toBeNull();
  });

  it('does not revive an upload after its profile changes away and back', async () => {
    const view = mount();
    const slow = deferred<string>();
    await drop(file('old-profile.csv', slow.promise));
    harness.profileId = 'profile-b';
    view.refresh();
    harness.profileId = 'profile-a';
    view.refresh();
    await act(async () => slow.resolve('old profile CSV'));
    expect(FakeWorker.instances).toHaveLength(0);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByText(en.import.processingFile)).toBeNull();
  });

  it('does not start a worker when a pending file read finishes after unmount', async () => {
    const view = mount();
    const slow = deferred<string>();
    await drop(file('unmounted.csv', slow.promise));
    view.unmount();
    await act(async () => slow.resolve('obsolete CSV'));
    expect(FakeWorker.instances).toHaveLength(0);
    expect(harness.toast.error).not.toHaveBeenCalled();
  });

  it('rejects stale format reparses and uses the latest options for a replacement', async () => {
    mount();
    await completePreview(file('format.csv', 'CSV'));
    fireEvent.click(screen.getByRole('button', { name: 'Reparse test file' }));
    await waitFor(() => expect(FakeWorker.instances).toHaveLength(2));
    const obsolete = FakeWorker.instances[1];
    const oldHandler = obsolete.captureMessageHandler();
    fireEvent.click(screen.getByRole('button', { name: 'Use dot decimal' }));
    expect(obsolete.terminate).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Reparse test file' }));
    await waitFor(() => expect(FakeWorker.instances).toHaveLength(3));
    const latest = FakeWorker.instances[2];
    expect(latest.postMessage.mock.calls[0][0].payload?.options?.decimal).toBe(
      '.'
    );
    await act(async () => {
      oldHandler(
        new MessageEvent('message', {
          data: { type: 'error', error: 'amount' },
        })
      );
      latest.emit({ type: 'preview', data: preview('Latest format') });
    });
    expect(screen.getByText('Latest format')).toBeTruthy();
    expect(screen.queryByText(importToolsTranslations.en.invalid)).toBeNull();
  });

  it('does not call the import API when a profile changes during worker preparation', async () => {
    const view = mount();
    const worker = await completePreview(file('import.csv', 'CSV'));
    fireEvent.click(
      screen.getByRole('button', { name: en.import.startImport })
    );
    await waitFor(() => expect(worker.postMessage).toHaveBeenCalledTimes(2));
    const handler = worker.captureMessageHandler();
    harness.profileId = 'profile-b';
    view.refresh();
    await act(async () =>
      handler(
        new MessageEvent('message', {
          data: {
            type: 'prepared',
            data: {
              csv: 'stale normalized CSV',
              mapping: {
                date: 'Date',
                amount: 'Amount',
                description: 'Description',
              },
            },
          },
        })
      )
    );
    expect(harness.api.importGenericCSV).not.toHaveBeenCalled();
    expect(harness.toast.success).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('does not show stale Jev suggestions or notices over a replacement upload', async () => {
    mount();
    harness.getTypeSafeApiKey.mockReturnValue('test-key');
    const suggestion = deferred<Record<string, unknown>>();
    harness.suggestImportColumnMappings.mockReturnValueOnce(suggestion.promise);
    await drop(file('ambiguous.csv', 'ambiguous CSV'));
    await waitFor(() => expect(FakeWorker.instances).toHaveLength(1));
    await act(async () =>
      FakeWorker.instances[0].emit({
        type: 'preview',
        data: {
          headers: ['When', 'Value', 'Memo'],
          sampleRows: [],
          totalRows: 1,
        },
      })
    );
    await waitFor(() =>
      expect(harness.suggestImportColumnMappings).toHaveBeenCalledTimes(1)
    );
    await completePreview(file('latest.csv', 'latest CSV'), 'Latest merchant');
    await act(async () => suggestion.resolve({ date: { header: 'When' } }));
    expect(screen.getByText('Latest merchant')).toBeTruthy();
    expect(screen.queryByText(en.import.jevMappingNotice)).toBeNull();
    expect(screen.queryByText(en.import.jevMappingUnavailable)).toBeNull();
  });

  it.each(['en', 'nl'] as const)(
    'localizes an unexpected import service failure in %s',
    async (language) => {
      harness.language = language;
      const copy = language === 'en' ? en : nl;
      harness.api.importGenericCSV.mockRejectedValueOnce(
        new Error('Failed to save transactions: technical database detail')
      );
      mount();
      const worker = await completePreview(file('import.csv', 'CSV'));
      fireEvent.click(
        screen.getByRole('button', { name: copy.import.startImport })
      );
      await waitFor(() => expect(worker.postMessage).toHaveBeenCalledTimes(2));
      await act(async () =>
        worker.emit({
          type: 'prepared',
          data: {
            csv: 'normalized CSV',
            mapping: {
              date: 'Date',
              amount: 'Amount',
              description: 'Description',
            },
          },
        })
      );
      expect(await screen.findByText(copy.import.importFailed)).toBeTruthy();
      expect(screen.queryByText(/technical database detail/)).toBeNull();
    }
  );

  it.each(['en', 'nl'] as const)(
    'localizes worker validation failures in %s',
    async (language) => {
      harness.language = language;
      const copy = language === 'en' ? en : nl;
      mount();
      await drop(file('currency.tab', 'non-EUR tab data'));
      await waitFor(() => expect(FakeWorker.instances).toHaveLength(1));
      await act(async () =>
        FakeWorker.instances[0].emit({ type: 'error', error: 'currency' })
      );
      expect(
        screen.getByText(importToolsTranslations[language].unsupportedCurrency)
      ).toBeTruthy();
      expect(screen.queryByText(/^currency$/)).toBeNull();
      expect(screen.queryByText(copy.import.importCancelled)).toBeNull();
    }
  );
});
