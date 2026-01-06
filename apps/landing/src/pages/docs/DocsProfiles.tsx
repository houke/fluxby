import { useLanguage } from '../../contexts/LanguageContext';
import CodeBlock from '../../components/docs/CodeBlock';

export default function DocsProfiles() {
  const { t } = useLanguage();

  const listProfilesCode = `// List all profiles
fetch('http://localhost:3001/api/profiles')
  .then(response => response.json())
  .then(profiles => console.log(profiles));`;

  const createProfileCode = `// Create a new profile
fetch('http://localhost:3001/api/profiles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Business Account',
    type: 'business'
  })
})
.then(response => response.json())
.then(profile => console.log(profile));`;

  const responseExample = `[
  {
    "id": "profile_abc123",
    "name": "Personal",
    "type": "personal",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  {
    "id": "profile_def456",
    "name": "Freelance Business",
    "type": "business",
    "createdAt": "2024-02-20T14:45:00Z"
  }
]`;

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.profiles.title}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.docs.profiles.subtitle}
      </p>

      <div className='mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/30'>
        <h3 className='mt-0 mb-2 flex items-center gap-2 text-lg font-semibold text-amber-900 dark:text-amber-200'>
          <span>🎯</span>
          {t.docs.profiles.useCaseTitle}
        </h3>
        <ul className='mb-0 list-inside list-disc text-amber-800 dark:text-amber-300'>
          <li>{t.docs.profiles.useCase1}</li>
          <li>{t.docs.profiles.useCase2}</li>
          <li>{t.docs.profiles.useCase3}</li>
        </ul>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.profiles.howItWorksTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.profiles.howItWorksText}
      </p>

      <div className='mt-6 grid gap-4 md:grid-cols-3'>
        {[
          {
            icon: '🔒',
            title: t.docs.profiles.isolation,
            desc: t.docs.profiles.isolationDesc,
          },
          {
            icon: '🔄',
            title: t.docs.profiles.switching,
            desc: t.docs.profiles.switchingDesc,
          },
          {
            icon: '🏷️',
            title: t.docs.profiles.customization,
            desc: t.docs.profiles.customizationDesc,
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'
          >
            <div className='mb-2 text-2xl'>{item.icon}</div>
            <h3 className='mb-1 font-semibold text-gray-900 dark:text-gray-100'>
              {item.title}
            </h3>
            <p className='mb-0 text-sm text-gray-600 dark:text-gray-400'>
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.profiles.listProfilesTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.profiles.listProfilesText}
      </p>
      <div className='mt-6 space-y-4'>
        <CodeBlock
          code={listProfilesCode}
          language='javascript'
          title='Request'
        />
        <CodeBlock code={responseExample} language='json' title='Response' />
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.profiles.createProfileTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.profiles.createProfileText}
      </p>
      <div className='mt-6'>
        <CodeBlock code={createProfileCode} language='javascript' />
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.profiles.profileTypesTitle}
      </h2>
      <div className='not-prose mt-6 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700'>
        <table className='min-w-full'>
          <thead className='bg-gray-50 dark:bg-gray-800'>
            <tr>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.profiles.tableType}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs.profiles.tableDescription}
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900'>
            <tr>
              <td className='px-4 py-3 whitespace-nowrap'>
                <code className='rounded bg-gray-100 px-2 py-1 text-sm dark:bg-gray-800'>
                  personal
                </code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.profiles.personalDesc}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3 whitespace-nowrap'>
                <code className='rounded bg-gray-100 px-2 py-1 text-sm dark:bg-gray-800'>
                  business
                </code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs.profiles.businessDesc}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  );
}
