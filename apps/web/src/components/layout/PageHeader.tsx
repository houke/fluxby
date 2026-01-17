import React from 'react';

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  dataOnboarding?: string;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  dataOnboarding,
}: PageHeaderProps) {
  return (
    <div
      className='flex flex-col gap-4 px-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:px-0'
      data-onboarding={dataOnboarding}
    >
      <div>
        <h1 className='text-xl leading-tight font-bold sm:text-3xl'>{title}</h1>
        {subtitle && (
          <p className='mt-1 text-xs text-muted-foreground sm:text-base'>
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className='flex w-full items-center gap-2 sm:w-auto'>
          {actions}
        </div>
      )}
    </div>
  );
}
