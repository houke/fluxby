import type { Profile, ProfileCreate } from '@fluxby/shared';
import {
  readFromOPFSSync,
  writeToOPFSWithCache,
  deleteFromOPFSWithCache,
  isSettingsCacheInitialized,
} from '@fluxby/database';

const API_STORAGE_KEY = 'finance.apiBaseUrl';
const PROFILE_KEY = 'fluxby.activeProfileId';

export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return '';
  if (isSettingsCacheInitialized()) {
    const value = readFromOPFSSync<string>(API_STORAGE_KEY);
    return (value ?? '').trim();
  }
  return '';
}

export function setApiBaseUrl(value: string): void {
  if (typeof window === 'undefined') return;
  const next = value.trim();
  if (!next) {
    deleteFromOPFSWithCache(API_STORAGE_KEY).catch(() => {
      /* ignore */
    });
    return;
  }
  writeToOPFSWithCache(API_STORAGE_KEY, next).catch(() => {
    /* ignore */
  });
}

// Helper to get active profile ID from OPFS cache
function getActiveProfileIdSync(): string {
  if (typeof window === 'undefined') return '';
  if (isSettingsCacheInitialized()) {
    return readFromOPFSSync<string>(PROFILE_KEY) || '';
  }
  return '';
}

function buildApiUrl(endpoint: string): string {
  // endpoint is expected to start with '/'
  const configuredBase = getApiBaseUrl();
  if (!configuredBase) return `/api${endpoint}`;

  const base = configuredBase.replace(/\/+$/, '');
  // Allow users to paste either 'http://host:3001' or 'http://host:3001/api'
  if (base.endsWith('/api')) return `${base}${endpoint}`;
  return `${base}/api${endpoint}`;
}

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(buildApiUrl(endpoint), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Profile-ID': getActiveProfileIdSync(),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Request failed' }));
    const message = error.error || 'Request failed';

    // Log technical details only in development
    const isDevelopment =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.port === '5177');

    if (isDevelopment) {
      console.error(`API Error: ${endpoint} ${response.status} ${message}`);
    }

    // Only throw the user-friendly message
    throw new Error(message);
  }

  const data = await response.json();
  return data.data;
}

// Fetch API with explicit profile ID (for creating resources under a specific profile)
async function fetchAPIWithProfile<T>(
  endpoint: string,
  profileId: number,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(buildApiUrl(endpoint), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Profile-ID': String(profileId),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Request failed' }));
    const message = error.error || 'Request failed';
    throw new Error(message);
  }

  const data = await response.json();
  return data.data;
}

