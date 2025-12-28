import { useLanguage } from '../../contexts/LanguageContext';
import HelpAnimation from '../../components/help/HelpAnimation';

export default function HelpAccounts() {
  const { t } = useLanguage();

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.accounts?.title || 'Rekeningen beheren'}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.accounts?.subtitle ||
          'Houd meerdere bankrekeningen bij en bekijk geconsolideerde saldi.'}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.accounts?.overviewTitle || 'Rekeningen overzicht'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.accounts?.overviewText ||
          'De Rekeningen pagina toont al je gekoppelde bankrekeningen met hun huidige saldi. Je kunt in één oogopslag zien hoeveel geld je hebt op al je rekeningen.'}
      </p>

      <HelpAnimation type='accounts' />

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.accounts?.addTitle || 'Een rekening toevoegen'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.accounts?.addText ||
          'Wanneer je een CSV-bestand van je bank importeert, detecteert Fluxby automatisch de rekening (IBAN) en maakt deze aan indien nodig. Je kunt ook handmatig een rekening toevoegen:'}
      </p>
      <ol className='mt-4 list-inside list-decimal text-gray-600 dark:text-gray-400'>
        <li className='mb-2'>
          {t.helpCenter?.accounts?.addStep1 ||
            'Ga naar Instellingen > Rekeningen'}
        </li>
        <li className='mb-2'>
          {t.helpCenter?.accounts?.addStep2 || 'Klik op "Rekening toevoegen"'}
        </li>
        <li className='mb-2'>
          {t.helpCenter?.accounts?.addStep3 ||
            'Voer de rekeningnaam en IBAN in'}
        </li>
        <li>
          {t.helpCenter?.accounts?.addStep4 ||
            'Klik op Opslaan om de rekening toe te voegen'}
        </li>
      </ol>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.accounts?.filterTitle || 'Filteren op rekening'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.accounts?.filterText ||
          'Overal in Fluxby kun je transacties filteren op rekening. Gebruik de rekening filter dropdown in de header om transacties van een specifieke rekening te zien, of selecteer "Alle rekeningen" om alles gecombineerd te zien.'}
      </p>

      <div className='not-prose mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20'>
        <h4 className='mb-2 flex items-center gap-2 text-yellow-800 dark:text-yellow-200'>
          <span>⚠️</span>
          {t.helpCenter?.accounts?.noteTitle || 'Let op'}
        </h4>
        <p className='m-0 text-yellow-700 dark:text-yellow-300'>
          {t.helpCenter?.accounts?.noteText ||
            'Als je meerdere rekeningen hebt, importeer dan CSV-bestanden van allemaal om een compleet beeld van je financiën te krijgen.'}
        </p>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.accounts?.balanceTitle || 'Saldi begrijpen'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.accounts?.balanceText ||
          'Rekening saldi worden berekend op basis van je geïmporteerde transacties. Het getoonde saldo is de som van alle transacties voor die rekening. Voor het meest accurate saldo, importeer regelmatig al je transacties.'}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.accounts?.deleteTitle || 'Een rekening verwijderen'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.accounts?.deleteText ||
          'Het verwijderen van een rekening verwijdert ook alle transacties die bij die rekening horen. Deze actie kan niet ongedaan worden gemaakt. Zorg ervoor dat je echt alle gegevens voor deze rekening wilt verwijderen voordat je doorgaat.'}
      </p>

      <div className='not-prose mt-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20'>
        <h4 className='mb-2 flex items-center gap-2 text-red-800 dark:text-red-200'>
          <span>🗑️</span>
          {t.helpCenter?.accounts?.warningTitle || 'Waarschuwing'}
        </h4>
        <p className='m-0 text-red-700 dark:text-red-300'>
          {t.helpCenter?.accounts?.warningText ||
            'Het verwijderen van een rekening verwijdert permanent alle transacties. Overweeg je gegevens eerst te exporteren als je deze later nog nodig zou kunnen hebben.'}
        </p>
      </div>
    </article>
  );
}
