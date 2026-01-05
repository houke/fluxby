import { useLanguage } from '../../contexts/LanguageContext';
import CodeBlock from '../../components/docs/CodeBlock';

export default function DocsErrors() {
  const { t } = useLanguage();

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.errors.title}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.docs.errors.subtitle}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.errors.errorResponseTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.errors.errorResponseText}
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
        {t.docs.errors.httpStatusTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.errors.httpStatusText}
      </p>
      <div className='not-prose mt-6 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700'>
        <table className='min-w-full'>
          <thead className='bg-gray-50 dark:bg-gray-800'>
            <tr>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                Code
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                Description
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900'>
            {t.docs.errors.statusCodes.map((status: { code: string; description: string }, idx: number) => (
              <tr key={idx}>
                <td className='whitespace-nowrap px-4 py-3'>
                  <span
                    className={`rounded px-2 py-1 text-sm font-medium ${
                      status.code.startsWith('2')
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : status.code.startsWith('4')
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {status.code}
                  </span>
                </td>
                <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                  {status.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.errors.commonErrorsTitle}
      </h2>

      <h3 className='mt-6 text-lg font-semibold text-gray-900 dark:text-gray-100'>
        {t.docs.errors.invalidProfileTitle}
      </h3>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.errors.invalidProfileText}
      </p>
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
        {t.docs.errors.missingFieldsTitle}
      </h3>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.errors.missingFieldsText}
      </p>
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

      <h3 className='mt-6 text-lg font-semibold text-gray-900 dark:text-gray-100'>
        {t.docs.errors.resourceNotFoundTitle}
      </h3>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.errors.resourceNotFoundText}
      </p>
      <div className='mt-4'>
        <CodeBlock
          code={`// Status: 404 Not Found
{
  "error": "Not Found",
  "message": "The requested resource does not exist"
}`}
          language='json'
        />
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.errors.bestPracticesTitle}
      </h2>
      <ul className='mt-4 space-y-2 text-gray-600 dark:text-gray-400'>
        {t.docs.errors.bestPractices.map((practice: string, idx: number) => (
          <li key={idx} className='flex items-start gap-2'>
            <span className='mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500' />
            {practice}
          </li>
        ))}
      </ul>
    </article>
  );
}
