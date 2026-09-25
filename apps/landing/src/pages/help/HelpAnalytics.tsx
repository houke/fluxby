import { useLanguage } from '../../contexts/LanguageContext';
import HelpAnimation from '../../components/help/HelpAnimation';

export default function HelpAnalytics() {
  const { t } = useLanguage();

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.analytics?.title}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.analytics?.subtitle}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.analytics?.dashboardTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.analytics?.dashboardText}
      </p>

      <HelpAnimation type='dashboard' />

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.analytics?.categoriesTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.analytics?.categoriesText}
      </p>

      <div className='mt-6 grid gap-4 md:grid-cols-2'>
        <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
          <h4 className='mb-2 font-semibold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.analytics?.pieChartTitle}
          </h4>
          <p className='text-sm text-gray-600 dark:text-gray-400'>
            {t.helpCenter?.analytics?.pieChartText}
          </p>
        </div>
        <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
          <h4 className='mb-2 font-semibold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.analytics?.barChartTitle}
          </h4>
          <p className='text-sm text-gray-600 dark:text-gray-400'>
            {t.helpCenter?.analytics?.barChartText}
          </p>
        </div>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.analytics?.trendsTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.analytics?.trendsText}
      </p>

      <HelpAnimation type='trends' />

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.analytics?.filtersTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.analytics?.filtersText}
      </p>
      <ul className='mt-4 list-inside list-disc text-gray-600 dark:text-gray-400'>
        <li className='mb-2'>{t.helpCenter?.analytics?.filter1}</li>
        <li className='mb-2'>{t.helpCenter?.analytics?.filter2}</li>
        <li>{t.helpCenter?.analytics?.filter3}</li>
      </ul>

      <div className='not-prose mt-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20'>
        <h4 className='mb-2 flex items-center gap-2 text-green-800 dark:text-green-200'>
          <span>📊</span>
          {t.helpCenter?.analytics?.tipTitle}
        </h4>
        <p className='m-0 text-green-700 dark:text-green-300'>
          {t.helpCenter?.analytics?.tipText}
        </p>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.analytics?.exportTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.analytics?.exportText}
      </p>
    </article>
  );
}
