import { useLanguage } from '../../contexts/LanguageContext';
import HelpAnimation from '../../components/help/HelpAnimation';

export default function HelpAddressBook() {
  const { t } = useLanguage();

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.addressBook?.title || 'Adresboek beheren'}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.addressBook?.subtitle ||
          'Organiseer je contacten en verbeter transactie categorisatie met automatische naam opschoning.'}
      </p>

      <div className='mt-8 rounded-xl border border-purple-200 bg-purple-50 p-6 dark:border-purple-800 dark:bg-purple-950/30'>
        <h3 className='mb-2 mt-0 flex items-center gap-2 text-lg font-semibold text-purple-900 dark:text-purple-200'>
          <span>💡</span>
          {t.helpCenter?.addressBook?.tipTitle || 'Snelle tip'}
        </h3>
        <p className='mb-0 text-purple-800 dark:text-purple-300'>
          {t.helpCenter?.addressBook?.tipText ||
            'Het adresboek wordt automatisch gevuld wanneer je transacties importeert. Gebruik de naam opschoning regels om verwarrende banknamen op te schonen.'}
        </p>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.addressBook?.whatAreTitle || 'Wat is het adresboek?'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.addressBook?.whatAreText ||
          'Het adresboek slaat automatisch tegenpartijen op van je transacties gebaseerd op IBAN en naam. Het helpt je om contacten te organiseren, verwarrende banknamen op te schonen, en uitgaven per merchant te volgen.'}
      </p>

      <HelpAnimation type='addressBook' />

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.addressBook?.featuresTitle || 'Belangrijke functies'}
      </h2>

      <h3 className='mt-8 text-xl font-semibold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.addressBook?.autoExtractionTitle ||
          'Automatische extractie'}
      </h3>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.addressBook?.autoExtractionText ||
          'Wanneer je CSV bestanden importeert, detecteert Fluxby automatisch unieke tegenpartijen en voegt ze toe aan je adresboek. Dit gebeurt gebaseerd op IBAN nummers en namen.'}
      </p>

      <h3 className='mt-8 text-xl font-semibold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.addressBook?.nameCleanupTitle || 'Naam opschoning'}
      </h3>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.addressBook?.nameCleanupText ||
          'Veel banken voegen technische informatie toe aan transactienamen (zoals "via Mollie" of "via Buckaroo"). Het adresboek helpt je om automatische regels te maken die deze informatie verwijderen voor schonere namen.'}
      </p>

      <h3 className='mt-8 text-xl font-semibold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.addressBook?.sharedIbansTitle || 'Gedeelde IBANs'}
      </h3>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.addressBook?.sharedIbansText ||
          'Sommige betaalproviders gebruiken gedeelde IBANs voor meerdere merchants. Het adresboek helpt je om te beslissen of je deze wilt samenvoegen als dezelfde merchant of apart houden als verschillende bedrijven.'}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.addressBook?.managingTitle || 'Contacten beheren'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.addressBook?.managingText ||
          'Je kunt handmatig contacten toevoegen, bestaande contacten bewerken, of naam opschoning regels configureren:'}
      </p>
      <ul className='mt-4 list-inside list-disc text-gray-600 dark:text-gray-400'>
        <li>
          {t.helpCenter?.addressBook?.manage1 ||
            'Klik op een contact om details te bekijken'}
        </li>
        <li>
          {t.helpCenter?.addressBook?.manage2 ||
            'Gebruik de zoekbalk om contacten te vinden'}
        </li>
        <li>
          {t.helpCenter?.addressBook?.manage3 ||
            'Maak naam opschoning regels voor betere categorisatie'}
        </li>
        <li>
          {t.helpCenter?.addressBook?.manage4 ||
            'Bekijk transactiegeschiedenis per contact'}
        </li>
      </ul>
    </article>
  );
}
