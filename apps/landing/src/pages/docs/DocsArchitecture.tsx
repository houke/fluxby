import { useLanguage } from '../../contexts/LanguageContext';
import CodeBlock from '../../components/docs/CodeBlock';

export default function DocsArchitecture() {
  const { t } = useLanguage();

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
        {t.docs?.architecture?.title || 'Local-First Architectuur'}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.docs?.architecture?.subtitle ||
          'Fluxby gebruikt een local-first architectuur waarbij al je data lokaal wordt opgeslagen. Geen cloud, geen servers die je data kunnen lezen.'}
      </p>

      <div className='mt-8 rounded-xl border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950/30'>
        <h3 className='mb-2 mt-0 flex items-center gap-2 text-lg font-semibold text-green-900 dark:text-green-200'>
          <span>🔒</span>
          {t.docs?.architecture?.zeroKnowledgeTitle || 'Local-First Privacy'}
        </h3>
        <p className='mb-0 text-green-800 dark:text-green-300'>
          {t.docs?.architecture?.zeroKnowledgeText ||
            'Al je data blijft op je eigen apparaat. Er worden geen servers gebruikt en je data wordt nooit naar buiten verstuurd.'}
        </p>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.architecture?.platformsTitle || 'Ondersteunde Platformen'}
      </h2>
      <div className='mt-6 grid gap-4 md:grid-cols-3'>
        <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
          <div className='mb-2 text-2xl'>🌐</div>
          <h3 className='mb-1 font-semibold text-gray-900 dark:text-gray-100'>
            Web (PWA)
          </h3>
          <p className='mb-2 text-sm text-gray-600 dark:text-gray-400'>
            {t.docs?.architecture?.webDesc ||
              'Draait in de browser met SQLite WASM. Data opgeslagen in OPFS.'}
          </p>
          <ul className='mb-0 list-none pl-0 text-xs text-gray-500'>
            <li>✓ Offline support</li>
            <li>✓ Installeerbaar als PWA</li>
            <li>✓ Automatische updates</li>
          </ul>
        </div>
        <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
          <div className='mb-2 text-2xl'>🖥️</div>
          <h3 className='mb-1 font-semibold text-gray-900 dark:text-gray-100'>
            Desktop (Tauri)
          </h3>
          <p className='mb-2 text-sm text-gray-600 dark:text-gray-400'>
            {t.docs?.architecture?.desktopDesc ||
              'Native app voor Windows, macOS en Linux met Tauri 2.0.'}
          </p>
          <ul className='mb-0 list-none pl-0 text-xs text-gray-500'>
            <li>✓ Native prestaties</li>
            <li>✓ System tray integratie</li>
            <li>✓ Native backups</li>
          </ul>
        </div>
        <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
          <div className='mb-2 text-2xl'>⚙️</div>
          <h3 className='mb-1 font-semibold text-gray-900 dark:text-gray-100'>
            Headless (API)
          </h3>
          <p className='mb-2 text-sm text-gray-600 dark:text-gray-400'>
            {t.docs?.architecture?.headlessDesc ||
              'Lokale API server voor scripts, automations en externe tools.'}
          </p>
          <ul className='mb-0 list-none pl-0 text-xs text-gray-500'>
            <li>✓ REST API</li>
            <li>✓ Swagger documentatie</li>
            <li>✓ Zapier/n8n integratie</li>
          </ul>
        </div>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.architecture?.securityTitle || 'Privacy Lock & Beveiliging'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.architecture?.securityText ||
          'Je app wordt beveiligd met een wachtwoord dat via PBKDF2 wordt gehashed. De database zelf is niet versleuteld, maar alle data blijft lokaal op je apparaat.'}
      </p>
      <div className='mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30'>
        <p className='mb-0 text-sm text-amber-800 dark:text-amber-300'>
          <strong>ℹ️</strong>{' '}
          {t.docs?.architecture?.privacyNote ||
            'Let op: Het wachtwoord beschermt toegang tot je data via de UI. De database zelf wordt onversleuteld opgeslagen in OPFS. Voor bescherming tegen meekijkers en ongeautoriseerde toegang.'}
        </p>
      </div>
      <CodeBlock code={securityExample} language='text' />

      <h3 className='mt-8 text-xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.architecture?.autoLockTitle || 'Auto-Lock'}
      </h3>
      <ul className='text-gray-600 dark:text-gray-400'>
        <li>
          <strong>Web:</strong>{' '}
          {t.docs?.architecture?.autoLockWeb ||
            'App vergrendelt bij page refresh of tab sluiten'}
        </li>
        <li>
          <strong>Desktop:</strong>{' '}
          {t.docs?.architecture?.autoLockDesktop ||
            'App vergrendelt bij app sluiten'}
        </li>
        <li>
          <strong>Idle timeout:</strong>{' '}
          {t.docs?.architecture?.autoLockIdle ||
            'Na 15 minuten inactiviteit wordt automatisch vergrendeld'}
        </li>
      </ul>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.architecture?.syncTitle || 'Synchronisatie'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.architecture?.syncText ||
          'Fluxby gebruikt peer-to-peer synchronisatie via WebRTC. Data gaat direct tussen je apparaten zonder tussenkomst van een server.'}
      </p>

      <h3 className='mt-8 text-xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.architecture?.syncSchemaTitle || 'Sync Schema'}
      </h3>
      <CodeBlock code={schemaExample} language='sql' />

      <h3 className='mt-8 text-xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.architecture?.conflictTitle || 'Conflict Resolutie (LWW)'}
      </h3>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.architecture?.conflictText ||
          'Bij conflicten wint de meest recente wijziging (Last-Write-Wins). Bij gelijke timestamps beslist de device_id.'}
      </p>
      <CodeBlock code={syncExample} language='javascript' />

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.architecture?.storageTitle || 'Storage Adapters'}
      </h2>
      <div className='overflow-x-auto'>
        <table className='min-w-full'>
          <thead>
            <tr>
              <th className='text-left'>Platform</th>
              <th className='text-left'>Storage</th>
              <th className='text-left'>Locatie</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Web</td>
              <td>OPFS (Origin Private File System)</td>
              <td>Browser sandbox</td>
            </tr>
            <tr>
              <td>Desktop (Tauri)</td>
              <td>Tauri FS Plugin</td>
              <td>
                <code>AppLocalData</code>
              </td>
            </tr>
            <tr>
              <td>Headless (Node)</td>
              <td>Node.js fs module</td>
              <td>Configurable path</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.architecture?.backupTitle || 'Backup & Herstel'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.architecture?.backupText ||
          'Je kunt op elk moment een backup maken van je data. Backups zijn versleuteld en kunnen worden hersteld op elk apparaat.'}
      </p>
      <ul className='text-gray-600 dark:text-gray-400'>
        <li>
          <strong>Desktop:</strong>{' '}
          {t.docs?.architecture?.backupDesktop ||
            'Bestand → Backup opslaan... exporteert naar je Documents map'}
        </li>
        <li>
          <strong>Web:</strong>{' '}
          {t.docs?.architecture?.backupWeb ||
            'Instellingen → Backup download een .fluxby bestand'}
        </li>
        <li>
          <strong>Formaat:</strong>{' '}
          {t.docs?.architecture?.backupFormat ||
            '.fluxby bestanden bevatten metadata + versleutelde database'}
        </li>
      </ul>

      <div className='mt-8 rounded-xl border border-yellow-200 bg-yellow-50 p-6 dark:border-yellow-800 dark:bg-yellow-950/30'>
        <h3 className='mb-2 mt-0 flex items-center gap-2 text-lg font-semibold text-yellow-900 dark:text-yellow-200'>
          <span>💡</span>
          {t.docs?.architecture?.tipTitle || 'Tip'}
        </h3>
        <p className='mb-0 text-yellow-800 dark:text-yellow-300'>
          {t.docs?.architecture?.tipText ||
            'Maak regelmatig backups! Bij verlies van je PIN kun je alleen herstellen vanaf een backup.'}
        </p>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.architecture?.apiVsWebTitle ||
          'API Server vs Web App: aparte databases'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.architecture?.apiVsWebIntro ||
          'Het is belangrijk om te begrijpen dat de API server en de web app volledig gescheiden databases gebruiken. Dit is een bewuste architectuurbeslissing voor maximale privacy.'}
      </p>

      <div className='mt-6 overflow-x-auto'>
        <table className='min-w-full'>
          <thead>
            <tr>
              <th className='text-left'>Aspect</th>
              <th className='text-left'>Web App (OPFS)</th>
              <th className='text-left'>API Server (Node.js)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Database locatie</td>
              <td>Browser OPFS (sandbox)</td>
              <td>
                <code>data/</code> folder in project
              </td>
            </tr>
            <tr>
              <td>Beveiliging</td>
              <td>Wachtwoord vergrendelt UI</td>
              <td>Lokaal alleen (plain SQLite)</td>
            </tr>
            <tr>
              <td>Toegang</td>
              <td>Alleen via je browser met je wachtwoord</td>
              <td>REST API op localhost:3001</td>
            </tr>
            <tr>
              <td>Gebruik</td>
              <td>Dagelijks gebruik door eindgebruiker</td>
              <td>Development, scripts, automations</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className='mt-6 rounded-xl border border-orange-200 bg-orange-50 p-6 dark:border-orange-800 dark:bg-orange-950/30'>
        <h3 className='mb-2 mt-0 flex items-center gap-2 text-lg font-semibold text-orange-900 dark:text-orange-200'>
          <span>⚠️</span>
          {t.docs?.architecture?.importantTitle || 'Belangrijk'}
        </h3>
        <p className='mb-0 text-orange-800 dark:text-orange-300'>
          {t.docs?.architecture?.apiSeparateDbText ||
            'De API server heeft een aparte database van de web app. Als je data wilt gebruiken via de API, moet je eerst een JSON export maken vanuit de web app en deze importeren in de API server.'}
        </p>
      </div>

      <h3 className='mt-8 text-xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.architecture?.dataFlowTitle || 'Data migratie workflow'}
      </h3>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.architecture?.dataFlowText ||
          'Om je data te gebruiken met de API server voor automations of custom integraties:'}
      </p>
      <ol className='text-gray-600 dark:text-gray-400'>
        <li>
          <strong>Export vanuit web app:</strong> Ga naar Instellingen → Backup
          → Download JSON export
        </li>
        <li>
          <strong>Start de API server:</strong> <code>npm run dev</code> (of
          alleen <code>npm run dev:api</code>)
        </li>
        <li>
          <strong>Import via API:</strong> POST naar{' '}
          <code>/api/data/import</code> met je export JSON
        </li>
        <li>
          <strong>Bouw je integratie:</strong> Gebruik de REST API voor je
          scripts en automations
        </li>
      </ol>

      <h3 className='mt-8 text-xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.architecture?.whySeparateTitle ||
          'Waarom gescheiden databases?'}
      </h3>
      <ul className='text-gray-600 dark:text-gray-400'>
        <li>
          <strong>Privacy:</strong>{' '}
          {t.docs?.architecture?.whySeparate1 ||
            'Je financiële data in de web app blijft altijd lokaal in je browser en wordt nooit verstuurd.'}
        </li>
        <li>
          <strong>Isolatie:</strong>{' '}
          {t.docs?.architecture?.whySeparate2 ||
            'De API server en web app hebben elk hun eigen database.'}
        </li>
        <li>
          <strong>Flexibiliteit:</strong>{' '}
          {t.docs?.architecture?.whySeparate3 ||
            'Ontwikkelaars kunnen werken met een aparte database zonder risico voor de echte data.'}
        </li>
        <li>
          <strong>Serverless:</strong>{' '}
          {t.docs?.architecture?.whySeparate4 ||
            'De web app werkt volledig offline via GitHub Pages - geen server nodig.'}
        </li>
      </ul>
    </article>
  );
}
