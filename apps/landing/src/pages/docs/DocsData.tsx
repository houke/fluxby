import { useLanguage } from '../../contexts/LanguageContext';
import CodeBlock from '../../components/docs/CodeBlock';

export default function DocsData() {
  const { t } = useLanguage();

  const exportCode = `// Export all data as JSON
fetch('http://localhost:3001/api/data/export', {
  headers: { 'X-Profile-ID': 'your-profile-id' }
})
.then(response => response.json())
.then(data => console.log(data));`;

  const exportResponseExample = `{
  "success": true,
  "data": {
    "categories": [...],
    "accounts": [...],
    "transactions": [...],
    "budgets": [...],
    "categoryRules": [...],
    "imports": [...],
    "addressBook": [...],
    "sharedIbans": [...],
    "sharedIbanMerchants": [...],
    "nameCleanupRules": [...],
    "paymentProviderRules": [...],
    "users": [...],
    "exportedAt": "2024-01-15T10:30:00.000Z",
    "version": 2
  }
}`;

  const importCode = `// Import data from JSON backup
fetch('http://localhost:3001/api/data/import', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Profile-ID': 'your-profile-id'
  },
  body: JSON.stringify({
    categories: [...],
    accounts: [...],
    transactions: [...]
    // ... other tables
  })
})
.then(response => response.json())
.then(result => console.log(result));`;

  const importResponseExample = `{
  "success": true,
  "data": {
    "categories": 25,
    "accounts": 2,
    "transactions": 150,
    "budgets": 5,
    "categoryRules": 30,
    "imports": 3,
    "addressBook": 45,
    "sharedIbans": 10,
    "sharedIbanMerchants": 8,
    "nameCleanupRules": 5,
    "paymentProviderRules": 2,
    "users": 1
  }
}`;

  const resetCode = `// Reset all data and restore demo profile
fetch('http://localhost:3001/api/data/reset', {
  method: 'DELETE'
})
.then(response => response.json())
.then(result => console.log(result));`;

  const resetResponseExample = `{
  "success": true,
  "data": {
    "demoProfileId": 1,
    "message": "All data reset, demo profile restored with seed categories"
  }
}`;

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.data.title}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.docs.data.subtitle}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.data.exportTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.data.exportText}
      </p>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50'>
          <span className='rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400'>
            GET
          </span>
          <code className='text-sm text-gray-700 dark:text-gray-300'>
            /api/data/export
          </code>
        </div>
      </div>

      <div className='mt-6 space-y-4'>
        <CodeBlock code={exportCode} language='javascript' title='Request' />
        <CodeBlock
          code={exportResponseExample}
          language='json'
          title='Response'
        />
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.data.importTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.data.importText}
      </p>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50'>
          <span className='rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'>
            POST
          </span>
          <code className='text-sm text-gray-700 dark:text-gray-300'>
            /api/data/import
          </code>
        </div>
      </div>

      <div className='mt-6 space-y-4'>
        <CodeBlock code={importCode} language='javascript' title='Request' />
        <CodeBlock
          code={importResponseExample}
          language='json'
          title='Response'
        />
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.data.resetTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.data.resetText}
      </p>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50'>
          <span className='rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-400'>
            DELETE
          </span>
          <code className='text-sm text-gray-700 dark:text-gray-300'>
            /api/data/reset
          </code>
        </div>
      </div>

      <div className='mt-6 space-y-4'>
        <CodeBlock code={resetCode} language='javascript' title='Request' />
        <CodeBlock
          code={resetResponseExample}
          language='json'
          title='Response'
        />
      </div>

      <div className='mt-8 rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950/30'>
        <h3 className='mb-2 mt-0 flex items-center gap-2 text-lg font-semibold text-red-900 dark:text-red-200'>
          <span>⚠️</span>
          {t.docs.data.warningTitle}
        </h3>
        <p className='mb-0 text-red-800 dark:text-red-300'>
          {t.docs.data.warningText}
        </p>
      </div>
    </article>
  );
}
