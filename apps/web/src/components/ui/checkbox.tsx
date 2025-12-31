import * as React from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, indeterminate, ...props }, ref) => {
    const internalRef = React.useRef<HTMLInputElement>(null);
    const combinedRef = (ref ||
      internalRef) as React.RefObject<HTMLInputElement>;

    React.useEffect(() => {
      if (combinedRef.current) {
        combinedRef.current.indeterminate = indeterminate ?? false;
      }
    }, [indeterminate, combinedRef]);

    const isChecked = checked || indeterminate;

    return (
      <div className='relative inline-flex items-center'>
        <input
          type='checkbox'
          ref={combinedRef}
          checked={checked}
          className='peer sr-only'
          {...props}
        />
        <div
          className={cn(
            'flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-[4px] border-2 transition-all',
            'border-muted-foreground/40 bg-background',
            'peer-hover:border-primary/60',
            'peer-focus-visible:ring-1 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-1',
            'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
            isChecked && 'border-primary bg-primary text-primary-foreground',
            className
          )}
          onClick={() => combinedRef.current?.click()}
        >
          {indeterminate ? (
            <Minus className='h-3 w-3 stroke-[3]' />
          ) : checked ? (
            <Check className='h-3 w-3 stroke-[3]' />
          ) : null}
        </div>
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
