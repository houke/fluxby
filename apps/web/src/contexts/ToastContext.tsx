import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'success' | 'info' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  message: string;
  variant: ToastVariant;
  autoDismiss: boolean;
  duration: number;
}

interface ToastContextType {
  /**
   * Show a success toast (purple). Auto-dismisses after duration.
   * Use for: operations completed successfully
   */
  success: (message: string, duration?: number) => void;

  /**
   * Show an info toast (purple). Auto-dismisses after duration.
   * Use for: informational messages, status updates
   */
  info: (message: string, duration?: number) => void;

  /**
   * Show a warning toast (orange). Does NOT auto-dismiss.
   * Use for: important warnings that need attention
   */
  warning: (message: string) => void;

  /**
   * Show an error toast (red). Does NOT auto-dismiss.
   * Messages are sanitized for end-users (no stack traces).
   * Use for: errors, failures
   */
  error: (message: string | Error) => void;

  /**
   * Dismiss a toast by ID
   */
  dismiss: (id: string) => void;

  /**
   * Dismiss all toasts
   */
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const DEFAULT_SUCCESS_DURATION = 4000;
const DEFAULT_INFO_DURATION = 3000;

// Variant styling configuration
const variantStyles: Record<
  ToastVariant,
  { bg: string; border: string; icon: typeof CheckCircle }
> = {
  success: {
    bg: 'bg-white dark:bg-gray-900',
    border: 'border-l-4 border-green-500',
    icon: CheckCircle,
  },
  info: {
    bg: 'bg-white dark:bg-gray-900',
    border: 'border-l-4 border-purple-500',
    icon: Info,
  },
  warning: {
    bg: 'bg-white dark:bg-gray-900',
    border: 'border-l-4 border-orange-500',
    icon: AlertTriangle,
  },
  error: {
    bg: 'bg-white dark:bg-gray-900',
    border: 'border-l-4 border-red-500',
    icon: AlertCircle,
  },
};

const variantTextColors: Record<ToastVariant, string> = {
  success: 'text-green-900 dark:text-green-100',
  info: 'text-purple-900 dark:text-purple-100',
  warning: 'text-orange-900 dark:text-orange-100',
  error: 'text-red-900 dark:text-red-100',
};

const variantIconColors: Record<ToastVariant, string> = {
  success: 'text-green-500',
  info: 'text-purple-500',
  warning: 'text-orange-500',
  error: 'text-red-500',
};

/**
 * Sanitize error messages for end-users.
 * Removes stack traces, technical details, and limits length.
 */
function sanitizeErrorMessage(error: string | Error): string {
  let message: string;

  if (error instanceof Error) {
    message = error.message;
  } else {
    message = String(error);
  }

  // Remove stack traces
  message = message.split('\n')[0];

  // Remove common technical prefixes
  message = message
    .replace(/^Error:\s*/i, '')
    .replace(/^TypeError:\s*/i, '')
    .replace(/^SyntaxError:\s*/i, '')
    .replace(/^ReferenceError:\s*/i, '')
    .replace(/^NetworkError:\s*/i, '')
    .replace(/^SQLITE_ERROR:\s*/i, '');

  // Remove file paths and line numbers
  message = message.replace(/\s+at\s+.+$/g, '');
  message = message.replace(/\(.+:\d+:\d+\)/g, '');

  // Limit length
  if (message.length > 200) {
    message = message.substring(0, 197) + '...';
  }

  // Default fallback for empty messages
  if (!message.trim()) {
    message = 'An unexpected error occurred';
  }

  return message;
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
