import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker, getDefaultClassNames } from 'react-day-picker';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import 'react-day-picker/style.css';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  numberOfMonths, // allow caller to override if desired
  ...props
}: CalendarProps & { numberOfMonths?: number }) {
  const defaultClassNames = getDefaultClassNames();
  const [computedMonths, setComputedMonths] = React.useState<number>(
    numberOfMonths || 1
  );

  // Compute months based on available width. Fallback to simple breakpoints.
  React.useEffect(() => {
    if (numberOfMonths) {
      setComputedMonths(numberOfMonths);
      return;
    }

    const compute = () => {
      const w = window.innerWidth;
      // Approx width per month: 320-360px, clamp 1..4
      const approx = Math.max(1, Math.min(4, Math.floor(w / 360)));
      setComputedMonths(approx);
    };

    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [numberOfMonths]);

  return (
    <DayPicker
      locale={nl}
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-4',
        month: 'space-y-4',
        month_caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'flex items-center gap-1',
        // align the nav arrows with the month caption (top-aligned)
        button_previous: cn(
          'absolute left-1 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-md border bg-transparent p-0 opacity-50 hover:opacity-100'
        ),
        button_next: cn(
          'absolute right-1 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-md border bg-transparent p-0 opacity-50 hover:opacity-100'
        ),
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday:
          'text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] text-center',
        week: 'flex w-full mt-2',
        day: 'h-8 w-8 text-center text-sm p-0 relative flex items-center justify-center',
        day_button:
          'h-8 w-8 p-0 font-normal rounded-md hover:bg-accent hover:text-accent-foreground',
        range_start:
          'bg-primary text-primary-foreground rounded-l-md rounded-r-none',
        range_end:
          'bg-primary text-primary-foreground rounded-r-md rounded-l-none',
        range_middle: 'bg-primary text-primary-foreground rounded-none',
        selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        today: 'bg-accent text-accent-foreground rounded-md',
        outside: 'text-muted-foreground opacity-50',
        disabled: 'text-muted-foreground opacity-50',
        hidden: 'invisible',
        chevron: `${defaultClassNames.chevron} h-4 w-4`,
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <ChevronLeft className='h-4 w-4' />
          ) : (
            <ChevronRight className='h-4 w-4' />
          ),
      }}
      numberOfMonths={computedMonths}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
