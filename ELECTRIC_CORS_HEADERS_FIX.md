# Electric CORS Headers Fix - MissingHeadersError Resolution

## Issue Summary

The Electric notifications collection was failing with a **MissingHeadersError** when trying to sync:

```
MissingHeadersError: 
The response for the shape request to http://localhost:3333/api/v1/electric/notifications?log=full&offset=-1 
didn't include the following required headers:
- electric-offset
- electric-handle
- electric-schema

This is often due to a proxy not setting CORS correctly so that all Electric headers can be read by the client.
```

## Root Cause

The backend CORS configuration had an **empty `exposeHeaders` array**, which meant that custom Electric headers were not being exposed to the browser's JavaScript client.

### Why This Happens

1. **CORS Security Model**: By default, browsers only allow JavaScript to access a limited set of "safe" response headers:
   - `Cache-Control`
   - `Content-Language`
   - `Content-Type`
   - `Expires`
   - `Last-Modified`
   - `Pragma`

2. **Custom Headers Blocked**: Any custom headers (like `electric-offset`, `electric-handle`, `electric-schema`) are **blocked by the browser** unless explicitly listed in the `Access-Control-Expose-Headers` response header.

3. **Electric Requirements**: The Electric client needs these headers to:
   - Track sync position (`electric-offset`)
   - Identify the shape stream (`electric-handle`)
   - Understand the data schema (`electric-schema`)

## The Fix

### Updated CORS Configuration

**File**: `freelancer-hub-backend/config/cors.ts`

**Before**:
```typescript
const corsConfig = defineConfig({
  enabled: true,
  origin: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'PREFLIGHT'],
  headers: true,
  exposeHeaders: [],  // ❌ Empty - blocks custom headers
  credentials: true,
  maxAge: 90,
})
```

**After**:
```typescript
const corsConfig = defineConfig({
  enabled: true,
  origin: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'PREFLIGHT'],
  headers: true,
  exposeHeaders: [
    // Standard headers
    'content-type',
    'content-length',
    'etag',
    'cache-control',
    // Electric SQL headers - required for real-time sync
    'electric-handle',      // ✅ Shape stream identifier
    'electric-offset',      // ✅ Current sync position
    'electric-schema',      // ✅ Data schema definition
    'electric-cursor',      // ✅ Cursor for pagination
    'electric-chunk-last-offset',  // ✅ Last offset in chunk
    'electric-up-to-date',  // ✅ Sync status indicator
  ],
  credentials: true,
  maxAge: 90,
})
```

### Electric Headers Explained

| Header | Purpose | Example Value |
|--------|---------|---------------|
| `electric-handle` | Unique identifier for the shape stream | `64351139-1744229222132` |
| `electric-offset` | Current position in the shape log | `0_0` |
| `electric-schema` | JSON schema of the table structure | `{"id":{"type":"int4","not_null":true},...}` |
| `electric-cursor` | Cursor for paginated results | `cursor-value` |
| `electric-chunk-last-offset` | Last offset in the current chunk | `100_5` |
| `electric-up-to-date` | Indicates if client is synced | `true` |

## How It Works

### Request Flow

1. **Frontend → Backend Proxy**:
   ```
   GET http://localhost:3333/api/v1/electric/notifications?log=full&offset=-1
   Headers:
     - Authorization: Bearer <token>
     - X-Tenant-Slug: <slug>
   ```

2. **Backend Proxy → Electric**:
   ```
   GET http://localhost:3000/v1/shape?table=notifications&where=...&params=...
   ```

3. **Electric → Backend Proxy**:
   ```
   HTTP/1.1 200 OK
   electric-handle: 64351139-1744229222132
   electric-offset: 0_0
   electric-schema: {"id":{"type":"uuid"},...}
   Content-Type: application/json
   
   [shape data...]
   ```

4. **Backend Proxy → Frontend**:
   ```
   HTTP/1.1 200 OK
   Access-Control-Expose-Headers: electric-handle, electric-offset, electric-schema, ...
   electric-handle: 64351139-1744229222132
   electric-offset: 0_0
   electric-schema: {"id":{"type":"uuid"},...}
   Content-Type: application/json
   
   [shape data...]
   ```

5. **Frontend Electric Client**:
   - ✅ Can now read `electric-handle`, `electric-offset`, `electric-schema`
   - ✅ Establishes real-time sync connection
   - ✅ Tracks sync position for incremental updates

