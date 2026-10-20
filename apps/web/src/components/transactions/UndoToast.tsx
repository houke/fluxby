import { X, RotateCcw, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface UndoToastProps {
  timeRemainingMs: number;
  deletedCount: number;
  onUndo: () => Promise<void>;
  onDismiss: () => void;
  isUndoing?: boolean;
}

/**
 * Undo toast for bulk delete operations with countdown timer.
 * Changes color based on remaining time:
 * - neutral (>60s)
 * - orange (≤60s)
 * - red with pulse (≤30s)
 */
export function UndoToast({
  timeRemainingMs,
  deletedCount,
  onUndo,
  onDismiss,
  isUndoing = false,
}: UndoToastProps) {
  const { t } = useLanguage();

  // Format time as mm:ss
  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Determine urgency level for styling
  const getUrgencyLevel = (): 'normal' | 'warning' | 'critical' => {
    const secondsRemaining = Math.ceil(timeRemainingMs / 1000);
    if (secondsRemaining <= 30) return 'critical';
    if (secondsRemaining <= 60) return 'warning';
    return 'normal';
  };

  const urgency = getUrgencyLevel();

  // Don't render if expired
  if (timeRemainingMs <= 0) return null;

  return createPortal(
    <div
      data-testid='undo-toast'
      role='status'
      aria-live='polite'
      aria-atomic='true'
      className={cn(
        'fixed right-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] left-3 z-40 max-w-3xl md:right-auto md:bottom-4 md:left-1/2 md:-translate-x-1/2',
        'flex flex-wrap items-center gap-3 rounded-lg px-4 py-3 shadow-lg sm:flex-nowrap',
        'border backdrop-blur-sm transition-all duration-300 ease-out motion-reduce:transition-none',
        // Base styles
        urgency === 'normal' && [
          'border-gray-700 bg-gray-900/95 text-white',
          'dark:border-gray-300 dark:bg-gray-100/95 dark:text-gray-900',
        ],
        // Warning styles (≤60s)
        urgency === 'warning' && [
          'border-orange-500 bg-orange-700/95 text-white',
        ],
        // Critical styles (≤30s) with pulse
        urgency === 'critical' && [
          'animate-pulse border-red-500 bg-red-700/95 text-white motion-reduce:animate-none',
        ]
      )}
    >
      {/* Message */}
      <span className='w-full min-w-0 text-sm font-medium break-words sm:w-auto sm:flex-1'>
        {t.bulkDelete.undoToast.replace('{count}', String(deletedCount))}
      </span>

      {/* Countdown timer */}
      <span
        className={cn(
          'min-w-[48px] shrink-0 rounded-md px-2 py-1 text-center font-mono text-xs',
          urgency === 'normal' && 'bg-white/10 dark:bg-black/10',
          urgency === 'warning' && 'bg-white/20',
          urgency === 'critical' && 'bg-white/20 font-bold'
        )}
      >
        {formatTime(timeRemainingMs)}
      </span>

      {/* Undo button */}
      <Button
        size='sm'
        variant='ghost'
        onClick={onUndo}
        disabled={isUndoing}
        className={cn(
          'h-8 shrink-0 gap-1.5 text-inherit hover:text-inherit',
          urgency === 'normal' && 'hover:bg-white/10',
          urgency === 'warning' && 'hover:bg-white/20',
          urgency === 'critical' && 'hover:bg-white/20'
        )}
      >
        {isUndoing ? (
          <Loader2 className='h-4 w-4 animate-spin' aria-hidden='true' />
        ) : (
          <RotateCcw className='h-4 w-4' aria-hidden='true' />
        )}
        {t.bulkDelete.undo}
      </Button>

      {/* Dismiss button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size='icon'
              variant='ghost'
              onClick={onDismiss}
              disabled={isUndoing}
              className={cn(
                'ml-auto h-8 w-8 shrink-0 rounded-md p-0 text-inherit hover:text-inherit',
                urgency === 'normal' && 'hover:bg-white/10',
                urgency === 'warning' && 'hover:bg-white/20',
                urgency === 'critical' && 'hover:bg-white/20'
              )}
              aria-label={t.common.close}
            >
              <X className='h-4 w-4' aria-hidden='true' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t.common.close}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>,
    document.body
  );
}
