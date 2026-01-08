import { useLanguage } from '../../contexts/LanguageContext';

export default function HelpSync() {
  const { t } = useLanguage();

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.sync?.title || 'Synchronisatie tussen apparaten'}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.sync?.subtitle ||
          'Houd je financiële gegevens gesynchroniseerd tussen al je apparaten zonder cloud.'}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.sync?.howItWorksTitle || 'Hoe het werkt'}
      </h2>
      <p>
        {t.helpCenter?.sync?.howItWorksText ||
          'Fluxby gebruikt peer-to-peer (P2P) technologie om je gegevens direct tussen je apparaten te synchroniseren. Je data gaat nooit via een server - het reist rechtstreeks van apparaat naar apparaat via een versleutelde verbinding.'}
      </p>

      <div className='not-prose my-8 flex items-center justify-center gap-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 p-8 dark:from-purple-900/20 dark:to-blue-900/20'>
        <div className='flex flex-col items-center'>
          <div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-900/50'>
            <svg
              className='h-8 w-8 text-purple-600 dark:text-purple-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
              />
            </svg>
          </div>
          <span className='mt-2 text-sm font-medium text-gray-700 dark:text-gray-300'>
            Laptop
          </span>
        </div>
        <div className='flex flex-col items-center'>
          <svg
            className='h-8 w-24 text-purple-400 dark:text-purple-500'
            viewBox='0 0 100 20'
          >
            <defs>
              <marker
                id='arrowhead'
                markerWidth='6'
                markerHeight='4'
                refX='5'
                refY='2'
                orient='auto'
              >
                <polygon points='0 0, 6 2, 0 4' fill='currentColor' />
              </marker>
            </defs>
            <line
              x1='0'
              y1='10'
              x2='94'
              y2='10'
              stroke='currentColor'
              strokeWidth='2'
              markerEnd='url(#arrowhead)'
              strokeDasharray='4,4'
            >
              <animate
                attributeName='stroke-dashoffset'
                from='8'
                to='0'
                dur='0.5s'
                repeatCount='indefinite'
              />
            </line>
          </svg>
          <span className='text-xs text-gray-500 dark:text-gray-400'>
            {t.helpCenter?.sync?.directConnection || 'Directe verbinding'}
          </span>
        </div>
        <div className='flex flex-col items-center'>
          <div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/50'>
            <svg
              className='h-8 w-8 text-blue-600 dark:text-blue-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z'
              />
            </svg>
          </div>
          <span className='mt-2 text-sm font-medium text-gray-700 dark:text-gray-300'>
            {t.helpCenter?.sync?.phone || 'Telefoon'}
          </span>
        </div>
      </div>

      <h2 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.sync?.setupTitle || 'Synchronisatie instellen'}
      </h2>

      <h3>{t.helpCenter?.sync?.step1Title || 'Stap 1: Open instellingen'}</h3>
      <p>
        {t.helpCenter?.sync?.step1Text ||
          'Ga naar Instellingen en zoek de sectie "Apparaten synchroniseren". Hier kun je je apparaat bekijken en nieuwe apparaten koppelen.'}
      </p>

      <h3>
        {t.helpCenter?.sync?.step2Title ||
          'Stap 2: Genereer een koppelingscode'}
      </h3>
      <p>
        {t.helpCenter?.sync?.step2Text ||
          'Klik op "Toon QR-code" om een unieke koppelingscode te genereren. Je kunt de QR-code scannen met je andere apparaat, of de code handmatig invoeren.'}
      </p>

      <h3>
        {t.helpCenter?.sync?.step3Title || 'Stap 3: Verbind je apparaten'}
      </h3>
      <p>
        {t.helpCenter?.sync?.step3Text ||
          'Op je tweede apparaat, ga naar dezelfde instellingenpagina en voer de koppelingscode in of scan de QR-code. De apparaten worden automatisch verbonden.'}
      </p>

      <h3>
        {t.helpCenter?.sync?.step4Title ||
          'Stap 4: Automatische synchronisatie'}
      </h3>
      <p>
        {t.helpCenter?.sync?.step4Text ||
          'Na het koppelen worden wijzigingen automatisch gesynchroniseerd wanneer beide apparaten online zijn. Je kunt ook handmatig synchroniseren met de "Nu synchroniseren" knop.'}
      </p>

      <h2 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.sync?.troubleshootingTitle || 'Problemen oplossen'}
      </h2>

      <div className='not-prose space-y-4'>
        <div className='rounded-lg border border-gray-200 p-4 dark:border-gray-700'>
          <h4 className='mb-2 font-semibold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.sync?.troubleshooting1Title ||
              'Apparaten kunnen elkaar niet vinden'}
          </h4>
          <p className='text-gray-600 dark:text-gray-400'>
            {t.helpCenter?.sync?.troubleshooting1Text ||
              'Zorg ervoor dat beide apparaten op hetzelfde WiFi-netwerk zijn aangesloten. Sommige openbare netwerken blokkeren peer-to-peer verbindingen.'}
          </p>
        </div>

        <div className='rounded-lg border border-gray-200 p-4 dark:border-gray-700'>
          <h4 className='mb-2 font-semibold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.sync?.troubleshooting2Title ||
              'Synchronisatie mislukt'}
          </h4>
          <p className='text-gray-600 dark:text-gray-400'>
            {t.helpCenter?.sync?.troubleshooting2Text ||
              'Controleer je internetverbinding en probeer opnieuw te verbinden. Als het probleem aanhoudt, verwijder het gekoppelde apparaat en koppel opnieuw.'}
          </p>
        </div>

        <div className='rounded-lg border border-gray-200 p-4 dark:border-gray-700'>
          <h4 className='mb-2 font-semibold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.sync?.troubleshooting3Title ||
              'Conflicterende wijzigingen'}
          </h4>
          <p className='text-gray-600 dark:text-gray-400'>
            {t.helpCenter?.sync?.troubleshooting3Text ||
              'Als je dezelfde gegevens op meerdere apparaten bewerkt, bewaart Fluxby automatisch de meest recente versie (Last-Write-Wins).'}
          </p>
        </div>
      </div>

      <div className='not-prose mt-8 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20'>
        <h4 className='mb-2 flex items-center gap-2 text-green-800 dark:text-green-200'>
          <span>🔒</span>
          {t.helpCenter?.sync?.securityTitle || 'Privacy & Beveiliging'}
        </h4>
        <p className='m-0 text-green-700 dark:text-green-300'>
          {t.helpCenter?.sync?.securityText ||
            'Je gegevens blijven altijd op je eigen apparaten. Fluxby gebruikt geen cloud servers om je financiële informatie op te slaan. Alle synchronisatie gebeurt via versleutelde peer-to-peer verbindingen.'}
        </p>
      </div>
    </article>
  );
}
