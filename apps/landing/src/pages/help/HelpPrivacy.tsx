import { useLanguage } from '../../contexts/LanguageContext';

export default function HelpPrivacy() {
  const { t } = useLanguage();

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.privacy?.title}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.privacy?.subtitle}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.privacy?.localFirstTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.privacy?.localFirstText}
      </p>

      <div className='not-prose mt-6 grid gap-4 md:grid-cols-3'>
        <div className='rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800/50'>
          <div className='mb-2 text-3xl'>🚫</div>
          <h4 className='font-semibold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.privacy?.noCloud}
          </h4>
          <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
            {t.helpCenter?.privacy?.noCloudDesc}
          </p>
        </div>
        <div className='rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800/50'>
          <div className='mb-2 text-3xl'>🔒</div>
          <h4 className='font-semibold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.privacy?.noTracking}
          </h4>
          <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
            {t.helpCenter?.privacy?.noTrackingDesc}
          </p>
        </div>
        <div className='rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800/50'>
          <div className='mb-2 text-3xl'>🗑️</div>
          <h4 className='font-semibold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.privacy?.fullControl}
          </h4>
          <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
            {t.helpCenter?.privacy?.fullControlDesc}
          </p>
        </div>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.privacy?.howWorksTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.privacy?.howWorksText}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.privacy?.dataLocationTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.privacy?.dataLocationText}
      </p>

      <div className='not-prose mt-4 rounded-lg bg-gray-100 p-4 font-mono text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200'>
        <code>{t.helpCenter?.privacy?.storageLabel}</code>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.privacy?.deleteDataTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.privacy?.deleteDataText}
      </p>

      <div className='not-prose mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20'>
        <h4 className='mb-2 flex items-center gap-2 font-medium text-yellow-800 dark:text-yellow-200'>
          <span>⚠️</span>
          {t.helpCenter?.privacy?.warningTitle}
        </h4>
        <p className='m-0 text-sm text-yellow-700 dark:text-yellow-300'>
          {t.helpCenter?.privacy?.warningText}
        </p>
      </div>
    </article>
  );
}
