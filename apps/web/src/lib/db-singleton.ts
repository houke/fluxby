/**
 * Global Database Instance
 *
 * Provides a singleton database instance that can be used outside of React context.
 * This is initialized by DatabaseProvider when the app loads.
 */

import { type Database } from '@fluxby/database';
import { createDataService, type DataService } from './data-service';

let globalDb: Database | null = null;
let globalDataService: DataService | null = null;

/**
 * Set the global database instance (called by DatabaseProvider)
 */
export function setGlobalDatabase(db: Database): void {
  globalDb = db;
  globalDataService = createDataService(db);
}

/**
 * Get the global database instance
 */
export function getGlobalDatabase(): Database | null {
  return globalDb;
}

/**
 * Get the global data service instance
 * Throws if database is not initialized
 */
export function getDataService(): DataService {
  if (!globalDataService) {
    throw new Error(
      'Database not initialized. Make sure DatabaseProvider is mounted.'
    );
  }
  return globalDataService;
}

/**
 * Check if the database is ready
 */
export function isDatabaseReady(): boolean {
  return globalDb !== null && globalDataService !== null;
}
