import { useLanguage } from '../../contexts/LanguageContext';
import CodeBlock from '../../components/docs/CodeBlock';

export default function DocsAnalytics() {
  const { t } = useLanguage();

  const dashboardCode = `// Get dashboard statistics
fetch('http://localhost:3001/api/analytics/dashboard', {
  headers: { 'X-Profile-ID': 'your-profile-id' }
})
.then(response => response.json())
.then(stats => console.log(stats));`;

  const monthlyCode = `// Get monthly breakdown
const params = new URLSearchParams({
  year: '2024',
  month: '3'
});

fetch(\`http://localhost:3001/api/analytics/monthly?\${params}\`, {
  headers: { 'X-Profile-ID': 'your-profile-id' }
})
.then(response => response.json())
.then(data => console.log(data));`;

  const categoriesCode = `// Get category breakdown
fetch('http://localhost:3001/api/analytics/categories', {
  headers: { 'X-Profile-ID': 'your-profile-id' }
})
.then(response => response.json())
.then(categories => console.log(categories));`;

  const dashboardResponse = `{
  "totalIncome": 5420.50,
  "totalExpenses": 3280.75,
  "balance": 2139.75,
  "transactionCount": 156,
  "avgDailySpending": 109.36,
  "topCategories": [
    { "name": "Groceries", "amount": 850.00, "percentage": 26 },
    { "name": "Transport", "amount": 420.50, "percentage": 13 },
    { "name": "Dining", "amount": 380.25, "percentage": 12 }
  ],
  "recentTrend": {
    "thisMonth": 3280.75,
    "lastMonth": 2950.00,
    "change": 11.2
  }
}`;

  const monthlyResponse = `{
  "year": 2024,
  "month": 3,
  "income": 5420.50,
  "expenses": 3280.75,
  "savings": 2139.75,
  "savingsRate": 39.5,
  "dailyBreakdown": [
    { "date": "2024-03-01", "income": 0, "expenses": 45.50 },
    { "date": "2024-03-02", "income": 0, "expenses": 120.00 },
    { "date": "2024-03-03", "income": 2500.00, "expenses": 0 }
    // ... more days
  ],
  "categoryBreakdown": [
    { "category": "Groceries", "amount": 420.00, "count": 12 },
    { "category": "Transport", "amount": 180.50, "count": 8 }
  ]
}`;

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.analytics?.title || 'Analyses'}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.docs?.analytics?.subtitle ||
          'Krijg inzicht in je bestedingspatronen met uitgebreide analyse-endpoints.'}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.analytics?.dashboardTitle || 'Dashboard statistieken'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.analytics?.dashboardText ||
          'Krijg een overzicht van je financiële gezondheid:'}
      </p>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50'>
          <span className='rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400'>
            GET
          </span>
          <code className='text-sm text-gray-700 dark:text-gray-300'>
            /api/analytics/dashboard
          </code>
        </div>
      </div>

      <div className='mt-6 space-y-4'>
        <CodeBlock code={dashboardCode} language='javascript' title='Request' />
        <CodeBlock code={dashboardResponse} language='json' title='Response' />
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.analytics?.monthlyTitle || 'Maandelijkse data'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.analytics?.monthlyText ||
          'Haal gedetailleerde maandstatistieken op met dagelijkse uitsplitsing:'}
      </p>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50'>
          <span className='rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400'>
            GET
          </span>
          <code className='text-sm text-gray-700 dark:text-gray-300'>
            /api/analytics/monthly
          </code>
        </div>
      </div>

      <h3 className='mt-6 text-lg font-semibold text-gray-900 dark:text-gray-100'>
        {t.docs?.analytics?.queryParams || 'Query parameters'}
      </h3>
      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700'>
        <table className='min-w-full'>
          <thead className='bg-gray-50 dark:bg-gray-800'>
            <tr>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                Parameter
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                Type
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                Beschrijving
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900'>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>year</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                number
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.analytics?.yearDesc || 'Jaar (bijv. 2024)'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>month</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                number
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.analytics?.monthDesc || 'Maand (1-12)'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className='mt-6 space-y-4'>
        <CodeBlock code={monthlyCode} language='javascript' title='Request' />
        <CodeBlock code={monthlyResponse} language='json' title='Response' />
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.analytics?.categoriesTitle || 'Categorie uitsplitsing'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.analytics?.categoriesText ||
          'Bekijk hoe uitgaven verdeeld zijn over categorieën:'}
      </p>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50'>
          <span className='rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400'>
            GET
          </span>
          <code className='text-sm text-gray-700 dark:text-gray-300'>
            /api/analytics/categories
          </code>
        </div>
      </div>

      <div className='mt-6'>
        <CodeBlock
          code={categoriesCode}
          language='javascript'
          title='Request'
        />
      </div>

      <div className='mt-8 rounded-xl border border-purple-200 bg-purple-50 p-6 dark:border-purple-800 dark:bg-purple-950/30'>
        <h3 className='mb-2 mt-0 flex items-center gap-2 text-lg font-semibold text-purple-900 dark:text-purple-200'>
          <span>💡</span>
          {t.docs?.analytics?.tipTitle || 'Pro tip'}
        </h3>
        <p className='mb-0 text-purple-800 dark:text-purple-300'>
          {t.docs?.analytics?.tipText ||
            'Combineer analyse-endpoints met transactiefilters om aangepaste rapporten te maken. Vergelijk bijvoorbeeld uitgaven tussen maanden of volg categorie trends over tijd.'}
        </p>
      </div>
    </article>
  );
}
