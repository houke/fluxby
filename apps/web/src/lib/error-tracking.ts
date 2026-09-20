import * as Sentry from '@sentry/react';
import { debugLog } from './debug';

/**
 * Initialize Sentry error tracking with privacy-conscious settings.
 *
 * Only active in production with VITE_SENTRY_DSN env var set.
 * All PII is stripped, no session replay, minimal breadcrumbs.
 */
export function initErrorTracking(): void {
  // Only initialize in production
  if (import.meta.env.DEV) {
    debugLog('[Sentry] Disabled in development');
    return;
  }

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    debugLog('[Sentry] DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: `fluxby@${import.meta.env.VITE_APP_VERSION || 'dev'}`,

    // Privacy settings - strip all PII
    beforeSend(event) {
      if (event.user) {
        delete event.user.ip_address;
        delete event.user.email;
        delete event.user.username;
      }
      return event;
    },

    // Filter breadcrumbs to avoid capturing sensitive data
    beforeBreadcrumb(breadcrumb) {
      // Redact response/request bodies from network breadcrumbs
      if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') {
        if (breadcrumb.data) {
          delete breadcrumb.data.response;
          delete breadcrumb.data.body;
        }
      }
      return breadcrumb;
    },

    // Offline support - queue errors when offline
    transport: Sentry.makeBrowserOfflineTransport(Sentry.makeFetchTransport),

    // Performance monitoring at low sample rate
    tracesSampleRate: 0.1,

    // Session replay disabled for privacy (could capture financial data)
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,

    // Ignore non-critical/noisy errors
    ignoreErrors: [
      'ResizeObserver loop',
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection',
      'Network request failed',
      'Load failed',
      'Failed to fetch',
      // Safari-specific
      'The operation was aborted',
      // Extension interference
      'chrome-extension://',
      'moz-extension://',
    ],

    // Don't capture too much context
    maxBreadcrumbs: 20,
  });

  debugLog('[Sentry] Initialized');
}

/**
 * Capture an error with optional context.
 * In development, logs to console instead of sending to Sentry.
 */
export function captureError(
  error: Error,
  context?: Record<string, unknown>
): void {
  if (import.meta.env.DEV) {
    console.error('[Dev Error]', error, context);
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(error);
  });
}

/**
 * Set up global handlers for unhandled errors and rejections.
 * Sentry already handles these by default, but this provides explicit control.
 */
export function setupGlobalErrorHandlers(): void {
  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error =
      event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));

    captureError(error, { type: 'unhandledrejection' });
  });

  // Capture uncaught errors (fallback for errors outside React tree)
  window.addEventListener('error', (event) => {
    if (event.error) {
      captureError(event.error, { type: 'uncaughtError' });
    }
  });
}

// Re-export Sentry's ErrorBoundary for convenience
export const SentryErrorBoundary = Sentry.ErrorBoundary;
