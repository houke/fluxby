import { Link } from 'react-router-dom';
import { FluxbyWebGL } from '@fluxby/shared';
import { useLanguage } from '../contexts/LanguageContext';

export default function HelpCenter() {
  const { t } = useLanguage();

  const features = [
    {
      icon: '📚',
      title: t.helpSection?.features?.[0]?.title || 'User Guide',
      description:
        t.helpSection?.features?.[0]?.description ||
        'Step-by-step guides to help you get started and master all features of Fluxby.',
    },
    {
      icon: '❓',
      title: t.helpSection?.features?.[1]?.title || 'FAQ',
      description:
        t.helpSection?.features?.[1]?.description ||
        'Answers to frequently asked questions about Fluxby and its features.',
    },
    {
      icon: '🔒',
      title: t.helpSection?.features?.[2]?.title || 'Privacy & Security',
      description:
        t.helpSection?.features?.[2]?.description ||
        'Learn how Fluxby keeps your financial data private and secure locally.',
    },
  ];

  return (
    <section
      id='help-center'
      className='relative overflow-hidden bg-gradient-to-b from-purple-50 to-pink-50 py-24 dark:from-gray-800 dark:to-gray-900'
    >
      {/* Background decoration */}
      <div className='absolute left-0 top-0 h-64 w-64 rounded-full bg-purple-200/30 blur-3xl dark:bg-purple-900/20' />
      <div className='absolute bottom-0 right-0 h-64 w-64 rounded-full bg-pink-200/30 blur-3xl dark:bg-pink-900/20' />

      <div className='container relative mx-auto px-4'>
        <div className='mb-12 text-center'>
          <div className='mb-4 inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'>
            <span className='text-lg'>❓</span>
            <span className='text-sm font-medium'>
              {t.helpSection?.badge || 'Help Center'}
            </span>
          </div>
          <h2 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100 md:text-5xl'>
            {t.helpSection?.title || 'Need help?'}{' '}
            <span className='bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>
              {t.helpSection?.titleHighlight || "We've got you covered"}
            </span>
          </h2>
          <p className='mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400'>
            {t.helpSection?.subtitle ||
              'From getting started guides to detailed help articles and guides, find everything you need to make the most of Fluxby.'}
          </p>
        </div>

        {/* Main card with avatar */}
        <div className='mx-auto mb-6 max-w-4xl overflow-hidden rounded-3xl border border-purple-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800'>
          <div className='flex flex-col items-center gap-8 p-8 md:flex-row md:p-12'>
            <div className='shrink-0'>
              <div className='relative'>
                <FluxbyWebGL size={160} />
                <div className='absolute -right-2 -top-2 rounded-full bg-purple-600 px-3 py-1 text-xs font-medium text-white shadow-lg'>
                  {t.helpSection?.avatarBadge || 'Here to help!'}
                </div>
              </div>
            </div>
            <div className='flex-1 text-center md:text-left'>
              <h3 className='mb-3 text-2xl font-bold text-gray-900 dark:text-gray-100'>
                {t.helpSection?.cardTitle || 'Your friendly guide to Fluxby'}
              </h3>
              <p className='mb-6 text-gray-600 dark:text-gray-400'>
                {t.helpSection?.cardDescription ||
                  "Whether you're just getting started or looking for advanced tips, our Help Center has everything you need. Browse guides, learn about budgeting, or contact support."}
              </p>
              <div className='flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start'>
                <Link
                  to='/help'
                  className='inline-flex items-center justify-center gap-2 rounded-full bg-purple-600 px-6 py-3 font-medium text-white transition-all hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/25'
                >
                  <span>📖</span>
                  {t.helpSection?.visitHelpCenter || 'Visit Help Center'}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features grid */}
        <div className='grid gap-6 md:grid-cols-3'>
          {features.map((feature, index) => (
            <div
              key={index}
              className='group rounded-2xl border border-gray-200 bg-white/80 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800/80 dark:hover:border-purple-500'
            >
              <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-purple-100 text-2xl transition-transform duration-300 group-hover:scale-110 dark:bg-purple-900/50 dark:group-hover:bg-purple-900/70'>
                {feature.icon}
              </div>
              <h3 className='mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100'>
                {feature.title}
              </h3>
              <p className='text-gray-600 dark:text-gray-400'>
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className='mt-12 text-center'>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            {t.helpSection?.quickLinks || 'Quick links:'}{' '}
            <Link
              to='/help/bank-connection'
              className='text-purple-600 hover:text-purple-700 hover:underline dark:text-purple-400'
            >
              {t.helpSection?.linkBankConnection || 'Bank Connection'}
            </Link>{' '}
            ·{' '}
            <Link
              to='/help/budgeting'
              className='text-purple-600 hover:text-purple-700 hover:underline dark:text-purple-400'
            >
              {t.helpSection?.linkBudgeting || 'Budgeting'}
            </Link>{' '}
            ·{' '}
            <Link
              to='/help/privacy'
              className='text-purple-600 hover:text-purple-700 hover:underline dark:text-purple-400'
            >
              {t.helpSection?.linkPrivacy || 'Privacy'}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
