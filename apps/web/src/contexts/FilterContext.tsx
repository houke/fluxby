/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { useProfile } from './ProfileContext';

interface FilterState {
  dateRange: {
    start: Date;
    end: Date;
  };
  categories: number[];
  transactionType: 'all' | 'income' | 'expense' | 'transfer';
  opposingAccountIbans: string[];
  opposingAccountName: string | null;
  addressBookId: number | null;
}

interface FilterContextType {
  filters: FilterState;
  setDateRange: (start: Date, end: Date) => void;
  setCategories: (categories: number[]) => void;
  setTransactionType: (type: 'all' | 'income' | 'expense' | 'transfer') => void;
  setOpposingAccountIbans: (ibans: string[]) => void;
  setOpposingAccountName: (name: string | null) => void;
  setAddressBookId: (id: number | null) => void;
  clearOpposingAccountFilters: () => void;
  resetFilters: () => void;
}

// Get current month start and end
function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start, end };
}

const defaultFilters: FilterState = {
  dateRange: getCurrentMonthRange(),
  categories: [],
  transactionType: 'all',
  opposingAccountIbans: [],
  opposingAccountName: null,
  addressBookId: null,
};

const FILTER_STORAGE_KEY = 'finance-filters';

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const { activeProfileId } = useProfile();
  const [filters, setFilters] = useState<FilterState>(() => {
    try {
      const stored = localStorage.getItem(FILTER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          dateRange: {
            start: new Date(parsed.dateRange.start),
            end: new Date(parsed.dateRange.end),
          },
        };
      }
    } catch (error) {
      console.warn('Failed to load filters from localStorage:', error);
    }
    return defaultFilters;
  });

  // Reset filters when profile changes
  useEffect(() => {
    if (activeProfileId) {
      setFilters(defaultFilters);
    }
  }, [activeProfileId]);

  useEffect(() => {
    try {
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
    } catch (error) {
      console.warn('Failed to save filters to localStorage:', error);
    }
  }, [filters]);

  const setDateRange = useCallback((start: Date, end: Date) => {
    setFilters((prev) => ({ ...prev, dateRange: { start, end } }));
  }, []);

  const setCategories = useCallback((categories: number[]) => {
    setFilters((prev) => ({ ...prev, categories }));
  }, []);

  const setTransactionType = useCallback(
    (type: 'all' | 'income' | 'expense' | 'transfer') => {
      setFilters((prev) => ({ ...prev, transactionType: type }));
    },
    []
  );

  const setOpposingAccountIbans = useCallback((ibans: string[]) => {
    setFilters((prev) => ({ ...prev, opposingAccountIbans: ibans }));
  }, []);

  const setOpposingAccountName = useCallback((name: string | null) => {
    setFilters((prev) => ({ ...prev, opposingAccountName: name }));
  }, []);

  const setAddressBookId = useCallback((id: number | null) => {
    setFilters((prev) => ({ ...prev, addressBookId: id }));
  }, []);

  const clearOpposingAccountFilters = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      opposingAccountIbans: [],
      opposingAccountName: null,
      addressBookId: null,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const value = useMemo(
    () => ({
      filters,
      setDateRange,
      setCategories,
      setTransactionType,
      setOpposingAccountIbans,
      setOpposingAccountName,
      setAddressBookId,
      clearOpposingAccountFilters,
      resetFilters,
    }),
    [
      filters,
      setDateRange,
      setCategories,
      setTransactionType,
      setOpposingAccountIbans,
      setOpposingAccountName,
      setAddressBookId,
      clearOpposingAccountFilters,
      resetFilters,
    ]
  );

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}

// Helper to format date as YYYY-MM-DD without timezone issues
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to get ISO date strings for API calls
export function useFilterParams() {
  const { filters } = useFilters();

  const startDate = formatDateLocal(filters.dateRange.start);
  const endDate = formatDateLocal(filters.dateRange.end);
  const type =
    filters.transactionType === 'all' ? undefined : filters.transactionType;
  const categoryIds =
    filters.categories.length > 0 ? filters.categories : undefined;

  return { startDate, endDate, type, categoryIds };
}
