import { useLanguage } from '../../contexts/LanguageContext';
import {
  BarChart3,
  BookOpen,
  Brain,
  Building2,
  Download,
  FileSpreadsheet,
  FileText,
  Globe,
  Palette,
  Rocket,
  Settings,
  Shield,
  Sparkles,
  Tag,
  Target,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';

const UpdatesContent = () => {
  const { t } = useLanguage();
  const updatesPage = t.legal?.updatesPage;

  const releases = [
        {
      version: '1.1.0',
      date: updatesPage?.v110Date || '5 januari 2026',
      title: updatesPage?.v110Title || 'Release 1.1.0',
      description:
        updatesPage?.v110Description ||
        '7 nieuwe features en 10 bugfixes.',
      features: [
        {
          icon: Settings,
          title: updatesPage?.v110F1Title || 'Remove Install Fluxby card from app settings',
          description: updatesPage?.v110F1Desc || 'Nieuwe functionaliteit toegevoegd.',
        },
        {
          icon: Globe,
          title: updatesPage?.v110F2Title || 'Web app verbeteringen',
          description: updatesPage?.v110F2Desc || '3 nieuwe features. Zie changelog voor details.',
        },
        {
          icon: FileText,
          title: updatesPage?.v110F3Title || 'Landingspagina verbeteringen',
          description: updatesPage?.v110F3Desc || '3 nieuwe features. Zie changelog voor details.',
        },
        {
          icon: Wrench,
          title: updatesPage?.v110F4Title || 'Bugfixes',
          description: updatesPage?.v110F4Desc || '10 bugs opgelost. Zie changelog voor details.',
        },
      ],
    },
    {
      version: '1.0.4',
      date: updatesPage?.v104Date || '4 januari 2026',
      title: updatesPage?.v104Title || 'Release 1.0.4',
      description:
        updatesPage?.v104Description || 'Nieuwe verbeteringen en bugfixes.',
      features: [],
    },
    {
      version: '1.0.3',
      date: updatesPage?.v103Date || '4 januari 2026',
      title: updatesPage?.v103Title || 'Release 1.0.3',
      description: updatesPage?.v103Description || '1 bugfix.',
      features: [
        {
          icon: Rocket,
          title:
            updatesPage?.v103F1Title ||
            'Sync versions to tauri files and fix duplicate releases',
          description: updatesPage?.v103F1Desc || 'Bug opgelost.',
        },
      ],
    },
    {
      version: '1.0.2',
      date: updatesPage?.v102Date || '4 januari 2026',
      title: updatesPage?.v102Title || 'Release 1.0.2',
      description: updatesPage?.v102Description || '5 bugfixes.',
      features: [
        {
          icon: Wrench,
          title: updatesPage?.v102F1Title || 'Bugfixes',
          description:
            updatesPage?.v102F1Desc ||
            '5 bugs opgelost. Zie changelog voor details.',
        },
      ],
    },
    {
      version: '1.0.1',
      date: updatesPage?.v101Date || '4 januari 2026',
      title: updatesPage?.v101Title || 'Release 1.0.1',
      description:
        updatesPage?.v101Description || 'Nieuwe verbeteringen en bugfixes.',
      features: [
        // Features from v1.0.1
        {
          icon: Sparkles,
          title:
            updatesPage?.v101F1Title || 'implement per-file version checking',
          description: updatesPage?.v101F1Desc || 'See changelog for details.',
        },
      ],
    },
    {
      version: '1.0.0',
      date: updatesPage?.v100Date || '04 januari 2026',
      title: updatesPage?.v100Title || 'Eerste release',
      description:
        updatesPage?.v100Description ||
        'De eerste officiële versie van Fluxby is live! Dit is alles wat erin zit:',
      features: [
        {
          icon: FileSpreadsheet,
          title: updatesPage?.f1Title || 'CSV Import',
          description:
            updatesPage?.f1Desc ||
            'Importeer je banktransacties eenvoudig via CSV-export van je bank. Op dit moment wordt ING ondersteund, met meer banken in de toekomst.',
        },
        {
          icon: BarChart3,
          title: updatesPage?.f2Title || 'Dashboard & Analytics',
          description:
            updatesPage?.f2Desc ||
            'Krijg direct inzicht in je financiën met een overzichtelijk dashboard. Bekijk je inkomsten, uitgaven en trends in mooie interactieve grafieken.',
        },
        {
          icon: Tag,
          title: updatesPage?.f3Title || 'Slimme categorisatie',
          description:
            updatesPage?.f3Desc ||
            'Transacties worden automatisch gecategoriseerd. Je kunt ook eigen categorieën maken met aangepaste kleuren en iconen.',
        },
        {
          icon: Target,
          title: updatesPage?.f4Title || 'Budget tracking',
          description:
            updatesPage?.f4Desc ||
            'Stel maandelijkse budgetten in per categorie en houd je voortgang bij. Krijg visueel overzicht van hoeveel je nog kunt uitgeven.',
        },
        {
          icon: Building2,
          title: updatesPage?.f5Title || 'Meerdere rekeningen',
          description:
            updatesPage?.f5Desc ||
            'Beheer al je bankrekeningen op één plek. Betaalrekening, spaarrekening, creditcard - alles gecombineerd in één overzicht.',
        },
        {
          icon: Users,
          title: updatesPage?.f6Title || 'Adresboek',
          description:
            updatesPage?.f6Desc ||
            'Koppel transacties aan contacten en zie hoeveel je uitgeeft bij specifieke winkels of personen. Automatische suggesties maken het makkelijk.',
        },
        {
          icon: Shield,
          title: updatesPage?.f7Title || '100% Privacy',
          description:
            updatesPage?.f7Desc ||
            'Al je data blijft lokaal op je apparaat. Geen cloud, geen accounts, geen tracking. Jouw financiële gegevens zijn alleen van jou.',
        },
        {
          icon: Brain,
          title: updatesPage?.f8Title || 'AI-gestuurde herkenning',
          description:
            updatesPage?.f8Desc ||
            'Lokale AI helpt bij het herkennen en categoriseren van transacties zonder je data te delen met externe diensten.',
        },
        {
          icon: Palette,
          title: updatesPage?.f9Title || 'Donkere modus',
          description:
            updatesPage?.f9Desc ||
            "Werk in de modus die bij je past. Schakel makkelijk tussen lichte en donkere thema's.",
        },
        {
          icon: Globe,
          title: updatesPage?.f10Title || 'Nederlands & Engels',
          description:
            updatesPage?.f10Desc ||
            'Volledig vertaalde interface in het Nederlands en Engels. Wissel wanneer je wilt.',
        },
        {
          icon: Download,
          title: updatesPage?.f11Title || 'Export functionaliteit',
          description:
            updatesPage?.f11Desc ||
            'Exporteer je data naar JSON of CSV formaat. Maak back-ups wanneer je wilt voor gemoedsrust.',
        },
        {
          icon: BookOpen,
          title: updatesPage?.f12Title || 'Developer API',
          description:
            updatesPage?.f12Desc ||
            'Volledige REST API documentatie voor developers die willen integreren of uitbreiden. Swagger UI inbegrepen.',
        },
      ],
    },
  ];

  return (
    <>
      <p className='mb-8 text-lg text-gray-600 dark:text-gray-400'>
        {updatesPage?.intro ||
          'Bekijk wat er nieuw is in Fluxby. Hier vind je alle updates en nieuwe features.'}
      </p>

      <div className='space-y-8'>
        {releases.map((release, releaseIndex) => (
          <div key={releaseIndex}>
            {/* Version Header */}
            <div className='mb-6 flex items-center gap-4'>
              <div className='flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg'>
                <Sparkles className='h-7 w-7 text-white' />
              </div>
              <div className='flex-1'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <span className='rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'>
                      v{release.version}
                    </span>
                  </div>
                  <p className='text-gray-500 dark:text-gray-400'>
                    {release.date}
                  </p>
                </div>
              </div>
            </div>

            <p className='mb-6 text-gray-600 dark:text-gray-400'>
              {release.description}
            </p>

            {/* Features Grid */}
            <div className='grid gap-4'>
              {release.features.map((feature, featureIndex) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={featureIndex}
                    className='group flex gap-4 rounded-xl border border-gray-300 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-purple-200 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-purple-700'
                  >
                    <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-purple-100 transition-transform duration-300 group-hover:scale-110 dark:bg-purple-900/30'>
                      <Icon className='h-6 w-6 text-purple-600 dark:text-purple-400' />
                    </div>
                    <div className='flex flex-1 flex-col justify-center'>
                      <h3 className='m-0 text-lg font-bold text-gray-900 dark:text-white'>
                        {feature.title}
                      </h3>
                      <p className='text-sm text-gray-600 dark:text-gray-400'>
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Coming Soon */}
      <div className='mt-12 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/30'>
        <Zap className='mx-auto mb-4 h-10 w-10 text-gray-400' />
        <h3 className='mb-2 text-lg font-bold text-gray-700 dark:text-gray-300'>
          {updatesPage?.comingSoonTitle || 'Meer updates komen eraan'}
        </h3>
        <p className='text-gray-500 dark:text-gray-400'>
          {updatesPage?.comingSoonText ||
            'We werken continu aan nieuwe features en verbeteringen. Houd deze pagina in de gaten!'}
        </p>
      </div>
    </>
  );
};

export default UpdatesContent;
