# Task Assignment Notifications - Testing Guide

## Quick Start Testing

### Prerequisites

1. ✅ Backend running: `cd freelancer-hub-backend && npm run dev`
2. ✅ Frontend running: `cd freelancer-hub-dashboard && npm run dev`
3. ✅ PostgreSQL running with `wal_level = logical`
4. ✅ Electric running: `docker ps | grep electric`
5. ✅ Two test users in the same tenant

### Test Scenario 1: Assign Task to Another User

**Expected**: User receives notification instantly

**Steps**:

1. **Open two browser windows**:
   - Window A: http://localhost:5173 (login as User A)
   - Window B: http://localhost:5173 (login as User B, same tenant)

2. **Window A: Create and assign task**:
   - Navigate to a project
   - Click "New Task" or "Add Task"
   - Fill in task details:
     - Title: "Test Notification Task"
     - Assignee: Select User B
   - Click "Create"

3. **Window B: Check notification**:
   - Look at NotificationBell in top-right corner
   - Badge should show "1" (or increment by 1)
   - **This should happen within 1 second!**

4. **Window B: View notification**:
   - Click the bell icon
   - Notification drawer opens
   - Should see notification:
     - Title: "You've been assigned to a task"
     - Message: "User A assigned you to 'Test Notification Task' in [Project Name]"
     - Action button: "View Task"

5. **Window B: Click "View Task"**:
   - Should navigate to the task detail page
   - Task should be displayed correctly

**✅ Success Criteria**:
- Notification appears within 1 second
- Notification has correct title and message
- Action button navigates to correct task
- Notification is marked as unread (bold text)

---

### Test Scenario 2: Reassign Task to Different User

**Expected**: New assignee gets notification, old assignee doesn't

**Steps**:

1. **Setup**: Task is currently assigned to User B

2. **Window A: Reassign task**:
   - Open the task (currently assigned to User B)
   - Change assignee to User C
   - Save changes

3. **Window C (User C): Check notification**:
   - Should see new notification
   - Badge increments

4. **Window B (User B): Check notification**:
   - Should NOT see a new notification
   - Badge does not change

**✅ Success Criteria**:
- Only the new assignee (User C) receives notification
- Previous assignee (User B) does NOT receive notification

---

### Test Scenario 3: Self-Assignment (No Notification)

**Expected**: No notification when assigning to yourself

**Steps**:

1. **Window A: Assign task to yourself**:
   - Create a new task
   - Set assignee to yourself (User A)
   - Save

2. **Window A: Check notification**:
   - Should NOT see a new notification
   - Badge does not change

**✅ Success Criteria**:
- No notification created for self-assignment

---

### Test Scenario 4: Task Completion Notification

**Expected**: Task creator receives notification when task is completed

**Steps**:

1. **Setup**: User A created a task assigned to User B

2. **Window B (User B): Complete the task**:
   - Open the task
   - Change status to "Done"
   - Save

3. **Window A (User A): Check notification**:
   - Should see new notification
   - Title: "Task completed"
   - Message: "User B completed 'Task Title' in [Project Name]"

**✅ Success Criteria**:
- Task creator receives completion notification
- Notification appears within 1 second

---

### Test Scenario 5: Notification Preferences

**Expected**: User doesn't receive notifications if they've disabled them

**Steps**:

1. **Window B: Disable task assignment notifications**:
   - Go to Settings → Notifications
   - Find "Task Assigned" notification type
   - Toggle "In-App" to OFF
   - Save preferences

2. **Window A: Assign task to User B**:
   - Create a new task
   - Assign to User B
   - Save

3. **Window B: Check notification**:
   - Should NOT see a new notification
   - Badge does not change

4. **Window B: Re-enable notifications**:
   - Go to Settings → Notifications
   - Toggle "Task Assigned" to ON
   - Save preferences

5. **Window A: Assign another task to User B**:
   - Create a new task
   - Assign to User B
   - Save

6. **Window B: Check notification**:
   - Should see new notification
   - Badge increments

**✅ Success Criteria**:
- Notifications respect user preferences
- Disabling notifications prevents creation
- Re-enabling notifications works immediately

---

## Backend Testing

### Check Notification Creation in Database

```bash
# Connect to PostgreSQL
docker exec -it devops_postgres psql -U admin -d freelancerhub

# Check recent notifications
SELECT 
  id,
  user_id,
  type,
  title,
  message,
  is_read,
  created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 10;

# Check notifications for specific user
SELECT * FROM notifications
WHERE user_id = 2
ORDER BY created_at DESC;

# Check unread count
SELECT COUNT(*) FROM notifications
WHERE user_id = 2
AND is_read = false;
```

### Check Backend Logs

```bash
cd freelancer-hub-backend
npm run dev

# Watch for these log messages:
# ✅ "Created notification for user X"
# ❌ "Failed to create task assignment notification: [error]"
```

### Test API Directly

```bash
# Create task with assignment
curl -X POST http://localhost:3333/api/v1/tenants/test-tenant/projects/1/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-Slug: test-tenant" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "API Test Task",
    "description": "Testing via API",
    "status": "todo",
    "priority": "medium",
    "assigneeId": 2
  }'

# Check response
# Should return 201 Created with task data

# Verify notification in database
# SELECT * FROM notifications WHERE user_id = 2 ORDER BY created_at DESC LIMIT 1;
```

---

## Electric SQL Testing

### Check Electric is Running

