import { useLanguage } from '../../contexts/LanguageContext';
import CodeBlock from '../../components/docs/CodeBlock';

export default function DocsArchitecture() {
  const { t } = useLanguage();
  const copy = t.docs.architecture.pageCopy;

  const schemaExample = `-- Every syncable table has these columns
CREATE TABLE transactions (
    id TEXT PRIMARY KEY,           -- UUID v4
    -- ... other columns ...
    updated_at INTEGER NOT NULL,   -- Unix timestamp (ms)
    is_deleted INTEGER DEFAULT 0,  -- Soft delete flag
    device_id TEXT                 -- Origin device
);`;

  const syncExample = `// Last-Write-Wins conflict resolution
function mergeChanges(local, remote) {
  if (remote.updated_at > local.updated_at) {
    return remote;  // Remote wins
  }
  if (remote.updated_at === local.updated_at) {
    // Tie-breaker: higher device_id wins
    return remote.device_id > local.device_id 
      ? remote : local;
  }
  return local;  // Local wins
}`;

  const securityExample = `// Password-Protected UI Lock
1. User sets PIN/Password during onboarding
2. Password hash stored via PBKDF2 (100k iterations)
3. App locks on idle/close/refresh

// Data Storage:
// - Password hash: localStorage (for verification)
// - Database: OPFS (plain SQLite, not encrypted)
// - All data stays local (never sent to servers)`;

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.architecture.title}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.docs.architecture.subtitle}
      </p>

      <div className='mt-8 rounded-xl border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950/30'>
        <h3 className='mt-0 mb-2 flex items-center gap-2 text-lg font-semibold text-green-900 dark:text-green-200'>
          <span>🔒</span>
          {t.docs.architecture.zeroKnowledgeTitle}
        </h3>
        <p className='mb-0 text-green-800 dark:text-green-300'>
          {t.docs.architecture.zeroKnowledgeText}
        </p>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.architecture.platformsTitle}
      </h2>
      <div className='mt-6 grid gap-4 md:grid-cols-3'>
        <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
          <div className='mb-2 text-2xl'>🌐</div>
          <h3 className='mb-1 font-semibold text-gray-900 dark:text-gray-100'>
            {copy.webTitle}
          </h3>
          <p className='mb-2 text-sm text-gray-600 dark:text-gray-400'>
            {t.docs.architecture.webDesc}
          </p>
          <ul className='mb-0 list-none pl-0 text-xs text-gray-500'>
            {copy.webFeatures.map((feature: string) => (
              <li key={feature}>✓ {feature}</li>
            ))}
          </ul>
        </div>
        <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
          <div className='mb-2 text-2xl'>🖥️</div>
          <h3 className='mb-1 font-semibold text-gray-900 dark:text-gray-100'>
            {copy.desktopTitle}
          </h3>
          <p className='mb-2 text-sm text-gray-600 dark:text-gray-400'>
            {t.docs.architecture.desktopDesc}
          </p>
          <ul className='mb-0 list-none pl-0 text-xs text-gray-500'>
            {copy.desktopFeatures.map((feature: string) => (
              <li key={feature}>✓ {feature}</li>
            ))}
          </ul>
        </div>
        <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
          <div className='mb-2 text-2xl'>⚙️</div>
          <h3 className='mb-1 font-semibold text-gray-900 dark:text-gray-100'>
            {copy.headlessTitle}
          </h3>
          <p className='mb-2 text-sm text-gray-600 dark:text-gray-400'>
            {t.docs.architecture.headlessDesc}
          </p>
          <ul className='mb-0 list-none pl-0 text-xs text-gray-500'>
            {copy.headlessFeatures.map((feature: string) => (
              <li key={feature}>✓ {feature}</li>
            ))}
          </ul>
        </div>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.architecture.securityTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.architecture.securityText}
      </p>
      <div className='mt-4 mb-6 rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/30'>
        <h3 className='mt-0 mb-2 flex items-center gap-2 text-lg font-semibold text-amber-900 dark:text-amber-200'>
          <span>ℹ️</span>
          {copy.noteTitle}
        </h3>
        <p className='mb-0 text-amber-800 dark:text-amber-300'>
          {t.docs.architecture.privacyNote}
        </p>
      </div>
      <div className='not-prose'>
        <CodeBlock code={securityExample} language='text' />
      </div>

      <h3 className='mt-8 text-xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.architecture.autoLockTitle}
      </h3>
      <ul className='text-gray-600 dark:text-gray-400'>
        <li>
          <strong>{copy.autoLockLabels[0]}</strong>{' '}
          {t.docs.architecture.autoLockWeb}
        </li>
        <li>
          <strong>{copy.autoLockLabels[1]}</strong>{' '}
          {t.docs.architecture.autoLockDesktop}
        </li>
        <li>
          <strong>{copy.autoLockLabels[2]}</strong>{' '}
          {t.docs.architecture.autoLockIdle}
        </li>
      </ul>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.architecture.syncTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.architecture.syncText}
      </p>

      <h3 className='mt-8 text-xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.architecture.syncSchemaTitle}
      </h3>
      <div className='not-prose'>
        <CodeBlock code={schemaExample} language='sql' />
      </div>

      <h3 className='mt-8 text-xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.architecture.conflictTitle}
      </h3>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.architecture.conflictText}
      </p>
      <div className='not-prose'>
        <CodeBlock code={syncExample} language='javascript' />
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.architecture.storageTitle}
      </h2>
      <div className='not-prose mt-6 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700'>
        <table className='min-w-full'>
          <thead className='bg-gray-50 dark:bg-gray-800'>
            <tr>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {copy.storageHeaders[0]}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {copy.storageHeaders[1]}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {copy.storageHeaders[2]}
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900'>
            <tr>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {copy.storageRows[0][0]}
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {copy.storageRows[0][1]}
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {copy.storageRows[0][2]}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {copy.storageRows[1][0]}
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {copy.storageRows[1][1]}
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                <code>{copy.storageRows[1][2]}</code>
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {copy.storageRows[2][0]}
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {copy.storageRows[2][1]}
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {copy.storageRows[2][2]}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.architecture.backupTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.architecture.backupText}
      </p>
      <ul className='text-gray-600 dark:text-gray-400'>
        <li>
          <strong>{copy.backupLabels[0]}</strong>{' '}
          {t.docs.architecture.backupDesktop}
        </li>
        <li>
          <strong>{copy.backupLabels[1]}</strong>{' '}
          {t.docs.architecture.backupWeb}
        </li>
        <li>
          <strong>{copy.backupLabels[2]}</strong>{' '}
          {t.docs.architecture.backupFormat}
        </li>
      </ul>

      <div className='mt-8 rounded-xl border border-yellow-200 bg-yellow-50 p-6 dark:border-yellow-800 dark:bg-yellow-950/30'>
        <h3 className='mt-0 mb-2 flex items-center gap-2 text-lg font-semibold text-yellow-900 dark:text-yellow-200'>
          <span>💡</span>
          {t.docs.architecture.tipTitle}
        </h3>
        <p className='mb-0 text-yellow-800 dark:text-yellow-300'>
          {t.docs.architecture.tipText}
        </p>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.architecture.apiVsWebTitle}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.architecture.apiVsWebIntro}
      </p>

      <div className='not-prose mt-6 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700'>
        <table className='min-w-full'>
          <thead className='bg-gray-50 dark:bg-gray-800'>
            <tr>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {copy.comparisonHeaders[0]}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {copy.comparisonHeaders[1]}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {copy.comparisonHeaders[2]}
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900'>
            <tr>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {copy.comparisonRows[0][0]}
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {copy.comparisonRows[0][1]}
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {copy.comparisonRows[0][2]}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {copy.comparisonRows[1][0]}
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {copy.comparisonRows[1][1]}
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {copy.comparisonRows[1][2]}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {copy.comparisonRows[2][0]}
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {copy.comparisonRows[2][1]}
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {copy.comparisonRows[2][2]}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {copy.comparisonRows[3][0]}
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {copy.comparisonRows[3][1]}
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {copy.comparisonRows[3][2]}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className='mt-6 rounded-xl border border-orange-200 bg-orange-50 p-6 dark:border-orange-800 dark:bg-orange-950/30'>
        <h3 className='mt-0 mb-2 flex items-center gap-2 text-lg font-semibold text-orange-900 dark:text-orange-200'>
          <span>⚠️</span>
          {t.docs.architecture.importantTitle}
        </h3>
        <p className='mb-0 text-orange-800 dark:text-orange-300'>
          {t.docs.architecture.apiSeparateDbText}
        </p>
      </div>

      <h3 className='mt-8 text-xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.architecture.dataFlowTitle}
      </h3>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs.architecture.dataFlowText}
      </p>
      <ol className='text-gray-600 dark:text-gray-400'>
        {copy.dataFlowSteps.map(([title, description]: [string, string]) => (
          <li key={title}>
            <strong>{title}:</strong> {description}
          </li>
        ))}
      </ol>

      <h3 className='mt-8 text-xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs.architecture.whySeparateTitle}
      </h3>
      <ul className='text-gray-600 dark:text-gray-400'>
        <li>
          <strong>{copy.whySeparateLabels[0]}</strong>{' '}
          {t.docs.architecture.whySeparate1}
        </li>
        <li>
          <strong>{copy.whySeparateLabels[1]}</strong>{' '}
          {t.docs.architecture.whySeparate2}
        </li>
        <li>
          <strong>{copy.whySeparateLabels[2]}</strong>{' '}
          {t.docs.architecture.whySeparate3}
        </li>
        <li>
          <strong>{copy.whySeparateLabels[3]}</strong>{' '}
          {t.docs.architecture.whySeparate4}
        </li>
      </ul>
    </article>
  );
}
