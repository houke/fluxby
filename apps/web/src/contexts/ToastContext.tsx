import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

import type {
  ToastVariant,
  ToastMessage,
  ToastContextType,
} from '@/contexts/toastTypes';

import {
  DEFAULT_SUCCESS_DURATION,
  DEFAULT_INFO_DURATION,
  variantStyles,
  variantTextColors,
  variantIconColors,
  sanitizeErrorMessage,
} from '@/contexts/toastUtils';

const ToastContext = createContext<ToastContextType | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Individual Toast Component
function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  const { bg, border, icon: Icon } = variantStyles[toast.variant];
  const textColor = variantTextColors[toast.variant];
  const iconColor = variantIconColors[toast.variant];

  return (
    <div
      className={cn(
        'pointer-events-auto flex max-w-[360px] items-start gap-3 rounded-md px-4 py-3 shadow-lg animate-in slide-in-from-top-2',
        bg,
        border
      )}
      role='alert'
      aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
    >
      <Icon className={cn('mt-0.5 h-5 w-5 flex-shrink-0', iconColor)} />
      <span className={cn('flex-1 break-words text-sm', textColor)}>
        {toast.message}
      </span>
      <button
        onClick={() => onDismiss(toast.id)}
        className='rounded-md p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800'
        aria-label='Dismiss notification'
      >
        <X className='h-4 w-4 text-gray-500' />
      </button>
    </div>
  );
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const addToast = useCallback(
    (
      message: string,
      variant: ToastVariant,
      autoDismiss: boolean,
      duration: number
    ) => {
      const id = crypto.randomUUID();
      const toast: ToastMessage = {
        id,
        message,
        variant,
        autoDismiss,
        duration,
      };

      setToasts((prev) => [...prev, toast]);

      // Set up auto-dismiss timer if enabled
      if (autoDismiss) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  const success = useCallback(
    (message: string, duration: number = DEFAULT_SUCCESS_DURATION) => {
      addToast(message, 'success', true, duration);
    },
    [addToast]
  );

  const info = useCallback(
    (message: string, duration: number = DEFAULT_INFO_DURATION) => {
      addToast(message, 'info', true, duration);
    },
    [addToast]
  );

  const warning = useCallback(
    (message: string) => {
      // Warnings do NOT auto-dismiss - require user interaction
      addToast(message, 'warning', false, 0);
    },
    [addToast]
  );

  const error = useCallback(
    (message: string | Error) => {
      // Errors do NOT auto-dismiss - require user interaction
      // Sanitize the message for end-users
      const sanitized = sanitizeErrorMessage(message);
      addToast(sanitized, 'error', false, 0);
    },
    [addToast]
  );

  const contextValue = useMemo(
    () => ({
      success,
      info,
      warning,
      error,
      dismiss,
      dismissAll,
    }),
    [success, info, warning, error, dismiss, dismissAll]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast Container - Fixed position in top-right */}
      {toasts.length > 0 && (
        <div
          className='pointer-events-none fixed right-4 top-4 z-[100] flex flex-col gap-2'
          aria-label='Notifications'
        >
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}
