import { FluxbyWebGL } from '@fluxby/shared';
import { useLanguage } from '../contexts/LanguageContext';

const CTA = () => {
  const { t } = useLanguage();
  const appHref = `${import.meta.env.BASE_URL}app/`;

  return (
    <section className='section-padding gradient-bg relative overflow-hidden'>
      {/* Bokeh background decorations */}
      <div className='pointer-events-none absolute inset-0'>
        <div
          className='absolute animate-pulse rounded-full'
          style={{
            width: '200px',
            height: '200px',
            top: '10%',
            left: '5%',
            background:
              'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 60%)',
            filter: 'blur(30px)',
          }}
        />
        <div
          className='animate-float absolute rounded-full'
          style={{
            width: '180px',
            height: '180px',
            bottom: '15%',
            right: '10%',
            background:
              'radial-gradient(circle, rgba(196, 181, 253, 0.3) 0%, transparent 60%)',
            filter: 'blur(35px)',
            animationDelay: '-3s',
          }}
        />
        <div
          className='animate-pulse-slow absolute rounded-full'
          style={{
            width: '150px',
            height: '150px',
            top: '40%',
            left: '20%',
            background:
              'radial-gradient(circle, rgba(244, 114, 182, 0.25) 0%, transparent 60%)',
            filter: 'blur(25px)',
          }}
        />
        <div
          className='animate-float absolute rounded-full'
          style={{
            width: '120px',
            height: '120px',
            top: '20%',
            right: '25%',
            background:
              'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 60%)',
            filter: 'blur(30px)',
            animationDelay: '-1.5s',
          }}
        />
      </div>

      <div className='container relative z-10 mx-auto px-4 text-center'>
        <div className='mx-auto max-w-4xl'>
          <h2 className='mb-6 text-3xl font-black leading-tight text-white md:mb-8 sm:text-5xl lg:text-7xl'>
            {t.cta.title.part1}{' '}
            <span className='text-fluxby-light'>{t.cta.title.highlight}</span>{' '}
            {t.cta.title.part2}
          </h2>
          <p className='mx-auto mb-8 max-w-2xl text-xl leading-relaxed text-white md:mb-12 lg:text-2xl'>
            {t.cta.description}
          </p>

          {/* CTA Buttons */}
          <div className='mb-12 flex flex-col justify-center sm:flex-row md:mb-16'>
            <a
              href={appHref}
              target='_blank'
              rel='noopener noreferrer'
              className='text-fluxby-purple hover:bg-fluxby-light fluffy-shadow transform rounded-full bg-white px-12 py-6 text-xl font-black shadow-2xl transition-all duration-300 hover:scale-105 hover:text-white'
            >
              {t.cta.getStarted}
            </a>
          </div>

          {/* Small Fluxby Avatar */}
          <div className='flex justify-center'>
            <div className='avatar-breathe relative'>
              {/* Bokeh effect behind avatar - using absolute positioning and visible colors */}
              <div
                className='animate-pulse-slow absolute rounded-full'
                style={{
                  width: '300px',
                  height: '300px',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background:
                    'radial-gradient(circle, rgba(139, 92, 246, 0.6) 0%, rgba(139, 92, 246, 0.3) 30%, transparent 60%)',
                  filter: 'blur(40px)',
                  zIndex: 0,
                }}
              />
              <FluxbyWebGL
                width={240}
                height={240}
                className='relative z-10 drop-shadow-2xl'
                interactive={true}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
