import { useLanguage } from '../../contexts/LanguageContext';
import CodeBlock from '../../components/docs/CodeBlock';

export default function DocsAccounts() {
  const { t } = useLanguage();

  const listAccountsCode = `// List all accounts
fetch('http://localhost:3001/api/accounts', {
  headers: { 'X-Profile-ID': 'your-profile-id' }
})
.then(response => response.json())
.then(accounts => console.log(accounts));`;

  const createAccountCode = `// Create a new account
fetch('http://localhost:3001/api/accounts', {
  method: 'POST',
  headers: {
    'X-Profile-ID': 'your-profile-id',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'ING Checking',
    type: 'checking',
    iban: 'NL91ABNA0417164300',
    balance: 1500.00
  })
})
.then(response => response.json())
.then(account => console.log(account));`;

  const responseExample = `[
  {
    "id": "acc_123abc",
    "name": "ING Checking",
    "type": "checking",
    "iban": "NL91ABNA0417164300",
    "balance": 2450.75,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  {
    "id": "acc_456def",
    "name": "Savings",
    "type": "savings",
    "iban": "NL18RABO0123459876",
    "balance": 15000.00,
    "createdAt": "2024-01-20T14:00:00Z"
  }
]`;

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.accounts.title}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.docs.accounts.subtitle}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.accounts.listTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.accounts.listText}
      </p>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50'>
          <span className='rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400'>
            GET
          </span>
          <code className='text-sm text-gray-700 dark:text-gray-300'>
            /api/accounts
          </code>
        </div>
      </div>

      <div className='mt-6 space-y-4'>
        <CodeBlock
          code={listAccountsCode}
          language='javascript'
          title='Request'
        />
        <CodeBlock code={responseExample} language='json' title='Response' />
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.accounts.createTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.accounts.createText}
      </p>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50'>
          <span className='rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'>
            POST
          </span>
          <code className='text-sm text-gray-700 dark:text-gray-300'>
            /api/accounts
          </code>
        </div>
      </div>

      <h3 className='mt-6 text-lg font-semibold text-gray-900 dark:text-gray-100'>
        {t.docs.accounts.requestBody}
      </h3>
      <div className='mt-6 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700'>
        <table className='min-w-full'>
          <thead className='bg-gray-50 dark:bg-gray-800'>
            <tr>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.accounts.tableField}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.accounts.tableType}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.accounts.tableRequired}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.accounts.tableDescription}
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900'>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>name</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                string
              </td>
              <td className='px-4 py-3'>
                <span className='rounded bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-900/30 dark:text-green-400'>
                  {t.docs.common.yes}
                </span>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.accounts.nameDesc}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>type</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                string
              </td>
              <td className='px-4 py-3'>
                <span className='rounded bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-900/30 dark:text-green-400'>
                  {t.docs.common.yes}
                </span>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.accounts.typeDesc}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>iban</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                string
              </td>
              <td className='px-4 py-3'>
                <span className='rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400'>
                  {t.docs.common.no}
                </span>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.accounts.ibanDesc}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>balance</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                number
              </td>
              <td className='px-4 py-3'>
                <span className='rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400'>
                  {t.docs.common.no}
                </span>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.accounts.balanceDesc}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className='mt-6'>
        <CodeBlock code={createAccountCode} language='javascript' />
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.accounts.deleteTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.accounts.deleteText}
      </p>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50'>
          <span className='rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-400'>
            DELETE
          </span>
          <code className='text-sm text-gray-700 dark:text-gray-300'>
            /api/accounts/:id
          </code>
        </div>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.accounts.deleteAllTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.accounts.deleteAllText}
      </p>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50'>
          <span className='rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-400'>
            DELETE
          </span>
          <code className='text-sm text-gray-700 dark:text-gray-300'>
            /api/accounts
          </code>
        </div>
      </div>

      <div className='mt-6 rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/30'>
        <h3 className='mb-2 mt-0 flex items-center gap-2 text-lg font-semibold text-amber-900 dark:text-amber-200'>
          <span>💡</span>
          {t.docs.accounts.noteTitle}
        </h3>
        <p className='mb-0 text-amber-800 dark:text-amber-300'>
          {t.docs.accounts.noteText}
        </p>
      </div>
    </article>
  );
}
