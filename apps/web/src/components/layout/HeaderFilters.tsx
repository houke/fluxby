import { format } from 'date-fns';
import { nl, enUS } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { useFilters } from '@/contexts/FilterContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { DateRange } from 'react-day-picker';

export function HeaderFilters() {
  const { t, language } = useLanguage();
  const { filters, setDateRange } = useFilters();
  const { activeProfileId } = useProfile();
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string | undefined>(
    undefined
  );

  const { data: availableYears } = useQuery<number[]>({
    queryKey: ['available-years', activeProfileId],
    queryFn: () => api.getAvailableYears(),
  });

  const { data: minMaxDates } = useQuery<{
    minDate: string;
    maxDate: string;
  } | null>({
    queryKey: ['min-max-dates', activeProfileId],
    queryFn: () => api.getMinMaxDates(),
  });

  // Quick date range presets
  const setPreset = (preset: string) => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (preset) {
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'last3Months':
        start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      case 'lastYear':
        start = new Date(now.getFullYear() - 1, 0, 1);
        end = new Date(now.getFullYear() - 1, 11, 31);
        break;
      case 'all':
        if (minMaxDates) {
          start = new Date(minMaxDates.minDate);
          end = new Date(minMaxDates.maxDate);
        } else {
          return; // Don't set range if we don't have the data yet
        }
        break;
      default:
        return;
    }

    setDateRange(start, end);
    setDatePickerOpen(false);
  };

  const setYear = (year: string) => {
    const yearNum = parseInt(year, 10);
    const start = new Date(yearNum, 0, 1);
    const end = new Date(yearNum, 11, 31);
    setDateRange(start, end);
    setSelectedYear(year);
    setDatePickerOpen(false);
  };

  // Keep year selector showing last chosen year when it still matches the active range
  useEffect(() => {
    const { start, end } = filters.dateRange;
    const isFullYear =
      start.getMonth() === 0 &&
      start.getDate() === 1 &&
      end.getMonth() === 11 &&
      end.getDate() === 31 &&
      start.getFullYear() === end.getFullYear();

    if (isFullYear) {
      setSelectedYear(start.getFullYear().toString());
    } else {
      setSelectedYear(undefined);
    }
  }, [filters.dateRange]);

  const formatDateRange = () => {
    const { start, end } = filters.dateRange;
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    const locale = language === 'nl' ? nl : enUS;

    const startStr =
      startYear !== endYear
        ? format(start, 'd MMM yyyy', { locale })
        : format(start, 'd MMM', { locale });
    const endStr = format(end, 'd MMM yyyy', { locale });
    return `${startStr} - ${endStr}`;
  };

  return (
    <div className='flex items-center gap-2'>
      {/* Date Range Picker */}
      <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            className={cn(
              'min-w-[200px] justify-start text-left font-normal',
              !filters.dateRange && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className='mr-2 h-4 w-4' />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <div className='flex'>
            {/* Presets */}
            <div className='w-28 flex-shrink-0 space-y-1 border-r p-2'>
              <Button
                variant='ghost'
                size='sm'
                className='w-full justify-start px-2 text-xs'
                onClick={() => setPreset('thisMonth')}
              >
                {t.common.filters.thisMonth}
              </Button>
              <Button
                variant='ghost'
                size='sm'
                className='w-full justify-start px-2 text-xs'
                onClick={() => setPreset('lastMonth')}
              >
                {t.common.filters.lastMonth}
              </Button>
              <Button
                variant='ghost'
                size='sm'
                className='w-full justify-start px-2 text-xs'
                onClick={() => setPreset('last3Months')}
              >
                {t.common.filters.last3Months}
              </Button>
              <Button
                variant='ghost'
                size='sm'
                className='w-full justify-start px-2 text-xs'
                onClick={() => setPreset('thisYear')}
              >
                {t.common.filters.thisYear}
              </Button>
              <Button
                variant='ghost'
                size='sm'
                className='w-full justify-start px-2 text-xs'
                onClick={() => setPreset('lastYear')}
              >
                {t.common.filters.lastYear}
              </Button>
              <Button
                variant='ghost'
                size='sm'
                className='w-full justify-start px-2 text-xs'
                onClick={() => setPreset('all')}
              >
                {t.common.filters.all}
              </Button>
              {/* Year selector */}
              {availableYears && availableYears.length > 0 && (
                <div className='mt-2 border-t pt-2'>
                  <Select value={selectedYear} onValueChange={setYear}>
                    <SelectTrigger className='h-8 w-full text-xs'>
                      <SelectValue
                        placeholder={t.common.filters.yearPlaceholder}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            {/* Calendar */}
            <Calendar
              mode='range'
              selected={{
                from: filters.dateRange.start,
                to: filters.dateRange.end,
              }}
              onSelect={(range: DateRange | undefined) => {
                if (range?.from && range?.to) {
                  setDateRange(range.from, range.to);
                } else if (range?.from) {
                  // Keep the popover open while selecting range
                  setDateRange(range.from, range.from);
                }
              }}
              numberOfMonths={2}
              defaultMonth={filters.dateRange.start}
              startMonth={
                minMaxDates?.minDate ? new Date(minMaxDates.minDate) : undefined
              }
              endMonth={
                minMaxDates?.maxDate ? new Date(minMaxDates.maxDate) : undefined
              }
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
