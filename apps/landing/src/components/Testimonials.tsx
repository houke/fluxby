import { useLanguage } from '../contexts/LanguageContext';

const Testimonials = () => {
  const { t } = useLanguage();

  return (
    <section className='section-padding bg-white'>
      <div className='container mx-auto px-6'>
        <div className='mb-16 text-center'>
          <h2 className='mb-6 text-5xl font-black text-gray-900 lg:text-6xl'>
            {t.testimonials.title}{' '}
            <span className='text-fluxby-purple'>
              {t.testimonials.titleHighlight}
            </span>
          </h2>
          <p className='mx-auto max-w-3xl text-xl text-gray-600'>
            {t.testimonials.subtitle}
          </p>
        </div>

        <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
          {t.testimonials.items.map((testimonial, index) => (
            <div
              key={index}
              className='transform rounded-3xl border border-purple-100 bg-gradient-to-br from-white to-purple-50 p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl'
            >
              {/* Rating stars */}
              <div className='mb-6 flex gap-1'>
                {[...Array(5)].map((_, i) => (
                  <span key={i} className='text-xl text-yellow-400'>
                    ⭐
                  </span>
                ))}
              </div>

              {/* Quote */}
              <blockquote className='mb-6 text-lg leading-relaxed text-gray-700 italic'>
                &ldquo;{testimonial.content}&rdquo;
              </blockquote>

              {/* Author */}
              <div className='flex items-center gap-4'>
                <div className='bg-fluxby-light flex h-12 w-12 items-center justify-center rounded-full text-2xl'>
                  {testimonial.avatar}
                </div>
                <div>
                  <div className='font-bold text-gray-900'>
                    {testimonial.name}
                  </div>
                  <div className='text-sm text-gray-600'>
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Social proof stats */}
        <div className='mt-20 grid grid-cols-2 gap-8 text-center md:grid-cols-4'>
          <div>
            <div className='text-fluxby-purple mb-2 text-4xl font-black'>
              {t.testimonials.stats.users}
            </div>
            <div className='text-gray-600'>
              {t.testimonials.stats.usersLabel}
            </div>
          </div>
          <div>
            <div className='text-fluxby-purple mb-2 text-4xl font-black'>
              {t.testimonials.stats.saved}
            </div>
            <div className='text-gray-600'>
              {t.testimonials.stats.savedLabel}
            </div>
          </div>
          <div>
            <div className='text-fluxby-purple mb-2 text-4xl font-black'>
              {t.testimonials.stats.rating}
            </div>
            <div className='text-gray-600'>
              {t.testimonials.stats.ratingLabel}
            </div>
          </div>
          <div>
            <div className='text-fluxby-purple mb-2 text-4xl font-black'>
              {t.testimonials.stats.countries}
            </div>
            <div className='text-gray-600'>
              {t.testimonials.stats.countriesLabel}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
