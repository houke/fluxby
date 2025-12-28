import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  onError?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call the onError callback to close onboarding, etc.
    if (this.props.onError) {
      this.props.onError();
    }
  }

  private handleGoHome = () => {
    // Reset error state and navigate to home
    this.setState({ hasError: false, error: undefined });
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className='flex min-h-screen items-center justify-center bg-background'>
          <div className='mx-4 w-full max-w-md rounded-lg border bg-card p-8 shadow-lg'>
            <div className='flex flex-col items-center text-center'>
              {/* Icon */}
              <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30'>
                <AlertTriangle className='h-8 w-8 text-orange-600 dark:text-orange-400' />
              </div>

              {/* Title */}
              <h2 className='mb-2 text-xl font-semibold'>
                Oeps, er ging iets mis
              </h2>

              {/* Description */}
              <p className='mb-6 text-muted-foreground'>
                Er is een onverwachte fout opgetreden. Probeer het opnieuw of ga
                terug naar het dashboard.
              </p>

              {/* Error details (collapsible in dev) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className='mb-6 w-full rounded border bg-muted/50 p-3 text-left'>
                  <summary className='cursor-pointer text-sm font-medium'>
                    Technische details
                  </summary>
                  <pre className='mt-2 overflow-auto text-xs text-destructive'>
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}

              {/* Buttons */}
              <div className='flex w-full flex-col gap-3'>
                <button
                  onClick={this.handleGoHome}
                  className='flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-3 font-medium text-white transition-colors hover:bg-purple-700'
                >
                  <Home className='h-4 w-4' />
                  Naar dashboard
                </button>
                <button
                  onClick={this.handleReload}
                  className='flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                >
                  <RefreshCw className='h-4 w-4' />
                  Pagina herladen
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
