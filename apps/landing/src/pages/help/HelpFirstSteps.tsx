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
        {t.helpCenter?.firstSteps?.step1Title || 'Stap 1: Maak een profiel'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.firstSteps?.step1Text ||
          'Wanneer je Fluxby voor het eerst opent, wordt je gevraagd een profiel te maken. Geef het een naam (bijv. "Persoonlijk" of "Gezin") en je bent klaar om te beginnen.'}
      </p>

      <HelpAnimation type='profile' />

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.firstSteps?.step2Title ||
          'Stap 2: Exporteer vanuit je bank'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.firstSteps?.step2Text ||
          'Log in op de website of app van je bank en exporteer je transacties als CSV-bestand. De meeste banken bieden deze optie in hun "Export" of "Download" sectie.'}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.firstSteps?.step3Title ||
          'Stap 3: Importeer je transacties'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.firstSteps?.step3Text ||
          'Ga naar de Import pagina in Fluxby en sleep je CSV-bestand, of klik om te bladeren. Fluxby detecteert automatisch het formaat en importeert je transacties.'}
      </p>

      <HelpAnimation type='import' />

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.firstSteps?.step4Title ||
          'Stap 4: Categoriseer transacties'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.firstSteps?.step4Text ||
          'Na het importeren, ga naar de Transacties pagina om je transacties te categoriseren. Klik op een transactie om een categorie toe te wijzen. Fluxby leert van je keuzes en categoriseert vergelijkbare transacties automatisch in de toekomst.'}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.firstSteps?.step5Title || 'Stap 5: Verken je dashboard'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.firstSteps?.step5Text ||
          'Ga nu naar het Dashboard om je financiële overzicht te zien! Je ziet je saldo, uitgaven per categorie en recente transacties.'}
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
