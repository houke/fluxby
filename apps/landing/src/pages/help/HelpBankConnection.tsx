import { useLanguage } from '../../contexts/LanguageContext';
import HelpAnimation from '../../components/help/HelpAnimation';

export default function HelpBankConnection() {
  const { t } = useLanguage();

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.bankConnection?.title || 'Je bankrekening koppelen'}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.bankConnection?.subtitle ||
          'Importeer je transacties van je bank om je financiën te volgen.'}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.bankConnection?.howItWorksTitle || 'Hoe het werkt'}
      </h2>
      <p>
        {t.helpCenter?.bankConnection?.howItWorksText ||
          'Fluxby gebruikt CSV imports om je banktransacties in de app te brengen. Deze aanpak zorgt ervoor dat je gegevens 100% lokaal op je apparaat blijven - geen cloud verbindingen nodig.'}
      </p>

      <h3>
        {t.helpCenter?.bankConnection?.step1Title ||
          'Stap 1: Exporteer vanuit je bank'}
      </h3>
      <p>
        {t.helpCenter?.bankConnection?.step1Text ||
          'Log in op je online bankieren en download je transactiegeschiedenis als CSV-bestand. De meeste banken bieden deze optie in de rekeningafschriften of transactiegeschiedenis sectie.'}
      </p>

      <h3>
        {t.helpCenter?.bankConnection?.step2Title ||
          'Stap 2: Importeren in Fluxby'}
      </h3>
      <p>
        {t.helpCenter?.bankConnection?.step2Text ||
          'Navigeer naar de Import pagina in Fluxby en sleep je CSV-bestand, of klik om te bladeren.'}
      </p>

      <HelpAnimation type='import' />

      <h3>
        {t.helpCenter?.bankConnection?.step3Title ||
          'Stap 3: Bekijken en categoriseren'}
      </h3>
      <p>
        {t.helpCenter?.bankConnection?.step3Text ||
          'Na het importeren categoriseert Fluxby automatisch je transacties op basis van je regels. Je kunt categorieën bekijken en aanpassen indien nodig.'}
      </p>

      <div className='not-prose rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20'>
        <h4 className='mb-2 flex items-center gap-2 text-blue-800 dark:text-blue-200'>
          <span>💡</span>
          {t.helpCenter?.bankConnection?.tipTitle || 'Pro tip'}
        </h4>
        <p className='m-0 text-blue-700 dark:text-blue-300'>
          {t.helpCenter?.bankConnection?.tipText ||
            'Stel auto-categorisatie regels in om transacties van specifieke winkels automatisch te taggen. Dit bespaart tijd bij toekomstige imports!'}
        </p>
      </div>
    </article>
  );
}
