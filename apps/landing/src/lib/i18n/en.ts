// English translations for the Fluxby landing page
import type { LandingTranslationKeys } from './nl';

export const en: LandingTranslationKeys = {
  metadata: {
    default: {
      title: 'Fluxby - Makes money management fun',
      description:
        'Discover Fluxby, the cutest way to manage your finances. Track transactions, budgets, and more with our adorable digital mascot.',
    },
    pages: {
      features: {
        title: 'Features / Fluxby',
        description:
          'Discover why Fluxby is more than just a finance app. Your financial mascot who makes money management delightful and stress-free.',
      },
      pricing: {
        title: 'Pricing / Fluxby',
        description:
          'Fluxby is and remains completely free. No hidden costs, no premium version, no subscription.',
      },
      updates: {
        title: 'Updates / Fluxby',
        description:
          'Stay up to date with the latest developments and improvements in Fluxby.',
      },
      about: {
        title: 'About / Fluxby',
        description:
          '1 developer, 2.5 weeks, 4 LLM models, 375 prompts, 0 lines of code',
      },
      docs: {
        title: 'API Documentation / Fluxby',
        description:
          'Complete API documentation for Fluxby. Learn how to build integrations with our local finance API.',
      },
      help: {
        title: 'Help Center / Fluxby',
        description:
          'Find answers to your questions about Fluxby. User guides, tutorials, and developer documentation.',
      },
    },
  },
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
      'Make money management fun with your own digital mascot. Track expenses, set goals, and get better insights into your spending! Completely free forever.',
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
    endpoints: [
      {
        method: 'GET',
        path: '/api/transactions',
        description: 'List transactions',
      },
      {
        method: 'GET',
        path: '/api/analytics/dashboard',
        description: 'Dashboard statistics',
      },
      {
        method: 'GET',
        path: '/api/categories',
        description: 'All categories',
      },
      {
        method: 'POST',
        path: '/api/import/csv',
        description: 'Import bank CSV',
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
      x64Label: 'x64',
      arm64Label: 'ARM64',
    },
    linux: {
      name: 'Linux',
      description: 'Packages for all major Linux distributions.',
      label: 'Download',
      appimageLabel: 'AppImage',
      debLabel: 'DEB',
      rpmLabel: 'RPM',
    },
    pwa: {
      name: 'Browser (PWA)',
      description:
        'Install directly from your browser. No download needed, works offline.',
      installButton: 'Install as app',
      installedBadge: 'Installed',
      openButton: 'Open Fluxby',
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
      sharedIbanExampleTitle: 'Add a shared IBAN',
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
      bankConnection: 'Importing bank transactions',
      firstSteps: 'First steps',
      installation: 'Installation',
      features: 'Features',
      transactions: 'Transactions',
      bulkDelete: 'Bulk delete',
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
      ai: 'Smart AI features',
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
      userItem1: 'Import bank transactions',
      userItem2: 'Create monthly category budgets',
      userItem3: 'Understand your privacy',
      devHubTitle: 'Developer Hub',
      devHubDesc:
        'Build integrations with the Fluxby API. Access documentation, endpoints, and webhooks.',
      getStarted: 'Get started',
      viewDocs: 'View documentation',
      popularArticles: 'Popular articles',
      article1: 'Importing bank transactions',
      article1Desc: 'Import a CSV file from your bank',
      article2: 'Creating a budget',
      article2Desc: 'Set up your first monthly budget',
      article3: 'API documentation',
      article3Desc: 'Full API reference for developers',
    },
    firstSteps: {
      title: 'First steps with Fluxby',
      subtitle:
        'Set up Fluxby, import a CSV file, and explore your financial overview.',
      step1Title: 'Step 1: Set up Fluxby',
      step1Text:
        'Choose a language, enter your name, and set a password of at least 8 characters. Fluxby creates a local demo profile with sample transactions, then opens the tour. You do not need an online Fluxby account.',
      step2Title: 'Step 2: Export from your bank',
      step2Text:
        'Log in to your online banking and export your transactions as a CSV file. Most banks offer this in the "Export" or "Download" section.',
      step3Title: 'Step 3: Import your transactions',
      step3Text:
        'Open Import, choose your CSV file, and select a bank preset or map the columns manually if needed. Review the sample rows before confirming the import.',
      step4Title: 'Step 4: Categorize transactions',
      step4Text:
        'Open Transactions and change a category from its category label. Existing rules apply to future transactions. After a manual change, Fluxby may offer to create a rule. With your own TypeSafe key, you can also use optional Jev features for transactions that no rule matches.',
      step5Title: 'Step 5: Explore your dashboard',
      step5Text:
        'Now go to the Dashboard to see your financial overview! You will see your balance, spending per category, and recent transactions.',
      nextStepsTitle: 'What next?',
      next1: 'Set monthly budgets for individual categories',
      next2: 'Create custom categories for better organization',
      next3: 'Add contacts in the Address Book to track who you transact with',
      next4: 'Import transactions regularly to keep your data up to date',
    },
    installation: {
      title: 'Installing Fluxby',
      subtitle:
        'Fluxby works in your browser without installation, but you can also install it as an app for a better experience.',
      desktopTitle: 'Desktop (Windows, macOS, Linux)',
      desktopText:
        'Download the native app from the Downloads page. Your financial data is stored locally; sync and optional TypeSafe AI features need an internet connection.',
      browserTitle: 'Web browser',
      browserText:
        'Fluxby works directly in your browser without a separate installation. In supported browsers, you can also install the web app as a PWA. Your data is stored locally in that browser.',
      iosTitle: 'iPhone & iPad',
      iosIntro:
        'Fluxby can be installed as a Progressive Web App (PWA) on your iPhone or iPad. This gives you an app-like experience with a home screen icon.',
      iosStep1Title: 'Open in Safari',
      iosStep1Text:
        'Open Fluxby in Safari (not Chrome or another browser). Safari is required for PWA installation on iOS.',
      iosStep2Title: 'Tap the Share button',
      iosStep2Text:
        'Tap the Share button at the bottom of Safari (the square with an arrow pointing up).',
      iosStep3Title: 'Add to Home Screen',
      iosStep3Text:
        'Scroll down and tap "Add to Home Screen". You may need to scroll right to find this option.',
      iosStep4Title: 'Confirm',
      iosStep4Text:
        'Tap "Add" in the top right corner. Fluxby will now appear on your home screen like any other app.',
      iosTipTitle: 'Tip',
      iosTipText:
        'Once installed, Fluxby opens in full-screen mode without the Safari address bar. Each installation has its own local data; pair devices in Settings and use sync if you want to share data.',
      androidTitle: 'Android',
      androidIntro:
        'On Android, you can install Fluxby as a PWA from Chrome or other browsers.',
      androidStep1Title: 'Open in Chrome',
      androidStep1Text:
        'Open Fluxby in Chrome (or another compatible browser like Edge).',
      androidStep2Title: 'Look for the install prompt',
      androidStep2Text:
        'Chrome may show an "Install app" banner at the bottom. If you see it, tap "Install".',
      androidStep3Title: 'Or use the menu',
      androidStep3Text:
        'Tap the three-dot menu in Chrome and select "Install app" or "Add to Home screen".',
      dataStorageTitle: 'About your data',
      dataStorageText:
        'Your data is stored locally in the browser or desktop app. Each installation has its own local data; sync from Settings to share it between paired devices. Optional TypeSafe AI sends only the data needed for the request you choose; see Smart AI features.',
    },
    bankConnection: {
      title: 'Importing bank transactions (CSV)',
      subtitle:
        'Import a CSV file from your bank to start tracking your finances.',
      howItWorksTitle: 'No direct bank connection',
      howItWorksText:
        'Fluxby does not fetch transactions directly from your bank. Export a CSV file from your bank and import it into Fluxby. The import is processed locally. Optional Jev features send the data needed for that request to TypeSafe; see Smart AI features.',
      step1Title: 'Step 1: Export a CSV from your bank',
      step1Text:
        'Log into your online banking and download your transaction history as a CSV file. Most banks offer this option in the account statements or transaction history section.',
      step2Title: 'Step 2: Import into Fluxby',
      step2Text:
        'Open Import and choose your CSV file. Select an available bank preset or choose Other / Manual to map the columns.',
      step3Title: 'Step 3: Review and categorize',
      step3Text:
        'Fluxby applies your existing categorization rules. After importing, review the transactions, skipped rows, and categories; adjust categories where needed.',
      tipTitle: 'Pro Tip',
      tipText:
        'After you categorize a transaction manually, Fluxby may offer to create a rule for similar future transactions.',
      supportedTitle: 'Available CSV options',
      supportedText:
        'Presets are available for ING and ASN Bank. For other CSV files, choose Other / Manual and map the required Date, Amount, and Description columns. Review the preview and any skipped rows before confirming. Optional fields include IBAN, counterparty, balance, direction, payment method, and notes.',
    },
    budgeting: {
      title: 'Managing monthly budgets',
      subtitle:
        'Set monthly spending limits by category and track your progress.',
      whatIsTitle: 'What is a budget?',
      whatIsText:
        'A budget is a monthly spending limit for one category. Fluxby compares transactions in the selected period with that limit.',
      createTitle: 'Creating a category budget',
      step1: 'Navigate to the Budgets page from the sidebar',
      step2: 'Click Add budget to open the form',
      step3: 'Choose a category; a category is required for a new budget',
      step4: 'Enter the monthly amount',
      step5: 'Click Save to create your budget',
      bestPracticeTitle: 'Best Practice',
      bestPracticeText:
        'Start with the categories you want to track. When Fluxby has enough transaction history, you can review suggested budgets.',
      trackingTitle: 'Tracking your progress',
      trackingText:
        'Budget cards show your spending against each limit with a progress bar. Use the period selector to view other months.',
      suggestedTitle: 'Suggested budgets',
      suggestedText:
        'When there is enough transaction history, Fluxby can suggest budgets by category. Review the suggestions and choose which ones to add.',
    },
    subscriptions: {
      title: 'Managing subscriptions',
      subtitle: 'Track recurring payments and review price or payment alerts.',
      whatIsTitle: 'What are subscriptions in Fluxby?',
      whatIsText:
        'Fluxby looks for recurring payments in your transactions, such as streaming services and regular bills. Confirm which detected patterns you want to track as subscriptions.',
      detectionTitle: 'How does detection work?',
      detectionText:
        'After an import, Fluxby checks for weekly, monthly, quarterly, and yearly patterns. You can also run detection from the Subscriptions page. Review the results because not every pattern is a subscription.',
      jevReviewTitle: 'Review changed payments with Jev',
      jevReviewText:
        'With TypeSafe set up, Jev can suggest matches when a recurring payment’s merchant name, IBAN, or amount changes. Review and confirm each match yourself; Jev does not change subscriptions automatically.',
      step1: 'Import your transactions via the Import page',
      step2:
        'Review detected patterns on the Subscriptions page; run detection there if needed',
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
      priceAlertsTitle: 'Review price and payment alerts',
      priceAlertsText:
        'Review alerts for price changes, missed payments, and stale patterns on the Subscriptions page. Use the available action to accept a price change or dismiss an alert.',
      priceIncreaseTitle: 'Price increase',
      priceIncreaseText:
        'A red arrow up indicates that a subscription has become more expensive. This may mean the service has raised its prices.',
      priceDecreaseTitle: 'Price decrease',
      priceDecreaseText:
        'A green arrow down indicates that you paid less than normal. This could be a temporary discount or promotion.',
      monthlyOverviewTitle: 'Monthly overview',
      monthlyOverviewText:
        'At the top of the page, you can see monthly spending and counts for confirmed subscriptions and patterns waiting for confirmation.',
      viewsTitle: 'List and calendar views',
      viewsText:
        'Switch between the list of detected subscriptions and a calendar of expected payments for the current month.',
      bestPracticeTitle: 'Best practice',
      bestPracticeText:
        'Check your subscriptions regularly. Many people pay for services they no longer use. By monitoring your subscriptions, you can easily save money.',
    },
    privacy: {
      title: 'Your data & privacy',
      subtitle:
        'Fluxby stores your financial data locally. Sync and AI are optional network features.',
      localFirstTitle: 'Local storage',
      localFirstText:
        'Your transactions, budgets, and categories are stored in a local database by default. Sync shares data between paired devices. Optional TypeSafe AI sends limited data to TypeSafe for the request; see Smart AI features.',
      noCloud: 'No central database',
      noCloudDesc: 'Your financial database is not stored centrally',
      noTracking: 'No ad tracking',
      noTrackingDesc: 'Your financial data is not used for advertising',
      fullControl: 'Full control',
      fullControlDesc: 'Delete all data anytime',
      howWorksTitle: 'How it works',
      howWorksText:
        'The web app uses a local SQLite database in your browser; the desktop app stores data locally on your device. Peer-to-peer sync and optional TypeSafe AI use the internet, but are not required for core features.',
      dataLocationTitle: 'Where is my data stored?',
      dataLocationText:
        'The web app stores data in OPFS (Origin Private File System); the desktop app uses local app storage. Sync copies data to paired devices. Jev requests send limited data to TypeSafe as described in Smart AI features.',
      backupTitle: 'Back up and restore your data',
      backupText:
        'Open Settings > Data Management and export a JSON backup. You can encrypt the backup with a password. Use Import to restore a backup; an encrypted file requires its backup password.',
      deleteDataTitle: 'Deleting your data',
      deleteDataText:
        'Use Settings > Data Management to delete your Fluxby data. You can also clear the browser data for the browser where you use Fluxby. Export a backup first if you may want to restore the data later.',
      warningTitle: 'Important',
      warningText:
        'Sync shares data between paired devices, but is not a separate backup. Keep an exported JSON backup if you want an independent recovery copy.',
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
        'Use the search bar and filters to find transactions by date, account, category, contact, type, or description.',
      viewingTitle: 'Viewing transactions',
      viewingText:
        'The Transactions page shows your imported transactions in a responsive list. Each transaction shows:',
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
        'Change a transaction category from its category label. Existing rules run on future transactions; Fluxby does not learn from category changes automatically.',
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
      defaultTitle: 'Example categories',
      defaultText: 'These are examples of categories you can use or adapt:',
      examples: [
        {
          emoji: '🏠',
          name: 'Housing',
          color: '#1E40AF',
          description: 'Rent, mortgage, utilities',
        },
        {
          emoji: '🛒',
          name: 'Groceries',
          color: '#34D399',
          description: 'Supermarket, household items',
        },
        {
          emoji: '🚗',
          name: 'Transport',
          color: '#3B82F6',
          description: 'Fuel, public transit, parking',
        },
        {
          emoji: '🍽️',
          name: 'Food & drink',
          color: '#F97316',
          description: 'Restaurants, delivery, coffee',
        },
        {
          emoji: '🛍️',
          name: 'Shopping',
          color: '#EC4899',
          description: 'Clothing, shoes, electronics',
        },
        {
          emoji: '💪',
          name: 'Health',
          color: '#EF4444',
          description: 'Insurance, pharmacy, sports',
        },
        {
          emoji: '🎬',
          name: 'Leisure',
          color: '#8B5CF6',
          description: 'Streaming, outings, hobbies',
        },
        {
          emoji: '💼',
          name: 'Income',
          color: '#22C55E',
          description: 'Salary, freelance, benefits',
        },
        {
          emoji: '💰',
          name: 'Savings & investments',
          color: '#14B8A6',
          description: 'Savings, investments',
        },
      ],
      createTitle: 'Creating a category',
      createText: 'To create a new category:',
      createStep1: 'Go to Categories page from the sidebar',
      createStep2: 'Click "New Category"',
      createStep3: 'Choose a name, icon and color',
      createStep4: 'Click Save to create your category',
      rulesTitle: 'Auto-categorization rules',
      rulesText:
        'Rules assign categories based on words in transaction descriptions. For example, you can create a rule that assigns transactions containing "Albert Heijn" to Groceries.',
      subcategoryTitle: 'Use subcategories',
      subcategoryText:
        'On the Categories page, expand a parent category and choose Add subcategory. Subcategories help group related transactions under one parent category.',
      rulesTip: 'Pro tip',
      rulesTipText:
        'The more specific your rules, the more accurate the auto-categorization. Use merchant names or specific keywords that appear in your bank transactions.',
    },
    // Help pages - Accounts
    accounts: {
      title: 'Managing accounts',
      subtitle:
        'Manage the accounts associated with your imported transactions.',
      overviewTitle: 'Accounts overview',
      overviewText:
        'Manage accounts in Settings > Accounts. Account cards and balances also appear on the Dashboard and Transactions pages.',
      addTitle: 'Adding an account',
      addText: 'To add an account manually:',
      addStep1: 'Go to Settings > Accounts',
      addStep2: 'Click "Add Account"',
      addStep3: 'Enter a name and account type; the IBAN is optional',
      addStep4: 'Click Save to add the account',
      filterTitle: 'Filtering by account',
      filterText:
        'On the Transactions page, use the account filter to show transactions from one account or all accounts.',
      noteTitle: 'Note',
      noteText:
        'If you have multiple accounts, import CSV files from all of them to get a complete picture of your finances.',
      balanceTitle: 'Understanding balances',
      balanceText:
        'Fluxby does not connect to banks for live balances. Account information reflects the CSV data you have imported; import newer statements to keep it current.',
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
        'Review transaction counterparties, manage contacts, and clean up bank descriptions.',
      tipTitle: 'Quick tip',
      tipText:
        'New counterparties can appear under Suggested Contacts after an import. Add them to your address book when you want to keep them.',
      whatAreTitle: 'What is the address book?',
      whatAreText:
        'The address book helps you organize contacts, clean up bank descriptions, and review transactions by counterparty.',
      featuresTitle: 'Key features',
      autoExtractionTitle: 'Suggested contacts',
      autoExtractionText:
        'After an import, counterparties with new IBANs can appear as Suggested Contacts. Review and add each contact yourself; imports do not add contacts automatically.',
      jevMatchesTitle: 'Review matches with Jev',
      jevMatchesText:
        'If you have configured your TypeSafe key, Jev can suggest that an unknown IBAN belongs to an existing contact. Confirm or skip each suggestion; contacts are not merged automatically.',
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
        'Compare income and expenses over the selected period with monthly charts.',
      trendsTitle: 'Monthly trends',
      trendsText:
        'Track how your spending changes over time with monthly trend charts. Compare income to expenses per month to understand your financial development.',
      filtersTitle: 'Using filters',
      filtersText:
        'Use the date range to focus on the calendar year or years you want to review. For account-specific transaction lists, use the Transactions page.',
      filter1:
        'Choose a preset or custom date range; analytics group results by calendar year.',
      filter2: 'Compare trends across the selected years.',
      filter3:
        'Use Transactions to filter individual records by account or category.',
      tipTitle: 'Pro tip',
      tipText:
        'Compare the same month across different years to account for seasonal spending patterns like holidays or vacations.',
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
      lastUpdatedDate: 'January 4, 2026',
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
      localStorageTitle: 'B. Local Storage',
      localStorageText:
        'The App stores all data in a local database on your device. This includes transactions, categories, budgets, and settings. The database never leaves your device and is only accessible to the App.',
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
      lastUpdatedDate: 'January 4, 2026',
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
      v101Date: 'January 4, 2026',
      v101Title: 'Release 1.0.1',
      v101Description: 'New improvements and bug fixes.',
      v101F1Title: 'Implement per-file version checking',
      v101F1Desc: 'See the changelog for details.',
      v1133Date: 'September 22, 2026',
      v1133Title: 'Release 1.13.3',
      v1133Description: '1 bug fix.',
      v1133F1Title: 'Legacy Tauri database support',
      v1133F1Desc: "This shouldn't have happened, but it's fixed now!",
      v1132Date: 'September 22, 2026',
      v1132Title: 'Release 1.13.2',
      v1132Description: '1 bug fix.',
      v1132F1Title: 'Restore the first tour and batch Jev requests natively',
      v1132F1Desc: 'An annoying issue has been squashed.',
      v1131Date: 'September 21, 2026',
      v1131Title: 'Release 1.13.1',
      v1131Description: '1 bug fix.',
      v1131F1Title: 'Persist first-run completion and enable Jev',
      v1131F1Desc: 'Bugs eliminated, app improved.',
      v1130Date: 'September 21, 2026',
      v1130Title: 'Release 1.13.0',
      v1130Description: '1 new feature and 1 bug fix.',
      v1130F1Title: 'Web proxy and responsive documentation fixes',
      v1130F1Desc: 'New functionality that actually helps.',
      v1130F2Title: 'Move frame ancestors policy to response headers',
      v1130F2Desc: 'Bugs eliminated, app improved.',
      v1122Date: 'September 21, 2026',
      v1122Title: 'Release 1.12.2',
      v1122Description: '13 bug fixes.',
      v1122F1Title: 'Bug fixes',
      v1122F1Desc: '13 bugs fixed. See changelog for details.',
      v1121Date: 'September 20, 2026',
      v1121Title: 'Release 1.12.1',
      v1121Description: '2 bug fixes.',
      v1121F1Title: 'Web app improvements',
      v1121F1Desc: '2 bug fixes. Check the release on GitHub!',
      v1120Date: 'September 20, 2026',
      v1120Title: 'Release 1.12.0',
      v1120Description: '1 new feature and 4 bug fixes.',
      v1120F1Title: 'Tab scroll reset and category sign handling',
      v1120F1Desc:
        "We've got something new for you! Check the release notes for all details.",
      v1120F2Title: 'Bug fixes',
      v1120F2Desc: '4 bugs fixed. See changelog for details.',
      v1110Date: 'September 19, 2026',
      v1110Title: 'Release 1.11.0',
      v1110Description: '3 new features and 11 bug fixes.',
      v1110F1Title: 'TypeSafe AI docs to developer hub and help center',
      v1110F1Desc:
        "We've got something new for you! Check the release notes for all details.",
      v1110F2Title: 'New web app capabilities',
      v1110F2Desc: '2 new features. Check the release on GitHub!',
      v1110F3Title: 'Bug fixes',
      v1110F3Desc: '11 bugs fixed. See changelog for details.',
      v1100Date: 'September 8, 2026',
      v1100Title: 'Release 1.10.0',
      v1100Description: '14 new features and 24 bug fixes.',
      v1100F1Title: 'Web app extensions',
      v1100F1Desc:
        '6 new capabilities to discover. Check out the release notes!',
      v1100F2Title: 'CSP headers for XSS protection',
      v1100F2Desc: "There's more to explore. Discover it yourself!",
      v1100F3Title: 'API improvements',
      v1100F3Desc:
        '5 new capabilities to discover. Check out the release notes!',
      v1100F4Title: 'Shared functionality',
      v1100F4Desc: '2 new features. Check the release on GitHub!',
      v1100F5Title: 'Bug fixes',
      v1100F5Desc: '24 bugs fixed. See changelog for details.',
      v190Date: 'March 8, 2026',
      v190Title: 'Release 1.9.0',
      v190Description: '3 new features and 2 bug fixes.',
      v190F1Title: 'New web app capabilities',
      v190F1Desc: '3 new features. Check the release on GitHub!',
      v190F2Title: 'Web app improvements',
      v190F2Desc: '2 bug fixes. Check the release on GitHub!',
      v182Date: 'March 8, 2026',
      v182Title: 'Release 1.8.2',
      v182Description: '1 bug fix.',
      v182F1Title: 'Resolve WASM memory access error in transactionAsync',
      v182F1Desc: 'Bugs eliminated, app improved.',
      v181Date: 'March 8, 2026',
      v181Title: 'Release 1.8.1',
      v181Description: 'New improvements and bug fixes.',
      v180Date: 'March 7, 2026',
      v180Title: 'Release 1.8.0',
      v180Description: '3 new features and 9 bug fixes.',
      v180F1Title: 'Complete code review with 19 fixes',
      v180F1Desc: "There's more to explore. Discover it yourself!",
      v180F2Title: 'Bulk transaction deletion with undo support',
      v180F2Desc: 'This makes Fluxby even better.',
      v180F3Title: 'IOS PWA installation instructions',
      v180F3Desc:
        "We've got something new for you! Check the release notes for all details.",
      v180F4Title: 'Bug fixes',
      v180F4Desc: '9 bugs fixed. See changelog for details.',
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
        freeLabel: 'Free',
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
      months: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ],
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
      gym: 'Gym',
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
      fileName: 'transactions.csv',
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

Object.assign(en, {
  helpCenter: {
    ...(en.helpCenter ?? {}),
    transactions: {
      ...en.helpCenter?.transactions,
      manualMethod: 'Manual',
      manualMethodDesc:
        'Click the transaction’s category label and choose a category.',
      autoMethod: 'Automatic categorization',
      autoMethodDesc:
        'Create rules that assign categories based on words in transaction descriptions. Existing rules run on future transactions.',
      proTip: 'Tip',
      proTipText:
        'After you categorize a transaction, Fluxby can offer to create a rule for similar future imports.',
    },
    categories: {
      ...en.helpCenter?.categories,
      step1: 'Open Categories from the sidebar',
      step2: 'Click New Category',
      step3: 'Enter a name and choose an icon',
      step4: 'Choose a color to identify the category',
      step5: 'Click Save to create the category',
      tipTitle: 'Quick tip',
      tipText:
        'After you categorize a transaction manually, Fluxby can offer to create a rule for future imports.',
      deleteTitle: 'Deleting a category',
      deleteText:
        'When deleting a category, you can move its transactions to another category or leave them uncategorized. Default categories cannot be deleted.',
    },
    bulkDelete: {
      title: 'Manage multiple transactions',
      subtitle: 'Select and delete several transactions at once.',
      tipTitle: 'Good to know',
      tipText:
        'Deletions made from the selection can be undone for up to 5 minutes. This does not apply to date-range deletion.',
      selectionModeTitle: 'Turn on selection mode',
      selectionModeText:
        'Turn on selection mode before selecting multiple transactions:',
      step1: 'Open Transactions from the menu',
      step2: 'Click the checkmark beside a transaction',
      step3: 'An action bar appears with options for the selected transactions',
      selectingTitle: 'Selecting transactions',
      selectingText: 'There are several ways to select transactions:',
      singleSelect: 'Select individually',
      singleSelectDesc: 'Click the checkmark beside each transaction.',
      rangeSelect: 'Select a range',
      rangeSelectDesc:
        'Hold Shift and click another transaction to select everything between them (desktop only).',
      selectAll: 'Select all',
      selectAllDesc:
        'Use Select all in the action bar to select all visible transactions.',
      deselectAll: 'Clear selection',
      deselectAllDesc:
        'Click Cancel or press Escape to leave selection mode and clear the selection.',
      deletingTitle: 'Delete selected transactions',
      deletingText: 'Delete the selected transactions as follows:',
      deleteStep1: 'Click Delete in the action bar at the bottom',
      deleteStep2: 'Confirm the deletion in the dialog',
      deleteStep3: 'The account balance is recalculated automatically',
      dateRangeTitle: 'Delete by date range',
      dateRangeText: 'You can also delete transactions from a specific period:',
      dateRangeStep1: 'Click Delete by date in the action bar',
      dateRangeStep2: 'Choose a start and end date',
      dateRangeStep3: 'Optionally filter by a specific account',
      dateRangeStep4: 'Confirm deleting transactions in that range',
      cautionTitle: 'Caution',
      cautionText:
        'Date-range deletion can remove many transactions at once and cannot be undone. Check the preview and transaction count first.',
      undoTitle: 'Undo a selected deletion',
      undoText:
        'Restore a deletion made from the transaction selection within 5 minutes:',
      undoPoint1: 'An Undo notification appears after deletion',
      undoPoint2: 'Click Undo to restore the transactions',
      undoPoint3:
        'The notification disappears after 5 minutes, after which recovery is no longer available',
      balanceTitle: 'Effect on account balance',
      balanceText:
        'After transactions are deleted, the balance is recalculated from the remaining transactions.',
      bestPracticeTitle: 'Best practice',
      bestPracticeText:
        'Use filters to review the transactions before deleting them.',
    },
    sync: {
      title: 'Sync between devices',
      subtitle: 'Keep your data in sync across devices without the cloud.',
      howItWorksTitle: 'How it works',
      howItWorksText:
        'Fluxby syncs data directly between devices over an encrypted peer-to-peer connection. Your data does not pass through a central server.',
      directConnection: 'Direct connection',
      laptop: 'Laptop',
      phone: 'Phone',
      setupTitle: 'Set up sync',
      step1Title: 'Step 1: Open Settings',
      step1Text:
        'Open the Sync Devices section to see your device and pair additional devices.',
      step2Title: 'Step 2: Generate a pairing code',
      step2Text:
        'Show the QR code and scan it with your other device, or enter the code manually.',
      step3Title: 'Step 3: Connect your devices',
      step3Text:
        'Open the same settings on the second device and scan or enter the pairing code.',
      step4Title: 'Step 4: Sync your devices',
      step4Text:
        'When automatic sync is enabled, changes sync while both devices are online. You can also start a manual sync.',
      troubleshootingTitle: 'Troubleshooting',
      troubleshooting1Title: 'Devices cannot find each other',
      troubleshooting1Text:
        'Check that both devices are online. Network security settings or a firewall may block peer-to-peer connections.',
      troubleshooting2Title: 'Sync failed',
      troubleshooting2Text:
        'Check the internet connection, whether automatic sync is enabled, and try a manual sync. Pair the devices again if needed.',
      troubleshooting3Title: 'Conflicting changes',
      troubleshooting3Text:
        'When the same data changes on multiple devices, Fluxby keeps the most recent version (Last-Write-Wins).',
      securityTitle: 'Privacy and security',
      securityText:
        'Your financial data stays on your devices. Sync uses encrypted peer-to-peer connections; Fluxby does not store it in the cloud.',
    },
  },
  docs: {
    ...en.docs,
    nav: { ...en.docs.nav, ai: 'TypeSafe AI' },
    profiles: {
      ...en.docs.profiles,
      whatIsProfileTitle: 'What is a Profile?',
      whatIsProfileText:
        'A profile in Fluxby is a completely isolated financial environment. You can use profiles to:',
      useCases: [
        'Keep personal and business finances separate',
        'Manage finances for different family members',
        'Test hypothetical budgets or planning scenarios',
      ],
    },
    errors: {
      ...en.docs.errors,
      codeHeader: 'Code',
      descriptionHeader: 'Description',
    },
  },
  legal: {
    ...en.legal,
    downloads: en.downloads,
  },
});

Object.assign(en, {
  helpCenter: {
    ...en.helpCenter,
    privacy: {
      ...en.helpCenter?.privacy,
      storageLabel: 'Browser OPFS / desktop app data',
    },
  },
});

Object.assign(en, {
  helpCenter: {
    ...en.helpCenter,
    devNav: {
      ...en.helpCenter?.devNav,
      tools: 'Tools',
      developerDocs: 'Developer docs',
    },
    common: {
      ...en.helpCenter?.common,
      openMenu: 'Open menu',
      home: 'Home',
      switchToLightMode: 'Switch to light mode',
      switchToDarkMode: 'Switch to dark mode',
      close: 'Close',
      missingAsset: 'Missing asset',
      loading: 'Loading content...',
    },
    ai: {
      title: 'Smart AI features',
      intro:
        'Fluxby can optionally use TypeSafe AI to categorise transactions, recognise unfamiliar import columns, find possible address book matches, and identify payment providers.',
      notice:
        'TypeSafe AI works in both the desktop app and the web app. The web version uses a small Fluxby gateway for browser communication; the desktop app connects directly. In either version, add your own TypeSafe API key first. No AI requests are made without a key.',
      whatTitle: 'What is TypeSafe AI?',
      whatText:
        'TypeSafe AI is a service that returns focused AI decisions as structured answers. Fluxby applies existing rules first; Jev then helps with payments that have not matched a rule. Some category and payment provider actions automatically apply a reliable suggestion when you start them.',
      optionalTitle: 'Completely optional.',
      optionalText:
        'Fluxby works as usual without an API key. Adding a key makes certain features smarter.',
      benefitsTitle: 'What does AI improve?',
      features: [
        {
          emoji: '🏷️',
          title: 'Automatic categorisation',
          description:
            'Apply existing rules first, then let AI choose a category from the merchant name, description, and amount. Automatic assignment happens only above 60% confidence.',
        },
        {
          emoji: '🧠',
          title: 'Discover categorisation rules',
          description:
            'TypeSafe reviews recurring merchants without a category. Fluxby creates a reusable rule only when the category is a good fit with over 60% confidence.',
        },
        {
          emoji: '📊',
          title: 'Suggest import columns',
          description:
            'When required CSV fields are missing or ambiguous, Jev can suggest a column. Check the mapping and transaction preview before importing.',
        },
        {
          emoji: '📒',
          title: 'Suggest address book matches',
          description:
            'Jev compares unknown counterparties with existing contacts. You confirm every IBAN match; contacts are never merged automatically.',
        },
        {
          emoji: '📥',
          title: 'CSV import: detect transaction direction',
          description:
            'Banks outside the Netherlands sometimes use unfamiliar debit and credit codes, such as the German Belastung and Gutschrift. AI recognises them so imports get the correct sign.',
        },
        {
          emoji: '📅',
          title: 'CSV import: detect date format',
          description:
            'Does 01/02/2024 mean 1 February or 2 January? AI detects your bank’s date format from a few examples and prevents silent date errors.',
        },
        {
          emoji: '💳',
          title: 'Recognise payment providers',
          description:
            'Tikkie, PayPal, Mollie, and new platforms are recognised from IBAN and transaction descriptions, even when they are not in your pattern list yet.',
        },
        {
          emoji: '🔄',
          title: 'Group subscriptions',
          description:
            'Netflix and Netflix Premium under the same IBAN may be the same subscription. AI groups such variations so pattern detection can use the full transaction history.',
        },
        {
          emoji: '🔍',
          title: 'Find duplicate transactions',
          description:
            'Transactions with the same amount and nearly the same date, but a slightly different description, are surfaced for review. Fluxby never deletes them automatically; you decide.',
        },
        {
          emoji: '🔄',
          title: 'Review internal transfers',
          description:
            'Jev reviews possible counter-transactions across different accounts. You confirm a pair before Fluxby marks both transactions as a transfer.',
        },
      ],
      setupTitle: 'How do I enable AI?',
      setupSteps: [
        'Go to Settings → App settings → TypeSafe AI.',
        'Paste the key into the field and save.',
        'Use the buttons to categorise transactions, find rules, recognise payment providers, review duplicates, and check possible transfers. Jev can also suggest import columns and address book matches.',
      ],
      setupKeyPrefix: 'Get a free API key from',
      setupKeyLabel: 'console.typesafe.ai/keys',
      removeKeyNotice:
        'You can remove the key at any time. Fluxby will then stop making AI requests.',
      demoDataNotice:
        'In new demo data, payments from Salon Nova and Bistro Kora remain uncategorised. Use them to try Jev categorisation and recurring categorisation rule discovery.',
      privacyTitle: 'Privacy — what data is sent?',
      privacyText:
        'Fluxby sends only the minimum data needed for each decision. It never sends full transaction lists. Your personal IBANs stay local; provider detection may send a counterparty IBAN when you start that action.',
      dataTableFeature: 'Feature',
      dataTableSent: 'Data sent',
      dataRows: [
        ['Categorisation', 'Merchant name, description, and amount'],
        ['CSV direction', 'Unique direction values from the file'],
        ['CSV date', 'Up to 10 date strings from the CSV file'],
        ['CSV columns', 'Column names and up to two limited sample rows'],
        ['Payment provider', 'IBAN and merchant names'],
        [
          'Address book match',
          'Counterparty name, transaction count, and possible contact names; no IBAN',
        ],
        ['Subscriptions', 'IBAN and normalised merchant names'],
        [
          'Duplicate transactions',
          'Date, amount, and description for each pair',
        ],
        [
          'Transfers',
          'Account names, date, amount, and description for each pair',
        ],
      ],
      privacyLinkPrefix: 'Read the',
      privacyLinkLabel: 'TypeSafe privacy policy',
      privacyLinkSuffix: 'for details about how TypeSafe handles your data.',
      faqTitle: 'Frequently asked questions',
      faqs: [
        {
          question: 'Does Fluxby work without AI?',
          answer:
            'Yes, completely. All AI features are an optional layer on top of the existing logic. Without an API key, the app behaves exactly as it did before.',
        },
        {
          question: 'Can AI delete my transactions?',
          answer:
            'No. AI only makes suggestions; the code and you make every decision. Possible duplicates are shown for review and are never deleted automatically.',
        },
        {
          question: 'Does TypeSafe cost money?',
          answerPrefix:
            'TypeSafe credits and pricing can change. Check the current details at',
          linkLabel: 'typesafe.ai',
          answerSuffix: '.',
        },
        {
          question: 'What is “Jev”?',
          answer:
            'Jev is TypeSafe’s flagship System One model. It returns structured answers, such as probabilities and choices, instead of free text. Fluxby uses Jev through the TypeSafe HTTP API.',
        },
      ],
    },
  },
  docs: {
    ...en.docs,
    common: {
      ...en.docs.common,
      openMenu: 'Open menu',
      home: 'Home',
      switchToLightMode: 'Switch to light mode',
      switchToDarkMode: 'Switch to dark mode',
      copy: 'Copy',
      copied: 'Copied!',
      request: 'Request',
      response: 'Response',
      code: 'Code',
      description: 'Description',
    },
    ai: {
      title: 'TypeSafe AI / Jev',
      subtitle:
        'How Fluxby uses TypeSafe’s System One model (Jev) to replace fragile regex rules with calibrated, structured AI judgments.',
      examples: {
        request: {
          merchant: 'Example Market',
          description: 'Card payment',
          category: 'Groceries',
          instructions:
            'Which spending category best fits the bank transaction described in `merchant`, `description`, and `amount`?',
          restaurants: 'Restaurants & Bars',
          transport: 'Transport',
          noCategory: 'Does not fit any of these categories',
        },
        client: {
          merchant: 'Example Market',
          description: 'Card payment',
          keyComment:
            "// User's key read from OPFS settings — only present if they opt in",
          fallbackComment: 'graceful degradation',
          writeComment:
            'Code owns the write — TypeSafe only returned a probability',
        },
        direction: {
          beforeLoopComment: '// Before the row loop in importCsv()',
          batchComment:
            '// TypeSafe classifies each unknown direction value once, in parallel',
          debitInstruction:
            'A bank CSV has a direction column whose value is "Belastung". Does this mean money is leaving the account or arriving?',
          debitMeaning:
            'Money leaving the account (payment, expense, withdrawal)',
          creditInstruction:
            'A bank CSV has a direction column whose value is "Gutschrift". Does this mean money is arriving or leaving the account?',
          creditMeaning: 'Money arriving (income, deposit, refund)',
          unknownMeaning: 'Cannot determine from this value alone',
        },
      },
      whatTitle: 'What is TypeSafe AI?',
      whatText:
        'TypeSafe builds System One models: small, fast AI primitives that return structured answers instead of generated text. Jev is TypeSafe’s flagship model. Given a state (JSON or string) and one or more typed questions, it returns probabilities for Choice, Score, or Noul (yes/no) answers in about 100 ms.',
      controlText:
        'Code owns the control flow. Jev handles only tasks that require semantic understanding of unstructured text, such as “which category fits this merchant name?” or “is this IBAN a payment intermediary?”.',
      architectureTitle: 'Architecture',
      architectureIntro:
        'Fluxby follows TypeSafe’s AI-powered software pattern: keep deterministic work in code and add AI only where heuristics break down.',
      decisionHeaders: ['Decision', 'Primitive', 'Replaces'],
      decisions: [
        ['Transaction category', 'Choice', 'Regex rule engine fallback'],
        ['CSV date format', 'Choice', 'Fixed-order format guesser'],
        ['Direction column values', 'Choice', 'Hardcoded debit/credit list'],
        ['Payment provider detection', 'Noul', 'Substring pattern list'],
        ['Recurring merchant grouping', 'Noul', 'Dutch month-name stripper'],
        ['Semantic duplicate check', 'Noul', 'Hash-only deduplication'],
      ],
      optInTitle: 'Opt-in — features degrade gracefully',
      optInText:
        'Every TypeSafe integration checks for an API key before calling the service. If the key is absent or the call fails, the existing deterministic logic runs unchanged. Users who do not configure a key see no change in behaviour.',
      implementationTitle: 'Client implementation',
      implementationText:
        'Fluxby remains local-first and does not use a shared TypeSafe key. The desktop app calls TypeSafe directly. The GitHub Pages web app sends the same request through the optional Fluxby Cloudflare Worker so the browser can pass CORS preflight safely. apps/web/src/lib/typesafe-client.ts selects the transport and exposes domain helpers.',
      workerText:
        'The Worker is deployed once for Fluxby, not once per user. Setup is documented in workers/typesafe-proxy/README.md. Users still need to add their own TypeSafe API key before any request is made.',
      categoryExampleTitle: 'Example: transaction categorisation',
      categoryExampleText:
        'When the regex rule engine cannot match a transaction, Fluxby sends the merchant name, description, and amount to Jev alongside the user’s own category list. Jev returns a probability for each category.',
      request: 'Request',
      response: 'Response',
      confidenceText:
        'Fluxby batches independent transaction questions in one request and applies a suggestion only when confidence > 0.7. At or below that threshold, the transaction remains uncategorised for manual review. Repeated merchants can also become exact-text rules when they clear the same threshold.',
      directionExampleTitle: 'Example: CSV direction column inference',
      directionText:
        'For bank exports with non-standard direction column values, such as the German “Belastung” and “Gutschrift”, Fluxby asks Jev to classify each unique value in one parallel batch before processing rows.',
      thresholdsTitle: 'Confidence thresholds',
      thresholdHeaders: ['Feature', 'Primitive', 'Threshold', 'Action if met'],
      thresholds: [
        [
          'Category suggestion',
          'Choice confidence',
          '> 0.7',
          'Auto-assign category',
        ],
        [
          'Date format detection',
          'Choice confidence',
          '≥ 0.8',
          'Override parser default',
        ],
        [
          'Direction inference',
          'Choice',
          '—',
          'Use if answer is not “unknown”',
        ],
        ['Payment provider', 'Noul', '≥ 0.75', 'Mark as AI-detected provider'],
        ['Recurring grouping', 'Noul', '≥ 0.75', 'Merge merchant groups'],
        ['Duplicate detection', 'Noul', '≥ 0.75', 'Surface for user review'],
      ],
      privacyTitle: 'Privacy and data flow',
      privacyIntro:
        'When TypeSafe AI is enabled, the following data is sent to the TypeSafe API for each request:',
      privacyItems: [
        [
          'Category suggestion',
          'Merchant name, description text, and transaction amount',
        ],
        [
          'Direction inference',
          'Unique direction column values from the CSV sample',
        ],
        ['Date format detection', 'Up to 10 sample date strings from the CSV'],
        ['Payment provider detection', 'IBAN and merchant names'],
        ['Recurring grouping', 'IBAN and normalised merchant names'],
        [
          'Duplicate detection',
          'Date, amount, and description of candidate transaction pairs',
        ],
      ],
      privacyFooterPrefix:
        'No TypeSafe calls are made without a user-supplied API key. Review the',
      privacyLink: 'TypeSafe privacy policy',
      privacyFooterSuffix: 'for details on data handling.',
      furtherReadingTitle: 'Further reading',
      furtherReading: [
        ['TypeSafe documentation', 'https://docs.typesafe.ai'],
        [
          'How to build with System One',
          'https://docs.typesafe.ai/concepts/how-to-build-with-system-one',
        ],
        [
          'Primitives (Choice, Score, Noul)',
          'https://docs.typesafe.ai/primitives',
        ],
        ['Confidence and thresholds', 'https://docs.typesafe.ai/confidence'],
        [
          'Pre-parsed value extraction cookbook',
          'https://docs.typesafe.ai/cookbooks/pre_parsed_value_extraction_cookbook',
        ],
        [
          'Hierarchical classification cookbook',
          'https://docs.typesafe.ai/cookbooks/hierarchical_classification',
        ],
        [
          'Internal reference: docs/TYPESAFE-INTEGRATION.md',
          'https://github.com/fluxby-app/fluxby/blob/main/docs/TYPESAFE-INTEGRATION.md',
        ],
      ],
    },
    architecture: {
      ...en.docs.architecture,
      pageCopy: {
        webTitle: 'Web (PWA)',
        webFeatures: [
          'Offline support',
          'Installable as a PWA',
          'Automatic updates',
        ],
        desktopTitle: 'Desktop (Tauri)',
        desktopFeatures: [
          'Native performance',
          'System tray integration',
          'Native backups',
        ],
        headlessTitle: 'Headless (API)',
        headlessFeatures: [
          'REST API',
          'Swagger documentation',
          'Zapier/n8n integration',
        ],
        noteTitle: 'Note',
        autoLockLabels: ['Web:', 'Desktop:', 'Idle timeout:'],
        storageHeaders: ['Platform', 'Storage', 'Location'],
        storageRows: [
          ['Web', 'OPFS (Origin Private File System)', 'Browser sandbox'],
          ['Desktop (Tauri)', 'Tauri FS Plugin', 'AppLocalData'],
          ['Headless (Node)', 'Node.js fs module', 'Configurable path'],
        ],
        backupLabels: ['Desktop:', 'Web:', 'Format:'],
        comparisonHeaders: ['Aspect', 'Web App (OPFS)', 'API Server (Node.js)'],
        comparisonRows: [
          [
            'Database location',
            'Browser OPFS (sandbox)',
            'data/ folder in project',
          ],
          ['Security', 'Password locks the UI', 'Local only (plain SQLite)'],
          [
            'Access',
            'Only through your browser with your password',
            'REST API at localhost:3001',
          ],
          [
            'Use',
            'Daily use by end users',
            'Development, scripts, automations',
          ],
        ],
        dataFlowSteps: [
          [
            'Export from the web app',
            'Go to Settings → Backup → Download JSON export',
          ],
          ['Start the API server', 'npm run dev (or just npm run dev:api)'],
          [
            'Import through the API',
            'POST to /api/data/import with your exported JSON',
          ],
          [
            'Build your integration',
            'Use the REST API for your scripts and automations',
          ],
        ],
        whySeparateLabels: [
          'Privacy:',
          'Isolation:',
          'Flexibility:',
          'Serverless:',
        ],
      },
    },
  },
});
