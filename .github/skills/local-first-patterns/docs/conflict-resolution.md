# Conflict Resolution Patterns

## What Causes Conflicts?

Conflicts occur when:

1. Two clients modify the same data while offline
2. Network latency causes concurrent updates
3. Clock drift between devices

## Conflict Types

### 1. Update-Update Conflict

Both clients update the same field.

```typescript
// Client A (offline): user.name = "Alice"
// Client B (offline): user.name = "Alicia"
// Both sync → Conflict!
```

### 2. Update-Delete Conflict

One client updates, another deletes.

```typescript
// Client A: updates user.email
// Client B: deletes user
// What should happen?
```

### 3. Parent-Child Conflict

Parent deleted but child references it.

```typescript
// Client A: deletes folder
// Client B: creates file in folder
// Orphaned file!
```

## Resolution Strategies

### 1. Last-Write-Wins (LWW)

```typescript
interface LWWValue<T> {
  value: T;
  timestamp: number;
  nodeId: string;
}

function resolveLWW<T>(a: LWWValue<T>, b: LWWValue<T>): LWWValue<T> {
  // Compare timestamps
  if (a.timestamp !== b.timestamp) {
    return a.timestamp > b.timestamp ? a : b;
  }
  // Tie-breaker: deterministic node ID comparison
  return a.nodeId > b.nodeId ? a : b;
}
```

### 2. Field-Level Merge

Merge at field level instead of document level.

```typescript
interface MergeableDocument {
  [field: string]: {
    value: any;
    updatedAt: number;
    updatedBy: string;
  };
}

function mergeDocuments(
  local: MergeableDocument,
  remote: MergeableDocument,
): MergeableDocument {
  const result: MergeableDocument = {};
  const allFields = new Set([...Object.keys(local), ...Object.keys(remote)]);

  for (const field of allFields) {
    const localField = local[field];
    const remoteField = remote[field];

    if (!localField) {
      result[field] = remoteField;
    } else if (!remoteField) {
      result[field] = localField;
    } else {
      // LWW at field level
      result[field] =
        localField.updatedAt >= remoteField.updatedAt
          ? localField
          : remoteField;
    }
  }

  return result;
}
```

### 3. Three-Way Merge

Compare both versions against common ancestor.

```typescript
interface ThreeWayMergeResult<T> {
  merged: T;
  conflicts: ConflictField[];
  autoResolved: string[];
}

function threeWayMerge<T extends Record<string, any>>(
  base: T, // Common ancestor
  local: T, // Local changes
  remote: T, // Remote changes
): ThreeWayMergeResult<T> {
  const result: any = {};
  const conflicts: ConflictField[] = [];
  const autoResolved: string[] = [];

  const allFields = new Set([
    ...Object.keys(base),
    ...Object.keys(local),
    ...Object.keys(remote),
  ]);

  for (const field of allFields) {
    const baseVal = base[field];
    const localVal = local[field];
    const remoteVal = remote[field];

    const localChanged = !deepEqual(baseVal, localVal);
    const remoteChanged = !deepEqual(baseVal, remoteVal);

    if (!localChanged && !remoteChanged) {
      // No changes
      result[field] = baseVal;
    } else if (localChanged && !remoteChanged) {
      // Only local changed
      result[field] = localVal;
      autoResolved.push(field);
    } else if (!localChanged && remoteChanged) {
      // Only remote changed
      result[field] = remoteVal;
      autoResolved.push(field);
    } else if (deepEqual(localVal, remoteVal)) {
      // Both changed to same value
      result[field] = localVal;
      autoResolved.push(field);
    } else {
      // True conflict - both changed differently
      conflicts.push({
        field,
        base: baseVal,
        local: localVal,
        remote: remoteVal,
      });
      // Default: keep local (or could keep remote)
      result[field] = localVal;
    }
  }

  return { merged: result as T, conflicts, autoResolved };
}
```

### 4. Semantic Merge

Understand data semantics for smarter merging.

