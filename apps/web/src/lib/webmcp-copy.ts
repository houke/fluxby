export interface WebMcpCopy {
  settingsTitle: string;
  settingsDescription: string;
  enable: string;
  disable: string;
  unsupported: string;
  privacyUnavailable: string;
  active: string;
  inactive: string;
  helpLink: string;
  confirmTitle: string;
  confirmMessage: string;
  fieldLabels: Record<string, string>;
  saved: string;
  cancelled: string;
  invalidInput: string;
  notFound: string;
  unavailable: string;
  busy: string;
  tool: Record<WebMcpToolKey, { title: string; description: string }>;
}

export type WebMcpToolKey =
  | 'context'
  | 'navigate'
  | 'dashboard'
  | 'accounts'
  | 'transactions'
  | 'analytics'
  | 'categories'
  | 'budgets'
  | 'planning'
  | 'subscriptions'
  | 'contacts'
  | 'imports'
  | 'savedViews'
  | 'createAccount'
  | 'createTransaction'
  | 'updateTransaction'
  | 'createCategory'
  | 'setBudget'
  | 'createGoal'
  | 'createContact';

export const webMcpNl: WebMcpCopy = {
  settingsTitle: 'WebMCP voor browserassistenten',
  settingsDescription:
    'Geef een compatibele browserassistent tijdelijk toegang tot het actieve profiel. De assistent kan financiële gegevens lezen; wijzigingen vragen altijd jouw bevestiging. Toegang stopt bij vergrendelen, privacy-modus of herladen.',
  enable: 'Toegang inschakelen',
  disable: 'Toegang uitschakelen',
  unsupported: 'Deze browser ondersteunt WebMCP nog niet.',
  privacyUnavailable:
    'Schakel de privacy-modus uit voordat je toegang inschakelt.',
  active: 'Toegang actief voor deze sessie',
  inactive: 'Toegang uitgeschakeld',
  helpLink: 'Lees de WebMCP-handleiding',
  confirmTitle: 'Wijziging door browserassistent',
  confirmMessage:
    'Wil je {action} uitvoeren in profiel {profile}? Voorgestelde gegevens: {details}',
  fieldLabels: {
    id: 'ID',
    name: 'Naam',
    type: 'Type',
    iban: 'IBAN',
    bank: 'Bank',
    currentBalance: 'Huidig saldo',
    date: 'Datum',
    amount: 'Bedrag',
    accountId: 'Rekening-ID',
    categoryId: 'Categorie-ID',
    description: 'Omschrijving',
    merchantName: 'Naam tegenpartij',
    notes: 'Notities',
    parentId: 'Bovenliggende categorie-ID',
    budgetId: 'Budget-ID',
    targetAmount: 'Doelbedrag',
    monthlyContribution: 'Maandelijkse inleg',
    deadline: 'Einddatum',
  },
  saved: 'Wijziging door browserassistent opgeslagen',
  cancelled: 'Wijziging geannuleerd',
  invalidInput: 'Ongeldige invoer voor WebMCP-hulpmiddel',
  notFound: 'Item niet gevonden in het actieve profiel',
  unavailable: 'WebMCP-toegang is niet meer actief',
  busy: 'Er wacht al een wijziging op bevestiging',
  tool: {
    context: {
      title: 'Fluxby-context',
      description: 'Lees het actieve profiel en de taal.',
    },
    navigate: {
      title: 'Fluxby-weergave openen',
      description: 'Open een Fluxby-weergave in deze browser.',
    },
    dashboard: {
      title: 'Dashboard lezen',
      description:
        'Lees samenvattende inkomsten, uitgaven en besparingen voor een periode.',
    },
    accounts: {
      title: 'Rekeningen lezen',
      description: 'Lees rekeningen en saldi in het actieve profiel.',
    },
    transactions: {
      title: 'Transacties zoeken',
      description:
        'Zoek transacties met filters en paginering in het actieve profiel.',
    },
    analytics: {
      title: 'Analyses lezen',
      description: 'Lees maand-, categorie- en daganalyses voor een periode.',
    },
    categories: {
      title: 'Categorieën lezen',
      description: 'Lees categorieën in het actieve profiel.',
    },
    budgets: {
      title: 'Budgetten lezen',
      description: 'Lees budgetten en bestedingen voor een maand.',
    },
    planning: {
      title: 'Planning lezen',
      description:
        'Lees spaardoelen, kasstromen, vrij te besteden bedrag en vermogen.',
    },
    subscriptions: {
      title: 'Abonnementen lezen',
      description:
        'Lees herkende terugkerende betalingen en abonnementsstatistieken.',
    },
    contacts: {
      title: 'Contacten lezen',
      description: 'Lees een beperkte lijst uit het adresboek.',
    },
    imports: {
      title: 'Importgeschiedenis lezen',
      description: 'Lees recente bankbestand-imports.',
    },
    savedViews: {
      title: 'Opgeslagen filters lezen',
      description: 'Lees opgeslagen transactieweergaven.',
    },
    createAccount: {
      title: 'Rekening toevoegen',
      description:
        'Voeg na bevestiging een rekening toe aan het actieve profiel.',
    },
    createTransaction: {
      title: 'Transactie toevoegen',
      description: 'Voeg na bevestiging een handmatige transactie toe.',
    },
    updateTransaction: {
      title: 'Transactie bijwerken',
      description:
        'Wijzig na bevestiging categorie, naam of notities van een transactie.',
    },
    createCategory: {
      title: 'Categorie toevoegen',
      description: 'Voeg na bevestiging een categorie toe.',
    },
    setBudget: {
      title: 'Budget instellen',
      description: 'Maak na bevestiging een budget aan of wijzig het bedrag.',
    },
    createGoal: {
      title: 'Spaardoel toevoegen',
      description: 'Voeg na bevestiging een spaardoel toe.',
    },
    createContact: {
      title: 'Contact toevoegen of samenvoegen en transacties koppelen',
      description:
        'Voeg na bevestiging een contact toe of voeg het samen met een bestaand contact; bijpassende transacties worden gekoppeld.',
    },
  },
};

