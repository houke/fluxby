import React from 'react';
import { cn, formatCurrency } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface CurrencyProps {
  amount: number | null | undefined;
  currency?: string;
  locale?: string;
  className?: string;
}

export function Currency({
  amount,
  currency = 'EUR',
  locale,
  className,
}: CurrencyProps) {
  const { language } = useLanguage();
  if (amount === null || amount === undefined) return <span>-</span>;

  return (
    <span className={cn('privacy-blur', className)}>
      {formatCurrency(
        amount,
        currency,
        locale ?? (language === 'en' ? 'en-GB' : 'nl-NL')
      )}
    </span>
  );
}
