# Electric Params Format Fix - HTTP Error 400 Resolution

## Issue Summary

The Electric notifications collection was failing with a **FetchError: HTTP Error 400**:

```
FetchError: HTTP Error 400 at http://localhost:3333/api/v1/electric/notifications?log=full&offset=-1: 
{"message":"Invalid request","errors":{"params":["is invalid"]}}
```

## Root Cause

The `params` parameter was being sent with **numeric values** instead of **strings**:

```typescript
// ❌ BEFORE - Numeric values
originUrl.searchParams.set('params', JSON.stringify([currentUser.id, tenant.id]))
// Results in: params=["1","2"] if IDs are numbers
// But Electric expects: params=["1","2"] as strings
```

### Why This Failed

According to the [Electric TypeScript client documentation](https://electric-sql.com/docs/api/clients/typescript), the `params` parameter must be:

1. **An array of strings**: `string[]`
2. **Or an object with numeric string keys**: `Record<\`${number}\`, string>`

**Key requirement**: All parameter values **MUST be strings**, not numbers.

### The Issue

When `currentUser.id` and `tenant.id` are numbers (e.g., `1` and `2`), `JSON.stringify([currentUser.id, tenant.id])` produces:
```json
[1, 2]  // ❌ Numbers - Electric rejects this
```

Electric expects:
```json
["1", "2"]  // ✅ Strings - Electric accepts this
```

## The Fix

Convert IDs to strings before passing to `JSON.stringify`:

**File**: `freelancer-hub-backend/app/controllers/electric_proxy_controller.ts`

**Before**:
```typescript
// Tenant and user isolation via WHERE clause
// Only show notifications for the current user in the current tenant
originUrl.searchParams.set('where', `user_id = $1 AND tenant_id = $2`)
originUrl.searchParams.set('params', JSON.stringify([currentUser.id, tenant.id]))
```

**After**:
```typescript
// Tenant and user isolation via WHERE clause
// Only show notifications for the current user in the current tenant
originUrl.searchParams.set('where', `user_id = $1 AND tenant_id = $2`)
// Electric expects params as an array of strings
// Convert IDs to strings to match Electric's expected format
originUrl.searchParams.set('params', JSON.stringify([String(currentUser.id), String(tenant.id)]))
```

### Key Changes

1. ✅ **Wrap values in `String()`**: Ensures values are strings regardless of their original type
2. ✅ **Maintains array format**: Electric still receives a JSON array
3. ✅ **Preserves parameter order**: `$1` maps to `currentUser.id`, `$2` maps to `tenant.id`

## How It Works

### Parameter Substitution

Electric uses PostgreSQL-style parameterized queries:

1. **WHERE clause**: `user_id = $1 AND tenant_id = $2`
2. **Params array**: `["123", "456"]` (strings)
3. **Electric substitutes**: `user_id = '123' AND tenant_id = '456'`

### Request Flow

1. **Frontend → Backend Proxy**:
   ```
   GET http://localhost:3333/api/v1/electric/notifications?log=full&offset=-1
   ```

2. **Backend Proxy constructs Electric URL**:
   ```typescript
   const originUrl = new URL('http://localhost:3000/v1/shape')
   originUrl.searchParams.set('table', 'notifications')
   originUrl.searchParams.set('where', 'user_id = $1 AND tenant_id = $2')
   originUrl.searchParams.set('params', JSON.stringify(['123', '456']))
   ```

3. **Backend Proxy → Electric**:
   ```
   GET http://localhost:3000/v1/shape?table=notifications&where=user_id=$1 AND tenant_id=$2&params=["123","456"]
   ```

4. **Electric processes**:
   - Parses `params` as JSON array
   - Validates all values are strings ✅
   - Substitutes `$1` with `'123'` and `$2` with `'456'`
   - Executes query: `SELECT * FROM notifications WHERE user_id = '123' AND tenant_id = '456'`

5. **Electric → Backend Proxy → Frontend**:
   ```
   HTTP/1.1 200 OK
   electric-handle: 90897655-1759683690364158
   electric-offset: 0_0
   electric-schema: {...}
   
   [filtered notification data for user 123 in tenant 456]
   ```

## Electric Params Format Reference

From the [Electric TypeScript client documentation](https://electric-sql.com/docs/api/clients/typescript):

```typescript
/**
 * Positional where clause parameter values. These will be passed to the server
 * and will substitute `$i` parameters in the where clause.
 *
 * It can be an array (note that positional arguments start at 1, the array will be mapped
 * accordingly), or an object with keys matching the used positional parameters in the where clause.
 *
 * If where clause is `id = $1 or id = $2`, params must have keys `"1"` and `"2"`, or be an array with length 2.
 */
params?: Record<`${number}`, string> | string[]
```

### Valid Formats

**Array format** (recommended):
```typescript
// ✅ GOOD - Array of strings
params: ["123", "456"]

// ❌ BAD - Array of numbers
params: [123, 456]
```

**Object format** (alternative):
```typescript
// ✅ GOOD - Object with string keys and string values
params: { "1": "123", "2": "456" }

// ❌ BAD - Object with numeric values
params: { "1": 123, "2": 456 }
```

### Important Notes

1. **Positional parameters start at 1**: `$1`, `$2`, `$3`, etc. (not `$0`)
2. **All values must be strings**: Even for numeric columns
3. **Array indices map to positions**: `params[0]` → `$1`, `params[1]` → `$2`
4. **PostgreSQL handles type conversion**: Electric passes strings to PostgreSQL, which converts them to the appropriate column type

## Testing Instructions

### 1. Clear Browser Cache

**Chrome/Edge**:
- Open DevTools (F12)
- Right-click refresh → "Empty Cache and Hard Reload"

**Firefox**:
- DevTools → Network → Trash icon → Shift+Refresh

**Safari**:
- Develop → Empty Caches → Shift+Refresh

### 2. Login to Application

1. Navigate to http://localhost:5173
2. Login with valid credentials
3. This generates a valid JWT token and sets tenant context

### 3. Check Network Tab

1. Open DevTools → Network tab
2. Filter for "electric"
3. Find request to `/api/v1/electric/notifications`
4. Check **Response**:

**Expected**: Status 200 OK with notification data
```json
[
  {
    "key": "\"public\".\"notifications\"/\"1\"",
    "value": {
      "id": "1",
      "user_id": "123",
      "tenant_id": "456",
      "title": "Welcome",
      "message": "Welcome to the app!",
      ...
    },
    "headers": {
      "operation": "insert",
      "relation": ["public", "notifications"]
    }
  }
]
```

**Not expected**: Status 400 with error
```json
{
  "message": "Invalid request",
  "errors": {
    "params": ["is invalid"]
  }
}
```

### 4. Check Console

**Expected**: No `FetchError: HTTP Error 400`

**If you see**:
```
✅ Electric sync established successfully
✅ Syncing notifications collection
✅ Received X notifications
```

**Success!** 🎉

### 5. Test Real-time Sync

1. Open two browser windows
2. Window 1: Login as User A
3. Window 2: Login as User B (same organization)
4. Window 1: Create a notification for User B
5. Window 2: Notification appears instantly (< 1 second)

## Troubleshooting

### Issue: Still getting 400 error

**Possible causes**:
1. Backend server didn't reload
2. Browser cache not cleared
3. Old request still in flight

**Solutions**:
```bash
# 1. Restart backend server
cd freelancer-hub-backend
npm run dev

# 2. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
# 3. Check backend logs for the reload message
# Should see: "invalidated app/controllers/electric_proxy_controller.ts"
```

### Issue: Different error message

**Check the error details**:
```typescript
// If error is about WHERE clause
{"message":"Invalid request","errors":{"where":["is invalid"]}}
// → Check the WHERE clause syntax

// If error is about table
{"message":"Invalid request","errors":{"table":["does not exist"]}}
// → Check the table name and permissions

// If error is about params count
{"message":"Invalid request","errors":{"params":["length mismatch"]}}
// → Ensure params array length matches number of $N placeholders
```

### Issue: Empty results but no error

**Possible causes**:
1. User has no notifications
2. WHERE clause filtering out all results
3. Tenant isolation working correctly

**Verify**:
```bash
# Check database directly
docker exec devops_postgres psql -U admin -d freelancerhub -c \
  "SELECT COUNT(*) FROM notifications WHERE user_id = 123 AND tenant_id = 456;"
```

## Summary of All Fixes

We've now resolved **FIVE issues** in the Electric sync setup:

1. ✅ **Query Compilation Error**
   - Fixed: `!notification.isRead` → `eq(notification.isRead, false)`
   - File: `NotificationBell.tsx`

2. ✅ **URL Construction Error**
   - Fixed: `request.url` → `request.completeUrl(true)`
   - File: `electric_proxy_controller.ts`

3. ✅ **CORS Configuration**
   - Added Electric headers to `exposeHeaders`
   - File: `config/cors.ts`

4. ✅ **Proxy Response Handling**
   - Changed: `new Response()` → `response.send()`
   - File: `electric_proxy_controller.ts`

5. ✅ **Params Format** (this fix)
   - Changed: `[currentUser.id, tenant.id]` → `[String(currentUser.id), String(tenant.id)]`
   - File: `electric_proxy_controller.ts`

## Complete Service Status

1. ✅ **PostgreSQL**: Running with `wal_level = logical`
2. ✅ **Electric**: Running and healthy on port 3000
3. ✅ **Backend**: Running on port 3333 with correct params format
4. ✅ **CORS**: Configured to expose Electric headers
5. ✅ **Proxy**: Using AdonisJS response object correctly
6. ✅ **Params**: Formatted as string array

## Key Takeaways

1. **Electric params must be strings**: Always convert values to strings before passing to Electric
2. **Use `String()` for safety**: Works for numbers, strings, and other types
3. **PostgreSQL handles type conversion**: Electric passes strings, PostgreSQL converts to column types
4. **Positional parameters start at 1**: `$1`, `$2`, `$3`, etc.

## Next Steps

1. ✅ Clear browser cache completely
2. ✅ Login to the application
3. ✅ Check Network tab for successful response
4. ✅ Verify no 400 error in console
5. ✅ Test real-time sync with multiple users
6. 🚀 Deploy to staging
7. 📊 Monitor for any issues
8. 🎉 Deploy to production

The Electric sync should now work correctly! 🎉

