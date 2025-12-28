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
        {t.docs?.authentication?.title || 'Authenticatie'}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.docs?.authentication?.subtitle ||
          'Leer hoe je je API requests authenticeert met Fluxby.'}
      </p>

      <div className='mt-8 rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950/30'>
        <h3 className='mb-2 mt-0 flex items-center gap-2 text-lg font-semibold text-blue-900 dark:text-blue-200'>
          <span>💡</span>
          {t.docs?.authentication?.localNote || 'Lokale ontwikkeling'}
        </h3>
        <p className='mb-0 text-blue-800 dark:text-blue-300'>
          {t.docs?.authentication?.localNoteText ||
            'Fluxby draait volledig op je lokale machine. Er zijn geen API keys of OAuth flows nodig - voeg alleen je Profiel ID toe aan requests.'}
        </p>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.authentication?.profileIdTitle || 'Het Profiel ID gebruiken'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.authentication?.profileIdText ||
          'Alle API requests moeten de X-Profile-ID header bevatten. Dit identificeert de gegevens van welk profiel je wilt benaderen.'}
      </p>

      <div className='mt-6 space-y-4'>
        <CodeBlock
          code={headerExample}
          language='javascript'
          title='JavaScript'
        />
        <CodeBlock code={curlExample} language='bash' title='cURL' />
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.authentication?.getProfileIdTitle ||
          'Hoe krijg je je Profiel ID'}
      </h2>
      <div className='mt-6 space-y-4'>
        <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
          <h3 className='mb-2 font-semibold text-gray-900 dark:text-gray-100'>
            {t.docs?.authentication?.option1Title || 'Optie 1: Vanuit de app'}
          </h3>
          <p className='mb-0 text-sm text-gray-600 dark:text-gray-400'>
            {t.docs?.authentication?.option1Text ||
              'Open Fluxby in je browser, ga naar Instellingen → Profiel en kopieer je Profiel ID.'}
          </p>
        </div>
        <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
          <h3 className='mb-2 font-semibold text-gray-900 dark:text-gray-100'>
            {t.docs?.authentication?.option2Title || 'Optie 2: API aanroep'}
          </h3>
          <p className='mb-2 text-sm text-gray-600 dark:text-gray-400'>
            {t.docs?.authentication?.option2Text ||
              'Haal alle profielen op via het profiles endpoint:'}
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
        {t.docs?.authentication?.errorHandlingTitle || 'Ontbrekend Profiel ID'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.authentication?.errorHandlingText ||
          'Als je de X-Profile-ID header niet meestuurt, krijg je een 401 fout:'}
      </p>
      <div className='mt-6'>
        <CodeBlock
          code={`{
  "error": "Profile ID is required",
  "message": "Include X-Profile-ID header in your request"
}`}
          language='json'
          title={t.docs?.authentication?.errorResponse || 'Foutrespons'}
        />
      </div>
    </article>
  );
}
