import { useState } from 'react';
import { useDemoAnimationFrame } from '../../hooks/useAnimationActivity';
import { useLanguage } from '../../contexts/LanguageContext';

export default function BudgetsAnimation({
  isVisible,
}: {
  isVisible: boolean;
}) {
  const { t } = useLanguage();
  const anim = t.animations.budgets;
  const [progress, setProgress] = useState(0);
  const [isExceeded, setIsExceeded] = useState(false);

  useDemoAnimationFrame(isVisible, (delta) => {
    const nextProgress = (progress + (delta / 1000) * 20) % 120;
    setProgress(nextProgress);
    setIsExceeded(nextProgress >= 100);
  });

  const displayProgress = Math.min(progress, 100);
  const budgetAmount = 500;
  const spentAmount = (progress / 100) * budgetAmount;
  const remaining = budgetAmount - spentAmount;

  return (
    <div className='flex h-full w-full items-center justify-center p-6'>
      <div className='w-full max-w-xs rounded-xl bg-white/80 p-4 shadow-lg dark:bg-white/10 dark:shadow-none'>
        {/* Header */}
        <div className='mb-4 flex items-center gap-3'>
          <div
            className='flex h-10 w-10 items-center justify-center rounded-lg'
            style={{ backgroundColor: isExceeded ? '#EF444440' : '#34D39940' }}
          >
            <span className='text-xl'>🛒</span>
          </div>
          <div>
            <div className='text-sm font-semibold text-gray-900 dark:text-white'>
              {anim.categories.boodschappen}
            </div>
            <div className='text-xs text-gray-500 dark:text-white/60'>
              {anim.leftThisMonth}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className='mb-3 h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-white/20'>
          <div
            className='h-full rounded-full transition-all duration-100'
            style={{
              width: `${displayProgress}%`,
              backgroundColor: isExceeded ? '#EF4444' : '#34D399',
            }}
          />
        </div>

        {/* Stats */}
        <div className='flex items-center justify-between text-sm'>
          <div>
            <span className='text-gray-500 dark:text-white/60'>
              {anim.spent}:{' '}
            </span>
            <span
              className={`font-semibold ${isExceeded ? 'text-red-500 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}
            >
              €{spentAmount.toFixed(0)}
            </span>
          </div>
          <div>
            <span className='text-gray-500 dark:text-white/60'>
              {anim.budget}:{' '}
            </span>
            <span className='font-semibold text-gray-900 dark:text-white'>
              €{budgetAmount}
            </span>
          </div>
        </div>

        {/* Remaining */}
        <div className='mt-2 text-center'>
          {isExceeded ? (
            <span className='text-sm font-medium text-red-500 dark:text-red-400'>
              €{Math.abs(remaining).toFixed(0)} {anim.overBudget} ⚠️
            </span>
          ) : (
            <span className='text-sm text-gray-500 dark:text-white/60'>
              €{remaining.toFixed(0)} {anim.remaining}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
