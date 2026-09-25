import { useLanguage } from '../../contexts/LanguageContext';
import { Heart, Gift, Github, Sparkles, Check, Coffee } from 'lucide-react';

const PricingContent = () => {
  const { t } = useLanguage();
  const pricingPage = t.legal?.pricingPage;

  const freeFeatures = [
    pricingPage?.feature1,
    pricingPage?.feature2,
    pricingPage?.feature3,
    pricingPage?.feature4,
    pricingPage?.feature5,
    pricingPage?.feature6,
    pricingPage?.feature7,
    pricingPage?.feature8,
  ];

  return (
    <>
      <p className='mb-8 text-lg text-gray-600 dark:text-gray-400'>
        {pricingPage?.intro}
      </p>

      {/* Free Forever Card */}
      <div className='not-prose mb-8 overflow-hidden rounded-3xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:border-purple-800 dark:from-purple-900/20 dark:to-pink-900/20'>
        <div className='bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Gift className='h-12 w-12 flex-shrink-0 text-white' />
              <div className='flex flex-col gap-0'>
                <h2 className='m-0 text-3xl leading-tight font-black text-white'>
                  {pricingPage?.freeTitle}
                </h2>
                <p className='m-0 text-lg font-medium text-white'>
                  {pricingPage?.freeSubtitle}
                </p>
              </div>
            </div>
            <div className='text-left sm:text-right'>
              <span className='text-5xl font-black text-white'>€0</span>
              <span className='text-xl text-white/90'>
                /{pricingPage?.perMonth}
              </span>
            </div>
          </div>
        </div>
        <div className='p-6'>
          <ul className='m-0 mb-6 list-none space-y-3 p-0'>
            {freeFeatures.map((feature, index) => (
              <li key={index} className='flex items-center gap-3'>
                <div className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30'>
                  <Check className='h-4 w-4 text-green-600 dark:text-green-400' />
                </div>
                <span className='text-gray-700 dark:text-gray-300'>
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Why Free Section */}
      <div className='not-prose group mb-8 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800/50'>
        <div className='mb-6 flex flex-col items-center gap-4'>
          <div className='flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-purple-100 transition-transform duration-300 group-hover:scale-110 dark:bg-purple-900/30'>
            <Heart className='h-7 w-7 text-purple-600 dark:text-purple-400' />
          </div>
          <h3 className='m-0 text-2xl font-bold text-gray-900 dark:text-white'>
            {pricingPage?.whyFreeTitle}
          </h3>
        </div>
        <p className='m-0 text-gray-600 dark:text-gray-400'>
          {pricingPage?.whyFreeText}
        </p>
      </div>

      {/* No Future Price Promise */}
      <div className='not-prose group mb-8 rounded-2xl border border-green-200 bg-green-50 p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-green-800 dark:bg-green-900/20'>
        <div className='mb-6 flex flex-col items-center gap-4'>
          <div className='flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-green-100 transition-transform duration-300 group-hover:scale-110 dark:bg-green-900/30'>
            <Sparkles className='h-7 w-7 text-green-600 dark:text-green-400' />
          </div>
          <h3 className='m-0 text-2xl font-bold text-gray-900 dark:text-white'>
            {pricingPage?.promiseTitle}
          </h3>
        </div>
        <p className='m-0 text-gray-600 dark:text-gray-400'>
          {pricingPage?.promiseText}
        </p>
      </div>

      {/* Support Section */}
      <div className='not-prose grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <a
          href='https://github.com/houke'
          target='_blank'
          rel='noopener noreferrer'
          className='group flex flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-white p-6 text-center no-underline transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800/50'
        >
          <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-amber-100 transition-transform duration-300 group-hover:scale-110 dark:bg-amber-900/30'>
            <Coffee className='h-6 w-6 text-amber-600 dark:text-amber-400' />
          </div>
          <div>
            <h4 className='text-lg font-semibold text-gray-900 dark:text-white'>
              {pricingPage?.coffeeTitle}
            </h4>
            <p className='text-sm text-gray-700 dark:text-gray-400'>
              {pricingPage?.coffeeDescription}
            </p>
          </div>
        </a>

        <a
          href='https://github.com/houke/fluxby'
          target='_blank'
          rel='noopener noreferrer'
          className='group flex flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-white p-6 text-center no-underline transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800/50'
        >
          <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-gray-100 transition-transform duration-300 group-hover:scale-110 dark:bg-gray-700'>
            <Github className='h-6 w-6 text-gray-700 dark:text-gray-300' />
          </div>
          <div>
            <h4 className='text-lg font-semibold text-gray-900 dark:text-white'>
              {pricingPage?.contributeTitle}
            </h4>
            <p className='text-sm text-gray-700 dark:text-gray-400'>
              {pricingPage?.contributeDescription}
            </p>
          </div>
        </a>
      </div>
    </>
  );
};

export default PricingContent;
