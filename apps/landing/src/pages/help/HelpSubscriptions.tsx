import { useLanguage } from '../../contexts/LanguageContext';
import HelpAnimation from '../../components/help/HelpAnimation';

export default function HelpSubscriptions() {
  const { t } = useLanguage();

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.subscriptions?.title || 'Abonnementen beheren'}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.subscriptions?.subtitle ||
          'Houd al je terugkerende betalingen bij en krijg meldingen bij prijswijzigingen.'}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.subscriptions?.whatIsTitle ||
          'Wat zijn abonnementen in Fluxby?'}
      </h2>
      <p>
        {t.helpCenter?.subscriptions?.whatIsText ||
          'Fluxby detecteert automatisch terugkerende betalingen in je transacties, zoals streaming diensten, sportschool abonnementen en nutsvoorzieningen. Je krijgt een overzicht van al je maandelijkse vaste lasten en wordt gewaarschuwd wanneer prijzen veranderen.'}
      </p>

      <HelpAnimation type='subscriptions' />

      <h2>
        {t.helpCenter?.subscriptions?.detectionTitle ||
          'Hoe werkt automatische detectie?'}
      </h2>
      <p>
        {t.helpCenter?.subscriptions?.detectionText ||
          'Wanneer je transacties importeert, analyseert Fluxby de patronen in je betalingen. Als een betaling regelmatig terugkeert (wekelijks, maandelijks, per kwartaal of jaarlijks), wordt deze automatisch herkend als een abonnement.'}
      </p>
      <ol>
        <li>
          {t.helpCenter?.subscriptions?.step1 ||
            'Importeer je transacties via de Import pagina'}
        </li>
        <li>
          {t.helpCenter?.subscriptions?.step2 ||
            'Fluxby analyseert automatisch terugkerende patronen'}
        </li>
        <li>
          {t.helpCenter?.subscriptions?.step3 ||
            'Bevestig gedetecteerde abonnementen of wijs ze af'}
        </li>
        <li>
          {t.helpCenter?.subscriptions?.step4 ||
            'Bekijk je totale maandelijkse vaste lasten in het overzicht'}
        </li>
      </ol>

      <h2>
        {t.helpCenter?.subscriptions?.confirmTitle ||
          'Abonnementen bevestigen of afwijzen'}
      </h2>
      <p>
        {t.helpCenter?.subscriptions?.confirmText ||
          'Niet alle gedetecteerde patronen zijn daadwerkelijk abonnementen. Je kunt zelf aangeven welke terugkerende betalingen je als abonnement wilt bijhouden:'}
      </p>
      <ul>
        <li>
          <strong>
            {t.helpCenter?.subscriptions?.confirmButton || 'Bevestigen'}
          </strong>
          :{' '}
          {t.helpCenter?.subscriptions?.confirmButtonText ||
            'Het patroon wordt toegevoegd aan je actieve abonnementen'}
        </li>
        <li>
          <strong>
            {t.helpCenter?.subscriptions?.dismissButton || 'Afwijzen'}
          </strong>
          :{' '}
          {t.helpCenter?.subscriptions?.dismissButtonText ||
            'Het patroon wordt genegeerd en niet meer getoond'}
        </li>
      </ul>

      <div className='not-prose rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20'>
        <h4 className='mb-2 flex items-center gap-2 text-amber-800 dark:text-amber-200'>
          <span>💡</span>
          {t.helpCenter?.subscriptions?.tipTitle || 'Tip'}
        </h4>
        <p className='m-0 text-amber-700 dark:text-amber-300'>
          {t.helpCenter?.subscriptions?.tipText ||
            'Bevestig alleen echte abonnementen die je wilt volgen. Dit houdt je overzicht overzichtelijk en je maandelijkse totaal nauwkeurig.'}
        </p>
      </div>

      <h2>
        {t.helpCenter?.subscriptions?.priceAlertsTitle ||
          'Prijswijziging meldingen'}
      </h2>
      <p>
        {t.helpCenter?.subscriptions?.priceAlertsText ||
          'Fluxby houdt de bedragen van je abonnementen bij. Als een abonnement ineens meer of minder kost dan normaal, krijg je een melding. Je kunt dan kiezen om het nieuwe bedrag te accepteren of te negeren.'}
      </p>

      <h3>
        {t.helpCenter?.subscriptions?.priceIncreaseTitle || 'Prijsstijging'}
      </h3>
      <p>
        {t.helpCenter?.subscriptions?.priceIncreaseText ||
          'Een rood pijltje omhoog geeft aan dat een abonnement duurder is geworden. Dit kan betekenen dat de dienst haar prijzen heeft verhoogd.'}
      </p>

      <h3>
        {t.helpCenter?.subscriptions?.priceDecreaseTitle || 'Prijsdaling'}
      </h3>
      <p>
        {t.helpCenter?.subscriptions?.priceDecreaseText ||
          'Een groen pijltje omlaag geeft aan dat je minder hebt betaald dan normaal. Dit kan een tijdelijke korting of promotie zijn.'}
      </p>

      <h2>
        {t.helpCenter?.subscriptions?.monthlyOverviewTitle ||
          'Maandelijks overzicht'}
      </h2>
      <p>
        {t.helpCenter?.subscriptions?.monthlyOverviewText ||
          'Bovenaan de Abonnementen pagina zie je het totaalbedrag dat je maandelijks uitgeeft aan abonnementen. Dit helpt je om inzicht te krijgen in je vaste lasten en waar je mogelijk kunt besparen.'}
      </p>

      <div className='not-prose rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20'>
        <h4 className='mb-2 flex items-center gap-2 text-green-800 dark:text-green-200'>
          <span>✅</span>
          {t.helpCenter?.subscriptions?.bestPracticeTitle || 'Best practice'}
        </h4>
        <p className='m-0 text-green-700 dark:text-green-300'>
          {t.helpCenter?.subscriptions?.bestPracticeText ||
            'Controleer regelmatig je abonnementen. Veel mensen betalen voor diensten die ze niet meer gebruiken. Door je abonnementen te monitoren kun je eenvoudig geld besparen.'}
        </p>
      </div>
    </article>
  );
}
