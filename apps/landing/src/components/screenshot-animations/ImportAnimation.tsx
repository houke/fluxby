import { useEffect, useState, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function ImportAnimation({ isVisible }: { isVisible: boolean }) {
  const { t } = useLanguage();
  const anim = t.animations?.import;
  const [phase, setPhase] = useState<'drop' | 'processing' | 'complete'>(
    'drop'
  );
  const [dropProgress, setDropProgress] = useState(0); // 0-100 for drop animation
  const [processProgress, setProcessProgress] = useState(0); // 0-100 for processing
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isVisible) {
      const animate = (currentTime: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = currentTime;
        const delta = currentTime - lastTimeRef.current;
        lastTimeRef.current = currentTime;

        if (phase === 'drop') {
          setDropProgress((prev) => {
            const newProgress = prev + (delta / 1000) * 100; // 1 second drop
            if (newProgress >= 100) {
              setPhase('processing');
              return 100;
            }
            return newProgress;
          });
        } else if (phase === 'processing') {
          setProcessProgress((prev) => {
            const newProgress = prev + (delta / 1000) * 25; // 4 seconds to process
            if (newProgress >= 100) {
              setPhase('complete');
              return 100;
            }
            return newProgress;
          });
        } else if (phase === 'complete') {
          // Wait a moment then reset
          setTimeout(() => {
            setPhase('drop');
            setDropProgress(0);
            setProcessProgress(0);
          }, 1500);
        }

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
  }, [isVisible, phase]);

  return (
    <div className='flex h-full w-full flex-col items-center justify-center p-4'>
      {/* Upload zone */}
      <div className='relative flex h-40 w-full max-w-xs flex-col items-center justify-center rounded-xl border-2 border-dashed border-purple-300 bg-white/60 dark:border-white/30 dark:bg-white/5'>
        {/* Dropping file animation */}
        {phase === 'drop' && (
          <div
            className='absolute transition-all duration-100'
            style={{
              top: `${-20 + dropProgress * 0.6}%`,
              opacity: dropProgress < 90 ? 1 : 1 - (dropProgress - 90) / 10,
            }}
          >
            {/* CSV File icon */}
            <div className='flex flex-col items-center'>
              <div className='relative'>
                <div className='flex h-16 w-14 flex-col rounded-lg bg-white shadow-lg'>
                  <div className='flex h-4 items-center rounded-t-lg bg-emerald-500 px-2'>
                    <span className='text-[8px] font-bold text-white'>CSV</span>
                  </div>
                  <div className='flex-1 p-1.5'>
                    <div className='mb-1 h-1 w-full rounded bg-gray-200' />
                    <div className='mb-1 h-1 w-3/4 rounded bg-gray-200' />
                    <div className='mb-1 h-1 w-full rounded bg-gray-200' />
                    <div className='h-1 w-2/3 rounded bg-gray-200' />
                  </div>
                </div>
              </div>
              <span className='mt-2 text-xs text-gray-600 dark:text-white/80'>
                transacties.csv
              </span>
            </div>
          </div>
        )}

        {/* Upload icon when not dropping */}
        {phase !== 'drop' && (
          <div className='flex flex-col items-center'>
            <div className='mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-white/10'>
              {phase === 'complete' ? (
                <svg
                  className='h-6 w-6 text-emerald-500 dark:text-emerald-400'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 13l4 4L19 7'
                  />
                </svg>
              ) : (
                <svg
                  className='h-6 w-6 text-gray-500 dark:text-white/60'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
                  />
                </svg>
              )}
            </div>
            <span className='text-sm text-gray-700 dark:text-white/80'>
              {phase === 'complete'
                ? `47 ${anim?.transactionsImported || 'transactions imported'}!`
                : `${anim?.uploading || 'Uploading...'}`}
            </span>
          </div>
        )}

        {/* Progress bar */}
        {phase === 'processing' && (
          <div className='absolute right-4 bottom-4 left-4'>
            <div className='mb-1 flex justify-between text-xs text-gray-500 dark:text-white/60'>
              <span>{anim?.processing || 'Processing...'}</span>
              <span>{Math.round(processProgress)}%</span>
            </div>
            <div className='h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-white/20'>
              <div
                className='h-full rounded-full bg-purple-500 transition-all duration-100 dark:bg-purple-400'
                style={{ width: `${processProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Status text */}
      <div className='mt-4 text-center'>
        {phase === 'drop' && (
          <span className='text-xs text-gray-500 dark:text-white/60'>
            {anim?.dragHint || 'Drag your ING CSV file here'}
          </span>
        )}
        {phase === 'processing' && (
          <span className='text-xs text-gray-500 dark:text-white/60'>
            {anim?.detecting || 'Detecting duplicates...'}
          </span>
        )}
        {phase === 'complete' && (
          <span className='text-xs text-emerald-600 dark:text-emerald-400'>
            ✓ {anim?.done || 'Import complete!'}
          </span>
        )}
      </div>
    </div>
  );
}
