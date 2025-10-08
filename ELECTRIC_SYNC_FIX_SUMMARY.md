# Electric Sync URL Construction Fix

## Issue Summary

The Electric notifications collection was failing to sync with the error:
```
TypeError: Failed to construct 'URL': Invalid URL
```

This occurred because the `shapeOptions.url` was configured with a **relative URL** (`/api/v1/electric/notifications`), but Electric's internal URL construction requires an **absolute URL**.

## Root Causes Identified

### 1. **Relative URL in shapeOptions**
**Problem**: The collection configuration used a relative URL:
```typescript
shapeOptions: {
  url: `/api/v1/electric/notifications`,  // ❌ Relative URL
}
```

**Why it failed**: When Electric tries to construct a `URL` object from a relative path without a base URL, it throws `TypeError: Failed to construct 'URL': Invalid URL`.

### 2. **Missing ELECTRIC_URL in Backend Environment**
**Problem**: The backend `.env` file was missing the `ELECTRIC_URL` configuration.

**Impact**: The Electric proxy controller would fall back to the default URL, but this wasn't documented or validated.

### 3. **No Error Handler**
**Problem**: The collection had no `onError` handler in `shapeOptions`.

**Impact**: Errors were logged generically without context, making debugging difficult.

## Fixes Applied

### 1. ✅ Fixed URL Construction in Collection
**File**: `freelancer-hub-dashboard/src/services/notifications/collection.ts`

**Changes**:
```typescript
// Get the base URL from environment or construct from window.location
const baseUrl =
  import.meta.env.VITE_API_BASE_URL || `${window.location.origin}/api/v1`;

return createCollection(
  electricCollectionOptions({
    id: "notifications",
    schema: notificationSchema,
    getKey: (row) => row.id,
    shapeOptions: {
      // Must be an absolute URL for Electric to work properly
      url: `${baseUrl}/electric/notifications`,  // ✅ Absolute URL
      fetchClient: async (input, init) => {
        const headers = new Headers(init?.headers);
        headers.set("Authorization", `Bearer ${token}`);
        headers.set("X-Tenant-Slug", tenantSlug);
        return fetch(input, { ...init, headers });
      },
      parser: {
        timestamptz: (date: string) => date,
      },
      // Add error handler for better debugging
      onError: (error) => {
        console.error("Electric sync error for notifications collection:", error);
        console.error("URL:", `${baseUrl}/electric/notifications`);
        console.error("Token present:", !!token);
        console.error("Tenant slug:", tenantSlug);
      },
    },
    // ... rest of configuration
  })
);
```

**Key improvements**:
- ✅ Constructs absolute URL using `VITE_API_BASE_URL` from environment
- ✅ Falls back to `window.location.origin` if env var not set
- ✅ Adds comprehensive error handler with debugging context
- ✅ Maintains authentication headers in `fetchClient`

### 2. ✅ Added Electric Configuration to Backend
**File**: `freelancer-hub-backend/.env`

**Added**:
```env
# Electric SQL Configuration
# For local development with Docker: http://localhost:3000/v1/shape
# For Electric Cloud: https://api.electric-sql.cloud/v1/shape
ELECTRIC_URL=http://localhost:3000/v1/shape
# ELECTRIC_SOURCE_ID=your-source-id  # Optional for local dev
# ELECTRIC_SOURCE_SECRET=your-source-secret  # Optional for local dev
```

### 3. ✅ Updated Environment Schema Validation
**File**: `freelancer-hub-backend/start/env.ts`

**Added**:
```typescript
/*
|----------------------------------------------------------
| Variables for configuring Electric SQL
|----------------------------------------------------------
*/
ELECTRIC_URL: Env.schema.string.optional(),
ELECTRIC_SOURCE_ID: Env.schema.string.optional(),
ELECTRIC_SOURCE_SECRET: Env.schema.string.optional(),
```

### 4. ✅ Updated .env.example
**File**: `freelancer-hub-backend/.env.example`

**Added documentation** for Electric configuration variables.

## How It Works Now

### URL Construction Flow

1. **Frontend Collection Initialization**:
   ```
   VITE_API_BASE_URL (http://localhost:3333/api/v1)
   + /electric/notifications
   = http://localhost:3333/api/v1/electric/notifications
   ```

2. **Backend Proxy Route**:
   ```
   GET /api/v1/electric/notifications
   → ElectricProxyController.notifications()
   ```

3. **Backend Proxies to Electric**:
   ```
   ELECTRIC_URL (http://localhost:3000/v1/shape)
   + ?table=notifications
   + &where=user_id=$1 AND tenant_id=$2
   + &params=[userId, tenantId]
   = http://localhost:3000/v1/shape?table=notifications&where=...
   ```

