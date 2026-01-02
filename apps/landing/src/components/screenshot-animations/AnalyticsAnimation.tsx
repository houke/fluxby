import { useEffect, useState, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

// Monthly data with month keys for translation
const monthlyDataBase = [
  { monthKey: 'jan', income: 3200, expenses: 2450 },
  { monthKey: 'feb', income: 3200, expenses: 2680 },
  { monthKey: 'mar', income: 3450, expenses: 2890 },
  { monthKey: 'apr', income: 3200, expenses: 2340 },
  { monthKey: 'may', income: 3200, expenses: 2780 },
  { monthKey: 'jun', income: 3650, expenses: 2950 },
  { monthKey: 'jul', income: 3200, expenses: 3120 },
  { monthKey: 'aug', income: 3200, expenses: 2650 },
  { monthKey: 'sep', income: 3200, expenses: 2480 },
  { monthKey: 'oct', income: 3200, expenses: 2890 },
  { monthKey: 'nov', income: 3200, expenses: 2720 },
  { monthKey: 'dec', income: 3800, expenses: 3450 },
];

// Month abbreviations per language
const monthNames = {
  nl: {
    jan: 'Jan',
    feb: 'Feb',
    mar: 'Mrt',
    apr: 'Apr',
    may: 'Mei',
    jun: 'Jun',
    jul: 'Jul',
    aug: 'Aug',
    sep: 'Sep',
    oct: 'Okt',
    nov: 'Nov',
    dec: 'Dec',
  },
  en: {
    jan: 'Jan',
    feb: 'Feb',
    mar: 'Mar',
    apr: 'Apr',
    may: 'May',
    jun: 'Jun',
    jul: 'Jul',
    aug: 'Aug',
    sep: 'Sep',
    oct: 'Oct',
    nov: 'Nov',
    dec: 'Dec',
  },
};

export default function AnalyticsAnimation({
  isVisible,
}: {
  isVisible: boolean;
}) {
  const { t, language } = useLanguage();
  const [scrollX, setScrollX] = useState(0);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Get translated labels
  const anim = t.animations?.analytics;
  const months =
    monthNames[language as keyof typeof monthNames] || monthNames.en;
  const monthlyData = monthlyDataBase.map((d) => ({
    ...d,
    month: months[d.monthKey as keyof typeof months] || d.monthKey,
  }));

  useEffect(() => {
    if (isVisible) {
      const animate = (currentTime: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = currentTime;
        const delta = currentTime - lastTimeRef.current;
        lastTimeRef.current = currentTime;

        // Scroll at 40px per second
        setScrollX((prev) => {
          const barWidth = 48; // Width of each bar group
          const totalWidth = monthlyData.length * barWidth;
          const newX = prev + (delta / 1000) * 40;
          return newX % totalWidth;
        });

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      lastTimeRef.current = 0;
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  const maxValue = Math.max(
    ...monthlyData.flatMap((d) => [d.income, d.expenses])
  );

  // Double the data for seamless loop
  const doubledData = [...monthlyData, ...monthlyData];

  return (
    <div className='relative flex h-full w-full flex-col'>
      {/* Legend */}
      <div className='mb-3 flex items-center justify-center gap-4'>
        <div className='flex items-center gap-2 p-4'>
          <div className='h-3 w-3 rounded bg-emerald-500' />
          <span className='text-xs text-gray-600 dark:text-white/80'>
            {anim?.income || 'Income'}
          </span>
        </div>
        <div className='flex items-center gap-2'>
          <div className='h-3 w-3 rounded bg-rose-500' />
          <span className='text-xs text-gray-600 dark:text-white/80'>
            {anim?.expenses || 'Expenses'}
          </span>
        </div>
      </div>

      {/* Chart container */}
      <div className='relative flex-1 overflow-hidden'>
        {/* Left gradient */}
        <div className='pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-8 bg-gradient-to-r from-transparent to-transparent' />

        {/* Scrolling bars */}
        <div
          className='absolute bottom-6 flex items-end gap-1'
          style={{ transform: `translateX(-${scrollX}px)` }}
        >
          {doubledData.map((data, idx) => {
            const incomeHeight = (data.income / maxValue) * 140;
            const expenseHeight = (data.expenses / maxValue) * 140;

            return (
              <div key={idx} className='flex w-11 flex-col items-center'>
                {/* Bars */}
                <div className='flex items-end gap-1'>
                  <div
                    className='w-4 rounded-t bg-emerald-500 transition-all duration-200'
                    style={{ height: `${incomeHeight}px` }}
                  />
                  <div
                    className='w-4 rounded-t bg-rose-500 transition-all duration-200'
                    style={{ height: `${expenseHeight}px` }}
                  />
                </div>
                {/* Label */}
                <span className='mt-1 text-[10px] text-gray-500 dark:text-white/60'>
                  {data.month}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right gradient */}
        <div className='pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-8 bg-gradient-to-l from-transparent to-transparent' />
      </div>
    </div>
  );
}
