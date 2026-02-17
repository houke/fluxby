import { useState, useCallback, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfile } from '@/contexts/ProfileContext';
import { api } from '@/lib/api';

import type { Transaction } from '@fluxby/shared';

export interface UndoPayload {
  transactionIds: string[];
  accountBalances: Record<string, number>;
  expiresAt: number;
  deletedAt: number;
}

interface BulkDeleteResult {
  deletedCount: number;
  affectedAccountIds: string[];
}

const UNDO_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const UNDO_STORAGE_KEY = 'fluxby.bulkDeleteUndo';

/**
 * Helper to store undo payload in localStorage
 * For >500 transactions, we only store the IDs and rely on soft-delete for restore
 */
function storeUndoPayload(payload: UndoPayload): void {
  try {
    localStorage.setItem(UNDO_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    // If localStorage is full (unlikely for IDs), just log and continue
    console.warn('Failed to store undo payload:', error);
  }
}

/**
 * Helper to retrieve and validate undo payload from localStorage
 */
function getUndoPayload(): UndoPayload | null {
  try {
    const stored = localStorage.getItem(UNDO_STORAGE_KEY);
    if (!stored) return null;

    const payload = JSON.parse(stored) as UndoPayload;

    // Check if expired
    if (Date.now() > payload.expiresAt) {
      localStorage.removeItem(UNDO_STORAGE_KEY);
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Helper to clear undo payload from localStorage
 */
function clearUndoPayload(): void {
  localStorage.removeItem(UNDO_STORAGE_KEY);
}

export interface UseBulkDeleteOptions {
  onSuccess?: (result: BulkDeleteResult) => void;
  onError?: (error: Error) => void;
  onUndoSuccess?: () => void;
  onUndoExpired?: () => void;
}

export interface UseBulkDeleteReturn {
  // Delete operations
  deleteByIds: (transactionIds: string[]) => Promise<BulkDeleteResult>;
  deleteByDateRange: (
    startDate: string,
    endDate: string,
    accountId?: string
  ) => Promise<BulkDeleteResult>;
  previewDateRangeCount: (
    startDate: string,
    endDate: string,
    accountId?: string
  ) => Promise<number>;

  // Undo operations
  canUndo: boolean;
  undoPayload: UndoPayload | null;
  undo: () => Promise<void>;
  clearUndo: () => void;
  timeRemainingMs: number;

  // Loading states
  isDeleting: boolean;
  isUndoing: boolean;
}

/**
 * Hook for managing bulk transaction deletion with undo capability.
 *
 * Features:
 * - Delete transactions by IDs or date range
 * - 5-minute undo window with localStorage persistence
 * - Automatic balance recalculation
 * - Query cache invalidation
 */
export function useBulkDelete(
  options?: UseBulkDeleteOptions
): UseBulkDeleteReturn {
  const { activeProfileId: _activeProfileId } = useProfile();
  const queryClient = useQueryClient();

  const [undoPayload, setUndoPayload] = useState<UndoPayload | null>(() =>
    getUndoPayload()
  );
  const [timeRemainingMs, setTimeRemainingMs] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update countdown timer
  useEffect(() => {
    if (!undoPayload) {
      setTimeRemainingMs(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const updateTime = () => {
      const remaining = undoPayload.expiresAt - Date.now();
      if (remaining <= 0) {
        setTimeRemainingMs(0);
        setUndoPayload(null);
        clearUndoPayload();
        options?.onUndoExpired?.();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        setTimeRemainingMs(remaining);
      }
    };

    updateTime();
    intervalRef.current = setInterval(updateTime, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [undoPayload, options]);

  // Invalidate all related queries after bulk operations
  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
    queryClient.invalidateQueries({ queryKey: ['budgets'] });
    queryClient.invalidateQueries({ queryKey: ['recentTransactions'] });
  }, [queryClient]);

  // Delete by IDs mutation
  const deleteByIdsMutation = useMutation<
    BulkDeleteResult,
    Error,
    { transactionIds: string[]; transactions: Transaction[] }
  >({
    mutationFn: async ({ transactionIds }) => {
      return api.deleteTransactionsByIds(transactionIds);
    },
    onSuccess: (result, { transactionIds }) => {
      // Store undo payload
      const payload: UndoPayload = {
        transactionIds,
        accountBalances: {}, // We don't need to store balances as they're recalculated
        expiresAt: Date.now() + UNDO_TIMEOUT_MS,
        deletedAt: Date.now(),
      };
      storeUndoPayload(payload);
      setUndoPayload(payload);

      invalidateQueries();
      options?.onSuccess?.(result);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });

  // Delete by date range mutation
  const deleteByDateRangeMutation = useMutation<
    BulkDeleteResult,
    Error,
    { startDate: string; endDate: string; accountId?: string }
  >({
    mutationFn: async ({ startDate, endDate, accountId }) => {
      return api.deleteTransactionsByDateRange(startDate, endDate, {
        accountId,
      });
    },
    onSuccess: (result) => {
      // For date range deletion, we don't have individual IDs to store
      // The undo would re-query and restore by date range
      invalidateQueries();
      options?.onSuccess?.(result);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });

  // Undo mutation
  const undoMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!undoPayload) throw new Error('No undo payload available');

      // Restore deleted transactions by updating is_deleted back to 0
      await api.restoreTransactions(undoPayload.transactionIds);
    },
    onSuccess: () => {
      clearUndoPayload();
      setUndoPayload(null);
      invalidateQueries();
      options?.onUndoSuccess?.();
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });

  // Delete by IDs wrapper
  const deleteByIds = useCallback(
    async (transactionIds: string[], transactions?: Transaction[]) => {
      return deleteByIdsMutation.mutateAsync({
        transactionIds,
        transactions: transactions || [],
      });
    },
    [deleteByIdsMutation]
  );

  // Delete by date range wrapper
  const deleteByDateRange = useCallback(
    async (startDate: string, endDate: string, accountId?: string) => {
      return deleteByDateRangeMutation.mutateAsync({
        startDate,
        endDate,
        accountId,
      });
    },
    [deleteByDateRangeMutation]
  );

  // Preview count for date range (dry-run)
  const previewDateRangeCount = useCallback(
    async (startDate: string, endDate: string, accountId?: string) => {
      const result = await api.deleteTransactionsByDateRange(
        startDate,
        endDate,
        { accountId, dryRun: true }
      );
      return result.deletedCount;
    },
    []
  );

  // Undo wrapper
  const undo = useCallback(async () => {
    return undoMutation.mutateAsync();
  }, [undoMutation]);

  // Clear undo (dismiss)
  const clearUndo = useCallback(() => {
    clearUndoPayload();
    setUndoPayload(null);
  }, []);

  return {
    deleteByIds,
    deleteByDateRange,
    previewDateRangeCount,
    canUndo: !!undoPayload && timeRemainingMs > 0,
    undoPayload,
    undo,
    clearUndo,
    timeRemainingMs,
    isDeleting:
      deleteByIdsMutation.isPending || deleteByDateRangeMutation.isPending,
    isUndoing: undoMutation.isPending,
  };
}
