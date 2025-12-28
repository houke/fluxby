import { useLanguage } from '../../contexts/LanguageContext';
import CodeBlock from '../../components/docs/CodeBlock';

export default function DocsBudgets() {
  const { t } = useLanguage();

  const listBudgetsCode = `// List all budgets with spending progress
fetch('http://localhost:3001/api/budgets', {
  headers: { 'X-Profile-ID': 'your-profile-id' }
})
.then(response => response.json())
.then(budgets => console.log(budgets));`;

  const createBudgetCode = `// Create a new budget
fetch('http://localhost:3001/api/budgets', {
  method: 'POST',
  headers: {
    'X-Profile-ID': 'your-profile-id',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Monthly Groceries',
    amount: 400.00,
    categoryId: 'cat_groceries',
    period: 'monthly'
  })
})
.then(response => response.json())
.then(budget => console.log(budget));`;

  const responseExample = `[
  {
    "id": "bud_123abc",
    "name": "Monthly Groceries",
    "amount": 400.00,
    "spent": 285.50,
    "remaining": 114.50,
    "percentage": 71,
    "category": {
      "id": "cat_groceries",
      "name": "Groceries",
      "color": "#22c55e"
    },
    "period": "monthly",
    "startDate": "2024-03-01",
    "endDate": "2024-03-31"
  },
  {
    "id": "bud_456def",
    "name": "Entertainment",
    "amount": 150.00,
    "spent": 165.00,
    "remaining": -15.00,
    "percentage": 110,
    "category": {
      "id": "cat_entertainment",
      "name": "Entertainment",
      "color": "#8b5cf6"
    },
    "period": "monthly",
    "startDate": "2024-03-01",
    "endDate": "2024-03-31"
  }
]`;

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.budgets?.title || 'Budgetten'}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.docs?.budgets?.subtitle ||
          'Stel bestedingslimieten in en volg je voortgang. Ontvang meldingen wanneer je budgetlimieten nadert of overschrijdt.'}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.budgets?.listTitle || 'Budgetten ophalen'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.budgets?.listText ||
          'Haal alle budgetten op met huidige bestedingsvoortgang:'}
      </p>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50'>
          <span className='rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400'>
            GET
          </span>
          <code className='text-sm text-gray-700 dark:text-gray-300'>
            /api/budgets
          </code>
        </div>
      </div>

      <div className='mt-6 space-y-4'>
        <CodeBlock
          code={listBudgetsCode}
          language='javascript'
          title='Request'
        />
        <CodeBlock code={responseExample} language='json' title='Response' />
      </div>

      <div className='mt-6 rounded-xl border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950/30'>
        <h3 className='mb-2 mt-0 flex items-center gap-2 text-lg font-semibold text-green-900 dark:text-green-200'>
          <span>📊</span>
          {t.docs?.budgets?.progressNote || 'Voortgang bijhouden'}
        </h3>
        <p className='mb-0 text-green-800 dark:text-green-300'>
          {t.docs?.budgets?.progressNoteText ||
            'De API berekent automatisch het bestede bedrag, resterend budget en percentage voor elke budgetperiode.'}
        </p>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.budgets?.createTitle || 'Budget aanmaken'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.budgets?.createText ||
          'Stel een nieuw budget in met een bestedingslimiet:'}
      </p>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50'>
          <span className='rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'>
            POST
          </span>
          <code className='text-sm text-gray-700 dark:text-gray-300'>
            /api/budgets
          </code>
        </div>
      </div>

      <h3 className='mt-6 text-lg font-semibold text-gray-900 dark:text-gray-100'>
        {t.docs?.budgets?.requestBody || 'Request body'}
      </h3>
      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700'>
        <table className='min-w-full'>
          <thead className='bg-gray-50 dark:bg-gray-800'>
            <tr>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs?.common?.tableField || 'Veld'}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs?.common?.tableType || 'Type'}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs?.common?.tableRequired || 'Verplicht'}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs?.common?.tableDescription || 'Beschrijving'}
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
                  {t.docs?.common?.yes || 'Ja'}
                </span>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.budgets?.nameDesc || 'Weergavenaam van het budget'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>amount</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                number
              </td>
              <td className='px-4 py-3'>
                <span className='rounded bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-900/30 dark:text-green-400'>
                  {t.docs?.common?.yes || 'Ja'}
                </span>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.budgets?.amountDesc || "Budgetlimiet in euro's"}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>categoryId</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                string
              </td>
              <td className='px-4 py-3'>
                <span className='rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400'>
                  {t.docs?.common?.no || 'Nee'}
                </span>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.budgets?.categoryIdDesc ||
                  'Koppeling aan een specifieke categorie'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>period</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                string
              </td>
              <td className='px-4 py-3'>
                <span className='rounded bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-900/30 dark:text-green-400'>
                  {t.docs?.common?.yes || 'Ja'}
                </span>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.budgets?.periodDesc ||
                  'wekelijks, maandelijks of jaarlijks'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className='mt-6'>
        <CodeBlock code={createBudgetCode} language='javascript' />
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.budgets?.updateTitle || 'Budget bijwerken'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.budgets?.updateText ||
          'Wijzig een budgetlimiet of instellingen:'}
      </p>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50'>
          <span className='rounded bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'>
            PATCH
          </span>
          <code className='text-sm text-gray-700 dark:text-gray-300'>
            /api/budgets/:id
          </code>
        </div>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.budgets?.deleteTitle || 'Budget verwijderen'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.budgets?.deleteText || 'Verwijder een budget:'}
      </p>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50'>
          <span className='rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-400'>
            DELETE
          </span>
          <code className='text-sm text-gray-700 dark:text-gray-300'>
            /api/budgets/:id
          </code>
        </div>
      </div>
    </article>
  );
}
