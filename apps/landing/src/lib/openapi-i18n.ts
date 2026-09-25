import type { Language } from './i18n';

const englishFromDutch: Record<string, string> = {
  'Aangepaste label/merchant naam': 'Custom label/merchant name',
  'Aantal bijgewerkte transacties': 'Number of transactions updated',
  'Aantal entries bijgewerkt': 'Number of entries updated',
  'Aantal gedetecteerde en verwerkte gedeelde IBANs':
    'Number of shared IBANs detected and processed',
  'Aantal gedetecteerde overboekingen': 'Number of transfers detected',
  'Aantal samengevoegde duplicaten': 'Number of duplicates merged',
  'Aantal transacties bijgewerkt': 'Number of transactions updated',
  'Aantal transacties gemarkeerd als overboeking':
    'Number of transactions marked as transfers',
  'Aantal transacties waarvan merchant_name is gereset':
    'Number of transactions whose merchant_name was reset',
  'Adresboek entry aangemaakt of IBAN toegevoegd aan bestaand contact':
    'Address book entry created or IBAN added to an existing contact',
  'Adresboek entry details': 'Address book entry details',
  'Adresboek entry details met statistieken':
    'Address book entry details with statistics',
  'Adresboek entry ID om transactie aan te koppelen':
    'Address book entry ID to link to the transaction',
  'Alle budgetten verwijderd': 'All budgets deleted',
  'Alle categorieën verwijderd': 'All categories deleted',
  'Alle transacties verwijderd': 'All transactions deleted',
  'Als een contact met dezelfde naam al bestaat, wordt de nieuwe IBAN toegevoegd aan het bestaande contact. Dit voorkomt duplicaten. Als de IBAN een gedeelde IBAN is (payment processor), wordt de entry toegevoegd aan shared_iban_merchants in plaats van address_book.\n':
    'If a contact with the same name already exists, the new IBAN is added to that contact to prevent duplicates. If the IBAN is shared by a payment processor, the entry is added to shared_iban_merchants instead of address_book.\n',
  'Array van jaren waarvoor data beschikbaar is':
    'Array of years for which data is available',
  'Array of transactie IDs om te categoriseren':
    'Array of transaction IDs to categorize',
  'Array van transactie IDs om te categoriseren':
    'Array of transaction IDs to categorize',
  'Automatisch samenvoegen van contacten met dezelfde naam':
    'Automatically merge contacts with the same name',
  "Bank type (momenteel alleen 'ing' ondersteund)":
    "Bank type (currently only 'ing' is supported)",
  'Bestaande rekening bijgewerkt': 'Existing account updated',
  'Betaalmethode (pin, ideal, overschrijving, incasso, geldautomaat)':
    'Payment method (pin, iDEAL, transfer, direct debit, ATM)',
  'Betaalplatform naam (bijv. iDEAL, Adyen, Mollie)':
    'Payment provider name (e.g. iDEAL, Adyen, Mollie)',
  'Budget aangemaakt': 'Budget created',
  'Bulk categoriseer meerdere transacties':
    'Bulk categorize multiple transactions',
  'Categorie aangemaakt': 'Category created',
  'Categorie bijgewerkt': 'Category updated',
  'Categorie details': 'Category details',
  'Categorie niet gevonden': 'Category not found',
  'Categorie verdeling met percentages': 'Category breakdown with percentages',
  'Categoriseer alle transacties van dezelfde tegenpartij':
    'Categorize all transactions from the same counterparty',
  'Contacten samengevoegd': 'Contacts merged',
  'Dagelijkse uitgaven inclusief dagen zonder transacties':
    'Daily expenses, including days without transactions',
  'Dashboard statistieken inclusief totalen, maanddata en categorie verdeling':
    'Dashboard statistics including totals, monthly data, and category breakdown',
  'Data geïmporteerd': 'Data imported',
  'De originele transaction names die onder deze naam vallen':
    'Original transaction names grouped under this name',
  'Detecteer en markeer interne overboekingen':
    'Detect and mark internal transfers',
  'Detecteer en verwerk gedeelde IBANs': 'Detect and process shared IBANs',
  'Detecteer payment processor voor een transactie':
    'Detect the payment processor for a transaction',
  'Eind datum (YYYY-MM-DD)': 'End date (YYYY-MM-DD)',
  'Eind datum in formaat YYYY-MM-DD (optioneel)':
    'End date in YYYY-MM-DD format (optional)',
  'Einddatum (YYYY-MM-DD)': 'End date (YYYY-MM-DD)',
  'Entry bijgewerkt': 'Entry updated',
  'Entry niet gevonden': 'Entry not found',
  'Entry toegevoegd en transacties bijgewerkt':
    'Entry added and transactions updated',
  'Entry verwijderd': 'Entry deleted',
  'Exporteer alle data als JSON': 'Export all data as JSON',
  'Filter op categorie ID': 'Filter by category ID',
  'Filter op rekening ID': 'Filter by account ID',
  'Filter op tegenrekening IBAN(s), comma-separated':
    'Filter by counterparty IBAN(s), comma-separated',
  'Filter op type': 'Filter by type',
  'Geen bestand of ongeldige bank': 'No file or unsupported bank',
  'Geen velden om te updaten of ongeldig type':
    'No fields to update or invalid type',
  'Geldig bedrag is verplicht': 'A valid amount is required',
  Gebruikersprofiel: 'User profile',
  'Haal adresboek entry op via IBAN': 'Get address book entry by IBAN',
  'Haal alle adresboek entries op': 'Get all address book entries',
  'Haal alle auto-categorisatie regels op': 'Get all auto-categorization rules',
  'Haal alle bekende payment processors op': 'Get all known payment processors',
  'Haal alle budgetten op met uitgaven': 'Get all budgets with spending',
  'Haal alle categorieën op': 'Get all categories',
  'Haal alle IBANs op voor een contact': 'Get all IBANs for a contact',
  'Haal alle merchant mappings op voor gedeelde IBANs':
    'Get all merchant mappings for shared IBANs',
  'Haal alle naam opschoon regels op': 'Get all name cleanup rules',
  'Haal alle payment processor regels op': 'Get all payment processor rules',
  'Haal alle rekeningen op': 'Get all accounts',
  'Haal alle transacties op met filters': 'Get all transactions with filters',
  'Haal beschikbare jaren op uit transacties':
    'Get the years available in transactions',
  'Haal categorie verdeling op': 'Get category breakdown',
  'Haal dagelijkse uitgaven op voor timeline':
    'Get daily expenses for the timeline',
  'Haal dashboard statistieken op': 'Get dashboard statistics',
  'Haal een specifieke adresboek entry op': 'Get a specific address book entry',
  'Haal een specifieke categorie op': 'Get a specific category',
  'Haal een specifieke rekening op': 'Get a specific account',
  'Haal een specifieke transactie op': 'Get a specific transaction',
  'Haal gedeelde IBANs op (payment processors met meerdere merchants)':
    'Get shared IBANs (payment processors with multiple merchants)',
  'Haal het gebruikersprofiel op': 'Get the user profile',
  'Haal maandelijkse data op voor grafieken': 'Get monthly chart data',
  'Haal minimum en maximum datum op uit transacties':
    'Get the minimum and maximum transaction dates',
  'Haal saldo prognose op voor einde periode':
    'Get the balance forecast for the end of the period',
  'Haal top accounts op basis van transactiewaarde':
    'Get top accounts by transaction value',
  'Hernoem alle transacties met dezelfde tegenpartij (opposing IBAN of opposing name) naar een nieuwe merchant naam':
    'Rename all transactions with the same counterparty (opposing IBAN or name) to a new merchant name',
  'Hernoem merchant/tegenpartij voor gerelateerde transacties':
    'Rename the merchant/counterparty for related transactions',
  'Het bijgewerkte profiel': 'The updated profile',
  'Het huidige profiel': 'The current profile',
  'IBAN en naam zijn verplicht': 'IBAN and name are required',
  'IBAN gemarkeerd als gedeeld': 'IBAN marked as shared',
  'IBAN toegevoegd aan contact': 'IBAN added to contact',
  'IBAN verwijderd uit gedeelde lijst': 'IBAN removed from shared list',
  'IBAN verwijderd van contact': 'IBAN removed from contact',
  'ID van de categorie om toe te passen': 'Category ID to apply',
  'ID van de transactie om de tegenpartij van te gebruiken':
    'Transaction ID to use as the counterparty source',
  'IDs van te mergen contacten (eerste wordt primair)':
    'IDs of contacts to merge (the first becomes the primary contact)',
  'Import succesvol': 'Import successful',
  'Importeer volledige dataset (maakt bestaande data leeg)':
    'Import the full dataset (clears existing data)',
  'Inclusief transactie telling per categorie':
    'Include a transaction count for each category',
  'Komma-gescheiden lijst van categorie IDs':
    'Comma-separated list of category IDs',
  'Krijg voorgestelde budgetten voor categorieën zonder budget':
    'Get suggested budgets for categories without a budget',
  'Lijst met adresboek entries inclusief statistieken':
    'List of address book entries with statistics',
  'Lijst met budgetten inclusief besteed bedrag en percentage':
    'List of budgets with amount spent and percentage',
  'Lijst met categorieën': 'List of categories',
  'Lijst met gedeelde IBANs en hun merchants':
    'List of shared IBANs and their merchants',
  'Lijst met IBANs voor dit contact': 'List of IBANs for this contact',
  'Lijst met opschoon regels': 'List of cleanup rules',
  'Lijst met payment processor regels': 'List of payment processor rules',
  'Lijst met payment processors': 'List of payment processors',
  'Lijst met rekeningen inclusief saldo': 'List of accounts with balances',
  'Lijst met transacties': 'List of transactions',
  'Lijst van categorisatie regels': 'List of categorization rules',
  'Lijst van merchant mappings': 'List of merchant mappings',
  'Lijst van merchant mappings voor de opgegeven IBAN':
    'List of merchant mappings for the specified IBAN',
  'Maak een nieuw budget aan': 'Create a new budget',
  'Maak een nieuwe adresboek entry aan of voeg IBAN toe aan bestaand contact':
    'Create a new address book entry or add an IBAN to an existing contact',
  'Maak een nieuwe auto-categorisatie regel':
    'Create a new auto-categorization rule',
  'Maak een nieuwe categorie aan': 'Create a new category',
  'Maak een nieuwe rekening aan': 'Create a new account',
  'Maand in formaat YYYY-MM (standaard huidige maand)':
    'Month in YYYY-MM format (defaults to the current month)',
  'Maandelijkse inkomsten en uitgaven': 'Monthly income and expenses',
  'Markeer een IBAN als gedeeld (payment processor)':
    'Mark an IBAN as shared (payment processor)',
  'Maximum bedrag': 'Maximum amount',
  'Merchant mapping verwijderd': 'Merchant mapping deleted',
  'Merchants toegevoegd': 'Merchants added',
  'Merchant names gereset': 'Merchant names reset',
  'Minimum bedrag': 'Minimum amount',
  'Naam is verplicht': 'Name is required',
  'Naam van de tegenpartij': 'Counterparty name',
  'Nieuwe categorie ID': 'New category ID',
  'Nieuwe merchant naam': 'New merchant name',
  'Object met minDate en maxDate': 'Object with minDate and maxDate',
  Notities: 'Notes',
  'Ongeldige parameters': 'Invalid parameters',
  'Ongeldige transactie IDs': 'Invalid transaction IDs',
  'Optionele nieuwe naam voor het samengevoegde contact':
    'Optional new name for the merged contact',
  'Originele naam uit transactie (voor gedeelde IBANs)':
    'Original transaction name (for shared IBANs)',
  'Pas dezelfde categorie toe op meerdere transacties tegelijk':
    'Apply the same category to multiple transactions at once',
  'Pas naam opschoon regels toe op alle transacties':
    'Apply name cleanup rules to all transactions',
  'Pas opschoon regels toe op alle address book entries':
    'Apply cleanup rules to all address book entries',
  'Pas regels toe op ALLE transacties (inclusief gecategoriseerde)':
    'Apply rules to ALL transactions (including categorized ones)',
  'Pas regels toe op ongecategoriseerde transacties':
    'Apply rules to uncategorized transactions',
  'Past de categorie toe op alle transacties met dezelfde tegenrekening naam':
    'Apply the category to all transactions with the same counterparty name',
  'Payment processor regel bijgewerkt': 'Payment processor rule updated',
  'Payment processor regel toegevoegd': 'Payment processor rule added',
  'Payment processor regel verwijderd': 'Payment processor rule deleted',
  'Payment processor toegevoegd': 'Payment processor added',
  'Payment processor verwijderd': 'Payment processor deleted',
  'Prognose met verwacht inkomen, uitgaven en eindsaldo':
    'Forecast with expected income, expenses, and ending balance',
  'Regel aangemaakt': 'Rule created',
  'Regel bestaat al': 'Rule already exists',
  'Regel toegevoegd': 'Rule added',
  'Regel verwijderd': 'Rule deleted',
  'Rekening aangemaakt': 'Account created',
  'Rekening details': 'Account details',
  'Rekening niet gevonden': 'Account not found',
  'Rekening succesvol bijgewerkt': 'Account updated successfully',
  'Reset alle merchant_name velden naar NULL':
    'Reset all merchant_name fields to NULL',
  'Scan alle transacties en markeer transacties als interne overboeking wanneer de tegenrekening (IBAN) overeenkomt met een eigen rekening, of wanneer de naam overeenkomt met een spaarrekening.\n':
    "Scan all transactions and mark one as an internal transfer when its counterparty IBAN matches one of the user's accounts, or when its name matches a savings account.\n",
  'Split uitgevoerd met details': 'Split completed with details',
  'Splits een contact met meerdere IBANs in losse contacten':
    'Split a contact with multiple IBANs into separate contacts',
  'Splits een contact op basis van opgegeven IBAN->naam mappings. Als een naam al bestaat in het adresboek, wordt er een warning teruggegeven en de split voor dat IBAN wordt niet uitgevoerd.\n':
    'Split a contact using the provided IBAN-to-name mappings. If a name already exists in the address book, a warning is returned and that IBAN is not split.\n',
  'Start datum (YYYY-MM-DD)': 'Start date (YYYY-MM-DD)',
  'Start datum in formaat YYYY-MM-DD (optioneel, neemt voorrang over month)':
    'Start date in YYYY-MM-DD format (optional; takes precedence over month)',
  'Startdatum (YYYY-MM-DD)': 'Start date (YYYY-MM-DD)',
  'Top accounts met uitgaven/inkomsten': 'Top accounts by expenses/income',
  'Transactie bijgewerkt': 'Transaction updated',
  'Transactie details': 'Transaction details',
  'Transactie heeft geen tegenpartij': 'Transaction has no counterparty',
  'Transactie ID': 'Transaction ID',
  'Transactie niet gevonden': 'Transaction not found',
  "Transactie type (income, expense, transfer). Gebruik 'transfer' voor interne overboekingen tussen eigen rekeningen.":
    "Transaction type (income, expense, transfer). Use 'transfer' for internal transfers between the user's own accounts.",
  'Transactie verwijderd': 'Transaction deleted',
  'Transacties hernoemd': 'Transactions renamed',
  'Transacties succesvol gecategoriseerd':
    'Transactions categorized successfully',
  'Type transactie': 'Transaction type',
  'Update een adresboek entry': 'Update an address book entry',
  'Update een categorie': 'Update a category',
  'Update een payment processor regel': 'Update a payment processor rule',
  'Update een transactie (type, categorie, notities, betaalmethode, adresboek, betaalplatform)':
    'Update a transaction (type, category, notes, payment method, address book, payment provider)',
  'Update opposing_account_name en merchant_name met opgeschoonde namen':
    'Update opposing_account_name and merchant_name with cleaned names',
  'Upload en importeer een CSV bestand': 'Upload and import a CSV file',
  'CSV bestand (max 10MB)': 'CSV file (max 10 MB)',
  Validatiefout: 'Validation error',
  'Verwijder alle budgetten': 'Delete all budgets',
  'Verwijder alle categorieën': 'Delete all categories',
  'Verwijder alle transacties': 'Delete all transactions',
  'Verwijder een adresboek entry': 'Delete an address book entry',
  'Verwijder een auto-categorisatie regel':
    'Delete an auto-categorization rule',
  'Verwijder een IBAN uit de gedeelde lijst':
    'Remove an IBAN from the shared list',
  'Verwijder een IBAN van een contact': 'Remove an IBAN from a contact',
  'Verwijder een merchant mapping': 'Delete a merchant mapping',
  'Verwijder een opschoon regel': 'Delete a cleanup rule',
  'Verwijder een payment processor': 'Delete a payment processor',
  'Verwijder een payment processor regel': 'Delete a payment processor rule',
  'Verwijder een transactie': 'Delete a transaction',
  'Vindt alle contacten met dezelfde naam (case-insensitive) en voegt ze samen. De eerste entry wordt de primaire, alle IBANs worden samengevoegd.\n':
    'Finds all contacts with the same name (case-insensitive) and merges them. The first entry becomes the primary contact, and all IBANs are merged.\n',
  'Vindt IBANs met meerdere namen, verwijdert ze uit het adresboek, en voegt ze toe aan de shared_ibans tabel\n':
    'Finds IBANs associated with multiple names, removes them from the address book, and adds them to the shared_ibans table.\n',
  'Voeg een entry toe aan adresboek vanuit gedeelde IBAN en update transacties':
    'Add an address book entry from a shared IBAN and update transactions',
  'Voeg een IBAN toe aan een bestaand contact':
    'Add an IBAN to an existing contact',
  'Voeg een nieuwe opschoon regel toe': 'Add a new cleanup rule',
  'Voeg een payment processor regel toe': 'Add a payment processor rule',
  'Voeg een payment processor toe': 'Add a payment processor',
  'Voeg merchants toe van een gedeelde IBAN': 'Add merchants for a shared IBAN',
  'Voeg twee of meer contacten samen tot één':
    'Merge two or more contacts into one',
  'Voegt een entry toe aan het adresboek, update merchant_name in transacties voor de opgegeven originele namen, en verwijdert de IBAN uit shared_ibans als alle namen zijn verwerkt.\n':
    'Adds an entry to the address book, updates merchant_name in transactions for the specified original names, and removes the IBAN from shared_ibans once all names have been processed.\n',
  'Voegt meerdere contacten samen. De eerste contact ID wordt de primaire en alle IBANs van de andere contacten worden hieraan toegevoegd. De andere contacten worden verwijderd.\n':
    "Merges multiple contacts. The first contact ID becomes the primary contact, and the other contacts' IBANs are added to it. The other contacts are deleted.\n",
  'Volledige dataset': 'Full dataset',
  'Voorgestelde budgetten gebaseerd op historische transacties':
    'Suggested budgets based on historical transactions',
  'Weergavenaam voor het contact': 'Display name for the contact',
  'Werk een rekening bij': 'Update an account',
  'Werk het gebruikersprofiel bij': 'Update the user profile',
  'Zet alle merchant_name velden terug naar NULL zodat transacties weer hun originele beschrijving (opposing_account_name) tonen. Dit is een bulk operatie die niet ongedaan kan worden gemaakt.\n':
    'Set all merchant_name fields to NULL so transactions show their original description (opposing_account_name) again. This bulk operation cannot be undone.\n',
  'Zoek merchant mappings voor een specifieke IBAN':
    'Search merchant mappings for a specific IBAN',
  'Zoekterm voor omschrijving/merchant': 'Search term for description/merchant',
};

