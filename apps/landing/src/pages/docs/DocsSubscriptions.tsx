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
        {t.docs.subscriptions?.title || 'Abonnementen'}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.docs.subscriptions?.subtitle ||
          'Detecteer en beheer terugkerende betalingen automatisch. Krijg inzicht in je maandelijkse vaste lasten.'}
      </p>

      {/* Detection Note */}
      <div className='mt-6 rounded-xl border border-purple-200 bg-purple-50 p-6 dark:border-purple-800 dark:bg-purple-950/30'>
        <h3 className='mt-0 mb-2 flex items-center gap-2 text-lg font-semibold text-purple-900 dark:text-purple-200'>
          <span>🔍</span>
          {t.docs.subscriptions?.detectionNote || 'Automatische detectie'}
        </h3>
        <p className='mb-0 text-purple-800 dark:text-purple-300'>
          {t.docs.subscriptions?.detectionNoteText ||
            'Fluxby analyseert je transactiehistorie en detecteert automatisch terugkerende patronen. Patronen worden gedetecteerd wanneer dezelfde merchant minimaal 3 keer voorkomt met regelmatige intervallen.'}
        </p>
      </div>

      {/* Pattern Object */}
      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.subscriptions?.objectTitle || 'Het Patroon Object'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.subscriptions?.objectText ||
          'Een recurring pattern representeert een gedetecteerd abonnement of terugkerende betaling.'}
      </p>

      <div className='not-prose mt-6 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700'>
        <table className='min-w-full'>
          <thead className='bg-gray-50 dark:bg-gray-800'>
            <tr>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.common?.tableField || 'Veld'}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.common?.tableType || 'Type'}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.common?.tableDescription || 'Beschrijving'}
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
                {t.docs.subscriptions?.fields?.id || 'Unieke identifier'}
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
                {t.docs.subscriptions?.fields?.merchantName ||
                  'Naam van de merchant'}
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
                {t.docs.subscriptions?.fields?.patternType ||
                  'weekly, biweekly, monthly, quarterly, yearly'}
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
                {t.docs.subscriptions?.fields?.avgAmount ||
                  'Gemiddeld bedrag (negatief voor uitgaven)'}
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
                {t.docs.subscriptions?.fields?.lastAmount ||
                  'Laatste afgeschreven bedrag'}
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
                {t.docs.subscriptions?.fields?.nextExpectedDate ||
                  'Verwachte volgende afschrijfdatum'}
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
                {t.docs.subscriptions?.fields?.isConfirmed ||
                  'Of het patroon door de gebruiker is bevestigd'}
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
                {t.docs.subscriptions?.fields?.isVariable ||
                  'Of het bedrag varieert (>10% afwijking)'}
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
                {t.docs.subscriptions?.fields?.transactionCount ||
                  'Aantal keer dat dit patroon is gedetecteerd'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* List Patterns */}
      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.subscriptions?.listTitle || 'Patronen ophalen'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.subscriptions?.listText ||
          'Haal alle gedetecteerde terugkerende patronen op:'}
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
        {t.docs.common?.queryParams || 'Query parameters'}
      </h3>
      <div className='not-prose mt-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700'>
        <table className='min-w-full'>
          <thead className='bg-gray-50 dark:bg-gray-800'>
            <tr>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.common?.tableField || 'Veld'}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.common?.tableType || 'Type'}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.common?.tableDescription || 'Beschrijving'}
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
                {t.docs.subscriptions?.params?.activeOnly ||
                  'Alleen actieve patronen (default: true)'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className='not-prose mt-6 space-y-4'>
        <CodeBlock
          code={listPatternsCode}
          language='javascript'
          title='Request'
        />
        <CodeBlock code={listResponse} language='json' title='Response' />
      </div>

      {/* Get Stats */}
      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.subscriptions?.statsTitle || 'Statistieken ophalen'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.subscriptions?.statsText ||
          'Krijg een overzicht van je terugkerende kosten:'}
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
        <CodeBlock code={getStatsCode} language='javascript' title='Request' />
        <CodeBlock code={statsResponse} language='json' title='Response' />
      </div>

      {/* Calendar */}
      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.subscriptions?.calendarTitle || 'Verwachte betalingen'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.subscriptions?.calendarText ||
          'Haal verwachte betalingen op voor een datumbereik:'}
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
        {t.docs.common?.queryParams || 'Query parameters'}
      </h3>
      <div className='not-prose mt-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700'>
        <table className='min-w-full'>
          <thead className='bg-gray-50 dark:bg-gray-800'>
            <tr>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.common?.tableField || 'Veld'}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.common?.tableType || 'Type'}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.common?.tableRequired || 'Verplicht'}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.common?.tableDescription || 'Beschrijving'}
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
                  {t.docs.common?.yes || 'Ja'}
                </span>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.subscriptions?.params?.startDate || 'Startdatum'}
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
                  {t.docs.common?.yes || 'Ja'}
                </span>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.subscriptions?.params?.endDate || 'Einddatum'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className='not-prose mt-6 space-y-4'>
        <CodeBlock code={calendarCode} language='javascript' title='Request' />
        <CodeBlock code={calendarResponse} language='json' title='Response' />
      </div>

      {/* Detect Patterns */}
      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.subscriptions?.detectTitle || 'Patronen detecteren'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.subscriptions?.detectText ||
          'Voer patroondetectie uit op je transactiehistorie:'}
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
          title='Request'
        />
        <CodeBlock code={detectResponse} language='json' title='Response' />
      </div>

      <div className='mt-6 rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950/30'>
        <h3 className='mt-0 mb-2 flex items-center gap-2 text-lg font-semibold text-blue-900 dark:text-blue-200'>
          <span>💡</span>
          {t.docs.subscriptions?.detectNote || 'Detectie criteria'}
        </h3>
        <ul className='mb-0 list-inside list-disc text-blue-800 dark:text-blue-300'>
          <li>
            {t.docs.subscriptions?.detectCriteria?.minTransactions ||
              'Minimaal 3 transacties van dezelfde merchant'}
          </li>
          <li>
            {t.docs.subscriptions?.detectCriteria?.minSpan ||
              'Transacties moeten over minimaal 2 maanden verspreid zijn'}
          </li>
          <li>
            {t.docs.subscriptions?.detectCriteria?.consistency ||
              'Consistente intervallen (±3 dagen tolerantie)'}
          </li>
        </ul>
      </div>

      {/* Confirm/Dismiss */}
      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.subscriptions?.actionsTitle || 'Patronen beheren'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.subscriptions?.actionsText ||
          'Bevestig patronen als echte abonnementen of negeer false positives:'}
      </p>

      {/* Confirm */}
      <h3 className='mt-8 text-lg font-semibold text-gray-900 dark:text-gray-100'>
        {t.docs.subscriptions?.confirmTitle || 'Patroon bevestigen'}
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
          title='Request'
        />
      </div>

      {/* Dismiss */}
      <h3 className='mt-8 text-lg font-semibold text-gray-900 dark:text-gray-100'>
        {t.docs.subscriptions?.dismissTitle || 'Patroon negeren'}
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
          title='Request'
        />
      </div>

      {/* Delete */}
      <h3 className='mt-8 text-lg font-semibold text-gray-900 dark:text-gray-100'>
        {t.docs.subscriptions?.deleteTitle || 'Patroon verwijderen'}
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
        {t.docs.subscriptions?.patternTypesTitle || 'Patroon types'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.subscriptions?.patternTypesText ||
          'Fluxby detecteert de volgende patronen:'}
      </p>

      <div className='not-prose mt-6 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700'>
        <table className='min-w-full'>
          <thead className='bg-gray-50 dark:bg-gray-800'>
            <tr>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                Type
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.subscriptions?.intervalColumn || 'Interval'}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.subscriptions?.exampleColumn || 'Voorbeeld'}
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900'>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>weekly</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                5-9 {t.docs.subscriptions?.days || 'dagen'}
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.subscriptions?.examples?.weekly ||
                  'Wekelijkse boodschappen'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>biweekly</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                12-16 {t.docs.subscriptions?.days || 'dagen'}
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.subscriptions?.examples?.biweekly ||
                  'Tweewekelijkse loon'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>monthly</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                26-35 {t.docs.subscriptions?.days || 'dagen'}
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.subscriptions?.examples?.monthly ||
                  'Netflix, Spotify, huur'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>quarterly</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                85-100 {t.docs.subscriptions?.days || 'dagen'}
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.subscriptions?.examples?.quarterly ||
                  'Kwartaalabonnement'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>yearly</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                350-380 {t.docs.subscriptions?.days || 'dagen'}
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.subscriptions?.examples?.yearly ||
                  'Jaarabonnement, verzekering'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Endpoints Summary */}
      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.subscriptions?.endpointsTitle || 'Alle Endpoints'}
      </h2>

      <div className='not-prose mt-6 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700'>
        <table className='min-w-full'>
          <thead className='bg-gray-50 dark:bg-gray-800'>
            <tr>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                Method
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                Endpoint
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.common?.tableDescription || 'Beschrijving'}
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
                {t.docs.subscriptions?.endpoints?.list ||
                  'Lijst alle patronen op'}
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
                {t.docs.subscriptions?.endpoints?.stats ||
                  'Haal statistieken op'}
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
                {t.docs.subscriptions?.endpoints?.calendar ||
                  'Haal verwachte betalingen op'}
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
                {t.docs.subscriptions?.endpoints?.detect ||
                  'Voer patroondetectie uit'}
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
                {t.docs.subscriptions?.endpoints?.confirm ||
                  'Bevestig een patroon'}
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
                {t.docs.subscriptions?.endpoints?.dismiss ||
                  'Negeer een patroon'}
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
                {t.docs.subscriptions?.endpoints?.delete ||
                  'Verwijder een patroon'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  );
}
