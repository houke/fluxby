// English translations for the Fluxby landing page
import type { LandingTranslationKeys } from './nl';

export const en: LandingTranslationKeys = {
  // Navigation
  nav: {
    features: 'Features',
    screenshots: 'Screenshots',
    getStarted: 'Get Started',
  },
  common: {
    copied: 'Copied!',
  },

  // Hero
  hero: {
    title: 'Meet',
    subtitle: 'your adorable financial mascotte!',
    description:
      'Make money management fun with your own digital mascotte. Track expenses, set goals, and get better insights into your spending!',
    getStarted: 'Get started 🚀',
    scrollDown: 'Scroll down',
  },

  // Features
  features: {
    title: 'Why choose',
    titleHighlight: 'Fluxby',
    subtitle:
      'More than just a finance app - Fluxby is your financial mascotte who makes managing money delightful and stress-free.',
    items: [
      {
        title: 'Smart transaction tracking',
        description:
          'Automatically categorize your expenses and income with AI-powered recognition. Fluxby learns your spending habits and suggests better ways to save.',
      },
      {
        title: 'Beautiful analytics',
        description:
          'Stunning charts and graphs that make understanding your finances fun. See your money grow with interactive visualizations.',
      },
      {
        title: 'Budget goals',
        description:
          'Set adorable budget goals with Fluxby cheering you on. Watch your progress with cute animations and celebratory confetti.',
      },
      {
        title: '100% local & private',
        description:
          'Your financial data never leaves your device. No cloud, no servers, no tracking - everything stays on your computer where it belongs.',
      },
      {
        title: 'Bank CSV import',
        description:
          'Simply export transactions from your bank and import them into Fluxby. Works with ING and more banks coming soon.',
      },
      {
        title: 'Personalized experience',
        description:
          'Customize Fluxby with different themes, avatars, and notifications. Make finance management uniquely yours.',
      },
    ],
  },

  // Screenshots
  screenshots: {
    title: 'See',
    titleHighlight: 'Fluxby',
    titleEnd: 'in action',
    subtitle:
      'Beautiful, intuitive interface designed to make finance management enjoyable for everyone.',
    items: [
      {
        title: 'Dashboard overview',
        description:
          'Get a complete view of your financial health at a glance. See your monthly income, expenses, and savings trend with beautiful visualizations.',
        features: [
          'Real-time balance updates',
          'Monthly income vs expenses chart',
          'Recent transactions list',
        ],
      },
      {
        title: 'Transaction management',
        description:
          'Easily categorize and track all your expenses and income. Smart categorization helps you understand your spending patterns.',
        features: [
          'Auto-categorization',
          'Search and filter',
          'Bulk editing support',
        ],
      },
      {
        title: 'Budget planning',
        description:
          'Set and monitor your spending goals with visual progress bars. Stay on track and get notified when approaching limits.',
        features: [
          'Custom budget categories',
          'Progress tracking',
          'Spending alerts',
        ],
      },
      {
        title: 'Analytics & insights',
        description:
          'Dive deep into your financial data with comprehensive analytics. Understand where your money goes with category breakdowns.',
        features: [
          'Category pie charts',
          'Trend analysis',
          'Year-over-year comparison',
        ],
      },
      {
        title: 'Category management',
        description:
          'Create and customize categories that match your lifestyle. Assign colors, icons, and set up automatic categorization rules.',
        features: [
          'Custom colors & icons',
          'Auto-categorization rules',
          'Subcategory support',
        ],
      },
      {
        title: 'Easy CSV import',
        description:
          'Import your bank transactions in seconds. Simply drag and drop your ING CSV export and Fluxby handles the rest.',
        features: [
          'Drag & drop upload',
          'ING bank support',
          'Duplicate detection',
        ],
      },
    ],
  },

  // Developer
  developer: {
    badge: 'Developer API',
    title: 'Build with',
    titleHighlight: 'Fluxby API',
    subtitle:
      'Access your financial data programmatically. Create custom integrations, dashboards, or automate your workflows.',
    features: [
      {
        title: 'RESTful API',
        description:
          'Clean REST endpoints for all data operations. Transactions, categories, budgets, and analytics.',
      },
      {
        title: 'OpenAPI/Swagger',
        description:
          'Interactive API documentation at /api/docs. Try endpoints directly in your browser.',
      },
      {
        title: 'Easy integration',
        description:
          'JSON responses, standard HTTP methods. Build custom dashboards or automations.',
      },
    ],
    endpointsTitle: 'API endpoints',
    moreEndpoints: '... and 20+ more endpoints',
    viewDocs: 'View API docs',
    tryApp: 'Try the app',
  },

  // Help Center Section (Landing)
  helpSection: {
    badge: 'Help Center',
    title: 'Need help?',
    titleHighlight: "We've got you covered",
    subtitle:
      'From getting started guides to detailed API documentation, find everything you need to make the most of Fluxby.',
    avatarBadge: 'Here to help!',
    cardTitle: 'Your friendly guide to Fluxby',
    cardDescription:
      "Whether you're just getting started or looking for advanced tips, our Help Center has everything you need. Browse guides, learn about budgeting, or dive into the API.",
    visitHelpCenter: 'Visit Help Center',
    viewApiDocs: 'API Docs',
    features: [
      {
        title: 'User Guide',
        description:
          'Step-by-step guides to help you get started and master all features of Fluxby.',
      },
      {
        title: 'API Documentation',
        description:
          'Complete API reference for developers who want to build integrations.',
      },
      {
        title: 'Privacy & Security',
        description:
          'Learn how Fluxby keeps your financial data private and secure locally.',
      },
    ],
    quickLinks: 'Quick links:',
    linkBankConnection: 'Bank Connection',
    linkBudgeting: 'Budgeting',
    linkPrivacy: 'Privacy',
  },

  // CTA
  cta: {
    title: {
      part1: 'Ready to see',
      highlight: 'where',
      part2: 'your money goes?',
    },
    description:
      'Join Fluxby today to track transactions, categorize expenses, and understand where your money is going — quick, private, and clear.',
    getStarted: 'Get started 🚀',
  },

  // Footer
  footer: {
    description:
      'Fluxby is your personal financial mascotte that makes money management fun and stress-free. 100% local, private, and adorable.',
    product: {
      title: 'Product',
      features: 'Features',
      pricing: 'Pricing',
      updates: 'Updates',
      about: 'About',
    },
    support: {
      title: 'Support',
      helpCenter: 'Help Center',
      developerDocs: 'Developer Docs',
      privacyPolicy: 'Privacy Policy',
      termsOfService: 'Terms of Service',
    },
    copyright: '© Fluxby. All rights reserved.',
    github: 'View on GitHub',
  },
  testimonials: {
    title: 'Loved by',
    titleHighlight: 'Everyone',
    subtitle:
      'Join thousands of happy users who have transformed their relationship with money.',
    items: [
      {
        name: 'Sarah Chen',
        role: 'Freelance Designer',
        content:
          'Fluxby made managing my freelance income so much fun! The cute animations actually motivate me to check my finances regularly.',
        avatar: '👩‍🎨',
      },
      {
        name: 'Marcus Johnson',
        role: 'Small Business Owner',
        content:
          "Finally, a finance app that doesn't feel like a chore. Fluxby's interface is beautiful and the insights are actually helpful.",
        avatar: '👨‍💼',
      },
      {
        name: 'Emma Rodriguez',
        role: 'Student',
        content:
          'As someone who hated budgeting, Fluxby changed everything. The digital mascotte makes saving feel rewarding!',
        avatar: '👩‍🎓',
      },
    ],
    stats: {
      users: '10K+',
      usersLabel: 'Happy Users',
      saved: '$2M+',
      savedLabel: 'Money Saved',
      rating: '4.9⭐',
      ratingLabel: 'App Store Rating',
      countries: '50+',
      countriesLabel: 'Countries',
    },
  },
  docs: {
    badge: 'Docs',
    backToHome: 'Back to Home',
    swaggerDocs: 'Swagger Docs',
    footerText: 'Built with ❤️ for developers.',
    nav: {
      gettingStarted: 'Getting Started',
      introduction: 'Introduction',
      authentication: 'Authentication',
      architecture: 'Architecture',
      profiles: 'Profiles & Multi-Tenancy',
      errors: 'Error Handling',
      coreResources: 'Core Resources',
      accounts: 'Accounts',
      transactions: 'Transactions',
      categories: 'Categories',
      budgets: 'Budgets',
      analytics: 'Analytics',
      addressBook: 'Address Book',
      import: 'Import',
      data: 'Data Management',
      tools: 'Tools',
      openapi: 'OpenAPI Spec',
      apiReference: 'Swagger Docs',
      helpCenter: 'Help Center',
    },
    // Introduction page
    introduction: {
      title: 'Fluxby API Documentation',
      subtitle:
        'Build powerful integrations with your financial data. Access transactions, categories, budgets, and analytics through our RESTful API.',
      quickStartTitle: 'Quick Start',
      quickStartText:
        'Get started in minutes. For development, run the API server locally at http://localhost:3001/api. The web app runs entirely in the browser with no backend required.',
      whatCanYouBuildTitle: 'What can you build?',
      useCases: [
        {
          title: 'Custom Dashboards',
          description:
            'Build personalized financial dashboards with your preferred visualization library.',
        },
        {
          title: 'Automations',
          description:
            'Create scripts that automatically categorize transactions or generate reports.',
        },
        {
          title: 'Mobile Apps',
          description:
            'Build mobile companions that sync with your Fluxby data.',
        },
        {
          title: 'Notifications',
          description:
            'Set up alerts for budget limits, unusual spending, or recurring payments.',
        },
      ],
      makeFirstRequest: 'Make your first request',
      makeFirstRequestText:
        "Here's a simple example to get your dashboard statistics:",
      requestTitle: 'Request',
      responseTitle: 'Response',
      baseUrlTitle: 'Base URL',
      baseUrlText: 'All API endpoints are relative to the base URL:',
      nextStepsTitle: 'Next Steps',
      nextSteps: [
        'Learn about Authentication',
        'Understand Profiles & Multi-Tenancy',
        'Explore the Transactions API',
      ],
    },
    // Authentication page
    authentication: {
      title: 'Authentication',
      subtitle:
        'The Fluxby API uses a simple profile-based authentication system.',
      howItWorksTitle: 'How it works',
      howItWorksText:
        'The Fluxby API uses profile-based authentication. Each request must include an X-Profile-ID header to specify which profile you want to access.',
      headerTitle: 'The X-Profile-ID Header',
      headerText:
        "Include the X-Profile-ID header in all API requests. The value should be the numeric ID of the profile you want to access. You can find your Profile ID in the web app under Settings → Profiles → 'Manage Profiles' tab.",
      exampleTitle: 'Example Request',
      withoutHeaderTitle: 'Requests without Header',
      withoutHeaderText:
        'If you omit the X-Profile-ID header, the API will use the first available profile.',
      bestPracticeTitle: 'Best Practice',
      bestPracticeText:
        'Always include the X-Profile-ID header to ensure consistent behavior, especially when working with multiple profiles.',
      responseTitle: 'Response with missing Header',
    },

    // Architecture page
    architecture: {
      title: 'Local-First Architecture',
      subtitle:
        'Fluxby uses a local-first architecture where your data is stored and encrypted locally. No cloud, no servers that can read your data.',
      zeroKnowledgeTitle: 'Zero-Knowledge Design',
      zeroKnowledgeText:
        'Only you can access your data. The master key exists only in memory and is never stored.',
      platformsTitle: 'Supported Platforms',
      webDesc:
        'Runs in the browser with SQLite WASM. Data is stored in OPFS (Origin Private File System).',
      desktopDesc: 'Native app for Windows, macOS and Linux using Tauri 2.0.',
      headlessDesc:
        'Local API server for scripts, automations and external tools.',
      securityTitle: 'Encryption & Security',
      securityText:
        'All data is encrypted with AES-256-GCM before it is written to disk. The key encryption key is derived from your password/PIN using PBKDF2.',
      autoLockTitle: 'Auto-Lock',
      autoLockWeb: 'Master key is wiped on refresh or tab close',
      autoLockDesktop: 'Master key is wiped when the app closes',
      autoLockIdle: 'Automatically locks after 15 minutes of inactivity',
      syncTitle: 'Sync',
      syncText:
        'Fluxby uses peer-to-peer sync via WebRTC. Data moves directly between devices without a central server.',
      syncSchemaTitle: 'Sync Schema',
      conflictTitle: 'Conflict Resolution (LWW)',
      conflictText:
        'When conflicts occur, the latest update wins (Last-Write-Wins). If timestamps are equal, device_id is used as tie-breaker.',
      storageTitle: 'Storage Adapters',
      backupTitle: 'Backup & Restore',
      backupText:
        'You can create backups at any time. Backups are encrypted and can be restored on any device.',
      backupDesktop: 'File → Save backup... exports to your Documents folder',
      backupWeb: 'Settings → Backup downloads a .fluxby file',
      backupFormat: '.fluxby files contain metadata + encrypted database',
      tipTitle: 'Tip',
      tipText:
        'Create backups regularly! If you lose your PIN/password you can only restore from a backup.',

      apiVsWebTitle: 'API Server vs Web App: separate databases',
      apiVsWebIntro:
        'It’s important to understand that the API server and the web app use completely separate databases. This is an intentional design choice for maximum privacy.',
      importantTitle: 'Important',
      apiSeparateDbText:
        'The API server cannot connect to your encrypted web app database. Your master password is never shared with the API server. If you want to use your data via the API, first export JSON from the web app and import it into the API server.',
      dataFlowTitle: 'Data migration workflow',
      dataFlowText:
        'To use your data with the API server for automations or custom integrations:',
      whySeparateTitle: 'Why separate databases?',
      whySeparate1:
        'Zero-knowledge: your master password never leaves the browser, so the API server cannot decrypt your encrypted data.',
      whySeparate2:
        'Privacy: your financial data in the web app is isolated and encrypted.',
      whySeparate3:
        'Flexibility: developers can work with a separate, unencrypted database without risking real data.',
      whySeparate4:
        'Serverless: the web app runs fully offline (e.g. GitHub Pages) with no backend required.',
    },
    // Profiles page
    profiles: {
      title: 'Profiles & Multi-Tenancy',
      subtitle:
        'Organize your financial data with profiles. Each profile is a completely isolated set of accounts, transactions, categories, and budgets.',
      whatIsProfileTitle: 'What is a Profile?',
      whatIsProfileText:
        'A profile in Fluxby acts as a completely isolated financial environment. You can use profiles to:',
      useCases: [
        'Keep personal and business finances separate',
        'Manage finances for different family members',
        'Test hypothetical budgets or planning scenarios',
      ],
      profileTypesTitle: 'Profile Types',
      profileTypes: [
        { type: 'personal', description: 'Personal finances', emoji: '👤' },
        {
          type: 'business',
          description: 'Business/freelance finances',
          emoji: '💼',
        },
        {
          type: 'shared',
          description: 'Joint/household finances',
          emoji: '👥',
        },
        { type: 'savings', description: 'Savings goals tracking', emoji: '🎯' },
        {
          type: 'investing',
          description: 'Investment portfolios',
          emoji: '📈',
        },
      ],
      endpointsTitle: 'Profile Endpoints',
      listProfiles: 'List all profiles',
      createProfile: 'Create new profile',
      getProfile: 'Get profile by ID',
      updateProfile: 'Update profile',
      deleteProfile: 'Delete profile',
      switchProfile: 'Switch active profile',
      exampleTitle: 'Example: Create a Profile',
      requestTitle: 'Request',
      responseTitle: 'Response',
      dataIsolationTitle: 'Data Isolation',
      dataIsolationText: 'Each profile contains its own:',
      dataIsolationItems: [
        'Bank accounts',
        'Transactions',
        'Categories and auto-categorization rules',
        'Budgets',
        'Address book contacts',
      ],
      dataIsolationNote:
        'Data is never shared between profiles. Deleting a profile permanently removes all associated data.',
    },
    // Errors page
    errors: {
      title: 'Error Handling',
      subtitle: 'Learn how to interpret and handle errors from the Fluxby API.',
      httpStatusTitle: 'HTTP Status Codes',
      httpStatusText: 'The API uses standard HTTP status codes:',
      statusCodes: [
        { code: '200', description: 'OK - Request successful' },
        { code: '201', description: 'Created - Resource successfully created' },
        {
          code: '400',
          description: 'Bad Request - Invalid request parameters',
        },
        { code: '404', description: 'Not Found - Resource not found' },
        {
          code: '500',
          description: 'Internal Server Error - Something went wrong',
        },
      ],
      errorResponseTitle: 'Error Response Format',
      errorResponseText:
        'When an error occurs, the API returns a JSON response with details:',
      commonErrorsTitle: 'Common Errors',
      invalidProfileTitle: 'Invalid Profile ID',
      invalidProfileText:
        'This occurs when the X-Profile-ID header contains an ID that does not exist.',
      missingFieldsTitle: 'Missing Required Fields',
      missingFieldsText:
        'This occurs when required fields are not provided in the request body.',
      resourceNotFoundTitle: 'Resource Not Found',
      resourceNotFoundText:
        'This occurs when trying to access a resource that does not exist.',
      bestPracticesTitle: 'Best Practices',
      bestPractices: [
        'Always check the HTTP status code before parsing the response body',
        'Implement retry logic for 5xx errors',
        'Log error details for debugging purposes',
        'Display user-friendly error messages to end users',
      ],
    },
    // Accounts page
    accounts: {
      title: 'Accounts',
      subtitle:
        'Manage your bank accounts. Each account tracks a balance and is linked to transactions.',
      endpointsTitle: 'Account Endpoints',
      endpoints: {
        list: 'List all accounts',
        create: 'Create new account',
        get: 'Get account by ID',
        update: 'Update account',
        delete: 'Delete account',
        reorder: 'Reorder accounts',
      },
      accountObjectTitle: 'The Account Object',
      fieldsTitle: 'Fields',
      fields: {
        id: 'Unique identifier',
        iban: 'IBAN account number',
        name: 'Display name',
        type: 'Account type (checking, savings, credit)',
        currentBalance: 'Current balance',
        sortOrder: 'Display order',
        createdAt: 'Creation timestamp',
      },
      createAccountTitle: 'Create an Account',
      requestTitle: 'Request',
      responseTitle: 'Response',
      accountTypesTitle: 'Account Types',
      accountTypes: [
        { type: 'checking', description: 'Standard checking account' },
        { type: 'savings', description: 'Savings account' },
        { type: 'credit', description: 'Credit card account' },
      ],
      deleteTitle: 'Delete Account',
      deleteText:
        'Remove an account. Transactions linked to this account will be preserved but unlinked.',
      noteTitle: 'Note',
      noteText:
        'Deleting a single account preserves its transactions. To delete all accounts AND their transactions, use DELETE /api/accounts without an ID.',
    },
    // Transactions page
    transactions: {
      title: 'Transactions',
      subtitle:
        'The heart of Fluxby. Transactions represent income and expenses linked to your accounts.',
      endpointsTitle: 'Transaction Endpoints',
      endpoints: {
        list: 'List transactions (with filters)',
        get: 'Get transaction by ID',
        update: 'Update transaction',
        delete: 'Delete transaction',
        deleteAll: 'Delete all transactions',
      },
      transactionObjectTitle: 'The Transaction Object',
      fieldsTitle: 'Fields',
      fields: {
        id: 'Unique identifier',
        accountId: 'Linked account ID',
        date: 'Transaction date',
        amount: 'Amount (positive = income, negative = expense)',
        description: 'Transaction description',
        opposingAccountIban: 'Counter account IBAN',
        opposingAccountName: 'Counter account name',
        categoryId: 'Linked category ID',
        type: 'Type: income or expense',
        notes: 'User notes',
      },
      filteringTitle: 'Filtering Transactions',
      filteringText:
        'The GET /api/transactions endpoint supports extensive filtering:',
      filterParams: {
        accountId: 'Filter by account',
        categoryId: 'Filter by category',
        startDate: 'Transactions from date',
        endDate: 'Transactions until date',
        type: 'Filter by type (income/expense)',
        search: 'Search in description',
        minAmount: 'Minimum amount',
        maxAmount: 'Maximum amount',
      },
      exampleTitle: 'Example: Filtered Transactions',
      requestTitle: 'Request',
      responseTitle: 'Response',
      updateTitle: 'Update a Transaction',
      updateText:
        'You can update the category, notes, and certain fields of a transaction:',
    },
    // Categories page
    categories: {
      title: 'Categories',
      subtitle:
        'Organize transactions with custom categories. Set up automatic categorization rules to tag transactions automatically.',
      endpointsTitle: 'Category Endpoints',
      endpoints: {
        list: 'List all categories',
        create: 'Create new category',
        get: 'Get category by ID',
        update: 'Update category',
        delete: 'Delete category',
      },
      categoryObjectTitle: 'The Category Object',
      fieldsTitle: 'Fields',
      fields: {
        id: 'Unique identifier',
        name: 'Category name',
        icon: 'Emoji icon',
        color: 'Hex color code',
        description: 'Optional description',
      },
      createCategoryTitle: 'Create a Category',
      requestTitle: 'Request',
      responseTitle: 'Response',
      autoCategorizationTitle: 'Auto-categorization Rules',
      autoCategorizationText:
        'Set up rules to automatically categorize transactions based on patterns:',
      ruleEndpoints: {
        list: 'List all rules',
        create: 'Create new rule',
        delete: 'Delete rule',
        apply: 'Apply rule to existing transactions',
        applyAll: 'Apply all rules',
      },
      ruleExampleTitle: 'Example: Create a Rule',
      ruleExampleText:
        "This will automatically categorize all transactions containing 'albert heijn' or 'jumbo':",
    },
    // Budgets page
    budgets: {
      title: 'Budgets',
      subtitle:
        'Set spending limits per category and track your progress. Budgets are automatically calculated based on transactions.',
      endpointsTitle: 'Budget Endpoints',
      endpoints: {
        list: 'List all budgets with progress',
        create: 'Create new budget',
        update: 'Update budget',
        delete: 'Delete budget',
      },
      budgetObjectTitle: 'The Budget Object',
      fieldsTitle: 'Fields',
      fields: {
        id: 'Unique identifier',
        categoryId: 'Linked category (null for total budget)',
        amount: 'Budget limit in euros',
        period: 'Budget period',
        spent: 'Spent this period (calculated)',
        remaining: 'Remaining budget (calculated)',
        percentage: 'Percentage used (calculated)',
      },
      createBudgetTitle: 'Create a Budget',
      requestTitle: 'Request',
      responseTitle: 'Response',
      budgetTypesTitle: 'Budget Types',
      budgetTypes: [
        {
          type: 'Category Budget',
          description:
            'Set a limit for a specific category (e.g., €500 for Groceries)',
        },
        {
          type: 'Total Budget',
          description:
            'Set an overall monthly spending limit by omitting categoryId',
        },
      ],
      progressTrackingTitle: 'Progress Tracking',
      progressTrackingText:
        'When fetching budgets, the spent, remaining, and percentage fields are automatically calculated based on transactions in the current period.',
    },
    // Analytics page
    analytics: {
      title: 'Analytics',
      subtitle:
        'Get insights into your financial data with pre-built analytics endpoints.',
      endpointsTitle: 'Analytics Endpoints',
      endpoints: {
        dashboard: 'Dashboard statistics overview',
        monthly: 'Monthly breakdown',
        categories: 'Spending by category',
        trends: 'Income/expense trends',
      },
      dashboardTitle: 'Dashboard Analytics',
      dashboardText: 'Fetch a complete overview of financial status:',
      dashboardFieldsTitle: 'Response Fields',
      dashboardFields: {
        totalIncome: 'Total income in period',
        totalExpenses: 'Total expenses in period',
        balance: 'Net balance (income - expenses)',
        transactionCount: 'Number of transactions',
        topCategories: 'Top spending categories',
      },
      monthlyTitle: 'Monthly Breakdown',
      monthlyText: 'Fetch month-by-month financial data for charts and trends:',
      categoryTitle: 'Category Analytics',
      categoryText: 'Analyze spending by category:',
    },
    // Address Book page
    addressBook: {
      title: 'Address Book',
      subtitle:
        'Manage contacts and counterparties from your transactions. Automatically link transactions to contacts, clean up names, and handle shared IBANs.',
      overviewTitle: '📒 What is the Address Book?',
      overviewText:
        'The Address Book automatically extracts counterparties from your transactions based on IBAN and name. It helps you organize contacts, clean up messy bank names, and track spending per merchant.',
      endpointsTitle: 'Address Book Endpoints',
      endpoints: {
        list: 'List all contacts with transaction stats',
        create: 'Create a new contact',
        get: 'Get contact by ID',
        update: 'Update contact',
        delete: 'Delete contact',
      },
      listTitle: 'List Contacts',
      listText:
        'Retrieve all contacts with transaction statistics. Supports filtering and sorting.',
      params: {
        search: 'Search by name or IBAN',
        sortBy:
          'Sort field: name, transactionCount, totalExpenses, lastTransactionDate',
        sortOrder: 'Sort direction: asc or desc',
      },
      createTitle: 'Create Contact',
      createText:
        'Manually create a new address book contact. Transactions will be automatically linked.',
      cleanupRulesTitle: 'Name Cleanup Rules',
      cleanupRulesText:
        'Create rules to automatically clean up messy bank names. Rules can use literal strings or regex patterns.',
      cleanupEndpoints: {
        list: 'List all cleanup rules',
        create: 'Create cleanup rule',
        delete: 'Delete cleanup rule',
        apply: 'Apply all rules to contacts',
      },
      sharedIbansTitle: 'Shared IBANs (Payment Processors)',
      sharedIbansText:
        'Some IBANs are shared by multiple merchants (like iDEAL or PayPal). Mark these as shared to enable merchant-level contact tracking.',
      sharedIbansNote: 'Why Shared IBANs?',
      sharedIbansExplanation:
        'Payment processors like iDEAL, Mollie, and PayPal use a single IBAN for thousands of different merchants. By marking these as shared, Fluxby tracks the actual merchant name instead of just the IBAN.',
      sharedEndpoints: {
        list: 'List all shared IBANs',
        create: 'Add shared IBAN',
        delete: 'Remove shared IBAN',
        detect: 'Auto-detect shared IBANs',
      },
      mergeTitle: 'Merge & Split Contacts',
      mergeText:
        'Combine duplicate contacts or split contacts that represent multiple merchants.',
      mergeEndpoints: {
        merge: 'Merge contacts into one',
        duplicates: 'Auto-detect and merge duplicates',
        split: 'Split contact into multiple',
      },
      multiIbanTitle: 'Multi-IBAN Contacts',
      multiIbanText:
        'Some contacts (like large companies) may have multiple IBANs. You can link additional IBANs to a single contact.',
      ibanEndpoints: {
        list: 'List IBANs for contact',
        add: 'Add IBAN to contact',
        remove: 'Remove IBAN from contact',
      },
      objectTitle: 'The Contact Object',
      fields: {
        id: 'Unique identifier',
        iban: 'Primary IBAN',
        name: 'Display name (can be cleaned up)',
        originalName: 'Original bank name (for shared IBANs)',
        description: 'Optional description',
        notes: 'User notes',
        transactionCount: 'Number of linked transactions',
        totalIncome: 'Total income from this contact',
        totalExpenses: 'Total expenses to this contact',
        netAmount: 'Net amount (income - expenses)',
        lastTransactionDate: 'Date of most recent transaction',
      },
    },
    // Import page
    import: {
      title: 'Import',
      subtitle:
        'Import bank transactions from CSV files. Currently supports ING bank format with automatic account detection and duplicate prevention.',
      csvTitle: 'Import CSV',
      csvText:
        'Upload and import a CSV file with bank transactions. The system automatically detects accounts, prevents duplicates, applies category rules, and cleans up counterparty names using your cleanup rules.',
      formData: 'Form Data',
      fileDesc: 'CSV file (max 10MB)',
      bankDesc:
        "Bank type (default: 'ing'). Currently only 'ing' is supported.",
      previewTitle: 'Preview CSV',
      previewText:
        'Preview a CSV file before importing. Shows detected accounts, date range, and sample transactions.',
      historyTitle: 'Import history',
      historyText:
        'Retrieve a list of all past imports with their status and transaction counts.',
      tipTitle: 'Tip',
      tipText:
        'The import system automatically applies your category rules to categorize transactions, applies name cleanup rules to clean up counterparty names, and adds new contacts to your address book.',
    },
    // Data management page
    data: {
      title: 'Data management',
      subtitle:
        'Export and import complete datasets for backup purposes, or reset all data to demo state.',
      exportTitle: 'Export data',
      exportText:
        'Export all data as a JSON file for backup or migration purposes.',
      importTitle: 'Import data',
      importText:
        'Import a complete dataset from a JSON backup. Note: this replaces all existing data.',
      resetTitle: 'Reset data',
      resetText:
        'Reset all data and restore demo state. This deletes ALL data across all profiles and creates a new demo profile with default categories. This cannot be undone.',
      warningTitle: 'Warning',
      warningText:
        'The reset endpoint deletes ALL data across ALL profiles. This is intended for a complete factory reset. First make a backup using the export function if you want to keep your data.',
    },
    // Common docs strings
    common: {
      method: 'Method',
      endpoint: 'Endpoint',
      description: 'Description',
      queryParams: 'Query Parameters',
      param: 'Parameter',
      type: 'Type',
      field: 'Field',
      tableField: 'Field',
      tableType: 'Type',
      tableRequired: 'Required',
      tableDescription: 'Description',
      yes: 'Yes',
      no: 'No',
    },
  },
  helpCenter: {
    badge: 'Help Center',
    userGuide: 'User Guide',
    developerHub: 'Developer Hub',
    footerText: "We're here to help you succeed.",
    search: 'Search...',
    userSubtitle: 'Learn how to use Fluxby',
    devSubtitle: 'Build with the Fluxby API',
    userNav: {
      gettingStarted: 'Getting Started',
      welcome: 'Welcome',
      bankConnection: 'Connecting your bank',
      firstSteps: 'First steps',
      features: 'Features',
      transactions: 'Transactions',
      categories: 'Categories',
      accounts: 'Accounts',
      addressBook: 'Address Book',
      budgeting: 'Budgeting & Analytics',
      createBudget: 'Creating a budget',
      understandAnalytics: 'Understanding analytics',
      security: 'Security & Privacy',
      dataPrivacy: 'Your data & privacy',
    },
    devNav: {
      gettingStarted: 'Getting Started',
      introduction: 'Introduction',
      apiKeys: 'API Keys',
      apiReference: 'API Reference',
      endpoints: 'Endpoints',
      webhooks: 'Webhooks',
      resources: 'Resources',
      swagger: 'Swagger Docs',
      devDocs: 'Developer Docs',
    },
    home: {
      title: 'How can we help you?',
      subtitle: 'Find answers to your questions about Fluxby',
      userGuideTitle: 'User Guide',
      userGuideDesc:
        'Learn how to manage your money, set budgets, and track expenses with Fluxby.',
      userItem1: 'Connect your bank account',
      userItem2: 'Create budgets & goals',
      userItem3: 'Understand your privacy',
      devHubTitle: 'Developer Hub',
      devHubDesc:
        'Build integrations with the Fluxby API. Access documentation, endpoints, and webhooks.',
      getStarted: 'Get started',
      viewDocs: 'View documentation',
      popularArticles: 'Popular articles',
      article1: 'Connecting your bank',
      article1Desc: 'Learn how to import your transactions',
      article2: 'Creating a budget',
      article2Desc: 'Set up your first monthly budget',
      article3: 'API documentation',
      article3Desc: 'Full API reference for developers',
    },
    firstSteps: {
      title: 'First steps with Fluxby',
      subtitle:
        'Get started with Fluxby in just a few minutes. This guide walks you through the new onboarding flow.',
      step1Title: 'Step 1: Log in & onboarding',
      step1Text:
        'When you open Fluxby for the first time, you will be guided through a short onboarding wizard. You can log in, set a password, and create your first profile (e.g., "Personal" or "Family").',
      step2Title: 'Step 2: Export from your bank',
      step2Text:
        'Log in to your online banking and export your transactions as a CSV file. Most banks offer this in the "Export" or "Download" section.',
      step3Title: 'Step 3: Import your transactions',
      step3Text:
        'Go to the Import page in Fluxby and drag your CSV file, or click to browse. Fluxby will automatically detect the format and import your transactions.',
      step4Title: 'Step 4: Categorize transactions',
      step4Text:
        'After importing, go to the Transactions page to categorize your transactions. Click a transaction to assign a category. Fluxby learns from your choices and will auto-categorize similar transactions in the future.',
      step5Title: 'Step 5: Explore your dashboard',
      step5Text:
        'Now go to the Dashboard to see your financial overview! You will see your balance, spending per category, and recent transactions.',
      nextStepsTitle: 'What next?',
      next1: 'Set budgets to track your spending goals',
      next2: 'Create custom categories for better organization',
      next3: 'Add contacts in the Address Book to track who you transact with',
      next4: 'Import transactions regularly to keep your data up to date',
    },
    bankConnection: {
      title: 'Connecting your bank account',
      subtitle:
        'Import your transactions from your bank to start tracking your finances.',
      howItWorksTitle: 'How it works',
      howItWorksText:
        'Fluxby uses CSV imports to bring your bank transactions into the app. This approach ensures your data stays 100% local on your device - no cloud connections required.',
      step1Title: 'Step 1: Export from your bank',
      step1Text:
        'Log into your online banking and download your transaction history as a CSV file. Most banks offer this option in the account statements or transaction history section.',
      step2Title: 'Step 2: Import into Fluxby',
      step2Text:
        'Navigate to the Import page in Fluxby and drag & drop your CSV file, or click to browse for it.',
      step3Title: 'Step 3: Review and categorize',
      step3Text:
        'Once imported, Fluxby will automatically categorize your transactions based on your rules. You can review and adjust categories as needed.',
      tipTitle: 'Pro Tip',
      tipText:
        'Set up auto-categorization rules to automatically tag transactions from specific merchants. This saves you time on future imports!',
      supportedTitle: 'Supported banks',
      supportedText: 'Currently, Fluxby supports CSV imports from:',
      moreComingSoon: 'More banks coming soon...',
    },
    budgeting: {
      title: 'Creating a monthly budget',
      subtitle:
        'Set spending limits and track your progress with visual budgets.',
      whatIsTitle: 'What is a budget?',
      whatIsText:
        'A budget in Fluxby is a spending limit you set for a specific category or your total monthly expenses. As you make transactions, Fluxby automatically tracks your spending against these limits.',
      createTitle: 'Creating your first budget',
      step1: 'Navigate to the Budgets page from the sidebar',
      step2: 'Click "New Budget" to open the creation dialog',
      step3: 'Select a category (or leave empty for a total budget)',
      step4: 'Enter your budget amount and select the period',
      step5: 'Click Save to create your budget',
      typesTitle: 'Budget types',
      categoryBudgetTitle: 'Category budgets',
      categoryBudgetText:
        'Set a limit for a specific category like Groceries, Entertainment, or Transportation. This helps you control spending in specific areas.',
      totalBudgetTitle: 'Total budget',
      totalBudgetText:
        "Set an overall monthly spending limit across all categories. This gives you a bird's eye view of your total expenses.",
      bestPracticeTitle: 'Best Practice',
      bestPracticeText:
        'Start with a total budget based on your typical monthly spending, then add category-specific budgets for areas where you want to cut back.',
      trackingTitle: 'Tracking your progress',
      trackingText:
        'The budget cards show your spending progress in real-time. The circular progress indicator fills up as you approach your limit, changing color from green to yellow to red.',
    },
    privacy: {
      title: 'Your data & privacy',
      subtitle:
        'Fluxby is designed with privacy first. Your financial data stays on your device.',
      localFirstTitle: '100% Local',
      localFirstText:
        'Unlike most finance apps, Fluxby runs entirely on your computer. Your transaction data, budgets, and categories are stored in a local SQLite database - they never leave your device.',
      noCloud: 'No cloud storage',
      noCloudDesc: 'Data stays on your machine',
      noTracking: 'No tracking',
      noTrackingDesc: 'We never analyze your spending',
      fullControl: 'Full control',
      fullControlDesc: 'Delete all data anytime',
      howWorksTitle: 'How it works',
      howWorksText:
        'Fluxby runs entirely in your browser using SQLite with WebAssembly. Your data is stored locally in your browser (OPFS) or on your device when using the desktop app. No servers required, no external connections made.',
      dataLocationTitle: 'Where is my data stored?',
      dataLocationText:
        'Your data is stored in your browser using OPFS (Origin Private File System) for the web app, or in your local app data folder for the desktop app. Your data never leaves your device.',
      deleteDataTitle: 'Deleting your data',
      deleteDataText:
        "To completely remove all your financial data, you can use the Data Management section in Settings, or clear your browser data. There's no account to close or data to request - it's all local.",
      warningTitle: 'Important',
      warningText:
        'Since all data is stored locally, consider exporting your data regularly if you want to preserve it. You can sync between devices using the peer-to-peer sync feature.',
    },
    devIntro: {
      title: 'Developer Hub',
      subtitle:
        'Build integrations with the Fluxby API. Access your financial data programmatically.',
      quickStartTitle: 'Quick Start',
      quickStartText:
        'For development and headless mode, run the Fluxby API server locally at http://localhost:3001/api. The main web app runs entirely in your browser - no backend required.',
      whatCanBuildTitle: 'What can you build?',
      customDashboards: 'Custom Dashboards',
      customDashboardsDesc:
        'Build personalized visualizations with your preferred charting library',
      automations: 'Automations',
      automationsDesc:
        'Create scripts that categorize transactions or generate reports',
      mobileApps: 'Mobile Apps',
      mobileAppsDesc: 'Build mobile companions that sync with your Fluxby data',
      notifications: 'Notifications',
      notificationsDesc: 'Set up alerts for budget limits or unusual spending',
      resourcesTitle: 'Resources',
      fullDocsTitle: 'Full API Documentation',
      fullDocsDesc: 'Complete reference for all endpoints',
      swaggerTitle: 'Swagger UI',
      swaggerDesc: 'Interactive API explorer',
    },
    placeholders: {
      bankExport: 'Bank Export Screen',
      bankExportDesc:
        'Show the bank selection screen with major banks (ING, Rabobank, ABN AMRO). Highlight the export/download option.',
      importPage: 'Import Page',
      importPageDesc:
        'Show the Fluxby import page with the drag & drop area highlighted. Include an example of a successful import with transaction count.',
      budgetOverview: 'Budget Overview',
      budgetOverviewDesc:
        'Show the Budget page with multiple budget cards. Include one budget at 75% utilization with the circular progress bar, and category breakdown below.',
      budgetProgress: 'Budget Progress',
      budgetProgressDesc:
        'Show a budget card with the circular progress indicator at different stages (25%, 75%, 100%). Show the spent vs remaining amounts.',
    },
    animations: {
      profile: {
        title: 'New profile',
        placeholder: 'Personal',
        button: 'Create',
      },
      import: {
        dropText: 'Drop CSV here',
        fileName: 'transactions.csv',
        processing: 'Processing...',
      },
      dashboard: {
        balance: 'Balance',
        income: 'Income',
        expenses: 'Expenses',
      },
      transactions: {
        search: 'Search...',
        items: [
          '🛒 Grocery Store',
          '⛽ Gas Station',
          '🍽️ Restaurant',
          '📺 Netflix',
        ],
      },
      categories: {
        items: [
          { emoji: '🛒', name: 'Groceries', color: '#34D399' },
          { emoji: '🚗', name: 'Transport', color: '#3B82F6' },
          { emoji: '🍽️', name: 'Dining out', color: '#F97316' },
          { emoji: '🎬', name: 'Entertainment', color: '#8B5CF6' },
        ],
      },
      budget: {
        title: 'Budget',
        spent: 'Spent',
        remaining: 'Remaining',
      },
      accounts: {
        checking: 'Checking account',
        savings: 'Savings account',
      },
      trends: {
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        income: 'Income',
        expenses: 'Expenses',
      },
      addressBook: {
        contacts: [
          { name: 'Grocery Store', count: 24 },
          { name: 'Gas Station', count: 12 },
          { name: 'Transit', count: 8 },
        ],
      },
      export: {
        formats: ['JSON', 'CSV'],
        exporting: 'Exporting...',
      },
    },
  },

  // Legal pages
  legal: {
    privacyTitle: 'Privacy Policy',
    termsTitle: 'Terms of Use',
    privacy: {
      lastUpdated: 'Last Updated:',
      introTitle: '1. Introduction',
      introText:
        'This Privacy Policy describes how Fluxby ("we," "us," or "the App") handles your data.',
      introPhilosophy:
        'We believe that your financial data belongs to you alone. The core philosophy of this App is absolute privacy. We do not operate servers, we do not require user accounts, and we do not track your behavior.',
      localFirstTitle: '2. The "Local-First" Architecture',
      localFirstSubtitle: 'All data remains on your device.',
      localFirstText:
        'This App works as a standalone utility. When you enter expenses, categorize transactions, or import bank statements, that information is stored locally within the internal storage of your device.',
      noCloudTitle: 'No Cloud Sync:',
      noCloudText: 'We do not sync your data to any cloud servers.',
      noAccountsTitle: 'No Accounts:',
      noAccountsText: 'You do not create a username or password with us.',
      noAITitle: 'No Third-Party AI:',
      noAIText:
        'We do not send your financial descriptions or address book entries to external AI models (like OpenAI or Google Gemini) for processing. All logic is executed locally on your device.',
      dataAccessTitle: '3. Data We Access',
      dataAccessText:
        'To provide functionality, the App may request permission to access specific data on your device.',
      transactionDataTitle: 'A. Financial Transaction Data',
      transactionDataText:
        'When you manually input data or import files (such as CSVs or bank statements), the App processes this information to create charts and categories. This processing happens instantly on your device. We do not (and cannot) see this data.',
      addressBookTitle: 'B. Address Book / Contacts',
      addressBookText:
        'The App features an address book function to associate transactions with specific people or entities. If you grant access to your contacts, the App only reads this data to display names within the App. Your contact list is never uploaded or shared.',
      fileStorageTitle: 'C. File Storage',
      fileStorageText:
        'The App requires access to your file storage to import bank statements and save backups of your ledger.',
      aiDisclosureTitle: '4. AI Development Disclosure',
      aiDisclosureText:
        'Please note that the codebase for this App was entirely generated using Artificial Intelligence.',
      aiDisclosureDetails:
        'From a privacy perspective, this means the app is designed to function based on logic generated by AI prompts. While we have prompted the AI to strictly adhere to local-storage principles, there is no human oversight team monitoring a backend database—because there is no backend database.',
      securityTitle: '5. Data Security and Backups',
      securityText:
        'Because we do not store your data, we cannot recover your data if it is lost.',
      yourResponsibilityTitle: 'Your Responsibility:',
      yourResponsibilityText:
        'You are responsible for the security of your physical device.',
      backupsTitle: 'Backups:',
      backupsText:
        "If you delete the App or lose your phone, your financial data is lost unless you have utilized your device's built-in system backup features (e.g., iCloud Backup or Android Backup) or manually exported your data.",
      thirdPartyTitle: '6. Third-Party Services',
      thirdPartyText:
        'The App does not integrate with third-party analytics or advertising networks.',
      thirdPartyOS:
        "However, the App runs on an Operating System (iOS or Android) which may collect usage statistics independent of our App. Please refer to Apple or Google's privacy policies regarding how they handle app usage data.",
      changesTitle: '7. Changes to This Policy',
      changesText:
        'We may update this Privacy Policy from time to time. Since we do not collect email addresses, we cannot notify you directly of changes. You are advised to review this page periodically for any changes.',
      contactTitle: '8. Contact',
      contactText:
        'If you have questions about how the App works locally on your device, you may',
      contactGithub: 'contact me on GitHub',
    },
    terms: {
      lastUpdated: 'Last Updated:',
      aiDisclaimerTitle:
        '1. The "Vibe Coded" Disclaimer (AI-Generated Software)',
      aiDisclaimerImportant:
        'IMPORTANT: You acknowledge and agree that this Application was entirely written and developed by Artificial Intelligence (AI) based on prompts provided by the developer.',
      experimentalNatureTitle: 'Experimental Nature:',
      experimentalNatureText:
        'This software should be considered experimental.',
      noHumanReviewTitle: 'No Human Code Review:',
      noHumanReviewText:
        'The code has not undergone professional human security auditing or standard enterprise-level quality assurance (QA).',
      unpredictabilityTitle: 'Unpredictability:',
      unpredictabilityText:
        'AI-generated code may contain hallucinations, logic errors, or unexpected behaviors that a human developer might avoid.',
      useAtOwnRisk: 'You use this application entirely at your own risk.',
      noFinancialAdviceTitle: '2. No Financial Advice',
      noFinancialAdviceText:
        'This App is a tool for organization and visualization. It is not a financial advisor, accountant, or tax professional.',
      calculationErrorsTitle: 'Calculation Errors:',
      calculationErrorsText:
        'Due to the AI-generated nature of the code, the App may make mathematical errors, mis-categorize transactions, or display incorrect totals.',
      noRelianceTitle: 'No Reliance:',
      noRelianceText:
        'You should never rely solely on this App for tax reporting, business accounting, or critical financial decisions. Always verify numbers against your actual bank statements.',
      licenseTitle: '3. License to Use',
      licenseText:
        'We grant you a personal, revocable, non-exclusive, non-transferable license to use the App on your device. We reserve the right to discontinue the App at any time without notice.',
      userDataTitle: '4. User Data and Responsibility',
      userDataText:
        'As stated in our Privacy Policy, this App functions offline and stores data locally.',
      dataControllerTitle: 'You are the Data Controller:',
      dataControllerText:
        'You are solely responsible for backing up your data.',
      dataLossTitle: 'Data Loss:',
      dataLossText:
        'The Developer is not responsible for any loss of data, corruption of files, or inability to access your spending history, whether caused by App bugs, device failure, or user error.',
      liabilityTitle: '5. Limitation of Liability',
      liabilityText:
        'TO THE FULLEST EXTENT PERMITTED BY LAW, THE DEVELOPER SHALL NOT BE LIABLE FOR ANY DAMAGES WHATSOEVER.',
      liabilityIncludes: 'This includes, but is not limited to:',
      directDamagesTitle: 'Direct, Indirect, or Consequential Damages:',
      directDamagesText: 'Loss of profits, data, or goodwill.',
      financialDiscrepanciesTitle: 'Financial Discrepancies:',
      financialDiscrepanciesText:
        "Any financial losses incurred due to reliance on the App's calculations or categorizations.",
      bugsTitle: 'Bugs and Glitches:',
      bugsText: 'Any issues arising from the AI-generated codebase.',
      soleRemedy:
        'Your sole remedy for dissatisfaction with the App is to stop using the App.',
      asIsTitle: '6. "AS IS" and "AS AVAILABLE"',
      asIsText:
        'The App is provided on an "AS IS" basis. The Developer explicitly disclaims all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement.',
      noGuarantee: 'We make no guarantee that:',
      requirementsGuarantee: 'The App will meet your requirements.',
      uninterruptedGuarantee:
        'The App will be uninterrupted, timely, secure, or error-free.',
      resultsGuarantee:
        'The results obtained from the use of the App will be accurate or reliable.',
      indemnificationTitle: '7. Indemnification',
      indemnificationText:
        'You agree to indemnify and hold harmless the Developer from any claims, damages, liabilities, costs, and expenses (including legal fees) arising from your use of the App or your violation of these Terms.',
      governingLawTitle: '8. Governing Law',
      governingLawText:
        'These Terms shall be governed by the laws of the Netherlands, without regard to its conflict of law provisions.',
      acknowledgement:
        'By using Fluxby, you acknowledge that you have read this agreement, understand it, and agree to the fact that this is an AI-generated tool provided without warranty.',
    },
    featuresTitle: 'All features',
    featuresPage: {
      intro:
        'Discover everything Fluxby has to offer. From smart transaction tracking to beautiful analytics - everything you need to manage your finances.',
      smartTracking: {
        title: 'Smart transaction tracking',
        description:
          'Automatically categorize your expenses and income with AI-powered recognition. Fluxby learns your spending patterns and suggests better ways to save.',
        highlights: [
          'Automatic categorization',
          'Pattern recognition',
          'Smart suggestions',
        ],
      },
      analytics: {
        title: 'Beautiful analytics',
        description:
          'Beautiful charts that make understanding your finances fun. Watch your money grow with interactive visualizations.',
        highlights: [
          'Interactive charts',
          'Trend analysis',
          'Category breakdown',
        ],
      },
      budgets: {
        title: 'Budget goals',
        description:
          'Set cute budget goals with Fluxby cheering you on. Track your progress with fun animations.',
        highlights: ['Monthly limits', 'Progress tracking', 'Overspend alerts'],
      },
      privacy: {
        title: '100% local & private',
        description:
          'Your financial data never leaves your device. No cloud, no servers, no tracking - everything stays on your computer.',
        highlights: [
          'No cloud storage',
          'No accounts needed',
          'Complete privacy',
        ],
      },
      bankImport: {
        title: 'Bank CSV import',
        description:
          'Easily export transactions from your bank and import them into Fluxby. Works with ING and more banks coming soon.',
        highlights: [
          'ING support',
          'Drag & drop upload',
          'Duplicate detection',
        ],
      },
      customization: {
        title: 'Personal experience',
        description:
          'Customize Fluxby with different themes and settings. Make financial management uniquely yours.',
        highlights: [
          'Dark mode',
          'Customizable categories',
          'Custom colors & icons',
        ],
      },
      realtime: {
        title: 'Realtime updates',
        description:
          'Watch your financial overview change instantly when you add or edit transactions.',
        highlights: [
          'Instant dashboard updates',
          'Live charts',
          'Automatic recalculation',
        ],
      },
      ai: {
        title: 'Smart categorization rules',
        description:
          'Create custom rules to automatically categorize your transactions. Set up patterns for merchants, amounts, and descriptions to keep your finances organized effortlessly.',
        highlights: [
          'Custom categorization rules',
          'Pattern matching',
          'Automatic organization',
        ],
      },
      multiAccount: {
        title: 'Multiple accounts',
        description:
          'Manage all your bank accounts in one place. See your total wealth and cash flow clearly.',
        highlights: [
          'Unlimited accounts',
          'Combined overview',
          'Filter by account',
        ],
      },
      addressBook: {
        title: 'Address book',
        description:
          'Link transactions to contacts. See how much you spend at specific stores or with specific people.',
        highlights: [
          'Contact linking',
          'Spending per contact',
          'Auto-suggestions',
        ],
      },
      security: {
        title: 'Safe & reliable',
        description:
          'No external connections means no risk of data breaches. Your data is as safe as your device.',
        highlights: [
          'Available offline',
          'No external API calls',
          'Local database',
        ],
      },
      sync: {
        title: 'Export & backup',
        description:
          'Export your data whenever you want. Create backups for peace of mind.',
        highlights: ['JSON export', 'CSV export', 'Database backup'],
      },
      languages: {
        title: 'Dutch & English',
        description:
          'Use Fluxby in your preferred language. Fully translated interface.',
        highlights: ['Dutch UI', 'English UI', 'Easy switching'],
      },
      openSource: {
        title: 'Open source',
        description:
          'Fully open source and transparent. View the code, contribute, or customize it.',
        highlights: [
          'GitHub repository',
          'Community driven',
          'Transparent code',
        ],
      },
      ctaTitle: 'Ready to get started?',
      ctaDescription:
        'Download Fluxby and take control of your finances today.',
      ctaButton: 'Get started',
    },
    pricingTitle: 'Pricing',
    pricingPage: {
      intro:
        'Fluxby is and will remain completely free. No hidden costs, no premium version, no subscription.',
      freeTitle: 'Free',
      freeSubtitle: 'Forever',
      perMonth: 'month',
      feature1: 'Unlimited transaction imports',
      feature2: 'All analytics and charts',
      feature3: 'Budget tracking and goals',
      feature4: 'Multiple bank accounts',
      feature5: 'Address book functionality',
      feature6: 'Export to JSON/CSV',
      feature7: 'Dark mode',
      feature8: 'Future updates',
      whyFreeTitle: 'Why free?',
      whyFreeText:
        "Fluxby is built with the belief that everyone should have access to good financial tools. Because all data stays local and we don't run servers, we have no ongoing costs. This makes it possible to offer Fluxby for free forever.",
      promiseTitle: 'Our promise',
      promiseText:
        'There will be no premium version. There will be no subscription. There will be no "pro" features behind a paywall. Everything we build remains free for everyone.',
      coffeeTitle: 'Buy a coffee',
      coffeeDescription:
        'Do you appreciate Fluxby? A cup of coffee is always welcome!',
      contributeTitle: 'Help develop',
      contributeDescription:
        'Contribute to the code or request new features on GitHub.',
    },
    updatesTitle: 'Updates',
    updatesPage: {
      intro:
        "See what's new in Fluxby. Here you'll find all updates and new features.",
      v100Date: 'January 03, 2026',
      v100Title: 'First release',
      v100Description:
        "The first official version of Fluxby is live! Here's everything that's in it:",
      f1Title: 'CSV Import',
      f1Desc:
        'Easily import your bank transactions via CSV export from your bank. Currently ING is supported, with more banks coming in the future.',
      f2Title: 'Dashboard & Analytics',
      f2Desc:
        'Get immediate insight into your finances with a clear dashboard. View your income, expenses, and trends in beautiful interactive charts.',
      f3Title: 'Smart categorization',
      f3Desc:
        'Transactions are automatically categorized. You can also create custom categories with custom colors and icons.',
      f4Title: 'Budget tracking',
      f4Desc:
        'Set monthly budgets per category and track your progress. Get a visual overview of how much you can still spend.',
      f5Title: 'Multiple accounts',
      f5Desc:
        'Manage all your bank accounts in one place. Checking account, savings account, credit card - all combined in one overview.',
      f6Title: 'Address book',
      f6Desc:
        'Link transactions to contacts and see how much you spend at specific stores or with specific people. Automatic suggestions make it easy.',
      f7Title: '100% Privacy',
      f7Desc:
        'All your data stays local on your device. No cloud, no accounts, no tracking. Your financial data is yours alone.',
      f8Title: 'AI-powered recognition',
      f8Desc:
        'Local AI helps recognize and categorize transactions without sharing your data with external services.',
      f9Title: 'Dark mode',
      f9Desc:
        'Work in the mode that suits you. Easily switch between light and dark themes.',
      f10Title: 'Dutch & English',
      f10Desc:
        'Fully translated interface in Dutch and English. Switch whenever you want.',
      f11Title: 'Export functionality',
      f11Desc:
        'Export your data to JSON or CSV format. Create backups whenever you want for peace of mind.',
      f12Title: 'Developer API',
      f12Desc:
        'Full REST API documentation for developers who want to integrate or extend. Swagger UI included.',
      comingSoonTitle: 'More updates coming soon',
      comingSoonText:
        "We're continuously working on new features and improvements. Keep an eye on this page!",
    },
    aboutTitle: 'About Fluxby',
    aboutPage: {
      heroStats: {
        developer: '1 developer',
        weeks: '2.5 weeks',
        models: '4 LLM models',
        prompts: '~375 prompts',
        codeLines: '0 lines of code',
        cost: '$30 total cost',
      },
      intro: {
        title: 'The Story of Fluxby',
        content:
          "This is the only human written piece of content in this whole project. Everything else you see, from stunning visual designs to content, documentation, and every single line of code, came from AI prompts. This is not just an app, it's proof that AI has become capable enough to work alongside a developer to build a complete, professional application without the developer writing any code themselves. I was on my Christmas break and wanted to do an experiment where I didn't want to write code the traditional way. No coding from me. Just prompts, feedback, and watching an AI turn ideas into reality.",
      },
      background: {
        title: 'Why I Did This',
        content1:
          "I'm a frontend developer and I love coding. But this year AI has been playing an increasingly critical role in my development work, and my interest shifted towards actually leveraging it fully. When I got access to Claude Opus 4.5 at the beginning of December 2025, I was genuinely blown away by the output, this was different from anything I'd used before. The quality of the generated code, the architectural suggestions, and the way it understood complex problems was truly impressive.",
        content2:
          "So far I'd worked with decent models, but we always needed 'instructions' and constraints to keep them on track. I could delegate the simple, dull, boring tasks but the real, hard, creative work always needed my full attention. This fundamentally changed with Claude Opus. Suddenly I could present complex architectural problems and get them solved in just a few prompts. The quality jumped dramatically.",
      },
      experiment: {
        title: 'The Big Experiment',
        content:
          "During my Christmas break I decided to give the model a real test drive. The idea was beautifully simple: I wanted to build a small app that would actually be helpful for me and my wife, without writing any code myself. So I would 'vibe code', build the entire app without worrying about how the code looked, but obsessing over how the interface felt and how everything worked for the user. No concerns about code quality, architectural patterns, or best practices. Just focus on: does it work, does it look good, does it feel right?",
        goal: 'The goal became to create a fully professional, well-working financial app that my wife and I would actually use together in our daily lives all without me writing a single line of code myself.',
      },
      features: {
        title: 'The Amazing Features',
        categorization: {
          title: 'Smart Categorization with Rules',
          content:
            'I asked for a nice category structure with subcategories for personal finance. The answer? An elegant rule-based system where you can add keywords that automatically categorize transactions. Simple yet powerful in its implementation. Now you can say "whenever I see ALBERT HEIJN in the transaction name, automatically categorize it as groceries" and boom, it works forever. The LLM understood this needed to be a repeatable operation and built everything so you could manage it easily.',
        },
        addressBook: {
          title: 'Smart Address Book with IBAN Tracking',
          content:
            "An incredibly smart address book. If it could connect an IBAN to a name, it automatically added it to your contacts. Even cooler: it noticed payment providers in transaction names (via Mollie, via Buckaroo, etc.) and suggested smart rules to strip these providers out of transaction names automatically. That's the kind of intelligence I wanted to see - not just writing code, but understanding the problem and proactively suggesting solutions.",
        },
        sharedIban: {
          title: 'Shared IBANs (The Funny Edge Case)',
          content:
            'Something funny and complicated happened here. Payment processors use a shared IBAN where they handle routing money to the correct merchant. So suddenly we had both Lidl and H&M for the same IBAN, which was confusing. The model understood the problem and suggested a shared IBAN interface where you could choose to merge them (same merchant, different spellings) or split them (different merchants using the same provider). This is exactly the kind of complex UX problem you want to see an AI discover and offer solutions for.',
        },
        multiTenancy: {
          title: 'Multi-Account Tracking',
          content:
            'Track multiple accounts in one app. Your personal account, a shared household budget account, maybe even a business account, all in Fluxby. This is what multi-tenancy means, support for multiple separate "workspaces" in the same application. With one plan, all views and endpoints were updated to correctly account for which profile/account you were logged in as. The LLM had to understand this was a fundamental feature that needed to work throughout the entire system.',
        },
      },
      challenges: {
        title: 'The Real Challenges',
        ui: {
          title: '😅 UI Inconsistency Everywhere',
          content:
            "A common thread through this whole project was inconsistent UI design. I'd get 3 different badge styles in the same app, different button implementations, hover effects that didn't match. Sometimes a delete button would be red, sometimes orange. Sometimes a badge had an icon, sometimes text-only. This genuinely frustrated me because I work a lot with design systems and this definitely wouldn't pass our design rules. In hindsight, I could have specified a design system in my prompt, but I wanted to test the LLM's UI capabilities. This cost me ~100 prompts to make every view correct, consistent, and beautiful. Important lesson: AI can code but following and consistently applying design systems? That's much harder.",
        },
        addressBookBugs: {
          title: '🐛 Address Book Edge Cases',
          content:
            "This was absolutely the hardest feature. I kept encountering bugs and weird edge cases I didn't expect. I think I spent 50-70 prompts on this feature, which is about 20% of all my prompts. And honestly, I still can't guarantee it's 100% bug-free. The combination of payment providers, shared IBANs, merchant variations, different spellings of the same business... it was complex. The LLM struggled with it, I had to keep explaining edge cases, and fixes on one side created problems on the other.",
        },
        darkMode: {
          title: '🌙 Dark Mode Everywhere',
          content:
            "Adding dark mode to everything at once? Bad idea. So I did it per section (frontend, landing page, docs, help center). But the LLM really struggled with correctly adjusting color values for dark mode. It kept saying everything was implemented, that dark mode was complete, but when I toggled it on and off nothing changed. The darkMode context existed, the classNames were there, but somewhere the logic failed. Eventually I had to rebuild dark mode from scratch. Sometimes it's just easier to do it yourself... but I wasn't allowed to according to this experiment's rules.",
        },
      },
      polish: {
        title: 'The Beautiful Polish ✨',
        landing:
          'Once the branding was finally locked in, I asked for a stunning, modern landing page. A few prompts later and we had an incredibly beautiful one-pager that really showcases the app well. With hero section, features, screenshots, testimonials, CTA buttons, everything you need.',
        docs: 'I asked for Swagger/OpenAPI docs for literally all 30+ endpoints and based on those, create professional developer documentation like Stripe has. Complete with interactive examples, request/response examples, and side navigation. This was complex because the LLM had to understand what good dev docs are and keep a consistent format.',
        onboarding:
          'A complete, immersive onboarding experience where every feature is gently explained to new users, complete with progress tracking so you always know where you are in the tutorial. This needed to feel intuitive and not overwhelming.',
        mascot:
          'I brainstormed about a name, which would be Fluxby! Then I asked to create a mascot with a single goal: fluffy, approachable, and cute. Something that makes finance less serious and intimidating. Then I made it breathe, follow your cursor with its eyes, and added fun animations. It really feels like a companion.',
      },
      costs: {
        title: 'The Budget 💰',
        content:
          'I quickly hit my premium request limit in my GitHub Copilot subscription. This was because Claude Opus has a 3x multiplier, every Opus prompt counts as 3 requests towards your limit. To continue the experiment, I set a budget of $25 to allow additional premium credits to be used and developed a smart strategy for which model to use when. This was strategic resource management instead of just blindly burning money. In the end I spent around $30 (subscription costs and additional request costs) total on LLM costs for the entire project, which is insanely cheap for a full application.',
        strategy: {
          free: "Small refactors or content changes → free models (Grok Code Fast 1, Raptor mini) because they're  good enough for small tasks",
          gemini:
            'Bigger changes in existing code → Google Gemini 3 Pro because it offers a great balance between price and performance for mid-sized tasks',
          opus: "Complex architectural changes or when Gemini failed → Claude Opus 4.5 because it's the most capable and best model",
        },
      },
      improvements: {
        title: 'What Could Be Better (And Will Be)',
        items: [
          'Accessibility (a11y) - lots of improvements possible, not everything is WCAG 2.1 AA compliant right now',
          'UI consistency across the board - badges, buttons, and spacing could be more uniform',
          "Refactor shared database logic - there's a lot of duplication we could consolidate",
          'E2E tests - real testers found bugs that automated tests should have caught',
          'Performance optimizations - some charts are slow to load, especially with lots of data',
          'Better edge case handling in the categorization engine - more test cases needed',
        ],
      },
      conclusion: {
        title: 'The End (And The Beginning)',
        paragraphs: [
          "So here we are, about 375 prompts and 2.5 weeks later. A professional-looking, well-working financial application with features I didn't even plan for initially, all built by AI based on my prompts, feedback, and continuous iterations. The underlying rule was that I couldn't write or fix code myself, I had to truly use this experiment as a test of AI's capabilities.",
          'More than that, I literally never looked at the codebase. I only used the chat interface and accepted (or suggested changes to) every modification the model proposed. This was important because it forces you to really use the model as an "AI developer" instead of as a helpful tool.',
          'This experiment proves that AI is now genuinely capable for real-world applications. Not for everything, edge cases are still tricky, bugs in edge cases seem to occur more often than I expected, and following design systems consistently is harder than I thought. But for most of the work? Absolutely yes. A single developer can now truly build production-ready applications faster by partnering with AI.',
          'The future genuinely looks exciting. If you\'d told me a year ago that I could build a complete financial app in two weeks without writing any code myself, I wouldn\'t have believed you. Yet it happened. The question is no longer "can AI build software?" but rather "how do we most effectively build with AI?" and "what problems can we now solve that were previously too expensive to tackle?"',
        ],
      },
      exploreMore: {
        title: 'Explore More',
        app: {
          title: 'Try Fluxby Now',
          description:
            'See the magic for yourself! Dive into the app and experience what AI-powered finance management feels like.',
        },
        docs: {
          title: 'Developer Docs',
          description:
            'For developers who want to build with Fluxby. Full API documentation, examples, and integration guides.',
        },
        help: {
          title: 'Help Center',
          description:
            'Discover all the possibilities! Guides, tips, and everything you need to get the most out of Fluxby.',
        },
        github: {
          title: 'Contribute on GitHub',
          description:
            'Help make Fluxby even better! Report bugs, suggest features, or contribute code to the project.',
        },
      },
      personalMessage: {
        text: "I hope you enjoy using Fluxby as much as I enjoyed building it! Go check out the demo — I've made sure there's a fully working demo profile available for you to test everything out! 🚀",
        signature: 'Houke',
      },
    },
  },
  errors: {
    notFound: 'Page not found',
    notFoundDescription:
      "The page you're looking for doesn't exist or has been moved.",
    goHome: 'Go to homepage',
    goBack: 'Go back',
  },
  // Screenshot animation translations
  animations: {
    dashboard: {
      total: 'total',
      categories: {
        supermarkt: 'Groceries',
        restaurant: 'Dining',
        brandstof: 'Fuel',
        energie: 'Energy',
        streaming: 'Streaming',
        transport: 'Transport',
      },
    },
    transactions: {
      date: 'Dec',
      income: 'Income',
      categories: {
        supermarkt: 'Groceries',
        inkomen: 'Income',
        brandstof: 'Fuel',
        streaming: 'Streaming',
        restaurant: 'Dining',
        energie: 'Energy',
        transport: 'Transport',
        inrichting: 'Furniture',
        drogisterij: 'Drugstore',
      },
    },
    budgets: {
      leftThisMonth: 'left this month',
      spent: 'Spent',
      budget: 'Budget',
      remaining: 'remaining',
      overBudget: 'over budget!',
      categories: {
        boodschappen: 'Groceries',
        uiteten: 'Dining out',
        brandstof: 'Fuel',
        streaming: 'Streaming',
      },
    },
    categories: {
      groups: {
        wonen: 'Housing & Living',
        huishouden: 'Household & Groceries',
        vervoer: 'Transport & Travel',
        eten: 'Food & Drinks',
      },
      subcategories: {
        huur: 'Rent & Mortgage',
        energie: 'Energy & Water',
        inrichting: 'Furniture & Garden',
        supermarkt: 'Groceries',
        drogisterij: 'Drugstore',
        huisdieren: 'Pets',
        brandstof: 'Fuel & Charging',
        ov: 'Public Transport',
        parkeren: 'Parking & Taxi',
        restaurant: 'Restaurant',
        bezorging: 'Delivery',
        koffie: 'Coffee & Snacks',
      },
    },
    analytics: {
      title: 'Spending by category',
      month: 'December',
      total: 'Total spent',
      income: 'Income',
      expenses: 'Expenses',
    },
    import: {
      dropzone: 'Drop your CSV file here',
      or: 'or',
      browse: 'browse',
      uploading: 'Uploading...',
      processing: 'Processing...',
      detecting: 'Detecting duplicates...',
      importing: 'Importing',
      done: 'Import complete!',
      transactionsImported: 'transactions imported',
      dragHint: 'Drag your ING CSV file here',
    },
  },
};
