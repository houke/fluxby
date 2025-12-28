import { useLanguage } from '../../contexts/LanguageContext';
import CodeBlock from '../../components/docs/CodeBlock';

export default function DocsAddressBook() {
  const { t } = useLanguage();

  const listContactsCode = `// List all address book contacts
fetch('http://localhost:3001/api/addressbook', {
  headers: { 'X-Profile-ID': 'your-profile-id' }
})
.then(response => response.json())
.then(contacts => console.log(contacts));`;

  const listContactsResponse = `[
  {
    "id": 1,
    "iban": "NL91INGB0001234567",
    "name": "Albert Heijn",
    "description": "Supermarket",
    "notes": null,
    "createdAt": "2024-01-15T10:30:00Z",
    "transactionCount": 45,
    "totalIncome": 0,
    "totalExpenses": 1250.50,
    "netAmount": -1250.50,
    "lastTransactionDate": "2024-03-15"
  }
]`;

  const createContactCode = `// Create a new contact
fetch('http://localhost:3001/api/addressbook', {
  method: 'POST',
  headers: {
    'X-Profile-ID': 'your-profile-id',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    iban: 'NL91INGB0001234567',
    name: 'Albert Heijn',
    description: 'Supermarket',
    notes: 'Weekly groceries'
  })
})
.then(response => response.json())
.then(contact => console.log(contact));`;

  const cleanupRulesCode = `// Create a cleanup rule
fetch('http://localhost:3001/api/addressbook/cleanup-rules', {
  method: 'POST',
  headers: {
    'X-Profile-ID': 'your-profile-id',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    pattern: 'SEPA OVERBOEKING',
    description: 'Remove SEPA prefix from names'
  })
})
.then(response => response.json())
.then(rule => console.log(rule));`;

  const mergeContactsCode = `// Merge duplicate contacts
fetch('http://localhost:3001/api/addressbook/merge', {
  method: 'POST',
  headers: {
    'X-Profile-ID': 'your-profile-id',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    targetId: 1,
    sourceIds: [2, 3],
    name: 'Albert Heijn',
    description: 'Merged supermarket contact'
  })
})
.then(response => response.json())
.then(result => console.log(result));`;

  const sharedIbanCode = `// Add a shared IBAN (payment processor)
fetch('http://localhost:3001/api/addressbook/shared-ibans', {
  method: 'POST',
  headers: {
    'X-Profile-ID': 'your-profile-id',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    iban: 'NL00BUNQ2123456789',
    name: 'iDEAL Payments',
    description: 'Shared payment processor IBAN'
  })
})
.then(response => response.json())
.then(result => console.log(result));`;

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.addressBook?.title || 'Adresboek'}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.docs?.addressBook?.subtitle ||
          'Beheer contacten en tegenpartijen uit je transacties. Koppel automatisch transacties aan contacten, schoon namen op en beheer gedeelde IBANs.'}
      </p>

      {/* Overview */}
      <div className='mt-8 rounded-lg border border-purple-200 bg-purple-50 p-6 dark:border-purple-800 dark:bg-purple-950/30'>
        <h3 className='mt-0 text-lg font-semibold text-purple-900 dark:text-purple-200'>
          {t.docs?.addressBook?.overviewTitle || '📒 Wat is het adresboek?'}
        </h3>
        <p className='mb-0 text-purple-800 dark:text-purple-300'>
          {t.docs?.addressBook?.overviewText ||
            'Het adresboek haalt automatisch tegenpartijen uit je transacties op basis van IBAN en naam. Het helpt je bij het organiseren van contacten, opschonen van rommelige banknamen en bijhouden van uitgaven per handelaar.'}
        </p>
      </div>

      {/* Core Endpoints */}
      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.addressBook?.endpointsTitle || 'Adresboek endpoints'}
      </h2>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700'>
        <table className='min-w-full'>
          <thead className='bg-gray-50 dark:bg-gray-800'>
            <tr>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs?.common?.method || 'Methode'}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs?.common?.endpoint || 'Endpoint'}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs?.common?.description || 'Beschrijving'}
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900'>
            <tr>
              <td className='px-4 py-3'>
                <span className='rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400'>
                  GET
                </span>
              </td>
              <td className='px-4 py-3'>
                <code className='text-sm'>/api/addressbook</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.endpoints?.list ||
                  'Alle contacten ophalen met transactiestatistieken'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <span className='rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'>
                  POST
                </span>
              </td>
              <td className='px-4 py-3'>
                <code className='text-sm'>/api/addressbook</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.endpoints?.create ||
                  'Nieuw contact aanmaken'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <span className='rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400'>
                  GET
                </span>
              </td>
              <td className='px-4 py-3'>
                <code className='text-sm'>/api/addressbook/:id</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.endpoints?.get || 'Contact ophalen op ID'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <span className='rounded bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'>
                  PATCH
                </span>
              </td>
              <td className='px-4 py-3'>
                <code className='text-sm'>/api/addressbook/:id</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.endpoints?.update || 'Contact bijwerken'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <span className='rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-400'>
                  DELETE
                </span>
              </td>
              <td className='px-4 py-3'>
                <code className='text-sm'>/api/addressbook/:id</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.endpoints?.delete ||
                  'Contact verwijderen'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* List Contacts */}
      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.addressBook?.listTitle || 'Contacten ophalen'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.addressBook?.listText ||
          'Haal alle contacten op met transactiestatistieken. Ondersteunt filteren en sorteren.'}
      </p>

      <h3 className='mt-6 text-lg font-semibold text-gray-900 dark:text-gray-100'>
        {t.docs?.common?.queryParams || 'Query parameters'}
      </h3>
      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700'>
        <table className='min-w-full'>
          <thead className='bg-gray-50 dark:bg-gray-800'>
            <tr>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs?.common?.param || 'Parameter'}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs?.common?.type || 'Type'}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs?.common?.description || 'Beschrijving'}
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900'>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>search</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                string
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.params?.search ||
                  'Zoeken op naam of IBAN'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>sortBy</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                string
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.params?.sortBy ||
                  'Sorteerveld: name, transactionCount, totalExpenses, lastTransactionDate'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>sortOrder</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                string
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.params?.sortOrder ||
                  'Sorteerrichting: asc of desc'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className='mt-6 space-y-4'>
        <CodeBlock
          code={listContactsCode}
          language='javascript'
          title='Request'
        />
        <CodeBlock
          code={listContactsResponse}
          language='json'
          title='Response'
        />
      </div>

      {/* Create Contact */}
      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.addressBook?.createTitle || 'Contact aanmaken'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.addressBook?.createText ||
          'Handmatig een nieuw adresboekcontact aanmaken. Transacties worden automatisch gekoppeld.'}
      </p>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800'>
          <span className='rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'>
            POST
          </span>
          <code className='text-sm text-gray-700 dark:text-gray-300'>
            /api/addressbook
          </code>
        </div>
      </div>

      <div className='mt-6'>
        <CodeBlock
          code={createContactCode}
          language='javascript'
          title='Request'
        />
      </div>

      {/* Cleanup Rules Section */}
      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.addressBook?.cleanupRulesTitle || 'Naam opschoonregels'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.addressBook?.cleanupRulesText ||
          'Maak regels om automatisch rommelige banknamen op te schonen. Regels kunnen letterlijke tekst of regex patronen gebruiken.'}
      </p>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700'>
        <table className='min-w-full'>
          <thead className='bg-gray-50 dark:bg-gray-800'>
            <tr>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs?.common?.method || 'Methode'}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs?.common?.endpoint || 'Endpoint'}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs?.common?.description || 'Beschrijving'}
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900'>
            <tr>
              <td className='px-4 py-3'>
                <span className='rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400'>
                  GET
                </span>
              </td>
              <td className='px-4 py-3'>
                <code className='text-sm'>/api/addressbook/cleanup-rules</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.cleanupEndpoints?.list ||
                  'Alle opschoonregels ophalen'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <span className='rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'>
                  POST
                </span>
              </td>
              <td className='px-4 py-3'>
                <code className='text-sm'>/api/addressbook/cleanup-rules</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.cleanupEndpoints?.create ||
                  'Opschoonregel aanmaken'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <span className='rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-400'>
                  DELETE
                </span>
              </td>
              <td className='px-4 py-3'>
                <code className='text-sm'>
                  /api/addressbook/cleanup-rules/:id
                </code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.cleanupEndpoints?.delete ||
                  'Opschoonregel verwijderen'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <span className='rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'>
                  POST
                </span>
              </td>
              <td className='px-4 py-3'>
                <code className='text-sm'>
                  /api/addressbook/apply-cleanup-rules
                </code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.cleanupEndpoints?.apply ||
                  'Alle regels toepassen op contacten'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className='mt-6'>
        <CodeBlock
          code={cleanupRulesCode}
          language='javascript'
          title='Create Cleanup Rule'
        />
      </div>

      {/* Shared IBANs Section */}
      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.addressBook?.sharedIbansTitle ||
          'Gedeelde IBANs (betalingsverwerkers)'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.addressBook?.sharedIbansText ||
          'Sommige IBANs worden gedeeld door meerdere handelaren (zoals iDEAL of PayPal). Markeer deze als gedeeld om contact-tracking op handelaarsniveau mogelijk te maken.'}
      </p>

      <div className='mt-8 rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/30'>
        <h3 className='mt-0 text-lg font-semibold text-amber-900 dark:text-amber-200'>
          💡 {t.docs?.addressBook?.sharedIbansNote || 'Waarom gedeelde IBANs?'}
        </h3>
        <p className='mb-0 text-amber-800 dark:text-amber-300'>
          {t.docs?.addressBook?.sharedIbansExplanation ||
            'Betalingsverwerkers zoals iDEAL, Mollie en PayPal gebruiken één IBAN voor duizenden verschillende handelaren. Door deze als gedeeld te markeren, volgt Fluxby de werkelijke handelaarsnaam in plaats van alleen de IBAN.'}
        </p>
      </div>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700'>
        <table className='min-w-full'>
          <thead className='bg-gray-50 dark:bg-gray-800'>
            <tr>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs?.common?.method || 'Methode'}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs?.common?.endpoint || 'Endpoint'}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs?.common?.description || 'Beschrijving'}
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900'>
            <tr>
              <td className='px-4 py-3'>
                <span className='rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400'>
                  GET
                </span>
              </td>
              <td className='px-4 py-3'>
                <code className='text-sm'>/api/addressbook/shared-ibans</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.sharedEndpoints?.list ||
                  'Alle gedeelde IBANs ophalen'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <span className='rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'>
                  POST
                </span>
              </td>
              <td className='px-4 py-3'>
                <code className='text-sm'>/api/addressbook/shared-ibans</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.sharedEndpoints?.create ||
                  'Gedeelde IBAN toevoegen'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <span className='rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-400'>
                  DELETE
                </span>
              </td>
              <td className='px-4 py-3'>
                <code className='text-sm'>
                  /api/addressbook/shared-ibans/:iban
                </code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.sharedEndpoints?.delete ||
                  'Gedeelde IBAN verwijderen'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <span className='rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'>
                  POST
                </span>
              </td>
              <td className='px-4 py-3'>
                <code className='text-sm'>/api/addressbook/detect-shared</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.sharedEndpoints?.detect ||
                  'Gedeelde IBANs auto-detecteren'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className='mt-6'>
        <CodeBlock
          code={sharedIbanCode}
          language='javascript'
          title='Add Shared IBAN'
        />
      </div>

      {/* Merge & Split Section */}
      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.addressBook?.mergeTitle || 'Contacten samenvoegen & splitsen'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.addressBook?.mergeText ||
          'Combineer dubbele contacten of splits contacten die meerdere handelaren vertegenwoordigen.'}
      </p>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700'>
        <table className='min-w-full'>
          <thead className='bg-gray-50 dark:bg-gray-800'>
            <tr>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs?.common?.method || 'Methode'}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs?.common?.endpoint || 'Endpoint'}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs?.common?.description || 'Beschrijving'}
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900'>
            <tr>
              <td className='px-4 py-3'>
                <span className='rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'>
                  POST
                </span>
              </td>
              <td className='px-4 py-3'>
                <code className='text-sm'>/api/addressbook/merge</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.mergeEndpoints?.merge ||
                  'Contacten samenvoegen tot één'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <span className='rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'>
                  POST
                </span>
              </td>
              <td className='px-4 py-3'>
                <code className='text-sm'>
                  /api/addressbook/merge-duplicates
                </code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.mergeEndpoints?.duplicates ||
                  'Duplicaten auto-detecteren en samenvoegen'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <span className='rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'>
                  POST
                </span>
              </td>
              <td className='px-4 py-3'>
                <code className='text-sm'>/api/addressbook/split</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.mergeEndpoints?.split ||
                  'Contact splitsen in meerdere'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className='mt-6'>
        <CodeBlock
          code={mergeContactsCode}
          language='javascript'
          title='Merge Contacts'
        />
      </div>

      {/* Multi-IBAN Contacts */}
      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.addressBook?.multiIbanTitle || 'Multi-IBAN contacten'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.docs?.addressBook?.multiIbanText ||
          'Sommige contacten (zoals grote bedrijven) kunnen meerdere IBANs hebben. Je kunt extra IBANs aan één contact koppelen.'}
      </p>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700'>
        <table className='min-w-full'>
          <thead className='bg-gray-50 dark:bg-gray-800'>
            <tr>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs?.common?.method || 'Methode'}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs?.common?.endpoint || 'Endpoint'}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs?.common?.description || 'Beschrijving'}
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900'>
            <tr>
              <td className='px-4 py-3'>
                <span className='rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400'>
                  GET
                </span>
              </td>
              <td className='px-4 py-3'>
                <code className='text-sm'>/api/addressbook/:id/ibans</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.ibanEndpoints?.list ||
                  'IBANs van contact ophalen'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <span className='rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'>
                  POST
                </span>
              </td>
              <td className='px-4 py-3'>
                <code className='text-sm'>/api/addressbook/:id/ibans</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.ibanEndpoints?.add ||
                  'IBAN toevoegen aan contact'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <span className='rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-400'>
                  DELETE
                </span>
              </td>
              <td className='px-4 py-3'>
                <code className='text-sm'>
                  /api/addressbook/:id/ibans/:ibanId
                </code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.ibanEndpoints?.remove ||
                  'IBAN verwijderen van contact'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* The Contact Object */}
      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.docs?.addressBook?.objectTitle || 'Het contact object'}
      </h2>

      <div className='mt-6 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700'>
        <table className='min-w-full'>
          <thead className='bg-gray-50 dark:bg-gray-800'>
            <tr>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs?.common?.field || 'Veld'}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs?.common?.type || 'Type'}
              </th>
              <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100'>
                {t.docs?.common?.description || 'Beschrijving'}
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900'>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>id</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                number
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.fields?.id || 'Unieke identificatie'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>iban</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                string
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.fields?.iban || 'Primaire IBAN'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>name</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                string
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.fields?.name ||
                  'Weergavenaam (kan opgeschoond worden)'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>originalName</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                string | null
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.fields?.originalName ||
                  'Originele banknaam (voor gedeelde IBANs)'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>description</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                string | null
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.fields?.description ||
                  'Optionele omschrijving'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>notes</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                string | null
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.fields?.notes || 'Gebruikersnotities'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>transactionCount</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                number
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.fields?.transactionCount ||
                  'Aantal gekoppelde transacties'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>totalIncome</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                number
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.fields?.totalIncome ||
                  'Totale inkomsten van dit contact'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>totalExpenses</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                number
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.fields?.totalExpenses ||
                  'Totale uitgaven aan dit contact'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>netAmount</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                number
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.fields?.netAmount ||
                  'Netto bedrag (inkomsten - uitgaven)'}
              </td>
            </tr>
            <tr>
              <td className='px-4 py-3'>
                <code className='text-sm'>lastTransactionDate</code>
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                string | null
              </td>
              <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
                {t.docs?.addressBook?.fields?.lastTransactionDate ||
                  'Datum van laatste transactie'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  );
}
