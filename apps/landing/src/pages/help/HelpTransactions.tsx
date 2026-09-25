import { useLanguage } from '../../contexts/LanguageContext';
import HelpAnimation from '../../components/help/HelpAnimation';

export default function HelpTransactions() {
  const { t } = useLanguage();

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.transactions?.title}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.transactions?.subtitle}
      </p>

      <div className='mt-8 rounded-xl border border-purple-200 bg-purple-50 p-6 dark:border-purple-800 dark:bg-purple-950/30'>
        <h3 className='mt-0 mb-2 flex items-center gap-2 text-lg font-semibold text-purple-900 dark:text-purple-200'>
          <span>💡</span>
          {t.helpCenter?.transactions?.tipTitle}
        </h3>
        <p className='mb-0 text-purple-800 dark:text-purple-300'>
          {t.helpCenter?.transactions?.tipText}
        </p>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.transactions?.viewingTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.transactions?.viewingText}
      </p>
      <ul className='mt-4 list-inside list-disc text-gray-600 dark:text-gray-400'>
        <li>{t.helpCenter?.transactions?.field1}</li>
        <li>{t.helpCenter?.transactions?.field2}</li>
        <li>{t.helpCenter?.transactions?.field3}</li>
        <li>{t.helpCenter?.transactions?.field4}</li>
      </ul>

      <HelpAnimation type='transactions' />

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.transactions?.filteringTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.transactions?.filteringText}
      </p>
      <div className='mt-6 grid gap-4 md:grid-cols-2'>
        <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
          <div className='mb-2 text-2xl'>📅</div>
          <h3 className='mb-1 font-semibold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.transactions?.dateFilter}
          </h3>
          <p className='mb-0 text-sm text-gray-600 dark:text-gray-400'>
            {t.helpCenter?.transactions?.dateFilterDesc}
          </p>
        </div>
        <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
          <div className='mb-2 text-2xl'>🏷️</div>
          <h3 className='mb-1 font-semibold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.transactions?.categoryFilter}
          </h3>
          <p className='mb-0 text-sm text-gray-600 dark:text-gray-400'>
            {t.helpCenter?.transactions?.categoryFilterDesc}
          </p>
        </div>
        <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
          <div className='mb-2 text-2xl'>💰</div>
          <h3 className='mb-1 font-semibold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.transactions?.typeFilter}
          </h3>
          <p className='mb-0 text-sm text-gray-600 dark:text-gray-400'>
            {t.helpCenter?.transactions?.typeFilterDesc}
          </p>
        </div>
        <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
          <div className='mb-2 text-2xl'>🔍</div>
          <h3 className='mb-1 font-semibold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.transactions?.searchFilter}
          </h3>
          <p className='mb-0 text-sm text-gray-600 dark:text-gray-400'>
            {t.helpCenter?.transactions?.searchFilterDesc}
          </p>
        </div>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.transactions?.categorizingTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.transactions?.categorizingText}
      </p>
      <ol className='mt-4 list-inside list-decimal text-gray-600 dark:text-gray-400'>
        <li className='mb-2'>
          <strong>{t.helpCenter?.transactions?.manualMethod}</strong>:{' '}
          {t.helpCenter?.transactions?.manualMethodDesc}
        </li>
        <li>
          <strong>{t.helpCenter?.transactions?.autoMethod}</strong>:{' '}
          {t.helpCenter?.transactions?.autoMethodDesc}
        </li>
      </ol>

      <div className='not-prose mt-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20'>
        <h4 className='mb-2 flex items-center gap-2 text-green-800 dark:text-green-200'>
          <span>✅</span>
          {t.helpCenter?.transactions?.proTip}
        </h4>
        <p className='m-0 text-green-700 dark:text-green-300'>
          {t.helpCenter?.transactions?.proTipText}
        </p>
      </div>
    </article>
  );
}
