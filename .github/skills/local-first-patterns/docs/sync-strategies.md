# Sync Strategies for Local-First Apps

## Sync Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        Client                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │
│  │   Local DB  │◄──►│ Sync Engine │◄──►│   Network   │       │
│  │  (SQLite)   │    │   (Worker)  │    │   Layer     │       │
│  └─────────────┘    └─────────────┘    └─────────────┘       │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                        Server                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │
│  │    Sync     │◄──►│  Conflict   │◄──►│  Database   │       │
│  │   Handler   │    │  Resolver   │    │  (Primary)  │       │
│  └─────────────┘    └─────────────┘    └─────────────┘       │
└──────────────────────────────────────────────────────────────┘
```

## Sync Strategies

### 1. Last-Write-Wins (LWW)

Simplest strategy: newest timestamp wins.

```typescript
interface LWWRecord {
  id: string;
  data: any;
  updatedAt: number; // Unix timestamp
  clientId: string;
}

function resolveConflict(local: LWWRecord, remote: LWWRecord): LWWRecord {
  // Latest timestamp wins
  if (remote.updatedAt > local.updatedAt) {
    return remote;
  }
  // Tie-breaker: higher client ID wins
  if (
    remote.updatedAt === local.updatedAt &&
    remote.clientId > local.clientId
  ) {
    return remote;
  }
  return local;
}
```

**Pros:** Simple, predictable
**Cons:** Can lose data, requires synchronized clocks

### 2. Operational Transformation (OT)

Transform operations to maintain consistency.

```typescript
interface Operation {
  type: 'insert' | 'delete';
  position: number;
  char?: string;
  clientId: string;
  timestamp: number;
}

function transformOperation(op: Operation, against: Operation): Operation {
  if (op.type === 'insert' && against.type === 'insert') {
    if (against.position <= op.position) {
      return { ...op, position: op.position + 1 };
    }
  }
  if (op.type === 'insert' && against.type === 'delete') {
    if (against.position < op.position) {
      return { ...op, position: op.position - 1 };
    }
  }
  // ... more transformations
  return op;
}
```

**Pros:** Preserves all user intentions
**Cons:** Complex, hard to implement correctly

### 3. Conflict-Free Replicated Data Types (CRDTs)

Data structures that automatically merge without conflicts.

```typescript
// G-Counter (Grow-only counter)
interface GCounter {
  [nodeId: string]: number;
}

function increment(counter: GCounter, nodeId: string): GCounter {
  return {
    ...counter,
    [nodeId]: (counter[nodeId] || 0) + 1,
  };
}

function merge(a: GCounter, b: GCounter): GCounter {
  const result: GCounter = { ...a };
  for (const [nodeId, value] of Object.entries(b)) {
    result[nodeId] = Math.max(result[nodeId] || 0, value);
  }
  return result;
}

function value(counter: GCounter): number {
  return Object.values(counter).reduce((sum, v) => sum + v, 0);
}
```

**Pros:** Guaranteed convergence, no conflicts
**Cons:** Limited data types, can be memory-intensive

### 4. Event Sourcing

Store events, not state. Derive state from events.

```typescript
interface Event {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  clientId: string;
}

interface EventStore {
  events: Event[];
  lastSyncedEventId: string | null;
}

function applyEvent(state: any, event: Event): any {
  switch (event.type) {
    case 'ITEM_CREATED':
      return { ...state, [event.payload.id]: event.payload };
    case 'ITEM_UPDATED':
      return {
        ...state,
        [event.payload.id]: { ...state[event.payload.id], ...event.payload },
      };
    case 'ITEM_DELETED':
      const { [event.payload.id]: _, ...rest } = state;
      return rest;
    default:
      return state;
  }
}

