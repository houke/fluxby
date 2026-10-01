import { useState } from 'react';
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
} from '@/lib/importers/import-options';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
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
  onReparse: () => void;
}) {
  const { language } = useLanguage(),
    text = importToolsTranslations[language],
    toast = useToast(),
    client = useQueryClient();
  const { activeProfileId } = useProfile();
  const [name, setName] = useState('');
  const { data: profiles = [] } = useQuery({
    queryKey: ['import-profiles', activeProfileId],
    queryFn: () => getDataService().getImportProfiles(),
  });
  const selectClass = 'rounded-md border bg-background p-2 text-sm';
  return (
    <details className='rounded-lg border p-3' data-onboarding='import-tools'>
      <summary className='cursor-pointer font-medium'>{text.title}</summary>
      <p className='my-3 text-sm text-muted-foreground'>{text.help}</p>
      <div className='grid gap-3 sm:grid-cols-2'>
        <label className='grid gap-1 text-sm'>
          {text.loadProfile}
          <select
            className={selectClass}
            value=''
            onChange={(e) => {
              const p = profiles.find((p) => p.id === e.target.value);
              if (p) {
                onApply(
                  p.settings.mapping,
                  p.settings.options,
                  p.settings.bank
                );
                toast.info(text.profileApplied);
              }
            }}
          >
            <option value=''>{text.none}</option>
            {profiles
              .filter((p) => p.headerSignature === headerSignature(headers))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </label>
        <label className='grid gap-1 text-sm'>
          {text.profileName}
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
          />
        </label>
        <label className='grid gap-1 text-sm'>
          {text.delimiter}
          <select
            className={selectClass}
            value={options.delimiter}
            onChange={(e) =>
              onChange({
                ...options,
                delimiter: e.target.value as ImportOptions['delimiter'],
              })
            }
          >
            {[
              ['auto', text.auto],
              [',', text.comma],
              [';', text.semicolon],
              ['\t', text.tab],
            ].map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className='grid gap-1 text-sm'>
          {text.skipRows}
          <Input
            type='number'
            min={0}
            max={1000}
            value={options.skipRows}
            onChange={(e) =>
              onChange({ ...options, skipRows: Number(e.target.value) })
            }
          />
        </label>
        <label className='grid gap-1 text-sm'>
          {text.dateFormat}
          <select
            className={selectClass}
            value={options.dateFormat}
            onChange={(e) =>
              onChange({
                ...options,
                dateFormat: e.target.value as ImportOptions['dateFormat'],
              })
            }
          >
            {[
              ['auto', text.auto],
              ['day-first', text.dayFirst],
              ['iso', text.iso],
              ['compact', text.compact],
            ].map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className='grid gap-1 text-sm'>
          {text.decimal}
          <select
            className={selectClass}
            value={options.decimal}
            onChange={(e) =>
              onChange({ ...options, decimal: e.target.value as ',' | '.' })
            }
          >
            <option value=','>{text.comma}</option>
            <option value='.'>.</option>
          </select>
        </label>
        {(['debitColumn', 'creditColumn'] as const).map((key) => (
          <label key={key} className='grid gap-1 text-sm'>
            {text[key]}
            <select
              className={selectClass}
              value={options[key]}
              onChange={(e) => onChange({ ...options, [key]: e.target.value })}
            >
              <option value=''>{text.none}</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label className='flex items-center gap-2 text-sm'>
          <input
            type='checkbox'
            checked={options.invertSign}
            onChange={(e) =>
              onChange({ ...options, invertSign: e.target.checked })
            }
          />
          {text.invertSign}
        </label>
      </div>
      <div className='mt-3 flex flex-wrap gap-2'>
        <Button variant='outline' onClick={onReparse}>
          {text.reparse}
        </Button>
        <Button
          disabled={!name.trim()}
          onClick={async () => {
            try {
              await getDataService().saveImportProfile({
                name,
                headerSignature: headerSignature(headers),
                settings: { mapping, options, bank },
              });
              await client.invalidateQueries({ queryKey: ['import-profiles'] });
              toast.success(text.saved);
            } catch (error) {
              toast.error(error as Error);
            }
          }}
        >
          {text.saveProfile}
        </Button>
      </div>
    </details>
  );
}
export function ImportRecoveryPanel() {
  const { language } = useLanguage(),
    text = importToolsTranslations[language],
    toast = useToast(),
    client = useQueryClient();
  const { activeProfileId } = useProfile();
  const [confirm, setConfirm] = useState<string | null>(null),
    [busy, setBusy] = useState(false);
  const { data: freshness = [] } = useQuery({
    queryKey: ['import-freshness', activeProfileId],
    queryFn: () => getDataService().getAccountImportFreshness(),
  });
  const { data: snapshots = [] } = useQuery({
    queryKey: ['import-recovery', activeProfileId],
    queryFn: () => getDataService().getImportRecoverySnapshots(),
  });
  const { data: batches = [] } = useQuery({
    queryKey: ['import-batches', activeProfileId],
    queryFn: () => getDataService().getImportBatches(),
  });
  return (
    <section className='space-y-4' data-onboarding='import-recovery'>
      <div className='rounded-lg border p-4'>
        <h2 className='font-medium'>{text.freshness}</h2>
        <div className='mt-3 grid gap-3 sm:grid-cols-2'>
          {freshness.map((a) => (
            <div key={a.id} className='text-sm'>
              <strong>{a.name}</strong>
              <p>
                {text.imported}:{' '}
                {a.lastImportedAt
                  ? new Date(a.lastImportedAt).toLocaleDateString(language)
                  : text.never}
              </p>
              <p className='text-muted-foreground'>
                {text.newest}: {a.newestTransactionDate ?? '—'}
              </p>
            </div>
          ))}
        </div>
      </div>
      <details className='rounded-lg border p-4'>
        <summary className='cursor-pointer font-medium'>
          {text.recovery}
        </summary>
        <p className='my-3 text-sm text-muted-foreground'>
          {text.recoveryHelp}
        </p>
        {snapshots.map((s) => (
          <div
            key={s.id}
            className='flex flex-wrap items-center justify-between gap-2 py-2 text-sm'
          >
            <span>
              {s.filename} · {new Date(s.createdAt).toLocaleString(language)}
            </span>
            <Button
              variant='outline'
              onClick={async () => {
                try {
                  const backup =
                    await getDataService().getImportRecoverySnapshot(s.id);
                  const url = URL.createObjectURL(
                    new Blob([JSON.stringify(backup, null, 2)], {
                      type: 'application/json',
                    })
                  );
                  const anchor = document.createElement('a');
                  anchor.href = url;
                  anchor.download = `fluxby-before-import-${s.id}.json`;
                  anchor.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                } catch (error) {
                  toast.error(error as Error);
                }
              }}
            >
              {text.download}
            </Button>
          </div>
        ))}
        {batches
          .filter((b) => b.count > 0)
          .map((b) => (
            <div
              key={b.id}
              className='flex flex-wrap items-center justify-between gap-2 py-2 text-sm'
            >
              <span>
                {b.filename} · {b.count} {text.rows}
              </span>
              <Button variant='outline' onClick={() => setConfirm(b.id)}>
                {text.undo}
              </Button>
            </div>
          ))}
      </details>
      <div className='rounded-lg border p-4 text-sm'>
        <h2 className='font-medium'>{text.bankFormats}</h2>
        <p className='mt-2 text-muted-foreground'>{text.bankHelp}</p>
      </div>
      <Dialog
        open={!!confirm}
        onOpenChange={(open) => {
          if (!open && !busy) setConfirm(null);
        }}
      >
        <DialogContent>
          <DialogTitle>{text.confirmUndo}</DialogTitle>
          <DialogDescription>{text.confirmHelp}</DialogDescription>
          <DialogFooter>
            <Button
              variant='outline'
              disabled={busy}
              onClick={() => setConfirm(null)}
            >
              {text.cancel}
            </Button>
            <Button
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
                      : (error as Error)
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              {text.undo}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
