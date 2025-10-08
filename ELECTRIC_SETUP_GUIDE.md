# ElectricSQL Setup Guide

## Quick Start (5 minutes)

This guide will help you set up ElectricSQL for real-time notifications.

---

## Prerequisites

- ✅ PostgreSQL 12+ installed
- ✅ Backend and frontend code updated (already done!)
- ✅ Access to PostgreSQL configuration

---

## Step 1: Enable PostgreSQL Logical Replication

### Check Current Configuration

```bash
# Connect to PostgreSQL
psql -U your_user -d your_database

# Check wal_level
SHOW wal_level;
```

**Expected**: `logical`  
**If not**: Continue to next step

### Update PostgreSQL Configuration

**Find your `postgresql.conf` file**:

```bash
# macOS (Homebrew)
/opt/homebrew/var/postgresql@14/postgresql.conf

# macOS (Postgres.app)
~/Library/Application Support/Postgres/var-14/postgresql.conf

# Linux
/etc/postgresql/14/main/postgresql.conf

# Docker
docker exec -it postgres_container cat /var/lib/postgresql/data/postgresql.conf
```

**Edit the file** and add/update:

```conf
# Replication
wal_level = logical
max_replication_slots = 10
max_wal_senders = 10
```

**Restart PostgreSQL**:

```bash
# macOS (Homebrew)
brew services restart postgresql@14

# macOS (Postgres.app)
# Use Postgres.app GUI to restart

# Linux
sudo systemctl restart postgresql

# Docker
docker restart postgres_container
```

**Verify**:

```bash
psql -U your_user -d your_database -c "SHOW wal_level;"
```

Should output: `logical`

---

## Step 2: Set Up Electric Sync Service

### Option A: Electric Cloud (Recommended for Production)

**1. Sign up**: https://console.electric-sql.com/

**2. Create a new project**

**3. Get your credentials**:
- Electric URL: `https://api.electric-sql.cloud/v1/shape`
- Source ID: `your-source-id`
- Source Secret: `your-source-secret`

**4. Add to backend `.env`**:

```env
ELECTRIC_URL=https://api.electric-sql.cloud/v1/shape
ELECTRIC_SOURCE_ID=your-source-id
ELECTRIC_SOURCE_SECRET=your-source-secret
```

### Option B: Self-Hosted (Development)

**1. Run Electric with Docker**:

```bash
docker run -d \
  --name electric \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/database" \
  electricsql/electric:latest
```

**2. Add to backend `.env`**:

```env
ELECTRIC_URL=http://localhost:3000/v1/shape
# No SOURCE_ID or SOURCE_SECRET needed for local dev
```

**3. Verify Electric is running**:

```bash
curl http://localhost:3000/v1/shape/notifications
```

Should return Electric shape data (or auth error if not configured).

---

## Step 3: Update Environment Variables

### Backend `.env`

Add these variables to `freelancer-hub-backend/.env`:

```env
# Electric Configuration
ELECTRIC_URL=http://localhost:3000/v1/shape
ELECTRIC_SOURCE_ID=your-source-id  # Optional for local dev
ELECTRIC_SOURCE_SECRET=your-source-secret  # Optional for local dev
```

### Frontend

No changes needed! Frontend proxies through backend.

---

## Step 4: Restart Services

```bash
# Terminal 1: Backend
cd freelancer-hub-backend
npm run dev

# Terminal 2: Frontend
cd freelancer-hub-dashboard
npm run dev
```

---

## Step 5: Test Real-time Sync

### Test 1: Single User

1. Login to the app
2. Open browser DevTools → Network tab
3. Filter for "electric"
4. You should see a long-lived connection to `/api/v1/electric/notifications`
5. Invite yourself to a project (from another account)
6. **Notification should appear INSTANTLY** (no 30-second delay!)

### Test 2: Multi-User

1. Open 2 browser windows (or use incognito)
2. Window 1: Login as Admin
3. Window 2: Login as Member
4. Window 1: Invite Member to a project
5. Window 2: **Notification appears instantly!**
6. Window 2: Click notification → marks as read
7. Window 2: Badge count updates immediately

### Test 3: Offline/Online

1. Open app, see notifications
2. Open DevTools → Network tab → Set to "Offline"
3. Mark a notification as read (should work optimistically)
4. Set back to "Online"
5. Electric syncs changes
6. Notification stays marked as read (no flicker)

---

## Troubleshooting

### Issue: "Failed to initialize notification collection"

