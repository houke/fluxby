import { useLanguage } from '../../contexts/LanguageContext';
import CodeBlock from '../../components/docs/CodeBlock';

export default function DocsTransactions() {
  const { t } = useLanguage();

  const listTransactionsCode = `// List transactions with filters
const params = new URLSearchParams({
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  category: 'groceries',
  limit: '50'
});

fetch(\`http://localhost:3001/api/transactions?\${params}\`, {
  headers: { 'X-Profile-ID': 'your-profile-id' }
})
.then(response => response.json())
.then(data => console.log(data));`;

  const updateTransactionCode = `// Update a transaction's category
fetch('http://localhost:3001/api/transactions/txn_123abc', {
  method: 'PATCH',
  headers: {
    'X-Profile-ID': 'your-profile-id',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    categoryId: 'cat_groceries',
    notes: 'Weekly grocery shopping'
  })
})
.then(response => response.json())
.then(transaction => console.log(transaction));`;

  const responseExample = `{
  "transactions": [
    {
      "id": "txn_123abc",
      "date": "2024-03-15",
      "amount": -45.50,
      "description": "Albert Heijn",
      "counterparty": "Albert Heijn BV",
      "category": {
        "id": "cat_groceries",
        "name": "Groceries",
        "color": "#22c55e"
      },
      "accountId": "acc_123",
      "type": "expense"
    },
    {
      "id": "txn_456def",
      "date": "2024-03-14",
      "amount": 2500.00,
      "description": "Salary March",
      "counterparty": "Employer BV",
      "category": {
        "id": "cat_income",
        "name": "Income",
        "color": "#3b82f6"
      },
      "accountId": "acc_123",
      "type": "income"
    }
  ],
  "pagination": {
    "total": 156,
    "page": 1,
    "limit": 50,
    "pages": 4
  }
}`;

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.transactions?.title || 'Transacties'}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.docs?.transactions?.subtitle ||
          'Zoek, filter en beheer je financiële transacties. Importeer vanuit bankexports of maak handmatig aan.'}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.transactions?.listTitle || 'Transacties ophalen'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.transactions?.listText ||
          'Haal transacties op met krachtige filteropties:'}
      </p>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50'>
          <span className='rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400'>
            GET
          </span>
          <code className='text-sm text-gray-700 dark:text-gray-300'>
            /api/transactions
          </code>
        </div>
      </div>

      <h3 className='mt-6 text-lg font-semibold text-gray-900 dark:text-gray-100'>
        {t.docs?.transactions?.queryParams || 'Query parameters'}
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
                <code className='text-sm'>startDate</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                string
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.transactions?.startDateDesc ||
                  'Filter vanaf deze datum (JJJJ-MM-DD)'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>endDate</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                string
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.transactions?.endDateDesc ||
                  'Filter tot deze datum (JJJJ-MM-DD)'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>category</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                string
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.transactions?.categoryDesc ||
                  'Filter op categorie ID of naam'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>type</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                string
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.transactions?.typeDesc || 'inkomsten of uitgaven'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>search</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                string
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.transactions?.searchDesc ||
                  'Zoek in omschrijving en tegenpartij'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>limit</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                number
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.transactions?.limitDesc ||
                  'Aantal resultaten (standaard: 50, max: 500)'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>page</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                number
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.transactions?.pageDesc ||
                  'Paginanummer voor paginering'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className='mt-6 space-y-4'>
        <CodeBlock
          code={listTransactionsCode}
          language='javascript'
          title='Request'
        />
        <CodeBlock code={responseExample} language='json' title='Response' />
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.transactions?.updateTitle || 'Transactie bijwerken'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.transactions?.updateText ||
          'Wijzig een transactie om de categorie te veranderen, notities toe te voegen of andere velden bij te werken:'}
      </p>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50'>
          <span className='rounded bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'>
            PATCH
          </span>
          <code className='text-sm text-gray-700 dark:text-gray-300'>
            /api/transactions/:id
          </code>
        </div>
      </div>

      <div className='mt-6'>
        <CodeBlock code={updateTransactionCode} language='javascript' />
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.transactions?.importTitle || 'Importeren vanuit CSV'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.transactions?.importText ||
          'Bulk import transacties vanuit je bankexport:'}
      </p>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50'>
          <span className='rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'>
            POST
          </span>
          <code className='text-sm text-gray-700 dark:text-gray-300'>
            /api/import/csv
          </code>
        </div>
      </div>

      <div className='mt-6'>
        <CodeBlock
          code={`// Import transactions from CSV
const formData = new FormData();
formData.append('file', csvFile);
formData.append('accountId', 'acc_123abc');

fetch('http://localhost:3001/api/import/csv', {
  method: 'POST',
  headers: { 'X-Profile-ID': 'your-profile-id' },
  body: formData
})
.then(response => response.json())
.then(result => console.log(result));

// Response:
// {
//   "imported": 45,
//   "duplicates": 3,
//   "errors": 0
// }`}
          language='javascript'
        />
      </div>

      <div className='mt-6 rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950/30'>
        <h3 className='mb-2 mt-0 flex items-center gap-2 text-lg font-semibold text-blue-900 dark:text-blue-200'>
          <span>💡</span>
          {t.docs?.transactions?.supportedBanks || 'Ondersteunde banken'}
        </h3>
        <p className='mb-0 text-blue-800 dark:text-blue-300'>
          {t.docs?.transactions?.supportedBanksText ||
            'Momenteel worden ING bank CSV exports ondersteund. Meer banken worden toegevoegd in toekomstige updates.'}
        </p>
      </div>
    </article>
  );
}
