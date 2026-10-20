import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/** Application form fields use the same accessible select as existing settings. */
export function FormSelect({
  label,
  value,
  onChange,
  options,
  disabled,
  required,
  id,
  name,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next === '__none__' ? '' : next)}
      disabled={disabled}
      required={required}
      name={name}
    >
      <SelectTrigger id={id} aria-label={label}>
        <SelectValue
          placeholder={
            options.find((option) => option.value === '')?.label ?? label
          }
        />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value || '__none__'}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
