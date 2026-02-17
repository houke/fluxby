# Test File Template

Use this template for creating new test files.

## Component Test Template

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ComponentName } from './ComponentName';

// Mock dependencies
vi.mock('./api', () => ({
  fetchData: vi.fn(),
}));

describe('ComponentName', () => {
  // Setup
  const defaultProps = {
    prop1: 'value1',
    prop2: 'value2',
  };

  const renderComponent = (props = {}) => {
    return render(<ComponentName {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===== Rendering Tests =====
  describe('rendering', () => {
    it('renders without crashing', () => {
      renderComponent();
      expect(screen.getByRole('...')).toBeInTheDocument();
    });

    it('renders with custom props', () => {
      renderComponent({ prop1: 'custom' });
      expect(screen.getByText('custom')).toBeInTheDocument();
    });
  });

  // ===== Interaction Tests =====
  describe('interactions', () => {
    it('handles click events', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      
      renderComponent({ onClick });
      await user.click(screen.getByRole('button'));
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('handles form submission', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      
      renderComponent({ onSubmit });
      
      await user.type(screen.getByLabelText(/name/i), 'Test');
      await user.click(screen.getByRole('button', { name: /submit/i }));
      
      expect(onSubmit).toHaveBeenCalledWith({ name: 'Test' });
    });
  });

  // ===== Async Tests =====
  describe('async behavior', () => {
    it('shows loading state', () => {
      renderComponent({ isLoading: true });
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('shows data after loading', async () => {
      renderComponent();
      
      expect(await screen.findByText('Loaded data')).toBeInTheDocument();
    });

    it('handles errors', async () => {
      renderComponent({ error: 'Something went wrong' });
      
      expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    });
  });

  // ===== Edge Cases =====
  describe('edge cases', () => {
    it('handles empty data', () => {
      renderComponent({ data: [] });
      expect(screen.getByText(/no items/i)).toBeInTheDocument();
    });

    it('handles null values', () => {
      renderComponent({ value: null });
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  // ===== Accessibility =====
  describe('accessibility', () => {
    it('has accessible name', () => {
      renderComponent();
      expect(screen.getByRole('button')).toHaveAccessibleName('Submit form');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await user.tab();
      expect(screen.getByRole('button')).toHaveFocus();
    });
  });
});
```

## Hook Test Template

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useHookName } from './useHookName';

describe('useHookName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===== Initial State =====
  describe('initial state', () => {
    it('returns default values', () => {
      const { result } = renderHook(() => useHookName());
      
      expect(result.current.value).toBe(initialValue);
      expect(result.current.loading).toBe(false);
    });

    it('accepts initial config', () => {
      const { result } = renderHook(() => useHookName({ initial: 'custom' }));
      
      expect(result.current.value).toBe('custom');
    });
  });

  // ===== Actions =====
  describe('actions', () => {
    it('updates state', () => {
      const { result } = renderHook(() => useHookName());

      act(() => {
        result.current.setValue('new value');
      });

      expect(result.current.value).toBe('new value');
    });
  });

  // ===== Async Behavior =====
  describe('async behavior', () => {
    it('handles async operations', async () => {
      const { result } = renderHook(() => useHookName());

      await act(async () => {
        await result.current.fetchData();
      });

      expect(result.current.data).toBeDefined();
    });
  });

  // ===== Props Changes =====
  describe('props changes', () => {
    it('responds to prop changes', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useHookName(value),
        { initialProps: { value: 'initial' } }
      );

      expect(result.current.value).toBe('initial');

      rerender({ value: 'updated' });

      expect(result.current.value).toBe('updated');
    });
  });

  // ===== Cleanup =====
  describe('cleanup', () => {
    it('cleans up on unmount', () => {
      const cleanup = vi.fn();
      const { unmount } = renderHook(() => useHookName({ onCleanup: cleanup }));

      unmount();

      expect(cleanup).toHaveBeenCalled();
    });
  });
});
```

## Service/Utility Test Template

```typescript
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ServiceName } from './ServiceName';

describe('ServiceName', () => {
  let service: ServiceName;

  beforeEach(() => {
    service = new ServiceName();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===== Method Tests =====
  describe('methodName', () => {
    it('returns expected result for valid input', () => {
      const result = service.methodName('valid input');
      expect(result).toBe('expected output');
    });

    it('throws for invalid input', () => {
      expect(() => service.methodName(null)).toThrow('Invalid input');
    });

    it('handles edge cases', () => {
      expect(service.methodName('')).toBe('');
      expect(service.methodName('   ')).toBe('');
    });
  });

  // ===== Async Methods =====
  describe('asyncMethod', () => {
    it('resolves with data', async () => {
      const result = await service.asyncMethod();
      expect(result).toEqual({ data: 'value' });
    });

    it('rejects on error', async () => {
      await expect(service.asyncMethod('bad')).rejects.toThrow('Error');
    });
  });

  // ===== Integration =====
  describe('integration', () => {
    it('works with other services', async () => {
      const mockDep = { method: vi.fn().mockResolvedValue('result') };
      const serviceWithDeps = new ServiceName(mockDep);

      await serviceWithDeps.operation();

      expect(mockDep.method).toHaveBeenCalled();
    });
  });
});
```