**Cause**: Missing auth token or tenant slug

**Fix**:
```typescript
// Check localStorage
console.log(localStorage.getItem('token'))
console.log(localStorage.getItem('tenantSlug'))
```

If missing, login again.

---

### Issue: Electric connection fails

**Check**:

```bash
# Test Electric endpoint directly
curl http://localhost:3000/v1/shape/notifications

# Test through backend proxy
curl http://localhost:58480/api/v1/electric/notifications \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-Slug: YOUR_TENANT"
```

**Expected**: JSON response with shape data

**If fails**:
1. Check Electric service is running
2. Check DATABASE_URL is correct
3. Check PostgreSQL logical replication is enabled
4. Check backend .env has ELECTRIC_URL

---

### Issue: Notifications not appearing in real-time

**Debug**:

1. **Check Electric connection**:
   - Open DevTools → Network tab
   - Look for `/api/v1/electric/notifications` request
   - Should be "pending" (long-lived connection)

2. **Check PostgreSQL**:
   ```sql
   -- Check replication slots
   SELECT * FROM pg_replication_slots;
   
   -- Should see Electric's slot
   ```

3. **Check backend logs**:
   ```bash
   # Look for Electric proxy errors
   cd freelancer-hub-backend
   npm run dev
   ```

4. **Check frontend console**:
   - Open DevTools → Console
   - Look for Electric errors

---

### Issue: "User is not authorized" error

**Cause**: Electric proxy not receiving auth headers

**Fix**: Check `collection.ts`:

```typescript
fetchClient: async (input, init) => {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);  // ← Must be set
  headers.set("X-Tenant-Slug", tenantSlug);         // ← Must be set
  return fetch(input, { ...init, headers });
}
```

---

### Issue: Seeing notifications from other tenants

**Cause**: Backend proxy WHERE clause not working

**Fix**: Check `electric_proxy_controller.ts`:

```typescript
url.searchParams.set('where', `user_id = $1 AND tenant_id = $2`)
url.searchParams.set('params', JSON.stringify([currentUser.id, tenant.id]))
```

---

## Verification Checklist

- [ ] PostgreSQL `wal_level = logical`
- [ ] Electric service running (Cloud or Docker)
- [ ] Backend `.env` has `ELECTRIC_URL`
- [ ] Backend server running without errors
- [ ] Frontend server running without errors
- [ ] Can login to app
- [ ] DevTools shows Electric connection
- [ ] Notifications appear instantly (< 1 second)
- [ ] Badge count updates in real-time
- [ ] Mark as read works optimistically
- [ ] Multi-user sync works

---

## Performance Monitoring

### Check Electric Connection

```javascript
// In browser console
performance.getEntriesByType('resource')
  .filter(r => r.name.includes('electric'))
  .forEach(r => console.log(r.name, r.duration))
```

### Check Live Query Performance

```javascript
// In NotificationBell.tsx
const { data, isLoading, error } = useLiveQuery(...)

console.log('Notifications:', data.length)
console.log('Loading:', isLoading)
console.log('Error:', error)
```

---

## Production Deployment

### Checklist

- [ ] Use Electric Cloud (not self-hosted)
- [ ] Set `ELECTRIC_SOURCE_SECRET` in backend env (never in frontend!)
- [ ] Use HTTPS for Electric URL
- [ ] Enable CORS on Electric endpoint
- [ ] Set up monitoring for Electric connection
- [ ] Test with production database
- [ ] Load test with multiple users
- [ ] Set up alerts for Electric downtime

### Environment Variables

```env
# Production backend .env
ELECTRIC_URL=https://api.electric-sql.cloud/v1/shape
ELECTRIC_SOURCE_ID=prod-source-id
ELECTRIC_SOURCE_SECRET=prod-source-secret  # Keep secret!
```

---

## Next Steps

1. ✅ Complete this setup
2. ✅ Test real-time notifications
3. ✅ Verify multi-user sync
4. ✅ Test offline/online scenarios
5. 🚀 Deploy to staging
6. 📊 Monitor performance
7. 🎉 Deploy to production

---

## Resources

- **ElectricSQL Docs**: https://electric-sql.com/docs
- **TanStack DB Docs**: https://tanstack.com/db/latest/docs
- **PostgreSQL Logical Replication**: https://www.postgresql.org/docs/current/logical-replication.html
- **Implementation Guide**: See `ELECTRIC_REAL_TIME_NOTIFICATIONS.md`

---

**Need help?** Check the troubleshooting section or open an issue.

