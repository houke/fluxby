import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 text-center ${className}`}
    >
      <Icon className='mx-auto mb-4 h-12 w-12 text-muted-foreground/50' />
      <h3 className='text-lg font-medium text-foreground'>{title}</h3>
      {description && (
        <p className='mx-auto mt-2 max-w-xs text-sm text-muted-foreground'>
          {description}
        </p>
      )}
      {action && <div className='mt-6'>{action}</div>}
    </div>
  );
}
