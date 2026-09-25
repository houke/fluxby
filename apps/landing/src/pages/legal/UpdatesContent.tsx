import {
  BarChart3,
  BookOpen,
  Brain,
  Building2,
  Database,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Globe,
  Monitor,
  Palette,
  Plus,
  RefreshCw,
  Rocket,
  RotateCcw,
  Settings,
  Share2,
  Shield,
  Sparkles,
  Sun,
  Tag,
  Target,
  TrendingUp,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const UpdatesContent = () => {
  const { t } = useLanguage();
  const updatesPage = t.legal?.updatesPage;

  const releases = [
    {
      version: '1.13.3',
      date: updatesPage?.v1133Date,
      title: updatesPage?.v1133Title,
      description: updatesPage?.v1133Description,
      features: [
        {
          icon: Wrench,
          title: updatesPage?.v1133F1Title,
          description: updatesPage?.v1133F1Desc,
        },
      ],
    },
    {
      version: '1.13.2',
      date: updatesPage?.v1132Date,
      title: updatesPage?.v1132Title,
      description: updatesPage?.v1132Description,
      features: [
        {
          icon: RotateCcw,
          title: updatesPage?.v1132F1Title,
          description: updatesPage?.v1132F1Desc,
        },
      ],
    },
    {
      version: '1.13.1',
      date: updatesPage?.v1131Date,
      title: updatesPage?.v1131Title,
      description: updatesPage?.v1131Description,
      features: [
        {
          icon: Wrench,
          title: updatesPage?.v1131F1Title,
          description: updatesPage?.v1131F1Desc,
        },
      ],
    },
    {
      version: '1.13.0',
      date: updatesPage?.v1130Date,
      title: updatesPage?.v1130Title,
      description: updatesPage?.v1130Description,
      features: [
        {
          icon: Plus,
          title: updatesPage?.v1130F1Title,
          description: updatesPage?.v1130F1Desc,
        },
        {
          icon: Shield,
          title: updatesPage?.v1130F2Title,
          description: updatesPage?.v1130F2Desc,
        },
      ],
    },
    {
      version: '1.12.2',
      date: updatesPage?.v1122Date,
      title: updatesPage?.v1122Title,
      description: updatesPage?.v1122Description,
      features: [
        {
          icon: Wrench,
          title: updatesPage?.v1122F1Title,
          description: updatesPage?.v1122F1Desc,
        },
      ],
    },
    {
      version: '1.12.1',
      date: updatesPage?.v1121Date,
      title: updatesPage?.v1121Title,
      description: updatesPage?.v1121Description,
      features: [
        {
          icon: Globe,
          title: updatesPage?.v1121F1Title,
          description: updatesPage?.v1121F1Desc,
        },
      ],
    },
    {
      version: '1.12.0',
      date: updatesPage?.v1120Date,
      title: updatesPage?.v1120Title,
      description: updatesPage?.v1120Description,
      features: [
        {
          icon: Globe,
          title: updatesPage?.v1120F1Title,
          description: updatesPage?.v1120F1Desc,
        },
        {
          icon: Wrench,
          title: updatesPage?.v1120F2Title,
          description: updatesPage?.v1120F2Desc,
        },
      ],
    },
    {
      version: '1.11.0',
      date: updatesPage?.v1110Date,
      title: updatesPage?.v1110Title,
      description: updatesPage?.v1110Description,
      features: [
        {
          icon: BookOpen,
          title: updatesPage?.v1110F1Title,
          description: updatesPage?.v1110F1Desc,
        },
        {
          icon: Globe,
          title: updatesPage?.v1110F2Title,
          description: updatesPage?.v1110F2Desc,
        },
        {
          icon: Wrench,
          title: updatesPage?.v1110F3Title,
          description: updatesPage?.v1110F3Desc,
        },
      ],
    },
    {
      version: '1.10.0',
      date: updatesPage?.v1100Date,
      title: updatesPage?.v1100Title,
      description: updatesPage?.v1100Description,
      features: [
        {
          icon: Globe,
          title: updatesPage?.v1100F1Title,
          description: updatesPage?.v1100F1Desc,
        },
        {
          icon: Shield,
          title: updatesPage?.v1100F2Title,
          description: updatesPage?.v1100F2Desc,
        },
        {
          icon: BookOpen,
          title: updatesPage?.v1100F3Title,
          description: updatesPage?.v1100F3Desc,
        },
        {
          icon: Share2,
          title: updatesPage?.v1100F4Title,
          description: updatesPage?.v1100F4Desc,
        },
        {
          icon: Wrench,
          title: updatesPage?.v1100F5Title,
          description: updatesPage?.v1100F5Desc,
        },
      ],
    },
    {
      version: '1.9.0',
      date: updatesPage?.v190Date,
      title: updatesPage?.v190Title,
      description: updatesPage?.v190Description,
      features: [
        {
          icon: Globe,
          title: updatesPage?.v190F1Title,
          description: updatesPage?.v190F1Desc,
        },
        {
          icon: Globe,
          title: updatesPage?.v190F2Title,
          description: updatesPage?.v190F2Desc,
        },
      ],
    },
    {
      version: '1.8.2',
      date: updatesPage?.v182Date,
      title: updatesPage?.v182Title,
      description: updatesPage?.v182Description,
      features: [
        {
          icon: Database,
          title: updatesPage?.v182F1Title,
          description: updatesPage?.v182F1Desc,
        },
      ],
    },
    {
      version: '1.8.1',
      date: updatesPage?.v181Date,
      title: updatesPage?.v181Title,
      description: updatesPage?.v181Description,
      features: [],
    },
    {
      version: '1.8.0',
      date: updatesPage?.v180Date,
      title: updatesPage?.v180Title,
      description: updatesPage?.v180Description,
      features: [
        {
          icon: Wrench,
          title: updatesPage?.v180F1Title,
          description: updatesPage?.v180F1Desc,
        },
        {
          icon: Globe,
          title: updatesPage?.v180F2Title,
          description: updatesPage?.v180F2Desc,
        },
        {
          icon: Plus,
          title: updatesPage?.v180F3Title,
          description: updatesPage?.v180F3Desc,
        },
        {
          icon: Wrench,
          title: updatesPage?.v180F4Title,
          description: updatesPage?.v180F4Desc,
        },
      ],
    },
    {
      version: '1.7.1',
      date: updatesPage?.v171Date,
      title: updatesPage?.v171Title,
      description: updatesPage?.v171Description,
      features: [
        {
          icon: Monitor,
          title: updatesPage?.v171F1Title,
          description: updatesPage?.v171F1Desc,
        },
        {
          icon: Globe,
          title: updatesPage?.v171F2Title,
          description: updatesPage?.v171F2Desc,
        },
      ],
    },
    {
      version: '1.7.0',
      date: updatesPage?.v170Date,
      title: updatesPage?.v170Title,
      description: updatesPage?.v170Description,
      features: [
        {
          icon: Globe,
          title: updatesPage?.v170F1Title,
          description: updatesPage?.v170F1Desc,
        },
        {
          icon: Sparkles,
          title: updatesPage?.v170F2Title,
          description: updatesPage?.v170F2Desc,
        },
        {
          icon: Wrench,
          title: updatesPage?.v170F3Title,
          description: updatesPage?.v170F3Desc,
        },
      ],
    },
    {
      version: '1.6.0',
      date: updatesPage?.v160Date,
      title: updatesPage?.v160Title,
      description: updatesPage?.v160Description,
      features: [
        {
          icon: BarChart3,
          title: updatesPage?.v160F1Title,
          description: updatesPage?.v160F1Desc,
        },
        {
          icon: Globe,
          title: updatesPage?.v160F2Title,
          description: updatesPage?.v160F2Desc,
        },
        {
          icon: Brain,
          title: updatesPage?.v160F3Title,
          description: updatesPage?.v160F3Desc,
        },
        {
          icon: Wrench,
          title: updatesPage?.v160F4Title,
          description: updatesPage?.v160F4Desc,
        },
      ],
    },
    {
      version: '1.5.1',
      date: updatesPage?.v151Date,
      title: updatesPage?.v151Title,
      description: updatesPage?.v151Description,
      features: [
        {
          icon: Globe,
          title: updatesPage?.v151F1Title,
          description: updatesPage?.v151F1Desc,
        },
        {
          icon: Monitor,
          title: updatesPage?.v151F2Title,
          description: updatesPage?.v151F2Desc,
        },
      ],
    },
    {
      version: '1.5.0',
      date: updatesPage?.v150Date,
      title: updatesPage?.v150Title,
      description: updatesPage?.v150Description,
      features: [
        {
          icon: RefreshCw,
          title: updatesPage?.v150F1Title,
          description: updatesPage?.v150F1Desc,
        },
      ],
    },
    {
      version: '1.4.2',
      date: updatesPage?.v142Date,
      title: updatesPage?.v142Title,
      description: updatesPage?.v142Description,
      features: [
        {
          icon: Globe,
          title: updatesPage?.v142F1Title,
          description: updatesPage?.v142F1Desc,
        },
      ],
    },
    {
      version: '1.4.1',
      date: updatesPage?.v141Date,
      title: updatesPage?.v141Title,
      description: updatesPage?.v141Description,
      features: [
        {
          icon: FileText,
          title: updatesPage?.v141F1Title,
          description: updatesPage?.v141F1Desc,
        },
      ],
    },
    {
      version: '1.4.0',
      date: updatesPage?.v140Date,
      title: updatesPage?.v140Title,
      description: updatesPage?.v140Description,
      features: [
        {
          icon: Globe,
          title: updatesPage?.v140F1Title,
          description: updatesPage?.v140F1Desc,
        },
        {
          icon: RefreshCw,
          title: updatesPage?.v140F2Title,
          description: updatesPage?.v140F2Desc,
        },
        {
          icon: Monitor,
          title: updatesPage?.v140F3Title,
          description: updatesPage?.v140F3Desc,
        },
        {
          icon: Database,
          title: updatesPage?.v140F4Title,
          description: updatesPage?.v140F4Desc,
        },
        {
          icon: Share2,
          title: updatesPage?.v140F5Title,
          description: updatesPage?.v140F5Desc,
        },
        {
          icon: TrendingUp,
          title: updatesPage?.v140F6Title,
          description: updatesPage?.v140F6Desc,
        },
        {
          icon: Sun,
          title: updatesPage?.v140F7Title,
          description: updatesPage?.v140F7Desc,
        },
        {
          icon: Plus,
          title: updatesPage?.v140F8Title,
          description: updatesPage?.v140F8Desc,
        },
        {
          icon: Wrench,
          title: updatesPage?.v140F9Title,
          description: updatesPage?.v140F9Desc,
        },
      ],
    },
    {
      version: '1.3.1',
      date: updatesPage?.v131Date,
      title: updatesPage?.v131Title,
      description: updatesPage?.v131Description,
      features: [
        {
          icon: Rocket,
          title: updatesPage?.v131F1Title,
          description: updatesPage?.v131F1Desc,
        },
        {
          icon: FileText,
          title: updatesPage?.v131F2Title,
          description: updatesPage?.v131F2Desc,
        },
      ],
    },
    {
      version: '1.3.0',
      date: updatesPage?.v130Date,
      title: updatesPage?.v130Title,
      description: updatesPage?.v130Description,
      features: [
        {
          icon: Globe,
          title: updatesPage?.v130F1Title,
          description: updatesPage?.v130F1Desc,
        },
        {
          icon: Database,
          title: updatesPage?.v130F2Title,
          description: updatesPage?.v130F2Desc,
        },
        {
          icon: FileText,
          title: updatesPage?.v130F3Title,
          description: updatesPage?.v130F3Desc,
        },
        {
          icon: RefreshCw,
          title: updatesPage?.v130F4Title,
          description: updatesPage?.v130F4Desc,
        },
        {
          icon: Wrench,
          title: updatesPage?.v130F5Title,
          description: updatesPage?.v130F5Desc,
        },
      ],
    },
    {
      version: '1.2.0',
      date: updatesPage?.v120Date,
      title: updatesPage?.v120Title,
      description: updatesPage?.v120Description,
      features: [
        {
          icon: Brain,
          title: updatesPage?.v120F1Title,
          description: updatesPage?.v120F1Desc,
        },
        {
          icon: FileText,
          title: updatesPage?.v120F2Title,
          description: updatesPage?.v120F2Desc,
        },
        {
          icon: Database,
          title: updatesPage?.v120F3Title,
          description: updatesPage?.v120F3Desc,
        },
        {
          icon: Wrench,
          title: updatesPage?.v120F4Title,
          description: updatesPage?.v120F4Desc,
        },
      ],
    },
    {
      version: '1.1.0',
      date: updatesPage?.v110Date,
      title: updatesPage?.v110Title,
      description: updatesPage?.v110Description,
      features: [
        {
          icon: Settings,
          title: updatesPage?.v110F1Title,
          description: updatesPage?.v110F1Desc,
        },
        {
          icon: Globe,
          title: updatesPage?.v110F2Title,
          description: updatesPage?.v110F2Desc,
        },
        {
          icon: FileText,
          title: updatesPage?.v110F3Title,
          description: updatesPage?.v110F3Desc,
        },
        {
          icon: Wrench,
          title: updatesPage?.v110F4Title,
          description: updatesPage?.v110F4Desc,
        },
      ],
    },
    {
      version: '1.0.4',
      date: updatesPage?.v104Date,
      title: updatesPage?.v104Title,
      description: updatesPage?.v104Description,
      features: [],
    },
    {
      version: '1.0.3',
      date: updatesPage?.v103Date,
      title: updatesPage?.v103Title,
      description: updatesPage?.v103Description,
      features: [
        {
          icon: Rocket,
          title: updatesPage?.v103F1Title,
          description: updatesPage?.v103F1Desc,
        },
      ],
    },
    {
      version: '1.0.2',
      date: updatesPage?.v102Date,
      title: updatesPage?.v102Title,
      description: updatesPage?.v102Description,
      features: [
        {
          icon: Wrench,
          title: updatesPage?.v102F1Title,
          description: updatesPage?.v102F1Desc,
        },
      ],
    },
    {
      version: '1.0.1',
      date: updatesPage?.v101Date,
      title: updatesPage?.v101Title,
      description: updatesPage?.v101Description,
      features: [
        // Features from v1.0.1
        {
          icon: Sparkles,
          title: updatesPage?.v101F1Title,
          description: updatesPage?.v101F1Desc,
        },
      ],
    },
    {
      version: '1.0.0',
      date: updatesPage?.v100Date,
      title: updatesPage?.v100Title,
      description: updatesPage?.v100Description,
      features: [
        {
          icon: FileSpreadsheet,
          title: updatesPage?.f1Title,
          description: updatesPage?.f1Desc,
        },
        {
          icon: BarChart3,
          title: updatesPage?.f2Title,
          description: updatesPage?.f2Desc,
        },
        {
          icon: Tag,
          title: updatesPage?.f3Title,
          description: updatesPage?.f3Desc,
        },
        {
          icon: Target,
          title: updatesPage?.f4Title,
          description: updatesPage?.f4Desc,
        },
        {
          icon: Building2,
          title: updatesPage?.f5Title,
          description: updatesPage?.f5Desc,
        },
        {
          icon: Users,
          title: updatesPage?.f6Title,
          description: updatesPage?.f6Desc,
        },
        {
          icon: Shield,
          title: updatesPage?.f7Title,
          description: updatesPage?.f7Desc,
        },
        {
          icon: Brain,
          title: updatesPage?.f8Title,
          description: updatesPage?.f8Desc,
        },
        {
          icon: Palette,
          title: updatesPage?.f9Title,
          description: updatesPage?.f9Desc,
        },
        {
          icon: Globe,
          title: updatesPage?.f10Title,
          description: updatesPage?.f10Desc,
        },
        {
          icon: Download,
          title: updatesPage?.f11Title,
          description: updatesPage?.f11Desc,
        },
        {
          icon: BookOpen,
          title: updatesPage?.f12Title,
          description: updatesPage?.f12Desc,
        },
      ],
    },
  ];

  return (
    <>
      <p className='mb-8 text-lg text-gray-600 dark:text-gray-400'>
        {updatesPage?.intro}
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
                    <a
                      href={`https://github.com/houke/fluxby/releases/tag/v${release.version}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='flex items-center gap-1 text-sm text-purple-600 transition-colors hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300'
                    >
                      {updatesPage?.viewRelease}
                      <ExternalLink className='h-3 w-3' />
                    </a>
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
          {updatesPage?.comingSoonTitle}
        </h3>
        <p className='text-gray-500 dark:text-gray-400'>
          {updatesPage?.comingSoonText}
        </p>
      </div>
    </>
  );
};

export default UpdatesContent;
