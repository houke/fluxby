export interface LandingWebMcpCopy {
  nav: string;
  help: {
    title: string;
    intro: string;
    requirementsTitle: string;
    requirements: string;
    stepsTitle: string;
    steps: string[];
    accessTitle: string;
    access: string;
    privacyTitle: string;
    privacy: string;
    limitsTitle: string;
    limits: string;
    developerLink: string;
  };
  docs: {
    title: string;
    intro: string;
    architectureTitle: string;
    architecture: string;
    lifecycleTitle: string;
    lifecycle: string;
    securityTitle: string;
    security: string;
    toolsTitle: string;
    toolsIntro: string;
    viewHeader: string;
    toolsHeader: string;
    rows: Array<[string, string]>;
    contractsTitle: string;
    inputHeader: string;
    resultHeader: string;
    contracts: Array<[string, string, string]>;
    writesTitle: string;
    writes: string;
    exampleTitle: string;
    exampleIntro: string;
    schemasTitle: string;
    schemas: string;
    errorsTitle: string;
    errors: string;
    compatibilityTitle: string;
    compatibility: string;
    apiTitle: string;
    api: string;
    helpLink: string;
  };
}

export const webMcpNl: LandingWebMcpCopy = {
  nav: 'WebMCP',
  help: {
    title: 'Browserassistenten met WebMCP',
    intro:
      'Met WebMCP kan een compatibele browserassistent je actieve Fluxby-profiel helpen lezen en een beperkt aantal wijzigingen voorstellen. Fluxby draait lokaal in je browser; je hoeft hiervoor geen API-server te starten.',
    requirementsTitle: 'Wat heb je nodig?',
    requirements:
      'Open Fluxby in een browser die WebMCP ondersteunt via een beveiligde verbinding. Houd het tabblad open en ontgrendel de app. Als je browser WebMCP nog niet ondersteunt, blijft de schakelaar uitgeschakeld.',
    stepsTitle: 'Toegang inschakelen',
    steps: [
      'Open Fluxby en ontgrendel je profiel.',
      'Ga naar Instellingen → App-instellingen → WebMCP voor browserassistenten.',
      'Kies Toegang inschakelen. Laat het Fluxby-tabblad open terwijl je de browserassistent gebruikt.',
      'Vraag je assistent om een overzicht, zoekactie of wijziging. Controleer elke bevestiging voor een wijziging.',
      'Kies Toegang uitschakelen zodra je klaar bent.',
    ],
    accessTitle: 'Welke gegevens zijn beschikbaar?',
    access:
      'De assistent kan het actieve profiel, rekeningen, transacties, analyses, budgetten, planning, abonnementen, contacten, importgeschiedenis en opgeslagen transactiefilters lezen. Fluxby beperkt transactielijsten tot 100 per aanvraag. Je kunt ook rekeningen, transacties, categorieën, spaardoelen en contacten toevoegen, transacties bijwerken en budgetten aanmaken of wijzigen. Een nieuw contact kan met een bestaand contact worden samengevoegd en bijpassende transacties koppelen.',
    privacyTitle: 'Privacy en bevestiging',
    privacy:
      'Toegang geldt alleen in deze appsessie. Vergrendelen, privacy-modus, uitschakelen of herladen verwijdert de hulpmiddelen. Iedere wijziging toont een bevestigingsvenster in Fluxby. De browserassistent kan gelezen gegevens verwerken of naar zijn eigen aanbieder sturen; controleer diens privacyvoorwaarden voordat je toegang geeft.',
    limitsTitle: 'Grenzen',
    limits:
      'WebMCP werkt alleen via een open, ondersteund browser-tabblad. Het geeft geen rechtstreekse toegang tot de lokale database buiten Fluxby. Wachtwoorden, sleutels, backups, bestandimports, synchronisatie en verwijderacties zijn niet als WebMCP-hulpmiddel beschikbaar.',
    developerLink: 'Bekijk de WebMCP-documentatie voor ontwikkelaars',
  },
  docs: {
    title: 'WebMCP voor de lokale webapp',
    intro:
      'Fluxby publiceert browserhulpmiddelen via document.modelContext wanneer de gebruiker dit in de ontgrendelde webapp inschakelt. Deze hulpmiddelen gebruiken dezelfde lokale data-service als de weergaven; ze zijn geen REST-endpoints.',
    architectureTitle: 'Architectuur',
    architecture:
      'De WebMCP-brug draait onder de beveiligingspoort van de React-app. Registraties krijgen een AbortSignal en worden verwijderd bij profielwisseling, taalwisseling, privacy-modus, vergrendelen, uitschakelen of navigatie weg van de pagina. De opt-in wordt niet opgeslagen; na herladen staat die weer uit.',
    lifecycleTitle: 'Beschikbaarheid',
    lifecycle:
      'Een beveiligde context, een browser met document.modelContext, een ontgrendelde database en een actief profiel zijn nodig. Er is geen achtergrondserver en een gesloten tabblad kan geen hulpmiddelen uitvoeren.',
    securityTitle: 'Gegevensbescherming',
    security:
      'Alle bewerkingen blijven beperkt tot het actieve profiel. Leesresultaten bevatten geen ruwe importdata of importhashes. Transactieverzoeken zijn gepagineerd. Leeshulpmiddelen gebruiken readOnlyHint en untrustedContentHint; schrijfhulpmiddelen gebruiken consequentialHint. Schrijfacties vragen een bevestiging in de app en verversen daarna de weergaven. Een browserassistent kan ontvangen gegevens elders verwerken; Fluxby heeft daar geen controle over.',
    toolsTitle: 'Hulpmiddelen per weergave',
    toolsIntro:
      'De stabiele namen hieronder zijn de namen die een browserassistent kan ontdekken. Open eerst Instellingen → App-instellingen en schakel WebMCP in.',
    viewHeader: 'Weergave',
    toolsHeader: 'Hulpmiddelen',
    rows: [
      ['Dashboard', 'fluxby_dashboard'],
      [
        'Transacties',
        'fluxby_transactions, fluxby_create_transaction, fluxby_update_transaction, fluxby_saved_views',
      ],
      ['Analytics', 'fluxby_analytics'],
      ['Budgetten', 'fluxby_budgets, fluxby_set_budget'],
      ['Planning', 'fluxby_planning, fluxby_create_goal'],
      ['Abonnementen', 'fluxby_subscriptions'],
      ['Adresboek', 'fluxby_contacts, fluxby_create_contact'],
      ['Categorieën', 'fluxby_categories, fluxby_create_category'],
      ['Import', 'fluxby_imports'],
      [
        'Instellingen',
        'fluxby_context, fluxby_accounts, fluxby_create_account',
      ],
      ['Alle weergaven, inclusief Help', 'fluxby_navigate'],
    ],
    contractsTitle: 'Invoer en uitvoer per hulpmiddel',
    inputHeader: 'Invoer',
    resultHeader: 'Uitvoer',
    contracts: [
      ['fluxby_context', 'Geen', 'Actief profiel, taal en weergaven'],
      ['fluxby_navigate', 'view: weergavenaam', 'Geopende weergave'],
      [
        'fluxby_dashboard',
        'startDate?, endDate?',
        'Inkomen, uitgaven, besparingen en aantal transacties',
      ],
      ['fluxby_accounts', 'Geen', 'Lijst rekeningen met saldo'],
      [
        'fluxby_transactions',
        'startDate?, endDate?, type?, accountId?, categoryId?, search?, limit?, offset?',
        'items, limit, offset, hasMore',
      ],
      [
        'fluxby_analytics',
        'startDate?, endDate?',
        'Periode, maand-, categorie- en daggegevens',
      ],
      ['fluxby_categories', 'Geen', 'Lijst categorieën en bestedingen'],
      ['fluxby_budgets', 'month? (JJJJ-MM)', 'Lijst budgetten en voortgang'],
      [
        'fluxby_planning',
        'Geen',
        'Vrij te besteden, vermogen, spaardoelen en geplande kasstromen',
      ],
      ['fluxby_subscriptions', 'Geen', 'Terugkerende patronen en statistieken'],
      ['fluxby_contacts', 'limit?, offset?', 'items, limit, offset, total'],
      [
        'fluxby_imports',
        'Geen',
        'Recente imports met aantal overgeslagen regels',
      ],
      ['fluxby_saved_views', 'Geen', 'Opgeslagen transactiefilters'],
      [
        'fluxby_create_account',
        'name, type, iban?, bank?, currentBalance?',
        'id of cancelled',
      ],
      [
        'fluxby_create_transaction',
        'date, amount, type, accountId, categoryId?, description?, merchantName?, notes?',
        'id of cancelled',
      ],
      [
        'fluxby_update_transaction',
        'id, categoryId?, merchantName?, notes?',
        'id en updated, of cancelled',
      ],
      ['fluxby_create_category', 'name, parentId?', 'id of cancelled'],
      [
        'fluxby_set_budget',
        'amount, budgetId? of categoryId?',
        'id en created/updated, of cancelled',
      ],
      [
        'fluxby_create_goal',
        'name, targetAmount, monthlyContribution?, deadline?',
        'id of cancelled',
      ],
      [
        'fluxby_create_contact',
        'name, iban, notes?',
        'id, merged en transactionsUpdated, of cancelled',
      ],
    ],
    writesTitle: 'Schrijfacties',
    writes:
      'Elke schrijfactie toont de voorgestelde waarden in een Fluxby-bevestiging. create_transaction vereist een bestaande rekening, ISO-datum, en een positief bedrag voor inkomsten of negatief bedrag voor uitgaven. set_budget maakt een budget met categoryId en amount, of wijzigt een bestaand budget met budgetId en amount. update_transaction accepteert id en minstens één van categoryId, merchantName of notes. create_contact kan een bestaand contact samenvoegen en bijpassende transacties koppelen. Andere schrijftools gebruiken de invoervelden uit hun JSON Schema.',
    exampleTitle: 'Hulpmiddelen ontdekken en aanroepen',
    exampleIntro:
      'Dit voorbeeld werkt in een ondersteund browser-tabblad nadat de gebruiker toegang heeft ingeschakeld. executeTool geeft een JSON-string terug.',
    schemasTitle: 'Invoer en resultaten',
    schemas:
      'Ieder hulpmiddel publiceert een JSON Schema met toegestane velden. De app valideert datums, getallen, profieleigendom en limieten opnieuw bij uitvoering. transactions accepteert startDate, endDate, type, accountId, categoryId, search, limit (1–100) en offset (0–100000); het resultaat bevat items, limit, offset en hasMore. contacts heeft ook limit en offset. analytics gebruikt standaard het afgelopen jaar en accepteert maximaal 366 dagen per aanvraag. Resultaten zijn JSON-serialiseerbare objecten.',
    errorsTitle: 'Fouten en annuleren',
    errors:
      'Ongeldige invoer, ontbrekende items en ingetrokken toegang laten de uitvoering mislukken. Een afgewezen bevestiging geeft { cancelled: true } terug. Gelijktijdige schrijfacties worden geweigerd zolang een bevestiging openstaat. Een registratie-AbortSignal verwijdert hulpmiddelen; een lopende uitvoering wordt opnieuw gecontroleerd vóór een wijziging.',
    compatibilityTitle: 'Browserondersteuning',
    compatibility:
      'WebMCP is nog in ontwikkeling. Controleer actuele browserondersteuning en de specificatie voordat je een integratie uitrolt. Fluxby toont een niet-beschikbaar melding als document.modelContext ontbreekt.',
    apiTitle: 'Verschil met de ontwikkelaars-API',
    api: 'WebMCP werkt in de geopende, ontgrendelde webapp en leest de lokale browserdatabase. De optionele API op localhost:3001 is een aparte ontwikkelaarstool met een eigen database. Een WebMCP-hulpmiddel is geen HTTP-endpoint of algemene MCP-server.',
    helpLink: 'Lees de gebruikershandleiding',
  },
};

