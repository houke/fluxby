---
name: local-first-patterns
description: Implement local-first architecture patterns with OPFS, SQLite, and sync strategies. Use when working with offline storage, data persistence, or sync logic.
---

# Local-First Patterns Skill

Implement local-first architecture where apps work offline by default and sync when online.

## Quick Start

```typescript
import { drizzle } from 'drizzle-orm/sql-js';
import initSqlJs from 'sql.js';

// Initialize SQLite in browser
const SQL = await initSqlJs({
  locateFile: (file) => `https://sql.js.org/dist/${file}`,
});

const db = new SQL.Database();
const drizzleDb = drizzle(db);
```

## Skill Contents

### Documentation

- `docs/storage-options.md` - Local storage options (OPFS, IndexedDB, SQLite)
- `docs/sync-strategies.md` - Sync patterns and conflict resolution
- `docs/conflict-resolution.md` - CRDT and merge strategies

### Examples

- `examples/opfs-operations.ts` - OPFS file operations
- `examples/sqlite-setup.ts` - SQLite with Drizzle ORM setup
- `examples/sync-engine.ts` - Offline sync queue implementation

### Templates

- `templates/offline-spec.md` - Offline-first specification template

### Reference

- `REFERENCE.md` - Quick reference cheatsheet

## Core Principles

| Principle               | Description                            |
| ----------------------- | -------------------------------------- |
| **Offline First**       | App must work without network          |
| **User Owns Data**      | Data stored locally, always exportable |
| **Sync Later**          | Changes queue and sync when online     |
| **Conflict Resolution** | Deterministic merge strategies         |
| **Instant Feedback**    | Optimistic updates for all actions     |

## Technology Stack

| Layer    | Technology                  | Purpose                 |
| -------- | --------------------------- | ----------------------- |
| Storage  | OPFS                        | Persistent file storage |
| Database | SQLite (sql.js / wa-sqlite) | Relational queries      |
| ORM      | Drizzle ORM                 | Type-safe queries       |
| Sync     | Custom / CRDT               | Conflict resolution     |
| Queue    | IndexedDB                   | Offline change queue    |

## OPFS (Origin Private File System)

### Basic File Operations

```typescript
// Get OPFS root directory
async function getOPFSRoot(): Promise<FileSystemDirectoryHandle> {
  return await navigator.storage.getDirectory();
}

// Write file to OPFS
async function writeFile(filename: string, data: Uint8Array): Promise<void> {
  const root = await getOPFSRoot();
  const fileHandle = await root.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(data);
  await writable.close();
}

// Read file from OPFS
async function readFile(filename: string): Promise<Uint8Array> {
  const root = await getOPFSRoot();
  const fileHandle = await root.getFileHandle(filename);
  const file = await fileHandle.getFile();
  const buffer = await file.arrayBuffer();
  return new Uint8Array(buffer);
}

// Delete file
async function deleteFile(filename: string): Promise<void> {
  const root = await getOPFSRoot();
  await root.removeEntry(filename);
}

// List files in directory
async function listFiles(): Promise<string[]> {
  const root = await getOPFSRoot();
  const files: string[] = [];
  for await (const [name, handle] of root.entries()) {
    if (handle.kind === 'file') {
      files.push(name);
    }
  }
  return files;
}
```

### Sync Access Handle (Worker)

```typescript
// worker.ts - For better performance in Web Worker
async function getSyncAccessHandle(
  filename: string,
): Promise<FileSystemSyncAccessHandle> {
  const root = await navigator.storage.getDirectory();
  const fileHandle = await root.getFileHandle(filename, { create: true });
  return await fileHandle.createSyncAccessHandle();
}

// Synchronous read/write in worker
const handle = await getSyncAccessHandle('database.sqlite');

// Read
const buffer = new ArrayBuffer(handle.getSize());
handle.read(buffer, { at: 0 });

// Write
const data = new Uint8Array([1, 2, 3, 4]);
handle.write(data, { at: 0 });
handle.flush();
handle.close();
```

## SQLite in Browser

### Setup with sql.js

```typescript
import initSqlJs, { Database } from 'sql.js';

class BrowserDatabase {
  private db: Database | null = null;
  private readonly filename = 'app.sqlite';

  async initialize(): Promise<void> {
    const SQL = await initSqlJs({
      locateFile: (file) => `/sql-wasm/${file}`,
    });

    // Try to load existing database from OPFS
    try {
      const data = await readFile(this.filename);
      this.db = new SQL.Database(data);
    } catch {
      // Create new database
      this.db = new SQL.Database();
      await this.runMigrations();
    }
  }

  async save(): Promise<void> {
    if (!this.db) return;
    const data = this.db.export();
    await writeFile(this.filename, data);
  }

  async runMigrations(): Promise<void> {
    this.db?.run(`
      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        deleted_at TEXT,
        version INTEGER DEFAULT 1
      )
    `);
    await this.save();
  }
}
```

### Drizzle ORM Integration

```typescript
import { drizzle } from 'drizzle-orm/sql-js';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Schema definition
export const todos = sqliteTable('todos', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  completed: integer('completed', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  deletedAt: text('deleted_at'),
  version: integer('version').default(1),
});

// Database instance
const db = drizzle(sqlDatabase);

// Queries
const allTodos = await db.select().from(todos).where(isNull(todos.deletedAt));

const newTodo = await db
  .insert(todos)
  .values({
    id: crypto.randomUUID(),
    title: 'New todo',
  })
  .returning();

await db
  .update(todos)
  .set({ completed: true, version: sql`version + 1` })
  .where(eq(todos.id, todoId));
```

## Offline-First Data Flow

```
User Action
    ↓
Optimistic UI Update
    ↓
Local SQLite Write
    ↓
