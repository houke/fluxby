import { useLanguage } from '../contexts/LanguageContext';

const featureIcons = ['💳', '📊', '🎯', '🔒', '🏦', '🎨'];
const featureColors = [
  'from-blue-400 to-purple-500',
  'from-green-400 to-blue-500',
  'from-pink-400 to-red-500',
  'from-purple-400 to-pink-500',
  'from-yellow-400 to-orange-500',
  'from-indigo-400 to-purple-500',
];

const Features = () => {
  const { t } = useLanguage();

  return (
    <section id='features' className='section-padding bg-white'>
      <div className='container mx-auto px-4'>
        <div className='mb-12 text-center md:mb-16'>
          <h2 className='mb-6 text-2xl font-black text-gray-900 sm:text-4xl lg:text-6xl'>
            {t.features.title}{' '}
            <span className='text-fluxby-purple'>
              {t.features.titleHighlight}
            </span>
            ?
          </h2>
          <p className='mx-auto max-w-3xl text-xl text-gray-600'>
            {t.features.subtitle}
          </p>
        </div>

        <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
          {t.features.items.map((feature, index) => (
            <div
              key={index}
              className='group flex transform flex-row items-center gap-4 rounded-3xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-6 text-left shadow-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl md:flex-col md:gap-0 md:p-8 md:text-center'
            >
              <div
                className={`flex h-12 w-12 min-w-[3rem] items-center justify-center rounded-2xl bg-gradient-to-r text-2xl shadow-lg transition-transform duration-300 group-hover:scale-110 md:mb-6 md:h-20 md:w-20 md:text-4xl ${featureColors[index]}`}
              >
                {featureIcons[index]}
              </div>
              <div className='flex-1 md:flex-none'>
                <h3 className='group-hover:text-fluxby-purple mb-1 text-xl font-bold text-gray-900 transition-colors md:mb-4 md:text-2xl'>
                  {feature.title}
                </h3>
                <p className='leading-relaxed text-gray-600'>
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
