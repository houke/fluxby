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
      'Make money management fun with your own digital mascotte. Track expenses, set goals, and get better insights into your spending! Completely free forever.',
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
        title: 'Device sync',
        description:
          'Sync your data across devices on the same network. Peer-to-peer sync means your data travels directly between your devices - no cloud required.',
      },
      {
        title: 'Bank CSV import',
        description:
          'Simply export transactions from your bank and import them into Fluxby. Works with multiple banks.',
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
        title: 'Subscription tracker',
        description:
          'Keep track of all your recurring payments. Fluxby automatically detects your subscriptions and alerts you to price changes.',
        features: [
          'Automatic detection',
          'Price change alerts',
          'Monthly overview',
        ],
      },
      {
        title: 'Easy CSV import',
        description:
          'Import your bank transactions in seconds. Simply drag and drop your CSV export and Fluxby handles the rest.',
        features: [
          'Drag & drop upload',
          'Multiple bank support',
          'Duplicate detection',
        ],
      },
      {
        title: 'Device sync',
        description:
          'Keep your data in sync across all your devices. Peer-to-peer sync means your data travels directly between devices - no cloud required.',
        features: [
          'Direct device-to-device sync',
          'End-to-end encrypted',
          'Works on local network',
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
  downloads: {
    title: 'Download Fluxby',
    description:
      'Choose your platform and start visualizing your finances immediately. Everything stays 100% local on your own device.',
    mac: {
      name: 'macOS',
      description: 'Native experience for Apple Silicon & Intel Macs.',
      aarchLabel: 'Apple Silicon',
      x64Label: 'Intel',
    },
    windows: {
      name: 'Windows',
      description: 'Easy installer for Windows 10 & 11.',
      label: 'Download',
    },
    linux: {
      name: 'Linux',
      description: 'Standalone AppImage for all distributions.',
      label: 'Download',
    },
    pwa: {
      name: 'Browser (PWA)',
      description:
        'Install directly from your browser. No download needed, works offline.',
      installButton: 'Install as app',
      installedBadge: 'Installed',
      browserInstructions: {
        ios: 'Tap the Share icon and then "Add to Home Screen"',
        android: 'Tap the menu (⋮) and then "Add to Home Screen"',
        desktop: 'Click the install icon in the address bar',
      },
    },
    note: "You don't need to install anything to use Fluxby — it runs fully in your browser. These downloads are provided for users who prefer a dedicated application on their system.",
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
      subscriptions: 'Subscriptions',
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
      subtitle: 'Learn how to authenticate your API requests with Fluxby.',
      localNote: 'Local development',
      localNoteText:
        'Fluxby runs entirely on your local machine. No API keys or OAuth flows are needed - just add your Profile ID to requests.',
      profileIdTitle: 'Using the Profile ID',
      profileIdText:
        'All API requests must include the X-Profile-ID header. This identifies which profile data you want to access.',
      getProfileIdTitle: 'Getting your Profile ID',
      option1Title: 'Option 1: From the App',
      option1Text:
        'Open Fluxby in your browser, go to Settings → Profile, and copy your Profile ID.',
      option2Title: 'Option 2: API Call',
      option2Text: 'List all profiles via the profiles endpoint:',
      errorHandlingTitle: 'Missing Profile ID',
      errorHandlingText:
        'If you do not include the X-Profile-ID header, you will receive a 401 error:',
      errorResponse: 'Error Response',
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
      securityTitle: 'Privacy Lock & Security',
      securityText:
        'Your data is protected by a PIN/password lock. The password is verified via PBKDF2 (100k iterations). All data stays local in your browser - it is never sent to external servers.',
      privacyNote:
        'Note: The password protects access to your data through the UI. The database itself is stored unencrypted in OPFS. For shoulder-surfing protection and casual access prevention.',
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
        'You can create backups at any time. Backups contain your complete database and can be restored on any device.',
      backupDesktop: 'File → Save backup... exports to your Documents folder',
      backupWeb: 'Settings → Backup downloads a .fluxby file',
      backupFormat: '.fluxby files contain metadata + database dump',
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
        'Manage multiple financial profiles for different purposes - personal, business or project-based tracking.',
      useCaseTitle: 'Use cases',
      useCase1: 'Separate personal and business finances',
      useCase2: 'Track expenses for specific projects',
      useCase3: 'Manage finances for multiple family members',
      howItWorksTitle: 'How Multi-Tenancy works',
      howItWorksText:
        'Each profile acts as a completely isolated environment. Transactions, categories, budgets and analytics are all tied to a specific profile.',
      isolation: 'Data Isolation',
      isolationDesc:
        'Each profile has its own transactions, categories and budgets.',
      switching: 'Easy Switching',
      switchingDesc:
        'Switch between profiles by adjusting the X-Profile-ID header.',
      customization: 'Full Customization',
      customizationDesc:
        'Each profile can have different categories, budgets and settings.',
      listProfilesTitle: 'Fetch Profiles',
      listProfilesText: 'Fetch all profiles to see what is available:',
      createProfileTitle: 'Create Profile',
      createProfileText:
        'Create a new profile with a name and type (personal or business):',
      profileTypesTitle: 'Profile Types',
      tableType: 'Type',
      tableDescription: 'Description',
      personalDesc:
        'For tracking personal finances, household expenses and savings goals.',
      businessDesc:
        'For freelance income, business expenses and project-based tracking.',
      whatIsProfileTitle: 'What is a Profile?',
      whatIsProfileText:
        'A profile in Fluxby acts as a completely isolated financial environment. You can use profiles to:',
      useCases: [
        'Keep personal and business finances separate',
        'Manage finances for different family members',
        'Test hypothetical budgets or planning scenarios',
      ],
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
        'Manage bank accounts and track balances across all your financial accounts.',
      listTitle: 'Fetch accounts',
      listText: 'Retrieve all accounts for the current profile:',
      createTitle: 'Create account',
      createText: 'Add a new bank account:',
      requestBody: 'Request body',
      tableField: 'Field',
      tableType: 'Type',
      tableRequired: 'Required',
      tableDescription: 'Description',
      nameDesc: 'Display name for the account',
      typeDesc: 'checking, savings or credit',
      ibanDesc: 'IBAN of the account',
      balanceDesc: 'Starting balance (default: 0)',
      deleteTitle: 'Delete account',
      deleteText:
        'Remove an account. Transactions linked to this account will be preserved but unlinked.',
      deleteAllTitle: 'Delete all accounts',
      deleteAllText:
        'Remove all accounts for the current profile. All transactions will be preserved but unlinked from their accounts.',
      noteTitle: 'Note',
      noteText:
        'Both delete endpoints preserve transactions by setting their account_id to NULL. Transactions remain accessible but are no longer linked to an account.',
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
    },
    // Transactions page
    transactions: {
      title: 'Transactions',
      subtitle:
        'Search, filter and manage your financial transactions. Import from bank exports or create manually.',
      listTitle: 'Fetch transactions',
      listText: 'Retrieve transactions with powerful filtering options:',
      queryParams: 'Query parameters',
      startDateDesc: 'Filter from this date (YYYY-MM-DD)',
      endDateDesc: 'Filter until this date (YYYY-MM-DD)',
      categoryDesc: 'Filter by category ID or name',
      typeDesc: 'income or expense',
      searchDesc: 'Search in description and counterparty',
      limitDesc: 'Number of results (default: 50, max: 500)',
      pageDesc: 'Page number for pagination',
      updateTitle: 'Update transaction',
      updateText:
        'Change a transaction to update its category, add notes, or update other fields:',
      importTitle: 'Import from CSV',
      importText: 'Bulk import transactions from your bank export:',
      supportedBanks: 'Supported banks',
      supportedBanksText:
        'Currently ING and ASN Bank CSV exports are supported. More banks will be added in future updates.',
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
    },
    // Categories page
    categories: {
      title: 'Categories',
      subtitle:
        'Organize your transactions with custom categories. Set colors, icons and automatic categorization rules.',
      listTitle: 'Fetch categories',
      listText: 'Retrieve all categories with transaction counts:',
      createTitle: 'Create category',
      createText: 'Add a new category with custom style:',
      requestBody: 'Request body',
      nameDesc: 'Display name of the category',
      colorDesc: 'Hex color code (e.g., #22c55e)',
      iconDesc: 'Emoji icon for the category',
      typeDesc: 'income or expense',
      updateTitle: 'Update category',
      updateText: 'Modify an existing category:',
      deleteTitle: 'Delete category',
      deleteText: 'Remove a category. Transactions will become uncategorized:',
      autoCategorizationTitle: 'Auto-categorization',
      autoCategorizationText:
        'Fluxby can automatically categorize transactions based on rules you define. Set up rules via the app under Categories → Rules, or use the API for custom automation.',
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
        'Set spending limits and track your progress. Receive notifications when you approach or exceed budget limits.',
      listTitle: 'Fetch budgets',
      listText: 'Retrieve all budgets with current spending progress:',
      progressNote: 'Track progress',
      progressNoteText:
        'The API automatically calculates the spent amount, remaining budget and percentage for each budget period.',
      createTitle: 'Create budget',
      createText: 'Set a new budget with a spending limit:',
      requestBody: 'Request body',
      nameDesc: 'Display name of the budget',
      amountDesc: 'Budget limit in euros',
      categoryIdDesc: 'Link to a specific category',
      periodDesc: 'weekly, monthly or yearly',
      updateTitle: 'Update budget',
      updateText: 'Modify a budget limit or settings:',
      deleteTitle: 'Delete budget',
      deleteText: 'Remove a budget:',
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
    // Subscriptions page
    subscriptions: {
      title: 'Subscriptions',
      subtitle:
        'Detect and manage recurring payments automatically. Get insights into your monthly fixed costs.',
      detectionNote: 'Automatic detection',
      detectionNoteText:
        'Fluxby analyzes your transaction history and automatically detects recurring patterns. Patterns are detected when the same merchant appears at least 3 times with regular intervals.',
      objectTitle: 'The Pattern Object',
      objectText:
        'A recurring pattern represents a detected subscription or recurring payment.',
      fields: {
        id: 'Unique identifier',
        merchantName: 'Merchant name',
        patternType: 'weekly, biweekly, monthly, quarterly, yearly',
        avgAmount: 'Average amount (negative for expenses)',
        lastAmount: 'Last charged amount',
        nextExpectedDate: 'Expected next charge date',
        isConfirmed: 'Whether the pattern is confirmed by the user',
        isVariable: 'Whether the amount varies (>10% deviation)',
        transactionCount: 'Number of times this pattern was detected',
      },
      listTitle: 'Fetch patterns',
      listText: 'Retrieve all detected recurring patterns:',
      params: {
        activeOnly: 'Active patterns only (default: true)',
        startDate: 'Start date',
        endDate: 'End date',
      },
      statsTitle: 'Fetch statistics',
      statsText: 'Get an overview of your recurring costs:',
      calendarTitle: 'Expected payments',
      calendarText: 'Fetch expected payments for a date range:',
      detectTitle: 'Detect patterns',
      detectText: 'Run pattern detection on your transaction history:',
      detectNote: 'Detection criteria',
      detectCriteria: {
        minTransactions: 'Minimum 3 transactions from the same merchant',
        minSpan: 'Transactions must span at least 2 months',
        consistency: 'Consistent intervals (±3 days tolerance)',
      },
      actionsTitle: 'Manage patterns',
      actionsText:
        'Confirm patterns as real subscriptions or dismiss false positives:',
      confirmTitle: 'Confirm pattern',
      dismissTitle: 'Dismiss pattern',
      deleteTitle: 'Delete pattern',
      patternTypesTitle: 'Pattern types',
      patternTypesText: 'Fluxby detects the following patterns:',
      intervalColumn: 'Interval',
      exampleColumn: 'Example',
      days: 'days',
      examples: {
        weekly: 'Weekly groceries',
        biweekly: 'Biweekly salary',
        monthly: 'Netflix, Spotify, rent',
        quarterly: 'Quarterly subscription',
        yearly: 'Annual subscription, insurance',
      },
      endpointsTitle: 'All Endpoints',
      endpoints: {
        list: 'List all patterns',
        stats: 'Fetch statistics',
        calendar: 'Fetch expected payments',
        detect: 'Run pattern detection',
        confirm: 'Confirm a pattern',
        dismiss: 'Dismiss a pattern',
        delete: 'Delete a pattern',
      },
    },
    // Analytics page
    analytics: {
      title: 'Analytics',
      subtitle:
        'Get insights into your spending patterns with extensive analytics endpoints.',
      dashboardTitle: 'Dashboard statistics',
      dashboardText: 'Get an overview of your financial health:',
      monthlyTitle: 'Monthly data',
      monthlyText: 'Fetch detailed monthly stats with daily breakdown:',
      queryParams: 'Query parameters',
      yearDesc: 'Year (e.g., 2024)',
      monthDesc: 'Month (1-12)',
      categoriesTitle: 'Category breakdown',
      categoriesText: 'See how spending is distributed across categories:',
      tipTitle: 'Pro tip',
      tipText:
        'Combine analytics endpoints with transaction filters to create custom reports. For example, compare spending between months or track category trends over time.',
      endpointsTitle: 'Analytics Endpoints',
      endpoints: {
        dashboard: 'Dashboard statistics overview',
        monthly: 'Monthly breakdown',
        categories: 'Spending by category',
        trends: 'Income/expense trends',
      },
      dashboardFieldsTitle: 'Response Fields',
      dashboardFields: {
        totalIncome: 'Total income in period',
        totalExpenses: 'Total expenses in period',
        balance: 'Net balance (income - expenses)',
        transactionCount: 'Number of transactions',
        topCategories: 'Top spending categories',
      },
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
      listTitle: 'Fetch contacts',
      listText:
        'Retrieve all contacts with transaction statistics. Supports filtering and sorting.',
      createTitle: 'Create contact',
      createText:
        'Manually create a new address book contact. Transactions will be automatically linked.',
      cleanupRulesTitle: 'Name cleanup rules',
      cleanupRulesText:
        'Create rules to automatically clean up messy bank names. Rules can use literal text or regex patterns.',
      sharedIbansTitle: 'Shared IBANs (payment processors)',
      sharedIbansText:
        'Some IBANs are shared by multiple merchants (like iDEAL or PayPal). Mark these as shared to enable merchant-level contact tracking.',
      sharedIbansNote: 'Why shared IBANs?',
      sharedIbansExplanation:
        'Payment processors like iDEAL, Mollie and PayPal use one IBAN for thousands of different merchants. By marking these as shared, Fluxby tracks the actual merchant name instead of just the IBAN.',
      mergeTitle: 'Merge & split contacts',
      mergeText:
        'Combine duplicate contacts or split contacts that represent multiple merchants.',
      multiIbanTitle: 'Multi-IBAN contacts',
      multiIbanText:
        'Some contacts (like large companies) can have multiple IBANs. You can link extra IBANs to one contact.',
      objectTitle: 'The contact object',
      endpoints: {
        list: 'List all contacts with transaction stats',
        create: 'Create a new contact',
        get: 'Get contact by ID',
        update: 'Update contact',
        delete: 'Delete contact',
      },
      params: {
        search: 'Search by name or IBAN',
        sortBy:
          'Sort field: name, transactionCount, totalExpenses, lastTransactionDate',
        sortOrder: 'Sort direction: asc or desc',
      },
      cleanupEndpoints: {
        list: 'List all cleanup rules',
        create: 'Create cleanup rule',
        delete: 'Delete cleanup rule',
        apply: 'Apply all rules to contacts',
      },
      sharedEndpoints: {
        list: 'List all shared IBANs',
        create: 'Add shared IBAN',
        delete: 'Remove shared IBAN',
        detect: 'Auto-detect shared IBANs',
      },
      mergeEndpoints: {
        merge: 'Merge contacts into one',
        duplicates: 'Auto-detect and merge duplicates',
        split: 'Split contact into multiple',
      },
      ibanEndpoints: {
        list: 'List IBANs for contact',
        add: 'Add IBAN to contact',
        remove: 'Remove IBAN from contact',
      },
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
    // OpenAPI specification page
    openapi: {
      title: 'OpenAPI Specification',
      subtitle:
        'Download the complete OpenAPI 3.0 specification for the Fluxby API.',
      download: 'Download JSON',
      copy: 'Copy to clipboard',
      openInSwagger: 'Open in Swagger UI',
      howToUse: 'How to use',
      withSwagger: 'With Swagger UI',
      swaggerStep1: 'Go to /api/docs in your browser',
      swaggerStep2: 'Browse all available endpoints',
      swaggerStep3: 'Test endpoints directly in the browser',
      swaggerStep4: 'View request/response examples',
      withPostman: 'With Postman',
      postmanStep1: 'Import the OpenAPI spec into Postman',
      postmanStep2: 'Generate a collection of all endpoints',
      postmanStep3: 'Configure environment variables',
      postmanStep4: 'Test endpoints with auto-generated requests',
      withCode: 'In your code',
      codeDescription:
        'Use the OpenAPI spec to generate client libraries for your favorite programming language.',
      withBruno: 'With Bruno',
      brunoDescription:
        'Bruno is an open-source API client that works perfectly with OpenAPI specs.',
      brunoStep1: 'Import the OpenAPI spec into Bruno',
      brunoStep2: 'Generate a collection of all endpoints',
      brunoStep3: 'Configure environment variables',
      brunoStep4: 'Test endpoints with auto-generated requests',
      downloadBruno: 'Download Bruno',
      viewCollection: 'View Fluxby Collection',
      specPreview: 'OpenAPI Specification Preview',
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
      subscriptions: 'Subscriptions',
      understandAnalytics: 'Understanding analytics',
      security: 'Security & Privacy',
      sync: 'Device sync',
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
    subscriptions: {
      title: 'Managing subscriptions',
      subtitle:
        'Keep track of all your recurring payments and get notified about price changes.',
      whatIsTitle: 'What are subscriptions in Fluxby?',
      whatIsText:
        'Fluxby automatically detects recurring payments in your transactions, such as streaming services, gym memberships, and utilities. You get an overview of all your monthly fixed costs and are warned when prices change.',
      detectionTitle: 'How does automatic detection work?',
      detectionText:
        'When you import transactions, Fluxby analyzes the patterns in your payments. If a payment recurs regularly (weekly, monthly, quarterly, or yearly), it is automatically recognized as a subscription.',
      step1: 'Import your transactions via the Import page',
      step2: 'Fluxby automatically analyzes recurring patterns',
      step3: 'Confirm detected subscriptions or dismiss them',
      step4: 'View your total monthly fixed costs in the overview',
      confirmTitle: 'Confirming or dismissing subscriptions',
      confirmText:
        'Not all detected patterns are actual subscriptions. You can indicate which recurring payments you want to track as subscriptions:',
      confirmButton: 'Confirm',
      confirmButtonText: 'The pattern is added to your active subscriptions',
      dismissButton: 'Dismiss',
      dismissButtonText: 'The pattern is ignored and no longer shown',
      tipTitle: 'Tip',
      tipText:
        'Only confirm actual subscriptions you want to track. This keeps your overview clean and your monthly total accurate.',
      priceAlertsTitle: 'Price change notifications',
      priceAlertsText:
        'Fluxby tracks the amounts of your subscriptions. If a subscription suddenly costs more or less than normal, you get a notification. You can then choose to accept or ignore the new amount.',
      priceIncreaseTitle: 'Price increase',
      priceIncreaseText:
        'A red arrow up indicates that a subscription has become more expensive. This may mean the service has raised its prices.',
      priceDecreaseTitle: 'Price decrease',
      priceDecreaseText:
        'A green arrow down indicates that you paid less than normal. This could be a temporary discount or promotion.',
      monthlyOverviewTitle: 'Monthly overview',
      monthlyOverviewText:
        'At the top of the Subscriptions page, you can see the total amount you spend monthly on subscriptions. This helps you understand your fixed costs and where you might be able to save.',
      bestPracticeTitle: 'Best practice',
      bestPracticeText:
        'Check your subscriptions regularly. Many people pay for services they no longer use. By monitoring your subscriptions, you can easily save money.',
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
    // Help pages - Transactions
    transactions: {
      title: 'Managing transactions',
      subtitle:
        'View, search, filter and categorize your imported transactions.',
      tipTitle: 'Quick tip',
      tipText:
        'Use the search bar and filters to quickly find specific transactions. You can filter by date, category, amount and more.',
      viewingTitle: 'Viewing transactions',
      viewingText:
        'The Transactions page shows all your imported transactions in a clear, sortable table. Each transaction shows:',
      field1: 'Date of the transaction',
      field2: 'Description/counterparty name',
      field3: 'Category (if assigned)',
      field4: 'Amount (income in green, expenses in red)',
      filteringTitle: 'Filtering transactions',
      filteringText: 'Use the filter panel to refine your transactions:',
      dateFilter: 'Date range',
      dateFilterDesc: 'Filter by specific month, year or custom date range.',
      categoryFilter: 'Category',
      categoryFilterDesc: 'Show only transactions from specific categories.',
      typeFilter: 'Transaction type',
      typeFilterDesc: 'Filter by income, expenses or all transactions.',
      searchFilter: 'Search',
      searchFilterDesc: 'Search by description, counterparty name or notes.',
      categorizingTitle: 'Categorizing transactions',
      categorizingText:
        'Click on a transaction to assign or change its category. Fluxby learns from your choices and will auto-categorize similar transactions in the future.',
      bulkTitle: 'Bulk operations',
      bulkText:
        'Select multiple transactions to apply bulk actions like categorizing or deleting.',
    },
    // Help pages - Categories
    categories: {
      title: 'Managing categories',
      subtitle:
        'Organize your transactions with custom categories and auto-categorization rules.',
      whatAreTitle: 'What are categories?',
      whatAreText:
        'Categories help you organize your transactions into meaningful groups like Groceries, Transport, Entertainment, etc. This makes it easier to understand your spending patterns and create budgets.',
      defaultTitle: 'Default categories',
      defaultText:
        'Fluxby comes with a set of pre-configured categories to get you started:',
      createTitle: 'Creating a category',
      createText: 'To create a new category:',
      createStep1: 'Go to Categories page from the sidebar',
      createStep2: 'Click "New Category"',
      createStep3: 'Choose a name, icon and color',
      createStep4: 'Click Save to create your category',
      rulesTitle: 'Auto-categorization rules',
      rulesText:
        'Set up rules to automatically categorize transactions based on keywords. For example, you can create a rule that automatically categorizes any transaction containing "Albert Heijn" as Groceries.',
      rulesTip: 'Pro tip',
      rulesTipText:
        'The more specific your rules, the more accurate the auto-categorization. Use merchant names or specific keywords that appear in your bank transactions.',
    },
    // Help pages - Accounts
    accounts: {
      title: 'Managing accounts',
      subtitle: 'Track multiple bank accounts and view consolidated balances.',
      overviewTitle: 'Accounts overview',
      overviewText:
        'The Accounts page shows all your linked bank accounts with their current balances. You can see at a glance how much money you have across all your accounts.',
      addTitle: 'Adding an account',
      addText:
        'When you import a CSV file from your bank, Fluxby automatically detects the account (IBAN) and creates it if needed. You can also manually add an account:',
      addStep1: 'Go to Settings > Accounts',
      addStep2: 'Click "Add Account"',
      addStep3: 'Enter the account name and IBAN',
      addStep4: 'Click Save to add the account',
      filterTitle: 'Filtering by account',
      filterText:
        'Throughout Fluxby, you can filter transactions by account. Use the account filter dropdown in the header to see transactions from a specific account, or select "All accounts" to see everything combined.',
      noteTitle: 'Note',
      noteText:
        'If you have multiple accounts, import CSV files from all of them to get a complete picture of your finances.',
      balanceTitle: 'Understanding balances',
      balanceText:
        'Account balances are calculated based on your imported transactions. The displayed balance is the sum of all transactions for that account. For the most accurate balance, import all your transactions regularly.',
      deleteTitle: 'Deleting an account',
      deleteText:
        'Deleting an account also removes all transactions associated with that account. This action cannot be undone. Make sure you really want to remove all data for this account before proceeding.',
      warningTitle: 'Warning',
      warningText:
        'Deleting an account permanently removes all its transactions. Consider exporting your data first if you might need it later.',
    },
    // Help pages - Address Book
    addressBook: {
      title: 'Managing address book',
      subtitle:
        'Organize your contacts and improve transaction categorization with automatic name cleanup.',
      tipTitle: 'Quick tip',
      tipText:
        'The address book is automatically populated when you import transactions. Use name cleanup rules to clean up confusing bank names.',
      whatAreTitle: 'What is the address book?',
      whatAreText:
        'The address book automatically stores counterparties from your transactions based on IBAN and name. It helps you organize contacts, clean up messy bank names, and track spending per merchant.',
      featuresTitle: 'Key features',
      autoExtractionTitle: 'Automatic extraction',
      autoExtractionText:
        'When you import CSV files, Fluxby automatically detects unique counterparties and adds them to your address book. This happens based on IBAN numbers and names.',
      nameCleanupTitle: 'Name cleanup',
      nameCleanupText:
        'Many banks add technical information to transaction names (like "via Mollie" or "via Buckaroo"). The address book helps you create automatic rules that remove this information for cleaner names.',
      sharedIbansTitle: 'Shared IBANs',
      sharedIbansText:
        'Some payment providers use shared IBANs for multiple merchants. The address book helps you decide whether to merge these as the same merchant or keep them separate as different businesses.',
      managingTitle: 'Managing contacts',
      managingText:
        'You can manually add contacts, edit existing contacts, or configure name cleanup rules:',
      manage1: 'Click on a contact to view details',
      manage2: 'Use the search bar to find contacts',
      manage3: 'Create name cleanup rules for better categorization',
      manage4: 'View transaction history per contact',
    },
    // Help pages - Analytics
    analytics: {
      title: 'Analytics & insights',
      subtitle:
        'Understand your spending patterns with powerful analytics and visualizations.',
      dashboardTitle: 'Dashboard overview',
      dashboardText:
        'The dashboard gives you a quick overview of your finances. View your total balance, monthly spending and recent transactions at a glance.',
      categoriesTitle: 'Category breakdown',
      categoriesText:
        'The category breakdown shows how your spending is distributed across different categories. Use the pie chart to quickly see where most of your money is going.',
      pieChartTitle: 'Pie chart',
      pieChartText:
        'Visual breakdown of spending per category. Click on a segment to see transactions in that category.',
      barChartTitle: 'Bar chart',
      barChartText:
        'Compare spending amounts per category. Ideal for identifying your biggest spending areas.',
      trendsTitle: 'Monthly trends',
      trendsText:
        'Track how your spending changes over time with monthly trend charts. Compare income to expenses per month to understand your financial development.',
      filtersTitle: 'Using filters',
      filtersText:
        'All analytics can be filtered by date range and account. Use the filter options to focus on specific periods or accounts.',
      filter1:
        'Select a date range: This month, Last 3 months, This year or custom range',
      filter2: 'Filter by account to see analytics for a specific bank account',
      filter3: 'Combine filters to get exactly the view you need',
      tipTitle: 'Pro tip',
      tipText:
        'Compare the same month across different years to account for seasonal spending patterns like holidays or vacations.',
      exportTitle: 'Exporting data',
      exportText:
        'Export your analytics data for use in other applications or for record keeping.',
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
      subscriptions: {
        title: 'Subscriptions',
        monthly: 'Monthly',
        netflix: 'Netflix',
        spotify: 'Spotify',
        gym: 'Gym membership',
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
          'Easily export transactions from your bank and import them into Fluxby. Works with multiple banks.',
        highlights: [
          'Multiple banks support',
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
      peer2peer: {
        title: 'Peer-to-peer sync',
        description:
          'Sync your data securely between devices without a cloud server. Your devices talk directly to each other.',
        highlights: [
          'End-to-end encryption',
          'No central server',
          'Sync across devices',
        ],
      },
      multiProfile: {
        title: 'Multiple profiles',
        description:
          'Create separate profiles for personal, business, or family finances. Keep everything organized but separate.',
        highlights: ['Separate workspaces', 'Easy switching', 'Isolated data'],
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
      v171Date: 'January 22, 2026',
      v171Title: 'Release 1.7.1',
      v171Description: '3 bug fixes.',
      v171F1Title: 'Enable macOS updater support and fix build warnings',
      v171F1Desc: "This shouldn't have happened, but it's fixed now!",
      v171F2Title: 'Web app improvements',
      v171F2Desc: '2 bug fixes. Check the release on GitHub!',
      v170Date: 'January 19, 2026',
      v170Title: 'Release 1.7.0',
      v170Description: '2 new features and 10 bug fixes.',
      v170F1Title: 'Sticky Y-axis to all charts and improve formatting',
      v170F1Desc: "There's more to explore. Discover it yourself!",
      v170F2Title: 'Require 180-day span for 6 transactions',
      v170F2Desc: "There's more to explore. Discover it yourself!",
      v170F3Title: 'Bug fixes',
      v170F3Desc: '10 bugs fixed. See changelog for details.',
      v160Date: 'January 17, 2026',
      v160Title: 'Release 1.6.0',
      v160Description: '6 new features and 24 bug fixes.',
      v160F1Title: 'analytics improvements',
      v160F1Desc: '2 new features. Check the release on GitHub!',
      v160F2Title: 'New web app capabilities',
      v160F2Desc: '3 new features. Check the release on GitHub!',
      v160F3Title: 'Smart amount clustering for multi-tier patterns',
      v160F3Desc: 'This makes Fluxby even better.',
      v160F4Title: 'Bug fixes',
      v160F4Desc: '24 bugs fixed. See changelog for details.',
      v151Date: 'January 14, 2026',
      v151Title: 'Release 1.5.1',
      v151Description: '3 bug fixes.',
      v151F1Title: 'Better web experience',
      v151F1Desc: '2 bug fixes. Check the release on GitHub!',
      v151F2Title:
        'Switch to universal macOS binary and remove redundant artifacts',
      v151F2Desc: "This shouldn't have happened, but it's fixed now!",
      v150Date: 'January 11, 2026',
      v150Title: 'Release 1.5.0',
      v150Description: '2 new features.',
      v150F1Title: 'sync improvements',
      v150F1Desc: '2 new features. Check the release on GitHub!',
      v142Date: 'January 11, 2026',
      v142Title: 'Release 1.4.2',
      v142Description: '1 bug fix.',
      v142F1Title: 'P2P sync UX and fix connection issues',
      v142F1Desc: 'An annoying issue has been squashed.',
      v141Date: 'January 11, 2026',
      v141Title: 'Release 1.4.1',
      v141Description: '1 bug fix.',
      v141F1Title: 'Resolve build failure due to missing imports',
      v141F1Desc: "This shouldn't have happened, but it's fixed now!",
      v140Date: 'January 11, 2026',
      v140Title: 'Release 1.4.0',
      v140Description: '29 new features and 32 bug fixes.',
      v140F1Title: 'New web app capabilities',
      v140F1Desc:
        '18 new capabilities to discover. Check out the release notes!',
      v140F2Title: 'Menu items and improve P2P sync reliability',
      v140F2Desc: 'This makes Fluxby even better.',
      v140F3Title: 'In-app update mechanism via GitHub releases',
      v140F3Desc: 'New functionality that actually helps.',
      v140F4Title: 'Extended data functionality',
      v140F4Desc:
        '4 new capabilities to discover. Check out the release notes!',
      v140F5Title: 'Recurring transaction seeding and demo data',
      v140F5Desc: 'New functionality that actually helps.',
      v140F6Title: 'subscriptions improvements',
      v140F6Desc: '2 new features. Check the release on GitHub!',
      v140F7Title: 'Make spotlight search keywords translatable',
      v140F7Desc:
        "We've got something new for you! Check the release notes for all details.",
      v140F8Title: 'Automatic migration prompt for version updates',
      v140F8Desc: "There's more to explore. Discover it yourself!",
      v140F9Title: 'Bug fixes',
      v140F9Desc: '32 bugs fixed. See changelog for details.',
      v131Date: 'January 9, 2026',
      v131Title: 'Release 1.3.1',
      v131Description: '3 bug fixes.',
      v131F1Title: 'Release improvements',
      v131F1Desc: '2 bug fixes. Check the release on GitHub!',
      v131F2Title: 'Restore `useLanguage` import and add `BarChart3` icon',
      v131F2Desc: 'Bugs eliminated, app improved.',
      v130Date: 'January 8, 2026',
      v130Title: 'Release 1.3.0',
      v130Description: '10 new features and 15 bug fixes.',
      v130F1Title: 'Web app extensions',
      v130F1Desc:
        '7 new capabilities to discover. Check out the release notes!',
      v130F2Title: 'File-based migration system and centralized logger',
      v130F2Desc: 'This makes Fluxby even better.',
      v130F3Title: 'Device sync screenshot section with animation',
      v130F3Desc: "There's more to explore. Discover it yourself!",
      v130F4Title: 'Finalize P2P sync implementation with documentation',
      v130F4Desc: "There's more to explore. Discover it yourself!",
      v130F5Title: 'Bug fixes',
      v130F5Desc: '15 bugs fixed. See changelog for details.',
      viewRelease: 'View release',
      v120Date: 'January 6, 2026',
      v120Title: 'Release 1.2.0',
      v120Description: '7 new features and 15 bug fixes.',
      v120F1Title: 'Various improvements',
      v120F1Desc: '4 new features. See changelog for details.',
      v120F2Title: 'Landing page improvements',
      v120F2Desc: '2 new features. See changelog for details.',
      v120F3Title: 'Add sync database adapter for P2P synchronization',
      v120F3Desc: 'New functionality added.',
      v120F4Title: 'Bug fixes',
      v120F4Desc: '15 bugs fixed. See changelog for details.',
      v110Date: 'January 5, 2026',
      v110Title: 'Release 1.1.0',
      v110Description: '7 new features and 10 bug fixes.',
      v110F1Title: 'Remove Install Fluxby card from app settings',
      v110F1Desc: 'New functionality added.',
      v110F2Title: 'Web app improvements',
      v110F2Desc: '3 new features. See changelog for details.',
      v110F3Title: 'Landing page improvements',
      v110F3Desc: '3 new features. See changelog for details.',
      v110F4Title: 'Bug fixes',
      v110F4Desc: '10 bugs fixed. See changelog for details.',
      v104Date: 'January 4, 2026',
      v104Title: 'Release 1.0.4',
      v104Description: 'New improvements and bug fixes.',
      v103Date: 'January 4, 2026',
      v103Title: 'Release 1.0.3',
      v103Description: '1 bug fix.',
      v103F1Title: 'Sync versions to tauri files and fix duplicate releases',
      v103F1Desc: 'Bug fixed.',
      v102Date: 'January 4, 2026',
      v102Title: 'Release 1.0.2',
      v102Description: '5 bug fixes.',
      v102F1Title: 'Bug fixes',
      v102F1Desc: '5 bugs fixed. See changelog for details.',
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
          "This is the only human written piece of content in this whole project, and even this has been reformatted by AI before it was added to the page. Everything else you see, from stunning visual designs to content, documentation, and every single line of code, came from AI prompts. This is not just an app, it's proof that AI has become capable enough to work alongside a developer to build a complete, professional application without the developer writing any code themselves. I was on my Christmas break and wanted to do an experiment where I didn't want to write code the traditional way. No coding from me. Just prompts, feedback, and watching an AI turn ideas into reality.",
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
    subscriptions: {
      monthlyTotal: 'Monthly total',
      active: 'Active',
      pending: 'Pending',
      frequencies: {
        weekly: 'Weekly',
        biweekly: 'Bi-weekly',
        monthly: 'Monthly',
        quarterly: 'Quarterly',
        yearly: 'Yearly',
      },
      nextPayment: 'Next',
      priceIncrease: 'Price increase detected',
      update: 'Update',
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
    sync: {
      discovering: 'Discovering devices...',
      connecting: 'Connecting...',
      syncing: 'Syncing data...',
      complete: 'Sync complete!',
      device1: 'Laptop',
      device2: 'Phone',
      transactions: 'transactions',
      categories: 'categories',
      p2pEncrypted: 'Peer-to-peer encrypted',
    },
  },
};
