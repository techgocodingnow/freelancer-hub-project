# Electric 500 Error Fix - Root Cause Analysis

## Issue Summary

The Electric notifications collection was failing with a **500 Internal Server Error** when trying to sync:

```
GET http://localhost:3333/api/v1/electric/notifications?log=full&offset=-1 
500 (Internal Server Error)
```

## Root Cause

**Electric Docker container was not running!**

When the backend Electric proxy controller tried to fetch from Electric at `http://localhost:3000/v1/shape`, it couldn't connect because the Electric service wasn't running, resulting in a 500 error.

## Investigation Steps

### 1. ✅ Backend Server Status
```bash
# Backend was running on correct port
http://localhost:3333 ✅
```

### 2. ❌ Electric Docker Container Status
```bash
docker ps | grep electric
# Result: No containers running ❌
```

### 3. ✅ PostgreSQL Status
```bash
docker ps | grep postgres
# Result: devops_postgres running ✅

docker exec devops_postgres psql -U admin -d freelancerhub -c "SHOW wal_level;"
# Result: logical ✅
```

### 4. ❌ Electric Container Start Attempt #1
```bash
docker run -d --name electric -p 3000:3000 \
  -e DATABASE_URL="postgresql://admin:admin@host.docker.internal:5432/freelancerhub" \
  electricsql/electric:latest

# Result: Container exited with error code 1 ❌
```

**Error from logs**:
```
ERROR! Config provider Config.Reader failed with:
** (RuntimeError) You must set ELECTRIC_SECRET unless ELECTRIC_INSECURE=true. 
Setting ELECTRIC_INSECURE=true risks exposing your database, 
only use insecure mode in development or you've otherwise secured the Electric API
```

### 5. ✅ Electric Container Start Attempt #2 (Fixed)
```bash
docker run -d --name electric -p 3000:3000 \
  -e DATABASE_URL="postgresql://admin:admin@host.docker.internal:5432/freelancerhub" \
  -e ELECTRIC_INSECURE=true \
  electricsql/electric:latest

# Result: Container running and healthy ✅
```

## The Fix

### Step 1: Start Electric with Insecure Mode (Development Only)

```bash
# Remove old container if exists
docker rm -f electric

# Start Electric with ELECTRIC_INSECURE=true for development
docker run -d \
  --name electric \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://admin:admin@host.docker.internal:5432/freelancerhub" \
  -e ELECTRIC_INSECURE=true \
  electricsql/electric:latest

# Verify it's running
docker ps | grep electric
# Should show: Up X seconds (healthy)
```

### Step 2: Verify Electric is Accessible

```bash
# Test Electric endpoint
curl http://localhost:3000/v1/shape/notifications
# Should return: "Not found" (expected without proper params)
```

### Step 3: Test Backend Proxy (with valid auth token)

The backend proxy requires authentication. You need a valid JWT token from logging into the application.

```bash
# Get a valid token by logging into the frontend
# Then test the proxy endpoint:
curl -H "Authorization: Bearer YOUR_VALID_TOKEN" \
     -H "X-Tenant-Slug: YOUR_TENANT_SLUG" \
     "http://localhost:3333/api/v1/electric/notifications?log=full&offset=-1"
```

## Complete Setup Checklist

### Prerequisites

- [x] PostgreSQL running with `wal_level = logical`
- [x] Backend `.env` has `ELECTRIC_URL=http://localhost:3000/v1/shape`
- [x] Frontend `.env` has `VITE_API_BASE_URL=http://localhost:3333/api/v1`

### Services Running

1. **PostgreSQL** (Docker):
   ```bash
   docker ps | grep postgres
   # Should show: devops_postgres running
   ```

2. **Electric** (Docker):
   ```bash
   docker ps | grep electric
   # Should show: electric running (healthy)
   ```

3. **Backend** (Node.js):
   ```bash
   cd freelancer-hub-backend
   npm run dev
   # Should show: Server address: http://localhost:3333
   ```

4. **Frontend** (Vite):
   ```bash
   cd freelancer-hub-dashboard
   npm run dev
   # Should show: Local: http://localhost:5173
   ```

## Quick Start Script

Create a file `start-electric.sh`:

```bash
#!/bin/bash

# Stop and remove old Electric container
docker rm -f electric 2>/dev/null

# Start Electric with insecure mode for development
docker run -d \
  --name electric \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://admin:admin@host.docker.internal:5432/freelancerhub" \
  -e ELECTRIC_INSECURE=true \
  electricsql/electric:latest

# Wait for container to be healthy
echo "Waiting for Electric to be healthy..."
sleep 3

# Check status
if docker ps | grep -q "electric.*healthy"; then
  echo "✅ Electric is running and healthy!"
  echo "   URL: http://localhost:3000/v1/shape"
else
  echo "❌ Electric failed to start. Check logs:"
  docker logs electric
  exit 1
fi
```

