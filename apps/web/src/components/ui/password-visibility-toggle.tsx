import { Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

export function PasswordVisibilityToggle({
  visible,
  onToggle,
  disabled = false,
}: {
  visible: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  const { t } = useLanguage();
  const label = visible ? t.security.hidePassword : t.security.showPassword;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type='button'
            aria-label={label}
            aria-pressed={visible}
            disabled={disabled}
            onClick={onToggle}
            className='absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50'
          >
            {visible ? (
              <EyeOff className='h-5 w-5' />
            ) : (
              <Eye className='h-5 w-5' />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