function rebuildState(events: Event[]): any {
  return events
    .sort((a, b) => a.timestamp - b.timestamp)
    .reduce((state, event) => applyEvent(state, event), {});
}
```

**Pros:** Full history, easy undo, audit trail
**Cons:** Storage grows, complexity in rebuilding state

## Sync Protocols

### Push-Based Sync

Client pushes changes to server immediately.

```typescript
async function pushChanges(changes: Change[]): Promise<SyncResult> {
  const response = await fetch('/api/sync/push', {
    method: 'POST',
    body: JSON.stringify({ changes, lastSyncToken: getLastSyncToken() }),
  });

  const result = await response.json();

  if (result.conflicts) {
    await resolveConflicts(result.conflicts);
  }

  setLastSyncToken(result.syncToken);
  return result;
}
```

### Pull-Based Sync

Client periodically pulls changes from server.

```typescript
async function pullChanges(): Promise<Change[]> {
  const response = await fetch(`/api/sync/pull?since=${getLastSyncToken()}`);
  const { changes, syncToken } = await response.json();

  await applyChanges(changes);
  setLastSyncToken(syncToken);

  return changes;
}

// Poll every 30 seconds
setInterval(pullChanges, 30000);
```

### Bidirectional Sync

Combine push and pull in single request.

```typescript
async function sync(): Promise<SyncResult> {
  const localChanges = await getUnpushedChanges();

  const response = await fetch('/api/sync', {
    method: 'POST',
    body: JSON.stringify({
      changes: localChanges,
      lastSyncToken: getLastSyncToken(),
    }),
  });

  const { remoteChanges, conflicts, syncToken } = await response.json();

  // Apply remote changes
  await applyChanges(remoteChanges);

  // Handle conflicts
  if (conflicts.length > 0) {
    await handleConflicts(conflicts);
  }

  // Mark local changes as synced
  await markAsSynced(localChanges);

  setLastSyncToken(syncToken);

  return { applied: remoteChanges.length, pushed: localChanges.length };
}
```

### Real-Time Sync (WebSocket)

Instant propagation of changes.

```typescript
class RealtimeSync {
  private ws: WebSocket;
  private pendingChanges: Change[] = [];

  connect() {
    this.ws = new WebSocket('wss://api.example.com/sync');

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'CHANGE':
          this.applyRemoteChange(message.change);
          break;
        case 'ACK':
          this.acknowledgeChange(message.changeId);
          break;
        case 'CONFLICT':
          this.handleConflict(message.conflict);
          break;
      }
    };

    this.ws.onclose = () => {
      // Reconnect with exponential backoff
      setTimeout(() => this.connect(), this.getBackoff());
    };
  }

  pushChange(change: Change) {
    this.pendingChanges.push(change);

    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'CHANGE', change }));
    }
  }
}
```

## Sync State Machine

```
                    ┌──────────────────┐
                    │      IDLE        │
                    └────────┬─────────┘
                             │ change detected
                             ▼
                    ┌──────────────────┐
         ┌─────────│    PENDING       │─────────┐
         │         └────────┬─────────┘         │
  offline│                  │ online            │ batch timeout
         │                  ▼                   │
         │         ┌──────────────────┐         │
         │         │    SYNCING       │◄────────┘
         │         └────────┬─────────┘
         │                  │
         │    ┌─────────────┼─────────────┐
         │    ▼             ▼             ▼
         │ success       conflict      error
         │    │             │             │
         │    ▼             ▼             ▼
         │ ┌──────┐   ┌──────────┐   ┌──────┐
         │ │SYNCED│   │RESOLVING │   │RETRY │
         │ └──┬───┘   └────┬─────┘   └──┬───┘
         │    │            │            │
         └────┴────────────┴────────────┘
                       │
                       ▼
              ┌──────────────────┐
              │      IDLE        │
              └──────────────────┘
```

## Best Practices

1. **Optimistic Updates**: Apply changes locally first, sync in background
2. **Idempotent Operations**: Same operation can be applied multiple times safely
3. **Vector Clocks**: Track causality between events
4. **Sync Tokens**: Use opaque tokens instead of timestamps
5. **Batching**: Group multiple changes into single sync request
6. **Compression**: Compress sync payloads for large datasets
7. **Retry with Backoff**: Handle network failures gracefully
8. **Conflict UI**: Show users when conflicts need manual resolution
