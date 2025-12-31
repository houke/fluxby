import { useLanguage } from '../../contexts/LanguageContext';
import HelpAnimation from '../../components/help/HelpAnimation';

export default function HelpFirstSteps() {
  const { t } = useLanguage();

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.firstSteps?.title || 'Eerste stappen met Fluxby'}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.firstSteps?.subtitle ||
          'Begin met Fluxby in slechts enkele minuten. Deze gids leidt je door de eerste installatie.'}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.firstSteps?.step1Title || 'Step 1: Log in & onboarding'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.firstSteps?.step1Text ||
          'When you open Fluxby for the first time, you will be guided through a short onboarding wizard. You can log in, set a password, and create your first profile (e.g., "Personal" or "Family").'}
      </p>

      <HelpAnimation type='profile' />

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.firstSteps?.step2Title ||
          'Step 2: Export from your bank'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.firstSteps?.step2Text ||
          'Log in to your online banking and export your transactions as a CSV file. Most banks offer this in the "Export" or "Download" section.'}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.firstSteps?.step3Title ||
          'Step 3: Import your transactions'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.firstSteps?.step3Text ||
          'Go to the Import page in Fluxby and drag your CSV file, or click to browse. Fluxby will automatically detect the format and import your transactions.'}
      </p>

      <HelpAnimation type='import' />

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.firstSteps?.step4Title ||
          'Step 4: Categorize transactions'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.firstSteps?.step4Text ||
          'After importing, go to the Transactions page to categorize your transactions. Click a transaction to assign a category. Fluxby learns from your choices and will auto-categorize similar transactions in the future.'}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.firstSteps?.step5Title ||
          'Step 5: Explore your dashboard'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.firstSteps?.step5Text ||
          'Now go to the Dashboard to see your financial overview! You will see your balance, spending per category, and recent transactions.'}
      </p>

      <div className='not-prose mt-8 rounded-lg border border-purple-200 bg-purple-50 p-6 dark:border-purple-800 dark:bg-purple-900/20'>
        <h3 className='mb-3 text-lg font-semibold text-purple-800 dark:text-purple-200'>
          {t.helpCenter?.firstSteps?.nextStepsTitle || 'Wat nu?'}
        </h3>
        <ul className='mb-0 list-inside list-disc text-purple-700 dark:text-purple-300'>
          <li className='mb-2'>
            {t.helpCenter?.firstSteps?.next1 ||
              'Stel budgetten in om je uitgavendoelen te volgen'}
          </li>
          <li className='mb-2'>
            {t.helpCenter?.firstSteps?.next2 ||
              'Maak aangepaste categorieën voor betere organisatie'}
          </li>
          <li className='mb-2'>
            {t.helpCenter?.firstSteps?.next3 ||
              'Voeg contacten toe in het Adresboek om bij te houden met wie je transacties doet'}
          </li>
          <li>
            {t.helpCenter?.firstSteps?.next4 ||
              'Importeer regelmatig transacties om je gegevens up-to-date te houden'}
          </li>
        </ul>
      </div>
    </article>
  );
}
