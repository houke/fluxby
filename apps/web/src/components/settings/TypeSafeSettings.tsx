import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ExternalLink,
  KeyRound,
  Sparkles,
  Check,
  X,
  AlertTriangle,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useDataService } from '@/contexts/DatabaseContext';
import { useOPFSSetting } from '@/hooks/useOPFSSetting';
import { Currency } from '@/components/ui/currency';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  askTypeSafe,
  clearTypeSafeTraceEvents,
  getTypeSafeTraceEvents,
  noulAnswer,
  subscribeToTypeSafeTrace,
  type TypeSafeTraceEvent,
} from '@/lib/typesafe-client';

type DuplicatePair = Awaited<
  ReturnType<ReturnType<typeof useDataService>['findSemanticDuplicates']>
>[number];

export function TypeSafeSettings() {
  const { t } = useLanguage();
  const toast = useToast();
  const queryClient = useQueryClient();
  const dataService = useDataService();
  const s = t.settings.typesafeAi;

  const [storedKey, setStoredKey, clearKey, isLoadingKey] =
    useOPFSSetting<string>('typesafe-api-key', '');
  const [traceEnabled, setTraceEnabled] = useOPFSSetting<boolean>(
    'typesafe-ai-trace-enabled',
    false
  );
  const [editValue, setEditValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const [duplicates, setDuplicates] = useState<DuplicatePair[]>([]);
  const [duplicatesOpen, setDuplicatesOpen] = useState(false);
  const [traceEvents, setTraceEvents] = useState<readonly TypeSafeTraceEvent[]>(
    () => [...getTypeSafeTraceEvents()]
  );

  const hasKey = !!storedKey && !isLoadingKey;

  useEffect(
    () =>
      subscribeToTypeSafeTrace(() => {
        setTraceEvents([...getTypeSafeTraceEvents()]);
      }),
    []
  );

  const handleTraceToggle = async (enabled: boolean) => {
    await setTraceEnabled(enabled);
    if (!enabled) {
      clearTypeSafeTraceEvents();
    }
  };

  const handleStartEdit = () => {
    setEditValue('');
    setIsEditing(true);
    setShowKey(false);
  };

  const handleSave = async () => {
    const trimmed = editValue.trim();
    if (!trimmed) return;
    await setStoredKey(trimmed);
    setIsEditing(false);
    setEditValue('');
    toast.success(s.keySaved);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue('');
  };

  const handleRemove = async () => {
    await clearKey();
    toast.info(s.keyRemoved);
  };

  const categorizeMutation = useMutation({
    mutationFn: () => dataService.applyCategoriesToUncategorized(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categoryStatsByPeriod'] });
      if (result.updated === 0) {
        toast.info(s.categorizeTransactionsNone);
        return;
      }
      toast.success(
        s.categorizeTransactionsResult
          .replace('{count}', String(result.updated))
          .replace('{rules}', String(result.rulesApplied))
          .replace('{ai}', String(result.aiApplied))
      );
    },
    onError: (error) => toast.error(error as Error),
  });

  const discoverRulesMutation = useMutation({
    mutationFn: () => dataService.discoverCategoryRulesWithAI(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['categoryRules'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      if (result.created === 0) {
        toast.info(s.discoverRulesNone);
        return;
      }
      toast.success(
        s.discoverRulesResult
          .replace('{rules}', String(result.created))
          .replace('{transactions}', String(result.categorized))
      );
    },
    onError: (error) => toast.error(error as Error),
  });

  const detectProvidersMutation = useMutation({
    mutationFn: () => dataService.detectPaymentProvidersWithAI(),
    onSuccess: (result) => {
      if (result.detected > 0) {
        toast.success(
          s.detectProvidersResult.replace('{count}', String(result.detected))
        );
      } else {
        toast.info(s.detectProvidersNone);
      }
    },
    onError: () => toast.error(s.detectProvidersNone),
  });

  const scanDuplicatesMutation = useMutation({
    mutationFn: () => dataService.findSemanticDuplicates(),
    onSuccess: (results) => {
      if (results.length === 0) {
        toast.info(s.scanDuplicatesNone);
      } else {
        setDuplicates(results);
        setDuplicatesOpen(true);
      }
    },
    onError: () => toast.error(s.scanDuplicatesNone),
  });

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await askTypeSafe(
        { purpose: 'Fluxby TypeSafe AI connection check' },
        {
          connection: {
            type: 'noul',
            instructions:
              'Confirm that this harmless TypeSafe AI connection check was received.',
          },
        }
      );
      return noulAnswer(response, 'connection');
    },
    onSuccess: () => toast.success(s.testConnectionSuccess),
    onError: (error) => toast.error(error as Error),
  });

  return (
    <>
      <Card className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'>
        <CardHeader className='px-3 py-3 sm:px-6 sm:py-4'>
          <div className='flex items-start gap-3'>
            <Sparkles className='mt-0.5 h-5 w-5 shrink-0 text-purple-500' />
            <div>
              <CardTitle className='text-base sm:text-lg'>{s.title}</CardTitle>
              <CardDescription className='text-xs sm:text-sm'>
                {s.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className='px-3 pt-0 pb-3 sm:px-6 sm:pb-6'>
          <div className='space-y-6'>
            <p className='text-sm text-muted-foreground'>{s.whatIsTypeSafe}</p>

            {/* API key section */}
            <div className='space-y-2'>
              <label className='text-sm font-medium'>{s.apiKeyLabel}</label>

              {isEditing ? (
                <div className='flex gap-2'>
                  <Input
                    type={showKey ? 'text' : 'password'}
                    placeholder={s.apiKeyPlaceholder}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave();
                      if (e.key === 'Escape') handleCancel();
                    }}
                    autoFocus
                    className='font-mono text-sm'
                  />
                  <Button
                    variant='ghost'
                    size='icon'
                    className='rounded-md hover:bg-green-600 hover:text-white'
                    onClick={handleSave}
                    disabled={!editValue.trim()}
                  >
                    <Check className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='rounded-md hover:bg-red-600 hover:text-white'
                    onClick={handleCancel}
                  >
                    <X className='h-4 w-4' />
                  </Button>
                </div>
              ) : (
                <div className='flex flex-wrap items-center gap-2'>
                  {hasKey ? (
                    <>
                      <div className='flex flex-1 items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 font-mono text-sm'>
                        <KeyRound className='h-3.5 w-3.5 shrink-0 text-green-500' />
                        <span className='text-muted-foreground'>
                          {showKey
                            ? storedKey
                            : '••••••••••••••••••••••••••••••••'}
                        </span>
                      </div>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='shrink-0 text-xs'
                        onClick={() => setShowKey((v) => !v)}
                      >
                        {showKey ? s.hideKey : s.showKey}
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='shrink-0 rounded-md hover:bg-purple-600 hover:text-white'
                        onClick={handleStartEdit}
                      >
                        {s.changeKey}
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='shrink-0 rounded-md hover:bg-red-600 hover:text-white'
                        onClick={handleRemove}
                      >
                        {s.removeKey}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleStartEdit}
                      className='gap-2'
                    >
                      <KeyRound className='h-4 w-4' />
                      {s.addKey}
                    </Button>
                  )}
                </div>
              )}

              <a
                href='https://console.typesafe.ai/keys'
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-1 text-xs text-purple-500 hover:underline'
              >
                <ExternalLink className='h-3 w-3' />
                {s.getKeyLink}
              </a>
            </div>

            {/* AI action buttons — only available when key is set */}
            {hasKey ? (
              <div
                className='space-y-3 border-t pt-4'
                data-onboarding='settings-typesafe-actions'
              >
                <p className='text-xs text-muted-foreground'>
                  {s.dataDisclosure}
                </p>
                <div className='flex items-start justify-between gap-4'>
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-medium'>{s.testConnection}</p>
                    <p className='text-xs text-muted-foreground'>
                      {s.testConnectionDescription}
                    </p>
                  </div>
                  <Button
                    variant='secondary'
                    size='sm'
                    className='shrink-0'
                    disabled={testConnectionMutation.isPending}
                    onClick={() => testConnectionMutation.mutate()}
                  >
                    {testConnectionMutation.isPending && (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    )}
                    {testConnectionMutation.isPending
                      ? s.testConnectionRunning
                      : s.testConnection}
                  </Button>
                </div>
                <div className='rounded-lg border border-dashed p-3'>
                  <div className='flex items-center justify-between gap-3'>
                    <div>
                      <Label
                        htmlFor='typesafe-trace'
                        className='cursor-pointer text-sm font-medium'
                      >
                        {s.traceToggle}
                      </Label>
                      <p className='mt-1 text-xs text-muted-foreground'>
                        {s.traceDescription}
                      </p>
                    </div>
                    <Switch
                      id='typesafe-trace'
                      checked={traceEnabled}
                      onCheckedChange={handleTraceToggle}
                    />
                  </div>

                  {traceEnabled && (
                    <div className='mt-3 space-y-2 border-t pt-3'>
                      <div className='flex items-center justify-between gap-3'>
                        <p className='text-xs text-muted-foreground'>
                          {s.traceSessionOnly}
                        </p>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-7 text-xs'
                          disabled={traceEvents.length === 0}
                          onClick={clearTypeSafeTraceEvents}
                        >
                          {s.traceClear}
                        </Button>
                      </div>
                      {traceEvents.length === 0 ? (
                        <p className='text-xs text-muted-foreground'>
                          {s.traceEmpty}
                        </p>
                      ) : (
                        <div className='max-h-80 space-y-2 overflow-y-auto'>
                          {traceEvents.map((event) => (
                            <details
                              key={event.id}
                              className='rounded-md bg-muted/50 p-2 text-xs'
                            >
                              <summary className='cursor-pointer font-medium'>
                                {event.status === 'success'
                                  ? s.traceSuccess
                                  : event.status === 'error'
                                    ? s.traceError
                                    : s.tracePending}{' '}
                                {'· '}
                                {new Date(event.startedAt).toLocaleTimeString()}
                                {event.durationMs !== undefined
                                  ? ` · ${event.durationMs} ms`
                                  : ''}
                              </summary>
                              <pre className='mt-2 max-h-64 overflow-auto font-mono text-[11px] leading-relaxed break-words whitespace-pre-wrap'>
                                {JSON.stringify(event, null, 2)}
                              </pre>
                            </details>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className='flex items-start justify-between gap-4'>
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-medium'>
                      {s.categorizeTransactions}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {s.categorizeTransactionsDescription}
                    </p>
                  </div>
                  <Button
                    variant='secondary'
                    size='sm'
                    className='shrink-0'
                    disabled={categorizeMutation.isPending}
                    onClick={() => categorizeMutation.mutate()}
                  >
                    {categorizeMutation.isPending && (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    )}
                    {categorizeMutation.isPending
                      ? s.categorizeTransactionsRunning
                      : s.categorizeTransactions}
                  </Button>
                </div>

                <div className='flex items-start justify-between gap-4'>
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-medium'>{s.discoverRules}</p>
                    <p className='text-xs text-muted-foreground'>
                      {s.discoverRulesDescription}
                    </p>
                  </div>
                  <Button
                    variant='secondary'
                    size='sm'
                    className='shrink-0'
                    disabled={discoverRulesMutation.isPending}
                    onClick={() => discoverRulesMutation.mutate()}
                  >
                    {discoverRulesMutation.isPending && (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    )}
                    {discoverRulesMutation.isPending
                      ? s.discoverRulesRunning
                      : s.discoverRules}
                  </Button>
                </div>

                <div className='flex items-start justify-between gap-4'>
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-medium'>{s.detectProviders}</p>
                    <p className='text-xs text-muted-foreground'>
                      {s.detectProvidersDescription}
                    </p>
                  </div>
                  <Button
                    variant='secondary'
                    size='sm'
                    className='shrink-0'
                    disabled={detectProvidersMutation.isPending}
                    onClick={() => detectProvidersMutation.mutate()}
                  >
                    {detectProvidersMutation.isPending && (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    )}
                    {detectProvidersMutation.isPending
                      ? s.detectProvidersRunning
                      : s.detectProviders}
                  </Button>
                </div>

                <div className='flex items-start justify-between gap-4'>
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-medium'>{s.scanDuplicates}</p>
                    <p className='text-xs text-muted-foreground'>
                      {s.scanDuplicatesDescription}
                    </p>
                  </div>
                  <Button
                    variant='secondary'
                    size='sm'
                    className='shrink-0'
                    disabled={scanDuplicatesMutation.isPending}
                    onClick={() => scanDuplicatesMutation.mutate()}
                  >
                    {scanDuplicatesMutation.isPending && (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    )}
                    {scanDuplicatesMutation.isPending
                      ? s.scanDuplicatesRunning
                      : s.scanDuplicates}
                  </Button>
                </div>
              </div>
            ) : (
              <div className='flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200'>
                <AlertTriangle className='h-3.5 w-3.5 shrink-0' />
                {s.noKeyWarning}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Semantic duplicates review dialog */}
      <Dialog open={duplicatesOpen} onOpenChange={setDuplicatesOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <ShieldAlert className='h-5 w-5 text-amber-500' />
              {s.scanDuplicatesTitle}
            </DialogTitle>
            <DialogDescription>{s.scanDuplicatesDescription}</DialogDescription>
          </DialogHeader>

          <div className='max-h-96 space-y-4 overflow-y-auto py-1'>
            {duplicates.map((pair, idx) => (
              <div
                key={`${pair.tx1.id}-${pair.tx2.id}`}
                className='rounded-lg border p-3'
              >
                <div className='mb-2 flex items-center justify-between'>
                  <span className='text-xs font-medium tracking-wide text-muted-foreground uppercase'>
                    {s.duplicatePair.replace('{n}', String(idx + 1))}
                  </span>
                  <Badge variant='outline' className='text-xs'>
                    {s.duplicateProbability}{' '}
                    {Math.round(pair.probability * 100)}%
                  </Badge>
                </div>
                <div className='grid grid-cols-2 gap-3'>
                  {[pair.tx1, pair.tx2].map((tx, txIdx) => (
                    <div
                      key={tx.id}
                      className='space-y-1 rounded-md bg-muted/40 p-2 text-xs'
                    >
                      <div className='font-medium text-muted-foreground uppercase'>
                        {txIdx === 0 ? 'A' : 'B'}
                      </div>
                      <div className='text-muted-foreground'>{tx.date}</div>
                      <div className='font-mono font-medium'>
                        <Currency amount={tx.amount} />
                      </div>
                      <div className='line-clamp-2 text-muted-foreground'>
                        {tx.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button onClick={() => setDuplicatesOpen(false)}>
              {s.duplicatesDismiss}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