const dutchFromEnglish: Record<string, string> = {
  'API for managing financial transactions, categories, budgets, and analytics. This API is intended for developers building custom interfaces.':
    'API voor het beheren van financiële transacties, categorieën, budgetten en analyses. Deze API is bedoeld voor ontwikkelaars die eigen interfaces bouwen.',
  'Access denied': 'Geen toegang',
  'Access denied - account belongs to different profile':
    'Geen toegang - de rekening hoort bij een ander profiel',
  'Access denied - resource belongs to different profile':
    'Geen toegang - de gegevens horen bij een ander profiel',
  'Account ID': 'Rekening-ID',
  'Account ID to import transactions to':
    'Rekening-ID waarnaar transacties worden geïmporteerd',
  'Account deleted': 'Rekening verwijderd',
  'Account not found': 'Rekening niet gevonden',
  'Account order updated successfully': 'Rekeningvolgorde bijgewerkt',
  'Accounts deleted': 'Rekeningen verwijderd',
  'Array of account IDs in the desired display order':
    'Lijst met rekening-ID’s in de gewenste weergavevolgorde',
  'Array of parent categories with subcategories':
    'Lijst met hoofdcategorieën en subcategorieën',
  'Auto-categorization rules': 'Regels voor automatische categorisatie',
  'Backfill address book with all unique IBANs from transactions':
    'Vul het adresboek aan met alle unieke IBANs uit transacties',
  'Balance recalculated successfully': 'Saldo opnieuw berekend',
  'Bank account management': 'Rekeningbeheer',
  'Budget management': 'Budgetbeheer',
  'Bulk delete transactions': 'Meerdere transacties verwijderen',
  'CSV file (max 10MB)': 'CSV-bestand (max. 10 MB)',
  'CSV import': 'CSV-import',
  'CSV parsed successfully': 'CSV-bestand verwerkt',
  'Cannot delete the last profile':
    'Het laatste profiel kan niet worden verwijderd',
  'Categories created': 'Categorieën aangemaakt',
  'Category management': 'Categoriebeheer',
  'Comma-separated list of patterns to match':
    'Door komma’s gescheiden lijst met overeenkomende patronen',
  'Confirm a recurring pattern as a real subscription':
    'Bevestig een terugkerend patroon als een echt abonnement',
  'Contact management': 'Contactbeheer',
  'Create a demo profile and seed it with data':
    'Maak een demoprofiel met voorbeeldgegevens aan',
  'Create a new profile': 'Maak een nieuw profiel aan',
  'Create a new transaction': 'Maak een nieuwe transactie aan',
  'Dashboard and statistics': 'Dashboard en statistieken',
  'Data reset and demo profile restored':
    'Gegevens gewist en demoprofiel hersteld',
  'Delete a profile and all associated data':
    'Verwijder een profiel en alle bijbehorende gegevens',
  'Delete a recurring pattern': 'Verwijder een terugkerend patroon',
  'Delete all accounts for current profile':
    'Verwijder alle rekeningen van het huidige profiel',
  'Delete an account': 'Verwijder een rekening',
  'Delete multiple transactions at once. Provide either transactionIds (specific IDs)\nor dateRange (delete all in range). Account balances are automatically recalculated.\n':
    'Verwijder meerdere transacties tegelijk. Geef transactionIds (specifieke ID’s)\nof dateRange op (verwijder alles binnen het datumbereik). Rekeningensaldi worden automatisch opnieuw berekend.\n',
  'Deletes ALL data across all profiles, then creates/restores the demo profile with sample data. This is a destructive operation that cannot be undone.':
    'Verwijdert ALLE gegevens van alle profielen en maakt daarna het demoprofiel met voorbeeldgegevens opnieuw aan of herstelt het. Deze actie kan niet ongedaan worden gemaakt.',
  'Deletes all accounts for the current profile. Transactions will be unlinked (account_id set to null) but not deleted.':
    'Verwijdert alle rekeningen van het huidige profiel. Transacties worden losgekoppeld (account_id wordt null), maar niet verwijderd.',
  'Deletes an account. Transactions linked to this account will remain but be unlinked (account_id set to null).':
    'Verwijdert een rekening. Gekoppelde transacties blijven bestaan, maar worden losgekoppeld (account_id wordt null).',
  'Deletion successful': 'Verwijderen geslaagd',
  'Demo data seeded successfully': 'Voorbeeldgegevens toegevoegd',
  'Demo profile created and seeded successfully':
    'Demoprofiel aangemaakt en gevuld met voorbeeldgegevens',
  'Demo profile details or null if not found':
    'Gegevens van het demoprofiel, of null als het niet is gevonden',
  'Details of rows that were skipped during import':
    'Gegevens van rijen die tijdens het importeren zijn overgeslagen',
  'Detected payment processor or null': 'Gevonden betaalplatform, of null',
  'Detection results with count of detected and updated patterns':
    'Detectieresultaten met het aantal gevonden en bijgewerkte patronen',
  'Dismiss a recurring pattern as a false positive':
    'Markeer een terugkerend patroon als onterechte detectie',
  'End date (YYYY-MM-DD)': 'Einddatum (YYYY-MM-DD)',
  'Export and import of all data': 'Alle gegevens exporteren en importeren',
  'Finds all address book entries with the same name (case-insensitive) and merges them into a single contact with multiple IBANs.\n':
    'Zoekt alle adresboekvermeldingen met dezelfde naam (hoofdletterongevoelig) en voegt ze samen tot één contact met meerdere IBANs.\n',
  'Get a single profile by ID': 'Haal een profiel op via het ID',
  'Get all detected recurring patterns (subscriptions)':
    'Haal alle gevonden terugkerende patronen (abonnementen) op',
  'Get all profiles for current user':
    'Haal alle profielen van de huidige gebruiker op',
  'Get calendar entries for recurring patterns in a date range':
    'Haal agenda-items op voor terugkerende patronen binnen een datumbereik',
  'Get import history for the current profile':
    'Haal de importgeschiedenis van het huidige profiel op',
  'Get recurring pattern statistics':
    'Haal statistieken over terugkerende patronen op',
  'Get seed categories with subcategories and rules':
    'Haal standaardcategorieën met subcategorieën en regels op',
  'Get the demo profile if it exists':
    'Haal het demoprofiel op als het bestaat',
  "Goes through all existing transactions and adds any IBAN that's not yet in the address book. Applies cleanup rules to names (via Mollie, etc.). Excludes IBANs that belong to the user's own accounts.\n":
    'Doorzoekt alle bestaande transacties en voegt IBANs die nog niet in het adresboek staan toe. Past opschoonregels toe op namen (via Mollie enzovoort). Slaat IBANs van eigen rekeningen over.\n',
  'If true, return count without deleting':
    'Geef alleen het aantal terug als dit true is; verwijder niets',
  'Import history retrieved successfully': 'Importgeschiedenis opgehaald',
  'Import successful': 'Importeren geslaagd',
  'Import transactions from a generic CSV file with column mapping':
    'Importeer transacties uit een algemeen CSV-bestand met kolomtoewijzing',
  'Invalid file or parsing error': 'Ongeldig bestand of verwerkingsfout',
  'Invalid file, mapping, or account':
    'Ongeldig bestand, ongeldige toewijzing of rekening',
  'Invalid input': 'Ongeldige invoer',
  'Invalid request - missing criteria or validation failed':
    'Ongeldig verzoek - criteria ontbreken of validatie is mislukt',
  'Invalid request data': 'Ongeldige verzoekgegevens',
  'JSON string with column mapping': 'JSON-tekst met kolomtoewijzing',
  'Language for category names and descriptions (default nl)':
    'Taal voor categorienamen en -beschrijvingen (standaard nl)',
  'Limit deletion to specific account':
    'Beperk het verwijderen tot een specifieke rekening',
  'List of expected payments in the date range':
    'Lijst met verwachte betalingen binnen het datumbereik',
  'List of profiles': 'Lijst met profielen',
  'List of recurring patterns': 'Lijst met terugkerende patronen',
  'List of seed categories with subcategories and rules':
    'Lijst met standaardcategorieën, subcategorieën en regels',
  'Local development server': 'Lokale ontwikkelserver',
  'Merge address book entries with duplicate names':
    'Voeg adresboekvermeldingen met dubbele namen samen',
  'Multi-profile management': 'Beheer van meerdere profielen',
  'Number of IBANs added to address book':
    'Aantal IBANs toegevoegd aan het adresboek',
  'Number of entries merged': 'Aantal samengevoegde vermeldingen',
  'Only return active patterns (default true)':
    'Geef alleen actieve patronen terug (standaard true)',
  'Parse a generic CSV file and return headers for mapping':
    'Verwerk een algemeen CSV-bestand en geef de kolomkoppen terug voor toewijzing',
  'Pattern ID': 'Patroon-ID',
  'Pattern confirmed': 'Patroon bevestigd',
  'Pattern deleted': 'Patroon verwijderd',
  'Pattern dismissed': 'Patroon afgewezen',
  'Pattern not found': 'Patroon niet gevonden',
  'Profile ID': 'Profiel-ID',
  'Profile ID to filter accounts by': 'Profiel-ID om rekeningen op te filteren',
  'Profile ID to filter patterns by': 'Profiel-ID om patronen op te filteren',
  'Profile created successfully': 'Profiel aangemaakt',
  'Profile deleted successfully': 'Profiel verwijderd',
  'Profile details': 'Profielgegevens',
  'Profile not found': 'Profiel niet gevonden',
  'Profile updated successfully': 'Profiel bijgewerkt',
  'Recalculate account balance': 'Herbereken het rekeningsaldo',
  "Recalculates the account's current balance based on the latest transaction's\nbalance_after value. If no transactions exist, balance is set to 0.\n":
    'Herberekent het huidige rekeningsaldo op basis van de waarde balance_after\nvan de meest recente transactie. Als er geen transacties zijn, wordt het saldo 0.\n',
  'Reset all data and restore demo profile':
    'Wis alle gegevens en herstel het demoprofiel',
  'Reset failed': 'Wissen mislukt',
  'Returns the 10 most recent imports that have transactions belonging to the current profile. Includes details about skipped rows, duplicates, and parse errors.\n':
    'Geeft de 10 meest recente imports terug met transacties van het huidige profiel. Bevat details over overgeslagen rijen, duplicaten en verwerkingsfouten.\n',
  'Run recurring pattern detection on transactions':
    'Zoek terugkerende patronen in transacties',
  'Seed categories with subcategories into current profile':
    'Voeg standaardcategorieën met subcategorieën toe aan het huidige profiel',
  'Seed demo data for a profile (categories, transactions, addressbook, budgets)':
    'Voeg voorbeeldgegevens toe aan een profiel (categorieën, transacties, adresboek en budgetten)',
  'Server error': 'Serverfout',
  'Specific transaction IDs to delete (max 1000)':
    'ID’s van transacties om te verwijderen (maximaal 1000)',
  'Start date (YYYY-MM-DD)': 'Startdatum (YYYY-MM-DD)',
  'Statistics about recurring patterns':
    'Statistieken over terugkerende patronen',
  'Transaction created': 'Transactie aangemaakt',
  'Transaction management': 'Transactiebeheer',
  'Update an existing profile': 'Werk een bestaand profiel bij',
  'Update the display order of accounts':
    'Werk de weergavevolgorde van rekeningen bij',
  'Uses POST to avoid exposing sensitive IBAN in URL path/query (CodeQL js/sensitive-get-query).\n':
    'Gebruikt POST om te voorkomen dat een gevoelige IBAN zichtbaar wordt in het URL-pad of de query (CodeQL js/sensitive-get-query).\n',
  'Validation error': 'Validatiefout',
};

const dutchFromEnglishTranslations = Object.fromEntries(
  Object.entries(englishFromDutch).map(([dutch, english]) => [english, dutch])
);

function localizeValue(value: unknown, language: Language): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => localizeValue(item, language));
  }
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      if (
        (key === 'summary' || key === 'description') &&
        typeof item === 'string'
      ) {
        return [
          key,
          language === 'en'
            ? englishFromDutch[item] || item
            : dutchFromEnglish[item] ||
              dutchFromEnglishTranslations[item] ||
              item,
        ];
      }
      return [key, localizeValue(item, language)];
    })
  );
}

export function localizeOpenApiSpec<T>(spec: T, language: Language): T {
  return localizeValue(spec, language) as T;
}
