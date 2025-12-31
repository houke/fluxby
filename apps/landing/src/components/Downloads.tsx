import { useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Download, Monitor, Apple, AppWindow } from 'lucide-react';

const Downloads = () => {
  useLanguage();
  const downloadsRef = useRef<HTMLElement>(null);

  // Direct link to the latest release on GitHub
  const getDownloadLink = (filename: string) => {
    return `https://github.com/houke/fluxby/releases/latest/download/${filename}`;
  };

  const platforms = [
    {
      id: 'mac',
      name: 'macOS',
      icon: Apple,
      description: 'Voor Intel & Apple Silicon',
      // We use the DMG for the public download link as it's the standard for macOS distribution
      link: getDownloadLink('fluxby_1.0.0_aarch64.dmg'), 
      type: 'Universal',
    },
    {
      id: 'windows',
      name: 'Windows',
      icon: Monitor,
      description: 'Binnenkort beschikbaar',
      type: 'x64',
      disabled: true,
    },
    {
      id: 'linux',
      name: 'Linux',
      icon: AppWindow,
      description: 'Binnenkort beschikbaar',
      type: 'AppImage / Deb',
      disabled: true,
    },
  ];

  return (
    <section 
      ref={downloadsRef}
      id="downloads"
      className='section-padding bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800'
    >
      <div className='container mx-auto px-4'>
        <div className='mx-auto mb-16 max-w-3xl text-center'>
          <h2 className='mb-6 text-4xl font-black text-gray-900 dark:text-white md:text-5xl'>
            Download <span className='text-fluxby-purple'>Fluxby</span>
          </h2>
          <p className='text-xl text-gray-600 dark:text-gray-300'>
            Kies jouw platform en begin direct met het visualiseren van je financiën.
            Alles blijft 100% lokaal op je eigen apparaat.
          </p>
        </div>

        <div className='grid gap-8 md:grid-cols-3'>
          {platforms.map((platform) => {
            const Icon = platform.icon;
            return (
              <div
                key={platform.id}
                className={`group relative rounded-3xl border border-gray-200 bg-white p-8 shadow-xl transition-all duration-300 dark:border-gray-700 dark:bg-gray-800 ${
                  platform.disabled
                    ? 'cursor-not-allowed opacity-75 grayscale'
                    : 'hover:-translate-y-2 hover:border-purple-200 hover:shadow-2xl dark:hover:border-purple-800'
                }`}
              >
                <div className='mb-6 flex items-center justify-between'>
                  <div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300'>
                    <Icon className='h-8 w-8' />
                  </div>
                  <span className='rounded-full bg-gray-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-600 dark:bg-gray-700 dark:text-gray-400'>
                    {platform.type}
                  </span>
                </div>

                <h3 className='mb-2 text-2xl font-bold text-gray-900 dark:text-white'>
                  {platform.name}
                </h3>
                <p className='mb-8 text-gray-600 dark:text-gray-400'>
                  {platform.description}
                </p>

                {platform.disabled ? (
                  <button
                    disabled
                    className='flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 font-semibold text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                  >
                    Binnenkort
                  </button>
                ) : (
                  <a
                    href={platform.link}
                    download
                    className='flex w-full items-center justify-center gap-2 rounded-xl bg-fluxby-purple py-3 font-bold text-white transition-colors hover:bg-fluxby-dark'
                  >
                    <Download className='h-5 w-5' />
                    Download
                  </a>
                )}
              </div>
            );
          })}
        </div>

        <div className='mt-16 text-center text-sm text-gray-500 dark:text-gray-400'>
          <p>
            Op zoek naar mobiele apps? Bekijk onze{' '}
            <span className='font-semibold text-fluxby-purple'>roadmap</span>{' '}
            voor iOS en Android updates.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Downloads;
