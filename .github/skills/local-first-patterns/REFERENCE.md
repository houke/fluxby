# Local-First Patterns Quick Reference

## Storage Options

| Storage        | Capacity  | Persistence   | Use Case        |
| -------------- | --------- | ------------- | --------------- |
| localStorage   | ~5MB      | Until cleared | Settings        |
| sessionStorage | ~5MB      | Tab lifetime  | Temp state      |
| IndexedDB      | ~50% disk | Until cleared | Structured data |
| OPFS           | ~50% disk | Until cleared | Large files     |
| Cache API      | ~50% disk | Until cleared | Network cache   |

## OPFS Operations

```typescript
// Get root
const root = await navigator.storage.getDirectory();

// Create directory
const dir = await root.getDirectoryHandle('data', { create: true });

// Create file
const file = await dir.getFileHandle('db.sqlite', { create: true });

// Write file
const writable = await file.createWritable();
await writable.write(data);
await writable.close();

// Read file
const file = await file.getFile();
const content = await file.text();
// or: await file.arrayBuffer();

// Delete
await dir.removeEntry('file.txt');
await root.removeEntry('data', { recursive: true });

// Sync access (worker only)
const accessHandle = await file.createSyncAccessHandle();
accessHandle.write(buffer);
accessHandle.flush();
accessHandle.close();
```

## SQLite Setup (sql.js)

```typescript
import initSqlJs from 'sql.js';

// Initialize
const SQL = await initSqlJs({
  locateFile: (file) => `/sql.js/${file}`,
});

// Create database
const db = new SQL.Database();

// From existing data
const db = new SQL.Database(uint8Array);

// Execute
db.run('CREATE TABLE users (id TEXT, name TEXT)');
db.run('INSERT INTO users VALUES (?, ?)', ['1', 'John']);

// Query
const result = db.exec('SELECT * FROM users');
// result[0].columns = ['id', 'name']
// result[0].values = [['1', 'John']]

// Prepared statement
const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
stmt.bind(['1']);
while (stmt.step()) {
  console.log(stmt.getAsObject());
}
stmt.free();

// Export
const data = db.export(); // Uint8Array

// Close
db.close();
```

## Drizzle ORM

```typescript
// Schema
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
});

// Queries
import { eq, and, desc } from 'drizzle-orm';

// Select
const result = await db.select().from(users);
const user = await db.select().from(users).where(eq(users.id, '1'));

// Insert
await db.insert(users).values({ id: '1', name: 'John' });

// Update
await db.update(users).set({ name: 'Jane' }).where(eq(users.id, '1'));

// Delete
await db.delete(users).where(eq(users.id, '1'));
```

## Sync Queue

```typescript
interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: unknown;
  timestamp: number;
  retries: number;
}

// Add to queue
const addToQueue = (
  op: Omit<SyncOperation, 'id' | 'timestamp' | 'retries'>,
) => {
  const operation: SyncOperation = {
    ...op,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    retries: 0,
  };
  queue.push(operation);
};

// Process queue
const processQueue = async () => {
  while (queue.length > 0) {
    const op = queue[0];
    try {
      await syncToServer(op);
      queue.shift();
    } catch (error) {
      op.retries++;
      if (op.retries >= MAX_RETRIES) {
        await handleFailedSync(op);
        queue.shift();
      }
      break;
    }
  }
};
```

## Conflict Resolution

```typescript
// Last-Write-Wins
const resolve = (local: Item, remote: Item) =>
  local.updatedAt > remote.updatedAt ? local : remote;

// Field-level merge
const merge = (local: Item, remote: Item) => ({
  ...remote,
  ...Object.fromEntries(
    Object.entries(local).filter(
      ([key, value]) => local.fieldVersions[key] > remote.fieldVersions[key],
    ),
  ),
});

// Version vector
interface VersionVector {
  [clientId: string]: number;
}

const isNewer = (a: VersionVector, b: VersionVector) =>
  Object.entries(a).every(([k, v]) => v >= (b[k] ?? 0)) &&
  Object.entries(a).some(([k, v]) => v > (b[k] ?? 0));
```

## Online/Offline Detection

```typescript
// Basic
const isOnline = navigator.onLine;

// Events
window.addEventListener('online', handleOnline);
window.addEventListener('offline', handleOffline);

// React hook
const useOnlineStatus = () => {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return online;
};
```

## Service Worker Caching

```typescript
// Cache-first
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((cached) => cached || fetch(event.request)),
  );
});

// Network-first
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request)),
  );
});

// Stale-while-revalidate
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request).then((response) => {
        caches
          .open('v1')
          .then((cache) => cache.put(event.request, response.clone()));
        return response;
      });
      return cached || fetched;
    }),
  );
});
```

## Data Export/Import

```typescript
// Export
const exportData = async () => {
  const data = db.export();
  const blob = new Blob([data], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'backup.db';
  a.click();

  URL.revokeObjectURL(url);
};

// Import
const importData = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const data = new Uint8Array(buffer);
  db = new SQL.Database(data);
};
```

## Storage Quota

```typescript
// Check quota
const estimate = await navigator.storage.estimate();
console.log(`Used: ${estimate.usage} of ${estimate.quota}`);

// Request persistence
const persisted = await navigator.storage.persist();
console.log(`Persisted: ${persisted}`);
```

## Migration Pattern

```typescript
const CURRENT_VERSION = 3;

const migrations = {
  1: (db) => db.run('CREATE TABLE users (id TEXT)'),
  2: (db) => db.run('ALTER TABLE users ADD COLUMN name TEXT'),
  3: (db) => db.run('CREATE INDEX idx_users_name ON users(name)'),
};

const migrate = (db: Database, fromVersion: number) => {
  for (let v = fromVersion + 1; v <= CURRENT_VERSION; v++) {
    migrations[v]?.(db);
    db.run('PRAGMA user_version = ?', [v]);
  }
};
```

## Checklist

```
□ Storage strategy chosen
□ OPFS available check
□ SQLite initialized
□ Schema migrations
□ Sync queue implemented
□ Conflict resolution defined
□ Online/offline handling
□ Export/import working
□ Error handling
□ Quota management
```
