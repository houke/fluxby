import { useLanguage } from '../../contexts/LanguageContext';
import CodeBlock from '../../components/docs/CodeBlock';

export default function DocsCategories() {
  const { t } = useLanguage();

  const listCategoriesCode = `// List all categories
fetch('http://localhost:3001/api/categories', {
  headers: { 'X-Profile-ID': 'your-profile-id' }
})
.then(response => response.json())
.then(categories => console.log(categories));`;

  const createCategoryCode = `// Create a new category
fetch('http://localhost:3001/api/categories', {
  method: 'POST',
  headers: {
    'X-Profile-ID': 'your-profile-id',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Entertainment',
    color: '#8b5cf6',
    icon: '🎬',
    type: 'expense'
  })
})
.then(response => response.json())
.then(category => console.log(category));`;

  const responseExample = `[
  {
    "id": "cat_groceries",
    "name": "Groceries",
    "color": "#22c55e",
    "icon": "🛒",
    "type": "expense",
    "transactionCount": 45
  },
  {
    "id": "cat_income",
    "name": "Income",
    "color": "#3b82f6",
    "icon": "💰",
    "type": "income",
    "transactionCount": 12
  },
  {
    "id": "cat_transport",
    "name": "Transport",
    "color": "#f59e0b",
    "icon": "🚗",
    "type": "expense",
    "transactionCount": 28
  }
]`;

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.categories?.title || 'Categorieën'}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.docs?.categories?.subtitle ||
          'Organiseer je transacties met aangepaste categorieën. Stel kleuren, iconen en automatische categorisatieregels in.'}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.categories?.listTitle || 'Categorieën ophalen'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.categories?.listText ||
          'Haal alle categorieën op met transactie-aantallen:'}
      </p>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50'>
          <span className='rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400'>
            GET
          </span>
          <code className='text-sm text-gray-700 dark:text-gray-300'>
            /api/categories
          </code>
        </div>
      </div>

      <div className='mt-6 space-y-4'>
        <CodeBlock
          code={listCategoriesCode}
          language='javascript'
          title='Request'
        />
        <CodeBlock code={responseExample} language='json' title='Response' />
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.categories?.createTitle || 'Categorie aanmaken'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.categories?.createText ||
          'Voeg een nieuwe categorie toe met aangepaste stijl:'}
      </p>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50'>
          <span className='rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'>
            POST
          </span>
          <code className='text-sm text-gray-700 dark:text-gray-300'>
            /api/categories
          </code>
        </div>
      </div>

      <h3 className='mt-6 text-lg font-semibold text-gray-900 dark:text-gray-100'>
        {t.docs?.categories?.requestBody || 'Request body'}
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
                {t.docs?.categories?.nameDesc ||
                  'Weergavenaam van de categorie'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>color</code>
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
                {t.docs?.categories?.colorDesc ||
                  'Hex kleurcode (bijv. #22c55e)'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>icon</code>
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
                {t.docs?.categories?.iconDesc ||
                  'Emoji icoon voor de categorie'}
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
                  {t.docs?.common?.yes || 'Ja'}
                </span>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.categories?.typeDesc || 'inkomsten of uitgaven'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className='mt-6'>
        <CodeBlock code={createCategoryCode} language='javascript' />
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.categories?.updateTitle || 'Categorie bijwerken'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.categories?.updateText || 'Wijzig een bestaande categorie:'}
      </p>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50'>
          <span className='rounded bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'>
            PATCH
          </span>
          <code className='text-sm text-gray-700 dark:text-gray-300'>
            /api/categories/:id
          </code>
        </div>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.categories?.deleteTitle || 'Categorie verwijderen'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.categories?.deleteText ||
          'Verwijder een categorie. Transacties worden ongecategoriseerd:'}
      </p>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50'>
          <span className='rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-400'>
            DELETE
          </span>
          <code className='text-sm text-gray-700 dark:text-gray-300'>
            /api/categories/:id
          </code>
        </div>
      </div>

      <div className='mt-6 rounded-xl border border-purple-200 bg-purple-50 p-6 dark:border-purple-800 dark:bg-purple-950/30'>
        <h3 className='mb-2 mt-0 flex items-center gap-2 text-lg font-semibold text-purple-900 dark:text-purple-200'>
          <span>✨</span>
          {t.docs?.categories?.autoCategorizationTitle || 'Auto-categorisatie'}
        </h3>
        <p className='mb-0 text-purple-800 dark:text-purple-300'>
          {t.docs?.categories?.autoCategorizationText ||
            'Fluxby kan transacties automatisch categoriseren op basis van regels die je definieert. Stel regels in via de app onder Categorieën → Regels, of gebruik de API voor aangepaste automatisering.'}
        </p>
      </div>
    </article>
  );
}
