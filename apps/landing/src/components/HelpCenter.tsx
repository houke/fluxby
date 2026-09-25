import { Link } from 'react-router-dom';
import { FluxbyWebGL } from '@fluxby/shared';
import { useLanguage } from '../contexts/LanguageContext';

export default function HelpCenter() {
  const { t } = useLanguage();
  const copy = t.helpSection;

  const featureIcons = ['📚', '❓', '🔒'];
  const features = copy.features.map(
    (feature: { title: string; description: string }, index: number) => ({
      ...feature,
      icon: featureIcons[index],
    })
  );

  return (
    <section
      id='help-center'
      className='section-padding relative overflow-hidden bg-gradient-to-b from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900'
    >
      {/* Background decoration */}
      <div className='absolute top-0 left-0 h-64 w-64 rounded-full bg-purple-200/30 blur-3xl dark:bg-purple-900/20' />
      <div className='absolute right-0 bottom-0 h-64 w-64 rounded-full bg-pink-200/30 blur-3xl dark:bg-pink-900/20' />

      <div className='relative container mx-auto px-6'>
        <div className='mb-8 text-center md:mb-12'>
          <div className='mb-4 inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'>
            <span className='text-lg'>❓</span>
            <span className='text-sm font-medium'>{copy.badge}</span>
          </div>
          <h2 className='mb-4 text-3xl font-bold text-gray-900 md:text-5xl dark:text-gray-100'>
            {copy.title}{' '}
            <span className='bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>
              {copy.titleHighlight}
            </span>
          </h2>
          <p className='mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400'>
            {copy.subtitle}
          </p>
        </div>

        {/* Main card with avatar */}
        <div className='mx-auto mb-6 max-w-4xl overflow-hidden rounded-3xl border border-purple-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800'>
          <div className='flex flex-col items-center gap-8 p-8 md:flex-row md:p-12'>
            <div className='shrink-0'>
              <div className='relative'>
                <FluxbyWebGL size={160} />
                <div className='absolute -top-2 -right-2 rounded-full bg-purple-600 px-3 py-1 text-xs font-medium text-white shadow-lg'>
                  {copy.avatarBadge}
                </div>
              </div>
            </div>
            <div className='flex-1 text-center md:text-left'>
              <h3 className='mb-3 text-2xl font-bold text-gray-900 dark:text-gray-100'>
                {copy.cardTitle}
              </h3>
              <p className='mb-6 text-gray-600 dark:text-gray-400'>
                {copy.cardDescription}
              </p>
              <div className='flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start'>
                <Link
                  to='/help'
                  className='inline-flex items-center justify-center gap-2 rounded-full bg-purple-600 px-6 py-3 font-medium text-white transition-all hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/25'
                >
                  <span>📖</span>
                  {copy.visitHelpCenter}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features grid */}
        <div className='grid gap-6 md:grid-cols-3'>
          {features.map(
            (
              feature: {
                title: string;
                description: string;
                icon: string | undefined;
              },
              index: number
            ) => (
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
            )
          )}
        </div>

        {/* Quick links */}
        <div className='mt-12 text-center'>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            {copy.quickLinks}{' '}
            <Link
              to='/help/bank-connection'
              className='text-purple-600 hover:text-purple-700 hover:underline dark:text-purple-400'
            >
              {copy.linkBankConnection}
            </Link>{' '}
            ·{' '}
            <Link
              to='/help/budgeting'
              className='text-purple-600 hover:text-purple-700 hover:underline dark:text-purple-400'
            >
              {copy.linkBudgeting}
            </Link>{' '}
            ·{' '}
            <Link
              to='/help/privacy'
              className='text-purple-600 hover:text-purple-700 hover:underline dark:text-purple-400'
            >
              {copy.linkPrivacy}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
