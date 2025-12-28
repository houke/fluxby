/**
 * Optimized Search Input component
 *
 * This component is extracted and memoized to prevent the large Transactions page
 * from re-rendering on every keystroke. It uses internal state for immediate UI updates
 * and debounces the parent callback.
 */
import { memo, useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export const SearchInput = memo(function SearchInput({
  value: externalValue,
  onChange,
  placeholder = 'Zoeken...',
  debounceMs = 300,
  className,
}: SearchInputProps) {
  // Use internal state for immediate UI updates
  const [internalValue, setInternalValue] = useState(externalValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);

  // Sync internal state when external value changes (e.g., from clear button elsewhere)
  useEffect(() => {
    if (externalValue !== internalValue) {
      setInternalValue(externalValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalValue]);

  // Debounce changes to parent
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (internalValue !== externalValue) {
        onChange(internalValue);
      }
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [internalValue, onChange, debounceMs, externalValue]);

  const handleClear = () => {
    setInternalValue('');
    onChange('');
  };

  return (
    <div className={`relative ${className || ''}`}>
      <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
      <Input
        placeholder={placeholder}
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        className='pl-10 pr-8'
      />
      {internalValue && (
        <Button
          variant='ghost'
          size='icon'
          className='absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground hover:bg-purple-600 hover:text-white'
          onClick={handleClear}
        >
          <X className='h-3 w-3' />
        </Button>
      )}
    </div>
  );
});

export default SearchInput;
