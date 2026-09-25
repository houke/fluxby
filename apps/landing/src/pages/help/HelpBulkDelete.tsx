import { useLanguage } from '../../contexts/LanguageContext';

export default function HelpBulkDelete() {
  const { t } = useLanguage();

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.bulkDelete?.title}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.bulkDelete?.subtitle}
      </p>

      <div className='mt-8 rounded-xl border border-purple-200 bg-purple-50 p-6 dark:border-purple-800 dark:bg-purple-950/30'>
        <h3 className='mt-0 mb-2 flex items-center gap-2 text-lg font-semibold text-purple-900 dark:text-purple-200'>
          <span>💡</span>
          {t.helpCenter?.bulkDelete?.tipTitle}
        </h3>
        <p className='mb-0 text-purple-800 dark:text-purple-300'>
          {t.helpCenter?.bulkDelete?.tipText}
        </p>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.bulkDelete?.selectionModeTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.bulkDelete?.selectionModeText}
      </p>
      <ol className='mt-4 list-inside list-decimal text-gray-600 dark:text-gray-400'>
        <li className='mb-2'>{t.helpCenter?.bulkDelete?.step1}</li>
        <li className='mb-2'>{t.helpCenter?.bulkDelete?.step2}</li>
        <li className='mb-2'>{t.helpCenter?.bulkDelete?.step3}</li>
      </ol>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.bulkDelete?.selectingTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.bulkDelete?.selectingText}
      </p>
      <div className='mt-6 grid gap-4 md:grid-cols-2'>
        <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
          <div className='mb-2 text-2xl'>☑️</div>
          <h3 className='mb-1 font-semibold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.bulkDelete?.singleSelect}
          </h3>
          <p className='mb-0 text-sm text-gray-600 dark:text-gray-400'>
            {t.helpCenter?.bulkDelete?.singleSelectDesc}
          </p>
        </div>
        <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
          <div className='mb-2 text-2xl'>⇧</div>
          <h3 className='mb-1 font-semibold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.bulkDelete?.rangeSelect}
          </h3>
          <p className='mb-0 text-sm text-gray-600 dark:text-gray-400'>
            {t.helpCenter?.bulkDelete?.rangeSelectDesc}
          </p>
        </div>
        <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
          <div className='mb-2 text-2xl'>✅</div>
          <h3 className='mb-1 font-semibold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.bulkDelete?.selectAll}
          </h3>
          <p className='mb-0 text-sm text-gray-600 dark:text-gray-400'>
            {t.helpCenter?.bulkDelete?.selectAllDesc}
          </p>
        </div>
        <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
          <div className='mb-2 text-2xl'>❌</div>
          <h3 className='mb-1 font-semibold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.bulkDelete?.deselectAll}
          </h3>
          <p className='mb-0 text-sm text-gray-600 dark:text-gray-400'>
            {t.helpCenter?.bulkDelete?.deselectAllDesc}
          </p>
        </div>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.bulkDelete?.deletingTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.bulkDelete?.deletingText}
      </p>
      <ol className='mt-4 list-inside list-decimal text-gray-600 dark:text-gray-400'>
        <li className='mb-2'>{t.helpCenter?.bulkDelete?.deleteStep1}</li>
        <li className='mb-2'>{t.helpCenter?.bulkDelete?.deleteStep2}</li>
        <li className='mb-2'>{t.helpCenter?.bulkDelete?.deleteStep3}</li>
      </ol>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.bulkDelete?.dateRangeTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.bulkDelete?.dateRangeText}
      </p>
      <ol className='mt-4 list-inside list-decimal text-gray-600 dark:text-gray-400'>
        <li className='mb-2'>{t.helpCenter?.bulkDelete?.dateRangeStep1}</li>
        <li className='mb-2'>{t.helpCenter?.bulkDelete?.dateRangeStep2}</li>
        <li className='mb-2'>{t.helpCenter?.bulkDelete?.dateRangeStep3}</li>
        <li className='mb-2'>{t.helpCenter?.bulkDelete?.dateRangeStep4}</li>
      </ol>

      <div className='not-prose mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20'>
        <h4 className='mb-2 flex items-center gap-2 text-amber-800 dark:text-amber-200'>
          <span>⚠️</span>
          {t.helpCenter?.bulkDelete?.cautionTitle}
        </h4>
        <p className='m-0 text-amber-700 dark:text-amber-300'>
          {t.helpCenter?.bulkDelete?.cautionText}
        </p>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.bulkDelete?.undoTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.bulkDelete?.undoText}
      </p>
      <ul className='mt-4 list-inside list-disc text-gray-600 dark:text-gray-400'>
        <li className='mb-2'>{t.helpCenter?.bulkDelete?.undoPoint1}</li>
        <li className='mb-2'>{t.helpCenter?.bulkDelete?.undoPoint2}</li>
        <li className='mb-2'>{t.helpCenter?.bulkDelete?.undoPoint3}</li>
      </ul>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.bulkDelete?.balanceTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.bulkDelete?.balanceText}
      </p>

      <div className='not-prose mt-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20'>
        <h4 className='mb-2 flex items-center gap-2 text-green-800 dark:text-green-200'>
          <span>✅</span>
          {t.helpCenter?.bulkDelete?.bestPracticeTitle}
        </h4>
        <p className='m-0 text-green-700 dark:text-green-300'>
          {t.helpCenter?.bulkDelete?.bestPracticeText}
        </p>
      </div>
    </article>
  );
}
