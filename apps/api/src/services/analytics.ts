import { query, queryOne } from '../db/index.js';
import type {
  DashboardStats,
  MonthlyData,
  CategoryBreakdown,
  Transaction,
  TransactionFilters,
} from '@fluxby/shared';

export function getAvailableYears(profileId: number): number[] {
  const rows = query<{ year: number }>(
    `SELECT DISTINCT strftime('%Y', date) as year FROM transactions WHERE profile_id = ? ORDER BY year DESC`,
    [profileId]
  );
  return rows.map((r) => r.year);
}

export function getMinMaxDates(
  profileId: number
): { minDate: string; maxDate: string } | null {
  const row = queryOne<{ minDate: string; maxDate: string }>(
    `SELECT MIN(date) as minDate, MAX(date) as maxDate FROM transactions WHERE profile_id = ?`,
    [profileId]
  );
  return row ?? null;
}

interface DBTransaction {
  id: number;
  date: string;
  amount: number;
  type: string;
  description: string;
  merchant_name: string | null;
  account_id: number;
  opposing_account_iban: string | null;
  opposing_account_name: string | null;
  category_id: number | null;
  notes: string | null;
  payment_method: string | null;
  raw_data: string | null;
  import_hash: string;
  created_at: string;
  address_book_id: number | null;
  payment_provider: string | null;
}

// DBCategory type is available for future use in category-based analytics
interface _DBCategory {
  id: number;
  name: string;
  color: string;
}

function mapDBTransaction(row: DBTransaction): Transaction {
  return {
    id: row.id,
    date: row.date,
    amount: row.amount,
    type: row.type as 'income' | 'expense' | 'transfer',
    description: row.description,
    merchantName: row.merchant_name,
    accountId: row.account_id,
    opposingAccountIban: row.opposing_account_iban,
    opposingAccountName: row.opposing_account_name,
    categoryId: row.category_id,
    notes: row.notes,
    paymentMethod: row.payment_method,
    rawData: row.raw_data,
    importHash: row.import_hash,
    createdAt: row.created_at,
    paymentProvider: row.payment_provider, // Use stored value, will be overwritten by detection if null
    addressBookId: row.address_book_id,
  };
}

export function getDashboardStats(
  profileId: number,
  startDate?: string,
  endDate?: string,
  type?: 'income' | 'expense',
  categoryIds?: number[]
): DashboardStats {
  const dateFilter = buildDateFilter(startDate, endDate);
  const profileFilter = ' AND profile_id = ?';

  // Build additional filters
  let typeFilter = '';
  let categoryFilter = '';
  const extraParams: unknown[] = [];

  if (type === 'income') {
    typeFilter = ' AND amount > 0';
  } else if (type === 'expense') {
    typeFilter = ' AND amount < 0';
  }

  if (categoryIds && categoryIds.length > 0) {
    categoryFilter = ` AND category_id IN (${categoryIds
      .map(() => '?')
      .join(',')})`;
    extraParams.push(...categoryIds);
  }

  // Get totals - exclude transfers from income/expenses
  // Track transfers separately: deposits (to savings) and withdrawals (from savings)
  const totals = queryOne<{
    total_income: number;
    total_expenses: number;
    transfer_to_savings: number;
    transfer_from_savings: number;
    transaction_count: number;
  }>(
    `
    SELECT 
      COALESCE(SUM(CASE WHEN amount > 0 AND type != 'transfer' THEN amount ELSE 0 END), 0) as total_income,
      COALESCE(SUM(CASE WHEN amount < 0 AND type != 'transfer' THEN ABS(amount) ELSE 0 END), 0) as total_expenses,
      COALESCE(SUM(CASE WHEN type = 'transfer' AND amount < 0 THEN ABS(amount) ELSE 0 END), 0) as transfer_to_savings,
      COALESCE(SUM(CASE WHEN type = 'transfer' AND amount > 0 THEN amount ELSE 0 END), 0) as transfer_from_savings,
      COUNT(*) as transaction_count
    FROM transactions
    ${dateFilter.where}${typeFilter}${categoryFilter}${profileFilter}
  `,
    [...dateFilter.params, ...extraParams, profileId]
  );

  const totalIncome = totals?.total_income || 0;
  const totalExpenses = totals?.total_expenses || 0;
  const transferToSavings = totals?.transfer_to_savings || 0;
  const transferFromSavings = totals?.transfer_from_savings || 0;
  const totalTransfers = transferToSavings + transferFromSavings;
  const totalBalance = totalIncome - totalExpenses;
  const savingsRate =
    totalIncome > 0 ? (transferToSavings / totalIncome) * 100 : 0;

  // Get recent transactions - filter by profile and date range
  const recentDateFilter = buildDateFilter(startDate, endDate);
  const recentTransactions = query<DBTransaction>(
    `
    SELECT * FROM transactions 
    ${recentDateFilter.where} AND profile_id = ?
    ORDER BY date DESC, id DESC 
    LIMIT 10
  `,
    [...recentDateFilter.params, profileId]
  ).map(mapDBTransaction);

  return {
    totalBalance,
    totalIncome,
    totalExpenses,
    totalTransfers,
    transferToSavings,
    transferFromSavings,
    netSavingsTransfer: transferToSavings - transferFromSavings,
    savingsRate,
    transactionCount: totals?.transaction_count || 0,
    monthlyData: getMonthlyData(profileId, startDate, endDate),
    // Only show expense categories in dashboard (not combined income+expense which causes chart issues)
    categoryBreakdown: type
      ? getCategoryBreakdown(profileId, startDate, endDate, type)
      : getCategoryBreakdown(profileId, startDate, endDate, 'expense'),
    recentTransactions,
  };
}

