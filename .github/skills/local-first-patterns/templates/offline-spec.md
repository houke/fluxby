# Local-First Architecture Specification Template

## Overview

| Field               | Value                                              |
| ------------------- | -------------------------------------------------- |
| Feature Name        | [Name]                                             |
| Offline Requirement | [Full offline / Partial / Online-first with cache] |
| Data Sensitivity    | [Public / Private / Encrypted]                     |
| Sync Model          | [Real-time / Periodic / On-demand]                 |

## Data Model

### Entities

| Entity   | Fields   | Size Estimate      | Sync Strategy    |
| -------- | -------- | ------------------ | ---------------- |
| [Entity] | [Fields] | [~X KB per record] | [LWW/CRDT/Event] |

### Relationships

```
[Entity A] ──1:N──► [Entity B] ──N:M──► [Entity C]
```

### Example Schema

```sql
CREATE TABLE [entity] (
  id TEXT PRIMARY KEY,
  -- Data fields
  [field1] TEXT NOT NULL,
  [field2] INTEGER,
  -- Sync metadata
  _version INTEGER DEFAULT 0,
  _syncStatus TEXT DEFAULT 'pending',
  _deletedAt TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE INDEX idx_[entity]_sync ON [entity](_syncStatus, updatedAt);
```

## Storage Strategy

### Storage Selection

| Data Type | Storage                              | Reason |
| --------- | ------------------------------------ | ------ |
| [Type]    | [localStorage/IndexedDB/OPFS/SQLite] | [Why]  |

### Capacity Planning

| Storage      | Estimated Usage | Quota         |
| ------------ | --------------- | ------------- |
| SQLite DB    | [X MB]          | [Available]   |
| Cached files | [X MB]          | [Available]   |
| Total        | [X MB]          | [50% of disk] |

### Persistence

- [ ] Request persistent storage
- [ ] Handle storage pressure events
- [ ] Implement data pruning strategy

## Sync Architecture

### Sync Flow

```
┌─────────────────────────────────────────────────────┐
│                    User Action                       │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│              Local Database Write                    │
│            (Optimistic Update)                       │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│              Queue for Sync                          │
│            (_syncStatus = 'pending')                 │
└───────────────────────┬─────────────────────────────┘
                        │
            ┌───────────┴───────────┐
            │                       │
       Online                   Offline
            │                       │
            ▼                       ▼
┌───────────────────┐   ┌───────────────────┐
│   Push to Server  │   │   Store in Queue  │
└─────────┬─────────┘   └─────────┬─────────┘
          │                       │
          ▼                       │
┌───────────────────┐             │
│  Handle Response  │             │
└─────────┬─────────┘             │
          │                       │
          │    ┌──────────────────┘
          │    │ (When online)
          ▼    ▼
┌─────────────────────────────────────────────────────┐
│              Update Sync Status                      │
│            (_syncStatus = 'synced')                  │
└─────────────────────────────────────────────────────┘
```

### Conflict Resolution

| Conflict Type | Resolution Strategy  | User Involvement |
| ------------- | -------------------- | ---------------- |
| Update-Update | [LWW/Merge/Ask user] | [Auto/Manual]    |
| Update-Delete | [Keep/Delete/Ask]    | [Auto/Manual]    |
| Create-Create | [Merge/Rename]       | [Auto/Manual]    |

### Sync Protocol

- [ ] Push-based (immediate)
- [ ] Pull-based (polling)
- [ ] Bidirectional
- [ ] Real-time (WebSocket)

## Offline Behavior

### Feature Matrix

| Feature     | Online  | Offline        | Sync Required |
| ----------- | ------- | -------------- | ------------- |
| [Feature 1] | ✅ Full | ✅ Full        | On change     |
| [Feature 2] | ✅ Full | ⚠️ Limited     | Immediate     |
| [Feature 3] | ✅ Full | ❌ Unavailable | N/A           |

### Offline Indicators

- [ ] Show sync status in UI
- [ ] Indicate pending changes count
- [ ] Show last sync time
- [ ] Alert on prolonged offline

### Queue Management

| Queue Type      | Max Size  | Overflow Strategy        |
| --------------- | --------- | ------------------------ |
| Pending changes | [N items] | [Block/Warn/Drop oldest] |
| Failed syncs    | [N items] | [Retry/Discard after X]  |

## Security

### Data at Rest

- [ ] Encrypt sensitive fields
- [ ] Use secure storage APIs
- [ ] Clear data on logout

### Data in Transit

- [ ] HTTPS only
- [ ] Certificate pinning (mobile)
- [ ] Request signing

### Auth Token Storage

| Token   | Storage        | Refresh Strategy |
| ------- | -------------- | ---------------- |
| Access  | Memory         | Auto-refresh     |
| Refresh | Secure storage | On expiry        |

## Implementation Checklist

### Phase 1: Local Storage

- [ ] Set up storage layer (SQLite/IndexedDB)
- [ ] Implement repositories
- [ ] Add sync metadata to entities
- [ ] Create migration system

### Phase 2: Sync Engine

- [ ] Implement change tracking
- [ ] Build sync queue
- [ ] Create push/pull logic
- [ ] Add conflict detection

### Phase 3: Conflict Resolution

- [ ] Implement resolution strategies
- [ ] Build conflict UI (if manual)
- [ ] Add resolution logging

### Phase 4: Polish

- [ ] Add sync status UI
- [ ] Implement retry logic
- [ ] Add offline indicators
- [ ] Performance optimization

## Testing Strategy

### Offline Testing

- [ ] Airplane mode scenarios
- [ ] Slow network simulation
- [ ] Network interruption during sync
- [ ] Storage quota exceeded

### Conflict Testing

- [ ] Simultaneous edits
- [ ] Clock drift scenarios
- [ ] Merge correctness
- [ ] Resolution UI flows

## Monitoring

### Metrics to Track

| Metric            | Target | Alert Threshold |
| ----------------- | ------ | --------------- |
| Sync success rate | >99%   | <95%            |
| Average sync time | <2s    | >5s             |
| Conflict rate     | <1%    | >5%             |
| Queue size        | <100   | >500            |

## Dependencies

| Library     | Version | Purpose           |
| ----------- | ------- | ----------------- |
| [wa-sqlite] | [X.X.X] | SQLite in browser |
| [idb]       | [X.X.X] | IndexedDB wrapper |
| [Other]     | [X.X.X] | [Purpose]         |

## Risks & Mitigations

| Risk                   | Impact | Mitigation             |
| ---------------------- | ------ | ---------------------- |
| Data loss during sync  | High   | Backup before merge    |
| Storage quota exceeded | Medium | Pruning + user warning |
| Clock drift conflicts  | Low    | Server timestamps      |
