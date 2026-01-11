import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export interface StatsCardProps {
  title: string;
  value: string | React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  valueColor?: string;
  bgColor?: string;
  trend?: number;
  trendLabel?: string | React.ReactNode;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-primary',
  valueColor,
  bgColor,
  trend,
  trendLabel,
}: StatsCardProps) {
  // Map icon color to matching pastel background
  const getBgColor = (color: string) => {
    if (color.includes('emerald'))
      return 'bg-emerald-100 dark:bg-emerald-900/30';
    if (color.includes('rose')) return 'bg-rose-100 dark:bg-rose-900/30';
    if (color.includes('blue')) return 'bg-blue-100 dark:bg-blue-900/30';
    return 'bg-primary/10';
  };

  return (
    <Card className='h-full rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'>
      <CardContent className='relative flex h-full flex-col justify-between overflow-hidden p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6'>
        <div className='flex-1 sm:mr-4'>
          <p className='text-xs text-muted-foreground sm:text-sm'>{title}</p>
          <p
            className={`mt-1 text-lg font-bold sm:text-2xl ${valueColor || ''}`}
          >
            {value}
          </p>
          {trend !== undefined && trend !== 0 ? (
            <div className='mt-1 flex items-center gap-1'>
              {trend > 0 ? (
                <TrendingUp className='h-4 w-4 text-success' />
              ) : (
                <TrendingDown className='h-4 w-4 text-destructive' />
              )}
              <span
                className={`text-sm ${
                  trend > 0 ? 'text-success' : 'text-destructive'
                }`}
              >
                {trend > 0 ? '+' : ''}
                {trend.toFixed(1)}%
              </span>
              {trendLabel && (
                <span className='text-sm text-muted-foreground'>
                  {trendLabel}
                </span>
              )}
            </div>
          ) : trendLabel ? (
            <p className='mt-1 text-xs text-muted-foreground'>{trendLabel}</p>
          ) : null}
        </div>
        <div
          className={`absolute -top-2 -right-2 flex h-12 w-12 items-center justify-center rounded-full sm:relative sm:inset-auto sm:top-auto sm:right-auto sm:ml-4 sm:flex-shrink-0 ${
            bgColor || getBgColor(iconColor)
          }`}
        >
          <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${iconColor}`} />
        </div>
      </CardContent>
    </Card>
  );
}
