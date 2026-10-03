import { useId, useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/contexts/ToastContext';
import { getDataService } from '@/lib/db-singleton';
import { importToolsTranslations } from '@/lib/i18n/import-tools';
import {
  type ImportOptions,
  type ImportColumnMapping,
  headerSignature,
  isImportMappingComplete,
  rebindImportColumns,
} from '@/lib/importers/import-options';
import { AccountFreshness } from './AccountFreshness';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FormSelect } from '@/components/ui/form-select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export function ImportOptionsPanel({
  options,
  onChange,
  headers,
  mapping,
  bank,
  onApply,
  onReparse,
  disabled = false,
}: {
  options: ImportOptions;
  onChange: (value: ImportOptions) => void;
  headers: string[];
  mapping: ImportColumnMapping;
  bank: string;
  onApply: (
    mapping: ImportColumnMapping,
    options: ImportOptions,
    bank: string
  ) => void;
  onReparse: () => void | Promise<void>;
  disabled?: boolean;
}) {
  const { language } = useLanguage();
  const text = importToolsTranslations[language];
  const toast = useToast();
  const client = useQueryClient();
  const { activeProfileId } = useProfile();
  const prefix = useId();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const {
    data: profiles = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['import-profiles', activeProfileId],
    queryFn: () => getDataService().getImportProfiles(),
    enabled: Boolean(activeProfileId),
  });
  const matchingProfiles = profiles.filter(
    (profile) => profile.headerSignature === headerSignature(headers)
  );
  const columnOptions = [
    { value: '', label: text.none },
    ...headers.map((value) => ({ value, label: value })),
  ];
  return (
    <Card data-onboarding='import-tools'>
      <details className='group'>
        <summary className='flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-base font-semibold sm:p-6 [&::-webkit-details-marker]:hidden'>
          {text.title}
          <ChevronDown
            className='h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180'
            aria-hidden
          />
        </summary>
        <CardContent className='space-y-4'>
          <p className='text-sm text-muted-foreground'>{text.help}</p>
          {isError && (
            <p role='alert' className='text-sm text-destructive'>
              {text.loadFailed}
            </p>
          )}
          <fieldset
            disabled={disabled || busy}
            className='grid gap-4 sm:grid-cols-2'
          >
            <div className='space-y-2'>
              <Label htmlFor={`${prefix}-profile`}>{text.loadProfile}</Label>
              <FormSelect
                id={`${prefix}-profile`}
                label={text.loadProfile}
                value=''
                disabled={isLoading || matchingProfiles.length === 0}
                options={[
                  { value: '', label: isLoading ? text.loading : text.none },
                  ...matchingProfiles.map((profile) => ({
                    value: profile.id,
                    label: profile.name,
                  })),
                ]}
                onChange={(id) => {
                  const profile = matchingProfiles.find(
                    (item) => item.id === id
                  );
                  if (!profile) return;
                  try {
                    const rebound = rebindImportColumns(
                      profile.settings.mapping,
                      profile.settings.options,
                      headers
                    );
                    onApply(
                      rebound.mapping,
                      rebound.options,
                      profile.settings.bank
                    );
                    toast.info(text.profileApplied);
                  } catch {
                    toast.error(text.invalid);
                  }
                }}
              />
              {!isLoading && !isError && matchingProfiles.length === 0 && (
                <p className='text-xs text-muted-foreground'>
                  {text.emptyProfiles}
                </p>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor={`${prefix}-name`}>{text.profileName}</Label>
              <Input
                id={`${prefix}-name`}
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={120}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor={`${prefix}-delimiter`}>{text.delimiter}</Label>
              <FormSelect
                id={`${prefix}-delimiter`}
                label={text.delimiter}
                value={options.delimiter}
                onChange={(value) =>
                  onChange({
                    ...options,
                    delimiter: value as ImportOptions['delimiter'],
                  })
                }
                options={[
                  { value: 'auto', label: text.auto },
                  { value: ',', label: text.comma },
                  { value: ';', label: text.semicolon },
                  { value: '\t', label: text.tab },
                ]}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor={`${prefix}-skip`}>{text.skipRows}</Label>
              <Input
                id={`${prefix}-skip`}
                type='number'
                min={0}
                max={1000}
                step={1}
                value={options.skipRows}
                onChange={(event) =>
                  onChange({ ...options, skipRows: Number(event.target.value) })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor={`${prefix}-date`}>{text.dateFormat}</Label>
              <FormSelect
                id={`${prefix}-date`}
                label={text.dateFormat}
                value={options.dateFormat}
                onChange={(value) =>
                  onChange({
                    ...options,
                    dateFormat: value as ImportOptions['dateFormat'],
                  })
                }
                options={[
                  { value: 'auto', label: text.auto },
                  { value: 'day-first', label: text.dayFirst },
                  { value: 'iso', label: text.iso },
                  { value: 'compact', label: text.compact },
                ]}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor={`${prefix}-decimal`}>{text.decimal}</Label>
              <FormSelect
                id={`${prefix}-decimal`}
                label={text.decimal}
                value={options.decimal}
                onChange={(value) =>
                  onChange({
                    ...options,
                    decimal: value as ImportOptions['decimal'],
                  })
                }
                options={[
                  { value: ',', label: text.comma },
                  { value: '.', label: text.dot },
                ]}
              />
            </div>
            {(['debitColumn', 'creditColumn'] as const).map((key) => (
              <div key={key} className='space-y-2'>
                <Label htmlFor={`${prefix}-${key}`}>{text[key]}</Label>
                <FormSelect
                  id={`${prefix}-${key}`}
                  label={text[key]}
                  value={options[key]}
                  options={columnOptions}
                  onChange={(value) => onChange({ ...options, [key]: value })}
                />
              </div>
            ))}
            <div className='flex items-center gap-2 sm:col-span-2'>
              <Checkbox
                id={`${prefix}-invert`}
                checked={options.invertSign}
                onChange={(event) =>
                  onChange({ ...options, invertSign: event.target.checked })
                }
              />
              <Label htmlFor={`${prefix}-invert`}>{text.invertSign}</Label>
            </div>
          </fieldset>
          <div className='flex flex-wrap gap-2'>
            <Button
              variant='outline'
              disabled={disabled || busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onReparse();
                } finally {
                  setBusy(false);
                }
              }}
            >
              {text.reparse}
            </Button>
            <Button
              disabled={
                disabled ||
                busy ||
                !name.trim() ||
                !isImportMappingComplete(mapping, options)
              }
              onClick={async () => {
                setBusy(true);
                try {
                  await getDataService().saveImportProfile({
                    name,
                    headerSignature: headerSignature(headers),
                    settings: { mapping, options, bank },
                  });
                  await client.invalidateQueries({
                    queryKey: ['import-profiles', activeProfileId],
                  });
                  toast.success(text.saved);
                } catch {
                  toast.error(text.profileFailed);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' aria-hidden />
                  {text.saving}
                </>
              ) : (
                text.saveProfile
              )}
            </Button>
          </div>
        </CardContent>
      </details>
    </Card>
  );
}

export function ImportRecoveryPanel() {
  const { language } = useLanguage();
  const text = importToolsTranslations[language];
  const toast = useToast();
  const client = useQueryClient();
  const { activeProfileId } = useProfile();
  const [confirm, setConfirm] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const snapshotsQuery = useQuery({
    queryKey: ['import-recovery', activeProfileId],
    queryFn: () => getDataService().getImportRecoverySnapshots(),
    enabled: Boolean(activeProfileId),
  });
  const batchesQuery = useQuery({
    queryKey: ['import-batches', activeProfileId],
    queryFn: () => getDataService().getImportBatches(),
    enabled: Boolean(activeProfileId),
  });
  const snapshots = snapshotsQuery.data ?? [];
  const batches = (batchesQuery.data ?? []).filter((batch) => batch.count > 0);
  const locale = language === 'nl' ? 'nl-NL' : 'en-GB';
  return (
    <section className='space-y-4' data-onboarding='import-recovery'>
      <AccountFreshness />
      <Card className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'>
        <details className='group'>
          <summary className='flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-base font-semibold sm:p-6 [&::-webkit-details-marker]:hidden'>
            {text.recovery}
            <ChevronDown
              className='h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180'
              aria-hidden
            />
          </summary>
          <CardContent className='space-y-4'>
            <p className='text-sm text-muted-foreground'>{text.recoveryHelp}</p>
            {snapshotsQuery.isLoading || batchesQuery.isLoading ? (
              <p className='text-sm text-muted-foreground'>{text.loading}</p>
            ) : snapshotsQuery.isError || batchesQuery.isError ? (
              <div
                className='flex flex-wrap items-center gap-3 text-sm'
                role='alert'
              >
                <p className='text-destructive'>{text.loadFailed}</p>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    void snapshotsQuery.refetch();
                    void batchesQuery.refetch();
                  }}
                >
                  {text.retry}
                </Button>
              </div>
            ) : snapshots.length === 0 && batches.length === 0 ? (
              <p className='text-sm text-muted-foreground'>
                {text.emptyRecovery}
              </p>
            ) : (
              <>
                {snapshots.length > 0 && (
                  <div className='space-y-2'>
                    <h3 className='text-sm font-medium'>{text.snapshots}</h3>
                    {snapshots.map((snapshot) => (
                      <div
                        key={snapshot.id}
                        className='flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm'
                      >
                        <span className='min-w-0 break-words'>
                          {snapshot.filename}
                          <span className='mt-1 block text-xs text-muted-foreground'>
                            {new Date(snapshot.createdAt).toLocaleString(
                              locale
                            )}
                          </span>
                        </span>
                        <Button
                          variant='outline'
                          size='sm'
                          disabled={busy}
                          onClick={async () => {
                            setBusy(true);
                            try {
                              const backup =
                                await getDataService().getImportRecoverySnapshot(
                                  snapshot.id
                                );
                              const url = URL.createObjectURL(
                                new Blob([JSON.stringify(backup, null, 2)], {
                                  type: 'application/json',
                                })
                              );
                              const anchor = document.createElement('a');
                              anchor.href = url;
                              anchor.download = `fluxby-before-import-${snapshot.id}.json`;
                              anchor.click();
                              setTimeout(() => URL.revokeObjectURL(url), 1000);
                            } catch {
                              toast.error(text.recoveryFailed);
                            } finally {
                              setBusy(false);
                            }
                          }}
                        >
                          {text.download}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {batches.length > 0 && (
                  <div className='space-y-2'>
                    <h3 className='text-sm font-medium'>{text.batches}</h3>
                    {batches.map((batch) => (
                      <div
                        key={batch.id}
                        className='flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm'
                      >
                        <span className='min-w-0 break-words'>
                          {batch.filename}
                          <span className='mt-1 block text-xs text-muted-foreground'>
                            {batch.count} {text.rows} ·{' '}
                            {new Date(batch.createdAt).toLocaleString(locale)}
                          </span>
                        </span>
                        <Button
                          variant='outline'
                          size='sm'
                          disabled={busy}
                          onClick={() => setConfirm(batch.id)}
                        >
                          {text.undo}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </details>
      </Card>
      <Card className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'>
        <CardHeader>
          <CardTitle className='text-base sm:text-lg'>
            {text.bankFormats}
          </CardTitle>
          <CardDescription>{text.bankHelp}</CardDescription>
        </CardHeader>
      </Card>
      <Dialog
        open={!!confirm}
        onOpenChange={(open) => {
          if (!open && !busy) setConfirm(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{text.confirmUndo}</DialogTitle>
            <DialogDescription>{text.confirmHelp}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              disabled={busy}
              onClick={() => setConfirm(null)}
            >
              {text.cancel}
            </Button>
            <Button
              variant='destructive'
              disabled={busy}
              onClick={async () => {
                if (!confirm) return;
                setBusy(true);
                try {
                  await getDataService().undoImportBatch(confirm);
                  await client.invalidateQueries();
                  toast.success(text.undone);
                  setConfirm(null);
                } catch (error) {
                  toast.error(
                    error instanceof Error &&
                      error.message === 'importBatchChanged'
                      ? text.changed
                      : error instanceof Error &&
                          error.message === 'importBatchBalanceAnchor'
                        ? text.balanceAnchor
                        : text.undoFailed
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' aria-hidden />
              )}
              {text.undo}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
