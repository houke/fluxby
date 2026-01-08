export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionTypeFilter = 'all' | TransactionType;

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  description: string;
  merchantName: string | null;
  accountId: string;
  opposingAccountIban: string | null;
  opposingAccountName: string | null;
  categoryId: string | null;
  notes: string | null;
  paymentMethod: string | null;
  rawData: string | null;
  importHash: string;
  createdAt: string;
  paymentProvider: string | null;
  addressBookId: string | null;
}

export interface TransactionCreate {
  date: string;
  amount: number;
  type: TransactionType;
  description: string;
  merchantName?: string | null;
  accountId: string;
  opposingAccountIban?: string | null;
  opposingAccountName?: string | null;
  categoryId?: string | null;
  notes?: string | null;
  balanceAfter?: number | null;
  paymentMethod?: string | null;
  rawData?: string | null;
  importHash: string;
}

// Filter types
export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  type?: TransactionType;
  categoryId?: string;
  categoryIds?: string[];
  accountId?: string;
  profileId?: string; // Filter transactions by profile (via account's profile_id)
  search?: string;
  opposingAccountIban?: string;
  opposingAccountIbans?: string[];
  opposingAccountName?: string;
  paymentMethods?: string[];
  paymentProviders?: string[];
  addressBookId?: string;
}

// ING CSV specific types
export interface INGTransaction {
  datum: string;
  naamOmschrijving: string;
  rekening: string;
  tegenrekening: string;
  code: string;
  afBij: 'Af' | 'Bij';
  bedrag: string;
  mutatiesoort: string;
  mededelingen: string;
  saldoNaMutatie: string;
  tag: string;
}

// Import types
export interface Import {
  id: string;
  filename: string;
  importedAt: string;
  transactionCount: number;
  status: 'pending' | 'completed' | 'failed';
}