export function getMonthlyData(
  profileId: number,
  startDate?: string,
  endDate?: string
): MonthlyData[] {
  const dateFilter = buildDateFilter(startDate, endDate);
  const profileFilter = ' AND profile_id = ?';

  const rows = query<{
    month: string;
    income: number;
    expenses: number;
  }>(
    `
    SELECT 
      strftime('%Y-%m', date) as month,
      COALESCE(SUM(CASE WHEN amount > 0 AND type != 'transfer' THEN amount ELSE 0 END), 0) as income,
      COALESCE(SUM(CASE WHEN amount < 0 AND type != 'transfer' THEN ABS(amount) ELSE 0 END), 0) as expenses
    FROM transactions
    ${dateFilter.where} ${profileFilter}
    GROUP BY strftime('%Y-%m', date)
    ORDER BY month ASC
  `,
    [...dateFilter.params, profileId]
  );

  let runningBalance = 0;
  return rows.map((row) => {
    runningBalance += row.income - row.expenses;
    return {
      month: row.month,
      income: row.income,
      expenses: row.expenses,
      balance: runningBalance,
    };
  });
}

export interface DailyExpense {
  date: string;
  expenses: number;
}

export function getDailyExpenses(
  profileId: number,
  startDate?: string,
  endDate?: string
): DailyExpense[] {
  // Get expenses per day from database (only days with transactions)
  const dateFilter = buildDateFilter(startDate, endDate);
  const profileFilter = ' AND profile_id = ?';

  const rows = query<{
    date: string;
    expenses: number;
  }>(
    `
    SELECT 
      date,
      COALESCE(SUM(CASE WHEN amount < 0 AND type != 'transfer' THEN ABS(amount) ELSE 0 END), 0) as expenses
    FROM transactions
    ${dateFilter.where} ${profileFilter}
    GROUP BY date
    ORDER BY date ASC
  `,
    [...dateFilter.params, profileId]
  );

  // Create a map of existing data
  const expenseMap = new Map(rows.map((r) => [r.date, r.expenses]));

  // Generate all days in range
  const result: DailyExpense[] = [];
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        expenses: expenseMap.get(dateStr) || 0,
      });
    }
  } else {
    // If no date range, just return the data we have
    return rows;
  }

  return result;
}

