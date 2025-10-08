# TanStack DB Update Patterns - Quick Reference

## Overview

TanStack DB provides multiple ways to update data in collections. Choose the right method based on your needs.

---

## Update Methods Comparison

| Method | Schema Validation | Optimistic | Rollback | Use Case |
|--------|------------------|------------|----------|----------|
| `collection.update()` | ✅ Yes | ✅ Yes | ✅ Yes | Complex updates with validation |
| `collection.utils.writeUpdate()` | ❌ No | ✅ Yes | ❌ No | Simple field updates, bypass validation |
| `collection.utils.writeUpsert()` | ❌ No | ✅ Yes | ❌ No | Insert or update |
| `collection.utils.writeBatch()` | ❌ No | ✅ Yes | ❌ No | Multiple operations |

---

## Pattern 1: `collection.update()` - With Validation

### When to Use
- ✅ Complex update logic
- ✅ Need schema validation
- ✅ Want transaction tracking
- ✅ Need rollback on error

### Example
```typescript
// Update with validation and transaction tracking
const tx = collection.update(id, (draft) => {
  draft.completed = true;
  draft.completedAt = new Date().toISOString();
  draft.completedBy = currentUser.id;
});

// Wait for persistence
await tx.isPersisted.promise;
```

### Pros
- ✅ Schema validation ensures data integrity
- ✅ Transaction tracking for rollback
- ✅ Type-safe with TypeScript
- ✅ Automatic optimistic updates

### Cons
- ❌ Requires all fields to be present (full object validation)
- ❌ Can fail with `SchemaValidationError` on partial updates
- ❌ More overhead

---

## Pattern 2: `collection.utils.writeUpdate()` - Bypass Validation

### When to Use
- ✅ Simple field updates
- ✅ Partial updates (only some fields)
- ✅ Want to bypass schema validation
- ✅ Need immediate cache update

### Example
```typescript
// Get existing item
const item = collection.get(id);
if (!item) return;

// Update directly without validation
collection.utils.writeUpdate({
  ...item,
  isRead: true,
  readAt: new Date().toISOString(),
});

// Optionally sync with backend
await api.markAsRead(id);
```

### Pros
- ✅ Bypasses schema validation
- ✅ Works with partial objects
- ✅ Immediate cache update
- ✅ No validation overhead

### Cons
- ❌ No schema validation (can insert invalid data)
- ❌ No transaction tracking
- ❌ No automatic rollback on error

---

## Pattern 3: `collection.utils.writeUpsert()` - Insert or Update

### When to Use
- ✅ Don't know if item exists
- ✅ Want to insert if missing, update if exists
- ✅ Syncing data from external source

### Example
```typescript
// Upsert: insert if new, update if exists
collection.utils.writeUpsert({
  id: 123,
  title: "Updated Title",
  completed: false,
  // ... other fields
});
```

### Pros
- ✅ Handles both insert and update
- ✅ No need to check existence
- ✅ Useful for sync operations

### Cons
- ❌ No schema validation
- ❌ Must provide full object

---

## Pattern 4: `collection.utils.writeBatch()` - Multiple Operations

### When to Use
- ✅ Multiple updates at once
- ✅ Atomic operations
- ✅ Syncing bulk changes

### Example
```typescript
// Batch multiple operations
collection.utils.writeBatch(() => {
  // Delete old items
  collection.utils.writeDelete(oldId);
  
  // Insert new items
  collection.utils.writeInsert(newItem);
  
  // Update existing items
  collection.utils.writeUpdate(updatedItem);
});
```

### Pros
- ✅ Atomic operations
- ✅ Efficient for bulk changes
- ✅ Single re-render

### Cons
- ❌ No schema validation
- ❌ No transaction tracking

---

## Common Patterns

### Pattern: Mark Notification as Read

```typescript
const handleMarkAsRead = async (id: number) => {
  // Get existing notification
  const notification = collection.get(id);
  if (!notification) return;

  // Optimistic update (bypasses validation)
  collection.utils.writeUpdate({
    ...notification,
    isRead: true,
    readAt: new Date().toISOString(),
  });

  // Sync with backend
  await api.markAsRead(id);
};
```

### Pattern: Toggle Todo Completion

```typescript
const handleToggle = async (id: number) => {
  // Use update() for validation
  const tx = collection.update(id, (draft) => {
    draft.completed = !draft.completed;
    draft.completedAt = draft.completed ? new Date().toISOString() : null;
  });

  await tx.isPersisted.promise;
};
```

### Pattern: Sync from WebSocket

```typescript
ws.on('update', (data) => {
  // Use writeBatch for multiple updates
  collection.utils.writeBatch(() => {
    data.updates.forEach(item => {
      collection.utils.writeUpdate(item);
    });
  });
});
```

