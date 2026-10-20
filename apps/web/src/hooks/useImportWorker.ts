/**
 * useImportWorker Hook
 *
 * Manages the import Web Worker lifecycle and provides a clean API
 * for CSV parsing with progress updates.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  WorkerMessage,
  WorkerResponse,
  ParseRequest,
  ColumnMapping,
  PreviewResult,
  ParseResult,
  PreparedImportResult,
} from '../workers/import-worker';
import type { ImportOptions } from '../lib/importers/import-options';

export interface UseImportWorkerState {
  isProcessing: boolean;
  progress: number;
  stage: string;
  error: string | null;
}

export interface UseImportWorkerReturn extends UseImportWorkerState {
  parseCSV: (
    csvContent: string,
    options?: ImportOptions
  ) => Promise<PreviewResult>;
  prepareCSV: (
    csvContent: string,
    mapping: ColumnMapping,
    options: ImportOptions
  ) => Promise<PreparedImportResult>;
  parseWithMapping: (
    csvContent: string,
    mapping: ColumnMapping,
    bank?: string
  ) => Promise<ParseResult>;
  abort: () => void;
  reset: () => void;
}

/**
 * Hook for managing CSV import with Web Worker
 *
 * @example
 * ```tsx
 * const { parseCSV, parseWithMapping, progress, isProcessing, error } = useImportWorker();
 *
 * // Get preview (headers and sample rows)
 * const preview = await parseCSV(fileContent);
 *
 * // Parse with mapping
 * const result = await parseWithMapping(fileContent, mapping, 'ing');
 * ```
 */
export function useImportWorker(messages: {
  unknownError: string;
  error: string;
  importCancelled: string;
}): UseImportWorkerReturn {
  const [state, setState] = useState<UseImportWorkerState>({
    isProcessing: false,
    progress: 0,
    stage: '',
    error: null,
  });

  const workerRef = useRef<Worker | null>(null);
  const resolveRef = useRef<((value: unknown) => void) | null>(null);
  const rejectRef = useRef<((reason: unknown) => void) | null>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const stopWorker = useCallback((reason?: unknown) => {
    const worker = workerRef.current;
    workerRef.current = null;
    if (worker) {
      worker.onmessage = null;
      worker.onerror = null;
      worker.terminate();
    }
    const reject = rejectRef.current;
    resolveRef.current = null;
    rejectRef.current = null;
    reject?.(reason ?? new Error(messagesRef.current.importCancelled));
  }, []);

  // Clean up worker on unmount
  useEffect(() => {
    return () => stopWorker();
  }, [stopWorker]);

  /**
   * Get or create the worker instance
   */
  const getWorker = useCallback(() => {
    if (!workerRef.current) {
      const worker = new Worker(
        new URL('../workers/import-worker.ts', import.meta.url),
        { type: 'module' }
      );
      workerRef.current = worker;

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        if (workerRef.current !== worker || !resolveRef.current) return;
        const { type, progress, stage, data, error } = event.data;

        switch (type) {
          case 'progress':
            setState((prev) => ({
              ...prev,
              progress: progress ?? prev.progress,
              stage: stage ?? prev.stage,
            }));
            break;

          case 'preview':
          case 'prepared':
          case 'result': {
            const resolve = resolveRef.current;
            resolveRef.current = null;
            rejectRef.current = null;
            setState((prev) => ({
              ...prev,
              isProcessing: false,
              progress: 100,
              stage: '',
            }));
            resolve(data);
            break;
          }

          case 'error': {
            const message = error || messagesRef.current.unknownError;
            stopWorker(new Error(message));
            setState((prev) => ({
              ...prev,
              isProcessing: false,
              error: message,
            }));
            break;
          }
        }
      };

      worker.onerror = (error) => {
        if (workerRef.current !== worker || !rejectRef.current) return;
        const message = error.message || messagesRef.current.error;
        stopWorker(new Error(message));
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: message,
        }));
      };
    }

    return workerRef.current;
  }, [stopWorker]);

  const startParse = useCallback(
    <T>(payload: ParseRequest): Promise<T> => {
      // A synchronous parse cannot process an abort message until it finishes.
      // Retire its worker before replacing the pending request callbacks.
      if (rejectRef.current) stopWorker();

      return new Promise<T>((resolve, reject) => {
        resolveRef.current = resolve as (value: unknown) => void;
        rejectRef.current = reject;
        setState({
          isProcessing: true,
          progress: 0,
          stage: '',
          error: null,
        });

        try {
          const message: WorkerMessage = { type: 'parse', payload };
          getWorker().postMessage(message);
        } catch (error) {
          stopWorker(error);
          setState((prev) => ({
            ...prev,
            isProcessing: false,
            error:
              error instanceof Error
                ? error.message
                : messagesRef.current.unknownError,
          }));
        }
      });
    },
    [getWorker, stopWorker]
  );

  /**
   * Parse CSV and return preview (headers + sample rows)
   */
  const parseCSV = useCallback(
    (csvContent: string, options?: ImportOptions) =>
      startParse<PreviewResult>({
        csvContent,
        ...(options ? { options } : {}),
      }),
    [startParse]
  );

  const prepareCSV = useCallback(
    (csvContent: string, mapping: ColumnMapping, options: ImportOptions) =>
      startParse<PreparedImportResult>({
        csvContent,
        mapping,
        options,
        prepare: true,
      }),
    [startParse]
  );

  /**
   * Parse CSV with column mapping for full validation
   */
  const parseWithMapping = useCallback(
    (csvContent: string, mapping: ColumnMapping, bank?: string) =>
      startParse<ParseResult>({ csvContent, mapping, bank }),
    [startParse]
  );

  /**
   * Abort current parsing operation
   */
  const abort = useCallback(() => {
    if (workerRef.current) {
      stopWorker();
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        error: messages.importCancelled,
      }));
    }
  }, [messages.importCancelled, stopWorker]);

  /**
   * Reset state for new import
   */
  const reset = useCallback(() => {
    stopWorker();
    setState({
      isProcessing: false,
      progress: 0,
      stage: '',
      error: null,
    });
  }, [stopWorker]);

  return {
    ...state,
    parseCSV,
    prepareCSV,
    parseWithMapping,
    abort,
    reset,
  };
}

// Re-export types for convenience
export type {
  ColumnMapping,
  PreviewResult,
  ParseResult,
  PreparedImportResult,
  ParsedRow,
} from '../workers/import-worker';
