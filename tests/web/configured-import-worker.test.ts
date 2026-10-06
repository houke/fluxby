import Papa from 'papaparse';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_IMPORT_OPTIONS } from '@/lib/importers/import-options';
import type { WorkerMessage, WorkerResponse } from '@/workers/import-worker';

const workerScope = {
  postMessage: vi.fn<(message: WorkerResponse) => void>(),
  onmessage: null as
    ((event: MessageEvent<WorkerMessage>) => Promise<void>) | null,
};

async function request(payload: NonNullable<WorkerMessage['payload']>) {
  const onmessage = workerScope.onmessage;
  if (!onmessage)
    throw new Error('Worker has not installed its message handler');
  await onmessage({
    isTrusted: true,
    data: { type: 'parse', payload },
  } as MessageEvent<WorkerMessage>);
  const messages = workerScope.postMessage.mock.calls.map(
    ([message]) => message
  );
  const response = messages
    .filter((message) => message.type !== 'progress')
    .at(-1);
  if (!response) throw new Error('Worker did not return a response');
  return response;
}

describe('Configured import worker', () => {
  beforeEach(async () => {
    vi.resetModules();
    workerScope.postMessage.mockClear();
    workerScope.onmessage = null;
    vi.stubGlobal('self', workerScope);
    await import('@/workers/import-worker');
  });
  afterEach(() => vi.unstubAllGlobals());

  it('previews headerless ABN tab exports without sending every parsed row to the page', async () => {
    const csvContent = Array.from(
      { length: 25 },
      (_, i) => `123456789\tEUR\t20261001\t100.00\t87.50\t-12.50\tMerchant ${i}`
    ).join('\n');
    const response = await request({
      csvContent,
      options: {
        ...DEFAULT_IMPORT_OPTIONS,
        delimiter: '\t',
        decimal: '.',
      },
    });

    expect(response.type).toBe('preview');
    expect(response.data).toMatchObject({
      headers: expect.arrayContaining(['Transactiedatum', 'Transactiebedrag']),
      totalRows: 25,
      sampleRows: expect.arrayContaining([
        expect.objectContaining({ Omschrijving: 'Merchant 0' }),
      ]),
    });
    expect(response.data).not.toHaveProperty('rows');
    expect(response.data).toHaveProperty('sampleRows.length', 10);
  });

  it('prepares configured debit/credit imports while preserving source fields, multiline text and normalized mapping', async () => {
    const response = await request({
      csvContent:
        'Export\nDatum;Af;Bij;Omschrijving;Saldo;Machtigingskenmerk\n30-09-2026;12,50;;"Supermarkt\nAmsterdam";87,50;MANDATE-7\n01-10-2026;;2500,00;Salaris;2587,50;',
      mapping: {
        date: 'Datum',
        amount: '',
        description: 'Omschrijving',
        balance: 'Saldo',
      },
      options: {
        ...DEFAULT_IMPORT_OPTIONS,
        delimiter: ';',
        skipRows: 1,
        dateFormat: 'day-first',
        debitColumn: 'Af',
        creditColumn: 'Bij',
        invertSign: true,
      },
      prepare: true,
    });

    expect(response.type).toBe('prepared');
    expect(response.data).toMatchObject({
      mapping: {
        date: '__fluxby_date',
        amount: '__fluxby_amount',
        description: 'Omschrijving',
        balance: '__fluxby_balance',
        direction: undefined,
      },
    });
    expect(response.data).not.toHaveProperty('rows');
    const { csv } = response.data as { csv: string };
    const rows = Papa.parse<Record<string, string>>(csv, { header: true }).data;
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      Omschrijving: 'Supermarkt\nAmsterdam',
      Machtigingskenmerk: 'MANDATE-7',
      __fluxby_date: '2026-09-30',
      __fluxby_amount: '12,50',
      __fluxby_balance: '87,50',
    });
    expect(rows[1].__fluxby_amount).toBe('-2500,00');
  });

  it('honors a selected dot decimal format, compact dates and debit direction', async () => {
    const response = await request({
      csvContent:
        'Date,Amount,Description,Direction\n20261001,"1,234.56",Shop,DBIT',
      mapping: {
        date: 'Date',
        amount: 'Amount',
        description: 'Description',
        direction: 'Direction',
      },
      options: {
        ...DEFAULT_IMPORT_OPTIONS,
        delimiter: ',',
        decimal: '.',
        dateFormat: 'compact',
      },
      prepare: true,
    });

    expect(response.type).toBe('prepared');
    const { csv } = response.data as { csv: string };
    const rows = Papa.parse<Record<string, string>>(csv, { header: true }).data;
    expect(rows[0].__fluxby_date).toBe('2026-10-01');
    expect(rows[0].__fluxby_amount).toBe('-1234,56');
  });

  it.each([
    [
      'currency',
      'Date;Amount;Description;Currency\n2026-10-01;-12,50;Shop;USD',
    ],
    ['date', 'Date;Amount;Description;Currency\n2026-02-30;-12,50;Shop;EUR'],
    ['amount', 'Date;Amount;Description;Currency\n2026-10-01;12abc;Shop;EUR'],
    ['columns', 'Date;Amount;Description;Currency\n2026-10-01;-12,50;Shop'],
  ])(
    'preserves the %s parser error for localized page handling',
    async (error, csvContent) => {
      const response = await request({
        csvContent,
        mapping: { date: 'Date', amount: 'Amount', description: 'Description' },
        options: { ...DEFAULT_IMPORT_OPTIONS, delimiter: ';' },
        prepare: true,
      });

      expect(response).toEqual({ type: 'error', error });
    }
  );
});
