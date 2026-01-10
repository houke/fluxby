import { createDatabase } from '../packages/database/src/factory';
import { createDataService } from '../apps/web/src/lib/data-service';

export async function openDB() {
  // Create an in-memory node DB (fast, isolated)
  const db = await createDatabase({
    environment: 'node',
    dbPath: ':memory:',
    autoMigrate: true,
  });
  const ds = createDataService(db);

  // Create profile for tests
  const profile = await ds.createProfile({ name: 'TestProfile' });

  return { db, profileId: profile.id };
}