export const webMcpEn: LandingWebMcpCopy = {
  nav: 'WebMCP',
  help: {
    title: 'Browser assistants with WebMCP',
    intro:
      'WebMCP lets a compatible browser assistant read your active Fluxby profile and propose a limited set of changes. Fluxby runs locally in your browser; you do not need to start the API server.',
    requirementsTitle: 'What you need',
    requirements:
      'Open Fluxby in a browser that supports WebMCP over a secure connection. Keep the tab open and unlock the app. If your browser does not yet support WebMCP, the switch stays disabled.',
    stepsTitle: 'Enable access',
    steps: [
      'Open Fluxby and unlock your profile.',
      'Go to Settings → App settings → WebMCP for browser assistants.',
      'Select Enable access. Keep the Fluxby tab open while using your browser assistant.',
      'Ask your assistant for a summary, search, or change. Review each confirmation for a change.',
      'Select Disable access when you finish.',
    ],
    accessTitle: 'What data is available?',
    access:
      'The assistant can read the active profile, accounts, transactions, analytics, budgets, planning, subscriptions, contacts, import history, and saved transaction filters. Fluxby limits transaction lists to 100 per request. It can also add accounts, transactions, categories, savings goals, and contacts, update transactions, and create or change budgets. Adding a contact may merge a match and link transactions.',
    privacyTitle: 'Privacy and confirmation',
    privacy:
      'Access lasts only for this app session. Locking, privacy mode, disabling access, or reloading removes the tools. Every change opens a confirmation dialog in Fluxby. Your browser assistant may process or send read data to its own provider; review its privacy terms before granting access.',
    limitsTitle: 'Limits',
    limits:
      'WebMCP works only through an open, supported browser tab. It does not provide direct access to the local database outside Fluxby. Passwords, keys, backups, file imports, synchronization, and delete actions are not WebMCP tools.',
    developerLink: 'Read the WebMCP developer documentation',
  },
  docs: {
    title: 'WebMCP for the local web app',
    intro:
      'Fluxby publishes browser tools through document.modelContext when the user enables access in the unlocked web app. These tools use the same local data service as the views; they are not REST endpoints.',
    architectureTitle: 'Architecture',
    architecture:
      'The WebMCP bridge runs behind the React app security gate. Registrations receive an AbortSignal and are removed when the profile or language changes, privacy mode turns on, the app locks, access is disabled, or the page is left. Opt-in is not persisted; it is off again after reload.',
    lifecycleTitle: 'Availability',
    lifecycle:
      'A secure context, a browser with document.modelContext, an unlocked database, and an active profile are required. There is no background server, and a closed tab cannot execute tools.',
    securityTitle: 'Data protection',
    security:
      'All operations are scoped to the active profile. Read results exclude raw import data and import hashes. Transaction requests are paginated. Read tools use readOnlyHint and untrustedContentHint; write tools use consequentialHint. Writes require an in-app confirmation and then refresh the views. A browser assistant may process received data elsewhere; Fluxby cannot control that.',
    toolsTitle: 'Tools by view',
    toolsIntro:
      'The stable names below are what a browser assistant can discover. First open Settings → App settings and enable WebMCP.',
    viewHeader: 'View',
    toolsHeader: 'Tools',
    rows: [
      ['Dashboard', 'fluxby_dashboard'],
      [
        'Transactions',
        'fluxby_transactions, fluxby_create_transaction, fluxby_update_transaction, fluxby_saved_views',
      ],
      ['Analytics', 'fluxby_analytics'],
      ['Budgets', 'fluxby_budgets, fluxby_set_budget'],
      ['Planning', 'fluxby_planning, fluxby_create_goal'],
      ['Subscriptions', 'fluxby_subscriptions'],
      ['Address book', 'fluxby_contacts, fluxby_create_contact'],
      ['Categories', 'fluxby_categories, fluxby_create_category'],
      ['Import', 'fluxby_imports'],
      ['Settings', 'fluxby_context, fluxby_accounts, fluxby_create_account'],
      ['All views, including Help', 'fluxby_navigate'],
    ],
    contractsTitle: 'Input and output by tool',
    inputHeader: 'Input',
    resultHeader: 'Output',
    contracts: [
      ['fluxby_context', 'None', 'Active profile, language, and views'],
      ['fluxby_navigate', 'view: view name', 'Opened view'],
      [
        'fluxby_dashboard',
        'startDate?, endDate?',
        'Income, expenses, savings, and transaction count',
      ],
      ['fluxby_accounts', 'None', 'Accounts with balances'],
      [
        'fluxby_transactions',
        'startDate?, endDate?, type?, accountId?, categoryId?, search?, limit?, offset?',
        'items, limit, offset, hasMore',
      ],
      [
        'fluxby_analytics',
        'startDate?, endDate?',
        'Period, monthly, category, and daily data',
      ],
      ['fluxby_categories', 'None', 'Categories and spending'],
      ['fluxby_budgets', 'month? (YYYY-MM)', 'Budgets and progress'],
      [
        'fluxby_planning',
        'None',
        'Safe to spend, net worth, goals, and planned cashflows',
      ],
      ['fluxby_subscriptions', 'None', 'Recurring patterns and statistics'],
      ['fluxby_contacts', 'limit?, offset?', 'items, limit, offset, total'],
      ['fluxby_imports', 'None', 'Recent imports with skipped-row counts'],
      ['fluxby_saved_views', 'None', 'Saved transaction filters'],
      [
        'fluxby_create_account',
        'name, type, iban?, bank?, currentBalance?',
        'id or cancelled',
      ],
      [
        'fluxby_create_transaction',
        'date, amount, type, accountId, categoryId?, description?, merchantName?, notes?',
        'id or cancelled',
      ],
      [
        'fluxby_update_transaction',
        'id, categoryId?, merchantName?, notes?',
        'id and updated, or cancelled',
      ],
      ['fluxby_create_category', 'name, parentId?', 'id or cancelled'],
      [
        'fluxby_set_budget',
        'amount, budgetId? or categoryId?',
        'id and created/updated, or cancelled',
      ],
      [
        'fluxby_create_goal',
        'name, targetAmount, monthlyContribution?, deadline?',
        'id or cancelled',
      ],
      [
        'fluxby_create_contact',
        'name, iban, notes?',
        'id, merged and transactionsUpdated, or cancelled',
      ],
    ],
    writesTitle: 'Write operations',
    writes:
      'Every write shows the proposed values in a Fluxby confirmation. create_transaction requires an existing account, an ISO date, and a positive amount for income or negative amount for an expense. set_budget creates a budget with categoryId and amount, or changes an existing budget with budgetId and amount. update_transaction accepts id and at least one of categoryId, merchantName, or notes. create_contact may merge a matching contact and link transactions. Other write tools use the fields in their JSON Schema.',
    exampleTitle: 'Discover and call tools',
    exampleIntro:
      'This example works in a supported browser tab after the user enables access. executeTool returns a JSON string.',
    schemasTitle: 'Input and results',
    schemas:
      'Each tool publishes a JSON Schema with allowed fields. The app also validates dates, numbers, profile ownership, and limits at execution. transactions accepts startDate, endDate, type, accountId, categoryId, search, limit (1–100), and offset (0–100000); its result contains items, limit, offset, and hasMore. contacts also has limit and offset. analytics defaults to the past year and accepts at most 366 days per request. Results are JSON-serializable objects.',
    errorsTitle: 'Errors and cancellation',
    errors:
      'Invalid input, missing items, and revoked access fail execution. Declining a confirmation returns { cancelled: true }. Concurrent writes are rejected while a confirmation is open. A registration AbortSignal removes tools; a running execution is checked again before a change.',
    compatibilityTitle: 'Browser support',
    compatibility:
      'WebMCP is still evolving. Check current browser support and the specification before shipping an integration. Fluxby displays an unavailable message when document.modelContext is missing.',
    apiTitle: 'How this differs from the developer API',
    api: 'WebMCP runs in the open, unlocked web app and reads the local browser database. The optional API on localhost:3001 is a separate developer tool with its own database. A WebMCP tool is neither an HTTP endpoint nor a general MCP server.',
    helpLink: 'Read the user guide',
  },
};