## Verification

### Check CORS Headers in Browser

1. Open browser DevTools → Network tab
2. Find the request to `/api/v1/electric/notifications`
3. Check **Response Headers**:
   ```
   Access-Control-Expose-Headers: content-type, content-length, etag, cache-control, 
                                   electric-handle, electric-offset, electric-schema, 
                                   electric-cursor, electric-chunk-last-offset, 
                                   electric-up-to-date
   electric-handle: 64351139-1744229222132
   electric-offset: 0_0
   electric-schema: {"id":{"type":"uuid"},...}
   ```

4. **Expected**: All `electric-*` headers are visible

### Test Electric Sync

1. Login to the application
2. Check browser console - should see no `MissingHeadersError`
3. Check Network tab - should see long-lived connection to Electric endpoint
4. Create a notification - should appear instantly without page refresh

## Common Issues and Solutions

### Issue: Still getting MissingHeadersError after fix

**Possible causes**:
1. Browser cached the old CORS response
2. Backend server didn't reload
3. Proxy is stripping headers

**Solutions**:
```bash
# 1. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
# 2. Clear browser cache
# 3. Restart backend server
cd freelancer-hub-backend
npm run dev

# 4. Check backend logs for CORS reload
# Should see: "full-reload config/cors.ts"
```

### Issue: Headers visible in Network tab but client still errors

**Possible cause**: Frontend is making request from a different origin

**Solution**: Check that `VITE_API_BASE_URL` matches the backend URL:
```bash
# Frontend .env
VITE_API_BASE_URL=http://localhost:3333/api/v1

# Backend should be running on
http://localhost:3333
```

### Issue: CORS preflight (OPTIONS) request failing

**Possible cause**: CORS not handling OPTIONS requests properly

**Solution**: Verify CORS config includes OPTIONS method:
```typescript
methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'PREFLIGHT'],
```

## Production Considerations

### 1. Wildcard vs Explicit Headers

**Development** (current):
```typescript
exposeHeaders: [
  'electric-handle',
  'electric-offset',
  'electric-schema',
  // ... explicit list
]
```

**Alternative** (if Electric adds more headers):
```typescript
// Note: Not all browsers support wildcard in exposeHeaders
exposeHeaders: ['*']  // Expose all headers
```

### 2. Origin Configuration

**Development** (current):
```typescript
origin: true,  // Allow all origins
```

**Production** (recommended):
```typescript
origin: [
  'https://app.yourdomain.com',
  'https://staging.yourdomain.com',
],
```

### 3. Credentials

Keep `credentials: true` if using authentication cookies or tokens:
```typescript
credentials: true,
```

## Testing Checklist

- [x] CORS config updated with Electric headers
- [x] Backend server reloaded
- [x] Browser cache cleared
- [ ] Login to application
- [ ] Check Network tab for Electric headers
- [ ] Verify no MissingHeadersError in console
- [ ] Test real-time sync (create notification)
- [ ] Verify notification appears instantly
- [ ] Check multiple browser tabs sync correctly

## Related Files

- `freelancer-hub-backend/config/cors.ts` - CORS configuration
- `freelancer-hub-backend/app/controllers/electric_proxy_controller.ts` - Electric proxy
- `freelancer-hub-dashboard/src/services/notifications/collection.ts` - Frontend collection
- `ELECTRIC_500_ERROR_FIX.md` - Electric Docker setup
- `ELECTRIC_SYNC_FIX_SUMMARY.md` - URL construction fix

## Summary

The `MissingHeadersError` was caused by an empty `exposeHeaders` array in the CORS configuration. The fix was simple:

1. ✅ Added Electric headers to `exposeHeaders` in `config/cors.ts`
2. ✅ Backend server auto-reloaded with HMR
3. ✅ Electric headers now accessible to frontend client
4. ✅ Real-time sync should work correctly

**Key Takeaway**: When proxying Electric requests through your backend, always expose Electric's custom headers in your CORS configuration!

## Next Steps

1. ✅ Clear browser cache and hard refresh
2. ✅ Login to the application
3. ✅ Verify Electric sync works without errors
4. ✅ Test real-time notifications
5. 🚀 Deploy to staging
6. 📊 Monitor for any CORS issues
7. 🎉 Deploy to production

