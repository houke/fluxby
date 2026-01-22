import { useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Download,
  Monitor,
  Apple,
  AppWindow,
  Globe,
  Check,
  Smartphone,
} from 'lucide-react';

// Injected at build time from root package.json
declare const __APP_VERSION__: string;

const Downloads = () => {
  const { t } = useLanguage();
  const downloadsRef = useRef<HTMLElement>(null);
  const pwa = usePWAInstall();

  // Version from build-time injection (falls back for dev)
  const version =
    typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

  // Direct link to the latest release on GitHub
  const getDownloadLink = (filename: string) => {
    return `https://github.com/houke/fluxby/releases/latest/download/${filename}`;
  };

  // Get browser-specific PWA instructions
  const getPWAInstructions = () => {
    if (pwa.platform === 'ios') {
      return (
        t.downloads?.pwa?.browserInstructions?.ios ||
        'Tap the Share icon and then "Add to Home Screen"'
      );
    }
    if (pwa.platform === 'android') {
      return (
        t.downloads?.pwa?.browserInstructions?.android ||
        'Tap the menu (⋮) and then "Add to Home Screen"'
      );
    }
    return (
      t.downloads?.pwa?.browserInstructions?.desktop ||
      'Click the install icon in the address bar'
    );
  };

  const platforms = [
    {
      id: 'mac',
      name: t.downloads?.mac?.name || 'macOS',
      icon: Apple,
      description:
        t.downloads?.mac?.description ||
        'Native ervaring voor Apple Silicon & Intel Macs.',
      downloads: [
        {
          label: t.downloads?.mac?.aarchLabel || 'Apple Silicon',
          link: getDownloadLink(`Fluxby_${version}_aarch64.dmg`),
          type: t.downloads?.mac?.aarchLabel || 'M1/M2/M3/M4',
        },
        {
          label: t.downloads?.mac?.x64Label || 'Intel',
          link: getDownloadLink(`Fluxby_${version}_x64.dmg`),
          type: t.downloads?.mac?.x64Label || 'x64',
        },
      ],
    },
    {
      id: 'windows',
      name: t.downloads?.windows?.name || 'Windows',
      icon: Monitor,
      description:
        t.downloads?.windows?.description ||
        'Eenvoudige installatie voor Windows 10 & 11.',
      downloads: [
        {
          label: t.downloads?.windows?.label || 'Download',
          link: getDownloadLink(`Fluxby_${version}_x64-setup.exe`),
          type: 'x64 EXE',
        },
      ],
    },
    {
      id: 'linux',
      name: t.downloads?.linux?.name || 'Linux',
      icon: AppWindow,
      description:
        t.downloads?.linux?.description ||
        'Standalone AppImage voor alle distributies.',
      downloads: [
        {
          label: t.downloads?.linux?.label || 'Download',
          link: getDownloadLink(`fluxby_${version}_amd64.AppImage`),
          type: 'AMD64 AppImage',
        },
      ],
    },
  ];

  return (
    <section
      ref={downloadsRef}
      id='downloads'
      className='section-padding bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800'
    >
      <div className='container mx-auto px-6'>
        <div className='mx-auto mb-12 max-w-3xl text-center md:mb-16'>
          <h2 className='mb-6 text-4xl font-black text-gray-900 md:text-5xl dark:text-white'>
            {t.downloads?.title || (
              <>
                Download <span className='text-fluxby-purple'>Fluxby</span>
              </>
            )}
          </h2>
          <p className='text-xl text-gray-600 dark:text-gray-300'>
            {t.downloads?.description ||
              'Kies jouw platform en begin direct met het visualiseren van je financiën. Alles blijft 100% lokaal op je eigen apparaat.'}
          </p>
        </div>

        <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-4'>
          {/* PWA Install Card - shown first for prominence */}
          <div className='group relative flex flex-col rounded-3xl border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-white p-8 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-purple-400 hover:shadow-2xl dark:border-purple-700 dark:from-purple-900/20 dark:to-gray-800 dark:hover:border-purple-600'>
            <div className='mb-6 flex items-center justify-between'>
              <div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600 text-white'>
                {pwa.platform === 'ios' || pwa.platform === 'android' ? (
                  <Smartphone className='h-8 w-8' />
                ) : (
                  <Globe className='h-8 w-8' />
                )}
              </div>
              {pwa.isInstalled && (
                <span className='flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-bold tracking-wider text-green-700 uppercase dark:bg-green-900/50 dark:text-green-300'>
                  <Check className='h-3 w-3' />
                  {t.downloads?.pwa?.installedBadge || 'Installed'}
                </span>
              )}
              {!pwa.isInstalled && (
                <span className='rounded-full bg-purple-100 px-3 py-1 text-xs font-bold tracking-wider text-purple-700 uppercase dark:bg-purple-900/50 dark:text-purple-300'>
                  PWA
                </span>
              )}
            </div>

            <h3 className='mb-2 text-2xl font-bold text-gray-900 dark:text-white'>
              {t.downloads?.pwa?.name || 'Browser (PWA)'}
            </h3>
            <p className='mb-8 flex-grow text-gray-600 dark:text-gray-400'>
              {t.downloads?.pwa?.description ||
                'Install directly from your browser. No download needed, works offline.'}
            </p>

            <div className='flex flex-col gap-3'>
              {pwa.canPromptInstall ? (
                <button
                  onClick={pwa.installPWA}
                  className='bg-fluxby-purple hover:bg-fluxby-dark flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold text-white transition-colors'
                >
                  <Download className='h-5 w-5' />
                  {t.downloads?.pwa?.installButton || 'Install as app'}
                </button>
              ) : pwa.isInstalled ? (
                <a
                  href='/app/'
                  className='flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-bold text-white transition-colors hover:bg-green-700'
                >
                  <Check className='h-5 w-5' />
                  Open Fluxby
                </a>
              ) : (
                <div className='rounded-xl bg-gray-100 p-4 text-center text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-300'>
                  {getPWAInstructions()}
                </div>
              )}
            </div>
          </div>

          {platforms.map((platform) => {
            const Icon = platform.icon;
            return (
              <div
                key={platform.id}
                className='group relative flex flex-col rounded-3xl border border-gray-200 bg-white p-8 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-purple-200 hover:shadow-2xl dark:border-gray-700 dark:bg-gray-800 dark:hover:border-purple-800'
              >
                <div className='mb-6 flex items-center justify-between'>
                  <div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300'>
                    <Icon className='h-8 w-8' />
                  </div>
                  <span className='rounded-full bg-gray-100 px-3 py-1 text-xs font-bold tracking-wider text-gray-600 uppercase dark:bg-gray-700 dark:text-gray-400'>
                    {platform.downloads[0].type}
                  </span>
                </div>

                <h3 className='mb-2 text-2xl font-bold text-gray-900 dark:text-white'>
                  {platform.name}
                </h3>
                <p className='mb-8 flex-grow text-gray-600 dark:text-gray-400'>
                  {platform.description}
                </p>

                <div className='flex flex-col gap-3'>
                  {platform.downloads.map((download, idx) => (
                    <a
                      key={idx}
                      href={download.link}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='bg-fluxby-purple hover:bg-fluxby-dark flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold text-white transition-colors'
                    >
                      <Download className='h-5 w-5' />
                      {download.label}
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className='mt-16 text-center text-sm text-gray-500 dark:text-gray-400'>
          <p className='mx-auto max-w-xl'>
            {t.downloads?.note || (
              <>
                Je hoeft niets te installeren om Fluxby te gebruiken; het werkt{' '}
                <span className='text-fluxby-purple font-semibold'>
                  volledig in je browser
                </span>
                . Deze downloads zijn beschikbaar voor wie de voorkeur geeft aan
                een dedicated applicatie op hun systeem.
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  );
};

export default Downloads;