export function getCategoryBreakdown(
  profileId: number,
  startDate?: string,
  endDate?: string,
  type: 'expense' | 'income' = 'expense'
): CategoryBreakdown[] {
  const dateFilter = buildDateFilter(startDate, endDate);
  const amountCondition = type === 'expense' ? 'amount < 0' : 'amount > 0';
  const profileFilter = ' AND t.profile_id = ?';
  // Exclude transfers category (both type='transfer' transactions AND transactions categorized as "Overboekingen"/"Transfers")
  const transferCategoryFilter =
    "AND (c.name IS NULL OR (LOWER(c.name) NOT LIKE '%overboeking%' AND LOWER(c.name) NOT LIKE '%transfer%'))";

  const rows = query<{
    category_id: number | null;
    category_name: string;
    color: string;
    icon: string | null;
    total_amount: number;
    transaction_count: number;
  }>(
    `
    SELECT 
      t.category_id,
      COALESCE(c.name, 'Uncategorized') as category_name,
      COALESCE(c.color, '#9CA3AF') as color,
      c.icon,
      SUM(ABS(t.amount)) as total_amount,
      COUNT(*) as transaction_count
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    ${dateFilter.where} ${
      dateFilter.where ? 'AND' : 'WHERE'
    } ${amountCondition} AND t.type != 'transfer' ${transferCategoryFilter} ${profileFilter}
    GROUP BY t.category_id
    ORDER BY total_amount DESC
  `,
    [...dateFilter.params, profileId]
  );

  const total = rows.reduce((sum, row) => sum + row.total_amount, 0);

  return rows.map((row) => ({
    categoryId: row.category_id || 0,
    categoryName: row.category_name,
    color: row.color,
    icon: row.icon || '📦',
    amount: row.total_amount,
    percentage: total > 0 ? (row.total_amount / total) * 100 : 0,
    transactionCount: row.transaction_count,
  }));
}

