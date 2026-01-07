import { useLanguage } from '../../contexts/LanguageContext';
import CodeBlock from '../../components/docs/CodeBlock';

export default function DocsAuthentication() {
  const { t } = useLanguage();

  const headerExample = `// Include the Profile ID in all requests
fetch('http://localhost:3001/api/transactions', {
  headers: {
    'X-Profile-ID': 'your-profile-id',
    'Content-Type': 'application/json'
  }
});`;

  const curlExample = `curl -X GET "http://localhost:3001/api/transactions" \\
  -H "X-Profile-ID: your-profile-id" \\
  -H "Content-Type: application/json"`;

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.authentication.title}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.docs.authentication.subtitle}
      </p>

      <div className='mt-8 rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950/30'>
        <h3 className='mt-0 mb-2 flex items-center gap-2 text-lg font-semibold text-blue-900 dark:text-blue-200'>
          <span>💡</span>
          {t.docs.authentication.localNote}
        </h3>
        <p className='mb-0 text-blue-800 dark:text-blue-300'>
          {t.docs.authentication.localNoteText}
        </p>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.authentication.profileIdTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.authentication.profileIdText}
      </p>

      <div className='not-prose mt-6 space-y-4'>
        <CodeBlock
          code={headerExample}
          language='javascript'
          title='JavaScript'
        />
        <CodeBlock code={curlExample} language='bash' title='cURL' />
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.authentication.getProfileIdTitle}
      </h2>
      <div className='mt-6 space-y-4'>
        <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
          <h3 className='mb-2 font-semibold text-gray-900 dark:text-gray-100'>
            {t.docs.authentication.option1Title}
          </h3>
          <p className='mb-0 text-sm text-gray-600 dark:text-gray-400'>
            {t.docs.authentication.option1Text}
          </p>
        </div>
        <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
          <h3 className='mb-2 font-semibold text-gray-900 dark:text-gray-100'>
            {t.docs.authentication.option2Title}
          </h3>
          <p className='mb-2 text-sm text-gray-600 dark:text-gray-400'>
            {t.docs.authentication.option2Text}
          </p>
          <CodeBlock
            code={`GET http://localhost:3001/api/profiles

// Response:
[
  { "id": "abc123", "name": "Personal", "type": "personal" },
  { "id": "def456", "name": "Business", "type": "business" }
]`}
            language='http'
          />
        </div>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.authentication.errorHandlingTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.authentication.errorHandlingText}
      </p>
      <div className='not-prose mt-6'>
        <CodeBlock
          code={`{
  "error": "Profile ID is required",
  "message": "Include X-Profile-ID header in your request"
}`}
          language='json'
          title={t.docs.authentication.errorResponse}
        />
      </div>
    </article>
  );
}
