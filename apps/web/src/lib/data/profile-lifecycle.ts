import type { AsyncDatabaseConnection } from '@fluxby/database';

/** Clear profile records while retaining users, devices and shared providers. */
export async function clearAllProfileData(
  db: Pick<AsyncDatabaseConnection, 'queryAsync' | 'runAsync'>
): Promise<void> {
  // The caller owns a transaction; deferred constraints allow deletion of
  // domain references introduced by later migrations in any table order.
  await db.runAsync('PRAGMA defer_foreign_keys=ON');
  const tables = await db.queryAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  for (const { name } of tables) {
    if (!/^[a-z][a-z0-9_]*$/.test(name) || name === 'profiles') continue;
    const columns = await db.queryAsync<{ name: string }>(
      `PRAGMA table_info("${name}")`
    );
    if (
      name === 'contact_ibans' ||
      columns.some((c) => c.name === 'profile_id')
    )
      await db.runAsync(`DELETE FROM "${name}"`);
  }
  await db.runAsync('DELETE FROM profiles');
}

/** Called on the connection owned by the profile-deletion transaction. */
export async function softDeleteProfileData(
  db: Pick<AsyncDatabaseConnection, 'queryAsync' | 'runAsync'>,
  profileId: string,
  updatedAt: number
): Promise<void> {
  const tables = await db.queryAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  for (const { name } of tables) {
    if (!/^[a-z][a-z0-9_]*$/.test(name)) continue;
    const columns = new Set(
      (
        await db.queryAsync<{ name: string }>(`PRAGMA table_info("${name}")`)
      ).map((column) => column.name)
    );
    if (!columns.has('is_deleted') || !columns.has('updated_at')) continue;
    let owner: string;
    if (name === 'contact_ibans') {
      owner = 'contact_id IN (SELECT id FROM address_book WHERE profile_id=?)';
    } else if (!columns.has('profile_id')) {
      // Shared provider data and installation metadata do not belong to one profile.
      continue;
    } else if (name === 'transactions') {
      // Legacy transactions may inherit ownership from their account. An
      // explicit profile always takes precedence over the account reference.
      owner =
        'COALESCE(profile_id,(SELECT a.profile_id FROM accounts a WHERE a.id=transactions.account_id))=?';
    } else if (name === 'category_rules') {
      owner =
        'COALESCE(profile_id,(SELECT c.profile_id FROM categories c WHERE c.id=category_rules.category_id))=?';
    } else {
      owner = 'profile_id=?';
    }
    // Discover the stored features from their ownership columns so future
    // migrations cannot leave active financial records in a deleted profile.
    await db.runAsync(
      `UPDATE "${name}" SET is_deleted=1,updated_at=? WHERE is_deleted=0 AND ${owner}`,
      [updatedAt, profileId]
    );
  }
}
