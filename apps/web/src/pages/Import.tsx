import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';

interface ImportHistorySkippedRow {
  rowIndex: number;
  date: string;
  amount: number;
  description: string;
  error: string;
}

interface ImportHistory {
  id: number;
  filename: string;
  bank: string;
  importedAt: string;
  transactionCount: number;
  status: string;
  skippedRows?: ImportHistorySkippedRow[];
  duplicatesSkipped?: number;
  parseErrors?: number;
}

interface NewAccountInfo {
  iban: string;
  suggestedName: string;
  suggestedType: 'checking' | 'savings' | 'credit';
}

interface PreviewResult {
  totalTransactions: number;
  existingAccounts: Array<{
    id: string;
    iban: string;
    name: string;
    type: string;
    profile_id?: string;
    profile_name?: string;
  }>;
  newAccounts: NewAccountInfo[];
  uniqueIbans: string[];
}

interface AccountInput {
  iban: string;
  name: string;
  type: 'checking' | 'savings' | 'credit';
}

interface ColumnMapping {
  date: string;
  amount: string;
  description: string;
  iban?: string;
  counterparty?: string;
  balance?: string;
  direction?: string;
  paymentMethod?: string;
  notes?: string;
}

interface GenericCSVParseResult {
  headers: string[];
  sampleRows: Record<string, string>[];
  totalRows: number;
}

interface SkippedRow {
  rowIndex: number;
  date: string;
  amount: number;
  description: string;
  error: string;
}

interface GenericImportResult {
  importId: number;
  filename: string;
  totalInFile: number;
  imported: number;
  duplicatesSkipped: number;
  parseErrors: number;
  skippedRows: SkippedRow[];
}

const MAPPING_FIELDS = [
  { key: 'date', required: true },
  { key: 'amount', required: true },
  { key: 'description', required: true },
  { key: 'iban', required: false },
  { key: 'counterparty', required: false },
  { key: 'balance', required: false },
  { key: 'direction', required: false },
  { key: 'paymentMethod', required: false },
  { key: 'notes', required: false },
] as const;

// Bank presets for column mapping
const DUTCH_BANKS = [
  { id: 'ing', name: 'Standaard (CSV)', enabled: true },
  { id: 'generic', name: 'Anders / Handmatig', enabled: true },
] as const;

// Helper to get display name for bank code
const getBankDisplayName = (bankCode: string): string => {
  const bank = DUTCH_BANKS.find(
    (b) => b.id.toLowerCase() === bankCode.toLowerCase()
  );
  return bank ? bank.name : bankCode.toUpperCase();
};

const BANK_PRESETS: Record<
  string,
  { name: string; mapping: Record<string, string[]> }
> = {
  ing: {
    name: 'Standaard (CSV)',
    mapping: {
      date: ['Datum'],
      amount: ['Bedrag (EUR)', 'Bedrag'],
      description: ['Naam / Omschrijving', 'Omschrijving'],
      iban: ['Rekening'],
      counterparty: ['Tegenrekening'],
      balance: ['Saldo na mutatie', 'Saldo'],
      direction: ['Af Bij'],
      paymentMethod: ['Mutatiesoort'],
      notes: ['Mededelingen'],
    },
  },
  rabobank: {
    name: 'Rabobank',
    mapping: {
      date: ['Datum', 'Boekdatum'],
      amount: ['Bedrag', 'Amount'],
      description: ['Omschrijving', 'Description'],
      iban: ['IBAN/BBAN', 'Rekening'],
      counterparty: ['Tegenrekening', 'Naam tegenpartij'],
      balance: ['Saldo na trn', 'Saldo'],
    },
  },
  abn: {
    name: 'ABN AMRO',
    mapping: {
      date: ['Transactiedatum', 'Datum'],
      amount: ['Transactiebedrag', 'Bedrag'],
      description: ['Omschrijving'],
      iban: ['Rekeningnummer'],
      counterparty: ['Tegenrekeningnummer'],
      balance: ['Mutatiesoort'],
    },
  },
  generic: {
    name: 'Anders / Handmatig koppelen',
    mapping: {},
  },
};

