import { useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Toast types for the legacy Toast component.
 * For new code, prefer using the useToast() hook from ToastContext.
 *
 * Behavior by type:
 * - success/info (Purple): Auto-dismiss (3-5s), manual dismiss allowed
 * - warning (Orange): NO auto-dismiss, requires user interaction
 * - error (Red): NO auto-dismiss, clean user-friendly messages
 */
export type ToastType = 'success' | 'warning' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  /** @deprecated Auto-dismiss is now controlled by type. success/info auto-dismiss, warning/error do not. */
  autoDismiss?: boolean;
  duration?: number;
}

const toastStyles: Record<ToastType, string> = {
  success:
    'border-green-500 text-green-900 dark:text-green-100 bg-white dark:bg-gray-900',
  warning:
    'border-orange-500 text-orange-900 dark:text-orange-100 bg-white dark:bg-gray-900',
  error:
    'border-red-500 text-red-900 dark:text-red-100 bg-white dark:bg-gray-900',
  info: 'border-purple-500 text-purple-900 dark:text-purple-100 bg-white dark:bg-gray-900',
};

const toastIcons: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
};

const iconColors: Record<ToastType, string> = {
  success: 'text-green-500',
  warning: 'text-orange-500',
  error: 'text-red-500',
  info: 'text-purple-500',
};

/**
 * Legacy Toast component for backwards compatibility.
 * For new code, prefer using the useToast() hook from ToastContext:
 *
 * ```tsx
 * const toast = useToast();
 * toast.success('Operation completed');
 * toast.warning('This action cannot be undone');
 * toast.error('Failed to save');
 * ```
 */
export function Toast({
  message,
  type = 'success',
  onClose,
  autoDismiss,
  duration = 4000,
}: ToastProps) {
  useEffect(() => {
    // Warning and error toasts NEVER auto-dismiss - they require user interaction
    // Success and info auto-dismiss after duration
    const shouldAutoDismiss =
      autoDismiss !== false && type !== 'warning' && type !== 'error';

    if (!shouldAutoDismiss) return;

    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, type, autoDismiss, duration]);

  const Icon = toastIcons[type];

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-[100] flex max-w-[360px] items-start gap-3 rounded-md border-l-4 px-4 py-3 break-words shadow-lg animate-in slide-in-from-top-2',
        toastStyles[type]
      )}
      role='alert'
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <Icon className={cn('mt-0.5 h-5 w-5 flex-shrink-0', iconColors[type])} />
      <span className='flex-1'>{message}</span>
      <button
        onClick={onClose}
        className='rounded-md p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800'
        aria-label='Dismiss notification'
      >
        <X className='h-4 w-4 text-gray-500' />
      </button>
    </div>
  );
}
