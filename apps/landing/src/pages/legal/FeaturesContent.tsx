import { useLanguage } from '../../contexts/LanguageContext';
import {
  Sparkles,
  BarChart3,
  Target,
  Shield,
  Building2,
  Palette,
  Zap,
  Users,
  FileSpreadsheet,
  Brain,
  Lock,
  RefreshCw,
  Globe,
  Heart,
} from 'lucide-react';

const featureIcons = [
  Sparkles,
  BarChart3,
  Target,
  Shield,
  Building2,
  Palette,
  Zap,
  Brain,
  FileSpreadsheet,
  Users,
  Lock,
  RefreshCw,
  Globe,
  Heart,
];

const featureColors = [
  'bg-gradient-to-br from-blue-500 to-purple-600',
  'bg-gradient-to-br from-green-500 to-teal-600',
  'bg-gradient-to-br from-pink-500 to-rose-600',
  'bg-gradient-to-br from-purple-500 to-indigo-600',
  'bg-gradient-to-br from-amber-500 to-orange-600',
  'bg-gradient-to-br from-cyan-500 to-blue-600',
  'bg-gradient-to-br from-red-500 to-pink-600',
  'bg-gradient-to-br from-violet-500 to-purple-600',
  'bg-gradient-to-br from-emerald-500 to-green-600',
  'bg-gradient-to-br from-sky-500 to-indigo-600',
  'bg-gradient-to-br from-slate-500 to-gray-600',
  'bg-gradient-to-br from-lime-500 to-green-600',
  'bg-gradient-to-br from-fuchsia-500 to-pink-600',
  'bg-gradient-to-br from-rose-500 to-red-600',
];

const FeaturesContent = () => {
  const { t } = useLanguage();
  const featuresPage = t.legal?.featuresPage;

  const features = [
    {
      title: featuresPage?.smartTracking?.title,
      description: featuresPage?.smartTracking?.description,
      highlights: featuresPage?.smartTracking?.highlights,
    },
    {
      title: featuresPage?.analytics?.title,
      description: featuresPage?.analytics?.description,
      highlights: featuresPage?.analytics?.highlights,
    },
    {
      title: featuresPage?.budgets?.title,
      description: featuresPage?.budgets?.description,
      highlights: featuresPage?.budgets?.highlights,
    },
    {
      title: featuresPage?.privacy?.title,
      description: featuresPage?.privacy?.description,
      highlights: featuresPage?.privacy?.highlights,
    },
    {
      title: featuresPage?.bankImport?.title,
      description: featuresPage?.bankImport?.description,
      highlights: featuresPage?.bankImport?.highlights,
    },
    {
      title: featuresPage?.peer2peer?.title,
      description: featuresPage?.peer2peer?.description,
      highlights: featuresPage?.peer2peer?.highlights,
    },
    {
      title: featuresPage?.multiProfile?.title,
      description: featuresPage?.multiProfile?.description,
      highlights: featuresPage?.multiProfile?.highlights,
    },
    {
      title: featuresPage?.customization?.title,
      description: featuresPage?.customization?.description,
      highlights: featuresPage?.customization?.highlights,
    },
    {
      title: featuresPage?.realtime?.title,
      description: featuresPage?.realtime?.description,
      highlights: featuresPage?.realtime?.highlights,
    },
    {
      title: featuresPage?.ai?.title,
      description: featuresPage?.ai?.description,
      highlights: featuresPage?.ai?.highlights,
    },
    {
      title: featuresPage?.multiAccount?.title,
      description: featuresPage?.multiAccount?.description,
      highlights: featuresPage?.multiAccount?.highlights,
    },
    {
      title: featuresPage?.addressBook?.title,
      description: featuresPage?.addressBook?.description,
      highlights: featuresPage?.addressBook?.highlights,
    },
    {
      title: featuresPage?.security?.title,
      description: featuresPage?.security?.description,
      highlights: featuresPage?.security?.highlights,
    },
    {
      title: featuresPage?.sync?.title,
      description: featuresPage?.sync?.description,
      highlights: featuresPage?.sync?.highlights,
    },
    {
      title: featuresPage?.languages?.title,
      description: featuresPage?.languages?.description,
      highlights: featuresPage?.languages?.highlights,
    },
    {
      title: featuresPage?.openSource?.title,
      description: featuresPage?.openSource?.description,
      highlights: featuresPage?.openSource?.highlights,
    },
  ];

  return (
    <>
      <p className='mb-8 text-lg text-gray-600 dark:text-gray-400'>
        {featuresPage?.intro}
      </p>

      <div className='grid gap-6 sm:grid-cols-2'>
        {features.map((feature, index) => {
          const Icon = featureIcons[index % featureIcons.length];
          return (
            <div
              key={index}
              className='group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800/50'
            >
              <div className='mb-4 flex items-center gap-4'>
                <div
                  className={`${featureColors[index % featureColors.length]} flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon className='h-6 w-6' />
                </div>
                <h3 className='text-lg font-bold text-gray-900 dark:text-white'>
                  {feature.title}
                </h3>
              </div>
              <p className='mb-4 text-gray-600 dark:text-gray-400'>
                {feature.description}
              </p>
              <div className='flex flex-wrap gap-2'>
                {feature.highlights.map((highlight: string, hIndex: number) => (
                  <span
                    key={hIndex}
                    className='rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  >
                    {highlight}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className='not-prose mt-12 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 p-8 text-center'>
        <h2 className='mb-4 text-2xl font-bold text-white'>
          {t.cta.title.part1}{' '}
          <span className='text-fluxby-light'>{t.cta.title.highlight}</span>{' '}
          {t.cta.title.part2}
        </h2>
        <p className='mb-6 text-white/90'>{t.cta.description}</p>
        <a
          href='/app'
          className='inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 font-semibold text-purple-600 no-underline transition-all duration-300 hover:scale-105 hover:shadow-xl'
        >
          <Zap className='h-5 w-5' />
          {t.cta.getStarted}
        </a>
      </div>
    </>
  );
};

export default FeaturesContent;
