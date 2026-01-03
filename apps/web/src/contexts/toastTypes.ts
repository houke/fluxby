export type ToastVariant = 'success' | 'info' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  message: string;
  variant: ToastVariant;
  autoDismiss: boolean;
  duration: number;
}

export interface ToastContextType {
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
