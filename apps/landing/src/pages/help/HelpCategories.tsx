import { useLanguage } from '../../contexts/LanguageContext';
import HelpAnimation from '../../components/help/HelpAnimation';

// Default categories synced with database seed (apps/api/src/db/seed-data.ts)
const defaultCategories = [
  {
    emoji: '🏠',
    name: 'Wonen & Huisvesting',
    color: '#1E40AF',
    description: 'Huur, hypotheek, energie, water',
  },
  {
    emoji: '🛒',
    name: 'Huishouden & Boodschappen',
    color: '#34D399',
    description: 'Supermarkt, drogisterij, huisdieren',
  },
  {
    emoji: '🚗',
    name: 'Vervoer & Transport',
    color: '#3B82F6',
    description: 'Brandstof, OV, auto, parkeren',
  },
  {
    emoji: '🍽️',
    name: 'Eten & Drinken',
    color: '#F97316',
    description: 'Restaurants, bezorging, koffie',
  },
  {
    emoji: '🛍️',
    name: 'Shopping & Kleding',
    color: '#EC4899',
    description: 'Kleding, schoenen, elektronica',
  },
  {
    emoji: '💪',
    name: 'Gezondheid & Welzijn',
    color: '#EF4444',
    description: 'Zorgverzekering, apotheek, sport',
  },
  {
    emoji: '🎬',
    name: 'Entertainment & Vrije Tijd',
    color: '#8B5CF6',
    description: 'Streaming, uitjes, hobbys',
  },
  {
    emoji: '💼',
    name: 'Inkomen',
    color: '#22C55E',
    description: 'Salaris, freelance, uitkeringen',
  },
  {
    emoji: '💰',
    name: 'Sparen & Beleggen',
    color: '#14B8A6',
    description: 'Spaarrekening, beleggingen',
  },
];

export default function HelpCategories() {
  const { t } = useLanguage();

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.categories?.title || 'Categorieën beheren'}
      </h1>
      <p className='text-xl text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.categories?.subtitle ||
          'Organiseer je transacties met aangepaste categorieën en auto-categorisatie regels.'}
      </p>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.categories?.whatAreTitle || 'Wat zijn categorieën?'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.categories?.whatAreText ||
          'Categorieën helpen je om je transacties in betekenisvolle groepen te organiseren zoals Boodschappen, Vervoer, Entertainment, etc. Dit maakt het makkelijker om je uitgavenpatronen te begrijpen en budgetten te maken.'}
      </p>

      <HelpAnimation type='categories' />

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.categories?.defaultTitle || 'Standaard categorieën'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.categories?.defaultText ||
          'Fluxby wordt geleverd met een set vooraf geconfigureerde categorieën om je op weg te helpen:'}
      </p>
      <div className='not-prose mt-6 grid gap-3 md:grid-cols-3'>
        {defaultCategories.map((cat, idx) => (
          <div
            key={idx}
            className='flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800'
          >
            <div
              className='flex h-10 w-10 items-center justify-center rounded-lg text-xl'
              style={{ backgroundColor: `${cat.color}20` }}
            >
              {cat.emoji}
            </div>
            <div className='min-w-0 flex-1'>
              <span className='block text-sm font-medium text-gray-900 dark:text-gray-100'>
                {cat.name}
              </span>
              <span className='block truncate text-xs text-gray-500 dark:text-gray-400'>
                {cat.description}
              </span>
            </div>
          </div>
        ))}
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.categories?.createTitle || 'Een categorie aanmaken'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.categories?.createText ||
          'Om een nieuwe categorie aan te maken:'}
      </p>
      <ol className='mt-4 list-inside list-decimal text-gray-600 dark:text-gray-400'>
        <li className='mb-2'>
          {t.helpCenter?.categories?.step1 ||
            'Ga naar Categorieën in de zijbalk'}
        </li>
        <li className='mb-2'>
          {t.helpCenter?.categories?.step2 ||
            'Klik op de "Nieuwe categorie" knop'}
        </li>
        <li className='mb-2'>
          {t.helpCenter?.categories?.step3 ||
            'Voer een naam in en kies een emoji icoon'}
        </li>
        <li className='mb-2'>
          {t.helpCenter?.categories?.step4 ||
            'Selecteer een kleur voor visuele herkenning'}
        </li>
        <li>
          {t.helpCenter?.categories?.step5 ||
            'Klik op Opslaan om je categorie aan te maken'}
        </li>
      </ol>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.categories?.rulesTitle || 'Auto-categorisatie regels'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.categories?.rulesText ||
          'Regels wijzen automatisch categorieën toe aan transacties op basis van trefwoorden in de omschrijving. Je kunt bijvoorbeeld een regel maken die de categorie "Boodschappen" toewijst aan elke transactie die "Albert Heijn" of "Jumbo" bevat.'}
      </p>

      <div className='not-prose mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20'>
        <h4 className='mb-2 flex items-center gap-2 text-blue-800 dark:text-blue-200'>
          <span>💡</span>
          {t.helpCenter?.categories?.tipTitle || 'Snelle tip'}
        </h4>
        <p className='m-0 text-blue-700 dark:text-blue-300'>
          {t.helpCenter?.categories?.tipText ||
            'Wanneer je handmatig een transactie categoriseert, biedt Fluxby aan om een auto-categorisatie regel voor je te maken. Accepteer dit om tijd te besparen bij toekomstige imports!'}
        </p>
      </div>

      <h2 className='mt-12 text-2xl font-bold text-gray-900 dark:text-gray-100'>
        {t.helpCenter?.categories?.deleteTitle || 'Een categorie verwijderen'}
      </h2>
      <p className='text-gray-600 dark:text-gray-400'>
        {t.helpCenter?.categories?.deleteText ||
          'Wanneer je een categorie verwijdert, kun je kiezen wat er met de toegewezen transacties gebeurt: verplaats ze naar een andere categorie, of laat ze ongecategoriseerd. Standaard categorieën kunnen niet worden verwijderd.'}
      </p>
    </article>
  );
}
