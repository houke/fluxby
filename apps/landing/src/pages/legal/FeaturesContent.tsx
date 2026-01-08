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
      title: featuresPage?.smartTracking?.title || 'Slimme transactie tracking',
      description:
        featuresPage?.smartTracking?.description ||
        'Categoriseer automatisch je uitgaven en inkomsten met AI-gestuurde herkenning. Fluxby leert je uitgavenpatronen en suggereert betere manieren om te sparen.',
      highlights: featuresPage?.smartTracking?.highlights || [
        'Automatische categorisatie',
        'Patroonherkenning',
        'Slimme suggesties',
      ],
    },
    {
      title: featuresPage?.analytics?.title || 'Mooie analytics',
      description:
        featuresPage?.analytics?.description ||
        'Prachtige grafieken die het begrijpen van je financiën leuk maken. Zie je geld groeien met interactieve visualisaties.',
      highlights: featuresPage?.analytics?.highlights || [
        'Interactieve grafieken',
        'Trend analyse',
        'Categorie verdeling',
      ],
    },
    {
      title: featuresPage?.budgets?.title || 'Budget doelen',
      description:
        featuresPage?.budgets?.description ||
        'Stel schattige budgetdoelen in met Fluxby die je aanmoedigt. Bekijk je voortgang met leuke animaties.',
      highlights: featuresPage?.budgets?.highlights || [
        'Maandelijkse limieten',
        'Voortgang tracking',
        'Overschrijding alerts',
      ],
    },
    {
      title: featuresPage?.privacy?.title || '100% lokaal & privé',
      description:
        featuresPage?.privacy?.description ||
        'Je financiële data verlaat nooit je apparaat. Geen cloud, geen servers, geen tracking - alles blijft op je computer.',
      highlights: featuresPage?.privacy?.highlights || [
        'Geen cloud opslag',
        'Geen accounts nodig',
        'Volledige privacy',
      ],
    },
    {
      title: featuresPage?.bankImport?.title || 'Bank CSV import',
      description:
        featuresPage?.bankImport?.description ||
        'Exporteer eenvoudig transacties van je bank en importeer ze in Fluxby. Werkt met meerdere banken.',
      highlights: featuresPage?.bankImport?.highlights || [
        'Meerdere banken ondersteuning',
        'Drag & drop upload',
        'Duplicaat detectie',
      ],
    },
    {
      title: featuresPage?.peer2peer?.title || 'Peer-to-peer sync',
      description:
        featuresPage?.peer2peer?.description ||
        'Synchroniseer je data veilig tussen apparaten zonder cloud server. Je apparaten praten direct met elkaar.',
      highlights: featuresPage?.peer2peer?.highlights || [
        'End-to-end encryptie',
        'Geen centrale server',
        'Sync tussen apparaten',
      ],
    },
    {
      title: featuresPage?.multiProfile?.title || 'Meerdere profielen',
      description:
        featuresPage?.multiProfile?.description ||
        'Maak aparte profielen voor persoonlijk, zakelijk of gezinsfinanciën. Houd alles georganiseerd maar gescheiden.',
      highlights: featuresPage?.multiProfile?.highlights || [
        'Aparte werkruimtes',
        'Vlot wisselen',
        'Gescheiden data',
      ],
    },
    {
      title: featuresPage?.customization?.title || 'Persoonlijke ervaring',
      description:
        featuresPage?.customization?.description ||
        "Pas Fluxby aan met verschillende thema's en instellingen. Maak financieel beheer uniek van jou.",
      highlights: featuresPage?.customization?.highlights || [
        'Donkere modus',
        'Aanpasbare categorieën',
        'Eigen kleuren & iconen',
      ],
    },
    {
      title: featuresPage?.realtime?.title || 'Realtime updates',
      description:
        featuresPage?.realtime?.description ||
        'Zie je financiële overzicht direct veranderen wanneer je transacties toevoegt of bewerkt.',
      highlights: featuresPage?.realtime?.highlights || [
        'Directe dashboard updates',
        'Live grafieken',
        'Automatische herberekening',
      ],
    },
    {
      title: featuresPage?.ai?.title || 'AI-gestuurde inzichten',
      description:
        featuresPage?.ai?.description ||
        'Lokale AI helpt je bij het categoriseren en begrijpen van je uitgaven zonder je data te delen.',
      highlights: featuresPage?.ai?.highlights || [
        'Categorisatie suggesties',
        'Uitgavenpatronen',
        'Bespaartips',
      ],
    },
    {
      title: featuresPage?.multiAccount?.title || 'Meerdere rekeningen',
      description:
        featuresPage?.multiAccount?.description ||
        'Beheer al je bankrekeningen op één plek. Zie je totale vermogen en cashflow overzichtelijk.',
      highlights: featuresPage?.multiAccount?.highlights || [
        'Onbeperkt rekeningen',
        'Gecombineerd overzicht',
        'Per rekening filteren',
      ],
    },
    {
      title: featuresPage?.addressBook?.title || 'Adresboek',
      description:
        featuresPage?.addressBook?.description ||
        'Koppel transacties aan contacten. Zie hoeveel je uitgeeft aan specifieke winkels of personen.',
      highlights: featuresPage?.addressBook?.highlights || [
        'Contact koppeling',
        'Uitgaven per contact',
        'Auto-suggesties',
      ],
    },
    {
      title: featuresPage?.security?.title || 'Veilig & betrouwbaar',
      description:
        featuresPage?.security?.description ||
        'Geen externe verbindingen betekent geen risico op datalekken. Je data is zo veilig als je apparaat.',
      highlights: featuresPage?.security?.highlights || [
        'Offline beschikbaar',
        'Geen externe API calls',
        'Lokale database',
      ],
    },
    {
      title: featuresPage?.sync?.title || 'Export & backup',
      description:
        featuresPage?.sync?.description ||
        'Exporteer je data wanneer je wilt. Maak back-ups voor gemoedsrust.',
      highlights: featuresPage?.sync?.highlights || [
        'JSON export',
        'CSV export',
        'Database backup',
      ],
    },
    {
      title: featuresPage?.languages?.title || 'Nederlands & Engels',
      description:
        featuresPage?.languages?.description ||
        'Gebruik Fluxby in je voorkeurstaal. Volledig vertaald interface.',
      highlights: featuresPage?.languages?.highlights || [
        'Nederlandse UI',
        'Engelse UI',
        'Makkelijk wisselen',
      ],
    },
    {
      title: featuresPage?.openSource?.title || 'Open source',
      description:
        featuresPage?.openSource?.description ||
        'Volledig open source en transparant. Bekijk de code, draag bij, of pas het aan.',
      highlights: featuresPage?.openSource?.highlights || [
        'GitHub repository',
        'Community driven',
        'Transparante code',
      ],
    },
  ];

  return (
    <>
      <p className='mb-8 text-lg text-gray-600 dark:text-gray-400'>
        {featuresPage?.intro ||
          'Ontdek alles wat Fluxby te bieden heeft. Van slimme transactie tracking tot prachtige analytics - alles wat je nodig hebt om je financiën te beheren.'}
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
