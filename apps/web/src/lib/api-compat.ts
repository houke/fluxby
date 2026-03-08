/**
 * API Compatibility Layer
 *
 * This module provides the same interface as the old api.ts but uses
 * the local OPFS database through data-service.ts.
 *
 * This allows gradual migration - files can continue importing from '@/lib/api'
 * but calls are routed to the local database instead of HTTP endpoints.
 */

import { getDataService } from './db-singleton';
import {
  DEMO_PROFILE_ID,
  type Profile,
  type ProfileCreate,
  type PatternType,
} from '@fluxby/shared';
import { readFromOPFSSync, isSettingsCacheInitialized } from '@fluxby/database';

// Note: getApiBaseUrl/setApiBaseUrl are only needed for HTTP API mode (api-http.ts)
// The local-first OPFS mode doesn't need these functions

// Helper to get active profile ID from OPFS cache
function getActiveProfileIdSync(): string | null {
  if (typeof window === 'undefined') return null;
  if (isSettingsCacheInitialized()) {
    return readFromOPFSSync<string>('fluxby.activeProfileId');
  }
  return null;
}

/**
 * The api object provides compatibility with the old HTTP API interface.
 * All methods delegate to the local data service.
 */
export const api = {
  // ============= User =============
  getUser: async () => {
    const ds = getDataService();
    return ds.getUser();
  },

  // ============= Profiles =============
  getProfiles: async (): Promise<Profile[]> => {
    const ds = getDataService();
    return ds.getProfiles();
  },

  getProfile: async (id: string): Promise<Profile | null> => {
    const ds = getDataService();
    return ds.getProfile(id);
  },

  createProfile: async (data: ProfileCreate): Promise<Profile> => {
    const ds = getDataService();
    return ds.createProfile({
      name: data.name,
      type: data.type,
      avatarUrl: data.avatarUrl || undefined,
    });
  },

  updateProfile: async (
    id: string,
    data: Partial<ProfileCreate>
  ): Promise<void> => {
    const ds = getDataService();
    await ds.updateProfile(id, {
      name: data.name,
      type: data.type,
      avatarUrl: data.avatarUrl || undefined,
    });
  },

  deleteProfile: async (id: string): Promise<void> => {
    const ds = getDataService();
    await ds.deleteProfile(id);
  },

  setProfileHidden: async (id: string, isHidden: boolean): Promise<void> => {
    const ds = getDataService();
    await ds.setProfileHidden(id, isHidden);
  },

  // ============= Accounts =============
  getAccounts: async () => {
    const ds = getDataService();
    return ds.getAccounts();
  },

  createAccount: async (data: {
    iban: string;
    name: string;
    type: string;
    bank?: string;
  }) => {
    const ds = getDataService();
    return ds.createAccount(data);
  },

  updateAccount: async (
    id: string,
    data: { name?: string; type?: string; currentBalance?: number }
  ) => {
    const ds = getDataService();
    await ds.updateAccount(id, data);
  },

  deleteAccount: async (id: string) => {
    const ds = getDataService();
    await ds.deleteAccount(id);
  },

  reorderAccounts: async (orderedIds: string[]) => {
    const ds = getDataService();
    return ds.reorderAccounts(orderedIds);
  },

  // ============= Transactions =============
  getTransactions: async (filters?: Record<string, string>) => {
    const ds = getDataService();
    return ds.getTransactions(filters);
  },

  updateTransaction: async (
    id: string,
    data: {
      type?: 'income' | 'expense' | 'transfer';
      categoryId?: string | null;
      notes?: string;
      merchantName?: string | null;
      addressBookId?: string | null;
      paymentMethod?: string | null;
      paymentProvider?: string | null;
    }
  ) => {
    const ds = getDataService();
    await ds.updateTransaction(id, {
      ...data,
      ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
    });
  },

  deleteTransaction: async (id: string) => {
    const ds = getDataService();
    await ds.deleteTransaction(id);
  },

  /**
   * Get transaction totals without loading all transaction data.
   * This is much more efficient for displaying stats.
   */
  getTransactionTotals: async (filters?: Record<string, string>) => {
    const ds = getDataService();
    return ds.getTransactionTotals(filters);
  },

  bulkCategorize: async (transactionIds: string[], categoryId: string) => {
    const ds = getDataService();
    return ds.bulkCategorize(transactionIds, categoryId);
  },

  bulkCategorizeByCounterparty: async (
    counterparty: string,
    categoryId: string
  ) => {
    const ds = getDataService();
    return ds.bulkCategorizeByCounterparty(counterparty, categoryId);
  },

  bulkRenameByCounterparty: async (oldName: string, newName: string) => {
    const ds = getDataService();
    return ds.bulkRenameByCounterparty(oldName, newName);
  },

  resetMerchantNames: async () => {
    const ds = getDataService();
    return ds.resetMerchantNames();
  },

  detectTransfers: async () => {
    const ds = getDataService();
    return ds.detectTransfers();
  },

  // ============= Bulk Operations =============
  deleteTransactionsByIds: async (
    transactionIds: string[]
  ): Promise<{
    deletedCount: number;
    affectedAccountIds: string[];
    undoToken?: string;
    expiresAt?: string;
  }> => {
    const ds = getDataService();
    return ds.deleteTransactionsByIds(transactionIds);
  },

  deleteTransactionsByDateRange: async (
    startDate: string,
    endDate: string,
    options?: {
      accountId?: string;
      dryRun?: boolean;
    }
  ): Promise<{
    deletedCount: number;
    affectedAccountIds: string[];
    undoToken?: string;
    expiresAt?: string;
  }> => {
    const ds = getDataService();
    return ds.deleteTransactionsByDateRange(startDate, endDate, options);
  },

  restoreTransactions: async (
    transactionIds: string[]
  ): Promise<{
    restoredCount: number;
    affectedAccountIds: string[];
  }> => {
    const ds = getDataService();
    return ds.restoreTransactions(transactionIds);
  },

  // ============= Categories =============
  getCategories: async (withCounts?: boolean) => {
    const ds = getDataService();
    return ds.getCategories(withCounts);
  },

  createCategory: async (data: {
    name: string;
    icon?: string;
    color?: string;
    description?: string;
    parentId?: string;
  }) => {
    const ds = getDataService();
    return ds.createCategory({
      ...data,
      parentId: data.parentId || undefined,
    });
  },

  updateCategory: async (
    id: string,
    data: {
      name?: string;
      icon?: string;
      color?: string;
      description?: string | null;
      parentId?: string | null;
    }
  ) => {
    const ds = getDataService();
    await ds.updateCategory(id, {
      ...data,
      parentId: data.parentId || null,
    });
  },

  deleteCategory: async (id: string) => {
    const ds = getDataService();
    await ds.deleteCategory(id);
  },

  getSeedCategories: async (language?: string) => {
    const ds = getDataService();
    return ds.getSeedCategories((language as 'nl' | 'en') || 'en');
  },

  applySeedCategories: async (
    categories: Array<{ name: string; icon?: string; color?: string }>
  ) => {
    const ds = getDataService();
    return ds.applySeedCategories(categories);
  },

  deleteAllCategories: async () => {
    const ds = getDataService();
    return ds.deleteAllCategories();
  },

  // ============= Category Rules =============
  getCategoryRules: async () => {
    const ds = getDataService();
    const rules = await ds.getCategoryRules();
    return rules.map((r) => ({
      id: r.id,
      pattern: r.pattern,
      categoryId: r.category_id,
      categoryName: r.category_name,
      categoryIcon: null,
      priority: r.priority,
    }));
  },

  createCategoryRule: async (data: {
    pattern: string;
    categoryId: string;
    priority?: number;
  }) => {
    const ds = getDataService();
    return ds.createCategoryRule({
      pattern: data.pattern,
      categoryId: data.categoryId,
      priority: data.priority,
    });
  },

  deleteCategoryRule: async (id: string) => {
    const ds = getDataService();
    await ds.deleteCategoryRule(id);
  },

  applyCategoriesToUncategorized: async () => {
    const ds = getDataService();
    return ds.applyCategoriesToUncategorized();
  },

  // ============= Budgets =============
  getBudgets: async (month?: string, startDate?: string, endDate?: string) => {
    const ds = getDataService();
    return ds.getBudgets(month, startDate, endDate);
  },

  createBudget: async (data: {
    categoryId?: string;
    amount: number;
    period?: string;
  }) => {
    const ds = getDataService();
    return ds.createBudget({
      categoryId: data.categoryId || undefined,
      amount: data.amount,
      period: data.period,
    });
  },

  updateBudget: async (id: string, data: { amount?: number }) => {
    const ds = getDataService();
    await ds.updateBudget(id, data);
  },

  deleteBudget: async (id: string) => {
    const ds = getDataService();
    await ds.deleteBudget(id);
  },

  getBudgetSuggestions: async () => {
    const ds = getDataService();
    return ds.getBudgetSuggestions();
  },

  deleteAllBudgets: async () => {
    const ds = getDataService();
    return ds.deleteAllBudgets();
  },

  deleteAllAddressBook: async () => {
    const ds = getDataService();
    return ds.deleteAllAddressBook();
  },

  // ============= Recurring Patterns (Subscriptions) =============
  getRecurringPatterns: async () => {
    const ds = getDataService();
    return ds.getRecurringPatterns();
  },

  getRecurringPatternsWithHistory: async (
    startDate?: string,
    endDate?: string
  ) => {
    const ds = getDataService();
    return ds.getRecurringPatternsWithHistory(startDate, endDate);
  },

  getRecurringPaymentsFromTransactions: async (
    startDate: string,
    endDate: string,
    minTransactions = 2
  ) => {
    const ds = getDataService();
    return ds.getRecurringPaymentsFromTransactions(
      startDate,
      endDate,
      minTransactions
    );
  },

  getRecurringStats: async (startDate?: string, endDate?: string) => {
    const ds = getDataService();
    return ds.getRecurringStats(startDate, endDate);
  },

  getRecurringCalendar: async (startDate: string, endDate: string) => {
    const ds = getDataService();
    return ds.getRecurringCalendar(startDate, endDate);
  },

  detectRecurringPatterns: async () => {
    const ds = getDataService();
    return ds.detectRecurringPatterns();
  },

  confirmRecurringPattern: async (id: string) => {
    const ds = getDataService();
    await ds.confirmRecurringPattern(id);
  },

  dismissRecurringPattern: async (id: string) => {
    const ds = getDataService();
    await ds.dismissRecurringPattern(id);
  },

  deleteRecurringPattern: async (id: string) => {
    const ds = getDataService();
    await ds.deleteRecurringPattern(id);
  },

  resetDismissedPatterns: async () => {
    const ds = getDataService();
    return ds.resetDismissedPatterns();
  },

  // Subscription alert dismissals
  getDismissedAlerts: async () => {
    const ds = getDataService();
    return ds.getDismissedAlerts();
  },

  dismissSubscriptionAlert: async (
    patternId: string,
    alertType: 'price_change' | 'missed_payment' | 'stale',
    dismissedAmount?: number
  ) => {
    const ds = getDataService();
    await ds.dismissSubscriptionAlert(patternId, alertType, dismissedAmount);
  },

  acceptPriceChange: async (patternId: string, newAmount: number) => {
    const ds = getDataService();
    await ds.acceptPriceChange(patternId, newAmount);
  },

  clearDismissedAlertsForPattern: async (patternId: string) => {
    const ds = getDataService();
    await ds.clearDismissedAlertsForPattern(patternId);
  },

  updateRecurringPattern: async (
    id: string,
    updates: { merchantName?: string; patternType?: PatternType }
  ) => {
    const ds = getDataService();
    await ds.updateRecurringPattern(id, updates);
  },

  getTransactionsForPattern: async (patternId: string) => {
    const ds = getDataService();
    return ds.getTransactionsForPattern(patternId);
  },

  deleteAllRecurringPatterns: async () => {
    const ds = getDataService();
    await ds.deleteAllRecurringPatterns();
  },

  // ============= Analytics =============
  getDashboardStats: async (
    startDate?: string,
    endDate?: string,
    _categoryIds?: string[],
    _accountIds?: string[]
  ) => {
    const ds = getDataService();

    // Run all queries in parallel for better performance
    const [
      basicStats,
      monthlyData,
      categoryStats,
      recentTransactions,
      transferStats,
    ] = await Promise.all([
      ds.getDashboardStats(startDate, endDate),
      ds.getMonthlyStats(startDate, endDate),
      ds.getCategoryStats(startDate, endDate),
      ds.getTransactions({ limit: '10' }),
      ds.getTransferStats(startDate, endDate),
    ]);

    return {
      totalBalance: basicStats.totalIncome - basicStats.totalExpenses,
      totalIncome: basicStats.totalIncome,
      totalExpenses: basicStats.totalExpenses,
      transferToSavings: transferStats.transferToSavings,
      transferFromSavings: transferStats.transferFromSavings,
      netSavingsTransfer:
        transferStats.transferToSavings - transferStats.transferFromSavings,
      savingsRate:
        basicStats.totalIncome > 0
          ? (transferStats.transferToSavings / basicStats.totalIncome) * 100
          : 0,
      transactionCount: basicStats.transactionCount,
      monthlyData: monthlyData.map(
        (m: { month: string; income: number; expenses: number }) => ({
          month: m.month,
          income: m.income,
          expenses: m.expenses,
          balance: m.income - m.expenses,
        })
      ),
      categoryBreakdown: categoryStats,
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id,
        date: t.date,
        merchantName: t.merchantName || null,
        description: t.description,
        opposingAccountName: t.opposingAccountName || null,
        amount: t.amount,
        categoryId: t.categoryId || null,
        type: t.type,
      })),
    };
  },

  getAvailableYears: async () => {
    const ds = getDataService();
    return ds.getAvailableYears();
  },

  getMinMaxDates: async () => {
    const ds = getDataService();
    return ds.getMinMaxDates();
  },

  getTransactionsCountOutsideRange: async (
    startDate: string,
    endDate: string,
    filters?: {
      search?: string;
      type?: string;
      categoryIds?: string;
      opposingAccountIbans?: string;
      opposingAccountName?: string;
      addressBookId?: string;
      paymentMethods?: string;
      paymentProviders?: string;
    }
  ) => {
    const ds = getDataService();
    return ds.getTransactionsCountOutsideRange(startDate, endDate, filters);
  },

  getMonthlyStats: async (startDate: string, endDate: string) => {
    const ds = getDataService();
    return ds.getMonthlyStats(startDate, endDate);
  },

  getCategoryStats: async (startDate: string, endDate: string) => {
    const ds = getDataService();
    return ds.getCategoryStats(startDate, endDate);
  },

  getDailyExpenses: async (startDate: string, endDate: string) => {
    const ds = getDataService();
    return ds.getDailyExpenses(startDate, endDate);
  },

  getBalanceForecast: async (startDate: string, endDate: string) => {
    const ds = getDataService();
    return ds.getBalanceForecast(startDate, endDate);
  },

  getTopAccounts: async (
    limit: number = 10,
    type: 'expense' | 'income' | 'all' = 'expense',
    startDate?: string,
    endDate?: string
  ) => {
    const ds = getDataService();
    return ds.getTopAccounts(limit, type, startDate, endDate);
  },

  getSuggestedContacts: async (limit?: number) => {
    const ds = getDataService();
    return ds.getSuggestedContacts(limit);
  },

  // ============= Address Book =============
  getAddressBook: async () => {
    const ds = getDataService();
    // Use getAddressBookContacts to get transaction counts and amounts
    const contacts = (await ds.getAddressBookContacts()) as Array<{
      id: string;
      iban: string;
      ibans?: string[];
      is_merged?: number;
      name: string;
      description: string | null;
      notes: string | null;
      created_at: number;
      original_name: string | null;
      transaction_count: number;
      total_income: number;
      total_expenses: number;
      last_transaction_date: string | null;
    }>;
    // Transform to expected format with counts
    return contacts.map((c) => ({
      id: c.id,
      iban: c.iban,
      ibans: c.ibans || [c.iban].filter(Boolean),
      isMerged: (c.is_merged ?? 0) === 1,
      name: c.name,
      description: c.description,
      notes: c.notes,
      createdAt: new Date(c.created_at).toISOString(),
      transactionCount: c.transaction_count || 0,
      totalIncome: c.total_income || 0,
      totalExpenses: c.total_expenses || 0,
      netAmount: (c.total_income || 0) - (c.total_expenses || 0),
      lastTransactionDate: c.last_transaction_date || null,
    }));
  },

  getAddressBookContacts: async () => {
    const ds = getDataService();
    const contacts = (await ds.getAddressBookContacts()) as Array<{
      id: string;
      iban: string;
      ibans?: string[];
      is_merged?: number;
      name: string;
      description: string | null;
      notes: string | null;
      created_at: number;
      original_name: string | null;
      transaction_count: number;
      total_income: number;
      total_expenses: number;
      last_transaction_date: string | null;
    }>;
    return contacts.map((c) => ({
      id: c.id,
      iban: c.iban,
      ibans: c.ibans || [c.iban].filter(Boolean),
      isMerged: (c.is_merged ?? 0) === 1,
      name: c.name,
      description: c.description,
      notes: c.notes,
      createdAt: new Date(c.created_at).toISOString(),
      transactionCount: c.transaction_count || 0,
      totalIncome: c.total_income || 0,
      totalExpenses: c.total_expenses || 0,
      netAmount: (c.total_income || 0) - (c.total_expenses || 0),
      lastTransactionDate: c.last_transaction_date || null,
    }));
  },

  getAddressBookContact: async (id: string) => {
    const ds = getDataService();
    return ds.getAddressBookContact(id);
  },

  createAddressBookEntry: async (data: {
    iban: string;
    name: string;
    description?: string;
    notes?: string;
  }) => {
    const ds = getDataService();
    return ds.createAddressBookEntry(data);
  },

  updateAddressBookEntry: async (
    id: string,
    data: { name?: string; description?: string; notes?: string }
  ) => {
    const ds = getDataService();
    await ds.updateAddressBookEntry(id, data);
  },

  deleteAddressBookEntry: async (id: string) => {
    const ds = getDataService();
    await ds.deleteAddressBookEntry(id);
  },

  getTransactionsForContact: async (contactId: string, limit = 50) => {
    const ds = getDataService();
    return ds.getTransactionsForContact(contactId, limit);
  },

  mergeContacts: async (ids: string[], targetName?: string) => {
    const ds = getDataService();
    return ds.mergeContacts(ids, targetName);
  },

  // ============= Cleanup Rules =============
  getCleanupRules: async () => {
    const ds = getDataService();
    const rules = await ds.getCleanupRules();
    return rules.map((r) => ({
      id: r.id,
      pattern: r.pattern,
      isActive: r.is_active === 1,
      createdAt: new Date(r.created_at).toISOString(),
    }));
  },

  createCleanupRule: async (pattern: string) => {
    const ds = getDataService();
    const result = await ds.createCleanupRule(pattern);
    return {
      id: result.id,
      pattern: result.pattern,
      isActive: result.isActive,
      createdAt: new Date().toISOString(),
    };
  },

  deleteCleanupRule: async (id: string) => {
    const ds = getDataService();
    await ds.deleteCleanupRule(id);
  },

  applyCleanupRules: async () => {
    const ds = getDataService();
    return ds.applyCleanupRules();
  },

  // ============= Shared IBANs / Payment Providers =============
  getSharedIbans: async () => {
    const ds = getDataService();
    return ds.getSharedIbansWithMerchants();
  },

  getPaymentProviderRules: async () => {
    const ds = getDataService();
    const rules = await ds.getPaymentProviderRules();
    return rules.map((r) => ({
      id: r.id,
      name: r.name,
      patterns: r.patterns,
    }));
  },

  createPaymentProviderRule: async (data: {
    name: string;
    patterns: string[];
  }) => {
    const ds = getDataService();
    return ds.createPaymentProviderRule({
      name: data.name,
      patterns: data.patterns.join(','),
    });
  },

  deletePaymentProviderRule: async (id: string) => {
    const ds = getDataService();
    await ds.deletePaymentProviderRule(id);
  },

  applyPaymentProviderRulesToTransactions: async () => {
    const ds = getDataService();
    return ds.applyPaymentProviderRulesToTransactions();
  },

  // ============= Import =============
  // Import history is now stored in the database for local-first mode
  getImportHistory: async () => {
    const ds = getDataService();
    return ds.getImportHistory();
  },

  // Parse CSV file for generic import
  parseGenericCSV: async (file: File) => {
    const csvContent = await file.text();
    const ds = getDataService();
    const result = await ds.previewCsvImport(csvContent);
    return {
      headers: result.headers,
      sampleRows: result.sampleRows,
      totalRows: result.totalRows,
    };
  },

  // Import CSV with column mapping
  importGenericCSV: async (
    file: File,
    mapping: {
      date: string;
      amount: string;
      description: string;
      iban?: string;
      counterparty?: string;
      balance?: string;
      direction?: string;
      notes?: string;
      paymentMethod?: string;
    },
    accountId?: string,
    bank?: string,
    onProgress?: (current: number, total: number) => void
  ) => {
    const csvContent = await file.text();
    const ds = getDataService();

    // Parse the CSV first
    const parseResult = await ds.previewCsvImport(csvContent);
    if (!parseResult.rows || parseResult.rows.length === 0) {
      return {
        importId: Date.now(),
        filename: file.name,
        totalInFile: 0,
        imported: 0,
        duplicatesSkipped: 0,
        parseErrors: 0,
        skippedRows: [],
      };
    }

    // Get or create account
    let targetAccountId = accountId || null;
    if (!targetAccountId) {
      // Look for existing account by IBAN from first row
      if (mapping.iban && parseResult.rows[0][mapping.iban]) {
        const accounts = await ds.getAccounts();
        const iban = parseResult.rows[0][mapping.iban];
        const existing = accounts.find(
          (a: { iban: string }) =>
            a.iban?.replace(/\s/g, '') === iban?.replace(/\s/g, '')
        );
        if (existing) {
          targetAccountId = String(existing.id);
        } else {
          // Create new account
          const newAccount = await ds.createAccount({
            iban: iban,
            name: iban,
            type: 'checking',
            bank: bank || 'unknown',
          });
          targetAccountId = String(newAccount.id);
        }
      } else {
        // Use first available account or create default
        const accounts = await ds.getAccounts();
        if (accounts.length > 0) {
          targetAccountId = String(accounts[0].id);
        } else {
          const newAccount = await ds.createAccount({
            iban: 'UNKNOWN',
            name: 'Import Account',
            type: 'checking',
            bank: bank || 'unknown',
          });
          targetAccountId = String(newAccount.id);
        }
      }
    }

    // Import using data service
    const result = await ds.importCsv(csvContent, {
      accountId: targetAccountId,
      mapping: {
        date: mapping.date,
        amount: mapping.amount,
        description: mapping.description,
        iban: mapping.iban,
        counterparty: mapping.counterparty,
        balance: mapping.balance,
        notes: mapping.notes,
        paymentMethod: mapping.paymentMethod,
      },
      direction: mapping.direction,
      filename: file.name,
      bank: bank || 'generic',
      onProgress: onProgress,
    });

    return {
      importId: Date.now(),
      filename: file.name,
      totalInFile: parseResult.totalRows,
      imported: result.imported,
      duplicatesSkipped: result.skipped,
      parseErrors: result.errors?.length || 0,
      skippedRows: (result.errors || []).map(
        (e: string, idx: number) =>
          ({
            rowIndex: idx,
            date: '',
            amount: 0,
            description: e,
            error: e,
          }) as {
            rowIndex: number;
            date: string;
            amount: number;
            description: string;
            error: string;
          }
      ),
    };
  },

  // Preview CSV for bank-specific import (ING)
  previewCSV: async (file: File, _bank?: string) => {
    const csvContent = await file.text();
    const ds = getDataService();
    const result = await ds.previewCsvImport(csvContent);

    // Extract unique IBANs from the data
    const ibanColumn =
      result.headers.find((h) => /iban|rekening/i.test(h)) || '';
    const counterpartyColumn =
      result.headers.find((h) => /tegenrekening|counterparty/i.test(h)) || '';

    const uniqueIbans = new Set<string>();
    result.rows.forEach((row: Record<string, string>) => {
      if (ibanColumn && row[ibanColumn]) {
        uniqueIbans.add(row[ibanColumn].replace(/\s/g, ''));
      }
      if (counterpartyColumn && row[counterpartyColumn]) {
        uniqueIbans.add(row[counterpartyColumn].replace(/\s/g, ''));
      }
    });

    // Get existing accounts
    const accounts = await ds.getAccounts();
    const existingAccounts = accounts.filter((a: { iban: string }) =>
      uniqueIbans.has(a.iban?.replace(/\s/g, ''))
    );

    // Find new accounts (IBANs that don't exist)
    const existingIbans = new Set(
      accounts.map((a: { iban: string }) => a.iban?.replace(/\s/g, ''))
    );
    const newAccounts = Array.from(uniqueIbans)
      .filter((iban) => !existingIbans.has(iban) && iban.length > 10)
      .map((iban) => ({
        iban,
        suggestedName: iban,
        suggestedType: 'checking' as const,
      }));

    return {
      totalTransactions: result.totalRows,
      existingAccounts,
      newAccounts,
      uniqueIbans: Array.from(uniqueIbans),
    };
  },

  // Upload CSV (bank-specific import)
  uploadCSV: async (
    file: File,
    bank?: string,
    onProgress?: (current: number, total: number) => void
  ) => {
    // Use the generic import with auto-detected mapping
    const csvContent = await file.text();
    const ds = getDataService();
    const parseResult = await ds.previewCsvImport(csvContent);

    // Auto-detect mapping based on headers
    const headers = parseResult.headers;
    const mapping = {
      date:
        headers.find((h: string) => /datum|date/i.test(h)) || headers[0] || '',
      amount:
        headers.find((h: string) => /bedrag|amount/i.test(h)) ||
        headers[1] ||
        '',
      description:
        headers.find((h: string) => /omschrijving|description|naam/i.test(h)) ||
        headers[2] ||
        '',
      iban: headers.find((h: string) => /^iban$|^rekening$/i.test(h)),
      counterparty: headers.find((h: string) =>
        /tegenrekening|counterparty/i.test(h)
      ),
      balance: headers.find((h: string) => /saldo|balance/i.test(h)),
      direction: headers.find((h: string) => /af bij|direction/i.test(h)),
    };

    // Get or create account
    let accountId: string | null = null;
    if (mapping.iban && parseResult.rows[0]?.[mapping.iban]) {
      const accounts = await ds.getAccounts();
      const iban = parseResult.rows[0][mapping.iban];
      const existing = accounts.find(
        (a: { iban: string }) =>
          a.iban?.replace(/\s/g, '') === iban?.replace(/\s/g, '')
      );
      if (existing) {
        accountId = String(existing.id);
      } else {
        const newAccount = await ds.createAccount({
          iban: iban,
          name: iban,
          type: 'checking',
          bank: bank || 'unknown',
        });
        accountId = String(newAccount.id);
      }
    } else {
      const accounts = await ds.getAccounts();
      if (accounts.length > 0) {
        accountId = String(accounts[0].id);
      } else {
        const newAccount = await ds.createAccount({
          iban: 'UNKNOWN',
          name: 'Import Account',
          type: 'checking',
          bank: bank || 'unknown',
        });
        accountId = String(newAccount.id);
      }
    }

    const result = await ds.importCsv(csvContent, {
      accountId,
      mapping,
      direction: mapping.direction,
      onProgress,
    });

    return {
      importId: Date.now(),
      imported: result.imported,
    };
  },

  previewCsvImport: async (csvContent: string, _filename?: string) => {
    const ds = getDataService();
    return ds.previewCsvImport(csvContent);
  },

  importCsv: async (
    csvContent: string,
    _filename: string,
    options?: { skipDuplicates?: boolean; accountId?: string }
  ) => {
    const ds = getDataService();
    // Get first account or create one
    let accountId = options?.accountId;
    if (!accountId) {
      const accounts = await ds.getAccounts();
      if (accounts.length > 0) {
        accountId = String(accounts[0].id);
      } else {
        const newAccount = await ds.createAccount({
          iban: 'IMPORT',
          name: 'Import Account',
          type: 'checking',
          bank: 'unknown',
        });
        accountId = String(newAccount.id);
      }
    }
    return ds.importCsv(csvContent, { accountId });
  },

  // ============= Data Management =============
  exportAll: async () => {
    const ds = getDataService();
    return ds.exportAll();
  },

  resetAllData: async () => {
    const ds = getDataService();
    return ds.resetAllData();
  },

  deleteAllTransactions: async () => {
    const ds = getDataService();
    return ds.deleteAllTransactions();
  },

  deleteImportHistory: async () => {
    const ds = getDataService();
    return ds.deleteImportHistory();
  },

  deleteAllAccounts: async () => {
    const ds = getDataService();
    return ds.deleteAllAccounts();
  },

  createDemoData: async (language: 'nl' | 'en' = 'nl') => {
    const ds = getDataService();
    const profileId = getActiveProfileIdSync();
    if (!profileId) throw new Error('No active profile');
    return ds.createDemoData(profileId, language);
  },

  // ============= User Methods =============
  updateUser: async (data: { name?: string; avatar?: string | null }) => {
    const ds = getDataService();
    // This will create user if it doesn't exist (for onboarding flow)
    return ds.updateUser(data);
  },

  // ============= Demo Data Methods =============
  createDemoProfile: async () => {
    const ds = getDataService();
    // Check if demo profile already exists
    const existingProfiles = await ds.getProfiles();
    const existingDemo = existingProfiles.find((p) => p.id === DEMO_PROFILE_ID);
    if (existingDemo) {
      return existingDemo;
    }
    // Generate a random gradient for the avatar
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFEAA7',
      '#DDA0DD',
      '#98D8C8',
      '#F7DC6F',
      '#BB8FCE',
      '#85C1E9',
      '#F8C471',
      '#82E0AA',
      '#F1948A',
      '#D7BDE2',
      '#F59E0B',
      '#EF4444',
    ];
    const color1 = colors[Math.floor(Math.random() * colors.length)];
    const color2 = colors[Math.floor(Math.random() * colors.length)];
    const angle = Math.floor(Math.random() * 360);
    const avatarGradient = `linear-gradient(${angle}deg, ${color1}, ${color2})`;

    // Create a demo profile with reserved ID
    const profile = await ds.createProfile({
      id: DEMO_PROFILE_ID,
      name: 'Demo',
      type: 'personal',
      avatarUrl: avatarGradient,
    });
    return profile;
  },

  seedDemoData: async (profileId: string, language: 'nl' | 'en' = 'nl') => {
    const ds = getDataService();
    return ds.createDemoData(profileId, language);
  },

  // Check if demo profile exists
  getDemoProfile: async (): Promise<Profile | null> => {
    const ds = getDataService();
    const profiles = await ds.getProfiles();
    return profiles.find((p) => p.id === DEMO_PROFILE_ID) || null;
  },

  // ============= Account Methods =============
  createAccountForProfile: async (data: {
    profileId: string;
    name: string;
    iban: string;
    type?: string;
    bank?: string;
  }) => {
    const ds = getDataService();
    // Pass profileId to createAccount so it's created for the correct profile
    const result = await ds.createAccount({
      name: data.name,
      iban: data.iban,
      type: data.type || 'checking',
      bank: data.bank,
      profileId: data.profileId,
    });
    return result;
  },

  updateAccountOrder: async (
    accounts: Array<{ id: string; order: number }>
  ) => {
    const ds = getDataService();
    const orderedIds = accounts
      .sort((a, b) => a.order - b.order)
      .map((a) => a.id);
    return ds.reorderAccounts(orderedIds);
  },

  // ============= AddressBook Methods =============
  applyCleanupRulesToTransactions: async () => {
    const ds = getDataService();
    return ds.applyCleanupRulesToTransactions();
  },

  backfillAddressbook: async () => {
    const ds = getDataService();
    // Get all unique IBANs from transactions and add them to addressbook
    const accounts = await ds.getTopAccounts(100, 'all');
    let added = 0;
    for (const account of accounts.accounts) {
      if (account.iban && !account.isInAddressBook) {
        try {
          await ds.createAddressBookEntry({
            iban: account.iban,
            name: account.name || account.iban,
          });
          added++;
        } catch {
          // Skip duplicates
        }
      }
    }
    return { added };
  },

  markIbanAsShared: async (iban: string, providerName?: string) => {
    const ds = getDataService();
    // Add to shared_ibans table
    const id = crypto.randomUUID();
    const now = Date.now();
    await (
      ds as unknown as {
        db: { runAsync: (sql: string, params: unknown[]) => Promise<void> };
      }
    ).db?.runAsync?.(
      'INSERT OR REPLACE INTO shared_ibans (id, iban, provider_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [id, iban, providerName || 'Unknown Provider', now, now]
    );
    return { success: true };
  },

  removeSharedIban: async (iban: string) => {
    const ds = getDataService();
    await (
      ds as unknown as {
        db: { runAsync: (sql: string, params: unknown[]) => Promise<void> };
      }
    ).db?.runAsync?.(
      'UPDATE shared_ibans SET is_deleted = 1, updated_at = ? WHERE iban = ?',
      [Date.now(), iban]
    );
    return { success: true };
  },

  detectSharedIbans: async () => {
    // Returns IBANs that appear with multiple different merchant names
    const ds = getDataService();
    const sharedIbans = await ds.getSharedIbans();
    return { sharedIbans, count: sharedIbans.length };
  },

  resolveSharedIban: async (
    iban: string,
    name: string,
    originalNames: string[],
    contactId?: string
  ) => {
    const ds = getDataService();
    return ds.resolveSharedIban(iban, name, originalNames, contactId);
  },

  addContactIban: async (contactId: string, iban: string) => {
    const ds = getDataService();
    // Add the IBAN to the contact's contact_ibans table and sync transactions
    return ds.addContactIban(contactId, iban);
  },

  splitContact: async (
    contactId: string,
    ibans: string[],
    names: string[]
  ): Promise<{
    success: boolean;
    newContacts: Array<{ id: string; iban: string; name: string }>;
  }> => {
    const ds = getDataService();
    const newContacts: Array<{ id: string; iban: string; name: string }> = [];

    // Create new contacts for each IBAN
    for (let i = 0; i < ibans.length; i++) {
      const result = await ds.createAddressBookEntry({
        iban: ibans[i],
        name: names[i] || ibans[i],
      });
      newContacts.push({
        id: result.data.id,
        iban: ibans[i],
        name: names[i] || ibans[i],
      });
    }

    // Delete original contact
    await ds.deleteAddressBookEntry(contactId);

    return { success: true, newContacts };
  },

  // ============= Category Methods =============
  seedCategories: async (language?: 'nl' | 'en') => {
    const ds = getDataService();
    const seedCategories = await ds.getSeedCategories(language || 'en');
    return ds.applySeedCategories(seedCategories);
  },

  applyCategoryRule: async (ruleId: string) => {
    const ds = getDataService();
    // Get the rule
    const rules = await ds.getCategoryRules();
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) throw new Error('Rule not found');

    // Apply the rule to matching transactions
    const result = await ds.applyCategoryRuleToTransactions(
      rule.pattern,
      rule.category_id
    );
    return { updated: result.updated };
  },

  applyAllCategoryRules: async () => {
    const ds = getDataService();
    const rules = await ds.getCategoryRules();
    let totalUpdated = 0;

    for (const rule of rules) {
      const result = await ds.applyCategoryRuleToTransactions(
        rule.pattern,
        rule.category_id
      );
      totalUpdated += result.updated;
    }

    return { updated: totalUpdated };
  },

  suggestCategory: async (description: string) => {
    const ds = getDataService();
    // Simple keyword matching against existing rules
    const rules = await ds.getCategoryRules();
    for (const rule of rules) {
      if (description.toLowerCase().includes(rule.pattern.toLowerCase())) {
        const categories = await ds.getCategories();
        const category = categories.find(
          (c) => String(c.id) === rule.category_id
        );
        if (category) {
          return {
            categoryId: category.id,
            categoryName: category.name,
            confidence: 0.8,
          };
        }
      }
    }
    return { categoryId: null, categoryName: null, confidence: 0 };
  },

  // ============= Analytics Methods =============
  getMonthlyData: async (startDate?: string, endDate?: string) => {
    const ds = getDataService();
    return ds.getMonthlyStats(startDate, endDate);
  },

  getCategoryBreakdown: async (
    startDate?: string,
    endDate?: string,
    type?: 'income' | 'expense'
  ) => {
    const ds = getDataService();
    return ds.getCategoryStats(startDate, endDate, type || 'expense');
  },

  getProposedBudgets: async () => {
    const ds = getDataService();

    // Get date range for last 6 months
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get existing budgets to exclude categories that already have budgets
    const existingBudgets = await ds.getBudgets();
    const usedCategoryIds = new Set(
      existingBudgets.filter((b) => b.categoryId).map((b) => b.categoryId)
    );

    // Calculate proposed budgets based on average spending per category
    const stats = await ds.getCategoryStats(
      startDateStr,
      endDateStr,
      'expense'
    );

    // Get monthly breakdown to count actual months with data per category
    const monthlyData = await ds.getMonthlyStats(startDateStr, endDateStr);
    const monthsWithData =
      monthlyData.filter((m) => m.expenses > 0).length || 1;

    return stats
      .filter(
        (cat) =>
          cat.categoryId &&
          cat.amount > 0 &&
          !usedCategoryIds.has(cat.categoryId)
      )
      .map((cat) => ({
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        categoryIcon: cat.icon || '📦',
        categoryColor: cat.color || '#9CA3AF',
        avgMonthlySpent: cat.amount / monthsWithData,
        basedOnMonths: monthsWithData,
        // Propose a budget slightly above average (round up to nearest 10)
        proposedAmount: Math.ceil(cat.amount / monthsWithData / 10) * 10,
      }));
  },

  // ============= Transaction Methods =============
  categorizeByCounterparty: async (
    counterparty: string,
    categoryId: string
  ) => {
    const ds = getDataService();
    return ds.bulkCategorizeByCounterparty(counterparty, categoryId);
  },

  renameByCounterparty: async (
    transactionId: string,
    newName: string | null
  ) => {
    const ds = getDataService();
    return ds.renameByTransactionId(transactionId, newName);
  },

  detectInternalTransfers: async () => {
    const ds = getDataService();
    return ds.detectTransfers();
  },

  // ============= Payment Provider Methods =============
  addPaymentProviderRule: async (rule: {
    name: string;
    patterns: string[];
  }) => {
    const ds = getDataService();
    return ds.createPaymentProviderRule({
      name: rule.name,
      patterns: rule.patterns.join(','),
    });
  },

  updatePaymentProviderRule: async (
    id: string,
    rule: { name?: string; patterns?: string[] }
  ) => {
    // Update the existing rule atomically; avoid delete-and-recreate which
    // caused issues when only updating patterns. Use simple UPDATE statement.
    const ds = getDataService();

    // Delegate to DataService update helper so the database is updated correctly
    const updates: { name?: string; patterns?: string } = {};
    if (typeof rule.name !== 'undefined') updates.name = rule.name;
    if (typeof rule.patterns !== 'undefined')
      updates.patterns = rule.patterns.join(',');

    if (Object.keys(updates).length === 0) return { success: true };

    return ds.updatePaymentProviderRule(id, updates);
  },

  // ============= Data Management =============
  importAll: async (data: unknown) => {
    const ds = getDataService();
    return ds.importAll(data);
  },
};
