/**
 * React Hook Tests
 *
 * Testing custom hooks with @testing-library/react
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';

// ============================================================================
// EXAMPLE HOOKS
// ============================================================================

// Simple counter hook
function useCounter(initialValue = 0) {
  const [count, setCount] = React.useState(initialValue);

  const increment = React.useCallback(() => setCount((c) => c + 1), []);
  const decrement = React.useCallback(() => setCount((c) => c - 1), []);
  const reset = React.useCallback(() => setCount(initialValue), [initialValue]);

  return { count, increment, decrement, reset };
}

// Toggle hook
function useToggle(initialValue = false) {
  const [value, setValue] = React.useState(initialValue);

  const toggle = React.useCallback(() => setValue((v) => !v), []);
  const setTrue = React.useCallback(() => setValue(true), []);
  const setFalse = React.useCallback(() => setValue(false), []);

  return { value, toggle, setTrue, setFalse };
}

// Async data hook
interface User {
  id: string;
  name: string;
  email: string;
}

function useUser(userId: string) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchUser() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        if (!cancelled) setUser(data);
      } catch (err) {
        if (!cancelled) setError(err as Error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchUser();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { user, loading, error };
}

// Debounced value hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Local storage hook
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = React.useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setStoredValue = React.useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const valueToStore =
          newValue instanceof Function ? newValue(prev) : newValue;
        localStorage.setItem(key, JSON.stringify(valueToStore));
        return valueToStore;
      });
    },
    [key],
  );

  const removeValue = React.useCallback(() => {
    localStorage.removeItem(key);
    setValue(initialValue);
  }, [key, initialValue]);

  return [value, setStoredValue, removeValue] as const;
}

// ============================================================================
// TESTS
// ============================================================================

describe('useCounter', () => {
  it('initializes with default value', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('initializes with custom value', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it('increments count', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('decrements count', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });

  it('resets to initial value', () => {
    const { result } = renderHook(() => useCounter(10));

    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.reset();
    });

    expect(result.current.count).toBe(10);
  });

  it('handles multiple operations', () => {
    const { result } = renderHook(() => useCounter(0));

    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.decrement();
    });

    expect(result.current.count).toBe(1);
  });
});

describe('useToggle', () => {
  it('initializes with default value', () => {
    const { result } = renderHook(() => useToggle());
    expect(result.current.value).toBe(false);
  });

  it('initializes with custom value', () => {
    const { result } = renderHook(() => useToggle(true));
    expect(result.current.value).toBe(true);
  });

  it('toggles value', () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => result.current.toggle());
    expect(result.current.value).toBe(true);

    act(() => result.current.toggle());
    expect(result.current.value).toBe(false);
  });

  it('sets to true', () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => result.current.setTrue());
    expect(result.current.value).toBe(true);

    // Already true, should stay true
    act(() => result.current.setTrue());
    expect(result.current.value).toBe(true);
  });

  it('sets to false', () => {
    const { result } = renderHook(() => useToggle(true));

    act(() => result.current.setFalse());
    expect(result.current.value).toBe(false);
  });
});

describe('useUser', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('starts in loading state', () => {
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useUser('123'));

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('fetches and returns user data', async () => {
    const mockUser = { id: '123', name: 'John', email: 'john@example.com' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });

    const { result } = renderHook(() => useUser('123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.error).toBeNull();
  });

  it('handles fetch error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
    });

    const { result } = renderHook(() => useUser('123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.user).toBeNull();
  });

  it('refetches when userId changes', async () => {
    const mockUser1 = { id: '1', name: 'User 1', email: 'user1@example.com' };
    const mockUser2 = { id: '2', name: 'User 2', email: 'user2@example.com' };

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser1),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser2),
      });

    const { result, rerender } = renderHook(({ userId }) => useUser(userId), {
      initialProps: { userId: '1' },
    });

    await waitFor(() => expect(result.current.user).toEqual(mockUser1));

    rerender({ userId: '2' });

    await waitFor(() => expect(result.current.user).toEqual(mockUser2));
  });
});

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('debounces value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } },
    );

    rerender({ value: 'updated' });
    expect(result.current).toBe('initial'); // Still old value

    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current).toBe('initial'); // Still old value

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated'); // Now updated
  });

  it('resets timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });
    act(() => vi.advanceTimersByTime(300));

    rerender({ value: 'c' });
    act(() => vi.advanceTimersByTime(300));

    rerender({ value: 'd' });
    act(() => vi.advanceTimersByTime(300));

    expect(result.current).toBe('a'); // Still initial

    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe('d'); // Final value
  });
});

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns initial value when no stored value', () => {
    const { result } = renderHook(() => useLocalStorage('key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('returns stored value when available', () => {
    localStorage.setItem('key', JSON.stringify('stored'));

    const { result } = renderHook(() => useLocalStorage('key', 'default'));
    expect(result.current[0]).toBe('stored');
  });

  it('updates value and localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(JSON.parse(localStorage.getItem('key')!)).toBe('updated');
  });

  it('supports functional updates', () => {
    const { result } = renderHook(() => useLocalStorage('count', 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);
  });

  it('removes value from localStorage', () => {
    localStorage.setItem('key', JSON.stringify('value'));

    const { result } = renderHook(() => useLocalStorage('key', 'default'));

    act(() => {
      result.current[2](); // removeValue
    });

    expect(result.current[0]).toBe('default');
    expect(localStorage.getItem('key')).toBeNull();
  });
});
