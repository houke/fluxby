import { useEffect, useState } from 'react';
import { X, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const [isVisible, setIsVisible] = useState(true);

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

  // Animate out when expired
  useEffect(() => {
    if (timeRemainingMs <= 0) {
      setIsVisible(false);
    }
  }, [timeRemainingMs]);

  if (!isVisible || timeRemainingMs <= 0) return null;

  return (
    <div
      data-testid='undo-toast'
      className={cn(
        'fixed bottom-4 left-1/2 z-50 -translate-x-1/2',
        'flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg',
        'border backdrop-blur-sm transition-all duration-300 ease-out',
        // Base styles
        urgency === 'normal' && [
          'border-gray-700 bg-gray-900/95 text-white',
          'dark:border-gray-300 dark:bg-gray-100/95 dark:text-gray-900',
        ],
        // Warning styles (≤60s)
        urgency === 'warning' && [
          'border-orange-500 bg-orange-600/95 text-white',
        ],
        // Critical styles (≤30s) with pulse
        urgency === 'critical' && [
          'animate-pulse border-red-500 bg-red-600/95 text-white',
        ]
      )}
    >
      {/* Message */}
      <span className='text-sm font-medium'>
        {(t.bulkDelete?.undoToast || '{count} transacties verwijderd').replace(
          '{count}',
          String(deletedCount)
        )}
      </span>

      {/* Countdown timer */}
      <span
        className={cn(
          'min-w-[48px] rounded-md px-2 py-1 text-center font-mono text-xs',
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
          'h-8 gap-1.5',
          urgency === 'normal' && 'hover:bg-white/10',
          urgency === 'warning' && 'hover:bg-white/20',
          urgency === 'critical' && 'hover:bg-white/20'
        )}
      >
        {isUndoing ? (
          <Loader2 className='h-4 w-4 animate-spin' />
        ) : (
          <RotateCcw className='h-4 w-4' />
        )}
        {t.bulkDelete?.undo || 'Ongedaan maken'}
      </Button>

      {/* Dismiss button */}
      <Button
        size='sm'
        variant='ghost'
        onClick={onDismiss}
        disabled={isUndoing}
        className={cn(
          'h-8 w-8 p-0',
          urgency === 'normal' && 'hover:bg-white/10',
          urgency === 'warning' && 'hover:bg-white/20',
          urgency === 'critical' && 'hover:bg-white/20'
        )}
        aria-label={t.common?.close || 'Sluiten'}
      >
        <X className='h-4 w-4' />
      </Button>
    </div>
  );
}
