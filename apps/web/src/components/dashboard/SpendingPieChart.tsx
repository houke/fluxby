import React from 'react';
import { ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Currency } from '@/components/ui/currency';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Sector,
} from 'recharts';
import type { PieSectorDataItem } from 'recharts/types/polar/Pie';

interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  color: string;
  amount: number;
  percentage: number;
  [key: string]: unknown;
}

interface SpendingPieChartProps {
  categoryData: CategoryBreakdown[];
  activeCategoryIndex: number | null;
  setActiveCategoryIndex: (index: number | null) => void;
  pinnedCategoryIndex: number | null;
  setPinnedCategoryIndex: (index: number | null) => void;
  legendContainerRef: React.RefObject<HTMLDivElement | null>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any; // Using any for t as it's a large translations object
  navigate: (path: string) => void;
  suggestedPeriod: { label: string } | null;
  isViewingSuggestedPeriod: boolean;
  handleJumpToPeriod: () => void;
}

export function SpendingPieChart({
  categoryData,
  activeCategoryIndex,
  setActiveCategoryIndex,
  pinnedCategoryIndex,
  setPinnedCategoryIndex,
  legendContainerRef,
  t,
  navigate,
  suggestedPeriod,
  isViewingSuggestedPeriod,
  handleJumpToPeriod,
}: SpendingPieChartProps) {
  return (
    <Card
      className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
      onClick={() => {
        setActiveCategoryIndex(null);
        setPinnedCategoryIndex(null);
      }}
      data-onboarding='category-pie-chart'
    >
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle className='text-base sm:text-lg'>
          {t.dashboard.expensesByCategory}
        </CardTitle>
        <span
          className='min-h-7 text-lg font-semibold'
          style={{
            color:
              activeCategoryIndex !== null && categoryData[activeCategoryIndex]
                ? categoryData[activeCategoryIndex].color
                : 'transparent',
          }}
        >
          {activeCategoryIndex !== null && categoryData[activeCategoryIndex] ? (
            <Currency amount={categoryData[activeCategoryIndex].amount} />
          ) : (
            '\u00A0'
          )}
        </span>
      </CardHeader>
      <CardContent>
        <div className='flex h-[300px] items-center justify-center'>
          {categoryData.length > 0 ? (
            <ResponsiveContainer
              width='100%'
              height='100%'
              minHeight={1}
              minWidth={1}
            >
              <PieChart>
                <Pie
                  data={categoryData}
                  cx='50%'
                  cy='50%'
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey='amount'
                  nameKey='categoryName'
                  startAngle={90}
                  endAngle={-270}
                  isAnimationActive={false}
                  {...{
                    activeIndex:
                      activeCategoryIndex !== null
                        ? activeCategoryIndex
                        : undefined,
                  }}
                  activeShape={(props: PieSectorDataItem) => {
                    const {
                      cx,
                      cy,
                      innerRadius,
                      outerRadius,
                      startAngle,
                      endAngle,
                      fill,
                    } = props;
                    return (
                      <Sector
                        cx={cx}
                        cy={cy}
                        innerRadius={innerRadius}
                        outerRadius={(outerRadius || 100) + 15}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        fill={fill}
                        style={{ outline: 'none' }}
                      />
                    );
                  }}
                  onClick={(_, index) => {
                    // Toggle selection on click - grows the segment
                    if (pinnedCategoryIndex === index) {
                      setPinnedCategoryIndex(null);
                      setActiveCategoryIndex(null);
                    } else {
                      setPinnedCategoryIndex(index);
                      setActiveCategoryIndex(index);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      opacity={
                        activeCategoryIndex !== null &&
                        activeCategoryIndex !== index
                          ? 0.3
                          : 1
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => <Currency amount={value as number} />}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend
                  layout='vertical'
                  align='right'
                  verticalAlign='middle'
                  wrapperStyle={{
                    maxHeight: '280px',
                    overflowY: 'auto',
                  }}
                  content={() => (
                    <div ref={legendContainerRef} className='space-y-1'>
                      {categoryData.map((entry, index) => (
                        <div
                          key={index}
                          data-category-index={index}
                          className={`flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 ${
                            activeCategoryIndex === index
                              ? 'bg-muted'
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={(event) => {
                            event.stopPropagation();
                            // Toggle selection on click - grows the segment
                            if (pinnedCategoryIndex === index) {
                              setPinnedCategoryIndex(null);
                              setActiveCategoryIndex(null);
                            } else {
                              setPinnedCategoryIndex(index);
                              setActiveCategoryIndex(index);
                            }
                          }}
                        >
                          <div
                            className='h-3 w-3 flex-shrink-0 rounded-full'
                            style={{ backgroundColor: entry.color }}
                          />
                          <span
                            className={`truncate text-sm text-foreground ${
                              activeCategoryIndex === index ? 'font-bold' : ''
                            }`}
                          >
                            {entry.categoryName}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className='flex flex-col items-center justify-center py-8 text-center'>
              <ArrowDownRight className='mb-4 h-12 w-12 text-muted-foreground/50' />
              <p className='text-muted-foreground'>{t.dashboard.noExpenses}</p>
              <p className='mt-1 text-sm text-muted-foreground'>
                {t.dashboard.importTransactions}
              </p>
              <div className='mt-3 flex flex-wrap items-center justify-center gap-x-2'>
                <button
                  onClick={() => navigate('/import/')}
                  className='text-sm text-primary hover:underline'
                >
                  {t.dashboard.goToImport}
                </button>
                {suggestedPeriod && !isViewingSuggestedPeriod && (
                  <>
                    <span className='text-muted-foreground'>&middot;</span>
                    <button
                      onClick={handleJumpToPeriod}
                      className='text-sm text-primary hover:underline'
                    >
                      {(
                        t.dashboard?.jumpToPeriod || 'Jump to {period}'
                      ).replace('{period}', suggestedPeriod.label)}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