export function getTransactions(
  filters: TransactionFilters = {}
): Transaction[] {
  // Build base query - if profileId filter is provided, join with accounts for profile filtering
  let sql: string;
  const params: unknown[] = [];

  if (filters.profileId) {
    // Join with accounts to filter by profile - ensures data isolation
    sql = `SELECT t.* FROM transactions t
           WHERE t.profile_id = ?`;
    params.push(filters.profileId);
  } else {
    sql = 'SELECT * FROM transactions t WHERE 1=1';
  }

  if (filters.startDate) {
    sql += ' AND t.date >= ?';
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    sql += ' AND t.date <= ?';
    params.push(filters.endDate);
  }

  if (filters.minAmount !== undefined) {
    sql += ' AND ABS(t.amount) >= ?';
    params.push(filters.minAmount);
  }

  if (filters.maxAmount !== undefined) {
    sql += ' AND ABS(t.amount) <= ?';
    params.push(filters.maxAmount);
  }

  if (filters.type) {
    sql += ' AND t.type = ?';
    params.push(filters.type);
  }

  if (filters.categoryId) {
    sql += ' AND t.category_id = ?';
    params.push(filters.categoryId);
  }

  if (filters.categoryIds && filters.categoryIds.length > 0) {
    // Check if 0 is included (meaning "uncategorized")
    const includesUncategorized = filters.categoryIds.includes(0);
    const categoryIdsWithoutZero = filters.categoryIds.filter((id) => id !== 0);

    if (includesUncategorized && categoryIdsWithoutZero.length > 0) {
      // Both uncategorized and specific categories
      const placeholders = categoryIdsWithoutZero.map(() => '?').join(',');
      sql += ` AND (t.category_id IS NULL OR t.category_id IN (${placeholders}))`;
      params.push(...categoryIdsWithoutZero);
    } else if (includesUncategorized) {
      // Only uncategorized
      sql += ' AND t.category_id IS NULL';
    } else {
      // Only specific categories
      const placeholders = filters.categoryIds.map(() => '?').join(',');
      sql += ` AND t.category_id IN (${placeholders})`;
      params.push(...filters.categoryIds);
    }
  }

  if (filters.accountId) {
    sql += ' AND t.account_id = ?';
    params.push(filters.accountId);
  }

  if (filters.search) {
    sql +=
      ' AND (t.description LIKE ? OR t.merchant_name LIKE ? OR t.opposing_account_name LIKE ? OR t.opposing_account_iban LIKE ?)';
    const searchPattern = `%${filters.search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  if (filters.opposingAccountIban) {
    sql += ' AND t.opposing_account_iban = ?';
    params.push(filters.opposingAccountIban);
  }

  // When opposingAccountName is provided (search filter),
  // use LIKE search on name fields to find transactions.
  // This is for searching, not for address book linking.
  if (filters.opposingAccountName) {
    const namePattern = `%${filters.opposingAccountName}%`;
    sql += ` AND (
      LOWER(t.opposing_account_name) LIKE LOWER(?) 
      OR LOWER(t.merchant_name) LIKE LOWER(?)
    )`;
    params.push(namePattern, namePattern);
  } else if (
    filters.opposingAccountIbans &&
    filters.opposingAccountIbans.length > 0
  ) {
    // Only use IBAN filter if no name is provided
    const placeholders = filters.opposingAccountIbans.map(() => '?').join(',');
    sql += ` AND t.opposing_account_iban IN (${placeholders})`;
    params.push(...filters.opposingAccountIbans);
  }

  // Filter by address book ID - inclusive matching to match UI badge logic
  if (filters.addressBookId) {
    const contact = queryOne<{ iban: string; original_name: string | null }>(
      'SELECT iban, original_name FROM address_book WHERE id = ?',
      [filters.addressBookId]
    );

    if (contact) {
      const contactIbans = query<{ iban: string }>(
        'SELECT iban FROM contact_ibans WHERE contact_id = ?',
        [filters.addressBookId]
      ).map((r) => r.iban);

      const allIbans = [contact.iban, ...contactIbans].filter(Boolean);
      const ibanPlaceholders = allIbans.map(() => '?').join(',');

      if (contact.original_name) {
        // Shared IBAN: must match IBAN AND name
        sql += ` AND (t.address_book_id = ? OR (t.address_book_id IS NULL AND t.opposing_account_iban IN (${ibanPlaceholders}) AND (t.opposing_account_name = ? OR t.merchant_name = ?)))`;
        params.push(
          filters.addressBookId,
          ...allIbans,
          contact.original_name,
          contact.original_name
        );
      } else {
        // Regular IBAN: match address_book_id OR IBAN
        sql += ` AND (t.address_book_id = ? OR (t.address_book_id IS NULL AND t.opposing_account_iban IN (${ibanPlaceholders})))`;
        params.push(filters.addressBookId, ...allIbans);
      }
    } else {
      sql += ' AND t.address_book_id = ?';
      params.push(filters.addressBookId);
    }
  }

  // Filter by payment methods
  if (filters.paymentMethods && filters.paymentMethods.length > 0) {
    const placeholders = filters.paymentMethods.map(() => '?').join(',');
    sql += ` AND LOWER(payment_method) IN (${placeholders})`;
    params.push(...filters.paymentMethods.map((m) => m.toLowerCase()));
  }

  sql += ' ORDER BY t.date DESC, t.id DESC';

  const transactions = query<DBTransaction>(sql, params).map(mapDBTransaction);

  // Get payment processor rules for detection
  const providerRules = query<{ name: string; patterns: string }>(
    'SELECT name, patterns FROM payment_provider_rules'
  );

  // Get IBAN-based processors for fallback
  const ibanProviders = query<{ iban: string; name: string }>(
    'SELECT iban, name FROM payment_providers'
  );
  const ibanMap = new Map(ibanProviders.map((p) => [p.iban, p.name]));

  // Helper to detect payment processor
  const detectProvider = (t: Transaction): string | null => {
    const searchText = [t.opposingAccountIban, t.description, t.merchantName]
      .filter(Boolean)
      .join(' ')
      .toUpperCase();

    // Check rules first
    for (const rule of providerRules) {
      const patterns = rule.patterns
        .split(',')
        .map((p) => p.trim().toUpperCase());
      for (const pattern of patterns) {
        if (pattern && searchText.includes(pattern)) {
          return rule.name;
        }
      }
    }

    // Fallback to IBAN-based lookup
    if (t.opposingAccountIban && ibanMap.has(t.opposingAccountIban)) {
      return ibanMap.get(t.opposingAccountIban) || null;
    }

    return null;
  };

  // Add payment processor to each transaction (use stored value or auto-detect)
  let result = transactions.map((t) => ({
    ...t,
    // Use manually set value if present, otherwise auto-detect
    paymentProvider: t.paymentProvider || detectProvider(t),
  }));

  // Filter by payment providers (after detection since it's computed)
  if (filters.paymentProviders && filters.paymentProviders.length > 0) {
    const providersLower = filters.paymentProviders.map((p) => p.toLowerCase());
    result = result.filter(
      (t) =>
        t.paymentProvider &&
        providersLower.includes(t.paymentProvider.toLowerCase())
    );
  }

  return result;
}

function buildDateFilter(
  startDate?: string,
  endDate?: string
): { where: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (startDate) {
    conditions.push('date >= ?');
    params.push(startDate);
  }

  if (endDate) {
    conditions.push('date <= ?');
    params.push(endDate);
  }

  return {
    where: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}

export interface BalanceForecast {
  currentMonthIncome: number;
  currentMonthExpenses: number;
  expectedIncome: number;
  expectedExpenses: number;
  expectedEndBalance: number;
  confidence: 'low' | 'medium' | 'high';
  basedOnMonths: number;
  isPastPeriod: boolean;
}

export function getBalanceForecast(
  profileId: number,
  startDateParam?: string,
  endDateParam?: string
): BalanceForecast | null {
  const now = new Date();

  // Determine period boundaries
  let periodStart: Date;
  let periodEnd: Date;

  if (startDateParam && endDateParam) {
    periodStart = new Date(startDateParam);
    periodEnd = new Date(endDateParam);
  } else {
    // Default to current month
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  const periodStartStr = periodStart.toISOString().split('T')[0];
  const periodEndStr = periodEnd.toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];

  // Check if period is fully in the past
  const isPastPeriod = periodEnd < now;

  // For past periods, just return actuals
  if (isPastPeriod) {
    const periodTotals = queryOne<{
      income: number;
      expenses: number;
    }>(
      `
      SELECT 
        COALESCE(SUM(CASE WHEN amount > 0 AND type != 'transfer' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN amount < 0 AND type != 'transfer' THEN ABS(amount) ELSE 0 END), 0) as expenses
      FROM transactions
      WHERE date >= ? AND date <= ? AND profile_id = ?
    `,
      [periodStartStr, periodEndStr, profileId]
    );

    return {
      currentMonthIncome: periodTotals?.income || 0,
      currentMonthExpenses: periodTotals?.expenses || 0,
      expectedIncome: periodTotals?.income || 0,
      expectedExpenses: periodTotals?.expenses || 0,
      expectedEndBalance:
        (periodTotals?.income || 0) - (periodTotals?.expenses || 0),
      confidence: 'high',
      basedOnMonths: 0,
      isPastPeriod: true,
    };
  }

  // Calculate days in period and days remaining
  const msPerDay = 1000 * 60 * 60 * 24;
  const totalDays =
    Math.floor((periodEnd.getTime() - periodStart.getTime()) / msPerDay) + 1;

  // For current/future periods, calculate based on position in period
  const effectiveToday = now < periodStart ? periodStart : now;
  const daysPassed =
    now < periodStart
      ? 0
      : Math.floor(
          (effectiveToday.getTime() - periodStart.getTime()) / msPerDay
        ) + 1;
  const daysRemaining = Math.max(0, totalDays - daysPassed);

  // Get what's been spent/earned so far in this period
  const upToTodayStr =
    now < periodStart
      ? periodStartStr
      : now > periodEnd
        ? periodEndStr
        : todayStr;

  const currentPeriodTotals = queryOne<{
    income: number;
    expenses: number;
  }>(
    `
    SELECT 
      COALESCE(SUM(CASE WHEN amount > 0 AND type != 'transfer' THEN amount ELSE 0 END), 0) as income,
      COALESCE(SUM(CASE WHEN amount < 0 AND type != 'transfer' THEN ABS(amount) ELSE 0 END), 0) as expenses
    FROM transactions
    WHERE date >= ? AND date <= ? AND profile_id = ?
  `,
    [periodStartStr, upToTodayStr, profileId]
  );

  // Get historical data from the same month in previous years (for seasonal patterns)
  // Use the period's start month for seasonal comparison
  const periodMonth = (periodStart.getMonth() + 1).toString().padStart(2, '0');
  const periodYear = periodStart.getFullYear().toString();

  const sameMonthPreviousYears = query<{
    year: number;
    income: number;
    expenses: number;
  }>(
    `
    SELECT 
      CAST(strftime('%Y', date) AS INTEGER) as year,
      COALESCE(SUM(CASE WHEN amount > 0 AND type != 'transfer' THEN amount ELSE 0 END), 0) as income,
      COALESCE(SUM(CASE WHEN amount < 0 AND type != 'transfer' THEN ABS(amount) ELSE 0 END), 0) as expenses
    FROM transactions
    WHERE strftime('%m', date) = ? AND strftime('%Y', date) != ? AND profile_id = ?
    GROUP BY year
    ORDER BY year DESC
    LIMIT 3
  `,
    [periodMonth, periodYear, profileId]
  );

  // Get last 6 months of data for recent patterns (before period start)
  const sixMonthsAgo = new Date(
    periodStart.getFullYear(),
    periodStart.getMonth() - 6,
    1
  );
  const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0];
  const lastMonthEnd = new Date(
    periodStart.getFullYear(),
    periodStart.getMonth(),
    0
  );
  const lastMonthEndStr = lastMonthEnd.toISOString().split('T')[0];

  const recentMonths = query<{
    month: string;
    income: number;
    expenses: number;
  }>(
    `
    SELECT 
      strftime('%Y-%m', date) as month,
      COALESCE(SUM(CASE WHEN amount > 0 AND type != 'transfer' THEN amount ELSE 0 END), 0) as income,
      COALESCE(SUM(CASE WHEN amount < 0 AND type != 'transfer' THEN ABS(amount) ELSE 0 END), 0) as expenses
    FROM transactions
    WHERE date >= ? AND date <= ? AND profile_id = ?
    GROUP BY strftime('%Y-%m', date)
    ORDER BY month DESC
  `,
    [sixMonthsAgoStr, lastMonthEndStr, profileId]
  );

  // Look for recurring transactions (same merchant/counterparty appearing monthly)
  // This detects salary, subscriptions, and other regular payments
  const dayOfMonth = now < periodStart ? 0 : effectiveToday.getDate();

  // Get truly recurring income (appears at least 3 times in last 6 months, once per month)
  // These are likely salary, regular transfers, etc.
  const recurringIncomeSources = query<{
    merchant_name: string;
    avg_amount: number;
    occurrence_count: number;
    months_present: number;
    typical_day: number;
    last_occurrence: string;
  }>(
    `
    SELECT 
      COALESCE(merchant_name, opposing_account_name) as merchant_name,
      AVG(amount) as avg_amount,
      COUNT(*) as occurrence_count,
      COUNT(DISTINCT strftime('%Y-%m', date)) as months_present,
      AVG(CAST(strftime('%d', date) AS INTEGER)) as typical_day,
      MAX(date) as last_occurrence
    FROM transactions
    WHERE amount > 0 
      AND type != 'transfer'
      AND date >= ?
      AND profile_id = ?
    GROUP BY COALESCE(merchant_name, opposing_account_name)
    HAVING COUNT(DISTINCT strftime('%Y-%m', date)) >= 3
  `,
    [sixMonthsAgoStr, profileId]
  );

  // Check which recurring income has already been received this period
  const expectedRecurringIncome = recurringIncomeSources.reduce(
    (sum, source) => {
      // Check if this source has already been received in the current period
      const alreadyReceived = queryOne<{ count: number }>(
        `
      SELECT COUNT(*) as count
      FROM transactions
      WHERE COALESCE(merchant_name, opposing_account_name) = ?
        AND amount > 0
        AND type != 'transfer'
        AND date >= ? AND date <= ?
        AND profile_id = ?
      `,
        [source.merchant_name, periodStartStr, upToTodayStr, profileId]
      );

      // If not yet received and we haven't passed the typical day, expect it
      if ((alreadyReceived?.count || 0) === 0) {
        // If this income typically comes on a day we haven't passed yet, expect it
        // Or if we have passed the day but it's close (within 5 days tolerance), still expect it
        const typicalDay = Math.round(source.typical_day);
        if (typicalDay > dayOfMonth || dayOfMonth - typicalDay <= 5) {
          return sum + source.avg_amount;
        }
      }
      return sum;
    },
    0
  );

  // Get recurring expenses expected for the rest of the month
  const recurringExpenseSources = query<{
    merchant_name: string;
    avg_amount: number;
    occurrence_count: number;
    months_present: number;
    typical_day: number;
    last_occurrence: string;
  }>(
    `
    SELECT 
      COALESCE(merchant_name, opposing_account_name) as merchant_name,
      AVG(ABS(amount)) as avg_amount,
      COUNT(*) as occurrence_count,
      COUNT(DISTINCT strftime('%Y-%m', date)) as months_present,
      AVG(CAST(strftime('%d', date) AS INTEGER)) as typical_day,
      MAX(date) as last_occurrence
    FROM transactions
    WHERE amount < 0 
      AND type != 'transfer'
      AND date >= ?
      AND profile_id = ?
    GROUP BY COALESCE(merchant_name, opposing_account_name)
    HAVING COUNT(DISTINCT strftime('%Y-%m', date)) >= 3
  `,
    [sixMonthsAgoStr, profileId]
  );

  // Check which recurring expenses have already been paid this period
  const expectedRecurringExpenses = recurringExpenseSources.reduce(
    (sum, source) => {
      const alreadyPaid = queryOne<{ count: number }>(
        `
      SELECT COUNT(*) as count
      FROM transactions
      WHERE COALESCE(merchant_name, opposing_account_name) = ?
        AND amount < 0
        AND type != 'transfer'
        AND date >= ? AND date <= ?
        AND profile_id = ?
      `,
        [source.merchant_name, periodStartStr, upToTodayStr, profileId]
      );

      if ((alreadyPaid?.count || 0) === 0) {
        const typicalDay = Math.round(source.typical_day);
        if (typicalDay > dayOfMonth || dayOfMonth - typicalDay <= 5) {
          return sum + source.avg_amount;
        }
      }
      return sum;
    },
    0
  );

  // Calculate expected values
  const totalMonths = recentMonths.length + sameMonthPreviousYears.length;

  if (totalMonths < 1) {
    return null;
  }

  // Weight recent months more heavily, but also consider same month in previous years
  let weightedIncome = 0;
  let weightedExpenses = 0;
  let totalWeight = 0;

  // Recent months (higher weight: 3, 2.5, 2, 1.5, 1, 0.5)
  recentMonths.forEach((month, index) => {
    const weight = Math.max(3 - index * 0.5, 0.5);
    weightedIncome += month.income * weight;
    weightedExpenses += month.expenses * weight;
    totalWeight += weight;
  });

  // Same month in previous years (weight: 2 for last year, 1.5, 1)
  sameMonthPreviousYears.forEach((year, index) => {
    const weight = Math.max(2 - index * 0.5, 0.5);
    weightedIncome += year.income * weight;
    weightedExpenses += year.expenses * weight;
    totalWeight += weight;
  });

  const avgMonthlyIncome = totalWeight > 0 ? weightedIncome / totalWeight : 0;
  const avgMonthlyExpenses =
    totalWeight > 0 ? weightedExpenses / totalWeight : 0;

  // Calculate proportional expected values based on days remaining
  const proportionRemaining = totalDays > 0 ? daysRemaining / totalDays : 0;

  // Expected income: current + recurring that hasn't come yet + proportional average for non-recurring
  // Use whichever is higher: the detected recurring income or the proportional historical average
  const historicalProportionalIncome = avgMonthlyIncome * proportionRemaining;
  const expectedAdditionalIncome = Math.max(
    historicalProportionalIncome,
    expectedRecurringIncome * 0.9 // 90% confidence on identified recurring income
  );

  const historicalProportionalExpenses =
    avgMonthlyExpenses * proportionRemaining;
  const expectedAdditionalExpenses = Math.max(
    historicalProportionalExpenses,
    expectedRecurringExpenses * 0.9 // 90% confidence on identified recurring expenses
  );

  const expectedIncome =
    (currentPeriodTotals?.income || 0) + expectedAdditionalIncome;
  const expectedExpenses =
    (currentPeriodTotals?.expenses || 0) + expectedAdditionalExpenses;
  const expectedEndBalance = expectedIncome - expectedExpenses;

  // Determine confidence level
  let confidence: 'low' | 'medium' | 'high' = 'low';
  if (totalMonths >= 6 && sameMonthPreviousYears.length >= 1) {
    confidence = 'high';
  } else if (totalMonths >= 3) {
    confidence = 'medium';
  }

  return {
    currentMonthIncome: currentPeriodTotals?.income || 0,
    currentMonthExpenses: currentPeriodTotals?.expenses || 0,
    expectedIncome,
    expectedExpenses,
    expectedEndBalance,
    confidence,
    basedOnMonths: totalMonths,
    isPastPeriod: false,
  };
}
