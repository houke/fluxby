import { useLanguage } from '../../contexts/LanguageContext';
import { Smartphone, Monitor, Apple, Globe } from 'lucide-react';

export default function HelpInstallation() {
  const { t } = useLanguage();

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.installation?.title}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.installation?.subtitle}
      </p>

      {/* Desktop section */}
      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        <span className='mr-3 inline-flex items-center'>
          <Monitor className='h-6 w-6' />
        </span>
        {t.helpCenter?.installation?.desktopTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.installation?.desktopText}
      </p>

      {/* Browser section */}
      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        <span className='mr-3 inline-flex items-center'>
          <Globe className='h-6 w-6' />
        </span>
        {t.helpCenter?.installation?.browserTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.installation?.browserText}
      </p>

      {/* iOS section */}
      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        <span className='mr-3 inline-flex items-center'>
          <Apple className='h-6 w-6' />
        </span>
        {t.helpCenter?.installation?.iosTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.installation?.iosIntro}
      </p>

      <div className='not-prose my-6'>
        <div className='space-y-4'>
          <div className='flex items-start gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50'>
            <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400'>
              1
            </div>
            <div>
              <h4 className='font-medium text-gray-900 dark:text-gray-100'>
                {t.helpCenter?.installation?.iosStep1Title}
              </h4>
              <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                {t.helpCenter?.installation?.iosStep1Text}
              </p>
            </div>
          </div>

          <div className='flex items-start gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50'>
            <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400'>
              2
            </div>
            <div>
              <h4 className='font-medium text-gray-900 dark:text-gray-100'>
                {t.helpCenter?.installation?.iosStep2Title}
              </h4>
              <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                {t.helpCenter?.installation?.iosStep2Text}
              </p>
            </div>
          </div>

          <div className='flex items-start gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50'>
            <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400'>
              3
            </div>
            <div>
              <h4 className='font-medium text-gray-900 dark:text-gray-100'>
                {t.helpCenter?.installation?.iosStep3Title}
              </h4>
              <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                {t.helpCenter?.installation?.iosStep3Text}
              </p>
            </div>
          </div>

          <div className='flex items-start gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50'>
            <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400'>
              4
            </div>
            <div>
              <h4 className='font-medium text-gray-900 dark:text-gray-100'>
                {t.helpCenter?.installation?.iosStep4Title}
              </h4>
              <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                {t.helpCenter?.installation?.iosStep4Text}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className='not-prose mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20'>
        <h4 className='font-medium text-blue-800 dark:text-blue-200'>
          {t.helpCenter?.installation?.iosTipTitle}
        </h4>
        <p className='mt-1 text-sm text-blue-700 dark:text-blue-300'>
          {t.helpCenter?.installation?.iosTipText}
        </p>
      </div>

      {/* Android section */}
      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        <span className='mr-3 inline-flex items-center'>
          <Smartphone className='h-6 w-6' />
        </span>
        {t.helpCenter?.installation?.androidTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.installation?.androidIntro}
      </p>

      <div className='not-prose my-6'>
        <div className='space-y-4'>
          <div className='flex items-start gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50'>
            <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400'>
              1
            </div>
            <div>
              <h4 className='font-medium text-gray-900 dark:text-gray-100'>
                {t.helpCenter?.installation?.androidStep1Title}
              </h4>
              <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                {t.helpCenter?.installation?.androidStep1Text}
              </p>
            </div>
          </div>

          <div className='flex items-start gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50'>
            <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400'>
              2
            </div>
            <div>
              <h4 className='font-medium text-gray-900 dark:text-gray-100'>
                {t.helpCenter?.installation?.androidStep2Title}
              </h4>
              <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                {t.helpCenter?.installation?.androidStep2Text}
              </p>
            </div>
          </div>

          <div className='flex items-start gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50'>
            <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400'>
              3
            </div>
            <div>
              <h4 className='font-medium text-gray-900 dark:text-gray-100'>
                {t.helpCenter?.installation?.androidStep3Title}
              </h4>
              <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                {t.helpCenter?.installation?.androidStep3Text}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Data storage note */}
      <div className='not-prose mt-8 rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20'>
        <h3 className='mb-3 text-lg font-semibold text-amber-800 dark:text-amber-200'>
          {t.helpCenter?.installation?.dataStorageTitle}
        </h3>
        <p className='text-amber-700 dark:text-amber-300'>
          {t.helpCenter?.installation?.dataStorageText}
        </p>
      </div>
    </article>
  );
}
