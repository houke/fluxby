// Onboarding data configuration for Fluxby
// Contains all chapters and steps for the onboarding flow
// Note: Language, name, and password setup are handled by SecuritySetup component before onboarding

import type { OnboardingChapter } from './types';

export const onboardingChapters: OnboardingChapter[] = [
  // ==========================================================================
  // CHAPTER 0: Welcome Introduction
  // ==========================================================================
  {
    id: 'welcome',
    menuItem: 'welcome',
    route: '/',
    icon: 'Sparkles',
    title: {
      nl: 'Welkom',
      en: 'Welcome',
    },
    steps: [
      {
        id: 'welcome-intro',
        title: {
          nl: 'Welkom bij Fluxby! 🎉',
          en: 'Welcome to Fluxby! 🎉',
        },
        content: {
          nl: 'Fluxby helpt je om grip te krijgen op je financiën. In deze rondleiding leer je alle functies kennen. Laten we beginnen!',
          en: "Fluxby helps you take control of your finances. In this tour, you'll learn all the features. Let's get started!",
        },
        placement: 'center',
      },
    ],
  },

  // ==========================================================================
  // CHAPTER 1: Navigation & Header (show this first to orient users)
  // ==========================================================================
  {
    id: 'navigation',
    menuItem: 'navigation',
    route: '/',
    icon: 'Menu',
    title: {
      nl: 'Navigatie',
      en: 'Navigation',
    },
    steps: [
      {
        id: 'nav-sidebar',
        title: {
          nl: 'Navigatie menu',
          en: 'Navigation menu',
        },
        content: {
          nl: 'Gebruik het zijmenu om snel tussen verschillende onderdelen van de app te navigeren.',
          en: 'Use the sidebar menu to quickly navigate between different parts of the app.',
        },
        selector: '[data-onboarding="sidebar"]',
        placement: 'right',
      },
      {
        id: 'nav-date-filter',
        title: {
          nl: 'Datumfilter',
          en: 'Date filter',
        },
        content: {
          nl: 'Filter alle data op een specifieke periode. Kies uit voorinstellingen of selecteer een aangepaste periode.',
          en: 'Filter all data by a specific period. Choose from presets or select a custom period.',
        },
        selector: '[data-onboarding="header-date-filter"]',
        placement: 'bottom',
      },
      {
        id: 'nav-profile-switcher',
        title: {
          nl: 'Profiel wisselen',
          en: 'Switch profile',
        },
        content: {
          nl: 'Wissel snel tussen je verschillende financiële profielen.',
          en: 'Quickly switch between your different financial profiles.',
        },
        selector: '[data-onboarding="profile-switcher"]',
        placement: 'bottom',
      },
      {
        id: 'nav-fluxby-mascot',
        title: {
          nl: 'Fluxby mascotte',
          en: 'Fluxby mascot',
        },
        content: {
          nl: 'Fluxby is je financiële maatje! Klik op Fluxby om dit onboarding opnieuw te starten.',
          en: 'Fluxby is your financial buddy! Click on Fluxby to restart this onboarding.',
        },
        selector: '[data-onboarding="fluxby-mascot"]',
        placement: 'right',
      },
    ],
  },

  // ==========================================================================
  // CHAPTER 2: Dashboard
  // ==========================================================================
  {
    id: 'dashboard',
    menuItem: 'dashboard',
    route: '/',
    icon: 'LayoutDashboard',
    title: {
      nl: 'Dashboard',
      en: 'Dashboard',
    },
    steps: [
      {
        id: 'dashboard-overview',
        title: {
          nl: 'Je financieel overzicht',
          en: 'Your financial overview',
        },
        content: {
          nl: 'Het dashboard geeft je in één oogopslag inzicht in je financiële situatie. Hier zie je je inkomen, uitgaven en saldo.',
          en: 'The dashboard gives you a quick overview of your financial situation. Here you can see your income, expenses, and balance.',
        },
        selector: '[data-onboarding="nav-dashboard"]',
        placement: 'right',
      },
      {
        id: 'dashboard-greeting',
        title: {
          nl: 'Persoonlijke begroeting',
          en: 'Personal greeting',
        },
        content: {
          nl: 'Fluxby begroet je met een persoonlijke boodschap op basis van het tijdstip van de dag.',
          en: 'Fluxby greets you with a personalized message based on the time of day.',
        },
        selector: '[data-onboarding="dashboard-greeting"]',
        placement: 'bottom',
      },
      {
        id: 'dashboard-accounts',
        title: {
          nl: 'Je rekeningen',
          en: 'Your accounts',
        },
        content: {
          nl: 'Hier zie je het saldo van al je bankrekeningen: betaalrekening, spaarrekening en creditcard.\n\nJe rekeningen worden automatisch aangemaakt bij het importeren van transacties, of je kunt ze handmatig toevoegen via Instellingen → Rekeningen.',
          en: 'Here you can see the balance of all your bank accounts: checking, savings, and credit card.\n\nYour accounts are automatically created when importing transactions, or you can add them manually via Settings → Accounts.',
        },
        selector: '[data-onboarding="dashboard-accounts"]',
        placement: 'bottom',
      },
      {
        id: 'dashboard-stats',
        title: {
          nl: 'Kerncijfers',
          en: 'Key stats',
        },
        content: {
          nl: 'Deze kaarten tonen je inkomen, uitgaven, overboekingen naar sparen en je netto resultaat voor de geselecteerde periode.',
          en: 'These cards show your income, expenses, savings transfers, and net result for the selected period.',
        },
        selector: '[data-onboarding="dashboard-stats"]',
        placement: 'bottom',
      },
      {
        id: 'dashboard-income-card',
        title: {
          nl: 'Inkomen',
          en: 'Income',
        },
        content: {
          nl: 'Je totale inkomen voor deze periode. Dit omvat salaris, bonussen en andere inkomsten.',
          en: 'Your total income for this period. This includes salary, bonuses, and other earnings.',
        },
        selector: '[data-onboarding="stat-income"]',
        placement: 'bottom',
      },
      {
        id: 'dashboard-expenses-card',
        title: {
          nl: 'Uitgaven',
          en: 'Expenses',
        },
        content: {
          nl: 'Je totale uitgaven voor deze periode. Klik voor details per categorie.',
          en: 'Your total expenses for this period. Click for details by category.',
        },
        selector: '[data-onboarding="stat-expenses"]',
        placement: 'bottom',
      },
      {
        id: 'dashboard-savings-card',
        title: {
          nl: 'Naar sparen',
          en: 'To savings',
        },
        content: {
          nl: 'Het netto bedrag dat je hebt overgeboekt naar je spaarrekening. Positief = meer gespaard, negatief = meer opgenomen.',
          en: 'The net amount transferred to your savings account. Positive = more saved, negative = more withdrawn.',
        },
        selector: '[data-onboarding="stat-savings"]',
        placement: 'bottom',
      },
      {
        id: 'dashboard-net-result',
        title: {
          nl: 'Netto resultaat',
          en: 'Net result',
        },
        content: {
          nl: 'Je totale inkomen minus uitgaven. Groen betekent overschot, rood betekent tekort.',
          en: 'Your total income minus expenses. Green means surplus, red means deficit.',
        },
        selector: '[data-onboarding="stat-net-result"]',
        placement: 'bottom',
      },
      {
        id: 'dashboard-monthly-chart',
        title: {
          nl: 'Maandelijks inkomen',
          en: 'Monthly income',
        },
        content: {
          nl: 'Deze grafiek toont je inkomen per maand. Scroll horizontaal om eerdere maanden te bekijken.',
          en: 'This chart shows your income per month. Scroll horizontally to view previous months.',
        },
        selector: '[data-onboarding="monthly-income-chart"]',
        placement: 'right',
      },
      {
        id: 'dashboard-category-pie',
        title: {
          nl: 'Uitgaven per categorie',
          en: 'Expenses by category',
        },
        content: {
          nl: 'Deze taartgrafiek toont de verdeling van je uitgaven over categorieën. Klik op een segment voor details.',
          en: 'This pie chart shows the distribution of your expenses across categories. Click a segment for details.',
        },
        selector: '[data-onboarding="category-pie-chart"]',
        placement: 'left',
      },
      {
        id: 'dashboard-comparison-chart',
        title: {
          nl: 'Inkomen vs Uitgaven',
          en: 'Income vs Expenses',
        },
        content: {
          nl: 'Vergelijk je inkomen en uitgaven per maand. De lijn toont je netto resultaat.',
          en: 'Compare your income and expenses per month. The line shows your net result.',
        },
        selector: '[data-onboarding="income-expenses-chart"]',
        placement: 'left',
      },
      {
        id: 'dashboard-daily-expenses',
        title: {
          nl: 'Dagelijkse uitgaven',
          en: 'Daily expenses',
        },
        content: {
          nl: 'Bekijk je uitgaven per dag. Handig om pieken in je uitgaven te identificeren.',
          en: 'View your expenses per day. Useful for identifying spending peaks.',
        },
        selector: '[data-onboarding="daily-expenses-chart"]',
        placement: 'right',
      },
      {
        id: 'dashboard-budgets',
        title: {
          nl: 'Budget voortgang',
          en: 'Budget progress',
        },
        content: {
          nl: 'Bekijk hoeveel van je maandbudget je al hebt besteed en of je op schema ligt.',
          en: 'See how much of your monthly budget you have spent and whether you are on track.',
        },
        selector: '[data-onboarding="budget-progress"]',
        placement: 'left',
      },
      {
        id: 'dashboard-forecast',
        title: {
          nl: 'Saldo voorspelling',
          en: 'Balance forecast',
        },
        content: {
          nl: 'Fluxby voorspelt je eindsaldo op basis van je gemiddelde inkomsten en uitgaven.',
          en: 'Fluxby predicts your end balance based on your average income and expenses.',
        },
        selector: '[data-onboarding="balance-forecast"]',
        placement: 'left',
      },
      {
        id: 'dashboard-recent-transactions',
        title: {
          nl: 'Recente transacties',
          en: 'Recent transactions',
        },
        content: {
          nl: 'Je meest recente transacties. Klik op "Bekijk alles" om naar de volledige lijst te gaan.',
          en: 'Your most recent transactions. Click "View all" to see the complete list.',
        },
        selector: '[data-onboarding="recent-transactions"]',
        placement: 'top',
      },
      {
        id: 'dashboard-top-accounts',
        title: {
          nl: 'Top tegenrekeningen',
          en: 'Top counterparties',
        },
        content: {
          nl: 'De partijen waarmee je het meeste transacties hebt. Handig voor adresboek en categorisatie.',
          en: 'The parties you transact with most. Useful for address book and categorization.',
        },
        selector: '[data-onboarding="top-accounts"]',
        placement: 'top',
      },
    ],
  },

  // ==========================================================================
  // CHAPTER 2: Transactions
  // ==========================================================================
  {
    id: 'transactions',
    menuItem: 'transactions',
    route: '/transactions',
    icon: 'ArrowLeftRight',
    title: {
      nl: 'Transacties',
      en: 'Transactions',
    },
    steps: [
      {
        id: 'transactions-overview',
        title: {
          nl: 'Al je transacties',
          en: 'All your transactions',
        },
        content: {
          nl: 'Hier vind je een compleet overzicht van al je transacties. Filter, zoek en categoriseer naar hartenlust.',
          en: "Here you find a complete overview of all your transactions. Filter, search, and categorize to your heart's content.",
        },
        selector: '[data-onboarding="nav-transactions"]',
        placement: 'right',
      },
      {
        id: 'transactions-accounts',
        title: {
          nl: "Rekening saldo's",
          en: 'Account balances',
        },
        content: {
          nl: "Bovenaan zie je de huidige saldo's van al je rekeningen.",
          en: 'At the top you can see the current balances of all your accounts.',
        },
        selector: '[data-onboarding="transaction-accounts"]',
        placement: 'bottom',
      },
      {
        id: 'transactions-summary',
        title: {
          nl: 'Totaaloverzicht',
          en: 'Summary',
        },
        content: {
          nl: 'Hier zie je het totaal van de gefilterde transacties: inkomen, uitgaven en netto resultaat.',
          en: 'Here you see the total of filtered transactions: income, expenses, and net result.',
        },
        selector: '[data-onboarding="transaction-summary"]',
        placement: 'bottom',
      },
      {
        id: 'transactions-search',
        title: {
          nl: 'Zoeken',
          en: 'Search',
        },
        content: {
          nl: 'Zoek op naam, beschrijving of bedrag. De zoekfunctie doorzoekt alle transactiegegevens.',
          en: 'Search by name, description, or amount. The search function searches all transaction data.',
        },
        selector: '[data-onboarding="transaction-search"]',
        placement: 'bottom',
      },
      {
        id: 'transactions-all-filters',
        title: {
          nl: 'Filter knoppen',
          en: 'Filter buttons',
        },
        content: {
          nl: 'Hier vind je alle filteropties: type, categorie, contact en betaalmethode. Combineer filters voor precieze resultaten.',
          en: 'Here you find all filter options: type, category, contact, and payment method. Combine filters for precise results.',
        },
        selector: '[data-onboarding="transaction-filter-buttons"]',
        placement: 'bottom',
      },
      {
        id: 'transactions-type-filter',
        title: {
          nl: 'Transacties filter',
          en: 'Transactions filter',
        },
        content: {
          nl: 'Filter op inkomen, uitgaven of overboekingen. Handig om specifieke transacties te vinden.',
          en: 'Filter by income, expenses, or transfers. Useful for finding specific transactions.',
        },
        selector: '[data-onboarding="transaction-type-filter-button"]',
        placement: 'bottom',
      },
      {
        id: 'transactions-category-filter',
        title: {
          nl: 'Filter op categorie',
          en: 'Filter by category',
        },
        content: {
          nl: 'Selecteer één of meerdere categorieën om alleen die transacties te zien.',
          en: 'Select one or more categories to see only those transactions.',
        },
        selector: '[data-onboarding="transaction-category-filter"]',
        placement: 'bottom',
      },
      {
        id: 'transactions-addressbook-filter',
        title: {
          nl: 'Filter op contact',
          en: 'Filter by contact',
        },
        content: {
          nl: 'Filter transacties op basis van contacten uit je adresboek.',
          en: 'Filter transactions based on contacts from your address book.',
        },
        selector: '[data-onboarding="transaction-addressbook-filter"]',
        placement: 'bottom',
      },
      {
        id: 'transactions-payment-filter',
        title: {
          nl: 'Betaalmethode filter',
          en: 'Payment method filter',
        },
        content: {
          nl: 'Filter op betaalmethode: PIN, iDEAL, overboeking, incasso, etc.',
          en: 'Filter by payment method: PIN, iDEAL, transfer, direct debit, etc.',
        },
        selector: '[data-onboarding="transaction-payment-filter"]',
        placement: 'bottom',
      },
      {
        id: 'transactions-payment-processor-filter',
        title: {
          nl: 'Betaalprovider filter',
          en: 'Payment processor filter',
        },
        content: {
          nl: 'Filter specifiek op transacties via betaalproviders zoals PayPal, Tikkie of andere diensten.',
          en: 'Filter specifically for transactions via payment providers like PayPal, Tikkie or other services.',
        },
        selector: '[data-onboarding="transaction-payment-processor-filter"]',
        placement: 'bottom',
      },
      {
        id: 'transactions-list',
        title: {
          nl: 'Transactielijst',
          en: 'Transaction list',
        },
        content: {
          nl: 'Elke transactie toont datum, naam, categorie en bedrag. Klik voor meer details.',
          en: 'Each transaction shows date, name, category, and amount. Click for more details.',
        },
        selector: '[data-onboarding="transaction-list"]',
        placement: 'top',
      },
      {
        id: 'transactions-row',
        title: {
          nl: 'Transactie details',
          en: 'Transaction details',
        },
        content: {
          nl: 'Klik op een transactie om de details te zien: volledige beschrijving, tegenrekening, notities, en meer.',
          en: 'Click on a transaction to see details: full description, counterparty, notes, and more.',
        },
        selector: '[data-onboarding="transaction-row"]',
        placement: 'right',
      },
      {
        id: 'transactions-recurring-badge',
        title: {
          nl: 'Terugkerende transacties',
          en: 'Recurring transactions',
        },
        content: {
          nl: 'De paarse badge met een getal geeft aan hoe vaak deze transactie terugkomt. Klik op de rij om de volledige historie te zien.',
          en: 'The purple badge with a number indicates how often this transaction recurs. Click the row to see the full history.',
        },
        selector: '[data-onboarding="transaction-recurring-badge"]',
        placement: 'left',
      },
      {
        id: 'transactions-payment-processor',
        title: {
          nl: 'Betaalprovider',
          en: 'Payment processor',
        },
        content: {
          nl: 'Sommige transacties worden verwerkt via betaalproviders zoals PayPal of Tikkie. Fluxby herkent deze en toont de echte ontvanger of afzender.',
          en: 'Some transactions are processed via payment providers like PayPal or Tikkie. Fluxby recognizes these and shows the actual recipient or sender.',
        },
        selector: '[data-onboarding="transaction-payment-processor"]',
        placement: 'left',
      },
      {
        id: 'transactions-category-assign',
        title: {
          nl: 'Categorie toewijzen',
          en: 'Assign category',
        },
        content: {
          nl: 'Klik op de categorie badge om een transactie te categoriseren. Fluxby doet ook automatische suggesties.',
          en: 'Click on the category badge to categorize a transaction. Fluxby also provides automatic suggestions.',
        },
        selector: '[data-onboarding="transaction-category-badge"]',
        placement: 'left',
      },
      {
        id: 'transactions-addressbook-add',
        title: {
          nl: 'Toevoegen aan adresboek',
          en: 'Add to address book',
        },
        content: {
          nl: 'Voeg onbekende tegenrekeningen toe aan je adresboek voor betere herkenning.',
          en: 'Add unknown counterparties to your address book for better recognition.',
        },
        selector: '[data-onboarding="transaction-add-addressbook"]',
        placement: 'left',
      },
    ],
  },

  // ==========================================================================
  // CHAPTER 3: Analytics
  // ==========================================================================
  {
    id: 'analytics',
    menuItem: 'analytics',
    route: '/analytics',
    icon: 'BarChart3',
    title: {
      nl: 'Analyse',
      en: 'Analytics',
    },
    steps: [
      {
        id: 'analytics-overview',
        title: {
          nl: 'Diepgaande analyse',
          en: 'Deep analysis',
        },
        content: {
          nl: 'Op de analyse pagina krijg je gedetailleerde inzichten in je financiële patronen over langere periodes.',
          en: 'On the analytics page you get detailed insights into your financial patterns over longer periods.',
        },
        selector: '[data-onboarding="nav-analytics"]',
        placement: 'right',
      },
      {
        id: 'analytics-year-selector',
        title: {
          nl: 'Jaar selectie',
          en: 'Year selection',
        },
        content: {
          nl: 'De analyses tonen volledige jaren gebaseerd op de geselecteerde datumperiode in de header. Selecteer verschillende jaren om de data te vergelijken.',
          en: 'Analytics show full years based on the selected date range in the header. Select different years to compare data.',
        },
        selector: '[data-onboarding="header-date-filter"]',
        placement: 'bottom',
      },
      {
        id: 'analytics-net-savings',
        title: {
          nl: 'Netto sparen over tijd',
          en: 'Net savings over time',
        },
        content: {
          nl: 'Deze grafiek toont hoeveel je per maand netto overhoudt (inkomen minus uitgaven).',
          en: 'This chart shows how much you save net per month (income minus expenses).',
        },
        selector: '[data-onboarding="net-savings-chart"]',
        placement: 'bottom',
      },
      {
        id: 'analytics-income-expenses',
        title: {
          nl: 'Inkomen vs Uitgaven trend',
          en: 'Income vs Expenses trend',
        },
        content: {
          nl: 'Vergelijk je inkomen en uitgaven over meerdere maanden om trends te ontdekken.',
          en: 'Compare your income and expenses over multiple months to discover trends.',
        },
        selector: '[data-onboarding="income-expenses-trend"]',
        placement: 'bottom',
      },
      {
        id: 'analytics-expense-breakdown',
        title: {
          nl: 'Uitgaven verdeling',
          en: 'Expense breakdown',
        },
        content: {
          nl: 'Bekijk hoe je uitgaven zijn verdeeld over categorieën. Klik op een segment om details te zien.',
          en: 'See how your expenses are distributed across categories. Click a segment to see details.',
        },
        selector: '[data-onboarding="expense-breakdown"]',
        placement: 'right',
      },
      {
        id: 'analytics-income-breakdown',
        title: {
          nl: 'Inkomen verdeling',
          en: 'Income breakdown',
        },
        content: {
          nl: 'Bekijk de bronnen van je inkomen, zoals salaris, bonussen, of andere inkomsten.',
          en: 'View your income sources, such as salary, bonuses, or other earnings.',
        },
        selector: '[data-onboarding="income-breakdown"]',
        placement: 'left',
      },
      {
        id: 'analytics-click-category',
        title: {
          nl: 'Doorklikken',
          en: 'Click through',
        },
        content: {
          nl: 'Klik op een categorie om direct naar de bijbehorende transacties te gaan.',
          en: 'Click on a category to go directly to the associated transactions.',
        },
        selector: '[data-onboarding="analytics-category-link"]',
        placement: 'left',
      },
    ],
  },

  // ==========================================================================
  // CHAPTER 4: Budgets
  // ==========================================================================
  {
    id: 'budgets',
    menuItem: 'budgets',
    route: '/budgets',
    icon: 'Wallet',
    title: {
      nl: 'Budgetten',
      en: 'Budgets',
    },
    steps: [
      {
        id: 'budgets-overview',
        title: {
          nl: 'Budgetbeheer',
          en: 'Budget management',
        },
        content: {
          nl: 'Stel budgetten in per categorie om je uitgaven onder controle te houden.',
          en: 'Set budgets per category to keep your spending under control.',
        },
        selector: '[data-onboarding="nav-budgets"]',
        placement: 'right',
      },
      {
        id: 'budgets-add',
        title: {
          nl: 'Budget toevoegen',
          en: 'Add budget',
        },
        content: {
          nl: 'Klik hier om een nieuw budget aan te maken. Kies een categorie en stel een maand- of jaarbedrag in.',
          en: 'Click here to create a new budget. Choose a category and set a monthly or yearly amount.',
        },
        selector: '[data-onboarding="add-budget-toggle"]',
        placement: 'right',
      },
      {
        id: 'budgets-smart-proposal',
        title: {
          nl: 'Slimme budgetvoorstellen ✨',
          en: 'Smart budget proposals ✨',
        },
        content: {
          nl: 'Fluxby analyseert je uitgavenpatronen en stelt automatisch budgetten voor op basis van je gemiddelde bestedingen per categorie. Zo hoef je niet zelf te berekenen wat een realistisch budget is!',
          en: 'Fluxby analyzes your spending patterns and automatically suggests budgets based on your average spending per category. No need to calculate what a realistic budget should be!',
        },
        selector: '[data-onboarding="budget-smart-proposals"]',
        placement: 'bottom',
      },
      {
        id: 'budgets-progress',
        title: {
          nl: 'Budget voortgang',
          en: 'Budget progress',
        },
        content: {
          nl: 'De voortgangsbalk toont hoeveel je al hebt besteed van je budget. Groen = op schema, geel = bijna op, rood = overschreden.',
          en: 'The progress bar shows how much you have already spent of your budget. Green = on track, yellow = almost there, red = exceeded.',
        },
        selector: '[data-onboarding="budget-progress-bar"]',
        placement: 'bottom',
      },
      {
        id: 'budgets-search',
        title: {
          nl: 'Budgetten zoeken',
          en: 'Search budgets',
        },
        content: {
          nl: 'Zoek en sorteer je budgetten op naam, uitgaven, percentage of bedrag.',
          en: 'Search and sort your budgets by name, spending, percentage, or amount.',
        },
        selector: '[data-onboarding="budget-search"]',
        placement: 'bottom',
      },
      {
        id: 'budgets-list',
        title: {
          nl: 'Je budgetten',
          en: 'Your budgets',
        },
        content: {
          nl: 'Hier zie je al je budgetten met hun voortgang. Groen = onder budget, Rood = over budget.',
          en: 'Here you see all your budgets with their progress. Green = under budget, Red = over budget.',
        },
        selector: '[data-onboarding="budget-list"]',
        placement: 'top',
      },
      {
        id: 'budgets-edit',
        title: {
          nl: 'Budget bewerken',
          en: 'Edit budget',
        },
        content: {
          nl: 'Klik op het potlood om het budgetbedrag aan te passen.',
          en: 'Click the pencil to adjust the budget amount.',
        },
        selector: '[data-onboarding="budget-edit"]',
        placement: 'left',
      },
      {
        id: 'budgets-view-transactions',
        title: {
          nl: 'Bekijk transacties',
          en: 'View transactions',
        },
        content: {
          nl: 'Klik op het externe link icoon om alle transacties binnen dit budget te bekijken.',
          en: 'Click the external link icon to view all transactions within this budget.',
        },
        selector: '[data-onboarding="budget-view-transactions"]',
        placement: 'left',
      },
    ],
  },

  // ==========================================================================
  // CHAPTER 5: Address Book
  // ==========================================================================
  {
    id: 'addressbook',
    menuItem: 'addressbook',
    route: '/addressbook',
    icon: 'BookUser',
    title: {
      nl: 'Adresboek',
      en: 'Address Book',
    },
    steps: [
      {
        id: 'addressbook-overview',
        title: {
          nl: 'Je contacten',
          en: 'Your contacts',
        },
        content: {
          nl: 'Het adresboek bewaart namen voor IBAN-nummers, zodat je transacties beter herkent.',
          en: 'The address book stores names for IBAN numbers, so you can better recognize your transactions.',
        },
        selector: '[data-onboarding="nav-addressbook"]',
        placement: 'right',
      },
      {
        id: 'addressbook-add',
        title: {
          nl: 'Contact toevoegen',
          en: 'Add contact',
        },
        content: {
          nl: 'Voeg handmatig een contact toe met IBAN, naam en optionele beschrijving.',
          en: 'Manually add a contact with IBAN, name, and optional description.',
        },
        selector: '[data-onboarding="add-contact-toggle"]',
        placement: 'right',
      },
      {
        id: 'addressbook-cleanup-toggle',
        title: {
          nl: 'Opschoon instellingen',
          en: 'Cleanup settings',
        },
        content: {
          nl: 'Klik op dit tandwiel icoon om de opschoon regels en gedeelde IBANs te beheren.',
          en: 'Click this cog icon to manage cleanup rules and shared IBANs.',
        },
        selector: '[data-onboarding="addressbook-settings-toggle"]',
        placement: 'left',
        action: 'click',
      },
      {
        id: 'addressbook-cleanup-rules',
        title: {
          nl: 'Opschoon regels',
          en: 'Cleanup rules',
        },
        content: {
          nl: 'Hier kun je regels instellen om automatisch lelijke tekst uit namen te verwijderen (bijv. "NL12BANK****").',
          en: 'Here you can set rules to automatically remove ugly text from names (e.g., "NL12BANK****").',
        },
        selector: '[data-onboarding="cleanup-rules-card"]',
        placement: 'left',
      },
      {
        id: 'addressbook-shared-ibans',
        title: {
          nl: 'Gedeelde IBANs',
          en: 'Shared IBANs',
        },
        content: {
          nl: 'Sommige IBANs worden door meerdere bedrijven gedeeld (betaalproviders). Hier kun je ze splitsen.',
          en: 'Some IBANs are shared by multiple companies (payment providers). Here you can split them.',
        },
        selector: '[data-onboarding="shared-ibans-card"]',
        placement: 'left',
      },
      {
        id: 'addressbook-suggested-contacts',
        title: {
          nl: 'Voorgestelde contacten',
          en: 'Suggested contacts',
        },
        content: {
          nl: 'Hier vind je tegenrekeningen uit je transacties die nog niet in je adresboek staan. Voeg ze toe om uitgaven per contact bij te houden.',
          en: 'Here you find counterparties from your transactions that are not yet in your address book. Add them to track spending per contact.',
        },
        selector: '[data-onboarding="suggested-contacts-card"]',
        placement: 'left',
      },
      {
        id: 'addressbook-search',
        title: {
          nl: 'Zoeken en sorteren',
          en: 'Search and sort',
        },
        content: {
          nl: 'Zoek op naam of IBAN en sorteer op verschillende criteria.',
          en: 'Search by name or IBAN and sort by various criteria.',
        },
        selector: '[data-onboarding="addressbook-search"]',
        placement: 'bottom',
      },
      {
        id: 'addressbook-list',
        title: {
          nl: 'Contactenlijst',
          en: 'Contact list',
        },
        content: {
          nl: 'Al je opgeslagen contacten met hun transactiehistorie en totale bedragen.',
          en: 'All your saved contacts with their transaction history and total amounts.',
        },
        selector: '[data-onboarding="contact-list"]',
        placement: 'top',
      },
      {
        id: 'addressbook-contact-row',
        title: {
          nl: 'Contact details',
          en: 'Contact details',
        },
        content: {
          nl: 'Elk contact toont aantal transacties, totaal inkomen en uitgaven. Klik voor meer opties.',
          en: 'Each contact shows number of transactions, total income and expenses. Click for more options.',
        },
        selector: '[data-onboarding="addressbook-contact"]',
        placement: 'right',
      },
      {
        id: 'addressbook-merged-row',
        title: {
          nl: 'Samengevoegd contact',
          en: 'Merged contact',
        },
        content: {
          nl: 'Dit contact heeft meerdere IBAN-nummers. Paarse badge = samengevoegd. Je kunt meerdere rekeningen van dezelfde partij bundelen.',
          en: 'This contact has multiple IBAN numbers. Purple badge = merged. You can bundle multiple accounts from the same party.',
        },
        selector: '[data-onboarding="addressbook-merged-contact"]',
        placement: 'right',
      },
      {
        id: 'addressbook-view-transactions',
        title: {
          nl: 'Bekijk transacties',
          en: 'View transactions',
        },
        content: {
          nl: 'Klik op een contact om alle transacties met dit contact te bekijken.',
          en: 'Click on a contact to view all transactions with this contact.',
        },
        selector: '[data-onboarding="addressbook-contact"]',
        placement: 'left',
      },
    ],
  },

  // ==========================================================================
  // CHAPTER 6: Categories
  // ==========================================================================
  {
    id: 'categories',
    menuItem: 'categories',
    route: '/categories',
    icon: 'Tags',
    title: {
      nl: 'Categorieën',
      en: 'Categories',
    },
    steps: [
      {
        id: 'categories-overview',
        title: {
          nl: 'Organiseer je uitgaven',
          en: 'Organize your expenses',
        },
        content: {
          nl: 'Categorieën helpen je om je transacties te groeperen en beter inzicht te krijgen in je uitgaven.',
          en: 'Categories help you group your transactions and get better insight into your spending.',
        },
        selector: '[data-onboarding="nav-categories"]',
        placement: 'right',
      },
      {
        id: 'categories-seed',
        title: {
          nl: 'Standaard categorieën',
          en: 'Default categories',
        },
        content: {
          nl: 'Begin snel met voorgedefinieerde categorieën zoals Wonen, Vervoer en Boodschappen. Deze knop verschijnt alleen als je nog geen categorieën hebt.',
          en: 'Start quickly with predefined categories like Housing, Transport, and Groceries. This button only appears when you have no categories yet.',
        },
        selector: '[data-onboarding="seed-categories"]',
        placement: 'left',
        showPlaceholder: true,
      },
      {
        id: 'categories-add',
        title: {
          nl: 'Categorie toevoegen',
          en: 'Add category',
        },
        content: {
          nl: 'Klik hier om een nieuwe hoofdcategorie aan te maken met een naam, icoon en kleur.',
          en: 'Click here to create a new parent category with a name, icon, and color.',
        },
        selector: '[data-onboarding="add-category-toggle"]',
        placement: 'bottom',
      },
      {
        id: 'categories-apply-rules',
        title: {
          nl: 'Regels toepassen',
          en: 'Apply rules',
        },
        content: {
          nl: 'Pas alle categorisatieregels toe op bestaande transacties om ze automatisch te categoriseren.',
          en: 'Apply all categorization rules to existing transactions to automatically categorize them.',
        },
        selector: '[data-onboarding="apply-rules"]',
        placement: 'bottom',
      },
      {
        id: 'categories-search',
        title: {
          nl: 'Zoeken en sorteren',
          en: 'Search and sort',
        },
        content: {
          nl: 'Zoek categorieën op naam en sorteer op naam, aantal transacties of totaalbedrag.',
          en: 'Search categories by name and sort by name, number of transactions, or total amount.',
        },
        selector: '[data-onboarding="category-search"]',
        placement: 'bottom',
      },
      {
        id: 'categories-list',
        title: {
          nl: 'Je categorieën',
          en: 'Your categories',
        },
        content: {
          nl: 'Bekijk al je hoofdcategorieën. Klik op een categorie om de subcategorieën te zien.',
          en: 'View all your parent categories. Click on a category to see its subcategories.',
        },
        selector: '[data-onboarding="category-list"]',
        placement: 'top',
      },
      {
        id: 'categories-subcategory',
        title: {
          nl: 'Subcategorieën',
          en: 'Subcategories',
        },
        content: {
          nl: 'Elke hoofdcategorie bevat subcategorieën voor gedetailleerde organisatie. Bijvoorbeeld "Boodschappen" onder "Voeding".',
          en: 'Each parent category contains subcategories for detailed organization. For example "Groceries" under "Food".',
        },
        selector: '[data-onboarding="category-subcategory"]',
        placement: 'right',
      },
      {
        id: 'categories-rules',
        title: {
          nl: 'Auto-categorisatie regels',
          en: 'Auto-categorization rules',
        },
        content: {
          nl: 'Voeg zoekwoorden toe die automatisch transacties aan deze subcategorie koppelen. Bijvoorbeeld "Albert Heijn" voor boodschappen.',
          en: 'Add keywords that automatically assign transactions to this subcategory. For example "Albert Heijn" for groceries.',
        },
        selector: '[data-onboarding="category-rules"]',
        placement: 'left',
      },
      {
        id: 'categories-add-subcategory',
        title: {
          nl: 'Subcategorie toevoegen',
          en: 'Add subcategory',
        },
        content: {
          nl: 'Klik hier om een nieuwe subcategorie toe te voegen aan een hoofdcategorie.',
          en: 'Click here to add a new subcategory to a parent category.',
        },
        selector: '[data-onboarding="category-subcategories"]',
        placement: 'right',
      },
    ],
  },

  // ==========================================================================
  // CHAPTER 7: Import
  // ==========================================================================
  {
    id: 'import',
    menuItem: 'import',
    route: '/import',
    icon: 'Upload',
    title: {
      nl: 'Importeren',
      en: 'Import',
    },
    steps: [
      {
        id: 'import-overview',
        title: {
          nl: 'Data importeren',
          en: 'Import data',
        },
        content: {
          nl: 'Upload CSV-bestanden van je bank om je transacties in Fluxby te laden.',
          en: 'Upload CSV files from your bank to load your transactions into Fluxby.',
        },
        selector: '[data-onboarding="nav-import"]',
        placement: 'right',
      },
      {
        id: 'import-dropzone',
        title: {
          nl: 'Upload zone',
          en: 'Upload zone',
        },
        content: {
          nl: 'Sleep een CSV-bestand hierheen of klik om te bladeren. Standaard formaten worden automatisch herkend.',
          en: 'Drag a CSV file here or click to browse. Standard formats are automatically recognized.',
        },
        selector: '[data-onboarding="import-dropzone"]',
        placement: 'bottom',
      },
      {
        id: 'import-column-mapping',
        title: {
          nl: 'Kolommen koppelen',
          en: 'Map columns',
        },
        content: {
          nl: 'Voor afwijkende bestanden kun je handmatig de kolommen koppelen aan de juiste velden.',
          en: 'For non-standard files you can manually map columns to the correct fields.',
        },
        selector: '[data-onboarding="import-mapping"]',
        placement: 'center',
        showPlaceholder: true,
      },
      {
        id: 'import-history',
        title: {
          nl: 'Import geschiedenis',
          en: 'Import history',
        },
        content: {
          nl: 'Bekijk alle eerdere imports met datum, bestandsnaam en aantal transacties.',
          en: 'View all previous imports with date, filename, and number of transactions.',
        },
        selector: '[data-onboarding="import-history"]',
        placement: 'top',
      },
      {
        id: 'import-duplicate-handling',
        title: {
          nl: 'Dubbele detectie',
          en: 'Duplicate detection',
        },
        content: {
          nl: 'Fluxby herkent automatisch dubbele transacties en slaat deze over bij het importeren.',
          en: 'Fluxby automatically detects duplicate transactions and skips them during import.',
        },
        placement: 'center',
      },
    ],
  },

  // ==========================================================================
  // CHAPTER 8: Settings
  // ==========================================================================
  {
    id: 'settings',
    menuItem: 'settings',
    route: '/settings',
    icon: 'Settings',
    title: {
      nl: 'Instellingen',
      en: 'Settings',
    },
    steps: [
      {
        id: 'settings-nav',
        title: {
          nl: 'Instellingen',
          en: 'Settings',
        },
        content: {
          nl: 'In de instellingen beheer je je rekeningen, profielen en app-voorkeuren.',
          en: 'In settings you manage your accounts, profiles, and app preferences.',
        },
        selector: '[data-onboarding="nav-settings"]',
        placement: 'right',
      },
      {
        id: 'settings-tabs',
        title: {
          nl: 'Instellingen tabs',
          en: 'Settings tabs',
        },
        content: {
          nl: 'Navigeer tussen actief profiel, profielbeheer en app-instellingen via deze tabs.',
          en: 'Navigate between active profile, profile management, and app settings via these tabs.',
        },
        selector: '[data-onboarding="settings-tabs"]',
        placement: 'bottom',
      },
      {
        id: 'settings-active-profile-tab',
        title: {
          nl: 'Actief profiel tab',
          en: 'Active profile tab',
        },
        content: {
          nl: 'Klik op deze tab om je actieve profiel instellingen te bekijken, zoals rekeningen en betaalproviders.',
          en: 'Click this tab to view your active profile settings, such as accounts and payment processors.',
        },
        selector: '[data-onboarding="settings-profile-tab"]',
        placement: 'bottom',
        action: 'click',
      },
      {
        id: 'settings-accounts',
        title: {
          nl: 'Rekeningen beheren',
          en: 'Manage accounts',
        },
        content: {
          nl: 'Bekijk en bewerk je gekoppelde bankrekeningen. Wijzig namen of verwijder rekeningen.',
          en: 'View and edit your linked bank accounts. Change names or remove accounts.',
        },
        selector: '[data-onboarding="settings-accounts"]',
        placement: 'right',
      },
      {
        id: 'settings-payment-processors',
        title: {
          nl: 'Betaalproviders',
          en: 'Payment processors',
        },
        content: {
          nl: 'Beheer betaalproviders zoals PayPal, Tikkie, etc. voor betere transactieherkenning.',
          en: 'Manage payment processors like PayPal, Tikkie, etc. for better transaction recognition.',
        },
        selector: '[data-onboarding="settings-payment-processors"]',
        placement: 'right',
      },
      {
        id: 'settings-profiles-tab',
        title: {
          nl: 'Profielen tab',
          en: 'Profiles tab',
        },
        content: {
          nl: 'Klik op deze tab om je profielen te beheren.',
          en: 'Click this tab to manage your profiles.',
        },
        selector: '[data-onboarding="settings-manage-tab"]',
        placement: 'bottom',
        action: 'click',
      },
      {
        id: 'settings-profiles',
        title: {
          nl: 'Profielen',
          en: 'Profiles',
        },
        content: {
          nl: 'Maak meerdere profielen voor gescheiden financiële administraties (bijv. persoonlijk en zakelijk).',
          en: 'Create multiple profiles for separate financial administrations (e.g., personal and business).',
        },
        selector: '[data-onboarding="settings-manage-content"]',
        placement: 'right',
      },
      {
        id: 'settings-app-tab',
        title: {
          nl: 'App instellingen tab',
          en: 'App settings tab',
        },
        content: {
          nl: 'Klik op deze tab om de app-brede instellingen te bekijken.',
          en: 'Click this tab to view app-wide settings.',
        },
        selector: '[data-onboarding="settings-app-tab"]',
        placement: 'bottom',
        action: 'click',
      },
      {
        id: 'settings-app',
        title: {
          nl: 'App voorkeuren',
          en: 'App preferences',
        },
        content: {
          nl: 'Wijzig taal, thema en andere app-brede instellingen.',
          en: 'Change language, theme, and other app-wide settings.',
        },
        selector: '[data-onboarding="settings-app-content"]',
        placement: 'right',
      },
      {
        id: 'settings-data',
        title: {
          nl: 'Data beheer',
          en: 'Data management',
        },
        content: {
          nl: 'Exporteer je data of wis alle transacties om opnieuw te beginnen.',
          en: 'Export your data or clear all transactions to start fresh.',
        },
        selector: '[data-onboarding="settings-data-management"]',
        placement: 'right',
      },
    ],
  },

  // ==========================================================================
  // CHAPTER 10: Help
  // ==========================================================================
  {
    id: 'help',
    menuItem: 'help',
    route: '/help',
    icon: 'HelpCircle',
    title: {
      nl: 'Help',
      en: 'Help',
    },
    steps: [
      {
        id: 'help-nav',
        title: {
          nl: 'Help & ondersteuning',
          en: 'Help & support',
        },
        content: {
          nl: 'Vind hier antwoorden op veelgestelde vragen en leer meer over alle functies van Fluxby.',
          en: 'Find answers to frequently asked questions and learn more about all Fluxby features.',
        },
        selector: '[data-onboarding="nav-help"]',
        placement: 'right',
      },
      {
        id: 'help-features',
        title: {
          nl: 'Functies overzicht',
          en: 'Features overview',
        },
        content: {
          nl: 'Een compleet overzicht van alle functies die Fluxby te bieden heeft.',
          en: 'A complete overview of all the features Fluxby has to offer.',
        },
        selector: '[data-onboarding="help-features"]',
        placement: 'right',
      },
      {
        id: 'help-quickstart',
        title: {
          nl: 'Snelstart gids',
          en: 'Quick start guide',
        },
        content: {
          nl: 'Stap-voor-stap instructies om snel aan de slag te gaan met Fluxby.',
          en: 'Step-by-step instructions to quickly get started with Fluxby.',
        },
        selector: '[data-onboarding="help-quickstart"]',
        placement: 'right',
      },
      {
        id: 'help-faq',
        title: {
          nl: 'Veelgestelde vragen',
          en: 'FAQ',
        },
        content: {
          nl: 'Antwoorden op de meest gestelde vragen over Fluxby.',
          en: 'Answers to the most frequently asked questions about Fluxby.',
        },
        selector: '[data-onboarding="help-faq"]',
        placement: 'right',
      },
      {
        id: 'help-external-links',
        title: {
          nl: 'Meer informatie',
          en: 'More information',
        },
        content: {
          nl: 'Bezoek het Help Center voor uitgebreide handleidingen of de Developer Docs voor technische documentatie.',
          en: 'Visit the Help Center for comprehensive guides or the Developer Docs for technical documentation.',
        },
        selector: '[data-onboarding="help-external-links"]',
        placement: 'top',
      },
    ],
  },

  // ==========================================================================
  // CHAPTER 11: Completion
  // ==========================================================================
  {
    id: 'completion',
    menuItem: 'completion',
    route: '/',
    icon: 'CheckCircle',
    title: {
      nl: 'Klaar!',
      en: 'Done!',
    },
    steps: [
      {
        id: 'completion-summary',
        title: {
          nl: 'Je bent klaar! 🎉',
          en: "You're all set! 🎉",
        },
        content: {
          nl: 'Je kent nu alle functies van Fluxby. Begin met het importeren van je transacties om je financiële reis te starten!',
          en: 'You now know all the features of Fluxby. Start by importing your transactions to begin your financial journey!',
        },
        placement: 'center',
      },
      {
        id: 'completion-next-steps',
        title: {
          nl: 'Volgende stappen',
          en: 'Next steps',
        },
        content: {
          nl: '1. Importeer je banktransacties\n2. Organiseer je categorieën\n3. Stel budgetten in\n4. Bekijk je analyse',
          en: '1. Import your bank transactions\n2. Organize your categories\n3. Set up budgets\n4. Review your analytics',
        },
        placement: 'center',
      },
      {
        id: 'completion-restart',
        title: {
          nl: 'Opnieuw bekijken',
          en: 'Review again',
        },
        content: {
          nl: 'Je kunt deze rondleiding altijd opnieuw starten via Instellingen of door op Fluxby te klikken.',
          en: 'You can always restart this tour via Settings or by clicking on Fluxby.',
        },
        placement: 'center',
      },
    ],
  },
];

// Helper function to get total step count
export const getTotalSteps = (): number => {
  return onboardingChapters.reduce(
    (total, chapter) => total + chapter.steps.length,
    0
  );
};

// Helper to get a flat list of all steps with their chapter info
export const getAllSteps = () => {
  const steps: Array<{
    step: OnboardingChapter['steps'][0];
    chapterIndex: number;
    stepIndex: number;
    chapterId: string;
  }> = [];

  onboardingChapters.forEach((chapter, chapterIndex) => {
    chapter.steps.forEach((step, stepIndex) => {
      steps.push({
        step,
        chapterIndex,
        stepIndex,
        chapterId: chapter.id,
      });
    });
  });

  return steps;
};
