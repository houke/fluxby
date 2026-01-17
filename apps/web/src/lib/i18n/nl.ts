// Dutch translations for the Fluxby web app

export interface TranslationKeys {
  common: {
    save: string;
    cancel: string;
    delete: string;
    remove: string;
    edit: string;
    add: string;
    search: string;
    filter: string;
    loading: string;
    error: string;
    success: string;
    confirm: string;
    back: string;
    next: string;
    previous: string;
    close: string;
    yes: string;
    no: string;
    all: string;
    none: string;
    selected: string;
    clear: string;
    clearAll: string;
    copied: string;
    done: string;
    serverUnavailable: string;
    serverUnavailableDescription: string;
    checkingConnection: string;
    retry: string;
    retrying: string;
    lastChecked: string;
    days: string;
    transactions: string;
    total: string;
    currency: string;
    optional: string;
    of: string;
    appSubtitle: string;
    logout: string;
    toggleTheme: string;
    notifications: string;
    restartOnboarding: string;
    preparingOnboarding: string;
    filters: {
      thisMonth: string;
      lastMonth: string;
      last3Months: string;
      thisYear: string;
      lastYear: string;
      all: string;
      yearPlaceholder: string;
    };
    months: string[];
    monthsShort: string[];
    noResults: string;
    or: string;
    dismiss: string;
    comingSoon: string;
    initializingDatabase: string;
    user: string;
    backToHomepage: string;
    loadingUserData: string;
    prepareDashboard: string;
    enablePrivacy: string;
    disablePrivacy: string;
    collapse: string;
  };
  errors: {
    databaseError: string;
    databaseErrorDescription: string;
    resetDatabase: string;
  };
  migrations: {
    updateAvailable: string;
    updateRequired: string;
    updateDescription: string;
    updateDescriptionAction: string;
    newMigrationsDescription: string;
    staleCodeDescription: string;
    refreshNow: string;
    applyUpdate: string;
    applyingUpdate: string;
    applyingDescription: string;
    updateComplete: string;
    completedDescription: string;
    updateFailed: string;
    errorDescription: string;
    retry: string;
  };
  security: {
    setupTitle: string;
    setupDescription: string;
    unlockTitle: string;
    unlockDescription: string;
    recoveryWarning: string;
    newPassword: string;
    enterPassword: string;
    confirmPassword: string;
    createPassword: string;
    unlock: string;
    useBiometric: string;
    wrongPassword: string;
    passwordTooShort: string;
    passwordsNoMatch: string;
    setupError: string;
    unlockError: string;
    biometricFailed: string;
    biometricError: string;
    changePassword: string;
    currentPassword: string;
    enableBiometric: string;
    disableBiometric: string;
    autoLockTimeout: string;
    passwordChanged: string;
    biometricEnabled: string;
    biometricDisabled: string;
    lockNow: string;
    securitySettings: string;
    minutes: string;
    forgotPassword: string;
    forgotPasswordDialogTitle: string;
    forgotPasswordDialogDescription: string;
    forgotPasswordDialogWarning: string;
    resetDatabase: string;
    passwordChangedSuccess: string;
  };
  updater: {
    title: string;
    description: string;
    webDescription: string;
    checking: string;
    upToDate: string;
    newVersionAvailable: string;
    webUpdateAvailable: string;
    newVersion: string;
    downloading: string;
    readyToRestart: string;
    checkNow: string;
    installUpdate: string;
    refreshNow: string;
    viewReleaseNotes: string;
    releaseNotesTitle: string;
    checkFailed: string;
    installFailed: string;
    installComplete: string;
    errorOccurred: string;
    clickToCheck: string;
  };
  nav: {
    dashboard: string;
    transactions: string;
    analytics: string;
    budgets: string;
    subscriptions: string;
    addressBook: string;
    categories: string;
    import: string;
    settings: string;
    help: string;
  };
  bottomNav: {
    more: string;
    moreOptions: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    totalBalance: string;
    income: string;
    expenses: string;
    transfers: string;
    savingsRate: string;
    recentTransactions: string;
    viewAll: string;
    noTransactions: string;
    noData: string;
    budget: string;
    daysProgress: string;
    totalBudget: string;
    spent: string;
    expected: string;
    overBudget: string;
    underBudget: string;
    noBudgets: string;
    setBudgets: string;
    goToBudgets: string;
    balanceForecast: string;
    currentBalance: string;
    expectedIncome: string;
    expectedExpenses: string;
    expectedEndBalance: string;
    noForecast: string;
    insufficientData: string;
    needMoreHistory: string;
    importTransactions: string;
    goToImport: string;
    topAccounts: string;
    noTopAccounts: string;
    viewAddressBook: string;
    goToAddressBook: string;
    addContacts: string;
    addContactsToAddressBook: string;
    goToTransactions: string;
    monthlyOverview: string;
    expensesByCategory: string;
    showCategories: string;
    noExpenses: string;
    checkingAccount: string;
    savingsAccount: string;
    netResult: string;
    toSavings: string;
    noIncome: string;
    noComparison: string;
    monthlyIncome: string;
    incomeVsExpenses: string;
    dailyExpenses: string;
    forecast: string;
    periodSummary: string;
    totalIncome: string;
    totalExpenses: string;
    currentIncome: string;
    currentExpenses: string;
    expectedResult: string;
    inAddressBook: string;
    noDataForPeriod: string;
    noDataDescription: string;
    jumpToPeriod: string;
    viewSubscriptions: string;
    noSubscriptions: string;
    detectSubscriptions: string;
    goToSubscriptions: string;
    greetings: {
      morning: string;
      afternoon: string;
      evening: string;
      night: string;
    };
  };
  transactions: {
    title: string;
    subtitle: string;
    allTransactions: string;
    transactionsFound: string;
    searchPlaceholder: string;
    income: string;
    expense: string;
    transfer: string;
    categories: string;
    noCategory: string;
    unknownCategory: string;
    addressBook: string;
    contacts: string;
    contactsPlural: string;
    noContacts: string;
    newLabel: string;
    noTransactions: string;
    importTransactions: string;
    goToImport: string;
    unknown: string;
    editLabel: string;
    editTransactionName: string;
    description: string;
    notes: string;
    counterAccount: string;
    counterparty: string;
    details: string;
    iban: string;
    date: string;
    amount: string;
    addToAddressBook: string;
    savedToAddressBook: string;
    createContactError: string;
    inAddressBook: string;
    recurringHistory: string;
    totalThisPeriod: string;
    earlierTransaction: string;
    earlierTransactions: string;
    laterTransaction: string;
    laterTransactions: string;
    noTransactionsFound: string;
    noTransactionsInRangeTitle: string;
    noTransactionsInRangeDescription: string;
    transactionsOutsideRange: string;
    expandDateRange: string;
    viewAllData: string;
    adjustFilters: string;
    loadMore: string;
    showing: string;
    updatedCount: string;
    resetToAddressBook: string;
    resetToOriginal: string;
    paymentMethodFilter: string;
    paymentProcessorFilter: string;
    allPaymentMethods: string;
    allPaymentProcessors: string;
    noPaymentProcessor: string;
    paymentMethods: {
      pin: string;
      ideal: string;
      transfer: string;
      incasso: string;
      other: string;
      atm: string;
    };
    // Shared IBAN modal
    addToAddressBookTitle: string;
    addToAddressBookDescription: string;
    allNamesProcessed: string;
    possiblySameGroup: string;
    variants: string;
    transaction: string;
    transactionsPlural: string;
    split: string;
    merge: string;
    nameForAddressBook: string;
    allVariantsMergedInfo: string;
    close: string;
    // Rule creation modal
    createRuleTitle: string;
    createRuleDescription: string;
    searchPattern: string;
    searchPatternPlaceholder: string;
    searchPatternHelp: string;
    skipButton: string;
    createRuleButton: string;
    updateRuleButton: string;
    ruleExists: string;
    ruleExistsInCategory: string;
    addButton: string;
    // Related transactions
    applyToRelated: string;
    relatedTransactionsDescription: string;
    moreTransactions: string;
    applyWithoutRule: string;
    // Transfer toggle
    markAsTransfer: string;
    removeTransferMark: string;
    markedAsTransfer: string;
    transferMarkRemoved: string;
    internalTransfer: string;
    // Transfer modal
    markAsTransferTitle: string;
    removeTransferTitle: string;
    markAsTransferDescription: string;
    removeTransferDescription: string;
    relatedTransactionsFound: string;
    onlyThisTransaction: string;
    applyToSelected: string;
    applyToAllData: string;
    internalTransfersDetected: string;
    markedMultipleAsTransfer: string;
    removedMultipleTransferMarks: string;
    type: string;
  };
  analytics: {
    title: string;
    subtitle: string;
    monthlyTrend: string;
    categoryBreakdown: string;
    incomeVsExpenses: string;
    savingsTrend: string;
    topExpenses: string;
    yearOverYear: string;
    netOverTime: string;
    incomeVsExpensesTrend: string;
    noData: string;
    expenseBreakdown: string;
    incomeBreakdown: string;
    noExpenseData: string;
    noIncomeData: string;
    transactions: string;
    viewTransactions: string;
    toggleSubcategories: string;
    recurringPayments: string;
    recurringPaymentsDescription: string;
    selectRecurringPayment: string;
    subscriptions: string;
    subscriptionsDescription: string;
    recurringTransactions: string;
    recurringTransactionsDescription: string;
    noRecurringTransactions: string;
    selectRecurringTransaction: string;
    total: string;
    priceHistory: string;
    noPriceHistory: string;
    selectSubscription: string;
    noRecurringPayments: string;
    confirmSubscriptions: string;
    average: string;
  };
  budgets: {
    title: string;
    subtitle: string;
    newBudget: string;
    editBudget: string;
    category: string;
    amount: string;
    period: string;
    monthly: string;
    yearly: string;
    spent: string;
    remaining: string;
    overBudget: string;
    noBudgets: string;
    createFirst: string;
    deleteBudget: string;
    monthlyOverview: string;
    budgetsSet: string;
    addNewBudget: string;
    totalBudget: string;
    amountPerMonth: string;
    add: string;
    yourBudgets: string;
    over: string;
    budget: string;
    confirmDelete: string;
    viewTransactions: string;
    proposedBudgets: string;
    proposedBudgetsDescription: string;
    avgSpent: string;
    perMonth: string;
    createSelected: string;
  };
  subscriptions: {
    title: string;
    subtitle: string;
    noSubscriptions: string;
    noSubscriptionsDescription: string;
    noSubscriptionsDescriptionWithData: string;
    detectPatterns: string;
    detecting: string;
    detected: string;
    updated: string;
    totalMonthlySpend: string;
    activeSubscriptions: string;
    confirmedSubscriptions: string;
    pendingConfirmation: string;
    suggestedSubscriptions: string;
    suggestedDescription: string;
    confirm: string;
    dismiss: string;
    delete: string;
    confirmed: string;
    dismissed: string;
    deleted: string;
    nextPayment: string;
    lastPayment: string;
    avgAmount: string;
    frequency: string;
    weekly: string;
    biweekly: string;
    monthly: string;
    quarterly: string;
    yearly: string;
    variable: string;
    variableAmount: string;
    variableTooltip: string;
    priceIncrease: string;
    priceIncreaseDescription: string;
    priceIncreaseDetected: string;
    priceDecreaseDetected: string;
    priceUpdated: string;
    updateAmount: string;
    dismissAlert: string;
    missedPayment: string;
    missedPaymentDescription: string;
    newDetected: string;
    newDetectedDescription: string;
    listView: string;
    calendarView: string;
    expectedPayments: string;
    confirmPattern: string;
    confirmPatternDescription: string;
    dismissPattern: string;
    dismissPatternDescription: string;
    transactionsCount: string;
    upcomingThisMonth: string;
    paidThisMonth: string;
    alerts: string;
    noAlerts: string;
    stale: string;
    staleTooltip: string;
    staleDescription: string;
    removeStale: string;
    merchantName: string;
    transactionHistory: string;
    noTransactionsFound: string;
    showTransactions: string;
    overdue: string;
    awaitingTransaction: string;
    expectedThisPeriod: string;
    deleteStaleDescription: string;
    deleteConfirmDescription: string;
    noPendingSubscriptions: string;
    noPendingDescription: string;
    noConfirmedSubscriptions: string;
    noConfirmedDescription: string;
  };
  categories: {
    title: string;
    subtitle: string;
    newCategory: string;
    editCategory: string;
    name: string;
    icon: string;
    color: string;
    noCategories: string;
    createFirst: string;
    deleteCategory: string;
    uncategorized: string;
    addNewCategory: string;
    addCategory: string;
    categoriesCount: string;
    subcategoriesCount: string;
    categoryName: string;
    add: string;
    applyRules: string;
    applyingRules: string;
    description: string;
    save: string;
    cancel: string;
    deleteConfirm: string;
    rules: string;
    addKeywords: string;
    keywordsPlaceholder: string;
    noRules: string;
    transactions: string;
    totalSpent: string;
    viewTransactions: string;
    toggleSubcategories: string;
    toastAdded: string;
    toastUpdated: string;
    toastDeleted: string;
    toastRuleAdded: string;
    toastRuleDeleted: string;
    toastRulesApplied: string;
    toastRulesError: string;
    applyToExistingConfirm: string;
    deleteRuleConfirm: string;
    deleteRule: string;
    chooseIcon: string;
    chooseColor: string;
    inBudget: string;
    noBudget: string;
    autoRules: string;
    rulesAppliedDirectly: string;
    keywordsDescription: string;
    noKeywords: string;
    applyingRulesTitle: string;
    applyingRulesDescription: string;
    applyRulesTooltip: string;
    pleaseWait: string;
    seedWithDefaultData: string;
    seedCategories: string;
    seedCategoriesDescription: string;
    selectAll: string;
    deselectAll: string;
    addSelected: string;
    seeding: string;
    seedSuccess: string;
    seedError: string;
    rulesCount: string;
    subcategories: string;
    noSubcategories: string;
    addSubcategory: string;
    noParent: string;
    selectParent: string;
    searchPlaceholder: string;
    searchCategories: string;
  };
  import: {
    title: string;
    subtitle: string;
    newAccountsFound: string;
    newAccountsDescription: string;
    name: string;
    type: string;
    checkingAccount: string;
    savingsAccount: string;
    creditCard: string;
    saveAndImport: string;
    selectBank: string;
    selectBankDescription: string;
    comingSoon: string;
    uploadCSV: string;
    uploadCSVDescription: string;
    processingFile: string;
    processingDescription: string;
    dragDrop: string;
    selectFile: string;
    importSuccess: string;
    importSuccessDescription: string;
    importError: string;
    importHistory: string;
    noHistory: string;
    filename: string;
    date: string;
    transactions: string;
    status: string;
    imported: string;
    duplicatesSkipped: string;
    currentMonthCleared: string;
    currentMonthCount: string;
    totalInFile: string;
    onlyCSV: string;
    bank: string;
    account: string;
    howToExport: string;
    bankInstructions: string[];
    note: string;
    noteDescription: string;
    completed: string;
    failed: string;
    accountInOtherProfile: string;
    belongsToProfile: string;
    // Generic CSV mapping
    mapHeaders: string;
    mapHeadersDescription: string;
    csvColumn: string;
    mapsTo: string;
    selectField: string;
    requiredFields: string;
    optionalFields: string;
    dateColumn: string;
    amountColumn: string;
    descriptionColumn: string;
    ibanColumn: string;
    counterpartyColumn: string;
    balanceColumn: string;
    directionColumn: string;
    paymentMethodColumn: string;
    notesColumn: string;
    notMapped: string;
    preview: string;
    previewDescription: string;
    andMore: string;
    startImport: string;
    importing: string;
    importProgress: string;
    analyzingFile: string;
    analyzingFileDesc: string;
    finishingUp: string;
    finishingUpDesc: string;
    processingTransactions: string;
    savingToDatabase: string;
    importResults: string;
    importResultsDescription: string;
    skippedRows: string;
    skippedRowsDescription: string;
    skipped: string;
    andMoreSkipped: string;
    row: string;
    rowNumber: string;
    reason: string;
    invalidDate: string;
    invalidAmount: string;
    missingRequired: string;
    duplicate: string;
    otherBank: string;
    genericCsv: string;
    importingTo: string;
  };
  settings: {
    title: string;
    subtitle: string;
    tabs: {
      activeProfile: string;
      manageProfiles: string;
      appSettings: string;
    };
    appSettings: string;
    appSettingsDescription: string;
    versions: string;
    versionsDescription: string;
    language: string;
    languageDescription: string;
    currency: string;
    currencyDescription: string;
    theme: string;
    themeDescription: string;
    themeLight: string;
    themeDark: string;
    appNameLabel: string;
    appNameDescription: string;
    appNamePlaceholder: string;
    appNameUnset: string;
    masterPasswordTitle: string;
    masterPasswordDescription: string;
    masterPasswordDialogTitle: string;
    masterPasswordDialogDescription: string;
    masterPasswordWarning: string;
    masterPasswordCurrent: string;
    masterPasswordNew: string;
    masterPasswordConfirm: string;
    masterPasswordMinLength: string;
    masterPasswordChange: string;
    masterPasswordChanging: string;
    masterPasswordMustDiffer: string;
    appVersion: string;
    schemaVersion: string;
    versionMismatch: string;
    profileManager: {
      title: string;
      description: string;
      newProfile: string;
      createTitle: string;
      createDescription: string;
      editTitle: string;
      profileName: string;
      profileId: string;
      copyProfileId: string;
      idCopied: string;
      createdOn: string;
      type: string;
      types: {
        personal: string;
        business: string;
        shared: string;
        savings: string;
        investing: string;
      };
      active: string;
      switchTo: string;
      deleteConfirm: string;
      deleteProfileTitle: string;
      deleteDemoConfirm: string;
      demoDeleted: string;
      create: string;
      cancel: string;
      save: string;
      accountsTipTitle: string;
      accountsTip: string;
      addAccountsTitle: string;
      addAccountsDescription: string;
      profileCreated: string;
      addedAccounts: string;
      createError: string;
      hideProfile: string;
      showProfile: string;
      hidden: string;
      profileHidden: string;
      profileShown: string;
    };
    profile: {
      title: string;
      description: string;
      nameLabel: string;
      namePlaceholder: string;
      nameSet: string;
      avatarLabel: string;
      avatarDescription: string;
      newPatterns: string;
      selectAvatar: string;
    };
    server: {
      title: string;
      description: string;
      urlLabel: string;
      urlPlaceholder: string;
      save: string;
      tip: string;
      errorUrl: string;
      successSaved: string;
      successReset: string;
    };
    accounts: {
      title: string;
      description: string;
      types: {
        checking: string;
        savings: string;
        credit: string;
      };
      currentBalance: string;
      deleteConfirm: string;
      addTitle: string;
      ibanPlaceholder: string;
      namePlaceholder: string;
      add: string;
      orderSaved: string;
      orderSaveError: string;
    };
    addressBook: {
      title: string;
      description: string;
      namePlaceholder: string;
      nicknamePlaceholder: string;
      descriptionPlaceholder: string;
      transactions: string;
      total: string;
      deleteConfirm: string;
      emptyTitle: string;
      emptyDescription: string;
      addTitle: string;
      add: string;
    };
    paymentProcessors: {
      rulesTitle: string;
      rulesDescription: string;
      namePlaceholder: string;
      patternsPlaceholder: string;
      noRules: string;
      deleteConfirm: string;
      deleteConfirm2: string;
      deleteRuleTitle: string;
      ibansTitle: string;
      ibansDescription: string;
      noIbans: string;
      ruleAdded: string;
      ruleUpdated: string;
      ruleDeleted: string;
      rulesApplied: string;
      noTransactionsUpdated: string;
      applyToTransactions: string;
    };
    dataManagement: {
      title: string;
      description: string;
      exportTitle: string;
      exportDescription: string;
      exportButton: string;
      exportSuccess: string;
      exportError: string;
      importTitle: string;
      importDescription: string;
      importButton: string;
      importConfirm: string;
      importSuccess: string;
      importError: string;
      skippedRules: string;
      deleteTransactionsTitle: string;
      deleteTransactionsDescription: string;
      deleteTransactionsButton: string;
      deleteTransactionsConfirm: string;
      deleteTransactionsSuccess: string;
      deleteTransactionsError: string;
      deleteCategoriesTitle: string;
      deleteCategoriesDescription: string;
      deleteCategoriesButton: string;
      deleteCategoriesConfirm: string;
      deleteCategoriesSuccess: string;
      deleteCategoriesError: string;
      deleteAccountsTitle: string;
      deleteAccountsDescription: string;
      deleteAccountsButton: string;
      deleteAccountsConfirm: string;
      deleteAccountsSuccess: string;
      deleteAccountsError: string;
      deleteBudgetsTitle: string;
      deleteBudgetsDescription: string;
      deleteBudgetsButton: string;
      deleteBudgetsConfirm: string;
      deleteBudgetsSuccess: string;
      deleteBudgetsError: string;
      deleteAllTitle: string;
      deleteAllDescription: string;
      deleteAllButton: string;
      deleteAllConfirm: string;
      deleteAllSuccess: string;
      deleteAllError: string;
    };
    profileData: {
      title: string;
      description: string;
      deleteTransactionsTitle: string;
      deleteTransactionsDescription: string;
      deleteTransactionsButton: string;
      deleteTransactionsConfirm: string;
      deleteTransactionsSuccess: string;
      deleteTransactionsError: string;
      deleteCategoriesTitle: string;
      deleteCategoriesDescription: string;
      deleteCategoriesButton: string;
      deleteCategoriesConfirm: string;
      deleteCategoriesSuccess: string;
      deleteCategoriesError: string;
      deleteAccountsTitle: string;
      deleteAccountsDescription: string;
      deleteAccountsButton: string;
      deleteAccountsConfirm: string;
      deleteAccountsSuccess: string;
      deleteAccountsError: string;
      deleteBudgetsTitle: string;
      deleteBudgetsDescription: string;
      deleteBudgetsButton: string;
      deleteBudgetsConfirm: string;
      deleteBudgetsSuccess: string;
      deleteBudgetsError: string;
      deleteAddressBookTitle: string;
      deleteAddressBookDescription: string;
      deleteAddressBookButton: string;
      deleteAddressBookConfirm: string;
      deleteAddressBookSuccess: string;
      deleteAddressBookError: string;
      deleteImportHistoryTitle: string;
      deleteImportHistoryDescription: string;
      deleteImportHistoryButton: string;
      deleteImportHistoryConfirm: string;
      deleteImportHistorySuccess: string;
      deleteImportHistoryError: string;
      deleteSubscriptionsTitle: string;
      deleteSubscriptionsDescription: string;
      deleteSubscriptionsButton: string;
      deleteSubscriptionsConfirm: string;
      deleteSubscriptionsSuccess: string;
      deleteSubscriptionsError: string;
    };
    sync: {
      title: string;
      description: string;
      thisDevice: string;
      pairingCode: string;
      pairingCodeDescription: string;
      generateCode: string;
      connectToDevice: string;
      enterCode: string;
      enterCodeDescription: string;
      connect: string;
      connectionFailed: string;
      pairedDevices: string;
      lastSync: string;
      neverSynced: string;
      removeDevice: string;
      pairingRequest: string;
      showQRCode: string;
      pairDevice: string;
      qrCodeDescription: string;
      orEnterManually: string;
      newCode: string;
      qrCodeExpiry: string;
      qrCodeValid: string;
      pairingPlaceholder: string;
      pairingHint: string;
      pairingRequestDescription: string;
      accept: string;
      ready: string;
      initializing: string;
      cannotConnectToSelf: string;
      peerUnavailable: string;
      connectionTimeout: string;
      syncing: string;
      connected: string;
      notConnected: string;
      syncNow: string;
      syncNowTooltip: string;
      autoSync: string;
      autoSyncDescription: string;
      connectionSettings: string;
      syncSuccess: string;
      syncNoChanges: string;
      syncError: string;
    };
  };
  help: {
    title: string;
    subtitle: string;
    features: string;
    featuresDescription: string;
    quickStart: string;
    quickStartDescription: string;
    faq: string;
    needHelp: string;
    needHelpDescription: string;
    externalLinks: string;
    externalLinksDescription: string;
    helpCenterLink: string;
    developerDocsLink: string;
    featureList: Array<{
      title: string;
      description: string;
    }>;
    steps: Array<{
      title: string;
      description: string;
    }>;
    faqs: Array<{
      question: string;
      answer: string;
    }>;
  };
  addressBook: {
    title: string;
    subtitle: string;
    addContact: string;
    addDescription: string;
    contactsTitle: string;
    contactsCount: string;
    searchPlaceholder: string;
    filterType: string;
    sortBy: string;
    sortName: string;
    sortTransactions: string;
    sortAmount: string;
    sortRecent: string;
    clearFilters: string;
    noResults: string;
    tryDifferentSearch: string;
    loadMore: string;
    remaining: string;
    contactAdded: string;
    contactUpdated: string;
    contactDeleted: string;
    // Cleanup rules
    cleanupRules: string;
    cleanupRulesDescription: string;
    patternPlaceholder: string;
    noRulesDefined: string;
    applyToAddressBook: string;
    applyToTransactions: string;
    namesUpdatedInAddressBook: string;
    transactionNamesUpdated: string;
    // Shared IBANs
    sharedIbans: string;
    sharedIbansCollapsed: string;
    sharedIbansExpanded: string;
    rescanSharedIbans: string;
    differentNames: string;
    transactions: string;
    possiblySamePerson: string;
    editSharedIban: string;
    editSharedIbanDescription: string;
    allNamesProcessed: string;
    possibleDuplicates: string;
    split: string;
    allVariantsMerged: string;
    addToAddressBook: string;
    merge: string;
    // Suggested contacts
    suggestedContacts: string;
    suggestedContactsCollapsed: string;
    suggestedContactsExpanded: string;
    andMoreSuggested: string;
    addAsNewContact: string;
    enterName: string;
    assignedToContact: string;
    // Split contact
    splitContact: string;
    splitContactDescription: string;
    nameEqualsOriginal: string;
    contactSplit: string;
    splitWarnings: string;
    created: string;
    errorSplitting: string;
    // Toast messages
    ibanAddedToExisting: string;
    ibanAddedToMatchingName: string;
    contactsMerged: string;
    contactMovedToAddressBook: string;
    sharedIbansDetected: string;
    noSharedIbansFound: string;
    contactAddedTransactionsUpdated: string;
    contactAlreadyExists: string;
    errorAddingContact: string;
    errorAddingIban: string;
    errorMergingContacts: string;
    createError: string;
    ruleAdded: string;
    ruleAppliedAuto: string;
    ruleExists: string;
    ruleDeleted: string;
    confirmDeleteRule: string;
    // Assign to existing
    assignToExisting: string;
    searchContacts: string;
    noContactsFound: string;
    // Merged contact
    mergedContact: string;
    mergedBadge: string;
    moreIbans: string;
    splitIntoSeparate: string;
    viewTransactions: string;
    showTransactions: string;
    transactionHistory: string;
    noTransactionsFound: string;
    // Create new contact
    createNewContact: string;
    createNewContactWithIban: string;
    transactionDetails: string;
    // Shared IBAN badge
    sharedIban: string;
    sharedIbanTooltip: string;
    // Delete confirmations
    deleteRuleTitle: string;
    deleteContactTitle: string;
  };
  apiErrors: {
    // Generic errors
    requestFailed: string;
    serverError: string;
    notFound: string;
    unauthorized: string;
    // Validation errors
    required: string;
    ibanRequired: string;
    nameRequired: string;
    patternRequired: string;
    ibanAndNameRequired: string;
    ibanAndMerchantsRequired: string;
    ibanNameOriginalNamesRequired: string;
    atLeastTwoContactsRequired: string;
    contactIdAndMappingsRequired: string;
    nameOrPatternsRequired: string;
    provideNameOrAvatar: string;
    avatarFormatNotAllowed: string;
    // Address book errors
    failedToFetchAddressBook: string;
    failedToFetchTopAccounts: string;
    failedToCreateAddressBookEntry: string;
    failedToUpdateAddressBookEntry: string;
    failedToDeleteAddressBookEntry: string;
    entryNotFound: string;
    entryWithIbanExists: string;
    ibanAlreadyAssigned: string;
    ibanAlreadyAssignedTo: string;
    contactNotFound: string;
    primaryContactNotFound: string;
    failedToAddIbanToContact: string;
    failedToRemoveIbanFromContact: string;
    failedToFetchContactIbans: string;
    failedToMergeContacts: string;
    failedToMergeDuplicates: string;
    failedToSplitContact: string;
    sharedMerchantsCannotBeModified: string;
    // Cleanup rules
    failedToFetchCleanupRules: string;
    failedToCreateCleanupRule: string;
    failedToDeleteCleanupRule: string;
    failedToApplyCleanupRules: string;
    // Shared IBANs
    failedToFetchSharedIbans: string;
    failedToMarkIbanAsShared: string;
    failedToRemoveSharedIban: string;
    failedToDetectSharedIbans: string;
    failedToFetchSharedIbanMerchants: string;
    failedToAddSharedIbanMerchants: string;
    failedToRemoveMerchantMapping: string;
    failedToResolveSharedIban: string;
    // Payment providers
    failedToFetchPaymentProviders: string;
    failedToAddPaymentProvider: string;
    failedToDeletePaymentProvider: string;
    failedToFetchPaymentProviderRules: string;
    failedToAddPaymentProviderRule: string;
    failedToUpdatePaymentProviderRule: string;
    failedToDeletePaymentProviderRule: string;
    failedToDetectPaymentProvider: string;
    // Categories
    failedToFetchCategories: string;
    failedToFetchCategory: string;
    failedToCreateCategory: string;
    failedToUpdateCategory: string;
    failedToDeleteCategory: string;
    failedToDeleteAllCategories: string;
    categoryNotFound: string;
    // Budgets
    failedToFetchBudgets: string;
    failedToCreateBudget: string;
    failedToUpdateBudget: string;
    failedToDeleteBudget: string;
    failedToDeleteAllBudgets: string;
    budgetNotFound: string;
    categoryIdRequired: string;
    // Transactions
    failedToFetchTransactions: string;
    failedToFetchTransaction: string;
    failedToUpdateTransaction: string;
    failedToDeleteTransaction: string;
    failedToDeleteAllTransactions: string;
    transactionNotFound: string;
    // Import
    failedToImportFile: string;
    noFileUploaded: string;
    invalidFileFormat: string;
    // Accounts
    failedToFetchAccounts: string;
    failedToCreateAccount: string;
    failedToUpdateAccount: string;
    failedToDeleteAccount: string;
    accountNotFound: string;
    // User
    failedToFetchUserProfile: string;
    failedToUpdateUserProfile: string;
    // Category rules
    failedToFetchCategoryRules: string;
    failedToCreateCategoryRule: string;
    failedToDeleteCategoryRule: string;
    failedToApplyCategoryRules: string;
    // Analytics
    failedToFetchAnalytics: string;
    // Data management
    failedToExportData: string;
    failedToImportData: string;
    failedToResetData: string;
    // Success messages
    ruleDeleted: string;
    ibanMarkedAsShared: string;
    sharedIbanRemoved: string;
    merchantMappingRemoved: string;
    entryDeleted: string;
    ibanAddedToContact: string;
    ibanRemovedFromContact: string;
    allCategoriesDeleted: string;
    allBudgetsDeleted: string;
    pwa?: {
      installTitle: string;
      installDescription: string;
      installButton: string;
      installedTitle: string;
      installedDescription: string;
      manualInstructions?: {
        generic: string;
        iosSafari?: { title: string; steps: string[] };
        macosSafari?: { title: string; steps: string[] };
        desktop?: { title: string; steps: string[] };
        android?: { title: string; steps: string[] };
      };
      desktopInstall?: {
        title: string;
        description: string;
        buttonText: string;
        buttonDisabledText: string;
        alertMessage?: string;
      };
    };
  };
  pwa?: {
    installTitle: string;
    installDescription: string;
    installButton: string;
    installedTitle: string;
    installedDescription: string;
    manualInstructions?: {
      generic: string;
      iosSafari?: { title: string; steps: string[] };
      macosSafari?: { title: string; steps: string[] };
      desktop?: { title: string; steps: string[] };
      android?: { title: string; steps: string[] };
    };
    desktopInstall?: {
      title: string;
      description: string;
      buttonText: string;
      buttonDisabledText: string;
      alertMessage?: string;
    };
  };
  spotlight?: {
    searchPlaceholder: string;
    noResults: string;
    pages: string;
    actions: string;
    transactions: string;
    contacts: string;
    hint: string;
    toggleDarkMode: string;
    switchToLight: string;
    switchToDark: string;
    togglePrivacy: string;
    addBudget: string;
    addCategory: string;
    addContact: string;
    openSearch: string;
    openSearchTooltip: string;
    togglePrivacyTooltip: string;
    toggleDarkModeTooltip: string;
    keywords: {
      dashboard: string[];
      transactions: string[];
      analytics: string[];
      budgets: string[];
      addressBook: string[];
      categories: string[];
      import: string[];
      settings: string[];
      help: string[];
      subscriptions: string[];
      theme: string[];
      privacy: string[];
      budget: string[];
      category: string[];
      contact: string[];
    };
  };
}

