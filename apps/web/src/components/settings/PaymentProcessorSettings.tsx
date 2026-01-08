import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Check,
  X,
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { api } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useConfirm } from '@/contexts/ConfirmContext';

export function PaymentProcessorSettings() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { activeProfileId } = useProfile();
  const confirm = useConfirm();

  const splitPatterns = (patterns: string) =>
    patterns
      .split(/[|,]/)
      .map((pattern) => pattern.trim())
      .filter(Boolean);

  const [newRuleName, setNewRuleName] = useState('');
  const [newRulePatterns, setNewRulePatterns] = useState('');
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editRuleName, setEditRuleName] = useState('');
  const [editRulePatterns, setEditRulePatterns] = useState('');

  // Payment processor rules query (pattern-based)
  const { data: providerRules = [], isLoading: rulesLoading } = useQuery<
    Array<{ id: string; name: string; patterns: string }>
  >({
    queryKey: ['paymentProcessorRules'],
    queryFn: () => api.getPaymentProviderRules(),
  });

  // Payment processor rules mutations
  const addRuleMutation = useMutation({
    mutationFn: ({ name, patterns }: { name: string; patterns: string }) =>
      api.addPaymentProviderRule({
        name,
        patterns: splitPatterns(patterns),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentProcessorRules'] });
      setNewRuleName('');
      setNewRulePatterns('');
      toast.success(
        t.settings.paymentProcessors?.ruleAdded || 'Rule added successfully'
      );
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({
      id,
      name,
      patterns,
    }: {
      id: string;
      name?: string;
      patterns?: string;
    }) =>
      api.updatePaymentProviderRule(id, {
        name,
        patterns: patterns ? splitPatterns(patterns) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentProcessorRules'] });
      setEditingRuleId(null);
      toast.success(
        t.settings.paymentProcessors?.ruleUpdated || 'Rule updated'
      );
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => api.deletePaymentProviderRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentProcessorRules'] });
      toast.success(
        t.settings.paymentProcessors?.ruleDeleted || 'Rule deleted'
      );
    },
  });

  // Apply rules to existing transactions
  const applyRulesMutation = useMutation({
    mutationFn: () => api.applyPaymentProviderRulesToTransactions(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ['transactions', activeProfileId],
      });
      const data = result as { updated?: number } | undefined;
      const count = data?.updated || 0;
      if (count > 0) {
        toast.success(
          (
            t.settings.paymentProcessors?.rulesApplied ||
            '{count} transactions updated with payment processor'
          ).replace('{count}', String(count))
        );
      } else {
        toast.info(
          t.settings.paymentProcessors?.noTransactionsUpdated ||
            'No transactions needed updating'
        );
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to apply rules');
    },
  });

  return (
    <div className='-mx-3 sm:mx-0'>
      <Card
        className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
        data-onboarding='settings-payment-processors'
      >
        <CardHeader className='px-3 py-3 sm:px-6 sm:py-4'>
          <div className='flex items-start justify-between gap-4'>
            <div className='flex-1'>
              <CardTitle className='text-base sm:text-lg'>
                {t.settings.paymentProcessors?.rulesTitle ||
                  'Payment processor regels'}
              </CardTitle>
              <CardDescription className='text-xs sm:text-sm'>
                {t.settings.paymentProcessors?.rulesDescription ||
                  'Definieer regels om payment processors te detecteren op basis van transactiegegevens. Voeg komma-gescheiden patronen toe die gematcht worden op IBAN, beschrijving of naam.'}
              </CardDescription>
            </div>
            <Button
              variant='secondary'
              onClick={() => applyRulesMutation.mutate()}
              disabled={
                applyRulesMutation.isPending || providerRules.length === 0
              }
              className='shrink-0'
            >
              {applyRulesMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <RefreshCw className='mr-2 h-4 w-4' />
              )}
              {t.settings.paymentProcessors?.applyToTransactions ||
                'Apply to transactions'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className='px-3 pt-0 pb-3 sm:px-6 sm:pt-0 sm:pb-6'>
          <div className='space-y-4'>
            {/* Add new rule form */}
            <div className='flex gap-2'>
              <Input
                placeholder={
                  t.settings.paymentProcessors?.namePlaceholder ||
                  'Naam (bijv. Adyen)'
                }
                value={newRuleName}
                onChange={(e) => setNewRuleName(e.target.value)}
                className='w-40'
              />
              <Input
                placeholder={
                  t.settings.paymentProcessors?.patternsPlaceholder ||
                  'Patronen (bijv. ADYB,ic. Adyen)'
                }
                value={newRulePatterns}
                onChange={(e) => setNewRulePatterns(e.target.value)}
                className='flex-1'
              />
              <Button
                onClick={() => {
                  if (!newRuleName.trim() || !newRulePatterns.trim()) return;
                  addRuleMutation.mutate({
                    name: newRuleName.trim(),
                    patterns: newRulePatterns.trim(),
                  });
                }}
                disabled={
                  !newRuleName.trim() ||
                  !newRulePatterns.trim() ||
                  addRuleMutation.isPending
                }
              >
                <Plus className='mr-1 h-4 w-4' />
                {t.common?.add || 'Toevoegen'}
              </Button>
            </div>

            {/* Rules list */}
            {rulesLoading ? (
              <div className='space-y-2'>
                <Skeleton className='h-12 w-full' />
                <Skeleton className='h-12 w-full' />
              </div>
            ) : providerRules.length === 0 ? (
              <p className='py-4 text-center text-sm text-muted-foreground'>
                {t.settings.paymentProcessors?.noRules ||
                  'Geen payment processor regels geconfigureerd'}
              </p>
            ) : (
              <TooltipProvider>
                <div className='space-y-2'>
                  {providerRules.map((rule) => (
                    <div
                      key={rule.id}
                      className='flex items-center justify-between rounded-lg border bg-card p-3'
                    >
                      {editingRuleId === rule.id ? (
                        <div className='flex flex-1 items-center gap-2'>
                          <Input
                            value={editRuleName}
                            onChange={(e) => setEditRuleName(e.target.value)}
                            className='w-32'
                          />
                          <Input
                            value={editRulePatterns}
                            onChange={(e) =>
                              setEditRulePatterns(e.target.value)
                            }
                            className='flex-1'
                          />
                          <Button
                            size='icon'
                            variant='ghost'
                            className='h-7 w-7 rounded-full hover:bg-purple-600 hover:text-white'
                            onClick={() => {
                              if (updateRuleMutation.isPending) return;
                              updateRuleMutation.mutate({
                                id: rule.id,
                                name: editRuleName,
                                patterns: editRulePatterns,
                              });
                            }}
                          >
                            {updateRuleMutation.isPending ? (
                              <Loader2 className='h-4 w-4 animate-spin' />
                            ) : (
                              <Check className='h-4 w-4' />
                            )}
                          </Button>
                          <Button
                            size='icon'
                            variant='ghost'
                            className='h-7 w-7 rounded-full hover:bg-purple-600 hover:text-white'
                            onClick={() => setEditingRuleId(null)}
                          >
                            <X className='h-4 w-4' />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className='min-w-0 flex-1'>
                            <div className='flex items-center gap-2'>
                              <span className='rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300'>
                                {rule.name}
                              </span>
                            </div>
                            <p className='mt-1 truncate text-xs text-muted-foreground'>
                              {rule.patterns}
                            </p>
                          </div>
                          <div className='flex items-center gap-1'>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className='h-8 w-8 rounded-md transition-colors hover:bg-purple-600 hover:text-white'
                                  onClick={() => {
                                    setEditingRuleId(rule.id);
                                    setEditRuleName(rule.name);
                                    setEditRulePatterns(rule.patterns);
                                  }}
                                >
                                  <Pencil className='h-4 w-4' />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t.common?.edit || 'Bewerken'}</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className='h-8 w-8 rounded-md transition-colors hover:bg-red-600 hover:text-white'
                                  onClick={async () => {
                                    const isConfirmed = await confirm({
                                      title:
                                        t.settings.paymentProcessors
                                          ?.deleteRuleTitle || 'Delete rule',
                                      message: `${
                                        t.settings.paymentProcessors
                                          ?.deleteConfirm ||
                                        'Are you sure you want to delete the rule'
                                      } "${rule.name}"${
                                        t.settings.paymentProcessors
                                          ?.deleteConfirm2
                                          ? ' ' +
                                            t.settings.paymentProcessors
                                              .deleteConfirm2
                                          : '?'
                                      }`,
                                      variant: 'danger',
                                    });
                                    if (isConfirmed) {
                                      deleteRuleMutation.mutate(rule.id);
                                    }
                                  }}
                                >
                                  <Trash2 className='h-4 w-4' />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t.common?.delete || 'Verwijderen'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </TooltipProvider>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