Make it executable:
```bash
chmod +x start-electric.sh
./start-electric.sh
```

## Testing the Fix

### Test 1: Verify Electric is Running

```bash
docker ps | grep electric
```

**Expected**: Container status shows "Up X seconds (healthy)"

### Test 2: Verify Backend Can Connect to Electric

1. Login to the frontend application
2. Open browser DevTools → Network tab
3. Look for request to `/api/v1/electric/notifications`
4. Should see status: 200 OK (pending - long-lived connection)

### Test 3: Verify Real-time Sync Works

1. Open two browser windows
2. Window 1: Login as User A
3. Window 2: Login as User B (same organization)
4. Window 1: Create a notification for User B
5. Window 2: Notification appears instantly (< 1 second)

## Troubleshooting

### Issue: Electric container exits immediately

**Check logs**:
```bash
docker logs electric
```

**Common causes**:
1. Missing `ELECTRIC_INSECURE=true` for development
2. Invalid `DATABASE_URL`
3. PostgreSQL not accessible from Docker

**Fix**:
```bash
# Ensure ELECTRIC_INSECURE=true is set
docker run -d --name electric -p 3000:3000 \
  -e DATABASE_URL="postgresql://admin:admin@host.docker.internal:5432/freelancerhub" \
  -e ELECTRIC_INSECURE=true \
  electricsql/electric:latest
```

### Issue: Backend returns 500 error

**Possible causes**:
1. Electric not running
2. Electric URL misconfigured in backend `.env`
3. Database connection issues

**Check**:
```bash
# 1. Verify Electric is running
docker ps | grep electric

# 2. Check backend .env
cat freelancer-hub-backend/.env | grep ELECTRIC_URL
# Should show: ELECTRIC_URL=http://localhost:3000/v1/shape

# 3. Test Electric directly
curl http://localhost:3000/v1/shape/notifications
```

### Issue: Frontend gets 401 Unauthorized

**Cause**: Authentication token expired or invalid

**Fix**:
1. Logout and login again
2. Check browser console for auth errors
3. Verify token in localStorage

### Issue: PostgreSQL wal_level not logical

**Check**:
```bash
docker exec devops_postgres psql -U admin -d freelancerhub -c "SHOW wal_level;"
```

**If not "logical", fix**:
```bash
# Edit postgresql.conf in the container
docker exec -it devops_postgres bash
# Inside container:
echo "wal_level = logical" >> /var/lib/postgresql/data/postgresql.conf
echo "max_replication_slots = 10" >> /var/lib/postgresql/data/postgresql.conf
echo "max_wal_senders = 10" >> /var/lib/postgresql/data/postgresql.conf
exit

# Restart PostgreSQL container
docker restart devops_postgres
```

## Production Considerations

⚠️ **IMPORTANT**: `ELECTRIC_INSECURE=true` is **ONLY for development**!

For production, you must:

1. **Set ELECTRIC_SECRET**:
   ```bash
   docker run -d --name electric -p 3000:3000 \
     -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
     -e ELECTRIC_SECRET="your-secure-random-secret" \
     electricsql/electric:latest
   ```

2. **Use Electric Cloud** (recommended):
   - Sign up at https://console.electric-sql.com/
   - Get your credentials
   - Update backend `.env`:
     ```env
     ELECTRIC_URL=https://api.electric-sql.com/v1/shape
     ELECTRIC_SOURCE_ID=your-source-id
     ELECTRIC_SOURCE_SECRET=your-source-secret
     ```

3. **Secure the Electric API**:
   - Use HTTPS
   - Enable authentication
   - Set up proper firewall rules
   - Monitor for unauthorized access

## Summary

The 500 error was caused by **Electric not running**. The fix is simple:

1. ✅ Start Electric Docker container with `ELECTRIC_INSECURE=true` for development
2. ✅ Verify it's running and healthy
3. ✅ Test the backend proxy endpoint
4. ✅ Verify real-time sync works in the frontend

**Key Takeaway**: Always ensure Electric is running before starting the backend server!

## Related Documentation

- `ELECTRIC_SETUP_GUIDE.md` - Complete Electric setup guide
- `ELECTRIC_SYNC_FIX_SUMMARY.md` - URL construction fix
- `QUICK_START_ELECTRIC.md` - Quick start guide
- `PHASE_1_COMPLETE_SUMMARY.md` - Implementation summary