### Pattern: Optimistic Create with Server ID

```typescript
const handleCreate = async (data) => {
  // Create with temporary ID
  const tempId = crypto.randomUUID();
  
  collection.insert({
    ...data,
    id: tempId,
  });

  try {
    // Get server-generated ID
    const serverItem = await api.create(data);
    
    // Replace temp with server data
    collection.utils.writeBatch(() => {
      collection.utils.writeDelete(tempId);
      collection.utils.writeInsert(serverItem);
    });
  } catch (error) {
    // Rollback happens automatically
    throw error;
  }
};
```

---

## Error Handling

### With `collection.update()`

```typescript
try {
  const tx = collection.update(id, (draft) => {
    draft.value = newValue;
  });
  
  await tx.isPersisted.promise;
  console.log('Update successful');
} catch (error) {
  if (error instanceof SchemaValidationError) {
    console.error('Validation failed:', error.issues);
  } else {
    console.error('Update failed:', error);
  }
}
```

### With `collection.utils.writeUpdate()`

```typescript
try {
  const item = collection.get(id);
  if (!item) {
    throw new Error('Item not found');
  }
  
  collection.utils.writeUpdate({
    ...item,
    value: newValue,
  });
  
  await api.update(id, { value: newValue });
} catch (error) {
  console.error('Update failed:', error);
  // Manual rollback if needed
  collection.utils.writeUpdate(item); // Restore original
}
```

---

## Decision Tree

```
Need to update an item?
│
├─ Complex logic or validation needed?
│  └─ YES → Use collection.update()
│
├─ Simple field update?
│  └─ YES → Use collection.utils.writeUpdate()
│
├─ Insert or update (don't know if exists)?
│  └─ YES → Use collection.utils.writeUpsert()
│
└─ Multiple operations at once?
   └─ YES → Use collection.utils.writeBatch()
```

---

## Best Practices

### ✅ DO

- **Check existence** before using `writeUpdate()`:
  ```typescript
  const item = collection.get(id);
  if (!item) return;
  ```

- **Spread existing object** to preserve all fields:
  ```typescript
  collection.utils.writeUpdate({
    ...item,
    fieldToUpdate: newValue,
  });
  ```

- **Use `update()` for complex logic**:
  ```typescript
  collection.update(id, (draft) => {
    draft.field1 = value1;
    draft.field2 = calculateValue(draft.field1);
  });
  ```

- **Use `writeBatch()` for multiple operations**:
  ```typescript
  collection.utils.writeBatch(() => {
    // Multiple operations here
  });
  ```

### ❌ DON'T

- **Don't use `writeUpdate()` without checking existence**:
  ```typescript
  // ❌ Bad: item might not exist
  collection.utils.writeUpdate({ id, value: newValue });
  ```

- **Don't use `update()` for simple field changes**:
  ```typescript
  // ❌ Overkill: use writeUpdate() instead
  collection.update(id, (draft) => {
    draft.isRead = true;
  });
  ```

- **Don't forget to spread existing object**:
  ```typescript
  // ❌ Bad: loses all other fields
  collection.utils.writeUpdate({ id, isRead: true });
  
  // ✅ Good: preserves all fields
  collection.utils.writeUpdate({ ...item, isRead: true });
  ```

---

## Performance Considerations

### `collection.update()`
- **Overhead**: Schema validation + transaction tracking
- **Use when**: Data integrity is critical
- **Performance**: Slower due to validation

### `collection.utils.writeUpdate()`
- **Overhead**: Minimal (direct cache write)
- **Use when**: Performance is critical
- **Performance**: Faster (no validation)

### `collection.utils.writeBatch()`
- **Overhead**: Single re-render for multiple operations
- **Use when**: Bulk updates needed
- **Performance**: Most efficient for bulk operations

---

## Summary

| Scenario | Method | Reason |
|----------|--------|--------|
| Mark notification as read | `writeUpdate()` | Simple field update, no validation needed |
| Toggle todo completion | `update()` | Need validation and transaction tracking |
| Sync from WebSocket | `writeBatch()` | Multiple updates at once |
| Create with temp ID | `writeBatch()` | Delete temp + insert server data |
| Update user profile | `update()` | Complex validation rules |
| Update last seen timestamp | `writeUpdate()` | Simple field, high frequency |

---

## Related Documentation

- **TanStack DB Collection**: https://tanstack.com/db/latest/docs/reference/interfaces/collection
- **Electric SQL Integration**: `ELECTRIC_REAL_TIME_NOTIFICATIONS.md`
- **Schema Validation Fix**: `NOTIFICATION_UPDATE_SCHEMA_VALIDATION_FIX.md`

---

**Remember**: Choose the right tool for the job. Use `update()` when you need validation and transaction tracking. Use `writeUpdate()` when you need speed and simplicity.

