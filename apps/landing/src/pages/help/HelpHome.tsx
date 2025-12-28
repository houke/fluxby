import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

export default function HelpHome() {
  const { t } = useLanguage();

  return (
    <div className='space-y-8'>
      {/* Hero */}
      <div className='text-center'>
        <h1 className='text-4xl font-bold text-gray-900 dark:text-gray-100'>
          {t.helpCenter?.home?.title || 'Hoe kunnen we je helpen?'}
        </h1>
        <p className='mt-4 text-lg text-gray-600 dark:text-gray-400'>
          {t.helpCenter?.home?.subtitle ||
            'Vind antwoorden op je vragen over Fluxby'}
        </p>
      </div>

      {/* Split cards */}
      <div className='grid gap-6 md:grid-cols-2'>
        {/* User Guide Card */}
        <Link
          to='/help/bank-connection'
          className='group rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-8 transition-all hover:border-purple-400 hover:shadow-lg dark:border-purple-800 dark:from-purple-900/20 dark:to-pink-900/20 dark:hover:border-purple-600'
        >
          <div className='mb-4 text-5xl'>👋</div>
          <h2 className='mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.home?.userGuideTitle || 'Gebruikershandleiding'}
          </h2>
          <p className='mb-4 text-gray-600 dark:text-gray-400'>
            {t.helpCenter?.home?.userGuideDesc ||
              'Leer hoe je je geld beheert, budgetten instelt en uitgaven bijhoudt met Fluxby.'}
          </p>
          <ul className='space-y-2 text-sm text-gray-500 dark:text-gray-400'>
            <li className='flex items-center gap-2'>
              <span>🏦</span>
              {t.helpCenter?.home?.userItem1 || 'Koppel je bankrekening'}
            </li>
            <li className='flex items-center gap-2'>
              <span>📊</span>
              {t.helpCenter?.home?.userItem2 || 'Maak budgetten & doelen'}
            </li>
            <li className='flex items-center gap-2'>
              <span>🔒</span>
              {t.helpCenter?.home?.userItem3 || 'Begrijp je privacy'}
            </li>
          </ul>
          <div className='mt-6 flex items-center text-purple-600 transition-colors group-hover:text-purple-700 dark:text-purple-400 dark:group-hover:text-purple-300'>
            <span className='font-medium'>
              {t.helpCenter?.home?.getStarted || 'Aan de slag'}
            </span>
            <svg
              className='ml-2 h-4 w-4 transition-transform group-hover:translate-x-1'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 5l7 7-7 7'
              />
            </svg>
          </div>
        </Link>

        {/* Developer Hub Card */}
        <Link
          to='/docs'
          className='group rounded-xl border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-slate-100 p-8 transition-all hover:border-gray-500 hover:shadow-lg dark:border-gray-600 dark:from-gray-800 dark:to-slate-800 dark:hover:border-gray-400'
        >
          <div className='mb-4 text-5xl'>💻</div>
          <h2 className='mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100'>
            {t.helpCenter?.home?.devHubTitle || 'Developer Hub'}
          </h2>
          <p className='mb-4 text-gray-600 dark:text-gray-400'>
            {t.helpCenter?.home?.devHubDesc ||
              'Bouw integraties met de Fluxby API. Toegang tot documentatie, endpoints en webhooks.'}
          </p>
          <ul className='space-y-2 font-mono text-sm text-gray-500 dark:text-gray-400'>
            <li className='flex items-center gap-2'>
              <span className='text-green-500'>GET</span>
              /api/transactions
            </li>
            <li className='flex items-center gap-2'>
              <span className='text-blue-500'>POST</span>
              /api/categories
            </li>
            <li className='flex items-center gap-2'>
              <span className='text-yellow-500'>PATCH</span>
              /api/budgets/:id
            </li>
          </ul>
          <div className='mt-6 flex items-center text-gray-700 transition-colors group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-gray-100'>
            <span className='font-medium'>
              {t.helpCenter?.home?.viewDocs || 'Bekijk documentatie'}
            </span>
            <svg
              className='ml-2 h-4 w-4 transition-transform group-hover:translate-x-1'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 5l7 7-7 7'
              />
            </svg>
          </div>
        </Link>
      </div>

      {/* Quick Links */}
      <div className='mt-12'>
        <h3 className='mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100'>
          {t.helpCenter?.home?.popularArticles || 'Populaire artikelen'}
        </h3>
        <div className='grid gap-4 md:grid-cols-3'>
          <Link
            to='/help/bank-connection'
            className='rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
          >
            <div className='mb-2 text-2xl'>🏦</div>
            <h4 className='font-medium text-gray-900 dark:text-gray-100'>
              {t.helpCenter?.home?.article1 || 'Je bank koppelen'}
            </h4>
            <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
              {t.helpCenter?.home?.article1Desc ||
                'Leer hoe je je transacties importeert'}
            </p>
          </Link>
          <Link
            to='/help/budgeting'
            className='rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
          >
            <div className='mb-2 text-2xl'>📊</div>
            <h4 className='font-medium text-gray-900 dark:text-gray-100'>
              {t.helpCenter?.home?.article2 || 'Een budget maken'}
            </h4>
            <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
              {t.helpCenter?.home?.article2Desc ||
                'Stel je eerste maandbudget in'}
            </p>
          </Link>
          <Link
            to='/docs'
            className='rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
          >
            <div className='mb-2 text-2xl'>📚</div>
            <h4 className='font-medium text-gray-900 dark:text-gray-100'>
              {t.helpCenter?.home?.article3 || 'API documentatie'}
            </h4>
            <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
              {t.helpCenter?.home?.article3Desc ||
                'Volledige API referentie voor ontwikkelaars'}
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
