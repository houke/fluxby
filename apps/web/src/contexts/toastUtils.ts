import { CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { ToastVariant } from '@/contexts/toastTypes';

export const DEFAULT_SUCCESS_DURATION = 4000;
export const DEFAULT_INFO_DURATION = 3000;

// Variant styling configuration
export const variantStyles: Record<
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

export const variantTextColors: Record<ToastVariant, string> = {
  success: 'text-green-900 dark:text-green-100',
  info: 'text-purple-900 dark:text-purple-100',
  warning: 'text-orange-900 dark:text-orange-100',
  error: 'text-red-900 dark:text-red-100',
};

export const variantIconColors: Record<ToastVariant, string> = {
  success: 'text-green-500',
  info: 'text-purple-500',
  warning: 'text-orange-500',
  error: 'text-red-500',
};

/**
 * Sanitize error messages for end-users.
 * Removes stack traces, technical details, and limits length.
 */
export function sanitizeErrorMessage(error: string | Error): string {
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
