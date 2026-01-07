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
        {t.docs.introduction.title}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.docs.introduction.subtitle}
      </p>

      <div className='mt-8 rounded-xl border border-purple-200 bg-purple-50 p-6 dark:border-purple-800 dark:bg-purple-950/30'>
        <h3 className='mt-0 mb-2 flex items-center gap-2 text-lg font-semibold text-purple-900 dark:text-purple-200'>
          <span>🚀</span>
          {t.docs.introduction.quickStartTitle}
        </h3>
        <p className='mb-0 text-purple-800 dark:text-purple-300'>
          {t.docs.introduction.quickStartText}
        </p>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.introduction.whatCanYouBuildTitle}
      </h2>
      <div className='mt-6 grid gap-4 md:grid-cols-2'>
        {[
          {
            icon: '📊',
            title: t.docs.introduction.useCases[0].title,
            desc: t.docs.introduction.useCases[0].description,
          },
          {
            icon: '🤖',
            title: t.docs.introduction.useCases[1].title,
            desc: t.docs.introduction.useCases[1].description,
          },
          {
            icon: '📱',
            title: t.docs.introduction.useCases[2].title,
            desc: t.docs.introduction.useCases[2].description,
          },
          {
            icon: '🔔',
            title: t.docs.introduction.useCases[3].title,
            desc: t.docs.introduction.useCases[3].description,
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
        {t.docs.introduction.makeFirstRequest}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.introduction.makeFirstRequestText}
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

      <div className='not-prose mt-6 space-y-4'>
        <CodeBlock
          code={exampleCode}
          language='javascript'
          title={t.docs.introduction.requestTitle}
        />
        <CodeBlock
          code={responseExample}
          language='json'
          title={t.docs.introduction.responseTitle}
        />
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.introduction.baseUrlTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.introduction.baseUrlText}
      </p>
      <div className='mt-4 overflow-hidden rounded-lg border border-gray-200 bg-gray-900 p-4 dark:border-gray-700'>
        <code className='text-green-400'>{baseUrl}</code>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.introduction.nextStepsTitle}
      </h2>
      <div className='mt-4 space-y-3'>
        {[
          {
            emoji: '🔐',
            text: t.docs.introduction.nextSteps[0],
            link: '/docs/authentication',
          },
          {
            emoji: '👥',
            text: t.docs.introduction.nextSteps[1],
            link: '/docs/profiles',
          },
          {
            emoji: '💸',
            text: t.docs.introduction.nextSteps[2],
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
