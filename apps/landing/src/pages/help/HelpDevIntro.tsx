import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

export default function HelpDevIntro() {
  const { t } = useLanguage();

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100'>
          {t.helpCenter?.devIntro?.title}
        </h1>
        <p className='mt-2 text-lg text-gray-600 dark:text-gray-400'>
          {t.helpCenter?.devIntro?.subtitle}
        </p>
      </div>

      <div className='prose prose-purple dark:prose-invert max-w-none'>
        <h2>{t.helpCenter?.devIntro?.quickStartTitle}</h2>
        <p>{t.helpCenter?.devIntro?.quickStartText}</p>

        <div className='not-prose rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-100'>
          <div className='mb-2 text-gray-400'># Get your dashboard stats</div>
          <div>
            curl http://localhost:3001/api/analytics/dashboard \
            <br />
            {'  '}-H &quot;X-Profile-Id: 1&quot;
          </div>
        </div>

        <h2>{t.helpCenter?.devIntro?.whatCanBuildTitle}</h2>

        <div className='not-prose grid gap-4 md:grid-cols-2'>
          <div className='rounded-lg border border-gray-200 p-4 dark:border-gray-700'>
            <div className='mb-2 text-2xl'>📊</div>
            <h4 className='font-semibold text-gray-900 dark:text-gray-100'>
              {t.helpCenter?.devIntro?.customDashboards}
            </h4>
            <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
              {t.helpCenter?.devIntro?.customDashboardsDesc}
            </p>
          </div>
          <div className='rounded-lg border border-gray-200 p-4 dark:border-gray-700'>
            <div className='mb-2 text-2xl'>🤖</div>
            <h4 className='font-semibold text-gray-900 dark:text-gray-100'>
              {t.helpCenter?.devIntro?.automations}
            </h4>
            <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
              {t.helpCenter?.devIntro?.automationsDesc}
            </p>
          </div>
          <div className='rounded-lg border border-gray-200 p-4 dark:border-gray-700'>
            <div className='mb-2 text-2xl'>📱</div>
            <h4 className='font-semibold text-gray-900 dark:text-gray-100'>
              {t.helpCenter?.devIntro?.mobileApps}
            </h4>
            <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
              {t.helpCenter?.devIntro?.mobileAppsDesc}
            </p>
          </div>
          <div className='rounded-lg border border-gray-200 p-4 dark:border-gray-700'>
            <div className='mb-2 text-2xl'>🔔</div>
            <h4 className='font-semibold text-gray-900 dark:text-gray-100'>
              {t.helpCenter?.devIntro?.notifications}
            </h4>
            <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
              {t.helpCenter?.devIntro?.notificationsDesc}
            </p>
          </div>
        </div>

        <h2>{t.helpCenter?.devIntro?.resourcesTitle}</h2>
        <div className='not-prose grid gap-4 md:grid-cols-2'>
          <Link
            to='/docs'
            className='flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
          >
            <div className='text-2xl'>📚</div>
            <div>
              <h4 className='font-semibold text-gray-900 dark:text-gray-100'>
                {t.helpCenter?.devIntro?.fullDocsTitle}
              </h4>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                {t.helpCenter?.devIntro?.fullDocsDesc}
              </p>
            </div>
          </Link>
          <a
            href='http://localhost:3001/api/docs'
            target='_blank'
            rel='noopener noreferrer'
            className='flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
          >
            <div className='text-2xl'>🔧</div>
            <div>
              <h4 className='font-semibold text-gray-900 dark:text-gray-100'>
                {t.helpCenter?.devIntro?.swaggerTitle}
              </h4>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                {t.helpCenter?.devIntro?.swaggerDesc}
              </p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