Queue Change for Sync
    ↓
[When Online] Push to Server
    ↓
Receive Server Changes
    ↓
Merge & Conflict Resolution
    ↓
Update Local Database
    ↓
Update UI
```

## Sync Queue

```typescript
interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  table: string;
  data: Record<string, unknown>;
  timestamp: number;
  retries: number;
}

class SyncQueue {
  private readonly DB_NAME = 'sync-queue';
  private readonly STORE_NAME = 'pending';

  async add(
    item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>,
  ): Promise<void> {
    const db = await this.openDB();
    const tx = db.transaction(this.STORE_NAME, 'readwrite');
    const store = tx.objectStore(this.STORE_NAME);

    await store.add({
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retries: 0,
    });
  }

  async process(): Promise<void> {
    if (!navigator.onLine) return;

    const items = await this.getAll();

    for (const item of items) {
      try {
        await this.syncItem(item);
        await this.remove(item.id);
      } catch (error) {
        if (item.retries >= 3) {
          await this.moveToDeadLetter(item);
        } else {
          await this.incrementRetry(item.id);
        }
      }
    }
  }

  private async syncItem(item: SyncQueueItem): Promise<void> {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status}`);
    }
  }
}
```

## Conflict Resolution Strategies

### Last-Write-Wins (LWW)

```typescript
interface LWWRecord {
  id: string;
  data: unknown;
  updatedAt: number; // Unix timestamp
  deviceId: string;
}

function mergeWithLWW(local: LWWRecord, remote: LWWRecord): LWWRecord {
  // Higher timestamp wins
  if (remote.updatedAt > local.updatedAt) {
    return remote;
  }
  // Same timestamp? Use device ID as tiebreaker
  if (remote.updatedAt === local.updatedAt) {
    return remote.deviceId > local.deviceId ? remote : local;
  }
  return local;
}
```

### Field-Level Merge

```typescript
interface VersionedField<T> {
  value: T;
  updatedAt: number;
}

interface MergeableRecord {
  id: string;
  title: VersionedField<string>;
  completed: VersionedField<boolean>;
  notes: VersionedField<string>;
}

function fieldLevelMerge(
  local: MergeableRecord,
  remote: MergeableRecord,
): MergeableRecord {
  return {
    id: local.id,
    title: mergeField(local.title, remote.title),
    completed: mergeField(local.completed, remote.completed),
    notes: mergeField(local.notes, remote.notes),
  };
}

function mergeField<T>(
  local: VersionedField<T>,
  remote: VersionedField<T>,
): VersionedField<T> {
  return remote.updatedAt > local.updatedAt ? remote : local;
}
```

### Operation-Based CRDT (for text)

```typescript
// Using Yjs for text collaboration
import * as Y from 'yjs';

const doc = new Y.Doc();
const text = doc.getText('content');

// Local edit
text.insert(0, 'Hello ');

// Sync with remote
const update = Y.encodeStateAsUpdate(doc);
// Send `update` to server

// Apply remote changes
Y.applyUpdate(doc, remoteUpdate);
```

## Online/Offline Detection

```typescript
class ConnectionManager {
  private listeners: Set<(online: boolean) => void> = new Set();

  constructor() {
    window.addEventListener('online', () => this.notify(true));
    window.addEventListener('offline', () => this.notify(false));
  }

  get isOnline(): boolean {
    return navigator.onLine;
  }

  subscribe(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(online: boolean): void {
    this.listeners.forEach((cb) => cb(online));
  }
}

// React hook
function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

## Data Export/Import

```typescript
class DataPortability {
  async exportDatabase(): Promise<Blob> {
    const data = db.export();
    return new Blob([data], { type: 'application/x-sqlite3' });
  }

  async exportJSON(): Promise<Blob> {
    const tables = ['todos', 'projects', 'settings'];
    const data: Record<string, unknown[]> = {};

    for (const table of tables) {
      data[table] = await db.select().from(schema[table]).all();
    }

    return new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
  }

  async importJSON(file: File): Promise<void> {
    const text = await file.text();
    const data = JSON.parse(text);

    await db.transaction(async (tx) => {
      for (const [table, rows] of Object.entries(data)) {
        for (const row of rows as unknown[]) {
          await tx.insert(schema[table]).values(row).onConflictDoReplace();
        }
      }
    });
  }

  downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
```

## Service Worker Caching

```typescript
// service-worker.ts
const CACHE_NAME = 'app-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/styles.css',
  '/sql-wasm/sql-wasm.wasm',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }),
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    }),
  );
});
```

## Best Practices

| Practice                  | Description                                         |
| ------------------------- | --------------------------------------------------- |
| **Optimistic Updates**    | Show changes immediately, sync in background        |
| **Idempotent Operations** | Same operation can be applied multiple times safely |
| **Timestamps**            | Use server-generated timestamps for ordering        |
| **Chunked Sync**          | Sync large datasets in batches                      |
| **Version Vectors**       | Track causality for conflict detection              |
| **Tombstones**            | Mark deleted records instead of removing            |
| **Background Sync**       | Use Background Sync API when available              |

## Commands

```bash
# Test offline functionality
# Chrome DevTools → Network → Offline

# Run local-first tests
npm run test -- --grep local-first

# Generate schema migrations
npm run drizzle:generate

# Apply migrations
npm run drizzle:migrate
```

## After Implementation

> [!IMPORTANT]
> After implementing local-first features:
>
> 1. Test offline functionality (DevTools → Network → Offline)
> 2. Run all tests: `npm run test`
> 3. Verify data persists across page reloads
> 4. Test export/import roundtrip
> 5. Test conflict resolution scenarios
> 6. Verify Service Worker caches correctly
> 7. Fix ALL errors and warnings
