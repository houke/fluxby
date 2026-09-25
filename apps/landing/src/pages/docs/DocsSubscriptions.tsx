import { useLanguage } from '../../contexts/LanguageContext';
import CodeBlock from '../../components/docs/CodeBlock';

export default function DocsSubscriptions() {
  const { t } = useLanguage();

  const listPatternsCode = `// List all detected recurring patterns (subscriptions)
fetch('http://localhost:3001/api/recurring', {
  headers: { 'X-Profile-ID': 'your-profile-id' }
})
.then(response => response.json())
.then(patterns => console.log(patterns));`;

  const getStatsCode = `// Get subscription statistics
fetch('http://localhost:3001/api/recurring/stats', {
  headers: { 'X-Profile-ID': 'your-profile-id' }
})
.then(response => response.json())
.then(stats => console.log(stats));`;

  const detectPatternsCode = `// Run pattern detection on transactions
fetch('http://localhost:3001/api/recurring/detect', {
  method: 'POST',
  headers: { 'X-Profile-ID': 'your-profile-id' }
})
.then(response => response.json())
.then(result => console.log(result));`;

  const calendarCode = `// Get expected payments in a date range
fetch('http://localhost:3001/api/recurring/calendar?startDate=2024-03-01&endDate=2024-03-31', {
  headers: { 'X-Profile-ID': 'your-profile-id' }
})
.then(response => response.json())
.then(entries => console.log(entries));`;

  const confirmPatternCode = `// Confirm a pattern as a real subscription
fetch('http://localhost:3001/api/recurring/{id}/confirm', {
  method: 'POST',
  headers: { 'X-Profile-ID': 'your-profile-id' }
})
.then(response => response.json());`;

  const dismissPatternCode = `// Dismiss a pattern as a false positive
fetch('http://localhost:3001/api/recurring/{id}/dismiss', {
  method: 'POST',
  headers: { 'X-Profile-ID': 'your-profile-id' }
})
.then(response => response.json());`;

  const listResponse = `{
  "success": true,
  "data": [
    {
      "id": "pat_123abc",
      "opposingIban": "NL91ABNA0417164300",
      "merchantName": "Netflix",
      "patternType": "monthly",
      "avgAmount": -12.99,
      "lastAmount": -12.99,
      "lastDate": "2024-02-15",
      "nextExpectedDate": "2024-03-15",
      "isActive": true,
      "isConfirmed": true,
      "isDismissed": false,
      "isVariable": false,
      "transactionCount": 8,
      "profileId": "1",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "pat_456def",
      "opposingIban": "NL91ABNA0417164301",
      "merchantName": "Spotify",
      "patternType": "monthly",
      "avgAmount": -9.99,
      "lastAmount": -9.99,
      "lastDate": "2024-02-01",
      "nextExpectedDate": "2024-03-01",
      "isActive": true,
      "isConfirmed": false,
      "isDismissed": false,
      "isVariable": false,
      "transactionCount": 6,
      "profileId": "1",
      "createdAt": "2024-02-01T10:30:00.000Z"
    }
  ]
}`;

  const statsResponse = `{
  "success": true,
  "data": {
    "totalMonthlySpend": 95.47,
    "activeSubscriptions": 6,
    "confirmedSubscriptions": 4,
    "pendingConfirmation": 2
  }
}`;

  const calendarResponse = `{
  "success": true,
  "data": [
    {
      "id": "pat_456def",
      "date": "2024-03-01",
      "merchantName": "Spotify",
      "expectedAmount": -9.99,
      "patternType": "monthly",
      "isConfirmed": false
    },
    {
      "id": "pat_123abc",
      "date": "2024-03-15",
      "merchantName": "Netflix",
      "expectedAmount": -12.99,
      "patternType": "monthly",
      "isConfirmed": true
    }
  ]
}`;

  const detectResponse = `{
  "success": true,
  "data": {
    "detected": 3,
    "updated": 2
  }
}`;

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.subscriptions?.title}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.docs.subscriptions?.subtitle}
      </p>

      {/* Detection Note */}
      <div className='mt-6 rounded-xl border border-purple-200 bg-purple-50 p-6 dark:border-purple-800 dark:bg-purple-950/30'>
        <h3 className='mt-0 mb-2 flex items-center gap-2 text-lg font-semibold text-purple-900 dark:text-purple-200'>
          <span>🔍</span>
          {t.docs.subscriptions?.detectionNote}
        </h3>
        <p className='mb-0 text-purple-800 dark:text-purple-300'>
          {t.docs.subscriptions?.detectionNoteText}
        </p>
      </div>

      {/* Pattern Object */}
      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.subscriptions?.objectTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.subscriptions?.objectText}
      </p>

      <div className='not-prose mt-6 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700'>
        <table className='min-w-full'>
          <thead className='bg-gray-50 dark:bg-gray-800'>
            <tr>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.common?.tableField}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.common?.tableType}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.common?.tableDescription}
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900'>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>id</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                string
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.subscriptions?.fields?.id}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>merchantName</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                string | null
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.subscriptions?.fields?.merchantName}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>patternType</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                string
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.subscriptions?.fields?.patternType}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>avgAmount</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                number
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.subscriptions?.fields?.avgAmount}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>lastAmount</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                number
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.subscriptions?.fields?.lastAmount}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>nextExpectedDate</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                string | null
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.subscriptions?.fields?.nextExpectedDate}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>isConfirmed</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                boolean
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.subscriptions?.fields?.isConfirmed}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>isVariable</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                boolean
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.subscriptions?.fields?.isVariable}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>transactionCount</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                number
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.subscriptions?.fields?.transactionCount}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* List Patterns */}
      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.subscriptions?.listTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.subscriptions?.listText}
      </p>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50'>
          <span className='rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400'>
            GET
          </span>
          <code className='text-sm text-gray-700 dark:text-gray-300'>
            /api/recurring
          </code>
        </div>
      </div>

      <h3 className='mt-6 text-lg font-semibold text-gray-900 dark:text-gray-100'>
        {t.docs.common?.queryParams}
      </h3>
      <div className='not-prose mt-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700'>
        <table className='min-w-full'>
          <thead className='bg-gray-50 dark:bg-gray-800'>
            <tr>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.common?.tableField}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.common?.tableType}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.common?.tableDescription}
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900'>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>activeOnly</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                boolean
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.subscriptions?.params?.activeOnly}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className='not-prose mt-6 space-y-4'>
        <CodeBlock
          code={listPatternsCode}
          language='javascript'
          title={t.docs.common.request}
        />
        <CodeBlock
          code={listResponse}
          language='json'
          title={t.docs.common.response}
        />
      </div>

      {/* Get Stats */}
      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.subscriptions?.statsTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.subscriptions?.statsText}
      </p>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50'>
          <span className='rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400'>
            GET
          </span>
          <code className='text-sm text-gray-700 dark:text-gray-300'>
            /api/recurring/stats
          </code>
        </div>
      </div>

      <div className='not-prose mt-6 space-y-4'>
        <CodeBlock
          code={getStatsCode}
          language='javascript'
          title={t.docs.common.request}
        />
        <CodeBlock
          code={statsResponse}
          language='json'
          title={t.docs.common.response}
        />
      </div>

      {/* Calendar */}
      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.subscriptions?.calendarTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.subscriptions?.calendarText}
      </p>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50'>
          <span className='rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400'>
            GET
          </span>
          <code className='text-sm text-gray-700 dark:text-gray-300'>
            /api/recurring/calendar
          </code>
        </div>
      </div>

      <h3 className='mt-6 text-lg font-semibold text-gray-900 dark:text-gray-100'>
        {t.docs.common?.queryParams}
      </h3>
      <div className='not-prose mt-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700'>
        <table className='min-w-full'>
          <thead className='bg-gray-50 dark:bg-gray-800'>
            <tr>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.common?.tableField}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.common?.tableType}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.common?.tableRequired}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.common?.tableDescription}
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900'>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>startDate</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                string (YYYY-MM-DD)
              </td>
              <td className='px-4 py-3'>
                <span className='rounded bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-900/30 dark:text-green-400'>
                  {t.docs.common?.yes}
                </span>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.subscriptions?.params?.startDate}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>endDate</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                string (YYYY-MM-DD)
              </td>
              <td className='px-4 py-3'>
                <span className='rounded bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-900/30 dark:text-green-400'>
                  {t.docs.common?.yes}
                </span>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.subscriptions?.params?.endDate}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className='not-prose mt-6 space-y-4'>
        <CodeBlock
          code={calendarCode}
          language='javascript'
          title={t.docs.common.request}
        />
        <CodeBlock
          code={calendarResponse}
          language='json'
          title={t.docs.common.response}
        />
      </div>

      {/* Detect Patterns */}
      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.subscriptions?.detectTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.subscriptions?.detectText}
      </p>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50'>
          <span className='rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'>
            POST
          </span>
          <code className='text-sm text-gray-700 dark:text-gray-300'>
            /api/recurring/detect
          </code>
        </div>
      </div>

      <div className='not-prose mt-6 space-y-4'>
        <CodeBlock
          code={detectPatternsCode}
          language='javascript'
          title={t.docs.common.request}
        />
        <CodeBlock
          code={detectResponse}
          language='json'
          title={t.docs.common.response}
        />
      </div>

      <div className='mt-6 rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950/30'>
        <h3 className='mt-0 mb-2 flex items-center gap-2 text-lg font-semibold text-blue-900 dark:text-blue-200'>
          <span>💡</span>
          {t.docs.subscriptions?.detectNote}
        </h3>
        <ul className='mb-0 list-inside list-disc text-blue-800 dark:text-blue-300'>
          <li>{t.docs.subscriptions?.detectCriteria?.minTransactions}</li>
          <li>{t.docs.subscriptions?.detectCriteria?.minSpan}</li>
          <li>{t.docs.subscriptions?.detectCriteria?.consistency}</li>
        </ul>
      </div>

      {/* Confirm/Dismiss */}
      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.subscriptions?.actionsTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.subscriptions?.actionsText}
      </p>

      {/* Confirm */}
      <h3 className='mt-8 text-lg font-semibold text-gray-900 dark:text-gray-100'>
        {t.docs.subscriptions?.confirmTitle}
      </h3>

      <div className='mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50'>
          <span className='rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'>
            POST
          </span>
          <code className='text-sm text-gray-700 dark:text-gray-300'>
            /api/recurring/:id/confirm
          </code>
        </div>
      </div>

      <div className='not-prose mt-4'>
        <CodeBlock
          code={confirmPatternCode}
          language='javascript'
          title={t.docs.common.request}
        />
      </div>

      {/* Dismiss */}
      <h3 className='mt-8 text-lg font-semibold text-gray-900 dark:text-gray-100'>
        {t.docs.subscriptions?.dismissTitle}
      </h3>

      <div className='mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50'>
          <span className='rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'>
            POST
          </span>
          <code className='text-sm text-gray-700 dark:text-gray-300'>
            /api/recurring/:id/dismiss
          </code>
        </div>
      </div>

      <div className='not-prose mt-4'>
        <CodeBlock
          code={dismissPatternCode}
          language='javascript'
          title={t.docs.common.request}
        />
      </div>

      {/* Delete */}
      <h3 className='mt-8 text-lg font-semibold text-gray-900 dark:text-gray-100'>
        {t.docs.subscriptions?.deleteTitle}
      </h3>

      <div className='mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50'>
          <span className='rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-400'>
            DELETE
          </span>
          <code className='text-sm text-gray-700 dark:text-gray-300'>
            /api/recurring/:id
          </code>
        </div>
      </div>

      {/* Pattern Types */}
      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.subscriptions?.patternTypesTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.subscriptions?.patternTypesText}
      </p>

      <div className='not-prose mt-6 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700'>
        <table className='min-w-full'>
          <thead className='bg-gray-50 dark:bg-gray-800'>
            <tr>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.common.type}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.subscriptions?.intervalColumn}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.subscriptions?.exampleColumn}
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900'>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>weekly</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                5-9 {t.docs.subscriptions?.days}
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.subscriptions?.examples?.weekly}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>biweekly</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                12-16 {t.docs.subscriptions?.days}
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.subscriptions?.examples?.biweekly}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>monthly</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                26-35 {t.docs.subscriptions?.days}
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.subscriptions?.examples?.monthly}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>quarterly</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                85-100 {t.docs.subscriptions?.days}
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.subscriptions?.examples?.quarterly}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>yearly</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                350-380 {t.docs.subscriptions?.days}
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.subscriptions?.examples?.yearly}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Endpoints Summary */}
      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.subscriptions?.endpointsTitle}
      </h2>

      <div className='not-prose mt-6 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700'>
        <table className='min-w-full'>
          <thead className='bg-gray-50 dark:bg-gray-800'>
            <tr>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.common.method}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.common.endpoint}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.common?.tableDescription}
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900'>
            <tr>
              <td className='px-4 py-3'>
                <span className='rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400'>
                  GET
                </span>
              </td>
              <td className='px-4 py-3'>
                <code className='text-sm'>/api/recurring</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.subscriptions?.endpoints?.list}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <span className='rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400'>
                  GET
                </span>
              </td>
              <td className='px-4 py-3'>
                <code className='text-sm'>/api/recurring/stats</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.subscriptions?.endpoints?.stats}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <span className='rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400'>
                  GET
                </span>
              </td>
              <td className='px-4 py-3'>
                <code className='text-sm'>/api/recurring/calendar</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.subscriptions?.endpoints?.calendar}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <span className='rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'>
                  POST
                </span>
              </td>
              <td className='px-4 py-3'>
                <code className='text-sm'>/api/recurring/detect</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.subscriptions?.endpoints?.detect}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <span className='rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'>
                  POST
                </span>
              </td>
              <td className='px-4 py-3'>
                <code className='text-sm'>/api/recurring/:id/confirm</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.subscriptions?.endpoints?.confirm}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <span className='rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'>
                  POST
                </span>
              </td>
              <td className='px-4 py-3'>
                <code className='text-sm'>/api/recurring/:id/dismiss</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.subscriptions?.endpoints?.dismiss}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <span className='rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-400'>
                  DELETE
                </span>
              </td>
              <td className='px-4 py-3'>
                <code className='text-sm'>/api/recurring/:id</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.subscriptions?.endpoints?.delete}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  );
}
