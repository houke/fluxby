import { getImportProfileDemoData } from '@fluxby/shared';
import type { FinancialDatabase } from './financial-planning';
import { headerSignature } from '../importers/import-options';
/** Called within the existing demo seeding transaction. */
export async function seedImportProfilesDemo(
  db: FinancialDatabase,
  profileId: string,
  language: 'nl' | 'en'
) {
  const demo = getImportProfileDemoData(language),
    now = Date.now();
  await db.runAsync(
    'INSERT INTO import_profiles(id,name,header_signature,settings_json,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?)',
    [
      crypto.randomUUID(),
      demo.name,
      headerSignature(demo.headers),
      JSON.stringify(demo.settings),
      profileId,
      now,
      now,
    ]
  );
}