// History card component with expandable skipped rows
function HistoryCard({
  item,
  hasSkippedRows,
  totalSkipped,
  t,
  getErrorLabel,
}: {
  item: ImportHistory;
  hasSkippedRows: boolean | undefined;
  totalSkipped: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
  getErrorLabel: (error: string) => string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`rounded-lg bg-muted/50 ${hasSkippedRows ? 'cursor-pointer hover:bg-muted/70' : ''}`}
      onClick={() => hasSkippedRows && setIsExpanded(!isExpanded)}
    >
      <div className='flex items-center justify-between p-3'>
        <div className='flex items-center gap-3'>
          <FileText className='h-5 w-5 text-muted-foreground' />
          <div>
            <p className='font-medium'>{item.filename}</p>
            <p className='text-sm text-muted-foreground'>
              {formatDate(item.importedAt)} • {item.transactionCount}{' '}
              {t.import.transactions}
              {item.bank && ` • ${getBankDisplayName(item.bank)}`}
              {totalSkipped > 0 && (
                <span className='ml-2 text-amber-600 dark:text-amber-400'>
                  • {totalSkipped} {t.import?.skipped || 'overgeslagen'}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <span
            className={`rounded px-2 py-1 text-sm ${
              item.status === 'completed'
                ? 'bg-success/10 text-success'
                : 'bg-destructive/10 text-destructive'
            }`}
          >
            {item.status === 'completed' ? t.import.completed : t.import.failed}
          </span>
          {hasSkippedRows && (
            <span className='text-muted-foreground'>
              {isExpanded ? (
                <ChevronUp className='h-4 w-4' />
              ) : (
                <ChevronDown className='h-4 w-4' />
              )}
            </span>
          )}
        </div>
      </div>
      {isExpanded && item.skippedRows && item.skippedRows.length > 0 && (
        <div className='border-t border-border/50 p-3'>
          <p className='mb-2 text-xs font-medium text-muted-foreground'>
            {t.import.skippedRows}
          </p>
          <div className='max-h-40 space-y-2 overflow-y-auto'>
            {item.skippedRows.slice(0, 10).map((row, idx) => (
              <div
                key={idx}
                className='flex items-center justify-between rounded bg-background p-2 text-sm'
              >
                <div className='flex items-center gap-3'>
                  <span className='text-xs text-muted-foreground'>
                    #{row.rowIndex}
                  </span>
                  <span className='truncate'>{row.description || '-'}</span>
                </div>
                <div className='flex items-center gap-2'>
                  <span>{row.date || '-'}</span>
                  <span className='font-medium'>
                    {row.amount ? formatCurrency(row.amount) : '-'}
                  </span>
                  <span className='rounded bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive'>
                    {getErrorLabel(row.error)}
                  </span>
                </div>
              </div>
            ))}
            {item.skippedRows.length > 10 && (
              <div className='pt-1 text-center text-xs text-muted-foreground'>
                +{item.skippedRows.length - 10}{' '}
                {t.import?.moreSkipped || 'meer'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Import() {
  const { t } = useLanguage();
  const { activeProfileId } = useProfile();

  useDocumentTitle(t.import.title);
  const queryClient = useQueryClient();
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Generic CSV state
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [csvParseResult, setCsvParseResult] =
    useState<GenericCSVParseResult | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    date: '',
    amount: '',
    description: '',
  });
  const [showPreview, setShowPreview] = useState(true);
  const [importProgress, setImportProgress] = useState<number | null>(null);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [importResults, setImportResults] =
    useState<GenericImportResult | null>(null);
  const [showSkippedRows, setShowSkippedRows] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [modalError, setModalError] = useState<string | null>(null);

  const { data: history, isLoading: historyLoading } = useQuery<
    ImportHistory[]
  >({
    queryKey: ['import-history', activeProfileId],
    queryFn: () => api.getImportHistory() as Promise<ImportHistory[]>,
  });

  // Apply bank preset to column mapping
  const applyBankPreset = useCallback((bankId: string, headers: string[]) => {
    const preset = BANK_PRESETS[bankId];
    if (!preset || bankId === 'generic') {
      // Auto-detect based on headers
      const autoMapping: ColumnMapping = {
        date: '',
        amount: '',
        description: '',
      };

      const headersLower = headers.map((h) => h.toLowerCase());
      headersLower.forEach((h, idx) => {
        const original = headers[idx];
        if (
          h.includes('datum') ||
          h.includes('date') ||
          h === 'boekdatum' ||
          h === 'transactiedatum'
        ) {
          if (!autoMapping.date) autoMapping.date = original;
        }
        if (
          h.includes('bedrag') ||
          h.includes('amount') ||
          h.includes('waarde')
        ) {
          if (!autoMapping.amount) autoMapping.amount = original;
        }
        if (
          h.includes('omschrijving') ||
          h.includes('description') ||
          (h.includes('naam') && !h.includes('tegenrekening'))
        ) {
          if (!autoMapping.description) autoMapping.description = original;
        }
        if (
          (h.includes('rekening') || h.includes('iban')) &&
          !h.includes('tegen')
        ) {
          if (!autoMapping.iban) autoMapping.iban = original;
        }
        if (
          h.includes('tegenrekening') ||
          h.includes('counterparty') ||
          h.includes('tegen')
        ) {
          if (!autoMapping.counterparty) autoMapping.counterparty = original;
        }
        if (h.includes('saldo') || h.includes('balance')) {
          if (!autoMapping.balance) autoMapping.balance = original;
        }
        // Detect direction column (Af Bij, Debit/Credit)
        if (
          h === 'af bij' ||
          h.includes('debit/credit') ||
          h.includes('d/c') ||
          h === 'direction'
        ) {
          if (!autoMapping.direction) autoMapping.direction = original;
        }
      });

      return autoMapping;
    }

    // Apply bank preset
    const mapping: ColumnMapping = {
      date: '',
      amount: '',
      description: '',
      iban: undefined,
      counterparty: undefined,
      balance: undefined,
      direction: undefined,
    };

    for (const [field, possibleNames] of Object.entries(preset.mapping)) {
      const match = headers.find((h) =>
        possibleNames.some((name) => h.toLowerCase() === name.toLowerCase())
      );
      if (match) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapping as any)[field] = match;
      }
    }

    return mapping;
  }, []);

  // Detect bank from headers
  const detectBank = useCallback((headers: string[]): string => {
    const headersLower = headers.map((h) => h.toLowerCase());

    // ING specific headers
    if (
      headersLower.includes('af bij') ||
      headersLower.includes('mutatiesoort') ||
      headers.includes('Naam / Omschrijving')
    ) {
      return 'ing';
    }

    // Rabobank specific
    if (
      headersLower.includes('iban/bban') ||
      headersLower.includes('saldo na trn')
    ) {
      return 'rabobank';
    }

    // ABN AMRO specific
    if (
      headersLower.includes('transactiedatum') ||
      headersLower.includes('transactiebedrag')
    ) {
      return 'abn';
    }

    return 'generic';
  }, []);

  // Generic CSV parse mutation
  const parseGenericMutation = useMutation({
    mutationFn: (file: File) =>
      api.parseGenericCSV(file) as Promise<GenericCSVParseResult>,
    onSuccess: (data, file) => {
      setCsvParseResult(data);
      setPendingFile(file);
      setModalError(null);

      // Detect bank and apply preset
      const detectedBank = detectBank(data.headers);
      setSelectedBank(detectedBank);
      const autoMapping = applyBankPreset(detectedBank, data.headers);
      setColumnMapping(autoMapping);
      setShowMappingDialog(true);
    },
    onError: (error: Error) => {
      setUploadError(error.message);
    },
  });

  // Generic CSV import mutation
  const importGenericMutation = useMutation({
    mutationFn: ({
      file,
      mapping,
      bank,
    }: {
      file: File;
      mapping: ColumnMapping;
      bank: string;
    }) =>
      api.importGenericCSV(
        file,
        mapping,
        undefined,
        bank
      ) as Promise<GenericImportResult>,
    onSuccess: (data) => {
      setImportResults(data);
      setShowMappingDialog(false);
      setShowResultsDialog(true);
      setPendingFile(null);
      setCsvParseResult(null);
      setImportProgress(null);
      queryClient.invalidateQueries({
        queryKey: ['import-history', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['dashboard', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['transactions', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['accounts', activeProfileId],
      });
      // Invalidate date picker data so "all" and year selectors update
      queryClient.invalidateQueries({
        queryKey: ['min-max-dates', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['available-years', activeProfileId],
      });
    },
    onError: (error: Error) => {
      console.error('Import error:', error);
      setModalError(error.message || 'Import failed');
      setImportProgress(null);
    },
  });

  // Preview CSV mutation (for ING bank imports)
  const previewMutation = useMutation({
    mutationFn: (file: File) => api.previewCSV(file) as Promise<PreviewResult>,
    onError: (error: Error) => {
      setUploadError(error.message);
    },
  });

  // Upload CSV mutation (for ING bank imports)
  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      api.uploadCSV(file) as Promise<{ importId: number; imported: number }>,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['import-history', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['dashboard', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['transactions', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['accounts', activeProfileId],
      });
    },
    onError: (error: Error) => {
      setUploadError(error.message);
    },
  });

  // Create accounts mutation
  const createAccountsMutation = useMutation({
    mutationFn: (accounts: AccountInput[]) =>
      Promise.all(accounts.map((acc) => api.createAccount(acc))),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['accounts', activeProfileId],
      });
    },
    onError: (error: Error) => {
      setUploadError(error.message);
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        setUploadError(null);
        setImportResults(null);
        parseGenericMutation.mutate(file);
      }
    },
    [parseGenericMutation]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  const handleStartGenericImport = () => {
    if (
      pendingFile &&
      columnMapping.date &&
      columnMapping.amount &&
      columnMapping.description
    ) {
      // Remove stars from mapping before sending
      const cleanMapping = Object.fromEntries(
        Object.entries(columnMapping).map(([key, value]) => [
          key,
          value ? value.replace('✨ ', '') : value,
        ])
      ) as ColumnMapping;

      setModalError(null);
      setImportProgress(0);
      importGenericMutation.mutate({
        file: pendingFile,
        mapping: cleanMapping,
        bank: selectedBank,
      });
    }
  };

  const isMappingComplete = useMemo(() => {
    return (
      columnMapping.date && columnMapping.amount && columnMapping.description
    );
  }, [columnMapping]);

  // Preview data with mapped columns
  const previewData = useMemo(() => {
    if (!csvParseResult || !isMappingComplete) return [];

    const cleanKey = (key: string) => (key ? key.replace('✨ ', '') : '');

    return csvParseResult.sampleRows.slice(0, 10).map((row) => {
      const amountValue = row[cleanKey(columnMapping.amount)] || '-';
      const directionValue = columnMapping.direction
        ? row[cleanKey(columnMapping.direction)]
        : null;

      // Format amount with direction indicator
      let displayAmount = amountValue;
      if (directionValue) {
        const isExpense =
          directionValue.toLowerCase() === 'af' ||
          directionValue.toLowerCase() === 'debit';
        if (isExpense && !amountValue.startsWith('-')) {
          displayAmount = `-${amountValue}`;
        }
      }

      return {
        date: row[cleanKey(columnMapping.date)] || '-',
        amount: displayAmount,
        description: row[cleanKey(columnMapping.description)] || '-',
        iban: columnMapping.iban
          ? row[cleanKey(columnMapping.iban)]
          : undefined,
        counterparty: columnMapping.counterparty
          ? row[cleanKey(columnMapping.counterparty)]
          : undefined,
        balance: columnMapping.balance
          ? row[cleanKey(columnMapping.balance)]
          : undefined,
      };
    });
  }, [csvParseResult, columnMapping, isMappingComplete]);

  const isProcessing =
    previewMutation.isPending ||
    uploadMutation.isPending ||
    createAccountsMutation.isPending ||
    parseGenericMutation.isPending ||
    importGenericMutation.isPending;

  const getFieldLabel = (key: string) => {
    switch (key) {
      case 'date':
        return t.import.dateColumn;
      case 'amount':
        return t.import.amountColumn;
      case 'description':
        return t.import.descriptionColumn;
      case 'iban':
        return t.import.ibanColumn;
      case 'counterparty':
        return t.import.counterpartyColumn;
      case 'balance':
        return t.import.balanceColumn;
      case 'direction':
        return t.import.directionColumn || 'Af/Bij';
      case 'paymentMethod':
        return t.import.paymentMethodColumn || 'Betaalmethode';
      case 'notes':
        return t.import.notesColumn || 'Mededelingen';
      default:
        return key;
    }
  };

  const getErrorLabel = (error: string) => {
    switch (error) {
      case 'invalidDate':
        return t.import.invalidDate;
      case 'invalidAmount':
        return t.import.invalidAmount;
      case 'missingRequired':
        return t.import.missingRequired;
      case 'duplicate':
        return t.import.duplicate;
      default:
        return error;
    }
  };

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>{t.import.title}</h1>
        <p className='mt-1 text-muted-foreground'>{t.import.subtitle}</p>
      </div>

      {/* Generic CSV Mapping Dialog */}
      <Dialog
        open={showMappingDialog}
        onOpenChange={(open) => {
          // Prevent closing during import
          if (!open && importGenericMutation.isPending) return;
          setShowMappingDialog(open);
        }}
      >
        <DialogContent className='flex max-h-[90vh] max-w-4xl flex-col overflow-hidden'>
          <DialogHeader className='flex-shrink-0'>
            <DialogTitle>{t.import.mapHeaders}</DialogTitle>
            <DialogDescription>
              {t.import.mapHeadersDescription}
            </DialogDescription>
          </DialogHeader>

          <div className='flex-1 space-y-6 overflow-y-auto py-4'>
            {/* Modal Error Display */}
            {modalError && (
              <div className='rounded-lg border border-destructive/20 bg-destructive/10 p-4'>
                <div className='flex items-start gap-3'>
                  <AlertCircle className='mt-0.5 h-5 w-5 text-destructive' />
                  <div>
                    <p className='font-medium text-destructive'>
                      {t.import.importError}
                    </p>
                    <p className='mt-1 text-sm'>{modalError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Bank Selector - Show First */}
            <div className='space-y-3'>
              <label className='text-sm font-medium'>Selecteer je bank</label>
              <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4'>
                {DUTCH_BANKS.map((bank) => (
                  <button
                    key={bank.id}
                    type='button'
                    disabled={!bank.enabled}
                    onClick={() => {
                      setSelectedBank(bank.id);
                      if (csvParseResult && bank.id !== 'generic') {
                        const newMapping = applyBankPreset(
                          bank.id,
                          csvParseResult.headers
                        );
                        setColumnMapping(newMapping);
                      }
                    }}
                    className={`rounded-lg border p-3 text-sm font-medium transition-colors ${
                      selectedBank === bank.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : bank.enabled
                          ? 'border-border bg-background hover:border-primary/50 hover:bg-muted/50'
                          : 'cursor-not-allowed border-border/50 bg-muted/30 text-muted-foreground/50'
                    }`}
                  >
                    {bank.name}
                    {!bank.enabled && (
                      <span className='mt-1 block text-xs opacity-60'>
                        Binnenkort
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Column Mapping - Only show for generic */}
            {selectedBank === 'generic' && (
              <>
                <h3 className='font-medium'>{t.import.requiredFields}</h3>
                <div className='grid gap-4 md:grid-cols-3'>
                  {MAPPING_FIELDS.filter((f) => f.required).map((field) => (
                    <div key={field.key} className='space-y-2'>
                      <label className='text-sm font-medium'>
                        {getFieldLabel(field.key)} *
                      </label>
                      <Select
                        value={
                          columnMapping[field.key as keyof ColumnMapping] || ''
                        }
                        onValueChange={(v) =>
                          setColumnMapping((prev) => ({
                            ...prev,
                            [field.key]: v,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t.import.selectField} />
                        </SelectTrigger>
                        <SelectContent>
                          {csvParseResult?.headers.map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>

                <h3 className='pt-4 font-medium'>{t.import.optionalFields}</h3>
                <div className='grid gap-4 md:grid-cols-3'>
                  {MAPPING_FIELDS.filter((f) => !f.required).map((field) => (
                    <div key={field.key} className='space-y-2'>
                      <label className='text-sm font-medium'>
                        {getFieldLabel(field.key)}
                      </label>
                      <Select
                        value={
                          columnMapping[field.key as keyof ColumnMapping] || ''
                        }
                        onValueChange={(v) =>
                          setColumnMapping((prev) => ({
                            ...prev,
                            [field.key]: v === 'none' ? undefined : v,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t.import.selectField} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='none'>
                            {t.import.notMapped}
                          </SelectItem>
                          {csvParseResult?.headers.map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Preview - Show for all banks when mapping is complete */}
            {selectedBank && isMappingComplete && (
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <h3 className='font-medium'>{t.import.preview}</h3>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? (
                      <ChevronUp className='h-4 w-4' />
                    ) : (
                      <ChevronDown className='h-4 w-4' />
                    )}
                  </Button>
                </div>
                {showPreview && (
                  <div className='rounded-lg border'>
                    <div className='overflow-x-auto'>
                      <table className='min-w-full text-sm'>
                        <thead className='bg-muted/50'>
                          <tr>
                            <th className='px-4 py-2 text-left font-medium'>
                              {t.import.dateColumn}
                            </th>
                            <th className='px-4 py-2 text-right font-medium'>
                              {t.import.amountColumn}
                            </th>
                            <th className='px-4 py-2 text-left font-medium'>
                              {t.import.descriptionColumn}
                            </th>
                            {columnMapping.iban && (
                              <th className='px-4 py-2 text-left font-medium'>
                                {t.import.ibanColumn}
                              </th>
                            )}
                            {columnMapping.counterparty && (
                              <th className='px-4 py-2 text-left font-medium'>
                                {t.import.counterpartyColumn}
                              </th>
                            )}
                            {columnMapping.balance && (
                              <th className='px-4 py-2 text-right font-medium'>
                                {t.import.balanceColumn}
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.map((row, idx) => (
                            <tr key={idx} className='border-t border-muted/50'>
                              <td className='px-4 py-2'>{row.date}</td>
                              <td
                                className={`px-4 py-2 text-right font-mono ${
                                  row.amount.startsWith('-')
                                    ? 'text-red-600'
                                    : 'text-green-600'
                                }`}
                              >
                                {row.amount}
                              </td>
                              <td className='max-w-xs truncate px-4 py-2'>
                                {row.description}
                              </td>
                              {columnMapping.iban && (
                                <td className='px-4 py-2 font-mono text-xs'>
                                  {row.iban}
                                </td>
                              )}
                              {columnMapping.counterparty && (
                                <td className='px-4 py-2 font-mono text-xs'>
                                  {row.counterparty}
                                </td>
                              )}
                              {columnMapping.balance && (
                                <td className='px-4 py-2 text-right font-mono'>
                                  {row.balance}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {csvParseResult && csvParseResult.totalRows > 10 && (
                      <div className='border-t px-4 py-2 text-sm text-muted-foreground'>
                        {t.import.andMore.replace(
                          '{count}',
                          (csvParseResult.totalRows - 10).toString()
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Progress bar */}
            {importProgress !== null && (
              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span>{t.import.importing}</span>
                  <span>{importProgress}%</span>
                </div>
                <Progress value={importProgress} />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setShowMappingDialog(false);
                setPendingFile(null);
                setCsvParseResult(null);
                setModalError(null);
              }}
            >
              {t.common.cancel}
            </Button>
            <Button
              onClick={handleStartGenericImport}
              disabled={
                !selectedBank ||
                !isMappingComplete ||
                importGenericMutation.isPending
              }
            >
              {importGenericMutation.isPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {t.import.importing}
                </>
              ) : (
                <>
                  {t.import.startImport}
                  <ArrowRight className='ml-2 h-4 w-4' />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Results Dialog */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className='max-h-[80vh] max-w-2xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <CheckCircle className='h-5 w-5 text-success' />
              {t.import.importResults}
            </DialogTitle>
            <DialogDescription>
              {importResults &&
                t.import.importResultsDescription
                  .replace('{imported}', importResults.imported.toString())
                  .replace(
                    '{skipped}',
                    (
                      importResults.duplicatesSkipped +
                      importResults.parseErrors
                    ).toString()
                  )}
            </DialogDescription>
          </DialogHeader>

          {importResults && (
            <div className='space-y-4 py-4'>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div className='rounded-lg bg-muted/50 p-3'>
                  <div className='text-muted-foreground'>
                    {t.import.filename}
                  </div>
                  <div className='font-medium'>{importResults.filename}</div>
                </div>
                <div className='rounded-lg bg-muted/50 p-3'>
                  <div className='text-muted-foreground'>
                    {t.import.totalInFile}
                  </div>
                  <div className='font-medium'>{importResults.totalInFile}</div>
                </div>
                <div className='rounded-lg bg-success/10 p-3'>
                  <div className='text-muted-foreground'>
                    {t.import.imported}
                  </div>
                  <div className='font-medium text-success'>
                    {importResults.imported}
                  </div>
                </div>
                <div className='rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20'>
                  <div className='text-muted-foreground'>
                    {t.import.duplicatesSkipped}
                  </div>
                  <div className='font-medium text-amber-600 dark:text-amber-400'>
                    {importResults.duplicatesSkipped}
                  </div>
                </div>
              </div>

              {/* Skipped Rows */}
              {importResults.skippedRows &&
                importResults.skippedRows.length > 0 && (
                  <div className='space-y-2'>
                    <button
                      className='flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground'
                      onClick={() => setShowSkippedRows(!showSkippedRows)}
                    >
                      {showSkippedRows ? (
                        <ChevronUp className='h-4 w-4' />
                      ) : (
                        <ChevronDown className='h-4 w-4' />
                      )}
                      {t.import.skippedRows} ({importResults.skippedRows.length}
                      )
                    </button>

                    {showSkippedRows && (
                      <div className='rounded-lg border'>
                        <div className='border-b p-3 text-sm text-muted-foreground'>
                          {t.import.skippedRowsDescription}
                        </div>
                        <div className='overflow-x-auto'>
                          <table className='min-w-full text-sm'>
                            <thead className='bg-muted/50'>
                              <tr>
                                <th className='px-4 py-2 text-left font-medium'>
                                  {t.import.row}
                                </th>
                                <th className='px-4 py-2 text-left font-medium'>
                                  {t.import.dateColumn}
                                </th>
                                <th className='px-4 py-2 text-left font-medium'>
                                  {t.import.amountColumn}
                                </th>
                                <th className='px-4 py-2 text-left font-medium'>
                                  {t.import.reason}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {importResults.skippedRows.map((row, idx) => (
                                <tr
                                  key={idx}
                                  className='border-t border-muted/50'
                                >
                                  <td className='px-4 py-2'>{row.rowIndex}</td>
                                  <td className='px-4 py-2'>
                                    {row.date || '-'}
                                  </td>
                                  <td className='px-4 py-2'>
                                    {row.amount
                                      ? formatCurrency(row.amount)
                                      : '-'}
                                  </td>
                                  <td className='px-4 py-2'>
                                    <span className='rounded bg-destructive/10 px-2 py-0.5 text-xs text-destructive'>
                                      {getErrorLabel(row.error)}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowResultsDialog(false)}>
              {t.common.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Area */}
      <Card className='card-hover' data-onboarding='import-dropzone'>
        <CardHeader>
          <CardTitle>{t.import.uploadCSV}</CardTitle>
          <CardDescription>{t.import.mapHeadersDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-colors duration-200 ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            } ${isProcessing ? 'pointer-events-none opacity-50' : ''} `}
          >
            <input {...getInputProps()} />
            <div className='flex flex-col items-center gap-4'>
              {isProcessing ? (
                <>
                  <Loader2 className='h-12 w-12 animate-spin text-primary' />
                  <div>
                    <p className='text-lg font-medium'>
                      {t.import.processingFile}
                    </p>
                    <p className='mt-1 text-sm text-muted-foreground'>
                      {t.import.processingDescription}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className='flex h-16 w-16 items-center justify-center rounded-full bg-primary/10'>
                    <Upload className='h-8 w-8 text-primary' />
                  </div>
                  <div>
                    <p className='text-lg font-medium'>{t.import.dragDrop}</p>
                    <p className='mt-1 text-sm text-muted-foreground'>
                      {t.import.onlyCSV}
                    </p>
                  </div>
                  <Button variant='outline'>{t.import.selectFile}</Button>
                </>
              )}
            </div>
          </div>

          {/* Upload Error */}
          {uploadError && (
            <div className='mt-6 rounded-lg border border-destructive/20 bg-destructive/10 p-4'>
              <div className='flex items-start gap-3'>
                <AlertCircle className='mt-0.5 h-5 w-5 text-destructive' />
                <div>
                  <p className='font-medium text-destructive'>
                    {t.import.importError}
                  </p>
                  <p className='mt-1 text-sm'>{uploadError}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import History */}
      <Card data-onboarding='import-history'>
        <CardHeader>
          <CardTitle>{t.import.importHistory}</CardTitle>
          <CardDescription>{t.import.noHistory}</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className='py-8 text-center text-muted-foreground'>
              {t.common.loading}...
            </div>
          ) : history && history.length > 0 ? (
            <div className='space-y-3'>
              {history.map((item) => {
                const hasSkippedRows =
                  (item.skippedRows && item.skippedRows.length > 0) ||
                  (item.duplicatesSkipped !== undefined &&
                    item.duplicatesSkipped > 0);
                const totalSkipped =
                  (item.duplicatesSkipped || 0) + (item.parseErrors || 0);
                return (
                  <HistoryCard
                    key={item.id}
                    item={item}
                    hasSkippedRows={hasSkippedRows}
                    totalSkipped={totalSkipped}
                    t={t}
                    getErrorLabel={getErrorLabel}
                  />
                );
              })}
            </div>
          ) : (
            <div className='py-8 text-center text-muted-foreground'>
              {t.import.noHistory}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
