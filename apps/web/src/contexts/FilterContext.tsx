/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from 'react';
import { useProfile } from './ProfileContext';
import {
  readFromOPFSSync,
  writeToOPFSWithCache,
  isSettingsCacheInitialized,
  readFromOPFS,
} from '@fluxby/database';

interface FilterState {
  dateRange: {
    start: Date;
    end: Date;
  };
  categories: string[];
  transactionType: 'all' | 'income' | 'expense' | 'transfer';
  opposingAccountIbans: string[];
  opposingAccountName: string | null;
  addressBookId: string | null;
}

interface FilterContextType {
  filters: FilterState;
  setDateRange: (start: Date, end: Date) => void;
  setCategories: (categories: string[]) => void;
  setTransactionType: (type: 'all' | 'income' | 'expense' | 'transfer') => void;
  setOpposingAccountIbans: (ibans: string[]) => void;
  setOpposingAccountName: (name: string | null) => void;
  setAddressBookId: (id: string | null) => void;
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

// Serializable filter state for storage
interface StoredFilterState {
  dateRange: {
    start: string;
    end: string;
  };
  categories: string[];
  transactionType: 'all' | 'income' | 'expense' | 'transfer';
  opposingAccountIbans: string[];
  opposingAccountName: string | null;
  addressBookId: string | null;
}

// Helper to parse stored filters
function parseStoredFilters(stored: StoredFilterState | null): FilterState {
  if (!stored) return defaultFilters;

  try {
    // Normalize categories: ensure they are strings and map empty marker '' to '0'
    const categories = Array.isArray(stored.categories)
      ? stored.categories
          .map((c: unknown) => String(c))
          .map((s: string) => (s === '' ? '0' : s))
          .filter(Boolean)
      : [];

    return {
      ...stored,
      categories,
      dateRange: {
        start: new Date(stored.dateRange.start),
        end: new Date(stored.dateRange.end),
      },
    };
  } catch {
    return defaultFilters;
  }
}

// Helper to get initial filters from OPFS cache
function getInitialFilters(): FilterState {
  if (typeof window === 'undefined') return defaultFilters;

  if (isSettingsCacheInitialized()) {
    const stored = readFromOPFSSync<StoredFilterState>(FILTER_STORAGE_KEY);
    return parseStoredFilters(stored);
  }

  return defaultFilters;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const { activeProfileId } = useProfile();
  const [filters, setFilters] = useState<FilterState>(getInitialFilters);
  const mountedRef = useRef(true);

  // Load from OPFS if cache wasn't initialized
  useEffect(() => {
    mountedRef.current = true;

    if (!isSettingsCacheInitialized()) {
      readFromOPFS<StoredFilterState>(FILTER_STORAGE_KEY).then((stored) => {
        if (mountedRef.current && stored) {
          setFilters(parseStoredFilters(stored));
        }
      });
    }

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Reset filters when profile changes
  useEffect(() => {
    if (activeProfileId) {
      setFilters(defaultFilters);
    }
  }, [activeProfileId]);

  // Save filters to OPFS when they change
  useEffect(() => {
    const storedFilters: StoredFilterState = {
      ...filters,
      dateRange: {
        start: filters.dateRange.start.toISOString(),
        end: filters.dateRange.end.toISOString(),
      },
    };

    writeToOPFSWithCache(FILTER_STORAGE_KEY, storedFilters).catch((error) => {
      console.warn('Failed to save filters to OPFS:', error);
    });
  }, [filters]);

  const setDateRange = useCallback((start: Date, end: Date) => {
    setFilters((prev) => ({ ...prev, dateRange: { start, end } }));
  }, []);

  const setCategories = useCallback((categories: string[]) => {
    // Normalize input: coerce to strings and map '' -> '0'
    const normalized = (categories || [])
      .map((c) => String(c))
      .map((s) => (s === '' ? '0' : s))
      .filter(Boolean);

    setFilters((prev) => ({ ...prev, categories: normalized }));
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

  const setAddressBookId = useCallback((id: string | null) => {
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
