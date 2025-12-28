import { useLanguage } from '../../contexts/LanguageContext';
import HelpAnimation from '../../components/help/HelpAnimation';

export default function HelpAnalytics() {
  const { t } = useLanguage();

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.analytics?.title || 'Analyse & inzichten'}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.analytics?.subtitle ||
          'Begrijp je uitgavenpatronen met krachtige analyses en visualisaties.'}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.analytics?.dashboardTitle || 'Dashboard overzicht'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.analytics?.dashboardText ||
          'Het dashboard geeft je een snel overzicht van je financiën. Bekijk je totale saldo, maandelijkse uitgaven en recente transacties in één oogopslag.'}
      </p>

      <HelpAnimation type='dashboard' />

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.analytics?.categoriesTitle || 'Categorie uitsplitsing'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.analytics?.categoriesText ||
          'De categorie uitsplitsing toont hoe je uitgaven verdeeld zijn over verschillende categorieën. Gebruik de taartdiagram om snel te zien waar het meeste van je geld naartoe gaat.'}
      </p>

      <div className='mt-6 grid gap-4 md:grid-cols-2'>
        <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
          <h4 className='mb-2 font-semibold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.analytics?.pieChartTitle || 'Taartdiagram'}
          </h4>
          <p className='text-sm text-gray-600 dark:text-gray-400'>
            {t.helpCenter?.analytics?.pieChartText ||
              'Visuele uitsplitsing van uitgaven per categorie. Klik op een segment om transacties in die categorie te zien.'}
          </p>
        </div>
        <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
          <h4 className='mb-2 font-semibold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.analytics?.barChartTitle || 'Staafdiagram'}
          </h4>
          <p className='text-sm text-gray-600 dark:text-gray-400'>
            {t.helpCenter?.analytics?.barChartText ||
              'Vergelijk uitgaven bedragen per categorie. Ideaal om je grootste uitgavengebieden te identificeren.'}
          </p>
        </div>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.analytics?.trendsTitle || 'Maandelijkse trends'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.analytics?.trendsText ||
          'Volg hoe je uitgaven veranderen in de tijd met maandelijkse trendgrafieken. Vergelijk inkomsten met uitgaven per maand om je financiële ontwikkeling te begrijpen.'}
      </p>

      <HelpAnimation type='trends' />

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.analytics?.filtersTitle || 'Filters gebruiken'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.analytics?.filtersText ||
          'Alle analyses kunnen gefilterd worden op datumbereik en rekening. Gebruik de filteropties om te focussen op specifieke periodes of rekeningen.'}
      </p>
      <ul className='mt-4 list-inside list-disc text-gray-600 dark:text-gray-400'>
        <li className='mb-2'>
          {t.helpCenter?.analytics?.filter1 ||
            'Selecteer een datumbereik: Deze maand, Laatste 3 maanden, Dit jaar of aangepast bereik'}
        </li>
        <li className='mb-2'>
          {t.helpCenter?.analytics?.filter2 ||
            'Filter op rekening om analyses voor een specifieke bankrekening te zien'}
        </li>
        <li>
          {t.helpCenter?.analytics?.filter3 ||
            'Combineer filters om precies de weergave te krijgen die je nodig hebt'}
        </li>
      </ul>

      <div className='not-prose mt-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20'>
        <h4 className='mb-2 flex items-center gap-2 text-green-800 dark:text-green-200'>
          <span>📊</span>
          {t.helpCenter?.analytics?.tipTitle || 'Pro tip'}
        </h4>
        <p className='m-0 text-green-700 dark:text-green-300'>
          {t.helpCenter?.analytics?.tipText ||
            'Vergelijk dezelfde maand over verschillende jaren om rekening te houden met seizoensgebonden uitgavenpatronen zoals feestdagen of vakanties.'}
        </p>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.analytics?.exportTitle || 'Gegevens exporteren'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.analytics?.exportText ||
          'Je kunt je transactiegegevens en analyses exporteren voor gebruik in andere applicaties. Gebruik de Export functie in Instellingen om je gegevens als CSV te downloaden.'}
      </p>
    </article>
  );
}
