import { useLanguage } from '../../contexts/LanguageContext';
import HelpAnimation from '../../components/help/HelpAnimation';

export default function HelpAccounts() {
  const { t } = useLanguage();

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.accounts?.title}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.accounts?.subtitle}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.accounts?.overviewTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.accounts?.overviewText}
      </p>

      <HelpAnimation type='accounts' />

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.accounts?.addTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.accounts?.addText}
      </p>
      <ol className='mt-4 list-inside list-decimal text-gray-600 dark:text-gray-400'>
        <li className='mb-2'>{t.helpCenter?.accounts?.addStep1}</li>
        <li className='mb-2'>{t.helpCenter?.accounts?.addStep2}</li>
        <li className='mb-2'>{t.helpCenter?.accounts?.addStep3}</li>
        <li>{t.helpCenter?.accounts?.addStep4}</li>
      </ol>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.accounts?.filterTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.accounts?.filterText}
      </p>

      <div className='not-prose mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20'>
        <h4 className='mb-2 flex items-center gap-2 text-yellow-800 dark:text-yellow-200'>
          <span>⚠️</span>
          {t.helpCenter?.accounts?.noteTitle}
        </h4>
        <p className='m-0 text-yellow-700 dark:text-yellow-300'>
          {t.helpCenter?.accounts?.noteText}
        </p>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.accounts?.balanceTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.accounts?.balanceText}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.accounts?.deleteTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.accounts?.deleteText}
      </p>

      <div className='not-prose mt-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20'>
        <h4 className='mb-2 flex items-center gap-2 text-red-800 dark:text-red-200'>
          <span>🗑️</span>
          {t.helpCenter?.accounts?.warningTitle}
        </h4>
        <p className='m-0 text-red-700 dark:text-red-300'>
          {t.helpCenter?.accounts?.warningText}
        </p>
      </div>
    </article>
  );
}
