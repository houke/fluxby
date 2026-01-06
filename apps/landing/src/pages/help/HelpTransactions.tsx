import { useLanguage } from '../../contexts/LanguageContext';
import HelpAnimation from '../../components/help/HelpAnimation';

export default function HelpTransactions() {
  const { t } = useLanguage();

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.transactions?.title || 'Transacties beheren'}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.transactions?.subtitle ||
          'Bekijk, zoek, filter en categoriseer je geïmporteerde transacties.'}
      </p>

      <div className='mt-8 rounded-xl border border-purple-200 bg-purple-50 p-6 dark:border-purple-800 dark:bg-purple-950/30'>
        <h3 className='mt-0 mb-2 flex items-center gap-2 text-lg font-semibold text-purple-900 dark:text-purple-200'>
          <span>💡</span>
          {t.helpCenter?.transactions?.tipTitle || 'Snelle tip'}
        </h3>
        <p className='mb-0 text-purple-800 dark:text-purple-300'>
          {t.helpCenter?.transactions?.tipText ||
            'Gebruik de zoekbalk en filters om snel specifieke transacties te vinden. Je kunt filteren op datum, categorie, bedrag en meer.'}
        </p>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.transactions?.viewingTitle || 'Transacties bekijken'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.transactions?.viewingText ||
          'De Transacties pagina toont al je geïmporteerde transacties in een overzichtelijke, sorteerbare tabel. Elke transactie toont:'}
      </p>
      <ul className='mt-4 list-inside list-disc text-gray-600 dark:text-gray-400'>
        <li>
          {t.helpCenter?.transactions?.field1 || 'Datum van de transactie'}
        </li>
        <li>
          {t.helpCenter?.transactions?.field2 ||
            'Omschrijving/naam tegenpartij'}
        </li>
        <li>
          {t.helpCenter?.transactions?.field3 ||
            'Categorie (indien toegewezen)'}
        </li>
        <li>
          {t.helpCenter?.transactions?.field4 ||
            'Bedrag (inkomsten in groen, uitgaven in rood)'}
        </li>
      </ul>

      <HelpAnimation type='transactions' />

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.transactions?.filteringTitle || 'Transacties filteren'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.transactions?.filteringText ||
          'Gebruik het filterpaneel om je transacties te verfijnen:'}
      </p>
      <div className='mt-6 grid gap-4 md:grid-cols-2'>
        <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
          <div className='mb-2 text-2xl'>📅</div>
          <h3 className='mb-1 font-semibold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.transactions?.dateFilter || 'Datumbereik'}
          </h3>
          <p className='mb-0 text-sm text-gray-600 dark:text-gray-400'>
            {t.helpCenter?.transactions?.dateFilterDesc ||
              'Filter op specifieke maand, jaar of aangepast datumbereik.'}
          </p>
        </div>
        <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
          <div className='mb-2 text-2xl'>🏷️</div>
          <h3 className='mb-1 font-semibold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.transactions?.categoryFilter || 'Categorie'}
          </h3>
          <p className='mb-0 text-sm text-gray-600 dark:text-gray-400'>
            {t.helpCenter?.transactions?.categoryFilterDesc ||
              'Toon alleen transacties van specifieke categorieën.'}
          </p>
        </div>
        <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
          <div className='mb-2 text-2xl'>💰</div>
          <h3 className='mb-1 font-semibold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.transactions?.typeFilter || 'Transactietype'}
          </h3>
          <p className='mb-0 text-sm text-gray-600 dark:text-gray-400'>
            {t.helpCenter?.transactions?.typeFilterDesc ||
              'Filter op inkomsten, uitgaven of alle transacties.'}
          </p>
        </div>
        <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
          <div className='mb-2 text-2xl'>🔍</div>
          <h3 className='mb-1 font-semibold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.transactions?.searchFilter || 'Zoeken'}
          </h3>
          <p className='mb-0 text-sm text-gray-600 dark:text-gray-400'>
            {t.helpCenter?.transactions?.searchFilterDesc ||
              'Zoek op omschrijving, naam tegenpartij of notities.'}
          </p>
        </div>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.transactions?.categorizingTitle ||
          'Transacties categoriseren'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.transactions?.categorizingText ||
          'Je kunt categorieën aan transacties toewijzen op twee manieren:'}
      </p>
      <ol className='mt-4 list-inside list-decimal text-gray-600 dark:text-gray-400'>
        <li className='mb-2'>
          <strong>
            {t.helpCenter?.transactions?.manualMethod || 'Handmatig'}
          </strong>
          :{' '}
          {t.helpCenter?.transactions?.manualMethodDesc ||
            'Klik op een transactie om te bewerken en selecteer een categorie uit de dropdown.'}
        </li>
        <li>
          <strong>
            {t.helpCenter?.transactions?.autoMethod ||
              'Automatisch categoriseren'}
          </strong>
          :{' '}
          {t.helpCenter?.transactions?.autoMethodDesc ||
            'Maak regels die automatisch categorieën toewijzen op basis van de transactieomschrijving.'}
        </li>
      </ol>

      <div className='not-prose mt-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20'>
        <h4 className='mb-2 flex items-center gap-2 text-green-800 dark:text-green-200'>
          <span>✅</span>
          {t.helpCenter?.transactions?.proTip || 'Pro tip'}
        </h4>
        <p className='m-0 text-green-700 dark:text-green-300'>
          {t.helpCenter?.transactions?.proTipText ||
            'Wanneer je een transactie categoriseert, kan Fluxby een auto-categorisatieregel voor je maken. Dit bespaart tijd bij toekomstige imports van dezelfde winkel!'}
        </p>
      </div>
    </article>
  );
}
