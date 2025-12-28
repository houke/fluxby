import { useLanguage } from '../../contexts/LanguageContext';
import CodeBlock from '../../components/docs/CodeBlock';

export default function DocsIntroduction() {
  const { t } = useLanguage();

  const baseUrl = 'http://localhost:3001/api';

  const exampleCode = `// Example: Get your dashboard stats
fetch('${baseUrl}/analytics/dashboard', {
  headers: {
    'X-Profile-ID': 'your-profile-id'
  }
})
.then(response => response.json())
.then(data => console.log(data));`;

  const responseExample = `{
  "totalIncome": 5420.50,
  "totalExpenses": 3280.75,
  "balance": 2139.75,
  "transactionCount": 156,
  "topCategories": [
    { "name": "Groceries", "amount": 850.00 },
    { "name": "Transport", "amount": 420.50 }
  ]
}`;

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.introduction?.title || 'Fluxby API Documentatie'}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.docs?.introduction?.subtitle ||
          'Bouw krachtige integraties met je financiële gegevens. Toegang tot transacties, categorieën, budgetten en analyses via onze RESTful API.'}
      </p>

      <div className='mt-8 rounded-xl border border-purple-200 bg-purple-50 p-6 dark:border-purple-800 dark:bg-purple-950/30'>
        <h3 className='mb-2 mt-0 flex items-center gap-2 text-lg font-semibold text-purple-900 dark:text-purple-200'>
          <span>🚀</span>
          {t.docs?.introduction?.quickStartTitle || 'Snelstart'}
        </h3>
        <p className='mb-0 text-purple-800 dark:text-purple-300'>
          {t.docs?.introduction?.quickStartText ||
            'Ga binnen enkele minuten aan de slag. De API draait lokaal op http://localhost:3001/api zonder authenticatie voor lokale ontwikkeling.'}
        </p>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.introduction?.whatCanYouBuildTitle || 'Wat kun je bouwen?'}
      </h2>
      <div className='mt-6 grid gap-4 md:grid-cols-2'>
        {[
          {
            icon: '📊',
            title:
              t.docs?.introduction?.useCases?.[0]?.title ||
              'Aangepaste dashboards',
            desc:
              t.docs?.introduction?.useCases?.[0]?.description ||
              'Bouw gepersonaliseerde financiële dashboards met je favoriete visualisatie library.',
          },
          {
            icon: '🤖',
            title:
              t.docs?.introduction?.useCases?.[1]?.title || 'Automatiseringen',
            desc:
              t.docs?.introduction?.useCases?.[1]?.description ||
              'Maak scripts die automatisch transacties categoriseren of rapporten genereren.',
          },
          {
            icon: '📱',
            title: t.docs?.introduction?.useCases?.[2]?.title || 'Mobiele apps',
            desc:
              t.docs?.introduction?.useCases?.[2]?.description ||
              'Bouw mobiele companion apps die synchroniseren met je Fluxby data.',
          },
          {
            icon: '🔔',
            title: t.docs?.introduction?.useCases?.[3]?.title || 'Notificaties',
            desc:
              t.docs?.introduction?.useCases?.[3]?.description ||
              'Stel alerts in voor budgetlimieten, ongebruikelijke uitgaven of terugkerende betalingen.',
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'
          >
            <div className='mb-2 text-2xl'>{item.icon}</div>
            <h3 className='mb-1 font-semibold text-gray-900 dark:text-gray-100'>
              {item.title}
            </h3>
            <p className='mb-0 text-sm text-gray-600 dark:text-gray-400'>
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.introduction?.makeFirstRequest || 'Je eerste request maken'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.introduction?.makeFirstRequestText ||
          'Hier is een eenvoudig voorbeeld om je dashboard statistieken op te halen:'}
      </p>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-900'>
          <span className='rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/50 dark:text-green-300'>
            GET
          </span>
          <code className='text-sm text-gray-700 dark:text-gray-300'>
            /api/analytics/dashboard
          </code>
        </div>
      </div>

      <div className='mt-6 space-y-4'>
        <CodeBlock
          code={exampleCode}
          language='javascript'
          title={t.docs?.introduction?.requestTitle || 'Verzoek'}
        />
        <CodeBlock
          code={responseExample}
          language='json'
          title={t.docs?.introduction?.responseTitle || 'Respons'}
        />
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.introduction?.baseUrlTitle || 'Basis URL'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.introduction?.baseUrlText ||
          'Alle API endpoints zijn relatief ten opzichte van de basis URL:'}
      </p>
      <div className='mt-4 overflow-hidden rounded-lg border border-gray-200 bg-gray-900 p-4 dark:border-gray-700'>
        <code className='text-green-400'>{baseUrl}</code>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.introduction?.nextStepsTitle || 'Volgende stappen'}
      </h2>
      <div className='mt-4 space-y-3'>
        {[
          {
            emoji: '🔐',
            text:
              t.docs?.introduction?.nextSteps?.[0] || 'Leer over authenticatie',
            link: '/docs/authentication',
          },
          {
            emoji: '👥',
            text:
              t.docs?.introduction?.nextSteps?.[1] ||
              'Begrijp profielen & multi-tenancy',
            link: '/docs/profiles',
          },
          {
            emoji: '💸',
            text:
              t.docs?.introduction?.nextSteps?.[2] ||
              'Verken de Transacties API',
            link: '/docs/transactions',
          },
        ].map((item, idx) => (
          <a
            key={idx}
            href={item.link}
            className='flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 text-gray-700 no-underline transition-colors hover:border-purple-300 hover:bg-purple-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-purple-600 dark:hover:bg-purple-950/30'
          >
            <span className='text-xl'>{item.emoji}</span>
            <span>{item.text}</span>
            <span className='ml-auto text-gray-400'>→</span>
          </a>
        ))}
      </div>
    </article>
  );
}
