import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { FluxbyWebGL } from '@fluxby/shared';
import { cn } from '@/lib/utils';
import { useLanguage } from './LanguageContext';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
}

interface ConfirmContextType {
  /**
   * Show a confirmation modal that returns a promise.
   * Resolves to true if confirmed, false if cancelled.
   * @example
   * const isConfirmed = await confirm({
   *   title: 'Delete item?',
   *   message: 'This action cannot be undone.',
   *   variant: 'danger'
   * });
   * if (isConfirmed) { // perform action }
   */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

interface ConfirmState {
  isOpen: boolean;
  options: ConfirmOptions;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    options: { title: '', message: '' },
  });
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({
        isOpen: true,
        options,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    }
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleCancel = useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      } else if (e.key === 'Enter') {
        handleConfirm();
      }
    },
    [handleCancel, handleConfirm]
  );

  const { options } = state;
  const isDanger = options.variant === 'danger';

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {/* Confirm Modal Overlay */}
      {state.isOpen && (
        <div
          className='fixed inset-0 z-[100] flex items-center justify-center'
          onKeyDown={handleKeyDown}
          role='dialog'
          aria-modal='true'
          aria-labelledby='confirm-title'
          aria-describedby='confirm-message'
        >
          {/* Backdrop with blur */}
          <div
            className='absolute inset-0 bg-black/40 backdrop-blur-sm duration-200 animate-in fade-in'
            onClick={handleCancel}
          />

          {/* Modal Card */}
          <div className='relative z-10 mx-4 w-full max-w-md duration-200 animate-in fade-in zoom-in-95'>
            <div className='overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900'>
              {/* Header with Avatar */}
              <div className='flex flex-col items-center px-6 pb-6 pt-6'>
                {/* Fluxby Avatar */}
                <div className='relative'>
                  <FluxbyWebGL size={75} animated aria-hidden />
                </div>

                {/* Title */}
                <h2
                  id='confirm-title'
                  className='text-center text-xl font-semibold text-gray-900 dark:text-white'
                >
                  {options.title}
                </h2>

                {/* Message */}
                <p
                  id='confirm-message'
                  className='text-center leading-relaxed text-gray-600 dark:text-gray-300'
                >
                  {options.message}
                </p>
              </div>

              {/* Actions */}
              <div className='flex gap-3 border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50'>
                {/* Cancel Button (Ghost/Secondary) */}
                <button
                  type='button'
                  onClick={handleCancel}
                  className='flex-1 rounded-lg border-0 px-4 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-purple-600 focus:outline-none focus:ring-0 focus-visible:ring-0 dark:text-gray-300 dark:hover:bg-purple-900/10'
                  autoFocus={isDanger}
                >
                  {options.cancelLabel || t.common.cancel}
                </button>

                {/* Confirm Button (Primary/Danger) */}
                <button
                  type='button'
                  onClick={handleConfirm}
                  className={cn(
                    'flex-1 rounded-lg px-4 py-2.5 font-medium text-white transition-colors focus:outline-none focus:ring-2',
                    isDanger
                      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                      : 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
                  )}
                  autoFocus={!isDanger}
                >
                  {options.confirmLabel || t.common.confirm}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
