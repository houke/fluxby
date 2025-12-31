import { useLanguage } from '../../contexts/LanguageContext';

export default function HelpPrivacy() {
  const { t } = useLanguage();

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.privacy?.title || 'Je gegevens & privacy'}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.privacy?.subtitle ||
          'Fluxby is ontworpen met privacy voorop. Je financiële gegevens blijven op je apparaat.'}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.privacy?.localFirstTitle || '100% Lokaal'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.privacy?.localFirstText ||
          'Anders dan de meeste finance apps, draait Fluxby volledig op je computer. Je transactiegegevens, budgetten en categorieën worden opgeslagen in een lokale SQLite database - ze verlaten nooit je apparaat.'}
      </p>

      <div className='not-prose mt-6 grid gap-4 md:grid-cols-3'>
        <div className='rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800/50'>
          <div className='mb-2 text-3xl'>🚫</div>
          <h4 className='font-semibold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.privacy?.noCloud || 'Geen cloud opslag'}
          </h4>
          <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
            {t.helpCenter?.privacy?.noCloudDesc ||
              'Gegevens blijven op je computer'}
          </p>
        </div>
        <div className='rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800/50'>
          <div className='mb-2 text-3xl'>🔒</div>
          <h4 className='font-semibold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.privacy?.noTracking || 'Geen tracking'}
          </h4>
          <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
            {t.helpCenter?.privacy?.noTrackingDesc ||
              'We analyseren nooit je uitgaven'}
          </p>
        </div>
        <div className='rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800/50'>
          <div className='mb-2 text-3xl'>🗑️</div>
          <h4 className='font-semibold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.privacy?.fullControl || 'Volledige controle'}
          </h4>
          <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
            {t.helpCenter?.privacy?.fullControlDesc ||
              'Verwijder alle gegevens wanneer je wilt'}
          </p>
        </div>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.privacy?.howWorksTitle || 'How it works'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.privacy?.howWorksText ||
          'Fluxby runs entirely in your browser using SQLite with WebAssembly. Your data is stored locally in your browser (OPFS) or on your device when using the desktop app. No servers required, no external connections made.'}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.privacy?.dataLocationTitle || 'Where is my data stored?'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.privacy?.dataLocationText ||
          'Your data is stored in your browser using OPFS (Origin Private File System) for the web app, or in your local app data folder for the desktop app. Your data never leaves your device.'}
      </p>

      <div className='not-prose mt-4 rounded-lg bg-gray-100 p-4 font-mono text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200'>
        <code>Browser OPFS / Desktop App Data</code>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.privacy?.deleteDataTitle || 'Deleting your data'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.privacy?.deleteDataText ||
          "To completely remove all your financial data, you can use the Data Management section in Settings, or clear your browser data. There's no account to close or data to request - it's all local."}
      </p>

      <div className='not-prose mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20'>
        <h4 className='mb-2 flex items-center gap-2 font-medium text-yellow-800 dark:text-yellow-200'>
          <span>⚠️</span>
          {t.helpCenter?.privacy?.warningTitle || 'Important'}
        </h4>
        <p className='m-0 text-sm text-yellow-700 dark:text-yellow-300'>
          {t.helpCenter?.privacy?.warningText ||
            'Since all data is stored locally, consider exporting your data regularly if you want to preserve it. You can sync between devices using the peer-to-peer sync feature.'}
        </p>
      </div>
    </article>
  );
}