export const nl: TranslationKeys = {
  common: {
    save: 'Opslaan',
    cancel: 'Annuleren',
    delete: 'Verwijderen',
    remove: 'Verwijderen',
    edit: 'Bewerken',
    add: 'Toevoegen',
    search: 'Zoeken',
    filter: 'Filter',
    loading: 'Laden...',
    error: 'Er is een fout opgetreden',
    success: 'Succes',
    confirm: 'Bevestigen',
    back: 'Terug',
    next: 'Volgende',
    previous: 'Vorige',
    close: 'Sluiten',
    yes: 'Ja',
    no: 'Nee',
    all: 'Alle',
    none: 'Geen',
    selected: 'geselecteerd',
    clear: 'Wissen',
    clearAll: 'Alles wissen',
    copied: 'Gekopieerd!',
    done: 'Klaar',
    serverUnavailable: 'Server niet bereikbaar',
    serverUnavailableDescription:
      'De backend server is momenteel niet bereikbaar. Controleer of de server draait en probeer opnieuw.',
    checkingConnection: 'Verbinding wordt gecontroleerd...',
    retry: 'Opnieuw proberen',
    retrying: 'Opnieuw proberen...',
    lastChecked: 'Laatst gecontroleerd',
    days: 'dagen',
    transactions: 'transacties',
    total: 'Totaal',
    currency: '€',
    appSubtitle: 'Je financiële vriend',
    logout: 'Uitloggen',
    toggleTheme: 'Thema wisselen',
    notifications: 'Meldingen',
    restartOnboarding: 'Rondleiding herstarten',
    preparingOnboarding: 'Profiel wisselen…',
    filters: {
      thisMonth: 'Deze maand',
      lastMonth: 'Vorige maand',
      last3Months: '3 maanden',
      thisYear: 'Dit jaar',
      lastYear: 'Vorig jaar',
      all: 'Alles',
      yearPlaceholder: 'Jaar...',
    },
    months: [
      'Januari',
      'Februari',
      'Maart',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Augustus',
      'September',
      'Oktober',
      'November',
      'December',
    ],
    monthsShort: [
      'Jan',
      'Feb',
      'Mrt',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Okt',
      'Nov',
      'Dec',
    ],
    of: 'van',
    optional: 'optioneel',
    noResults: 'Geen resultaten',
    or: 'of',
    dismiss: 'Sluiten',
    comingSoon: 'Binnenkort beschikbaar',
    initializingDatabase: 'Database initialiseren...',
    user: 'Gebruiker',
    backToHomepage: 'Terug naar homepage',
    loadingUserData: 'Gebruikersgegevens laden...',
    prepareDashboard: 'Even geduld terwijl we je dashboard voorbereiden',
    enablePrivacy: 'Verberg gevoelige data',
    disablePrivacy: 'Toon gevoelige data',
    collapse: 'Inklappen',
  },
  errors: {
    databaseError: 'Database fout',
    databaseErrorDescription:
      'Er is een fout opgetreden bij het initialiseren van de database. Probeer de pagina te vernieuwen.',
    resetDatabase: 'Reset database',
  },
  migrations: {
    updateAvailable: 'Update beschikbaar',
    updateRequired: 'Update vereist',
    updateDescription:
      'Er is een nieuwe versie van Fluxby beschikbaar. Vernieuw de pagina om de update toe te passen.',
    updateDescriptionAction:
      'Er is een nieuwe versie van Fluxby beschikbaar. Klik op "Update toepassen" om de nieuwste functies en verbeteringen te installeren.',
    newMigrationsDescription:
      'Er is een database-update vereist. Klik op "Update toepassen" om je database bij te werken en nieuwe functies in te schakelen.',
    staleCodeDescription:
      'Er is een nieuwere versie van Fluxby geïnstalleerd. De pagina wordt automatisch ververst om de nieuwste versie te laden...',
    refreshNow: 'Nu vernieuwen',
    applyUpdate: 'Update toepassen',
    applyingUpdate: 'Update toepassen...',
    applyingDescription:
      'Even geduld terwijl we je database updaten. Dit duurt slechts een moment...',
    updateComplete: 'Update voltooid',
    completedDescription:
      'Update succesvol toegepast. Applicatie wordt opnieuw geladen...',
    updateFailed: 'Update mislukt',
    errorDescription: 'Er is een fout opgetreden tijdens de update.',
    retry: 'Opnieuw proberen',
  },
  security: {
    setupTitle: 'Hoofdwachtwoord instellen',
    setupDescription:
      'Maak een hoofdwachtwoord om je gegevens te beschermen. Dit wachtwoord kan niet worden hersteld als je het vergeet.',
    unlockTitle: 'Ontgrendel Fluxby',
    unlockDescription:
      'Voer je hoofdwachtwoord in om toegang te krijgen tot je gegevens.',
    recoveryWarning:
      'Let op: Je wachtwoord kan niet worden hersteld. Als je het vergeet, zijn al je gegevens permanent ontoegankelijk.',
    newPassword: 'Wachtwoord aanmaken',
    enterPassword: 'Wachtwoord invoeren',
    confirmPassword: 'Wachtwoord bevestigen',
    createPassword: 'Wachtwoord aanmaken',
    unlock: 'Ontgrendelen',
    useBiometric: 'Gebruik biometrisch',
    wrongPassword: 'Onjuist wachtwoord',
    passwordTooShort: 'Wachtwoord moet minimaal 8 tekens bevatten',
    passwordsNoMatch: 'Wachtwoorden komen niet overeen',
    setupError: 'Fout bij instellen hoofdwachtwoord',
    unlockError: 'Fout bij ontgrendelen',
    biometricFailed: 'Biometrische authenticatie mislukt',
    biometricError: 'Biometrische fout',
    changePassword: 'Wachtwoord wijzigen',
    currentPassword: 'Huidig wachtwoord',
    enableBiometric: 'Biometrisch inschakelen',
    disableBiometric: 'Biometrisch uitschakelen',
    autoLockTimeout: 'Automatisch vergrendelen na',
    passwordChanged: 'Wachtwoord gewijzigd',
    biometricEnabled: 'Biometrisch ingeschakeld',
    biometricDisabled: 'Biometrisch uitgeschakeld',
    lockNow: 'Nu vergrendelen',
    securitySettings: 'Beveiligingsinstellingen',
    minutes: 'minuten',
    forgotPassword: 'Wachtwoord vergeten?',
    forgotPasswordDialogTitle: 'Lokale gegevens resetten?',
    forgotPasswordDialogDescription:
      'Fluxby kan je hoofdwachtwoord niet herstellen. Reset zorgt ervoor dat je lokale database wordt verwijderd en je opnieuw door de onboarding gaat.',
    forgotPasswordDialogWarning: 'Deze actie kan niet ongedaan worden gemaakt.',
    resetDatabase: 'Reset database',
    passwordChangedSuccess: 'Je master wachtwoord is succesvol gewijzigd.',
  },
  updater: {
    title: 'Software updates',
    description: 'Controleer en installeer app updates',
    webDescription: 'Controleer op app updates',
    checking: 'Controleren op updates...',
    upToDate: 'Je hebt de nieuwste versie',
    newVersionAvailable: 'Versie {version} is beschikbaar',
    webUpdateAvailable: 'Een nieuwe versie is beschikbaar',
    newVersion: 'Nieuwe versie',
    downloading: 'Update downloaden...',
    readyToRestart: 'Update klaar. Herstarten...',
    checkNow: 'Nu controleren',
    installUpdate: 'Update installeren',
    refreshNow: 'Nu vernieuwen',
    viewReleaseNotes: 'Bekijk release notes',
    releaseNotesTitle: 'Release notes voor {version}',
    checkFailed: 'Controleren op updates mislukt',
    installFailed: 'Update installeren mislukt',
    installComplete: 'Update geïnstalleerd! Herstarten...',
    errorOccurred: 'Er is een fout opgetreden',
    clickToCheck: 'Klik om te controleren op updates',
  },
  nav: {
    dashboard: 'Dashboard',
    transactions: 'Transacties',
    analytics: 'Analyse',
    budgets: 'Budgetten',
    subscriptions: 'Abonnementen',
    addressBook: 'Adresboek',
    categories: 'Categorieën',
    import: 'Importeren',
    settings: 'Instellingen',
    help: 'Help',
  },
  bottomNav: {
    more: 'Meer',
    moreOptions: 'Meer opties',
  },
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Je financiële overzicht',
    totalBalance: 'Totaal saldo',
    income: 'Inkomsten',
    expenses: 'Uitgaven',
    transfers: 'Interne overboekingen',
    savingsRate: 'Spaarpercentage',
    recentTransactions: 'Recente transacties',
    viewAll: 'Bekijk alles',
    noTransactions: 'Geen transacties gevonden',
    noData: 'Geen gegevens beschikbaar',
    budget: 'Budget',
    daysProgress: '{passed}/{total} dagen',
    totalBudget: 'Totaal budget',
    spent: 'Uitgegeven',
    expected: 'Verwacht',
    overBudget: 'Over budget',
    underBudget: 'Onder budget',
    noBudgets: 'Nog geen budgetten ingesteld',
    setBudgets: 'Stel budgetten in om je uitgaven te volgen',
    goToBudgets: 'Ga naar budgetten',
    balanceForecast: 'Saldo voorspelling',
    currentBalance: 'Huidig saldo',
    expectedIncome: 'Verwachte inkomsten',
    expectedExpenses: 'Verwachte uitgaven',
    expectedEndBalance: 'Verwacht eindsaldo',
    noForecast: 'Geen voorspelling beschikbaar',
    insufficientData: 'Onvoldoende data voor voorspelling',
    needMoreHistory:
      'Er is meer transactiegeschiedenis nodig voor een betrouwbare voorspelling',
    importTransactions: 'Importeer transacties om te beginnen',
    goToImport: 'Ga naar importeren',
    topAccounts: 'Top tegenrekeningen',
    noTopAccounts: 'Nog geen tegenrekeningen bekend',
    viewAddressBook: 'Bekijk adresboek',
    goToAddressBook: 'Ga naar adresboek',
    addContacts: 'Voeg contacten toe aan je adresboek',
    addContactsToAddressBook: 'Voeg contacten toe aan je adresboek',
    goToTransactions: 'Ga naar transacties',
    monthlyOverview: 'Maandelijks overzicht',
    expensesByCategory: 'Uitgaven per categorie',
    showCategories: 'Categorieën',
    noExpenses: 'Geen uitgaven deze maand',
    checkingAccount: 'Betaalrekening',
    savingsAccount: 'Spaarrekening',
    netResult: 'Netto resultaat',
    toSavings: 'Sparen',
    noIncome: 'Geen inkomsten deze maand',
    noComparison: 'Geen data beschikbaar voor vergelijking',
    monthlyIncome: 'Maandelijkse inkomsten',
    incomeVsExpenses: 'Inkomsten vs uitgaven',
    dailyExpenses: 'Dagelijkse uitgaven',
    forecast: 'Voorspelling',
    periodSummary: 'Periode samenvatting',
    totalIncome: 'Totaal inkomsten',
    totalExpenses: 'Totaal uitgaven',
    inAddressBook: 'In adresboek',
    currentIncome: 'Huidige inkomsten',
    currentExpenses: 'Huidige uitgaven',
    expectedResult: 'Verwacht resultaat',
    noDataForPeriod: 'Geen gegevens voor deze periode',
    noDataDescription:
      'Geen transacties gevonden voor {period}. Wil je een periode met gegevens bekijken?',
    jumpToPeriod: 'Ga naar {period}',
    viewSubscriptions: 'Bekijk abonnementen',
    noSubscriptions: 'Nog geen abonnementen gedetecteerd',
    detectSubscriptions: 'Detecteer automatisch terugkerende betalingen',
    goToSubscriptions: 'Ga naar abonnementen',
    greetings: {
      morning: 'Goedemorgen',
      afternoon: 'Goedemiddag',
      evening: 'Goedenavond',
      night: 'Goedenacht',
    },
  },
  transactions: {
    title: 'Transacties',
    subtitle: 'Beheer je inkomsten en uitgaven',
    allTransactions: 'Alle Transacties',
    transactionsFound: 'transacties gevonden',
    searchPlaceholder: 'Zoek op omschrijving, IBAN of categorie...',
    income: 'Inkomsten',
    expense: 'Uitgaven',
    transfer: 'Overboekingen',
    categories: 'Categorieën',
    noCategory: 'Geen categorie',
    unknownCategory: 'Onbekende categorie',
    addressBook: 'Adresboek',
    contacts: 'Contact',
    contactsPlural: 'Contacten',
    noContacts: 'Geen contacten',
    newLabel: 'Nieuw',
    unknown: 'Onbekend',
    noTransactions: 'Nog geen transacties',
    importTransactions: 'Importeer je eerste transacties om te beginnen.',
    goToImport: 'Ga naar importeren',
    editLabel: 'Bewerken',
    editTransactionName: 'Transactienaam bewerken',
    description: 'Omschrijving',
    notes: 'Notities',
    counterAccount: 'Tegenrekening',
    counterparty: 'Tegenrekening',
    details: 'Details',
    iban: 'IBAN',
    date: 'Datum',
    amount: 'Bedrag',
    addToAddressBook: 'Toevoegen aan adresboek',
    savedToAddressBook: 'Toegevoegd aan adresboek',
    createContactError: 'Fout bij aanmaken contact',
    inAddressBook: 'In adresboek',
    recurringHistory: 'Terugkerende historie',
    totalThisPeriod: 'Totaal deze periode',
    earlierTransaction: 'eerdere transactie',
    earlierTransactions: 'eerdere transacties',
    laterTransaction: 'latere transactie',
    laterTransactions: 'latere transacties',
    noTransactionsFound: 'Geen transacties gevonden',
    noTransactionsInRangeTitle: 'Geen transacties in deze periode',
    noTransactionsInRangeDescription:
      'Er zijn geen transacties gevonden in de geselecteerde periode, maar er zijn wel resultaten in alle gegevens.',
    transactionsOutsideRange:
      '{count} transacties buiten de geselecteerde periode',
    expandDateRange: 'Periode uitbreiden',
    viewAllData: 'Bekijk alle gegevens',
    adjustFilters: 'Pas je filters of zoekopdracht aan',
    loadMore: 'Meer laden',
    showing: 'getoond',
    updatedCount: '{count} transacties bijgewerkt',
    resetToAddressBook: 'Reset naar adresboek naam',
    resetToOriginal: 'Terugzetten naar origineel',
    paymentMethodFilter: 'Betaalmethode',
    paymentProcessorFilter: 'Betaalplatform',
    allPaymentMethods: 'Alle betaalmethodes',
    allPaymentProcessors: 'Alle betaalplatforms',
    noPaymentProcessor: 'Geen',
    paymentMethods: {
      pin: 'PIN',
      ideal: 'iDEAL',
      transfer: 'Overboeking',
      incasso: 'Incasso',
      other: 'Overig',
      atm: 'Geldautomaat',
    },
    // Shared IBAN modal
    addToAddressBookTitle: 'Toevoegen aan adresboek',
    addToAddressBookDescription:
      'Voeg namen van {iban} toe aan je adresboek. Vergelijkbare namen zijn gegroepeerd.',
    allNamesProcessed: 'Alle namen zijn verwerkt!',
    possiblySameGroup: 'Mogelijk dezelfde',
    variants: 'varianten',
    transaction: 'transactie',
    transactionsPlural: 'transacties',
    split: 'Splitsen',
    merge: 'Samenvoegen',
    nameForAddressBook: 'Naam voor adresboek',
    allVariantsMergedInfo:
      'Alle {count} varianten worden samengevoegd onder deze naam.',
    close: 'Sluiten',
    // Rule creation modal
    createRuleTitle: 'Categorie regel aanmaken',
    createRuleDescription:
      'Wil je een regel aanmaken zodat transacties met een vergelijkbare naam automatisch worden gecategoriseerd?',
    searchPattern: 'Zoekpatroon',
    searchPatternPlaceholder: 'Zoekpatroon voor merchant naam...',
    searchPatternHelp:
      'Transacties met dit patroon in de naam worden automatisch gecategoriseerd',
    skipButton: 'Overslaan',
    createRuleButton: 'Regel aanmaken',
    updateRuleButton: 'Regel bijwerken',
    ruleExists: 'Deze regel bestaat al',
    ruleExistsInCategory:
      'Er bestaat al een regel voor "{pattern}" in {category}',
    addButton: 'Toevoegen',
    // Related transactions
    applyToRelated: 'Ook toepassen op {count} gerelateerde transacties',
    relatedTransactionsDescription:
      'Deze transacties hebben dezelfde tegenrekening of naam. Selecteer welke je ook wilt categoriseren.',
    moreTransactions: 'meer transacties',
    applyWithoutRule: 'Toepassen zonder regel',
    // Transfer toggle
    markAsTransfer: 'Markeer als interne overboeking',
    removeTransferMark: 'Interne overboeking ongedaan maken',
    markedAsTransfer: 'Gemarkeerd als interne overboeking',
    transferMarkRemoved: 'Transactie is niet langer een interne overboeking',
    internalTransfer: 'Interne overboeking',
    // Transfer modal
    markAsTransferTitle: 'Markeren als overboeking',
    removeTransferTitle: 'Overboeking markering verwijderen',
    markAsTransferDescription:
      'Er zijn gerelateerde transacties gevonden. Wil je deze ook markeren als overboeking?',
    removeTransferDescription:
      'Er zijn gerelateerde transacties gevonden. Wil je de overboeking markering ook verwijderen?',
    relatedTransactionsFound: '{count} gerelateerde transacties gevonden',
    onlyThisTransaction: 'Alleen deze transactie',
    applyToSelected: 'Toepassen op {count} transacties',
    applyToAllData: 'Toepassen op alle data',
    internalTransfersDetected:
      '{count} transacties gemarkeerd als interne overboeking',
    markedMultipleAsTransfer: '{count} transacties gemarkeerd als overboeking',
    removedMultipleTransferMarks:
      'Overboeking markering verwijderd van {count} transacties',
    type: 'Type',
  },
  analytics: {
    title: 'Analyse',
    subtitle: 'Inzicht in je financiële gewoonten',
    monthlyTrend: 'Maandelijkse trend',
    categoryBreakdown: 'Verdeling per categorie',
    incomeVsExpenses: 'Inkomsten vs uitgaven',
    savingsTrend: 'Spaartrend',
    topExpenses: 'Grootste uitgaven',
    yearOverYear: 'Jaar over jaar',
    netOverTime: 'Netto over tijd',
    incomeVsExpensesTrend: 'Inkomsten vs uitgaven trend',
    noData: 'Geen gegevens beschikbaar voor deze periode',
    expenseBreakdown: 'Uitgaven verdeling',
    incomeBreakdown: 'Inkomsten verdeling',
    noExpenseData: 'Geen uitgaven gevonden',
    noIncomeData: 'Geen inkomsten gevonden',
    transactions: 'Transacties',
    viewTransactions: 'Bekijk transacties',
    toggleSubcategories: 'Subcategorieën tonen/verbergen',
    recurringPayments: 'Terugkerende betalingen',
    recurringPaymentsDescription:
      'Partijen met 2+ transacties in de geselecteerde periode',
    selectRecurringPayment: 'Selecteer een betaling om de historie te bekijken',
    subscriptions: 'Abonnementen',
    subscriptionsDescription:
      'Bevestigde terugkerende uitgaven met minimaal 6 transacties',
    recurringTransactions: 'Terugkerende transacties',
    recurringTransactionsDescription: 'Transacties met minimaal 6 herhalingen',
    noRecurringTransactions:
      'Geen terugkerende transacties met minimaal 6 herhalingen',
    selectRecurringTransaction:
      'Selecteer een transactie om de historie te bekijken',
    total: 'Totaal',
    priceHistory: 'Prijsgeschiedenis',
    noPriceHistory: 'Geen prijsgeschiedenis beschikbaar',
    selectSubscription:
      'Selecteer een abonnement om prijsgeschiedenis te bekijken',
    noRecurringPayments: 'Geen terugkerende betalingen in deze periode',
    confirmSubscriptions:
      'Bevestig gedetecteerde abonnementen op de abonnementen pagina',
    average: 'Gem.',
  },
  budgets: {
    title: 'Budgetten',
    subtitle: 'Stel doelen en volg je uitgaven',
    newBudget: 'Nieuw Budget',
    editBudget: 'Budget Bewerken',
    category: 'Categorie',
    amount: 'Bedrag',
    period: 'Periode',
    monthly: 'Maandelijks',
    yearly: 'Jaarlijks',
    spent: 'Uitgegeven',
    remaining: 'Resterend',
    overBudget: 'Over budget',
    noBudgets: 'Nog geen budgetten ingesteld',
    createFirst: 'Maak je eerste budget aan om je uitgaven te volgen',
    deleteBudget: 'Budget Verwijderen',
    monthlyOverview: 'Maandelijks Overzicht',
    budgetsSet: 'budgetten ingesteld',
    addNewBudget: 'Nieuw budget toevoegen',
    totalBudget: 'Totaal budget',
    amountPerMonth: 'Bedrag per maand',
    add: 'Toevoegen',
    yourBudgets: 'Jouw Budgetten',
    over: 'over',
    budget: 'budget',
    confirmDelete: 'Weet je zeker dat je dit budget wilt verwijderen?',
    viewTransactions: 'Bekijk transacties',
    proposedBudgets: 'Voorgestelde budgetten',
    proposedBudgetsDescription:
      'Slimme budgetvoorstellen op basis van je uitgaven van de afgelopen maanden',
    avgSpent: 'Gem. uitgegeven',
    perMonth: 'per maand',
    createSelected: 'Aanmaken',
  },
  subscriptions: {
    title: 'Abonnementen',
    subtitle: 'Beheer je terugkerende betalingen',
    noSubscriptions: 'Nog geen abonnementen gedetecteerd',
    noSubscriptionsDescription:
      'Importeer transacties om terugkerende betalingen automatisch te herkennen',
    noSubscriptionsDescriptionWithData:
      'Detecteer terugkerende patronen uit je geïmporteerde transacties',
    detectPatterns: 'Patronen detecteren',
    detecting: 'Bezig met detecteren...',
    detected: 'nieuwe patronen gedetecteerd',
    updated: 'patronen bijgewerkt',
    totalMonthlySpend: 'Totaal per maand',
    activeSubscriptions: 'Actieve abonnementen',
    confirmedSubscriptions: 'Bevestigd',
    pendingConfirmation: 'Te bevestigen',
    suggestedSubscriptions: 'Voorgestelde abonnementen',
    suggestedDescription:
      'We hebben deze terugkerende betalingen gedetecteerd. Accepteer om te volgen of negeer om te verbergen.',
    confirm: 'Accepteren',
    dismiss: 'Negeren',
    delete: 'Verwijderen',
    confirmed: 'Abonnement geaccepteerd',
    dismissed: 'Abonnement genegeerd',
    deleted: 'Abonnement verwijderd',
    nextPayment: 'Volgende betaling',
    lastPayment: 'Laatste betaling',
    avgAmount: 'Gem. bedrag',
    frequency: 'Frequentie',
    weekly: 'Wekelijks',
    biweekly: 'Tweewekelijks',
    monthly: 'Maandelijks',
    quarterly: 'Per kwartaal',
    yearly: 'Jaarlijks',
    variable: 'Variabel',
    variableAmount: 'Bedrag varieert',
    variableTooltip:
      'Dit abonnement heeft wisselende bedragen per betaling, bijvoorbeeld op basis van gebruik',
    priceIncrease: 'Prijsverhoging',
    priceIncreaseDescription: 'Laatste bedrag is hoger dan gemiddelde',
    priceIncreaseDetected:
      'Prijsverhoging gedetecteerd. Wil je het abonnementsbedrag bijwerken?',
    priceDecreaseDetected:
      'Prijsverlaging gedetecteerd. Wil je het abonnementsbedrag bijwerken?',
    priceUpdated: 'Abonnementsbedrag bijgewerkt',
    updateAmount: 'Abonnementsbedrag bijwerken',
    dismissAlert: 'Melding negeren',
    missedPayment: 'Gemiste betaling',
    missedPaymentDescription: 'Verwachte datum is verstreken',
    newDetected: 'Nieuw gedetecteerd',
    newDetectedDescription: 'Bevestig of dit een abonnement is',
    listView: 'Lijstweergave',
    calendarView: 'Kalenderweergave',
    expectedPayments: 'Verwachte betalingen',
    confirmPattern: 'Abonnement bevestigen',
    confirmPatternDescription:
      'Bevestig dat dit een terugkerende betaling is die je wilt volgen',
    dismissPattern: 'Patroon negeren',
    dismissPatternDescription: 'Dit is geen abonnement, verberg dit patroon',
    transactionsCount: '{count} transacties',
    upcomingThisMonth: 'Verwacht deze maand',
    paidThisMonth: 'Betaald deze maand',
    alerts: 'Meldingen',
    noAlerts: 'Geen meldingen',
    stale: 'Inactief',
    staleTooltip: 'Geen transacties meer dan 2 maanden',
    staleDescription:
      'Dit abonnement lijkt niet meer actief. Wil je het verwijderen?',
    removeStale: 'Verwijderen',
    merchantName: 'Naam',
    transactionHistory: 'Transactiegeschiedenis',
    noTransactionsFound: 'Geen transacties gevonden',
    showTransactions: 'Toon transacties',
    overdue: 'te laat',
    awaitingTransaction: 'nog verwacht',
    expectedThisPeriod: 'Verwacht deze periode',
    deleteStaleDescription:
      'Dit abonnement lijkt niet meer actief te zijn en wordt verwijderd uit je profiel.',
    deleteConfirmDescription:
      'Weet je zeker dat je dit abonnement wilt verwijderen?',
    noPendingSubscriptions: 'Geen voorgestelde abonnementen',
    noPendingDescription:
      'Wanneer we nieuwe terugkerende patronen detecteren, verschijnen ze hier ter beoordeling',
    noConfirmedSubscriptions: 'Geen actieve abonnementen',
    noConfirmedDescription:
      'Accepteer voorgestelde abonnementen hierboven om ze hier te volgen',
  },
  categories: {
    title: 'Categorieën',
    subtitle: 'Beheer hoe je transacties worden ingedeeld',
    newCategory: 'Nieuwe Categorie',
    editCategory: 'Categorie Bewerken',
    name: 'Naam',
    icon: 'Icoon',
    color: 'Kleur',
    noCategories: 'Nog geen categorieën.',
    createFirst: 'Maak je eerste categorie aan om te beginnen',
    deleteCategory: 'Categorie Verwijderen',
    uncategorized: 'Niet gecategoriseerd',
    addNewCategory: 'Nieuwe categorie toevoegen',
    addCategory: 'Categorie toevoegen',
    categoriesCount: 'categorieën',
    subcategoriesCount: 'subcategorieën',
    categoryName: 'Categorienaam',
    add: 'Toevoegen',
    applyRules: 'Regels Toepassen',
    applyingRules: 'Regels toepassen...',
    description: 'Omschrijving',
    save: 'Opslaan',
    cancel: 'Annuleren',
    deleteConfirm: 'Weet je zeker dat je deze categorie wilt verwijderen?',
    rules: 'Regels',
    addKeywords: 'Trefwoorden toevoegen',
    keywordsPlaceholder: 'bijv. Albert Heijn, Jumbo, AH',
    noRules: 'Geen regels ingesteld',
    transactions: 'Transacties',
    totalSpent: 'Totaal uitgegeven',
    viewTransactions: 'Bekijk transacties',
    toggleSubcategories: 'Subcategorieën tonen/verbergen',
    toastAdded: 'Categorie toegevoegd',
    toastUpdated: 'Categorie bijgewerkt',
    toastDeleted: 'Categorie verwijderd',
    toastRuleAdded: 'Regel toegevoegd',
    toastRuleDeleted: 'Regel verwijderd',
    toastRulesApplied: 'transacties gecategoriseerd',
    toastRulesError: 'Fout bij toepassen van regels',
    applyToExistingConfirm:
      'Wil je deze regels ook toepassen op bestaande transacties?',
    deleteRuleConfirm: 'Weet je zeker dat je deze regel wilt verwijderen?',
    deleteRule: 'Regel verwijderen',
    chooseIcon: 'Kies icoon',
    chooseColor: 'Kies kleur',
    inBudget: 'In budget',
    noBudget: 'Geen budget',
    autoRules: 'Automatische regels',
    rulesAppliedDirectly: 'Regels worden direct toegepast',
    keywordsDescription:
      "Voer trefwoorden in (gescheiden door komma's) om transacties automatisch aan deze categorie toe te wijzen.",
    noKeywords: 'Nog geen trefwoorden',
    applyingRulesTitle: 'Regels toepassen',
    applyingRulesDescription:
      'Alle categoriseringsregels worden toegepast op alle transacties...',
    applyRulesTooltip:
      'Klik op deze knop om alle categorieregels toe te passen op alle transacties en de categorieën bij te werken waar nodig',
    pleaseWait: 'Dit kan even duren bij veel transacties...',
    seedWithDefaultData: 'Standaard categorieën laden',
    seedCategories: 'Standaard categorieën',
    seedCategoriesDescription:
      'Selecteer de categorieën die je wilt toevoegen aan je profiel.',
    selectAll: 'Alles selecteren',
    deselectAll: 'Alles deselecteren',
    addSelected: 'Geselecteerde toevoegen',
    seeding: 'Laden...',
    seedSuccess: 'Categorieën succesvol geladen',
    seedError: 'Fout bij laden van categorieën',
    rulesCount: '{count} regels',
    subcategories: 'subcategorieën',
    noSubcategories: 'Nog geen subcategorieën',
    addSubcategory: 'Subcategorie toevoegen',
    noParent: 'Geen ouder (hoofdcategorie)',
    selectParent: 'Selecteer hoofdcategorie',
    searchPlaceholder: 'Zoek categorieën...',
    searchCategories: 'Zoek categorie...',
  },
  import: {
    title: 'Importeren',
    subtitle: 'Upload je CSV-export van de bank om transacties te importeren',
    newAccountsFound: 'Nieuwe rekening(en) gevonden',
    newAccountsDescription:
      'We hebben {count} nieuwe rekening(en) gevonden in je bestand. Geef een naam en type op voor elke rekening.',
    name: 'Naam',
    type: 'Type',
    checkingAccount: 'Betaalrekening',
    savingsAccount: 'Spaarrekening',
    creditCard: 'Creditcard',
    saveAndImport: 'Opslaan & Importeren',
    selectBank: 'Selecteer bank',
    selectBankDescription:
      'Kies de bank waarvan je transacties wilt importeren',
    comingSoon: 'Binnenkort beschikbaar',
    uploadCSV: 'Upload CSV Bestand',
    uploadCSVDescription: 'Upload hier je CSV bestand met transacties',
    processingFile: 'Bestand verwerken...',
    processingDescription:
      'Transacties worden geparsed en gecontroleerd op duplicaten',
    dragDrop: 'Sleep je CSV bestand hierheen, of klik om te selecteren',
    selectFile: 'Bestand selecteren',
    importSuccess: 'Import succesvol!',
    importSuccessDescription:
      'Er zijn {count} transacties succesvol geïmporteerd.',
    importError: 'Import fout',
    importHistory: 'Importgeschiedenis',
    noHistory: 'Nog geen importgeschiedenis',
    filename: 'Bestandsnaam',
    date: 'Datum',
    transactions: 'Transacties',
    status: 'Status',
    imported: 'Geïmporteerd',
    duplicatesSkipped: 'Duplicaten overgeslagen',
    currentMonthCleared: 'Huidige maand gewist',
    currentMonthCount: 'Aantal huidige maand',
    totalInFile: 'Totaal in bestand',
    onlyCSV: 'Alleen .csv bestanden worden ondersteund',
    bank: 'Bank',
    account: 'Rekening',
    howToExport: 'Hoe exporteer ik mijn transacties?',
    bankInstructions: [
      'Log in op de portal van je bank',
      'Ga naar Betalen > Transacties',
      'Klik op Downloaden',
      'Selecteer periode en download als CSV',
    ],
    note: 'Let op',
    noteDescription:
      'Transacties van vóór de huidige maand worden slechts één keer geïmporteerd. Bij het importeren van data voor de huidige maand worden bestaande entries voor die maand eerst gewist en vervangen.',
    completed: 'Voltooid',
    failed: 'Mislukt',
    accountInOtherProfile: 'Rekening gevonden in ander profiel',
    belongsToProfile: 'Hoort bij profiel:',
    // Generic CSV mapping
    mapHeaders: 'Kolommen koppelen',
    mapHeadersDescription:
      'Koppel de kolommen uit je CSV bestand aan de juiste velden',
    csvColumn: 'CSV Kolom',
    mapsTo: 'Koppelen aan',
    selectField: 'Selecteer veld...',
    requiredFields: 'Verplichte velden',
    optionalFields: 'Optionele velden',
    dateColumn: 'Datum',
    amountColumn: 'Bedrag',
    descriptionColumn: 'Omschrijving',
    ibanColumn: 'IBAN rekening',
    counterpartyColumn: 'Tegenrekening',
    balanceColumn: 'Saldo',
    directionColumn: 'Af/Bij',
    paymentMethodColumn: 'Betaalmethode',
    notesColumn: 'Mededelingen',
    notMapped: 'Niet gekoppeld',
    preview: 'Voorbeeld',
    previewDescription: 'Bekijk hoe je transacties eruit zullen zien',
    andMore: 'en nog {count} meer',
    startImport: 'Start import',
    importing: 'Importeren...',
    importProgress: 'Voortgang: {current} van {total}',
    analyzingFile: 'Bestand analyseren...',
    analyzingFileDesc: 'Even geduld terwijl we je bestand verwerken',
    finishingUp: 'Bijna klaar...',
    finishingUpDesc: 'Nog even geduld, we zijn bijna klaar',
    processingTransactions: '{total} transacties verwerken',
    savingToDatabase: 'Opslaan naar database: {current} van {total}',
    importResults: 'Import resultaten',
    importResultsDescription:
      '{imported} transacties geïmporteerd, {skipped} overgeslagen',
    skippedRows: 'Overgeslagen rijen',
    skippedRowsDescription:
      'Deze rijen konden niet worden geïmporteerd vanwege fouten',
    skipped: 'overgeslagen',
    andMoreSkipped: '...en nog {count} transacties.',
    row: 'Rij',
    rowNumber: 'Rij {number}',
    reason: 'Reden',
    invalidDate: 'Ongeldige datum',
    invalidAmount: 'Ongeldig bedrag',
    missingRequired: 'Verplicht veld ontbreekt',
    duplicate: 'Duplicaat',
    otherBank: 'Andere bank',
    genericCsv: 'Generiek CSV bestand',
    importingTo: 'Importeren naar',
  },
  settings: {
    title: 'Instellingen',
    subtitle: 'Beheer je rekeningen en app-instellingen',
    tabs: {
      activeProfile: 'Actief profiel',
      manageProfiles: 'Profielen beheren',
      appSettings: 'App-instellingen',
    },
    appSettings: 'App Instellingen',
    appSettingsDescription: 'Beheer taal, valuta en thema',
    versions: 'Versies & Updates',
    versionsDescription: 'App versies en software updates',
    language: 'Taal',
    languageDescription: 'Kies de taal van de interface',
    currency: 'Valuta',
    currencyDescription: 'Kies de valuta voor je transacties',
    theme: 'Thema',
    themeDescription: 'Kies tussen licht of donker thema',
    themeLight: 'Licht',
    themeDark: 'Donker',
    appNameLabel: 'Je naam',
    appNameDescription: 'Wordt gebruikt in de begroeting',
    appNamePlaceholder: 'Je naam...',
    appNameUnset: 'Niet ingesteld',
    masterPasswordTitle: 'Master wachtwoord',
    masterPasswordDescription: 'Versleutelt al je financiële gegevens lokaal',
    masterPasswordDialogTitle: 'Master wachtwoord wijzigen',
    masterPasswordDialogDescription:
      'Voer je huidige wachtwoord in en kies een nieuw wachtwoord.',
    masterPasswordWarning:
      'Let op: Je wachtwoord kan niet worden hersteld. Als je het vergeet, kunnen je gegevens niet meer worden ontsleuteld.',
    masterPasswordCurrent: 'Huidig wachtwoord',
    masterPasswordNew: 'Nieuw wachtwoord',
    masterPasswordConfirm: 'Bevestig nieuw wachtwoord',
    masterPasswordMinLength: 'Minimaal 8 tekens',
    masterPasswordChange: 'Wachtwoord wijzigen',
    masterPasswordChanging: 'Wijzigen...',
    masterPasswordMustDiffer:
      'Nieuw wachtwoord moet anders zijn dan het huidige',
    appVersion: 'App versie',
    schemaVersion: 'Database schema / Code versie',
    versionMismatch: 'Schema versie mismatch. Klik om te repareren.',
    profile: {
      title: 'Profiel',
      description:
        'Pas je naam en avatar aan. Dit profiel wordt gebruikt in het menu.',
      nameLabel: 'Naam',
      namePlaceholder: 'Bijv. Persoonlijk of Gezamenlijk',
      nameSet: 'Naam instellen',
      avatarLabel: 'Avatar',
      avatarDescription: 'Kies een patroon',
      newPatterns: 'Nieuwe patronen',
      selectAvatar: 'Kies avatar',
    },
    profileManager: {
      title: 'Profielen',
      description: 'Beheer je profielen om financiën gescheiden te houden.',
      newProfile: 'Nieuw profiel',
      createTitle: 'Nieuw profiel maken',
      createDescription:
        'Maak een apart profiel voor verschillende financiële contexten.',
      editTitle: 'Profiel bewerken',
      profileName: 'Profielnaam',
      profileId: 'Profiel ID',
      copyProfileId: 'Kopieer Profiel ID',
      idCopied: 'ID succesvol gekopieerd naar klembord',
      createdOn: 'Aangemaakt op',
      type: 'Type',
      types: {
        personal: 'Persoonlijk',
        business: 'Zakelijk',
        shared: 'Gezamenlijk',
        savings: 'Sparen',
        investing: 'Beleggen',
      },
      active: 'Actief',
      switchTo: 'Wissel naar',
      deleteConfirm:
        'Weet je zeker dat je dit profiel wilt verwijderen? Alle bijbehorende gegevens gaan verloren.',
      deleteProfileTitle: 'Profiel verwijderen',
      deleteDemoConfirm:
        'Weet je zeker dat je het Demo profiel wilt verwijderen? Let op: Door de rondleiding opnieuw te starten wordt er een nieuw Demo account aangemaakt met verse voorbeelddata.',
      demoDeleted:
        'Demo profiel verwijderd. Herstart de rondleiding om een nieuwe aan te maken.',
      create: 'Profiel maken',
      cancel: 'Annuleren',
      save: 'Opslaan',
      accountsTipTitle: 'Tip: spaarrekening toevoegen',
      accountsTip:
        'Na het importeren van transacties kun je in Instellingen → Rekeningen je spaarrekening instellen. Overboekingen tussen je rekeningen worden dan automatisch herkend en tellen niet mee in je inkomsten en uitgaven analyse.',
      addAccountsTitle: 'Rekeningen toevoegen',
      addAccountsDescription:
        'Voeg bankrekeningen toe aan je nieuwe profiel. Je kunt dit ook later doen via Instellingen.',
      profileCreated: 'Profiel "{name}" is aangemaakt!',
      addedAccounts: 'Toegevoegde rekeningen:',
      createError: 'Er ging iets mis bij het aanmaken van het profiel.',
      hideProfile: 'Verberg profiel',
      showProfile: 'Toon profiel',
      hidden: 'Verborgen',
      profileHidden: 'Profiel verborgen',
      profileShown: 'Profiel zichtbaar',
    },
    server: {
      title: 'Server',
      description:
        'Vul hier de locatie naar de database als deze zich niet lokaal (zelfde host) bevindt.',
      urlLabel: 'API server URL',
      urlPlaceholder: 'Bijv. http://192.168.1.10:3001',
      save: 'Opslaan',
      tip: 'Tip: maak het veld leeg en klik op Opslaan om terug te gaan naar lokaal (zelfde host).',
      errorUrl: 'Gebruik een volledige URL, bijv. http://192.168.1.10:3001',
      successSaved: 'API server opgeslagen. Data wordt opnieuw geladen.',
      successReset: 'API server gereset naar lokaal (zelfde host).',
    },
    accounts: {
      title: 'Rekeningen',
      description:
        'Beheer je bankrekeningen. De volgorde wordt gebruikt op het dashboard.',
      types: {
        checking: 'Betaalrekening',
        savings: 'Spaarrekening',
        credit: 'Creditcard',
      },
      currentBalance: 'Huidig saldo',
      deleteConfirm:
        'Weet je zeker dat je deze rekening wilt verwijderen? Alle gekoppelde transacties worden ook verwijderd.',
      addTitle: 'Nieuwe rekening toevoegen',
      ibanPlaceholder: 'IBAN (bijv. NL00BANK0123456789)',
      namePlaceholder: 'Naam',
      add: 'Toevoegen',
      orderSaved: 'Volgorde rekeningen opgeslagen',
      orderSaveError: 'Kon de volgorde van rekeningen niet opslaan',
    },
    addressBook: {
      title: 'Adresboek',
      description:
        'Beheer je contacten. Contacten helpen je transacties per tegenrekening te volgen.',
      namePlaceholder: 'Naam',
      nicknamePlaceholder: 'Bijnaam (optioneel)',
      descriptionPlaceholder: 'Omschrijving (optioneel)',
      transactions: 'transacties',
      total: 'Totaal',
      deleteConfirm: 'Weet je zeker dat je dit contact wilt verwijderen?',
      emptyTitle: 'Nog geen contacten in je adresboek yet',
      emptyDescription:
        'Voeg contacten toe om transacties per tegenrekening te volgen',
      addTitle: 'Nieuw contact toevoegen',
      add: 'Toevoegen',
    },
    paymentProcessors: {
      rulesTitle: 'Payment processor regels',
      rulesDescription:
        'Definieer regels om payment processors te detecteren op basis van transactiegegevens. Voeg komma-gescheiden patronen toe die gematcht worden op IBAN, beschrijving of naam.',
      namePlaceholder: 'Naam (bijv. Adyen)',
      patternsPlaceholder: 'Patronen (bijv. ADYB,Adyen,adyen.com)',
      noRules: 'Geen payment processor regels geconfigureerd',
      deleteConfirm: 'Weet je zeker dat je de regel',
      deleteConfirm2: 'wilt verwijderen?',
      deleteRuleTitle: 'Regel verwijderen',
      ibansTitle: 'Payment processor IBANs',
      ibansDescription:
        'IBANs die bekend zijn als payment processor. Dit is een overzicht en wordt ook gebruikt als fallback wanneer regels niet matchen.',
      noIbans: 'Geen payment processor IBANs geconfigureerd',
      ruleAdded: 'Regel toegevoegd',
      ruleUpdated: 'Regel bijgewerkt',
      ruleDeleted: 'Regel verwijderd',
      rulesApplied: '{count} transacties bijgewerkt',
      noTransactionsUpdated: 'Geen transacties bijgewerkt',
      applyToTransactions: 'Toepassen op transacties',
    },
    dataManagement: {
      title: 'Gegevensbeheer',
      description: 'Exporteer of verwijder je gegevens',
      exportTitle: 'Exporteer Gegevens',
      exportDescription: 'Download alle data als JSON-backup',
      exportButton: 'Exporteren',
      exportSuccess: 'Export voltooid. JSON opgeslagen.',
      exportError: 'Export mislukt. Probeer opnieuw.',
      importTitle: 'Importeer Gegevens',
      importDescription:
        'Importeer een eerder exportbestand (overschrijft huidige data)',
      importButton: 'Importeren',
      importConfirm:
        'Dit overschrijft alle huidige data met het geselecteerde exportbestand. Doorgaan?',
      importSuccess: 'Import gelukt. Data is bijgewerkt.',
      importError: 'Import mislukt: controleer het exportbestand.',
      skippedRules: 'Overgeslagen categorieregels',
      deleteTransactionsTitle: 'Transacties verwijderen',
      deleteTransactionsDescription:
        'Verwijder alle transacties, rekeningen blijven behouden',
      deleteTransactionsButton: 'Transacties verwijderen',
      deleteTransactionsConfirm:
        'Weet je zeker dat je ALLE transacties wilt verwijderen? Dit kan niet ongedaan worden.',
      deleteTransactionsSuccess: 'Alle transacties zijn verwijderd',
      deleteTransactionsError: 'Er is een fout opgetreden bij het verwijderen',
      deleteCategoriesTitle: 'Categorieën verwijderen',
      deleteCategoriesDescription:
        'Verwijder alle categorieën, regels en budgetten',
      deleteCategoriesButton: 'Categorieën verwijderen',
      deleteCategoriesConfirm:
        'Weet je zeker dat je ALLE categorieën wilt verwijderen? Dit verwijdert ook alle regels en budgetten.',
      deleteCategoriesSuccess: 'Alle categorieën zijn verwijderd',
      deleteCategoriesError: 'Er is een fout opgetreden bij het verwijderen',
      deleteAccountsTitle: 'Rekeningen verwijderen',
      deleteAccountsDescription:
        'Verwijder alle rekeningen en bijbehorende transacties',
      deleteAccountsButton: 'Rekeningen verwijderen',
      deleteAccountsConfirm:
        'Weet je zeker dat je ALLE rekeningen wilt verwijderen? Dit verwijdert ook alle transacties.',
      deleteAccountsSuccess: 'Alle rekeningen zijn verwijderd',
      deleteAccountsError: 'Er is een fout opgetreden bij het verwijderen',
      deleteBudgetsTitle: 'Budgetten verwijderen',
      deleteBudgetsDescription: 'Verwijder alle budgetten',
      deleteBudgetsButton: 'Budgetten verwijderen',
      deleteBudgetsConfirm:
        'Weet je zeker dat je ALLE budgetten wilt verwijderen?',
      deleteBudgetsSuccess: 'Alle budgetten zijn verwijderd',
      deleteBudgetsError: 'Er is een fout opgetreden bij het verwijderen',
      deleteAllTitle: 'Alle gegevens verwijderen',
      deleteAllDescription:
        'Verwijder alle gegevens permanent (rekeningen, transacties, categorieën, etc.)',
      deleteAllButton: 'Alles verwijderen',
      deleteAllConfirm:
        'Weet je zeker dat je ALLE gegevens wilt verwijderen? Dit kan niet ongedaan worden.',
      deleteAllSuccess: 'Alle gegevens zijn verwijderd',
      deleteAllError: 'Er is een fout opgetreden bij het verwijderen',
    },
    profileData: {
      title: 'Profielgegevens verwijderen',
      description: 'Verwijder gegevens van {profile}',
      deleteTransactionsTitle: 'Transacties verwijderen',
      deleteTransactionsDescription:
        'Verwijder alle transacties van dit profiel',
      deleteTransactionsButton: 'Transacties verwijderen',
      deleteTransactionsConfirm:
        'Weet je zeker dat je alle transacties van dit profiel wilt verwijderen?',
      deleteTransactionsSuccess: 'Alle transacties zijn verwijderd',
      deleteTransactionsError: 'Er is een fout opgetreden bij het verwijderen',
      deleteCategoriesTitle: 'Categorieën verwijderen',
      deleteCategoriesDescription:
        'Verwijder alle categorieën, regels en budgetten van dit profiel',
      deleteCategoriesButton: 'Categorieën verwijderen',
      deleteCategoriesConfirm:
        'Weet je zeker dat je alle categorieën van dit profiel wilt verwijderen? Dit verwijdert ook alle regels en budgetten.',
      deleteCategoriesSuccess: 'Alle categorieën zijn verwijderd',
      deleteCategoriesError: 'Er is een fout opgetreden bij het verwijderen',
      deleteAccountsTitle: 'Rekeningen verwijderen',
      deleteAccountsDescription:
        'Verwijder alle rekeningen en bijbehorende transacties van dit profiel',
      deleteAccountsButton: 'Rekeningen verwijderen',
      deleteAccountsConfirm:
        'Weet je zeker dat je alle rekeningen van dit profiel wilt verwijderen? Dit verwijdert ook alle transacties.',
      deleteAccountsSuccess: 'Alle rekeningen zijn verwijderd',
      deleteAccountsError: 'Er is een fout opgetreden bij het verwijderen',
      deleteBudgetsTitle: 'Budgetten verwijderen',
      deleteBudgetsDescription: 'Verwijder alle budgetten van dit profiel',
      deleteBudgetsButton: 'Budgetten verwijderen',
      deleteBudgetsConfirm:
        'Weet je zeker dat je alle budgetten van dit profiel wilt verwijderen?',
      deleteBudgetsSuccess: 'Alle budgetten zijn verwijderd',
      deleteBudgetsError: 'Er is een fout opgetreden bij het verwijderen',
      deleteAddressBookTitle: 'Adresboek verwijderen',
      deleteAddressBookDescription:
        'Verwijder alle contacten van dit profiel (IBANs worden weer voorgesteld)',
      deleteAddressBookButton: 'Contacten verwijderen',
      deleteAddressBookConfirm:
        'Weet je zeker dat je alle contacten van dit profiel wilt verwijderen? IBANs worden weer voorgesteld.',
      deleteAddressBookSuccess: 'Alle contacten zijn verwijderd',
      deleteAddressBookError:
        'Er is een fout opgetreden bij het verwijderen van contacten',
      deleteImportHistoryTitle: 'Importgeschiedenis verwijderen',
      deleteImportHistoryDescription:
        'Verwijder opgeslagen importgeschiedenis voor dit profiel',
      deleteImportHistoryButton: 'Importgeschiedenis verwijderen',
      deleteImportHistoryConfirm:
        'Weet je zeker dat je de importgeschiedenis voor dit profiel wilt verwijderen?',
      deleteImportHistorySuccess: 'Importgeschiedenis is verwijderd',
      deleteImportHistoryError:
        'Er is een fout opgetreden bij het verwijderen van de importgeschiedenis',
      deleteSubscriptionsTitle: 'Abonnementen verwijderen',
      deleteSubscriptionsDescription:
        'Verwijder alle gedetecteerde terugkerende betalingspatronen',
      deleteSubscriptionsButton: 'Abonnementen verwijderen',
      deleteSubscriptionsConfirm:
        'Weet je zeker dat je alle abonnementen wilt verwijderen? Je kunt ze later opnieuw detecteren.',
      deleteSubscriptionsSuccess: 'Alle abonnementen zijn verwijderd',
      deleteSubscriptionsError:
        'Er is een fout opgetreden bij het verwijderen van abonnementen',
    },
    sync: {
      title: 'Apparaten synchroniseren',
      description:
        'Synchroniseer je gegevens tussen apparaten via peer-to-peer verbindingen. Geen server nodig.',
      thisDevice: 'Dit apparaat',
      pairingCode: 'Koppelingscode',
      pairingCodeDescription:
        'Deel deze code met een ander apparaat om te verbinden.',
      generateCode: 'Koppelingscode genereren',
      connectToDevice: 'Verbinden met apparaat',
      enterCode: 'Voer code in',
      enterCodeDescription:
        'Voer de koppelingscode in die wordt weergegeven op het andere apparaat.',
      connect: 'Verbinden',
      connectionFailed: 'Verbinding mislukt',
      cannotConnectToSelf: 'Je kunt niet met jezelf verbinden',
      peerUnavailable:
        'Peer onbereikbaar (controleer code en of de ander online is)',
      connectionTimeout:
        'Verbinding time-out - het andere apparaat kan achter een firewall zitten. Probeer een ander netwerk.',
      pairedDevices: 'Gekoppelde apparaten',
      lastSync: 'Laatste sync',
      neverSynced: 'Nog niet gesynchroniseerd',
      removeDevice: 'Apparaat verwijderen',
      pairingRequest: 'Koppelingsverzoek',
      showQRCode: 'Toon QR-code',
      pairDevice: 'Apparaat koppelen',
      qrCodeDescription: 'Scan deze code met het andere apparaat',
      orEnterManually: 'Of voer handmatig in',
      newCode: 'Nieuwe code',
      qrCodeExpiry: 'Code verloopt in',
      qrCodeValid: 'Deze code blijft geldig totdat je een nieuwe genereert.',
      pairingPlaceholder: 'fluxby-abc123...:ABCDEF',
      pairingHint:
        'Voer de volledige koppelingscode in inclusief de dubbele punt. De code is hoofdlettergevoelig.',
      pairingRequestDescription: '{device} wil verbinden',
      accept: 'Accepteren',
      ready: 'Gereed',
      initializing: 'Initialiseren...',
      syncing: 'Synchroniseren...',
      connected: 'Verbonden',
      notConnected: 'Niet verbonden',
      syncNow: 'Nu synchroniseren',
      syncNowTooltip: 'Forceer synchronisatie met alle verbonden apparaten',
      autoSync: 'Automatisch synchroniseren',
      autoSyncDescription: 'Wijzigingen automatisch synchroniseren',
      connectionSettings: 'Verbindingsinstellingen',
      syncSuccess: '{received} ontvangen, {pushed} verzonden',
      syncNoChanges: 'Geen nieuwe wijzigingen om te synchroniseren',
      syncError: 'Synchronisatie mislukt',
    },
  },
  help: {
    title: 'Help',
    subtitle: 'Leer hoe je het Financieel Dashboard optimaal benut',
    features: 'Functies',
    featuresDescription:
      'Een overzicht van alle beschikbare functies in de app',
    quickStart: 'Snel Starten',
    quickStartDescription: 'In 3 stappen aan de slag',
    faq: 'Veelgestelde Vragen',
    needHelp: 'Hulp Nodig?',
    needHelpDescription:
      'Heb je een vraag die niet in de FAQ staat? Bekijk onze documentatie of neem contact met ons op.',
    externalLinks: 'Meer informatie',
    externalLinksDescription:
      'Bekijk onze uitgebreide documentatie voor meer hulp en technische informatie.',
    helpCenterLink: 'Help Center',
    developerDocsLink: 'Developer documentatie',
    featureList: [
      {
        title: 'Transacties Importeren',
        description:
          'Upload je bank CSV-export om transacties te importeren. De app herkent automatisch rekeningen en categoriseert transacties.',
      },
      {
        title: 'Transacties Bekijken',
        description:
          'Bekijk, filter en zoek door al je transacties. Pas categorieën aan en voeg notities toe.',
      },
      {
        title: 'Analyse',
        description:
          'Bekijk grafieken en statistieken over je uitgaven en inkomsten per periode en categorie.',
      },
      {
        title: 'Budgetten',
        description:
          'Stel budgetten in per categorie en volg je voortgang gedurende de maand.',
      },
      {
        title: 'Categorieën',
        description:
          'Beheer categorieën en stel regels in voor automatische categorisatie van transacties.',
      },
      {
        title: 'Rekeningen',
        description:
          'Beheer je bankrekeningen en bekijk actuele saldi per rekening.',
      },
      {
        title: 'Adresboek',
        description:
          'Beheer je contacten en houd bij met welke mensen en bedrijven je transacties doet.',
      },
    ],
    steps: [
      {
        title: 'Exporteer je transacties',
        description:
          'Log in bij je bank en download je transacties als CSV-bestand.',
      },
      {
        title: 'Importeer in de app',
        description:
          'Ga naar "Importeren" en upload het CSV-bestand. De app herkent automatisch je rekeningen en categoriseert transacties.',
      },
      {
        title: 'Analyseer je financiën',
        description:
          'Bekijk het dashboard voor een overzicht, duik dieper in de analyses, of stel vragen aan de AI-assistent.',
      },
    ],
    faqs: [
      {
        question: 'Hoe exporteer ik transacties uit mijn bank?',
        answer:
          'Log in op de online omgeving van je bank, ga naar je rekeningoverzicht, selecteer de gewenste periode en klik op "Download" of "Exporteren". Kies het CSV-formaat.',
      },
      {
        question: 'Waarom worden sommige transacties niet geïmporteerd?',
        answer:
          'De app controleert op duplicaten. Als een transactie al eerder is geïmporteerd (op basis van datum, bedrag en omschrijving), wordt deze overgeslagen.',
      },
      {
        question: 'Hoe werkt automatische categorisatie?',
        answer:
          'De app gebruikt regels gebaseerd op de omschrijving en tegenrekening om transacties automatisch in te delen. Je kunt zelf regels toevoegen onder "Categorieën".',
      },
      {
        question: 'Worden mijn gegevens online opgeslagen?',
        answer:
          'Nee, al je gegevens worden lokaal opgeslagen op je computer. Er wordt niets naar externe servers verstuurd.',
      },
      {
        question: 'Hoe kan ik een categorie wijzigen van een transactie?',
        answer:
          'Ga naar "Transacties", vind de transactie die je wilt aanpassen, en klik op de categorie om deze te wijzigen.',
      },
      {
        question: 'Wat betekenen de kleuren in de grafieken?',
        answer:
          'Elke categorie heeft een eigen kleur. Groen wordt vaak gebruikt voor inkomsten, rood voor uitgaven. Je kunt de kleuren aanpassen bij "Categorieën".',
      },
      {
        question: 'Hoe stel ik een budget in?',
        answer:
          'Ga naar "Budgetten" en klik op "Nieuw Budget". Kies een categorie, stel het bedrag in en selecteer of het budget maandelijks of jaarlijks is.',
      },
      {
        question: 'Kan ik transacties handmatig toevoegen?',
        answer:
          'Op dit moment worden transacties alleen via CSV-import toegevoegd. Handmatige invoer wordt in een toekomstige versie toegevoegd.',
      },
    ],
  },
  addressBook: {
    title: 'Adresboek',
    subtitle: 'Beheer je contacten en volg transacties per tegenrekening',
    addContact: 'Contact toevoegen',
    addDescription: 'Voeg een nieuw contact toe aan je adresboek',
    contactsTitle: 'Contacten',
    contactsCount: 'contacten',
    searchPlaceholder: 'Zoek contacten...',
    filterType: 'Filter op type',
    sortBy: 'Sorteren op',
    sortName: 'Naam',
    sortTransactions: 'Transacties',
    sortAmount: 'Bedrag',
    sortRecent: 'Recent',
    clearFilters: 'Filters wissen',
    noResults: 'Geen contacten gevonden',
    tryDifferentSearch: 'Probeer een andere zoekterm',
    loadMore: 'Meer laden',
    remaining: 'resterend',
    contactAdded: 'Contact toegevoegd',
    contactUpdated: 'Contact bijgewerkt',
    contactDeleted: 'Contact verwijderd',
    // Cleanup rules
    cleanupRules: 'Bewerk opschoon regels',
    cleanupRulesDescription:
      'Tekstdelen die automatisch uit accountnamen worden verwijderd (bijv. "via Mollie"). Regex patronen zijn toegestaan (bijv. /\\s*via\\s+[^,]+$/gi).',
    patternPlaceholder: 'Tekstdeel om te verwijderen...',
    noRulesDefined: 'Geen regels gedefinieerd',
    applyToAddressBook: 'Toepassen op adresboek',
    applyToTransactions: 'Toepassen op transacties',
    namesUpdatedInAddressBook: 'Opschoonregels toegepast op adresboek',
    transactionNamesUpdated: 'Opschoonregels toegepast op transacties',
    // Shared IBANs
    sharedIbans: 'Gedeelde IBANs',
    sharedIbansCollapsed:
      'IBANs met meerdere verschillende namen in transacties. Klik om te openen.',
    sharedIbansExpanded:
      'IBANs met meerdere verschillende namen in transacties (payment processors zoals Adyen, Mollie, etc.). Deze worden niet automatisch aan het adresboek toegevoegd.',
    rescanSharedIbans: 'Scan opnieuw op gedeelde IBANs',
    differentNames: '{count} verschillende namen:',
    transactions: 'transacties',
    possiblySamePerson: 'Mogelijk dezelfde persoon/organisatie',
    editSharedIban: 'Bewerk gedeelde IBAN',
    editSharedIbanDescription:
      'Voeg namen toe aan je adresboek. Vergelijkbare namen zijn gegroepeerd.',
    allNamesProcessed: 'Alle namen zijn verwerkt!',
    possibleDuplicates:
      'Mogelijk dezelfde ({count} varianten, {transactions} transacties)',
    split: 'Splitsen',
    allVariantsMerged:
      'Alle {count} varianten worden samengevoegd onder deze naam.',
    addToAddressBook: 'Toevoegen',
    merge: 'Samenvoegen',
    // Split contact
    splitContact: 'Split contact',
    splitContactDescription:
      'Splits het contact in losse contacten per IBAN. Als een naam al bestaat, wordt deze IBAN gekoppeld aan het bestaande contact.',
    nameEqualsOriginal: 'Naam gelijk aan origineel — wordt niet gesplitst',
    contactSplit: 'Contact gesplitst ({count} aangemaakt)',
    splitWarnings: 'Splitsen voltooid met waarschuwingen',
    created: 'aangemaakt',
    errorSplitting: 'Fout bij splitsen contact',
    // Toast messages
    ibanAddedToExisting: 'IBAN toegevoegd aan bestaand contact',
    ibanAddedToMatchingName: 'IBAN toegevoegd aan contact met dezelfde naam',
    contactsMerged: 'Contacten samengevoegd',
    contactMovedToAddressBook: 'Contact verplaatst naar adresboek',
    sharedIbansDetected:
      '{added} gedeelde IBANs toegevoegd ({detected} gedetecteerd)',
    noSharedIbansFound: 'Geen gedeelde IBANs gevonden',
    contactAddedTransactionsUpdated:
      'Contact toegevoegd, {count} transacties bijgewerkt',
    contactAlreadyExists: 'Contact met deze IBAN bestaat al in adresboek',
    errorAddingContact: 'Fout bij toevoegen contact',
    errorAddingIban: 'Fout bij toevoegen IBAN',
    errorMergingContacts: 'Fout bij samenvoegen contacten',
    createError: 'Fout bij aanmaken contact',
    ruleAdded: 'Opschoonregel toegevoegd',
    ruleAppliedAuto:
      'Regel toegevoegd en toegepast: {addressBook} contacten, {transactions} transacties bijgewerkt',
    ruleExists: 'Deze regel bestaat al',
    ruleDeleted: 'Regel verwijderd',
    confirmDeleteRule: 'Weet je zeker dat je deze regel wilt verwijderen?',
    // Assign to existing
    assignToExisting: 'Toewijzen aan bestaand contact',
    searchContacts: 'Zoek contacten...',
    noContactsFound: 'Geen contacten gevonden',
    // Merged contact
    mergedContact: 'Samengevoegd contact ({count} IBANs)',
    mergedBadge: 'Samengevoegd',
    moreIbans: '+{count} meer',
    splitIntoSeparate: 'Split in losse contacten',
    viewTransactions: 'Bekijk transacties',
    showTransactions: 'Toon transacties',
    transactionHistory: 'Transactiegeschiedenis',
    noTransactionsFound: 'Geen transacties gevonden',
    // Create new contact
    createNewContact: 'Nieuw contact aanmaken',
    createNewContactWithIban: 'Nieuw contact aanmaken met IBAN',
    transactionDetails: 'Transactiegegevens',
    // Shared IBAN badge
    sharedIban: 'Gedeelde IBAN',
    sharedIbanTooltip:
      'Deze IBAN wordt door meerdere contacten gebruikt, waarschijnlijk via een payment provider zoals Adyen of Mollie',
    // Delete confirmations
    deleteRuleTitle: 'Regel verwijderen',
    deleteContactTitle: 'Contact verwijderen',
    // Suggested contacts
    suggestedContacts: 'Voorgestelde contacten',
    suggestedContactsCollapsed:
      'Tegenpartijen van transacties die nog niet in je adresboek staan. Klik om uit te vouwen.',
    suggestedContactsExpanded:
      'Dit zijn tegenpartijen van je transacties die nog niet in je adresboek staan. Voeg ze toe om uitgaven per contact bij te houden.',
    andMoreSuggested: '...en nog {count} meer',
    addAsNewContact: 'Toevoegen als nieuw contact',
    enterName: 'Voer naam in...',
    assignedToContact: 'IBAN toegewezen aan contact',
  },
  apiErrors: {
    // Generic errors
    requestFailed: 'Verzoek mislukt',
    serverError: 'Er is een serverfout opgetreden',
    notFound: 'Niet gevonden',
    unauthorized: 'Niet geautoriseerd',
    // Validation errors
    required: 'Dit veld is verplicht',
    ibanRequired: 'IBAN is verplicht',
    nameRequired: 'Naam is verplicht',
    patternRequired: 'Patroon is verplicht',
    ibanAndNameRequired: 'IBAN en naam zijn verplicht',
    ibanAndMerchantsRequired: 'IBAN en merchants lijst zijn verplicht',
    ibanNameOriginalNamesRequired:
      'IBAN, naam en originele namen zijn verplicht',
    atLeastTwoContactsRequired:
      'Selecteer minimaal 2 contacten om samen te voegen',
    contactIdAndMappingsRequired: 'Contact ID en mappings zijn verplicht',
    nameOrPatternsRequired: 'Naam of patronen zijn verplicht',
    provideNameOrAvatar: 'Geef een naam of avatar om bij te werken',
    avatarFormatNotAllowed: 'Avatar-formaat niet toegestaan',
    // Address book errors
    failedToFetchAddressBook: 'Kon adresboek niet ophalen',
    failedToFetchTopAccounts: 'Kon top accounts niet ophalen',
    failedToCreateAddressBookEntry: 'Kon contact niet aanmaken',
    failedToUpdateAddressBookEntry: 'Kon contact niet bijwerken',
    failedToDeleteAddressBookEntry: 'Kon contact niet verwijderen',
    entryNotFound: 'Contact niet gevonden',
    entryWithIbanExists: 'Contact met deze IBAN bestaat al',
    ibanAlreadyAssigned: 'IBAN is al toegewezen aan een ander contact',
    ibanAlreadyAssignedTo: 'IBAN is al toegewezen aan contact "{name}"',
    contactNotFound: 'Contact niet gevonden',
    primaryContactNotFound: 'Primair contact niet gevonden',
    failedToAddIbanToContact: 'Kon IBAN niet toevoegen aan contact',
    failedToRemoveIbanFromContact: 'Kon IBAN niet verwijderen van contact',
    failedToFetchContactIbans: 'Kon IBANs van contact niet ophalen',
    failedToMergeContacts: 'Kon contacten niet samenvoegen',
    failedToMergeDuplicates: 'Kon duplicaten niet samenvoegen',
    failedToSplitContact: 'Kon contact niet splitsen',
    sharedMerchantsCannotBeModified:
      'Gedeelde merchants kunnen niet worden aangepast. Gebruik de samenvoeggfunctie om ze naar gewone contacten te converteren.',
    // Cleanup rules
    failedToFetchCleanupRules: 'Kon opschoonregels niet ophalen',
    failedToCreateCleanupRule: 'Kon opschoonregel niet aanmaken',
    failedToDeleteCleanupRule: 'Kon opschoonregel niet verwijderen',
    failedToApplyCleanupRules: 'Kon opschoonregels niet toepassen',
    // Shared IBANs
    failedToFetchSharedIbans: 'Kon gedeelde IBANs niet ophalen',
    failedToMarkIbanAsShared: 'Kon IBAN niet als gedeeld markeren',
    failedToRemoveSharedIban: 'Kon gedeelde IBAN niet verwijderen',
    failedToDetectSharedIbans: 'Kon gedeelde IBANs niet detecteren',
    failedToFetchSharedIbanMerchants:
      'Kon merchants van gedeelde IBANs niet ophalen',
    failedToAddSharedIbanMerchants:
      'Kon merchants aan gedeelde IBAN niet toevoegen',
    failedToRemoveMerchantMapping: 'Kon merchant mapping niet verwijderen',
    failedToResolveSharedIban: 'Kon gedeelde IBAN niet verwerken',
    // Payment providers
    failedToFetchPaymentProviders: 'Kon betaalproviders niet ophalen',
    failedToAddPaymentProvider: 'Kon betaalprovider niet toevoegen',
    failedToDeletePaymentProvider: 'Kon betaalprovider niet verwijderen',
    failedToFetchPaymentProviderRules: 'Kon betaalprovider regels niet ophalen',
    failedToAddPaymentProviderRule: 'Kon betaalprovider regel niet toevoegen',
    failedToUpdatePaymentProviderRule:
      'Kon betaalprovider regel niet bijwerken',
    failedToDeletePaymentProviderRule:
      'Kon betaalprovider regel niet verwijderen',
    failedToDetectPaymentProvider: 'Kon betaalprovider niet detecteren',
    // Categories
    failedToFetchCategories: 'Kon categorieën niet ophalen',
    failedToFetchCategory: 'Kon categorie niet ophalen',
    failedToCreateCategory: 'Kon categorie niet aanmaken',
    failedToUpdateCategory: 'Kon categorie niet bijwerken',
    failedToDeleteCategory: 'Kon categorie niet verwijderen',
    failedToDeleteAllCategories: 'Kon categorieën niet verwijderen',
    categoryNotFound: 'Categorie niet gevonden',
    // Budgets
    failedToFetchBudgets: 'Kon budgetten niet ophalen',
    failedToCreateBudget: 'Kon budget niet aanmaken',
    failedToUpdateBudget: 'Kon budget niet bijwerken',
    failedToDeleteBudget: 'Kon budget niet verwijderen',
    failedToDeleteAllBudgets: 'Kon budgetten niet verwijderen',
    budgetNotFound: 'Budget niet gevonden',
    categoryIdRequired: 'Categorie is verplicht',
    // Transactions
    failedToFetchTransactions: 'Kon transacties niet ophalen',
    failedToFetchTransaction: 'Kon transactie niet ophalen',
    failedToUpdateTransaction: 'Kon transactie niet bijwerken',
    failedToDeleteTransaction: 'Kon transactie niet verwijderen',
    failedToDeleteAllTransactions: 'Kon transacties niet verwijderen',
    transactionNotFound: 'Transactie niet gevonden',
    // Import
    failedToImportFile: 'Kon bestand niet importeren',
    noFileUploaded: 'Geen bestand geüpload',
    invalidFileFormat: 'Ongeldig bestandsformaat',
    // Accounts
    failedToFetchAccounts: 'Kon rekeningen niet ophalen',
    failedToCreateAccount: 'Kon rekening niet aanmaken',
    failedToUpdateAccount: 'Kon rekening niet bijwerken',
    failedToDeleteAccount: 'Kon rekening niet verwijderen',
    accountNotFound: 'Rekening niet gevonden',
    // User
    failedToFetchUserProfile: 'Kon gebruikersprofiel niet ophalen',
    failedToUpdateUserProfile: 'Kon gebruikersprofiel niet bijwerken',
    // Category rules
    failedToFetchCategoryRules: 'Kon categorie regels niet ophalen',
    failedToCreateCategoryRule: 'Kon categorie regel niet aanmaken',
    failedToDeleteCategoryRule: 'Kon categorie regel niet verwijderen',
    failedToApplyCategoryRules: 'Kon categorie regels niet toepassen',
    // Analytics
    failedToFetchAnalytics: 'Kon statistieken niet ophalen',
    // Data management
    failedToExportData: 'Kon gegevens niet exporteren',
    failedToImportData: 'Kon gegevens niet importeren',
    failedToResetData: 'Kon gegevens niet resetten',
    // Success messages
    ruleDeleted: 'Regel verwijderd',
    ibanMarkedAsShared: 'IBAN gemarkeerd als gedeeld',
    sharedIbanRemoved: 'Gedeelde IBAN verwijderd',
    merchantMappingRemoved: 'Merchant mapping verwijderd',
    entryDeleted: 'Contact verwijderd',
    ibanAddedToContact: 'IBAN toegevoegd aan contact',
    ibanRemovedFromContact: 'IBAN verwijderd van contact',
    allCategoriesDeleted: 'Alle categorieën verwijderd',
    allBudgetsDeleted: 'Alle budgetten verwijderd',
  },
  spotlight: {
    searchPlaceholder: 'Zoeken...',
    noResults: 'Geen resultaten gevonden.',
    pages: "Pagina's",
    actions: 'Acties',
    transactions: 'Transacties',
    contacts: 'Contacten',
    hint: 'Typ om te zoeken, gebruik pijltjestoetsen om te navigeren',
    toggleDarkMode: 'Donkere modus wisselen',
    switchToLight: 'Schakel naar lichte modus',
    switchToDark: 'Schakel naar donkere modus',
    togglePrivacy: 'Privacy modus wisselen',
    addBudget: 'Budget toevoegen',
    addCategory: 'Categorie toevoegen',
    addContact: 'Contact toevoegen',
    openSearch: 'Openen zoeken',
    openSearchTooltip: 'Druk op ⌘K',
    togglePrivacyTooltip: 'Druk op ⇧⌘P',
    toggleDarkModeTooltip: 'Druk op ⇧⌘D',
    keywords: {
      dashboard: ['home', 'overzicht', 'hoofd'],
      transactions: ['betalingen', 'geschiedenis', 'transacties'],
      analytics: ['grafieken', 'rapporten', 'statistieken', 'analyses'],
      budgets: ['uitgaven', 'limieten', 'budget'],
      addressBook: ['contacten', 'personen', 'accounts', 'adresboek'],
      categories: ['labels', 'tags', 'categorieën'],
      import: ['csv', 'upload', 'importeren'],
      settings: ['voorkeuren', 'opties', 'instellingen'],
      help: ['ondersteuning', 'faq', 'docs', 'hulp'],
      subscriptions: ['terugkerend', 'patronen', 'abonnementen', 'herhalend'],
      theme: ['donker', 'licht', 'thema', 'modus'],
      privacy: ['privacy', 'vervagen', 'verbergen', 'tonen'],
      budget: ['nieuw', 'aanmaken', 'budget', 'toevoegen'],
      category: ['nieuw', 'aanmaken', 'categorie', 'label', 'toevoegen'],
      contact: [
        'nieuw',
        'aanmaken',
        'contact',
        'adres',
        'adresboek',
        'toevoegen',
      ],
    },
  },
};
