# Browser Storage Options

## Storage Comparison Matrix

| Storage        | Capacity  | Persistence | Sync Access | Async Access | Web Worker | Use Case              |
| -------------- | --------- | ----------- | ----------- | ------------ | ---------- | --------------------- |
| localStorage   | 5-10 MB   | Persistent  | ✅          | ❌           | ❌         | Small key-value       |
| sessionStorage | 5-10 MB   | Session     | ✅          | ❌           | ❌         | Temporary state       |
| IndexedDB      | 50%+ disk | Persistent  | ❌          | ✅           | ✅         | Large structured data |
| OPFS           | 50%+ disk | Persistent  | ❌          | ✅           | ✅         | Files, SQLite         |
| Cache API      | 50%+ disk | Persistent  | ❌          | ✅           | ✅         | HTTP responses        |

## localStorage / sessionStorage

Simple key-value storage with synchronous API.

```typescript
// localStorage - persists across sessions
localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Alice' }));
const user = JSON.parse(localStorage.getItem('user') || 'null');
localStorage.removeItem('user');
localStorage.clear();

// sessionStorage - cleared when tab closes
sessionStorage.setItem('tempData', 'value');
```

**Limitations:**

- 5-10 MB limit (varies by browser)
- Synchronous (blocks main thread)
- Strings only (must serialize objects)
- No Web Worker access
- No transactions

**Best for:**

- User preferences
- Auth tokens
- Small cached data
- Feature flags

## IndexedDB

Asynchronous object store for large amounts of structured data.

```typescript
// Open database
const request = indexedDB.open('MyDatabase', 1);

request.onupgradeneeded = (event) => {
  const db = (event.target as IDBOpenDBRequest).result;

  // Create object store with auto-increment key
  const store = db.createObjectStore('users', {
    keyPath: 'id',
    autoIncrement: true,
  });

  // Create indexes for querying
  store.createIndex('email', 'email', { unique: true });
  store.createIndex('createdAt', 'createdAt');
};

request.onsuccess = (event) => {
  const db = (event.target as IDBOpenDBRequest).result;

  // Write data
  const tx = db.transaction('users', 'readwrite');
  const store = tx.objectStore('users');
  store.add({
    email: 'alice@example.com',
    name: 'Alice',
    createdAt: new Date(),
  });

  // Read data
  const readTx = db.transaction('users', 'readonly');
  const readStore = readTx.objectStore('users');
  const getRequest = readStore.get(1);

  getRequest.onsuccess = () => {
    console.log(getRequest.result);
  };
};
```

**Best for:**

- Large datasets (100MB+)
- Complex queries with indexes
- Offline-first apps
- Structured data

**Recommended libraries:**

- `idb` - Promise-based wrapper
- `Dexie.js` - Full-featured ORM
- `localForage` - Simple API with fallbacks

## Origin Private File System (OPFS)

High-performance file system API for web apps.

```typescript
// Get OPFS root directory
const root = await navigator.storage.getDirectory();

// Create/open a file
const fileHandle = await root.getFileHandle('data.txt', { create: true });

// Write to file (async)
const writable = await fileHandle.createWritable();
await writable.write('Hello, World!');
await writable.close();

// Read from file
const file = await fileHandle.getFile();
const text = await file.text();
```

### Synchronous Access (Web Worker only)

```typescript
// In a Web Worker
const root = await navigator.storage.getDirectory();
const fileHandle = await root.getFileHandle('database.sqlite', {
  create: true,
});

// Get synchronous access handle
const accessHandle = await fileHandle.createSyncAccessHandle();

// Synchronous read/write
const buffer = new ArrayBuffer(1024);
const bytesRead = accessHandle.read(buffer, { at: 0 });
accessHandle.write(new Uint8Array([1, 2, 3]), { at: 0 });
accessHandle.flush();
accessHandle.close();
```

**Best for:**

- SQLite databases
- Large binary files
- High-performance I/O
- File-based applications

## Cache API

Store HTTP request/response pairs for offline access.

```typescript
// Open a cache
const cache = await caches.open('v1');

// Cache a response
await cache.put('/api/data', new Response(JSON.stringify({ key: 'value' })));

// Cache from network
await cache.add('/api/users');
await cache.addAll(['/api/users', '/api/posts', '/styles.css']);

// Retrieve from cache
const response = await cache.match('/api/data');
if (response) {
  const data = await response.json();
}

// Delete from cache
await cache.delete('/api/data');

// Delete entire cache
await caches.delete('v1');
```

**Best for:**

- Caching API responses
- Service Worker strategies
- Static assets
- Offline web apps

## Storage Persistence

Request persistent storage to prevent eviction:

```typescript
// Check current persistence
const persisted = await navigator.storage.persisted();
console.log(`Persisted: ${persisted}`);

// Request persistence
if (!persisted) {
  const granted = await navigator.storage.persist();
  console.log(`Persistence granted: ${granted}`);
}

// Check quota
const estimate = await navigator.storage.estimate();
console.log(`Quota: ${estimate.quota}`);
console.log(`Usage: ${estimate.usage}`);
console.log(`Available: ${estimate.quota! - estimate.usage!}`);
```

## Storage Eviction

Browsers may evict storage under pressure. Priority order:

1. **Best effort** (default): Can be evicted anytime
2. **Persistent**: Protected from automatic eviction

Eviction order (first to be removed):

1. Least recently used data
2. Non-persistent origins
3. Larger storage consumers

## Choosing the Right Storage

```
┌─────────────────────────────────────────────────────────────┐
│                    What are you storing?                      │
└─────────────────────────────────────────────────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           ▼                  ▼                  ▼
     Small KV pairs     Structured data     Binary files
     (< 5MB)            (any size)          (any size)
           │                  │                  │
           ▼                  ▼                  ▼
    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
    │localStorage │    │ IndexedDB   │    │    OPFS     │
    │   (sync)    │    │  (async)    │    │  (async)    │
    └─────────────┘    └─────────────┘    └─────────────┘
                              │
                    Need SQL queries?
                              │
                       ┌──────┴──────┐
                       ▼             ▼
                      No            Yes
                       │             │
                       ▼             ▼
                 IndexedDB    SQLite + OPFS
```

## Browser Support

| Feature           | Chrome | Firefox | Safari   | Edge   |
| ----------------- | ------ | ------- | -------- | ------ |
| localStorage      | ✅     | ✅      | ✅       | ✅     |
| IndexedDB         | ✅     | ✅      | ✅       | ✅     |
| OPFS              | ✅ 86+ | ✅ 111+ | ✅ 15.2+ | ✅ 86+ |
| Cache API         | ✅     | ✅      | ✅       | ✅     |
| storage.persist() | ✅     | ✅      | ⚠️       | ✅     |
