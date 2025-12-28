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
        <div className='mb-16 text-center'>
          <h2 className='mb-6 text-5xl font-black text-gray-900 lg:text-6xl'>
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
              className='group flex transform flex-col items-center rounded-3xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-8 text-center shadow-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl'
            >
              <div
                className={`h-20 w-20 bg-gradient-to-r ${featureColors[index]} mb-6 flex items-center justify-center rounded-2xl text-4xl shadow-lg transition-transform duration-300 group-hover:scale-110`}
              >
                {featureIcons[index]}
              </div>
              <h3 className='group-hover:text-fluxby-purple mb-4 text-2xl font-bold text-gray-900 transition-colors'>
                {feature.title}
              </h3>
              <p className='leading-relaxed text-gray-600'>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
