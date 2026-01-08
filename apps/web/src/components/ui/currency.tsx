import React from 'react';
import { cn, formatCurrency } from '@/lib/utils';

interface CurrencyProps {
  amount: number | null | undefined;
  currency?: string;
  className?: string;
}

export function Currency({ amount, className }: CurrencyProps) {
  if (amount === null || amount === undefined) return <span>-</span>;

  return (
    <span className={cn('privacy-blur', className)}>
      {formatCurrency(amount)}
    </span>
  );
}
