import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  autoDismiss?: boolean;
  duration?: number;
}

const toastStyles: Record<ToastType, string> = {
  success:
    'border-green-500 text-green-900 dark:text-green-100 bg-white dark:bg-gray-900',
  warning:
    'border-yellow-500 text-yellow-900 dark:text-yellow-100 bg-white dark:bg-gray-900',
  error:
    'border-red-500 text-red-900 dark:text-red-100 bg-white dark:bg-gray-900',
  info: 'border-purple-500 text-purple-900 dark:text-purple-100 bg-white dark:bg-gray-900',
};

export function Toast({
  message,
  type = 'success',
  onClose,
  autoDismiss = true,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    // Warning and error toasts should not auto-dismiss unless explicitly requested
    if (!autoDismiss || type === 'warning' || type === 'error') return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, type, autoDismiss, duration]);

  return (
    <div
      className={cn(
        'fixed right-4 top-4 z-50 flex max-w-[320px] items-center gap-2 break-words rounded-md border-l-4 px-4 py-3 shadow-lg animate-in slide-in-from-top-2',
        toastStyles[type]
      )}
    >
      <span className='flex-1'>{message}</span>
      <button
        onClick={onClose}
        className='ml-2 rounded-md p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800'
      >
        <X className='h-4 w-4' />
      </button>
    </div>
  );
}
