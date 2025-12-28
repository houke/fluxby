import { useLanguage } from '../../contexts/LanguageContext';
import CodeBlock from '../../components/docs/CodeBlock';

export default function DocsErrors() {
  const { t } = useLanguage();

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.errors?.title || 'Foutafhandeling'}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.docs?.errors?.subtitle ||
          'Begrijp hoe de Fluxby API fouten rapporteert en hoe je ze in je applicatie kunt afhandelen.'}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.errors?.formatTitle || 'Foutformaat'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.errors?.formatText ||
          'Alle fouten volgen een consistente JSON structuur:'}
      </p>
      <div className='mt-6'>
        <CodeBlock
          code={`{
  "error": "Error type or title",
  "message": "A human-readable description of what went wrong",
  "details": { /* Optional additional information */ }
}`}
          language='json'
        />
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.errors?.statusCodesTitle || 'HTTP statuscodes'}
      </h2>
      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700'>
        <table className='min-w-full'>
          <thead className='bg-gray-50 dark:bg-gray-800'>
            <tr>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs?.errors?.tableCode || 'Code'}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs?.errors?.tableMeaning || 'Betekenis'}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs?.errors?.tableWhen || 'Wanneer het voorkomt'}
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900'>
            <tr>
              <td className='whitespace-nowrap px-4 py-3'>
                <span className='rounded bg-green-100 px-2 py-1 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400'>
                  200
                </span>
              </td>
              <td className='px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100'>
                OK
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.errors?.code200 ||
                  'Request geslaagd. Response bevat de opgevraagde data.'}
              </td>
            </tr>
            <tr>
              <td className='whitespace-nowrap px-4 py-3'>
                <span className='rounded bg-green-100 px-2 py-1 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400'>
                  201
                </span>
              </td>
              <td className='px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100'>
                Created
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.errors?.code201 ||
                  'Resource succesvol aangemaakt. Response bevat nieuwe resource.'}
              </td>
            </tr>
            <tr>
              <td className='whitespace-nowrap px-4 py-3'>
                <span className='rounded bg-yellow-100 px-2 py-1 text-sm font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'>
                  400
                </span>
              </td>
              <td className='px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100'>
                Bad Request
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.errors?.code400 ||
                  'Ongeldige request parameters of verkeerd geformatteerde JSON body.'}
              </td>
            </tr>
            <tr>
              <td className='whitespace-nowrap px-4 py-3'>
                <span className='rounded bg-red-100 px-2 py-1 text-sm font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400'>
                  401
                </span>
              </td>
              <td className='px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100'>
                Unauthorized
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.errors?.code401 ||
                  'Ontbrekende of ongeldige X-Profile-ID header.'}
              </td>
            </tr>
            <tr>
              <td className='whitespace-nowrap px-4 py-3'>
                <span className='rounded bg-red-100 px-2 py-1 text-sm font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400'>
                  404
                </span>
              </td>
              <td className='px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100'>
                Not Found
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.errors?.code404 ||
                  'Opgevraagde resource bestaat niet.'}
              </td>
            </tr>
            <tr>
              <td className='whitespace-nowrap px-4 py-3'>
                <span className='rounded bg-red-100 px-2 py-1 text-sm font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400'>
                  500
                </span>
              </td>
              <td className='px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100'>
                Server Error
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.errors?.code500 ||
                  'Er ging iets mis aan onze kant. Probeer het later opnieuw.'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.errors?.commonErrorsTitle || 'Veelvoorkomende fouten'}
      </h2>

      <h3 className='mt-6 text-lg font-semibold text-gray-900 dark:text-gray-100'>
        {t.docs?.errors?.missingProfileTitle || 'Ontbrekend Profiel ID'}
      </h3>
      <div className='mt-4'>
        <CodeBlock
          code={`// Status: 401 Unauthorized
{
  "error": "Profile ID is required",
  "message": "Include X-Profile-ID header in your request"
}`}
          language='json'
        />
      </div>

      <h3 className='mt-6 text-lg font-semibold text-gray-900 dark:text-gray-100'>
        {t.docs?.errors?.invalidProfileTitle || 'Ongeldig Profiel ID'}
      </h3>
      <div className='mt-4'>
        <CodeBlock
          code={`// Status: 404 Not Found
{
  "error": "Profile not found",
  "message": "No profile exists with the provided ID"
}`}
          language='json'
        />
      </div>

      <h3 className='mt-6 text-lg font-semibold text-gray-900 dark:text-gray-100'>
        {t.docs?.errors?.validationTitle || 'Validatiefout'}
      </h3>
      <div className='mt-4'>
        <CodeBlock
          code={`// Status: 400 Bad Request
{
  "error": "Validation failed",
  "message": "Request body contains invalid data",
  "details": {
    "amount": "Amount must be a positive number",
    "date": "Date is required"
  }
}`}
          language='json'
        />
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.errors?.handlingTitle || 'Fouten afhandelen'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.errors?.handlingText ||
          'Hier is een aanbevolen patroon voor het afhandelen van API fouten:'}
      </p>
      <div className='mt-6'>
        <CodeBlock
          code={`async function fetchTransactions(profileId) {
  try {
    const response = await fetch('http://localhost:3001/api/transactions', {
      headers: { 'X-Profile-ID': profileId }
    });
    
    if (!response.ok) {
      const error = await response.json();
      
      // Handle specific error types
      if (response.status === 401) {
        console.error('Profile ID required:', error.message);
        // Redirect to profile selection
      } else if (response.status === 404) {
        console.error('Not found:', error.message);
      } else {
        console.error('API Error:', error.message);
      }
      
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
}`}
          language='javascript'
        />
      </div>
    </article>
  );
}
