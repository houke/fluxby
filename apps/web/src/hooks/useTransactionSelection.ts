import { useState, useCallback, useMemo } from 'react';

export interface UseTransactionSelectionReturn {
  selectedIds: Set<string>;
  isSelecting: boolean;
  lastSelectedId: string | null;

  // Actions
  toggleSelection: (id: string) => void;
  selectRange: (fromId: string, toId: string, allIds: string[]) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  enterSelectionMode: () => void;
  exitSelectionMode: () => void;

  // Helpers
  isSelected: (id: string) => boolean;
  selectionCount: number;
}

/**
 * Hook for managing transaction multi-selection state.
 *
 * Supports:
 * - Single select (click checkbox): Toggle individual row
 * - Range select (Shift+Click): Select all between last and current
 * - Multi-select add (Ctrl/Cmd+Click): Add/remove without clearing
 * - Select all visible: Select all filtered transactions
 */
export function useTransactionSelection(): UseTransactionSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  const toggleSelection = useCallback((id: string) => {
    let isAdding = false;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        isAdding = false;
      } else {
        next.add(id);
        isAdding = true;
      }

      // Auto-exit selection mode when all items are unchecked
      if (next.size === 0) {
        setIsSelecting(false);
        setLastSelectedId(null);
      } else {
        // Auto-enter selection mode when first item is selected
        setIsSelecting(true);
        // Only update lastSelectedId when ADDING to selection
        if (isAdding) {
          setLastSelectedId(id);
        }
      }

      return next;
    });
  }, []);

  const selectRange = useCallback(
    (fromId: string, toId: string, allIds: string[]) => {
      const fromIndex = allIds.indexOf(fromId);
      const toIndex = allIds.indexOf(toId);

      if (fromIndex === -1 || toIndex === -1) return;

      const start = Math.min(fromIndex, toIndex);
      const end = Math.max(fromIndex, toIndex);

      // Get IDs in the range
      const rangeIds = allIds.slice(start, end + 1);

      setSelectedIds((prev) => {
        // Check if ANY rows in the range are unchecked
        const hasUnchecked = rangeIds.some((id) => !prev.has(id));

        const next = new Set(prev);
        if (hasUnchecked) {
          // If any unchecked, select ALL in range
          for (const id of rangeIds) {
            next.add(id);
          }
        } else {
          // If all checked, unselect ALL in range
          for (const id of rangeIds) {
            next.delete(id);
          }
        }
        return next;
      });
      setLastSelectedId(toId);
    },
    []
  );

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
    setLastSelectedId(ids.length > 0 ? ids[ids.length - 1] : null);
    if (ids.length > 0) {
      setIsSelecting(true);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setLastSelectedId(null);
  }, []);

  const enterSelectionMode = useCallback(() => {
    setIsSelecting(true);
  }, []);

  const exitSelectionMode = useCallback(() => {
    setIsSelecting(false);
    setSelectedIds(new Set());
    setLastSelectedId(null);
  }, []);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const selectionCount = useMemo(() => selectedIds.size, [selectedIds]);

  return {
    selectedIds,
    isSelecting,
    lastSelectedId,
    toggleSelection,
    selectRange,
    selectAll,
    clearSelection,
    enterSelectionMode,
    exitSelectionMode,
    isSelected,
    selectionCount,
  };
}
