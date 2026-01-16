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
      return 'bg-emerald-200 dark:bg-emerald-900/50';
    if (color.includes('rose')) return 'bg-rose-200 dark:bg-rose-900/50';
    if (color.includes('blue')) return 'bg-blue-200 dark:bg-blue-900/50';
    if (color.includes('gray')) return 'bg-gray-200 dark:bg-gray-800/50';
    return 'bg-primary/20';
  };

  return (
    <Card className='group relative h-full overflow-hidden rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'>
      <CardContent className='relative z-10 flex h-full flex-col justify-between p-4 sm:p-6'>
        <div className='flex-1'>
          <p className='text-sm font-medium text-muted-foreground'>{title}</p>
          <div className='flex items-baseline gap-2'>
            <p
              className={`mt-2 text-2xl font-bold sm:text-3xl ${valueColor || ''}`}
            >
              {value}
            </p>
          </div>

          {trend !== undefined && trend !== 0 ? (
            <div className='mt-2 flex items-center gap-1'>
              <div
                className={`flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${
                  trend > 0
                    ? 'bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                    : 'bg-rose-100/50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400'
                }`}
              >
                {trend > 0 ? (
                  <TrendingUp className='mr-1 h-3 w-3' />
                ) : (
                  <TrendingDown className='mr-1 h-3 w-3' />
                )}
                {trend > 0 ? '+' : ''}
                {trend.toFixed(1)}%
              </div>
              {trendLabel && (
                <span className='ml-1 text-xs text-muted-foreground'>
                  {trendLabel}
                </span>
              )}
            </div>
          ) : trendLabel ? (
            <p className='mt-2 text-xs text-muted-foreground'>{trendLabel}</p>
          ) : null}
        </div>
      </CardContent>

      {/* Decorative Icon Background */}
      <div
        className={`absolute -top-12 -right-12 flex h-48 w-48 items-center justify-center rounded-full opacity-10 transition-transform duration-500 group-hover:scale-110 sm:-top-8 sm:-right-8 ${
          bgColor || getBgColor(iconColor)
        }`}
      >
        <Icon className={`h-24 w-24 ${iconColor}`} />
      </div>
    </Card>
  );
}
