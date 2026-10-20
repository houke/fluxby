/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { File as NodeFile } from 'node:buffer';
import { api } from '@/lib/api-compat';

const mocks = vi.hoisted(() => ({
  language: 'nl' as 'nl' | 'en',
  profileId: 'profile',
  dataService: {
    previewCsvImport: vi.fn(),
    createImportRecoverySnapshot: vi.fn(),
    getAccounts: vi.fn(),
    createAccount: vi.fn(),
    importCsv: vi.fn(),
    recordImportBatch: vi.fn(),
  },
}));
vi.mock('@/lib/db-singleton', () => ({
  getDataService: () => mocks.dataService,
}));
vi.mock('@fluxby/database', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  isSettingsCacheInitialized: () => true,
  readFromOPFSSync: () => mocks.profileId,
}));
vi.mock('@/lib/i18n', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getStoredLanguage: () => mocks.language,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.profileId = 'profile';
  mocks.dataService.previewCsvImport.mockResolvedValue({
    rows: [{ date: '2026-10-02', amount: '-9,99', description: 'Test' }],
    totalRows: 1,
  });
  mocks.dataService.createImportRecoverySnapshot.mockResolvedValue('recovery');
  mocks.dataService.getAccounts.mockResolvedValue([]);
  mocks.dataService.createAccount.mockResolvedValue({ id: 'account' });
  mocks.dataService.importCsv.mockResolvedValue({
    importId: 'import',
    imported: 1,
    skipped: 0,
    errors: [],
    importedTransactionIds: ['transaction'],
  });
});

describe('import account creation', () => {
  it.each([
    ['nl', 'Importrekening'],
    ['en', 'Import account'],
  ] as const)(
    'creates the default account in the selected %s language',
    async (language, name) => {
      mocks.language = language;
      await api.importGenericCSV(
        new NodeFile(
          ['date;amount;description\n2026-10-02;-9,99;Test'],
          'test.csv'
        ) as unknown as File,
        { date: 'date', amount: 'amount', description: 'description' },
        undefined,
        'generic'
      );
      expect(mocks.dataService.createAccount).toHaveBeenCalledWith({
        iban: 'UNKNOWN',
        name,
        type: 'checking',
        bank: 'generic',
        profileId: 'profile',
      });
      expect(mocks.dataService.recordImportBatch).toHaveBeenCalledWith(
        'test.csv',
        'import',
        ['transaction'],
        'recovery',
        'profile'
      );
      expect(
        mocks.dataService.createImportRecoverySnapshot.mock
          .invocationCallOrder[0]
      ).toBeLessThan(
        mocks.dataService.createAccount.mock.invocationCallOrder[0]
      );
    }
  );
});

describe('import profile isolation', () => {
  it('records committed membership in the original profile if the UI switches immediately after import', async () => {
    mocks.language = 'en';
    mocks.dataService.importCsv.mockImplementationOnce(async () => {
      mocks.profileId = 'other';
      return {
        importId: 'original-import',
        imported: 1,
        skipped: 0,
        errors: [],
        importedTransactionIds: ['original-transaction'],
      };
    });
    await expect(
      api.importGenericCSV(
        new NodeFile(['data'], 'committed.csv') as unknown as File,
        { date: 'date', amount: 'amount', description: 'description' }
      )
    ).rejects.toThrow('active profile changed');
    expect(mocks.dataService.recordImportBatch).toHaveBeenCalledWith(
      'committed.csv',
      'original-import',
      ['original-transaction'],
      'recovery',
      'profile'
    );
    expect(mocks.dataService.importCsv).toHaveBeenCalledWith(
      'data',
      expect.objectContaining({
        expectedProfileId: 'profile',
        accountId: 'account',
      })
    );
  });
  it('stops before snapshots or account mutations when the profile changes during file reading', async () => {
    mocks.language = 'en';
    const file = new NodeFile(
      ['date;amount;description'],
      'delayed.csv'
    ) as unknown as File;
    vi.spyOn(file, 'text').mockImplementation(async () => {
      mocks.profileId = 'other';
      return 'date;amount;description\n2026-10-02;-9,99;Test';
    });
    await expect(
      api.importGenericCSV(file, {
        date: 'date',
        amount: 'amount',
        description: 'description',
      })
    ).rejects.toThrow('active profile changed');
    expect(mocks.dataService.previewCsvImport).not.toHaveBeenCalled();
    expect(mocks.dataService.createAccount).not.toHaveBeenCalled();
  });
  it('stops after a delayed preview or snapshot before creating accounts in another profile', async () => {
    mocks.language = 'en';
    mocks.dataService.createImportRecoverySnapshot.mockImplementationOnce(
      async () => {
        mocks.profileId = 'other';
        return 'recovery';
      }
    );
    await expect(
      api.importGenericCSV(
        new NodeFile(['data'], 'test.csv') as unknown as File,
        {
          date: 'date',
          amount: 'amount',
          description: 'description',
        }
      )
    ).rejects.toThrow('active profile changed');
    expect(mocks.dataService.createImportRecoverySnapshot).toHaveBeenCalledWith(
      'test.csv',
      'profile'
    );
    expect(mocks.dataService.getAccounts).not.toHaveBeenCalled();
    expect(mocks.dataService.createAccount).not.toHaveBeenCalled();
    expect(mocks.dataService.importCsv).not.toHaveBeenCalled();
    expect(mocks.dataService.recordImportBatch).not.toHaveBeenCalled();
  });
});
