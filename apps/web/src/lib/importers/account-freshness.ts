export interface AccountImportFreshness {
  id: string;
  name: string;
  lastImportedAt: number | null;
  newestTransactionDate: string | null;
}

export type AccountFreshnessStatus = 'fresh' | 'aging' | 'stale' | 'never';

export function getAccountFreshnessStatus(
  account: Pick<
    AccountImportFreshness,
    'lastImportedAt' | 'newestTransactionDate'
  >,
  now = Date.now()
): AccountFreshnessStatus {
  if (account.lastImportedAt === null) return 'never';
  if (
    !Number.isFinite(account.lastImportedAt) ||
    !account.newestTransactionDate
  )
    return 'stale';
  const statement = Date.parse(`${account.newestTransactionDate}T00:00:00Z`);
  if (!Number.isFinite(statement)) return 'stale';
  // A freshly uploaded old statement must still warn about its stale balance.
  // Device sync and manually entered transactions never advance this date.
  const lastKnownDay = Math.min(
    Math.floor(account.lastImportedAt / 86400000),
    Math.floor(statement / 86400000)
  );
  const days = Math.max(0, Math.floor(now / 86400000) - lastKnownDay);
  return days <= 7 ? 'fresh' : days <= 30 ? 'aging' : 'stale';
}
