import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  DashboardAnimation,
  TransactionsAnimation,
  BudgetsAnimation,
  AnalyticsAnimation,
  CategoriesAnimation,
  ImportAnimation,
} from './screenshot-animations';

// Map animation components to screenshot indices
const AnimationComponents = [
  DashboardAnimation, // 0: Dashboard
  TransactionsAnimation, // 1: Transactions
  BudgetsAnimation, // 2: Budgets
  AnalyticsAnimation, // 3: Analytics
  CategoriesAnimation, // 4: Categories
  ImportAnimation, // 5: Import
];

const Screenshots = () => {
  const { t } = useLanguage();
  const [visibleSections, setVisibleSections] = useState<Set<number>>(
    new Set()
  );
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sectionRefs.current.forEach((ref, index) => {
      if (!ref) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            setVisibleSections((prev) => {
              const next = new Set(prev);
              if (entry.isIntersecting) {
                next.add(index);
              } else {
                next.delete(index);
              }
              return next;
            });
          });
        },
        {
          rootMargin: '50px 0px',
          threshold: 0.1,
        }
      );

      observer.observe(ref);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  return (
    <section
      id='screenshots'
      className='section-padding bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800'
    >
      <div className='container mx-auto px-4'>
        <div className='mb-12 text-center md:mb-16'>
          <h2 className='mb-6 text-3xl font-black text-gray-900 dark:text-white sm:text-5xl lg:text-6xl'>
            {t.screenshots.title}{' '}
            <span className='text-fluxby-purple'>
              {t.screenshots.titleHighlight}
            </span>{' '}
            {t.screenshots.titleEnd}
          </h2>
          <p className='mx-auto max-w-3xl text-xl text-gray-600 dark:text-gray-300'>
            {t.screenshots.subtitle}
          </p>
        </div>

        <div className='space-y-20'>
          {t.screenshots.items.map((screenshot, index) => {
            const AnimationComponent = AnimationComponents[index];

            return (
              <div
                key={index}
                ref={(el) => {
                  sectionRefs.current[index] = el;
                }}
                className={`flex flex-col ${
                  index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                } items-center gap-12`}
              >
                {/* Text content */}
                <div className='flex-1'>
                  <h3 className='mb-4 text-2xl font-bold text-gray-900 dark:text-white sm:text-4xl'>
                    {screenshot.title}
                  </h3>
                  <p className='mb-6 text-lg leading-relaxed text-gray-600 dark:text-gray-300 sm:text-xl'>
                    {screenshot.description}
                  </p>
                  <ul className='space-y-3'>
                    {screenshot.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className='flex items-center gap-3 text-gray-700 dark:text-gray-300'
                      >
                        <span className='bg-fluxby-purple flex h-6 w-6 items-center justify-center rounded-full text-sm text-white'>
                          ✓
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Animation Container */}
                <div className='w-full flex-1'>
                  <div className='relative md:px-0'>
                    <div className='from-fluxby-purple to-fluxby-pink absolute inset-0 hidden scale-105 transform rounded-3xl bg-gradient-to-r opacity-20 blur-2xl dark:opacity-30 md:block'></div>
                    <div
                      className='relative -ml-8 aspect-[4/3] w-[calc(100%+4rem)] select-none overflow-hidden border-0 border-purple-200 bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-100 shadow-none dark:border-purple-700/30 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 md:ml-0 md:w-full md:rounded-2xl md:border md:shadow-2xl'
                      style={{ pointerEvents: 'none' }}
                    >
                      {AnimationComponent && (
                        <AnimationComponent
                          isVisible={visibleSections.has(index)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Screenshots;
