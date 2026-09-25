import { useLanguage } from '../../contexts/LanguageContext';

export default function HelpSync() {
  const { t } = useLanguage();

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.sync?.title}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.sync?.subtitle}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.sync?.howItWorksTitle}
      </h2>
      <p>{t.helpCenter?.sync?.howItWorksText}</p>

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
            {t.helpCenter?.sync?.directConnection}
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
            {t.helpCenter?.sync?.phone}
          </span>
        </div>
      </div>

      <h2 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.sync?.setupTitle}
      </h2>

      <h3>{t.helpCenter?.sync?.step1Title}</h3>
      <p>{t.helpCenter?.sync?.step1Text}</p>

      <h3>{t.helpCenter?.sync?.step2Title}</h3>
      <p>{t.helpCenter?.sync?.step2Text}</p>

      <h3>{t.helpCenter?.sync?.step3Title}</h3>
      <p>{t.helpCenter?.sync?.step3Text}</p>

      <h3>{t.helpCenter?.sync?.step4Title}</h3>
      <p>{t.helpCenter?.sync?.step4Text}</p>

      <h2 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.sync?.troubleshootingTitle}
      </h2>

      <div className='not-prose space-y-4'>
        <div className='rounded-lg border border-gray-200 p-4 dark:border-gray-700'>
          <h4 className='mb-2 font-semibold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.sync?.troubleshooting1Title}
          </h4>
          <p className='text-gray-600 dark:text-gray-400'>
            {t.helpCenter?.sync?.troubleshooting1Text}
          </p>
        </div>

        <div className='rounded-lg border border-gray-200 p-4 dark:border-gray-700'>
          <h4 className='mb-2 font-semibold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.sync?.troubleshooting2Title}
          </h4>
          <p className='text-gray-600 dark:text-gray-400'>
            {t.helpCenter?.sync?.troubleshooting2Text}
          </p>
        </div>

        <div className='rounded-lg border border-gray-200 p-4 dark:border-gray-700'>
          <h4 className='mb-2 font-semibold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.sync?.troubleshooting3Title}
          </h4>
          <p className='text-gray-600 dark:text-gray-400'>
            {t.helpCenter?.sync?.troubleshooting3Text}
          </p>
        </div>
      </div>

      <div className='not-prose mt-8 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20'>
        <h4 className='mb-2 flex items-center gap-2 text-green-800 dark:text-green-200'>
          <span>🔒</span>
          {t.helpCenter?.sync?.securityTitle}
        </h4>
        <p className='m-0 text-green-700 dark:text-green-300'>
          {t.helpCenter?.sync?.securityText}
        </p>
      </div>
    </article>
  );
}
