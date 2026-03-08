import { useLanguage } from '../../contexts/LanguageContext';
import { Smartphone, Monitor, Apple, Globe } from 'lucide-react';

export default function HelpInstallation() {
  const { t } = useLanguage();

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.installation?.title || 'Installing Fluxby'}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.installation?.subtitle ||
          'Fluxby works in your browser without installation, but you can also install it as an app for a better experience.'}
      </p>

      {/* Desktop section */}
      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        <span className='mr-3 inline-flex items-center'>
          <Monitor className='h-6 w-6' />
        </span>
        {t.helpCenter?.installation?.desktopTitle ||
          'Desktop (Windows, macOS, Linux)'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.installation?.desktopText ||
          'For the best experience on desktop, download the native app from our Downloads page. Native apps offer better performance and work offline.'}
      </p>

      {/* Browser section */}
      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        <span className='mr-3 inline-flex items-center'>
          <Globe className='h-6 w-6' />
        </span>
        {t.helpCenter?.installation?.browserTitle || 'Web browser'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.installation?.browserText ||
          'Fluxby works directly in your browser. Just visit the app URL and start using it - no installation required. Your data is stored locally in your browser.'}
      </p>

      {/* iOS section */}
      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        <span className='mr-3 inline-flex items-center'>
          <Apple className='h-6 w-6' />
        </span>
        {t.helpCenter?.installation?.iosTitle || 'iPhone & iPad'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.installation?.iosIntro ||
          'Fluxby can be installed as a Progressive Web App (PWA) on your iPhone or iPad. This gives you an app-like experience with a home screen icon.'}
      </p>

      <div className='not-prose my-6'>
        <div className='space-y-4'>
          <div className='flex items-start gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50'>
            <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400'>
              1
            </div>
            <div>
              <h4 className='font-medium text-gray-900 dark:text-gray-100'>
                {t.helpCenter?.installation?.iosStep1Title || 'Open in Safari'}
              </h4>
              <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                {t.helpCenter?.installation?.iosStep1Text ||
                  'Open Fluxby in Safari (not Chrome or another browser). Safari is required for PWA installation on iOS.'}
              </p>
            </div>
          </div>

          <div className='flex items-start gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50'>
            <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400'>
              2
            </div>
            <div>
              <h4 className='font-medium text-gray-900 dark:text-gray-100'>
                {t.helpCenter?.installation?.iosStep2Title ||
                  'Tap the Share button'}
              </h4>
              <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                {t.helpCenter?.installation?.iosStep2Text ||
                  'Tap the Share button at the bottom of Safari (the square with an arrow pointing up).'}
              </p>
            </div>
          </div>

          <div className='flex items-start gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50'>
            <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400'>
              3
            </div>
            <div>
              <h4 className='font-medium text-gray-900 dark:text-gray-100'>
                {t.helpCenter?.installation?.iosStep3Title ||
                  'Add to Home Screen'}
              </h4>
              <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                {t.helpCenter?.installation?.iosStep3Text ||
                  'Scroll down and tap "Add to Home Screen". You may need to scroll right to find this option.'}
              </p>
            </div>
          </div>

          <div className='flex items-start gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50'>
            <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400'>
              4
            </div>
            <div>
              <h4 className='font-medium text-gray-900 dark:text-gray-100'>
                {t.helpCenter?.installation?.iosStep4Title || 'Confirm'}
              </h4>
              <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                {t.helpCenter?.installation?.iosStep4Text ||
                  'Tap "Add" in the top right corner. Fluxby will now appear on your home screen like any other app.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className='not-prose mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20'>
        <h4 className='font-medium text-blue-800 dark:text-blue-200'>
          {t.helpCenter?.installation?.iosTipTitle || 'Tip'}
        </h4>
        <p className='mt-1 text-sm text-blue-700 dark:text-blue-300'>
          {t.helpCenter?.installation?.iosTipText ||
            'Once installed, Fluxby will open in full-screen mode without the Safari address bar. Your data is stored locally on your device and syncs between your installed apps via peer-to-peer sync.'}
        </p>
      </div>

      {/* Android section */}
      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        <span className='mr-3 inline-flex items-center'>
          <Smartphone className='h-6 w-6' />
        </span>
        {t.helpCenter?.installation?.androidTitle || 'Android'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.installation?.androidIntro ||
          'On Android, you can install Fluxby as a PWA from Chrome or other browsers.'}
      </p>

      <div className='not-prose my-6'>
        <div className='space-y-4'>
          <div className='flex items-start gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50'>
            <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400'>
              1
            </div>
            <div>
              <h4 className='font-medium text-gray-900 dark:text-gray-100'>
                {t.helpCenter?.installation?.androidStep1Title ||
                  'Open in Chrome'}
              </h4>
              <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                {t.helpCenter?.installation?.androidStep1Text ||
                  'Open Fluxby in Chrome (or another compatible browser like Edge).'}
              </p>
            </div>
          </div>

          <div className='flex items-start gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50'>
            <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400'>
              2
            </div>
            <div>
              <h4 className='font-medium text-gray-900 dark:text-gray-100'>
                {t.helpCenter?.installation?.androidStep2Title ||
                  'Look for the install prompt'}
              </h4>
              <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                {t.helpCenter?.installation?.androidStep2Text ||
                  'Chrome may show an "Install app" banner at the bottom. If you see it, tap "Install".'}
              </p>
            </div>
          </div>

          <div className='flex items-start gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50'>
            <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400'>
              3
            </div>
            <div>
              <h4 className='font-medium text-gray-900 dark:text-gray-100'>
                {t.helpCenter?.installation?.androidStep3Title ||
                  'Or use the menu'}
              </h4>
              <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                {t.helpCenter?.installation?.androidStep3Text ||
                  'Tap the three-dot menu in Chrome and select "Install app" or "Add to Home screen".'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Data storage note */}
      <div className='not-prose mt-8 rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20'>
        <h3 className='mb-3 text-lg font-semibold text-amber-800 dark:text-amber-200'>
          {t.helpCenter?.installation?.dataStorageTitle || 'About your data'}
        </h3>
        <p className='text-amber-700 dark:text-amber-300'>
          {t.helpCenter?.installation?.dataStorageText ||
            'Regardless of how you access Fluxby, your data is stored locally on your device. If you use Fluxby in a browser, your data is stored in that browser. If you install the app, data is stored in the app. Use the sync feature to keep your data in sync between devices.'}
        </p>
      </div>
    </article>
  );
}
