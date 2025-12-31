import {
  Code2,
  Cpu,
  Lightbulb,
  Palette,
  Receipt,
  Rocket,
  Sparkles,
  Target,
  Users,
  Zap,
  ExternalLink,
  BookOpen,
  HelpCircle,
  Github,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

const AboutContent = () => {
  const { t } = useLanguage();
  const appHref = `${import.meta.env.BASE_URL}app/`;
  const aboutPage = t.legal?.aboutPage;

  if (!aboutPage) {
    return (
      <p className='text-lg text-gray-600 dark:text-gray-400'>
        Loading content...
      </p>
    );
  }

  return (
    <div className='about-content space-y-12'>
      {/* Hero Stats */}
      <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6'>
        {[
          { value: aboutPage.heroStats?.developer, icon: Users },
          { value: aboutPage.heroStats?.weeks, icon: Target },
          { value: aboutPage.heroStats?.models, icon: Cpu },
          { value: aboutPage.heroStats?.prompts, icon: Sparkles },
          { value: aboutPage.heroStats?.codeLines, icon: Code2 },
          { value: aboutPage.heroStats?.cost, icon: Receipt },
        ].map((stat, index) => (
          <div
            key={index}
            className='flex flex-col items-center rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-2 text-center dark:border-purple-900/30 dark:from-purple-900/20 dark:to-gray-900'
          >
            <stat.icon className='mb-2 h-5 w-5 text-purple-600 dark:text-purple-400' />
            <span className='text-sm font-medium text-gray-900 dark:text-gray-100'>
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* Introduction */}
      <section>
        <h2 className='mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white'>
          <Sparkles className='h-6 w-6 text-purple-600' />
          {aboutPage.intro?.title}
        </h2>
        <p className='text-lg leading-relaxed text-gray-600 dark:text-gray-400'>
          {aboutPage.intro?.content}
        </p>
      </section>

      {/* Background */}
      <section>
        <h2 className='mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white'>
          <Lightbulb className='h-6 w-6 text-purple-600' />
          {aboutPage.background?.title}
        </h2>
        <div className='space-y-4 text-gray-600 dark:text-gray-400'>
          <p className='leading-relaxed'>{aboutPage.background?.content1}</p>
          <p className='leading-relaxed'>{aboutPage.background?.content2}</p>
        </div>
      </section>

      {/* The Experiment */}
      <section>
        <h2 className='mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white'>
          <Rocket className='h-6 w-6 text-purple-600' />
          {aboutPage.experiment?.title}
        </h2>
        <p className='mb-4 leading-relaxed text-gray-600 dark:text-gray-400'>
          {aboutPage.experiment?.content}
        </p>
        <div className='rounded-lg border-l-4 border-purple-500 bg-purple-50 p-4 dark:bg-purple-900/20'>
          <p className='font-medium text-purple-900 dark:text-purple-100'>
            {aboutPage.experiment?.goal}
          </p>
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className='mb-6 flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white'>
          <Zap className='h-6 w-6 text-purple-600' />
          {aboutPage.features?.title}
        </h2>
        <div className='grid gap-6 md:grid-cols-2'>
          {[
            aboutPage.features?.categorization,
            aboutPage.features?.addressBook,
            aboutPage.features?.sharedIban,
            aboutPage.features?.multiTenancy,
          ]
            .filter(Boolean)
            .map((feature, index) => (
              <div
                key={index}
                className='rounded-xl border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800/50'
              >
                <h3 className='mb-2 font-semibold text-gray-900 dark:text-white'>
                  {feature?.title}
                </h3>
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  {feature?.content}
                </p>
              </div>
            ))}
        </div>
      </section>

      {/* Challenges */}
      <section>
        <h2 className='mb-6 flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white'>
          <Palette className='h-6 w-6 text-purple-600' />
          {aboutPage.challenges?.title}
        </h2>
        <div className='space-y-4'>
          {[
            aboutPage.challenges?.ui,
            aboutPage.challenges?.addressBookBugs,
            aboutPage.challenges?.darkMode,
          ]
            .filter(Boolean)
            .map((challenge, index) => (
              <div
                key={index}
                className='rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/50'
              >
                <h3 className='mb-1 font-semibold text-gray-900 dark:text-white'>
                  {challenge?.title}
                </h3>
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  {challenge?.content}
                </p>
              </div>
            ))}
        </div>
      </section>

      {/* Polish */}
      <section>
        <h2 className='mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white'>
          <Sparkles className='h-6 w-6 text-purple-600' />
          {aboutPage.polish?.title}
        </h2>
        <ul className='space-y-3 text-gray-600 dark:text-gray-400'>
          <li className='flex items-start gap-2'>
            <span className='mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-purple-500' />
            <span>{aboutPage.polish?.landing}</span>
          </li>
          <li className='flex items-start gap-2'>
            <span className='mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-purple-500' />
            <span>{aboutPage.polish?.docs}</span>
          </li>
          <li className='flex items-start gap-2'>
            <span className='mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-purple-500' />
            <span>{aboutPage.polish?.onboarding}</span>
          </li>
          <li className='flex items-start gap-2'>
            <span className='mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-purple-500' />
            <span>{aboutPage.polish?.mascot}</span>
          </li>
        </ul>
      </section>

      {/* Costs */}
      <section>
        <h2 className='mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white'>
          <Receipt className='h-6 w-6 text-purple-600' />
          {aboutPage.costs?.title}
        </h2>
        <p className='mb-4 leading-relaxed text-gray-600 dark:text-gray-400'>
          {aboutPage.costs?.content}
        </p>
        <div className='rounded-lg bg-gray-100 p-4 dark:bg-gray-800'>
          <ul className='space-y-2 text-sm'>
            <li className='flex items-center gap-2'>
              <span className='rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400'>
                Free
              </span>
              <span className='text-gray-700 dark:text-gray-300'>
                {aboutPage.costs?.strategy?.free}
              </span>
            </li>
            <li className='flex items-center gap-2'>
              <span className='rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'>
                Gemini
              </span>
              <span className='text-gray-700 dark:text-gray-300'>
                {aboutPage.costs?.strategy?.gemini}
              </span>
            </li>
            <li className='flex items-center gap-2'>
              <span className='rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'>
                Opus
              </span>
              <span className='text-gray-700 dark:text-gray-300'>
                {aboutPage.costs?.strategy?.opus}
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Room for Improvement */}
      <section>
        <h2 className='mb-4 text-2xl font-bold text-gray-900 dark:text-white'>
          {aboutPage.improvements?.title}
        </h2>
        <ul className='space-y-2'>
          {aboutPage.improvements?.items?.map((item: string, index: number) => (
            <li
              key={index}
              className='flex items-center gap-2 text-gray-600 dark:text-gray-400'
            >
              <span className='h-1.5 w-1.5 rounded-full bg-gray-400' />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Conclusion */}
      <section>
        <h2 className='mb-6 text-2xl font-bold text-gray-900 dark:text-white'>
          {aboutPage.conclusion?.title}
        </h2>
        <div className='space-y-4 text-gray-600 dark:text-gray-400'>
          {aboutPage.conclusion?.paragraphs?.map(
            (paragraph: string, index: number) => (
              <p key={index} className='leading-relaxed'>
                {paragraph}
              </p>
            )
          )}
        </div>
      </section>

      {/* Explore More Cards */}
      <section className='mt-12'>
        <h2 className='mb-6 text-2xl font-bold text-gray-900 dark:text-white'>
          {aboutPage.exploreMore?.title || 'Explore More'}
        </h2>
        <div className='grid gap-4 sm:grid-cols-2'>
          <a
            href={appHref}
            target='_blank'
            rel='noopener noreferrer'
            className='group flex items-start gap-4 rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 no-underline transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-purple-800 dark:from-purple-900/20 dark:to-pink-900/20'
          >
            <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-600 transition-transform duration-300 group-hover:scale-110'>
              <ExternalLink className='h-6 w-6 text-white' />
            </div>
            <div>
              <h3 className='mb-1 text-lg font-bold text-gray-900 dark:text-white'>
                {aboutPage.exploreMore?.app?.title || 'Try Fluxby Now'}
              </h3>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                {aboutPage.exploreMore?.app?.description ||
                  'See the magic for yourself! Dive into the app and experience what AI-powered finance management feels like.'}
              </p>
            </div>
          </a>

          <Link
            to='/docs'
            className='group flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-6 no-underline transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800/50'
          >
            <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 transition-transform duration-300 group-hover:scale-110'>
              <BookOpen className='h-6 w-6 text-white' />
            </div>
            <div>
              <h3 className='mb-1 text-lg font-bold text-gray-900 dark:text-white'>
                {aboutPage.exploreMore?.docs?.title || 'Developer Docs'}
              </h3>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                {aboutPage.exploreMore?.docs?.description ||
                  'For developers who want to build with Fluxby. Full API documentation, examples, and integration guides.'}
              </p>
            </div>
          </Link>

          <Link
            to='/help'
            className='group flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-6 no-underline transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800/50'
          >
            <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-600 transition-transform duration-300 group-hover:scale-110'>
              <HelpCircle className='h-6 w-6 text-white' />
            </div>
            <div>
              <h3 className='mb-1 text-lg font-bold text-gray-900 dark:text-white'>
                {aboutPage.exploreMore?.help?.title || 'Help Center'}
              </h3>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                {aboutPage.exploreMore?.help?.description ||
                  'Discover all the possibilities! Guides, tips, and everything you need to get the most out of Fluxby.'}
              </p>
            </div>
          </Link>

          <a
            href='https://github.com/houke/fluxby'
            target='_blank'
            rel='noopener noreferrer'
            className='group flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-6 no-underline transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800/50'
          >
            <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-800 transition-transform duration-300 group-hover:scale-110 dark:bg-gray-600'>
              <Github className='h-6 w-6 text-white' />
            </div>
            <div>
              <h3 className='mb-1 text-lg font-bold text-gray-900 dark:text-white'>
                {aboutPage.exploreMore?.github?.title || 'Contribute on GitHub'}
              </h3>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                {aboutPage.exploreMore?.github?.description ||
                  'Help make Fluxby even better! Report bugs, suggest features, or contribute code to the project.'}
              </p>
            </div>
          </a>
        </div>
      </section>

      {/* Personal Message */}
      <section className='mt-12 rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-8 text-center dark:border-purple-800 dark:from-purple-900/20 dark:to-pink-900/20'>
        <p className='mb-4 text-lg text-gray-700 dark:text-gray-300'>
          {aboutPage.personalMessage?.text ||
            "I hope you enjoy using Fluxby as much as I enjoyed building it! Go check out the demo — I've made sure there's a fully working demo profile available for you to test everything out! 🚀"}
        </p>
        <p className='font-["Caveat",_cursive] text-3xl text-purple-600 dark:text-purple-400'>
          — {aboutPage.personalMessage?.signature || 'Houke'}
        </p>
      </section>
    </div>
  );
};

export default AboutContent;
