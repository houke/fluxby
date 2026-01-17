import React from 'react';
import {
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Building2,
  Edit2,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn, findSimilarNameGroups } from '@/lib/utils';
import type { SharedIban, CleanupRule } from '@fluxby/shared';

interface SharedIbanManagerProps {
  sharedIbans: SharedIban[];
  isLoading: boolean;
  showSharedIbans: boolean;
  setShowSharedIbans: (show: boolean) => void;
  onDetectShared: () => void;
  isDetectPending: boolean;
  onEditShared: (shared: SharedIban) => void;
  cleanupRules: CleanupRule[] | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  translations: any;
}

export const SharedIbanManager: React.FC<SharedIbanManagerProps> = ({
  sharedIbans,
  isLoading,
  showSharedIbans,
  setShowSharedIbans,
  onDetectShared,
  isDetectPending,
  onEditShared,
  cleanupRules,
  translations: t,
}) => {
  console.log('[SharedIbanManager] Render:', {
    sharedIbansLength: sharedIbans.length,
    isLoading,
  });

  if (sharedIbans.length === 0) return null;

  const groupColors = [
    'ring-2 ring-offset-1 ring-purple-400',
    'ring-2 ring-offset-1 ring-blue-400',
    'ring-2 ring-offset-1 ring-green-400',
    'ring-2 ring-offset-1 ring-orange-400',
    'ring-2 ring-offset-1 ring-pink-400',
  ];

  return (
    <Card
      data-onboarding='shared-ibans-card'
      className='border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/10'
    >
      <CardHeader
        className='cursor-pointer'
        onClick={() => setShowSharedIbans(!showSharedIbans)}
      >
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2 text-amber-700 dark:text-amber-400'>
            <AlertTriangle className='h-5 w-5' />
            {t.addressBook?.sharedIbans || 'Shared IBANs'}
            <span className='rounded-full bg-amber-200 px-2 py-0.5 text-xs font-normal dark:bg-amber-800'>
              {sharedIbans.length}
            </span>
            {showSharedIbans ? (
              <ChevronUp className='ml-1 h-4 w-4' />
            ) : (
              <ChevronDown className='ml-1 h-4 w-4' />
            )}
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={(e) => {
                    e.stopPropagation();
                    onDetectShared();
                  }}
                  disabled={isDetectPending}
                  className='text-muted-foreground hover:bg-muted hover:text-foreground'
                >
                  <RefreshCw
                    className={cn('h-4 w-4', isDetectPending && 'animate-spin')}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {t.addressBook?.rescanSharedIbans ||
                    'Rescan for shared IBANs'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {!showSharedIbans && (
          <CardDescription>
            {t.addressBook?.sharedIbansCollapsed ||
              'IBANs with multiple different names in transactions. Click to expand.'}
          </CardDescription>
        )}
        {showSharedIbans && (
          <CardDescription>
            {t.addressBook?.sharedIbansExpanded ||
              'IBANs with multiple different names in transactions (payment processors like Adyen, Mollie, etc.). These are not automatically added to the address book.'}
          </CardDescription>
        )}
      </CardHeader>
      {showSharedIbans && (
        <CardContent className='space-y-3'>
          <TooltipProvider>
            {isLoading ? (
              <div className='space-y-2'>
                <Skeleton className='h-16 w-full' />
                <Skeleton className='h-16 w-full' />
              </div>
            ) : (
              sharedIbans.map((shared) => (
                <div
                  key={shared.iban}
                  className='rounded-lg border bg-white p-3 transition-colors hover:bg-muted/50 dark:bg-card'
                >
                  <div className='flex items-start justify-between gap-2'>
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-2'>
                        <Building2 className='h-4 w-4 flex-shrink-0 text-amber-600' />
                        <span className='truncate text-sm'>{shared.iban}</span>
                        {shared.isKnownProvider && (
                          <span className='rounded-full bg-blue-100 px-2 py-0.5 text-xs whitespace-nowrap text-blue-700 dark:bg-blue-900 dark:text-blue-300'>
                            {shared.knownProviderName}
                          </span>
                        )}
                      </div>
                      <div className='mt-1 text-xs text-muted-foreground'>
                        {(
                          t.addressBook?.differentNames ||
                          '{count} different names:'
                        ).replace('{count}', String(shared.merchantCount))}
                      </div>
                      <div className='mt-1.5 flex flex-wrap gap-1.5'>
                        {(() => {
                          const names = shared.merchants.map((m) => m.name);
                          const similarGroups = findSimilarNameGroups(
                            names,
                            0.6,
                            cleanupRules
                          );

                          const indexToGroupColor: Record<number, string> = {};
                          similarGroups.forEach((group, groupIdx) => {
                            const color =
                              groupColors[groupIdx % groupColors.length];
                            group.forEach((idx) => {
                              indexToGroupColor[idx] = color;
                            });
                          });

                          return shared.merchants.map((m, idx) => {
                            const groupColor = indexToGroupColor[idx];
                            const isInSimilarGroup = groupColor !== undefined;

                            return (
                              <Tooltip key={idx}>
                                <TooltipTrigger asChild>
                                  <span
                                    className={cn(
                                      'max-w-[200px] cursor-default truncate rounded bg-muted px-2 py-0.5 text-xs',
                                      groupColor,
                                      isInSimilarGroup && 'mx-0.5'
                                    )}
                                  >
                                    {m.name}{' '}
                                    <span className='text-muted-foreground'>
                                      ({m.transactionCount})
                                    </span>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className='font-medium'>{m.name}</p>
                                  <p className='text-xs text-muted-foreground'>
                                    {m.transactionCount}{' '}
                                    {t.addressBook?.transactions ||
                                      'transactions'}
                                  </p>
                                  {isInSimilarGroup && (
                                    <p className='mt-1 text-xs text-purple-400'>
                                      ⚡{' '}
                                      {t.addressBook?.possiblySamePerson ||
                                        'Possibly the same person/organization'}
                                    </p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            );
                          });
                        })()}
                      </div>
                    </div>
                    <div className='flex flex-shrink-0 gap-1'>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8 rounded-md transition-colors hover:bg-purple-600 hover:text-white'
                        onClick={() => onEditShared(shared)}
                      >
                        <Edit2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TooltipProvider>
        </CardContent>
      )}
    </Card>
  );
};
