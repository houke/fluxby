import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const featureIcons = ['🔌', '📚', '⚡'];

export default function Developer() {
  const { t } = useLanguage();
  const appHref = `${import.meta.env.BASE_URL}app/`;

  const features = [
    {
      icon: featureIcons[0],
      title: t.developer?.features[0]?.title || 'RESTful API',
      description:
        t.developer?.features[0]?.description ||
        'Clean REST endpoints for all data operations. Transactions, categories, budgets, and analytics.',
    },
    {
      icon: featureIcons[1],
      title: t.developer?.features[1]?.title || 'OpenAPI/Swagger',
      description:
        t.developer?.features[1]?.description ||
        'Interactive API documentation at /api/docs. Try endpoints directly in your browser.',
    },
    {
      icon: featureIcons[2],
      title: t.developer?.features[2]?.title || 'Easy Integration',
      description:
        t.developer?.features[2]?.description ||
        'JSON responses, standard HTTP methods. Build custom dashboards or automations.',
    },
  ];

  const endpoints = [
    { method: 'GET', path: '/api/transactions', desc: 'List transactions' },
    {
      method: 'GET',
      path: '/api/analytics/dashboard',
      desc: 'Dashboard stats',
    },
    { method: 'GET', path: '/api/categories', desc: 'All categories' },
    { method: 'POST', path: '/api/import/csv', desc: 'Import bank CSV' },
  ];

  return (
    <section
      id='developer'
      className='section-padding relative overflow-hidden bg-gradient-to-b from-gray-900 to-gray-800 text-white'
    >
      {/* Background pattern */}
      <div className='absolute inset-0 opacity-10'>
        <div
          className='absolute inset-0'
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className='relative container mx-auto px-4'>
        <div className='mb-12 text-center md:mb-16'>
          <div className='mb-4 inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-4 py-2 text-purple-300'>
            <span className='text-lg'>🛠️</span>
            <span className='text-sm font-medium'>
              {t.developer?.badge || 'Developer API'}
            </span>
          </div>
          <h2 className='mb-4 text-4xl font-bold md:text-5xl'>
            {t.developer?.title || 'Build with'}{' '}
            <span className='bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent'>
              {t.developer?.titleHighlight || 'Fluxby API'}
            </span>
          </h2>
          <p className='mx-auto max-w-2xl text-lg text-gray-400'>
            {t.developer?.subtitle ||
              'Access your financial data programmatically. Create custom integrations, dashboards, or automate your workflows.'}
          </p>
        </div>

        {/* Features grid */}
        <div className='mb-16 grid gap-8 md:grid-cols-3'>
          {features.map((feature, index) => (
            <div
              key={index}
              className='group rounded-2xl border border-gray-700 bg-gray-800/50 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/50 hover:bg-gray-800 hover:shadow-xl hover:shadow-purple-500/10'
            >
              <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 text-2xl transition-transform duration-300 group-hover:scale-110'>
                {feature.icon}
              </div>
              <h3 className='mb-2 text-xl font-semibold'>{feature.title}</h3>
              <p className='text-gray-400'>{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Code example */}
        <div className='overflow-hidden rounded-2xl border border-gray-700 bg-gray-800/80 backdrop-blur-sm'>
          <div className='flex items-center gap-2 border-b border-gray-700 bg-gray-900/50 px-4 py-3'>
            <div className='h-3 w-3 rounded-full bg-red-500' />
            <div className='h-3 w-3 rounded-full bg-yellow-500' />
            <div className='h-3 w-3 rounded-full bg-green-500' />
            <span className='ml-4 text-sm text-gray-400'>
              {t.developer?.endpointsTitle || 'API Endpoints'}
            </span>
          </div>
          <div className='p-6'>
            <div className='space-y-3 font-mono text-sm'>
              {endpoints.map((endpoint, index) => (
                <div key={index} className='flex items-center gap-3'>
                  <span
                    className={`w-16 rounded px-2 py-1 text-center text-xs font-semibold ${
                      endpoint.method === 'GET'
                        ? 'bg-green-500/20 text-green-400'
                        : endpoint.method === 'POST'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-orange-500/20 text-orange-400'
                    }`}
                  >
                    {endpoint.method}
                  </span>
                  <code className='text-purple-300'>{endpoint.path}</code>
                  <span className='text-gray-500'>// {endpoint.desc}</span>
                </div>
              ))}
              <div className='mt-4 text-gray-500'>
                {t.developer?.moreEndpoints || '... and 20+ more endpoints'}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className='mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row'>
          <Link
            to='/docs'
            className='inline-flex items-center gap-2 rounded-full bg-purple-600 px-8 py-3 font-medium text-white transition-all hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/25'
          >
            <span>📖</span>
            {t.developer?.viewDocs || 'View API Docs'}
          </Link>
          <a
            href={appHref}
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center gap-2 rounded-full border border-gray-600 bg-gray-800 px-8 py-3 font-medium text-white transition-all hover:border-gray-500 hover:bg-gray-700'
          >
            <span>⚡</span>
            {t.developer?.tryApp || 'Try the App'}
          </a>
        </div>
      </div>
    </section>
  );
}