export const webMcpEn: WebMcpCopy = {
  settingsTitle: 'WebMCP for browser assistants',
  settingsDescription:
    'Temporarily allow a compatible browser assistant to access the active profile. The assistant can read financial data; changes always require your confirmation. Access ends when you lock, enable privacy mode, or reload.',
  enable: 'Enable access',
  disable: 'Disable access',
  unsupported: 'This browser does not support WebMCP yet.',
  privacyUnavailable: 'Turn off privacy mode before enabling access.',
  active: 'Access active for this session',
  inactive: 'Access disabled',
  helpLink: 'Read the WebMCP guide',
  confirmTitle: 'Browser assistant change',
  confirmMessage:
    'Do you want to {action} in profile {profile}? Proposed values: {details}',
  fieldLabels: {
    id: 'ID',
    name: 'Name',
    type: 'Type',
    iban: 'IBAN',
    bank: 'Bank',
    currentBalance: 'Current balance',
    date: 'Date',
    amount: 'Amount',
    accountId: 'Account ID',
    categoryId: 'Category ID',
    description: 'Description',
    merchantName: 'Merchant name',
    notes: 'Notes',
    parentId: 'Parent category ID',
    budgetId: 'Budget ID',
    targetAmount: 'Target amount',
    monthlyContribution: 'Monthly contribution',
    deadline: 'Deadline',
  },
  saved: 'Browser assistant change saved',
  cancelled: 'Change cancelled',
  invalidInput: 'Invalid WebMCP tool input',
  notFound: 'Item not found in the active profile',
  unavailable: 'WebMCP access is no longer active',
  busy: 'Another change is awaiting confirmation',
  tool: {
    context: {
      title: 'Fluxby context',
      description: 'Read the active profile and language.',
    },
    navigate: {
      title: 'Open Fluxby view',
      description: 'Open a Fluxby view in this browser.',
    },
    dashboard: {
      title: 'Read dashboard',
      description: 'Read income, expenses, and savings summary for a period.',
    },
    accounts: {
      title: 'Read accounts',
      description: 'Read accounts and balances in the active profile.',
    },
    transactions: {
      title: 'Search transactions',
      description:
        'Search active-profile transactions with filters and pagination.',
    },
    analytics: {
      title: 'Read analytics',
      description: 'Read monthly, category, and daily analytics for a period.',
    },
    categories: {
      title: 'Read categories',
      description: 'Read categories in the active profile.',
    },
    budgets: {
      title: 'Read budgets',
      description: 'Read budgets and spending for a month.',
    },
    planning: {
      title: 'Read planning',
      description:
        'Read savings goals, cashflows, safe-to-spend, and net worth.',
    },
    subscriptions: {
      title: 'Read subscriptions',
      description:
        'Read detected recurring payments and subscription statistics.',
    },
    contacts: {
      title: 'Read contacts',
      description: 'Read a bounded list from the address book.',
    },
    imports: {
      title: 'Read import history',
      description: 'Read recent bank-file imports.',
    },
    savedViews: {
      title: 'Read saved filters',
      description: 'Read saved transaction views.',
    },
    createAccount: {
      title: 'Add account',
      description: 'Add an account to the active profile after confirmation.',
    },
    createTransaction: {
      title: 'Add transaction',
      description: 'Add a manual transaction after confirmation.',
    },
    updateTransaction: {
      title: 'Update transaction',
      description:
        'Change a transaction category, merchant, or notes after confirmation.',
    },
    createCategory: {
      title: 'Add category',
      description: 'Add a category after confirmation.',
    },
    setBudget: {
      title: 'Set budget',
      description: 'Create a budget or change its amount after confirmation.',
    },
    createGoal: {
      title: 'Add savings goal',
      description: 'Add a savings goal after confirmation.',
    },
    createContact: {
      title: 'Add or merge contact and link transactions',
      description:
        'Add or merge a matching address book contact after confirmation; matching transactions are linked.',
    },
  },
};