```bash
# Check Docker container
docker ps | grep electric

# Should see:
# CONTAINER ID   IMAGE                    STATUS
# abc123         electricsql/electric     Up 5 minutes
```

### Check Electric Logs

```bash
# View Electric logs
docker logs electric -f

# Should see:
# [INFO] Electric started on port 3000
# [INFO] Connected to PostgreSQL
# [INFO] Logical replication active
```

### Test Electric Endpoint Directly

```bash
# Test Electric shape endpoint
curl -v "http://localhost:3000/v1/shape?table=notifications&offset=-1"

# Should return:
# HTTP/1.1 200 OK
# electric-handle: [handle]
# electric-offset: [offset]
# [notification data]
```

### Test Backend Proxy

```bash
# Test backend Electric proxy
curl -v \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-Slug: test-tenant" \
  "http://localhost:3333/api/v1/electric/notifications?log=full&offset=-1"

# Should return:
# HTTP/1.1 200 OK
# electric-handle: [handle]
# electric-offset: [offset]
# access-control-expose-headers: electric-handle, electric-offset, ...
# [filtered notification data for current user and tenant]
```

---

## Frontend Testing

### Check Collection Status

Open browser console (F12) and run:

```javascript
// Get notification collection
const collection = window.__notificationCollection

// Check if collection exists
console.log('Collection:', collection)

// Check collection data
console.log('All notifications:', collection?.getAll())

// Check unread count
const unread = collection?.getAll().filter(n => !n.isRead)
console.log('Unread count:', unread?.length)
```

### Check Electric Sync Status

```javascript
// Check if Electric is syncing
console.log('Electric sync active:', !!collection)

// Check for sync errors
// Look for "Electric sync error" in console
```

### Check Network Requests

1. Open DevTools → Network tab
2. Filter for "electric"
3. Should see requests to `/api/v1/electric/notifications`
4. Check response headers:
   - `electric-handle`
   - `electric-offset`
   - `access-control-expose-headers`

---

## Troubleshooting

### Issue: Notifications not appearing

**Check 1: Backend logs**
```bash
cd freelancer-hub-backend
npm run dev
# Look for "Failed to create task assignment notification" errors
```

**Check 2: Database**
```sql
-- Check if notification was created
SELECT * FROM notifications 
WHERE user_id = 2 
AND type = 'task_assigned'
ORDER BY created_at DESC 
LIMIT 1;
```

**Check 3: Electric**
```bash
# Check Electric is running
docker ps | grep electric

# Check Electric logs
docker logs electric

# Restart Electric if needed
docker restart electric
```

**Check 4: Frontend collection**
```javascript
// In browser console
const collection = getNotificationCollection()
console.log('Collection:', collection)
console.log('Notifications:', collection?.getAll())
```

**Check 5: User preferences**
```sql
-- Check if user has disabled notifications
SELECT * FROM notification_preferences 
WHERE user_id = 2 
AND notification_type = 'task_assigned'
AND in_app_enabled = false;
```

---

### Issue: Notification appears but with wrong data

**Check**: Notification content in database
```sql
SELECT 
  id,
  title,
  message,
  action_url,
  action_label,
  related_id,
  related_type
FROM notifications
WHERE id = [notification_id];
```

**Verify**:
- Title is correct
- Message includes task title and project name
- action_url has correct tenant slug and IDs
- related_id matches task.id
- related_type is 'task'

---

### Issue: Notification appears slowly (> 2 seconds)

**Check 1**: Electric sync latency
```bash
# Check Electric logs for delays
docker logs electric | grep -i "latency\|delay\|slow"
```

**Check 2**: Database replication lag
```sql
-- Check replication lag
SELECT 
  pg_current_wal_lsn(),
  pg_last_wal_receive_lsn(),
  pg_last_wal_replay_lsn();
```

**Check 3**: Network latency
- Open DevTools → Network tab
- Check timing for Electric requests
- Should be < 100ms

---

## Performance Testing

### Test with Multiple Users

1. Open 5 browser windows (5 different users)
2. User 1 assigns 10 tasks to Users 2-5
3. Verify all users receive notifications within 1 second

### Test with High Volume

```bash
# Create 100 tasks with assignments
for i in {1..100}; do
  curl -X POST http://localhost:3333/api/v1/tenants/test-tenant/projects/1/tasks \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "X-Tenant-Slug: test-tenant" \
    -H "Content-Type: application/json" \
    -d "{
      \"title\": \"Task $i\",
      \"status\": \"todo\",
      \"priority\": \"medium\",
      \"assigneeId\": 2
    }"
done

# Check notification count
# SELECT COUNT(*) FROM notifications WHERE user_id = 2;
```

---

## Success Checklist

- [ ] Notifications appear within 1 second
- [ ] Notification has correct title and message
- [ ] Action button navigates to correct task
- [ ] Self-assignment doesn't create notification
- [ ] Reassignment only notifies new assignee
- [ ] Task completion notifies creator
- [ ] Notification preferences are respected
- [ ] Multi-tenant isolation works (users only see their tenant's notifications)
- [ ] Electric sync is working (check logs)
- [ ] Backend logs show no errors
- [ ] Database has correct notification records

---

## Next Steps

Once all tests pass:

1. ✅ Deploy to staging environment
2. ✅ Test with real users
3. ✅ Monitor for errors in production logs
4. ✅ Gather user feedback
5. ✅ Consider adding email notifications
6. ✅ Consider adding push notifications
7. ✅ Add automated tests

🎉 **Congratulations! Task assignment notifications are working!**