// Dashboard & Analytics
export const api = {
  // Analytics
  getAvailableYears: () => fetchAPI<number[]>('/analytics/years'),
  getMinMaxDates: () =>
    fetchAPI<{ minDate: string; maxDate: string } | null>('/analytics/dates'),

  getDashboardStats: (
    startDate?: string,
    endDate?: string,
    type?: string,
    categoryIds?: number[]
  ) => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (type) params.set('type', type);
    if (categoryIds && categoryIds.length > 0)
      params.set('categoryIds', categoryIds.join(','));
    return fetchAPI(`/analytics/dashboard?${params}`);
  },

  getMonthlyData: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    return fetchAPI(`/analytics/monthly?${params}`);
  },

  getCategoryBreakdown: (
    startDate?: string,
    endDate?: string,
    type?: string
  ) => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (type) params.set('type', type);
    return fetchAPI(`/analytics/categories?${params}`);
  },

  getDailyExpenses: (startDate: string, endDate: string) => {
    const params = new URLSearchParams();
    params.set('startDate', startDate);
    params.set('endDate', endDate);
    return fetchAPI(`/analytics/daily-expenses?${params}`);
  },

  getBalanceForecast: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    return fetchAPI(`/analytics/balance-forecast?${params}`);
  },

  // Transactions
  getTransactions: (filters?: Record<string, string>) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          params.set(key, value);
        }
      });
    }
    return fetchAPI(`/transactions?${params}`);
  },

  updateTransaction: (
    id: number,
    data: {
      type?: 'income' | 'expense' | 'transfer';
      categoryId?: number;
      notes?: string;
      merchantName?: string | null;
      paymentMethod?: string | null;
      addressBookId?: number | null;
      paymentProvider?: string | null;
    }
  ) =>
    fetchAPI(`/transactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteTransaction: (id: number) =>
    fetchAPI(`/transactions/${id}`, { method: 'DELETE' }),

  bulkCategorize: (transactionIds: number[], categoryId: number) =>
    fetchAPI('/transactions/bulk-categorize', {
      method: 'POST',
      body: JSON.stringify({ transactionIds, categoryId }),
    }),

  categorizeByCounterparty: (
    transactionId: number,
    categoryId: number
  ): Promise<{
    success: boolean;
    updated: number;
    counterparty: string | null;
  }> =>
    fetchAPI('/transactions/categorize-by-counterparty', {
      method: 'POST',
      body: JSON.stringify({ transactionId, categoryId }),
    }),

  renameByCounterparty: (
    transactionId: number,
    merchantName: string | null
  ): Promise<{ success: boolean; updated: number; addressBookId?: number }> =>
    fetchAPI('/transactions/rename-by-counterparty', {
      method: 'POST',
      body: JSON.stringify({ transactionId, merchantName }),
    }),

  resetMerchantNames: (): Promise<{ success: boolean; updated: number }> =>
    fetchAPI('/transactions/reset-merchant-names', {
      method: 'POST',
    }),

  // Categories
  getCategories: (withCounts?: boolean) => {
    const params = withCounts ? '?withCounts=true' : '';
    return fetchAPI(`/categories${params}`);
  },

  createCategory: (data: {
    name: string;
    icon?: string;
    color?: string;
    description?: string;
    parentId?: number;
  }) =>
    fetchAPI('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCategory: (
    id: number,
    data: {
      name?: string;
      icon?: string;
      color?: string;
      description?: string | null;
      parentId?: number | null;
    }
  ) =>
    fetchAPI(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteCategory: (id: number) =>
    fetchAPI<{ success: boolean }>(`/categories/${id}`, {
      method: 'DELETE',
    }),

  getSeedCategories: (language: 'nl' | 'en' = 'nl') =>
    fetchAPI<{
      success: boolean;
      data: Array<{
        name: string;
        icon: string;
        color: string;
        description: string;
        subcategories: Array<{
          name: string;
          icon: string;
          description: string;
          rules: string[];
        }>;
      }>;
    }>(`/categories/seed-data?language=${language}`),

  seedCategories: (
    categories: Array<{
      id?: number;
      name: string;
      icon?: string;
      color?: string;
    }>
  ) =>
    fetchAPI<{ success: boolean }>('/categories/seed', {
      method: 'POST',
      body: JSON.stringify({ categories }),
    }),

  // Category Rules
  getCategoryRules: () => fetchAPI('/categories/rules/all'),

  createCategoryRule: (data: {
    pattern: string;
    categoryId: number;
    priority?: number;
  }) =>
    fetchAPI('/categories/rules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  applyCategoryRules: () =>
    fetchAPI<{ updated: number; processed: number }>(
      '/categories/rules/apply',
      {
        method: 'POST',
      }
    ),

  applyAllCategoryRules: () =>
    fetchAPI<{ updated: number; processed: number }>(
      '/categories/rules/apply-all',
      {
        method: 'POST',
      }
    ),

  applyCategoryRule: (id: number) =>
    fetchAPI<{ updated: number }>(`/categories/rules/${id}/apply`, {
      method: 'POST',
    }),

  // Data export/import
  exportAll: () => fetchAPI('/data/export'),

  importAll: (payload: unknown) =>
    fetchAPI('/data/import', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteCategoryRule: (id: number) =>
    fetchAPI(`/categories/rules/${id}`, { method: 'DELETE' }),

  suggestCategory: (merchant: string) =>
    fetchAPI(`/categories/suggest?merchant=${encodeURIComponent(merchant)}`),

  // Accounts
  getAccounts: () => fetchAPI('/accounts'),

  createAccount: (data: { iban: string; name: string; type: string }) =>
    fetchAPI('/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Create account for a specific profile (used when creating profile + accounts in one flow)
  createAccountForProfile: (
    profileId: number,
    data: { iban: string; name: string; type: string }
  ) =>
    fetchAPIWithProfile('/accounts', profileId, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateAccount: (
    id: number,
    data: { name?: string; type?: string; currentBalance?: number }
  ) =>
    fetchAPI(`/accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updateAccountOrder: (accountIds: number[]) =>
    fetchAPI('/accounts/order', {
      method: 'PATCH',
      body: JSON.stringify({ accountIds }),
    }),

  deleteAccount: (id: number) =>
    fetchAPI(`/accounts/${id}`, { method: 'DELETE' }),

  deleteAllAccounts: () => fetchAPI('/accounts', { method: 'DELETE' }),

  // Transactions (additional)
  deleteAllTransactions: () => fetchAPI('/transactions', { method: 'DELETE' }),

  // Categories (additional)
  deleteAllCategories: () => fetchAPI('/categories', { method: 'DELETE' }),

  // Budgets (additional)
  deleteAllBudgets: () => fetchAPI('/budgets', { method: 'DELETE' }),

  // Data management - Global reset (not profile-aware)
  resetAllData: () =>
    fetchAPI<{ demoProfileId: number; message: string }>('/data/reset', {
      method: 'DELETE',
    }),

  // Budgets
  getBudgets: (month?: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate && endDate) {
      params.set('startDate', startDate);
      params.set('endDate', endDate);
    } else if (month) {
      params.set('month', month);
    }
    return fetchAPI(`/budgets?${params}`);
  },

  createBudget: (data: {
    categoryId?: number;
    amount: number;
    period?: string;
  }) =>
    fetchAPI('/budgets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateBudget: (id: number, data: { amount?: number }) =>
    fetchAPI(`/budgets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteBudget: (id: number) =>
    fetchAPI(`/budgets/${id}`, { method: 'DELETE' }),

  getProposedBudgets: () => fetchAPI('/budgets/propose'),

  // Import
  uploadCSV: async (file: File, bank: string = 'ing') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bank', bank);

    const profileId = getActiveProfileIdSync();

    const response = await fetch(buildApiUrl('/import/csv'), {
      method: 'POST',
      headers: {
        'X-Profile-ID': profileId,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: 'Upload mislukt' }));
      throw new Error(error.error || 'Upload mislukt');
    }

    const data = await response.json();
    return data.data;
  },

  previewCSV: async (file: File, bank: string = 'ing') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bank', bank);

    const profileId = getActiveProfileIdSync();

    const response = await fetch(buildApiUrl('/import/preview'), {
      method: 'POST',
      headers: {
        'X-Profile-ID': profileId,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: 'Preview mislukt' }));
      throw new Error(error.error || 'Preview mislukt');
    }

    const data = await response.json();
    return data.data;
  },

  getImportHistory: () => fetchAPI('/import/history'),

  // Generic CSV parsing
  parseGenericCSV: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const profileId = getActiveProfileIdSync();

    const response = await fetch(buildApiUrl('/import/generic/parse'), {
      method: 'POST',
      headers: {
        'X-Profile-ID': profileId,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: 'Parsing failed' }));
      throw new Error(error.error || 'Parsing failed');
    }

    const data = await response.json();
    return data.data;
  },

  importGenericCSV: async (
    file: File,
    mapping: {
      date: string;
      amount: string;
      description: string;
      iban?: string;
      counterparty?: string;
      balance?: string;
    },
    accountId?: number,
    bank?: string
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mapping));
    if (accountId) {
      formData.append('accountId', accountId.toString());
    }
    if (bank) {
      formData.append('bank', bank);
    }

    const profileId = getActiveProfileIdSync();

    const response = await fetch(buildApiUrl('/import/generic/import'), {
      method: 'POST',
      headers: {
        'X-Profile-ID': profileId,
      },
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = 'Import failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        errorMessage = `Import failed with status ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data;
  },

  // User profile
  getUser: () => fetchAPI('/user'),

  updateUser: (data: { name?: string; avatar?: string | null }) =>
    fetchAPI('/user', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Profiles (multi-tenant)
  getProfiles: () => fetchAPI<Profile[]>('/profiles'),

  getProfile: (id: number) => fetchAPI<Profile>(`/profiles/${id}`),

  createProfile: (data: ProfileCreate) =>
    fetchAPI<Profile>('/profiles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProfile: (id: number, data: Partial<ProfileCreate>) =>
    fetchAPI<void>(`/profiles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteProfile: (id: number) =>
    fetchAPI(`/profiles/${id}`, { method: 'DELETE' }),

  setProfileHidden: (id: number, isHidden: boolean) =>
    fetchAPI<void>(`/profiles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isHidden }),
    }),

  // Address Book
  getAddressBook: () => fetchAPI('/addressbook'),

  getAddressBookEntry: (id: number) => fetchAPI(`/addressbook/${id}`),

  getAddressBookByIban: (iban: string) =>
    fetchAPI(`/addressbook/by-iban/${encodeURIComponent(iban)}`),

  createAddressBookEntry: (data: {
    iban: string;
    name: string;
    description?: string;
    notes?: string;
  }): Promise<{
    success: boolean;
    data: { id: number; iban: string; name: string };
    merged?: boolean;
  }> =>
    fetchAPI('/addressbook', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateAddressBookEntry: (
    id: number,
    data: { name?: string; description?: string; notes?: string }
  ) =>
    fetchAPI(`/addressbook/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteAddressBookEntry: (id: number) =>
    fetchAPI(`/addressbook/${id}`, { method: 'DELETE' }),

  getTopAccounts: (
    limit: number = 10,
    type: 'expense' | 'income' | 'all' = 'expense',
    startDate?: string,
    endDate?: string
  ) => {
    const params = new URLSearchParams();
    params.set('limit', limit.toString());
    params.set('type', type);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    return fetchAPI(`/addressbook/top-accounts?${params}`);
  },

  // Name cleanup rules
  getCleanupRules: () => fetchAPI('/addressbook/cleanup-rules'),

  createCleanupRule: (pattern: string) =>
    fetchAPI('/addressbook/cleanup-rules', {
      method: 'POST',
      body: JSON.stringify({ pattern }),
    }),

  deleteCleanupRule: (id: number) =>
    fetchAPI(`/addressbook/cleanup-rules/${id}`, { method: 'DELETE' }),

  applyCleanupRules: () =>
    fetchAPI('/addressbook/apply-cleanup-rules', { method: 'POST' }),

  applyCleanupRulesToTransactions: () =>
    fetchAPI('/transactions/apply-cleanup-rules', { method: 'POST' }),

  // Detect and mark internal transfers for all transactions
  detectInternalTransfers: () =>
    fetchAPI<{ markedAsTransfer: number }>(
      '/transactions/detect-internal-transfers',
      { method: 'POST' }
    ),

  // Backfill addressbook
  backfillAddressbook: () =>
    fetchAPI('/import/backfill-addressbook', { method: 'POST' }),

  // Shared IBANs (payment processors)
  getSharedIbans: () => fetchAPI('/addressbook/shared-ibans'),

  markIbanAsShared: (iban: string, providerName?: string) =>
    fetchAPI('/addressbook/shared-ibans', {
      method: 'POST',
      body: JSON.stringify({ iban, providerName }),
    }),

  removeSharedIban: (iban: string) =>
    fetchAPI(`/addressbook/shared-ibans/${encodeURIComponent(iban)}`, {
      method: 'DELETE',
    }),

  detectSharedIbans: () =>
    fetchAPI('/addressbook/detect-shared', { method: 'POST' }),

  // Shared IBAN merchants
  getSharedIbanMerchants: (iban?: string) =>
    fetchAPI(
      iban
        ? `/addressbook/shared-iban-merchants?iban=${encodeURIComponent(iban)}`
        : '/addressbook/shared-iban-merchants'
    ),

  addSharedIbanMerchants: (
    iban: string,
    merchants: Array<{ originalName: string; displayName: string }>
  ) =>
    fetchAPI('/addressbook/shared-iban-merchants', {
      method: 'POST',
      body: JSON.stringify({ iban, merchants }),
    }),

  deleteSharedIbanMerchant: (id: number) =>
    fetchAPI(`/addressbook/shared-iban-merchants/${id}`, {
      method: 'DELETE',
    }),

  // Resolve shared IBAN to address book entry
  resolveSharedIban: (
    iban: string,
    name: string,
    originalNames: string[],
    contactId?: number
  ) =>
    fetchAPI('/addressbook/resolve-shared', {
      method: 'POST',
      body: JSON.stringify({ iban, name, originalNames, contactId }),
    }),

  // Multiple IBANs per contact
  getContactIbans: (contactId: number) =>
    fetchAPI(`/addressbook/${contactId}/ibans`),

  addContactIban: async (contactId: number, iban: string) => {
    const response = await fetch(
      buildApiUrl(`/addressbook/${contactId}/ibans`),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Profile-ID': getActiveProfileIdSync(),
        },
        body: JSON.stringify({ iban }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Request failed');
    }

    return data.data;
  },

  removeContactIban: (contactId: number, ibanId: number) =>
    fetchAPI(`/addressbook/${contactId}/ibans/${ibanId}`, {
      method: 'DELETE',
    }),

  // Merge contacts
  mergeContacts: (contactIds: number[], name?: string) =>
    fetchAPI('/addressbook/merge', {
      method: 'POST',
      body: JSON.stringify({ contactIds, name }),
    }),

  // Split contact into separate contacts
  splitContact: (
    contactId: number,
    mappings: Array<{ iban: string; name: string }>
  ): Promise<{
    success: boolean;
    data: {
      created: number[];
      merged: number[];
      warnings: string[];
      keptOnOriginal: string[];
    };
  }> =>
    fetchAPI('/addressbook/split', {
      method: 'POST',
      body: JSON.stringify({ contactId, mappings }),
    }),

  // Payment Processors (IBAN-based, for overview)
  getPaymentProviders: () =>
    fetchAPI<Array<{ id: number; iban: string; name: string }>>(
      '/addressbook/payment-providers'
    ),

  addPaymentProvider: (iban: string, name: string) =>
    fetchAPI('/addressbook/payment-providers', {
      method: 'POST',
      body: JSON.stringify({ iban, name }),
    }),

  deletePaymentProvider: (id: number) =>
    fetchAPI(`/addressbook/payment-providers/${id}`, {
      method: 'DELETE',
    }),

  // Payment Processor Rules (pattern-based detection)
  getPaymentProviderRules: () =>
    fetchAPI<Array<{ id: number; name: string; patterns: string }>>(
      '/addressbook/payment-provider-rules'
    ),

  addPaymentProviderRule: (name: string, patterns: string) =>
    fetchAPI('/addressbook/payment-provider-rules', {
      method: 'POST',
      body: JSON.stringify({ name, patterns }),
    }),

  updatePaymentProviderRule: (
    id: number,
    data: { name?: string; patterns?: string }
  ) =>
    fetchAPI(`/addressbook/payment-provider-rules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deletePaymentProviderRule: (id: number) =>
    fetchAPI(`/addressbook/payment-provider-rules/${id}`, {
      method: 'DELETE',
    }),

  detectPaymentProvider: (
    iban?: string,
    description?: string,
    merchantName?: string
  ) =>
    fetchAPI<{ provider: string | null }>(
      '/addressbook/detect-payment-provider',
      {
        method: 'POST',
        body: JSON.stringify({ iban, description, merchantName }),
      }
    ),

  // Demo account management
  getDemoProfile: () => fetchAPI<Profile | null>('/profiles/demo'),

  createDemoProfile: () =>
    fetchAPI<Profile>('/profiles/create-demo', {
      method: 'POST',
    }),

  seedDemoData: (profileId: number) =>
    fetchAPI<{
      profileId: number;
      categories: number;
      transactions: number;
      addressBookEntries: number;
      budgets: number;
    }>(`/profiles/${profileId}/seed-demo`, {
      method: 'POST',
    }),
};
