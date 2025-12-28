import { useLanguage } from '../../contexts/LanguageContext';
import CodeBlock from '../../components/docs/CodeBlock';

export default function DocsImport() {
  const { t } = useLanguage();

  const importCSVCode = `// Import a CSV file
const formData = new FormData();
formData.append('file', csvFile);
formData.append('bank', 'ing');

fetch('http://localhost:3001/api/import/csv', {
  method: 'POST',
  headers: { 'X-Profile-ID': 'your-profile-id' },
  body: formData
})
.then(response => response.json())
.then(result => console.log(result));`;

  const importResponseExample = `{
  "success": true,
  "data": {
    "imported": 42,
    "duplicates": 3,
    "skipped": 0,
    "accountId": 1,
    "accountName": "NL91INGB0123456789"
  }
}`;

  const previewCode = `// Preview CSV before importing
const formData = new FormData();
formData.append('file', csvFile);
formData.append('bank', 'ing');

fetch('http://localhost:3001/api/import/preview', {
  method: 'POST',
  headers: { 'X-Profile-ID': 'your-profile-id' },
  body: formData
})
.then(response => response.json())
.then(preview => console.log(preview));`;

  const previewResponseExample = `{
  "success": true,
  "data": {
    "totalTransactions": 45,
    "dateRange": {
      "from": "2024-01-01",
      "to": "2024-01-31"
    },
    "accounts": [
      {
        "iban": "NL91INGB0123456789",
        "exists": true,
        "accountId": 1
      }
    ],
    "preview": [
      {
        "date": "2024-01-15",
        "amount": -45.50,
        "description": "Albert Heijn",
        "counterparty": "AH Online"
      }
    ]
  }
}`;

  const historyCode = `// Get import history
fetch('http://localhost:3001/api/import/history', {
  headers: { 'X-Profile-ID': 'your-profile-id' }
})
.then(response => response.json())
.then(history => console.log(history));`;

  const historyResponseExample = `{
  "success": true,
  "data": [
    {
      "id": 5,
      "filename": "ing_transactions_jan2024.csv",
      "bank": "ing",
      "importedAt": "2024-01-31T10:30:00Z",
      "transactionCount": 42,
      "status": "completed",
      "skippedRows": [
        { "row": 3, "reason": "duplicate", "data": "2024-01-15,AH" },
        { "row": 7, "reason": "existing_hash", "data": "2024-01-16,Shell" }
      ],
      "duplicatesSkipped": 2,
      "parseErrors": 0
    },
    {
      "id": 4,
      "filename": "ing_transactions_dec2023.csv",
      "bank": "ing",
      "importedAt": "2024-01-01T09:15:00Z",
      "transactionCount": 38,
      "status": "completed",
      "skippedRows": [],
      "duplicatesSkipped": 0,
      "parseErrors": 0
    }
  ]
}`;

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.import?.title || 'Importeren'}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.docs?.import?.subtitle ||
          'Importeer banktransacties vanuit CSV bestanden. Ondersteunt momenteel ING bank formaat met automatische rekeningdetectie en duplicaatpreventie.'}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.import?.csvTitle || 'CSV importeren'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.import?.csvText ||
          'Upload en importeer een CSV bestand met banktransacties. Het systeem detecteert automatisch rekeningen, voorkomt duplicaten, past categorieregels toe en schoont tegenpartijnamen op met je opschoonregels.'}
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

      <h3 className='mt-6 text-lg font-semibold text-gray-900 dark:text-gray-100'>
        {t.docs?.import?.formData || 'Formulier data'}
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
                <code className='text-sm'>file</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                File
              </td>
              <td className='px-4 py-3'>
                <span className='rounded bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-900/30 dark:text-green-400'>
                  {t.docs?.common?.yes || 'Ja'}
                </span>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.import?.fileDesc || 'CSV bestand (max 10MB)'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>bank</code>
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
                {t.docs?.import?.bankDesc ||
                  "Banktype (standaard: 'ing'). Momenteel wordt alleen 'ing' ondersteund."}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className='mt-6 space-y-4'>
        <CodeBlock code={importCSVCode} language='javascript' title='Request' />
        <CodeBlock
          code={importResponseExample}
          language='json'
          title='Response'
        />
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.import?.previewTitle || 'CSV voorbeeld bekijken'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.import?.previewText ||
          'Bekijk een CSV bestand voordat je importeert. Toont gedetecteerde rekeningen, datumbereik en voorbeeldtransacties.'}
      </p>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50'>
          <span className='rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'>
            POST
          </span>
          <code className='text-sm text-gray-700 dark:text-gray-300'>
            /api/import/preview
          </code>
        </div>
      </div>

      <div className='mt-6 space-y-4'>
        <CodeBlock code={previewCode} language='javascript' title='Request' />
        <CodeBlock
          code={previewResponseExample}
          language='json'
          title='Response'
        />
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.import?.historyTitle || 'Import geschiedenis'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.import?.historyText ||
          'Haal een lijst op van alle eerdere imports met hun status en transactie-aantallen.'}
      </p>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50'>
          <span className='rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400'>
            GET
          </span>
          <code className='text-sm text-gray-700 dark:text-gray-300'>
            /api/import/history
          </code>
        </div>
      </div>

      <div className='mt-6 space-y-4'>
        <CodeBlock code={historyCode} language='javascript' title='Request' />
        <CodeBlock
          code={historyResponseExample}
          language='json'
          title='Response'
        />
      </div>

      <div className='mt-8 rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950/30'>
        <h3 className='mb-2 mt-0 flex items-center gap-2 text-lg font-semibold text-blue-900 dark:text-blue-200'>
          <span>💡</span>
          {t.docs?.import?.tipTitle || 'Tip'}
        </h3>
        <p className='mb-0 text-blue-800 dark:text-blue-300'>
          {t.docs?.import?.tipText ||
            'Het importsysteem past automatisch je categorieregels toe om transacties te categoriseren, past naam-opschoonregels toe om tegenpartijnamen op te schonen, en voegt nieuwe contacten toe aan je adresboek.'}
        </p>
      </div>
    </article>
  );
}
