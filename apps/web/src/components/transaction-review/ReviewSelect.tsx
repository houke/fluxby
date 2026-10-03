import { useId } from 'react';
import { Label } from '@/components/ui/label';
import { FormSelect } from '@/components/ui/form-select';

/** A visible label around the shared application form select. */
export function ReviewSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className='min-w-0 space-y-2'>
      <Label htmlFor={id}>{label}</Label>
      <FormSelect
        id={id}
        label={label}
        value={value}
        onChange={onChange}
        disabled={disabled}
        options={
          placeholder
            ? [{ value: '', label: placeholder }, ...options]
            : options
        }
      />
    </div>
  );
}
