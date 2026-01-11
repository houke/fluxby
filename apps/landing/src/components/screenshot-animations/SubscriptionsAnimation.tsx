import { useEffect, useState, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

// Subscription data structure
const subscriptionData = [
  {
    id: 1,
    name: 'Netflix',
    icon: '📺',
    amount: 15.99,
    frequency: 'monthly',
    nextDate: '15 jan',
    isConfirmed: true,
  },
  {
    id: 2,
    name: 'Spotify',
    icon: '🎵',
    amount: 9.99,
    frequency: 'monthly',
    nextDate: '3 jan',
    isConfirmed: true,
  },

  {
    id: 4,
    name: 'Gym',
    icon: '🏋️',
    amount: 29.99,
    frequency: 'monthly',
    nextDate: '1 feb',
    isConfirmed: true,
  },
  {
    id: 5,
    name: 'Disney+',
    icon: '✨',
    amount: 10.99,
    frequency: 'monthly',
    nextDate: '8 jan',
    isConfirmed: false,
    priceChange: 2.0,
  },
];

export default function SubscriptionsAnimation({
  isVisible,
}: {
  isVisible: boolean;
}) {
  const { t } = useLanguage();
  const anim = t.animations?.subscriptions;
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [showPriceAlert, setShowPriceAlert] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const animationRef = useRef<number | null>(null);
  const phaseRef = useRef(0);
  const timeRef = useRef(0);

  useEffect(() => {
    if (isVisible) {
      let lastTime = performance.now();

      const animate = (currentTime: number) => {
        const delta = currentTime - lastTime;
        lastTime = currentTime;
        timeRef.current += delta;

        // Animation phases:
        // 0-2s: Show subscriptions list
        // 2-4s: Highlight one subscription
        // 4-6s: Show price change alert
        // 6-7s: Confirm the subscription
        // 7-8s: Reset

        const phase = Math.floor(timeRef.current / 1000);

        if (phase !== phaseRef.current) {
          phaseRef.current = phase;

          if (phase === 2) {
            // Highlight the Disney+ entry (lookup by name so removing items won't break the index)
            setHighlightedIndex(
              subscriptionData.findIndex((s) => s.name === 'Disney+')
            );
          } else if (phase === 4) {
            setShowPriceAlert(true);
          } else if (phase === 6) {
            setConfirming(true);
          } else if (phase >= 8) {
            // Reset
            setHighlightedIndex(null);
            setShowPriceAlert(false);
            setConfirming(false);
            timeRef.current = 0;
            phaseRef.current = 0;
          }
        }

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      timeRef.current = 0;
      phaseRef.current = 0;
      setHighlightedIndex(null);
      setShowPriceAlert(false);
      setConfirming(false);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible]);

  // Calculate total monthly spend
  const totalMonthly = subscriptionData
    .filter(
      (s, index) => s.isConfirmed || (highlightedIndex === index && confirming)
    )
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className='flex h-full w-full flex-col p-4'>
      {/* Header with stats */}
      <div className='mb-4 rounded-xl bg-white/80 p-3 shadow-lg dark:bg-white/10 dark:shadow-none'>
        <div className='flex items-center justify-between'>
          <div>
            <div className='text-xs text-gray-500 dark:text-white/60'>
              {anim?.monthlyTotal || 'Monthly total'}
            </div>
            <div className='text-xl font-bold text-gray-900 dark:text-white'>
              €{totalMonthly.toFixed(2)}
            </div>
          </div>
          <div className='flex items-center gap-4'>
            <div className='text-center'>
              <div className='text-lg font-bold text-purple-600 dark:text-purple-400'>
                {
                  subscriptionData.filter(
                    (s, index) =>
                      s.isConfirmed ||
                      (highlightedIndex === index && confirming)
                  ).length
                }
              </div>
              <div className='text-xs text-gray-500 dark:text-white/60'>
                {anim?.active || 'Active'}
              </div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-bold text-amber-500'>
                {
                  subscriptionData.filter(
                    (s, index) =>
                      !s.isConfirmed &&
                      !(highlightedIndex === index && confirming)
                  ).length
                }
              </div>
              <div className='text-xs text-gray-500 dark:text-white/60'>
                {anim?.pending || 'Pending'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription cards */}
      <div className='flex-1 space-y-2 overflow-hidden'>
        {subscriptionData.map((sub, index) => {
          const isHighlighted = highlightedIndex === index;
          const showAlert = isHighlighted && showPriceAlert && sub.priceChange;
          const isBeingConfirmed = isHighlighted && confirming;

          return (
            <div
              key={sub.id}
              className={`rounded-lg bg-white/80 p-3 shadow-sm transition-all duration-300 dark:bg-white/10 dark:shadow-none ${
                isHighlighted ? 'scale-[1.02] ring-2 ring-purple-500' : ''
              }`}
            >
              <div className='flex items-center gap-3'>
                {/* Icon */}
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-xl dark:bg-purple-900/30'>
                  {sub.icon}
                </div>

                {/* Name and frequency */}
                <div className='flex-1'>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium text-gray-900 dark:text-white'>
                      {sub.name}
                    </span>
                    {(sub.isConfirmed || isBeingConfirmed) && (
                      <span className='flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[10px] text-white'>
                        ✓
                      </span>
                    )}
                  </div>
                  <div className='text-xs text-gray-500 dark:text-white/60'>
                    {anim?.frequencies?.[
                      sub.frequency as keyof typeof anim.frequencies
                    ] || sub.frequency}{' '}
                    · {anim?.nextPayment || 'Next'}: {sub.nextDate}
                  </div>
                </div>

                {/* Amount */}
                <div className='text-right'>
                  <div className='font-semibold text-gray-900 dark:text-white'>
                    €{sub.amount.toFixed(2)}
                  </div>
                  {showAlert && (
                    <div className='animate-pulse text-xs text-rose-500'>
                      ↑ €{sub.priceChange?.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>

              {/* Price change alert */}
              {showAlert && (
                <div className='mt-2 flex items-center justify-between rounded-lg bg-rose-50 p-2 text-xs dark:bg-rose-900/20'>
                  <span className='text-rose-600 dark:text-rose-400'>
                    {anim?.priceIncrease || 'Price increase detected'}
                  </span>
                  <button className='rounded bg-rose-500 px-2 py-1 text-white'>
                    {anim?.update || 'Update'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
