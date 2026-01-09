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
  ColumnMapping,
  PreviewResult,
  ParseResult,
} from '../workers/import-worker';

export interface UseImportWorkerState {
  isProcessing: boolean;
  progress: number;
  stage: string;
  error: string | null;
}

export interface UseImportWorkerReturn extends UseImportWorkerState {
  parseCSV: (csvContent: string) => Promise<PreviewResult>;
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
export function useImportWorker(): UseImportWorkerReturn {
  const [state, setState] = useState<UseImportWorkerState>({
    isProcessing: false,
    progress: 0,
    stage: '',
    error: null,
  });

  const workerRef = useRef<Worker | null>(null);
  const resolveRef = useRef<((value: unknown) => void) | null>(null);
  const rejectRef = useRef<((reason: unknown) => void) | null>(null);

  // Clean up worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  /**
   * Get or create the worker instance
   */
  const getWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('../workers/import-worker.ts', import.meta.url),
        { type: 'module' }
      );

      workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
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
          case 'result':
            setState((prev) => ({
              ...prev,
              isProcessing: false,
              progress: 100,
              stage: 'Complete',
            }));
            resolveRef.current?.(data);
            break;

          case 'error':
            setState((prev) => ({
              ...prev,
              isProcessing: false,
              error: error ?? 'Unknown error',
            }));
            rejectRef.current?.(new Error(error ?? 'Unknown error'));
            break;
        }
      };

      workerRef.current.onerror = (error) => {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: error.message || 'Worker error',
        }));
        rejectRef.current?.(error);
      };
    }

    return workerRef.current;
  }, []);

  /**
   * Parse CSV and return preview (headers + sample rows)
   */
  const parseCSV = useCallback(
    async (csvContent: string): Promise<PreviewResult> => {
      return new Promise((resolve, reject) => {
        resolveRef.current = resolve as (value: unknown) => void;
        rejectRef.current = reject;

        setState({
          isProcessing: true,
          progress: 0,
          stage: 'Starting...',
          error: null,
        });

        const worker = getWorker();
        const message: WorkerMessage = {
          type: 'parse',
          payload: { csvContent },
        };

        worker.postMessage(message);
      });
    },
    [getWorker]
  );

  /**
   * Parse CSV with column mapping for full validation
   */
  const parseWithMapping = useCallback(
    async (
      csvContent: string,
      mapping: ColumnMapping,
      bank?: string
    ): Promise<ParseResult> => {
      return new Promise((resolve, reject) => {
        resolveRef.current = resolve as (value: unknown) => void;
        rejectRef.current = reject;

        setState({
          isProcessing: true,
          progress: 0,
          stage: 'Starting...',
          error: null,
        });

        const worker = getWorker();
        const message: WorkerMessage = {
          type: 'parse',
          payload: { csvContent, mapping, bank },
        };

        worker.postMessage(message);
      });
    },
    [getWorker]
  );

  /**
   * Abort current parsing operation
   */
  const abort = useCallback(() => {
    if (workerRef.current) {
      const message: WorkerMessage = { type: 'abort' };
      workerRef.current.postMessage(message);

      setState((prev) => ({
        ...prev,
        isProcessing: false,
        error: 'Aborted',
      }));

      rejectRef.current?.(new Error('Aborted'));
    }
  }, []);

  /**
   * Reset state for new import
   */
  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      progress: 0,
      stage: '',
      error: null,
    });
  }, []);

  return {
    ...state,
    parseCSV,
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
  ParsedRow,
} from '../workers/import-worker';
