# Task Notifications - Quick Reference

## 🚀 Quick Start

```bash
# 1. Start backend
cd freelancer-hub-backend && npm run dev

# 2. Start frontend
cd freelancer-hub-dashboard && npm run dev

# 3. Check Electric is running
docker ps | grep electric

# 4. Test: Assign a task to another user
# 5. Check: Notification appears within 1 second
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `app/services/notification_service.ts` | Centralized notification creation |
| `app/controllers/tasks.ts` | Task assignment logic |
| `app/models/task.ts` | Task model with hooks |
| `app/models/notification.ts` | Notification model |

---

## 🎯 When Notifications Are Created

| Action | Notification Type | Recipient |
|--------|------------------|-----------|
| Assign task to user | `task_assigned` | Assignee |
| Reassign task | `task_assigned` | New assignee only |
| Complete task | `task_completed` | Task creator |
| Self-assign task | None | Nobody |

---

## 💻 Code Examples

### Create Task Assignment Notification

```typescript
import NotificationService from '#services/notification_service'

// In controller
await NotificationService.notifyTaskAssignment(
  task,           // Task instance
  assigneeId,     // User ID to notify
  currentUser,    // User making the assignment
  tenant.id       // Tenant ID
)
```

### Create Task Completion Notification

```typescript
await NotificationService.notifyTaskCompletion(
  task,           // Task instance
  completedBy,    // User who completed it
  tenant.id       // Tenant ID
)
```

### Add New Notification Type

```typescript
// 1. Add to NotificationType enum
export type NotificationType = 
  | 'task_assigned'
  | 'your_new_type' // ← Add here

// 2. Add method to NotificationService
static async notifyYourNewType(...) {
  return await Notification.createNotification({
    userId: userId,
    tenantId: tenantId,
    type: 'your_new_type',
    title: 'Your Title',
    message: 'Your message',
    actionUrl: '/path/to/resource',
    actionLabel: 'View Resource',
    relatedId: resourceId,
    relatedType: 'resource_type',
  })
}

// 3. Call from controller
await NotificationService.notifyYourNewType(...)
```

---

## 🧪 Testing Commands

### Database Queries

```sql
-- Check recent notifications
SELECT id, user_id, type, title, message, created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 10;

-- Check unread count for user
SELECT COUNT(*) FROM notifications
WHERE user_id = 2 AND is_read = false;

-- Check notification preferences
SELECT * FROM notification_preferences
WHERE user_id = 2 AND notification_type = 'task_assigned';
```

### API Testing

```bash
# Create task with assignment
curl -X POST http://localhost:3333/api/v1/tenants/test-tenant/projects/1/tasks \
  -H "Authorization: Bearer TOKEN" \
  -H "X-Tenant-Slug: test-tenant" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "status": "todo",
    "priority": "medium",
    "assigneeId": 2
  }'
```

### Frontend Console

```javascript
// Get notification collection
const collection = getNotificationCollection()

// Check all notifications
console.log(collection?.getAll())

// Check unread count
const unread = collection?.getAll().filter(n => !n.isRead)
console.log('Unread:', unread?.length)
```

---

## 🔍 Troubleshooting

### Notification Not Appearing?

```bash
# 1. Check backend logs
cd freelancer-hub-backend && npm run dev
# Look for: "Failed to create task assignment notification"

# 2. Check database
psql -U admin -d freelancerhub
SELECT * FROM notifications WHERE user_id = 2 ORDER BY created_at DESC LIMIT 1;

# 3. Check Electric
docker ps | grep electric
docker logs electric

# 4. Check user preferences
SELECT * FROM notification_preferences 
WHERE user_id = 2 AND notification_type = 'task_assigned';
```

### Notification Appearing Slowly?

```bash
# Check Electric sync latency
docker logs electric | grep -i "latency\|delay"

# Check network timing in DevTools
# Network tab → Filter "electric" → Check timing
```

---

## 📊 Notification Flow

```
User assigns task
    ↓
Controller updates task
    ↓
NotificationService.notifyTaskAssignment()
    ↓
Notification.createNotification()
    ↓
Check user preferences
    ↓
Insert into PostgreSQL
    ↓
Electric detects change (< 100ms)
    ↓
Electric syncs to clients (< 500ms)
    ↓
TanStack DB updates (< 100ms)
    ↓
React re-renders (< 100ms)
    ↓
User sees notification! (< 1 second total)
```

---

## ⚙️ Configuration

### No New Config Needed

Uses existing environment variables:
- `ELECTRIC_URL` - Electric service URL
- `DB_*` - PostgreSQL connection

### User Preferences

Users can control notifications in Settings:
- Toggle in-app notifications on/off
- Toggle email notifications on/off (future)
- Mute all notifications

---

## 📝 Notification Structure

```typescript
{
  id: number,
  userId: number,              // Who receives it
  tenantId: number,            // Tenant isolation
  type: 'task_assigned',       // Notification type
  title: 'You've been assigned to a task',
  message: 'User A assigned you to "Task Title" in Project Name',
  actionUrl: '/tenants/slug/projects/1/tasks/1',
  actionLabel: 'View Task',
  relatedId: 1,                // Task ID
  relatedType: 'task',
  isRead: false,
  readAt: null,
  createdAt: '2025-02-05T10:30:00Z',
  updatedAt: '2025-02-05T10:30:00Z'
}
```

---

## 🎯 Best Practices

### DO ✅

- Use `NotificationService` for all notifications
- Check if user is assigning to themselves
- Handle errors gracefully (try-catch)
- Load related data (project, tenant) before creating notification
- Use tenant slug in action URLs
- Log errors but don't throw

### DON'T ❌

- Create notifications directly with `Notification.create()`
- Throw errors if notification creation fails
- Create notifications for self-assignment
- Forget to check user preferences
- Use hardcoded URLs without tenant slug
- Create duplicate notifications

---

## 🔗 Related Documentation

- **Full Implementation**: `TASK_ASSIGNMENT_NOTIFICATIONS_IMPLEMENTATION.md`
- **Testing Guide**: `TASK_NOTIFICATIONS_TESTING_GUIDE.md`
- **Summary**: `TASK_NOTIFICATIONS_SUMMARY.md`
- **Electric Setup**: `ELECTRIC_REAL_TIME_NOTIFICATIONS.md`

---

## 📞 Common Questions

**Q: How do I add a new notification type?**
A: Add to `NotificationType` enum, create method in `NotificationService`, call from controller.

**Q: Why aren't notifications appearing?**
A: Check backend logs, database, Electric status, and user preferences.

**Q: How do I disable notifications for a user?**
A: User can toggle in Settings → Notifications, or update `notification_preferences` table.

**Q: Can I send email notifications?**
A: Not yet. Extend `NotificationService` to call `EmailService` (future enhancement).

**Q: How do I test notifications locally?**
A: Open two browser windows, login as different users, assign task from one to the other.

**Q: What if Electric is not running?**
A: Notifications are still created in database, but won't sync to frontend until Electric starts.

---

## 🎉 Success Checklist

- [ ] Backend running
- [ ] Frontend running
- [ ] Electric running
- [ ] PostgreSQL with `wal_level = logical`
- [ ] Two test users in same tenant
- [ ] Assign task from User A to User B
- [ ] Notification appears in User B's bell within 1 second
- [ ] Click notification navigates to task
- [ ] Self-assignment doesn't create notification

---

**🚀 You're all set! Happy coding!**

