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
        {t.helpCenter?.privacy?.howWorksTitle || 'Hoe het werkt'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.privacy?.howWorksText ||
          'Fluxby gebruikt een lokale SQLite database opgeslagen in je project folder. De API server draait op je computer op localhost:3001, en de webinterface op localhost:5173. Er worden geen externe verbindingen gemaakt.'}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.privacy?.dataLocationTitle ||
          'Waar worden mijn gegevens opgeslagen?'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.privacy?.dataLocationText ||
          'Je gegevens worden opgeslagen in een bestand genaamd fluxby.db in de data/ folder van je Fluxby installatie. Je kunt dit bestand back-uppen om je gegevens te bewaren, of verwijderen om opnieuw te beginnen.'}
      </p>

      <div className='not-prose mt-4 rounded-lg bg-gray-100 p-4 font-mono text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200'>
        <code>data/fluxby.db</code>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.privacy?.deleteDataTitle || 'Je gegevens verwijderen'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.privacy?.deleteDataText ||
          'Om al je financiële gegevens volledig te verwijderen, kun je de Gegevensbeheer sectie in Instellingen gebruiken, of simpelweg het fluxby.db bestand verwijderen. Er is geen account om te sluiten of gegevens om op te vragen - alles is lokaal.'}
      </p>

      <div className='not-prose mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20'>
        <h4 className='mb-2 flex items-center gap-2 font-medium text-yellow-800 dark:text-yellow-200'>
          <span>⚠️</span>
          {t.helpCenter?.privacy?.warningTitle || 'Belangrijk'}
        </h4>
        <p className='m-0 text-sm text-yellow-700 dark:text-yellow-300'>
          {t.helpCenter?.privacy?.warningText ||
            'Omdat alle gegevens lokaal worden opgeslagen, zorg ervoor dat je je fluxby.db bestand back-upt als je je gegevens wilt bewaren. Er is geen cloud backup!'}
        </p>
      </div>
    </article>
  );
}