4. **Electric Returns Shape Stream**:
   - Long-lived HTTP connection
   - Streams real-time updates
   - Frontend receives and processes changes

## Testing Instructions

### Prerequisites

1. **PostgreSQL with Logical Replication**:
   ```bash
   # Check wal_level
   psql -U admin -d freelancerhub -c "SHOW wal_level;"
   # Should output: logical
   ```

2. **Electric Running with Docker**:
   ```bash
   docker run -d \
     --name electric \
     -p 3000:3000 \
     -e DATABASE_URL="postgresql://admin:admin@host.docker.internal:5432/freelancerhub" \
     electricsql/electric:latest
   
   # Verify it's running
   docker ps | grep electric
   curl http://localhost:3000/v1/shape/notifications
   ```

3. **Backend Running**:
   ```bash
   cd freelancer-hub-backend
   npm run dev
   # Should start on http://localhost:3333
   ```

4. **Frontend Running**:
   ```bash
   cd freelancer-hub-dashboard
   npm run dev
   # Should start on http://localhost:5173
   ```

### Test 1: Verify URL Construction

1. Open browser DevTools → Console
2. Login to the application
3. Check console for any Electric sync errors
4. If error occurs, the `onError` handler will log:
   - The error details
   - The constructed URL
   - Token presence
   - Tenant slug

**Expected**: No errors, URL should be `http://localhost:3333/api/v1/electric/notifications`

### Test 2: Verify Backend Proxy

1. Open browser DevTools → Network tab
2. Filter for "electric"
3. Look for request to `/api/v1/electric/notifications`
4. Check request status:
   - Should be "pending" (long-lived connection)
   - Status: 200 OK
   - Headers should include `Authorization` and `X-Tenant-Slug`

**Expected**: Long-lived connection established successfully

### Test 3: Verify Real-time Sync

1. Open two browser windows
2. Window 1: Login as User A
3. Window 2: Login as User B (same organization)
4. Window 1: Create a notification for User B (e.g., invite to project)
5. Window 2: **Notification should appear instantly** (< 1 second)
6. Window 2: Badge count should update immediately
7. Window 2: Click notification → mark as read
8. Window 2: Badge count should decrease instantly

**Expected**: All updates happen in real-time without page refresh

### Test 4: Verify Error Handling

1. Stop Electric Docker container:
   ```bash
   docker stop electric
   ```
2. Refresh the application
3. Check console for error messages
4. The `onError` handler should log detailed debugging info

**Expected**: Clear error messages with context

## Troubleshooting

### Issue: "Failed to construct 'URL': Invalid URL"

**Cause**: URL is still relative or malformed

**Fix**:
1. Check `VITE_API_BASE_URL` in `freelancer-hub-dashboard/.env`
2. Should be: `http://localhost:3333/api/v1`
3. Restart frontend dev server

### Issue: "Electric proxy error" in backend logs

**Cause**: Electric service not running or `ELECTRIC_URL` misconfigured

**Fix**:
1. Check Electric Docker container: `docker ps | grep electric`
2. Check `ELECTRIC_URL` in `freelancer-hub-backend/.env`
3. Should be: `http://localhost:3000/v1/shape`
4. Restart backend server

### Issue: Notifications not appearing in real-time

**Cause**: PostgreSQL logical replication not enabled

**Fix**:
1. Check `wal_level`: `psql -U admin -d freelancerhub -c "SHOW wal_level;"`
2. If not "logical", edit `postgresql.conf`:
   ```conf
   wal_level = logical
   max_replication_slots = 10
   max_wal_senders = 10
   ```
3. Restart PostgreSQL

### Issue: "User is not authorized" error

**Cause**: Authentication headers not being sent

**Fix**:
1. Check browser DevTools → Network → Request Headers
2. Should include `Authorization: Bearer <token>`
3. Should include `X-Tenant-Slug: <slug>`
4. If missing, check token in localStorage

## Next Steps

1. ✅ Verify all tests pass
2. ✅ Monitor console for any errors
3. ✅ Test with multiple users
4. ✅ Test offline/online scenarios
5. 🚀 Deploy to staging
6. 📊 Monitor performance
7. 🎉 Deploy to production

## Related Documentation

- `ELECTRIC_SETUP_GUIDE.md` - Complete Electric setup instructions
- `ELECTRIC_REAL_TIME_NOTIFICATIONS.md` - Implementation details
- `QUICK_START_ELECTRIC.md` - Quick start guide
- `PHASE_1_COMPLETE_SUMMARY.md` - Phase 1 implementation summary