```typescript
// For a counter: sum the deltas
interface Counter {
  baseValue: number;
  localDelta: number;
  remoteDelta: number;
}

function mergeCounter(counter: Counter): number {
  return counter.baseValue + counter.localDelta + counter.remoteDelta;
}

// For a set: union or intersection
function mergeSet<T>(
  base: Set<T>,
  local: Set<T>,
  remote: Set<T>,
  strategy: 'union' | 'intersection',
): Set<T> {
  const localAdded = new Set([...local].filter((x) => !base.has(x)));
  const localRemoved = new Set([...base].filter((x) => !local.has(x)));
  const remoteAdded = new Set([...remote].filter((x) => !base.has(x)));
  const remoteRemoved = new Set([...base].filter((x) => !remote.has(x)));

  const result = new Set(base);

  // Apply additions
  for (const item of localAdded) result.add(item);
  for (const item of remoteAdded) result.add(item);

  // Apply removals (union: only if both removed, intersection: if either removed)
  if (strategy === 'union') {
    for (const item of localRemoved) {
      if (remoteRemoved.has(item)) result.delete(item);
    }
  } else {
    for (const item of localRemoved) result.delete(item);
    for (const item of remoteRemoved) result.delete(item);
  }

  return result;
}
```

### 5. Version Vectors (Vector Clocks)

Track causality to detect true conflicts.

```typescript
type VersionVector = Record<string, number>;

function incrementVersion(vv: VersionVector, nodeId: string): VersionVector {
  return { ...vv, [nodeId]: (vv[nodeId] || 0) + 1 };
}

function compareVersions(
  a: VersionVector,
  b: VersionVector,
): 'before' | 'after' | 'concurrent' | 'equal' {
  let aGreater = false;
  let bGreater = false;

  const allNodes = new Set([...Object.keys(a), ...Object.keys(b)]);

  for (const node of allNodes) {
    const aVal = a[node] || 0;
    const bVal = b[node] || 0;

    if (aVal > bVal) aGreater = true;
    if (bVal > aVal) bGreater = true;
  }

  if (aGreater && bGreater) return 'concurrent'; // True conflict
  if (aGreater) return 'after'; // A is newer
  if (bGreater) return 'before'; // B is newer
  return 'equal'; // Same version
}
```

## User-Facing Conflict Resolution

### Conflict UI Pattern

```typescript
interface ConflictResolution {
  documentId: string;
  field: string;
  localValue: any;
  remoteValue: any;
  localMeta: { by: string; at: Date };
  remoteMeta: { by: string; at: Date };
}

// React component example
function ConflictResolver({ conflict, onResolve }: Props) {
  return (
    <div className="conflict-card">
      <h3>Conflict in "{conflict.field}"</h3>

      <div className="options">
        <div className="option" onClick={() => onResolve('local')}>
          <h4>Your version</h4>
          <p>By {conflict.localMeta.by}</p>
          <pre>{JSON.stringify(conflict.localValue, null, 2)}</pre>
        </div>

        <div className="option" onClick={() => onResolve('remote')}>
          <h4>Their version</h4>
          <p>By {conflict.remoteMeta.by}</p>
          <pre>{JSON.stringify(conflict.remoteValue, null, 2)}</pre>
        </div>

        <div className="option" onClick={() => onResolve('merge')}>
          <h4>Merge both</h4>
          <p>Combine changes manually</p>
        </div>
      </div>
    </div>
  );
}
```

## Best Practices

1. **Minimize Conflict Surface**: Design schemas to reduce overlapping edits
2. **Preserve Intent**: Try to honor what users wanted, not just data
3. **Show History**: Let users see what happened during conflict
4. **Auto-Resolve When Safe**: Only ask users for true ambiguity
5. **Idempotent Operations**: Operations that can be safely replayed
6. **Tombstones**: Mark deleted items instead of hard deleting
7. **Conflict Log**: Keep record of resolved conflicts for debugging
