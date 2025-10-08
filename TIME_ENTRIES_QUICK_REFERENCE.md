# Time Entries - Quick Reference Guide

## 🎯 When to Use Which Endpoint?

### Use Task-Scoped Endpoints When:
- ✅ User is viewing a specific task
- ✅ Starting/stopping a timer for a task
- ✅ Adding time while working on a task
- ✅ Task detail page showing time entries

**Example**: Task detail page with "Log Time" button

### Use Global Endpoints When:
- ✅ Viewing all time entries across projects
- ✅ Timesheet-style management
- ✅ Retrospective time entry logging
- ✅ Reporting and analytics
- ✅ Admin oversight of all entries

**Example**: Time entries management page, reports

---

## 📡 API Endpoints Cheat Sheet

### Task-Scoped (Existing)
```bash
# List entries for a task
GET /api/v1/tasks/:taskId/time-entries

# Create entry for a task
POST /api/v1/tasks/:taskId/time-entries
{
  "date": "2025-01-15",
  "startTime": "2025-01-15T09:00:00Z",
  "endTime": "2025-01-15T17:00:00Z",
  "description": "Worked on feature",
  "billable": true
}

# Update entry
PUT /api/v1/tasks/:taskId/time-entries/:id

# Delete entry
DELETE /api/v1/tasks/:taskId/time-entries/:id

# Start timer
POST /api/v1/tasks/:taskId/time-entries/start

# Stop timer
POST /api/v1/tasks/:taskId/time-entries/stop
```

### Global (New)
```bash
# List all entries with filtering
GET /api/v1/time-entries?view_mode=daily&start_date=2025-01-01&end_date=2025-01-31&project_id=123

# Create entry (requires project_id and task_id)
POST /api/v1/time-entries
{
  "project_id": 123,
  "task_id": 456,
  "date": "2025-01-15",
  "start_time": "2025-01-15T09:00:00Z",
  "end_time": "2025-01-15T17:00:00Z",
  "description": "Worked on feature",
  "billable": true
}

# Update entry
PUT /api/v1/time-entries/:id

# Delete entry
DELETE /api/v1/time-entries/:id

# Get active timer
GET /api/v1/time-entries/active
```

---

## 🔍 Query Parameters for Global Endpoint

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `view_mode` | string | `daily` or `weekly` | `view_mode=daily` |
| `start_date` | string | ISO date | `start_date=2025-01-01` |
| `end_date` | string | ISO date | `end_date=2025-01-31` |
| `project_id` | number | Filter by project | `project_id=123` |
| `user_id` | number | Filter by user (admin only) | `user_id=456` |
| `billable` | boolean | Filter billable/non-billable | `billable=true` |
| `_sort` | string | Sort field | `_sort=date` |
| `_order` | string | Sort order (`ASC` or `DESC`) | `_order=DESC` |

---

## 📦 Response Structure (Global Endpoint)

```typescript
{
  data: [
    {
      id: 1,
      date: "2025-01-15",
      startTime: "2025-01-15T09:00:00Z",
      endTime: "2025-01-15T17:00:00Z",
      durationMinutes: 480,
      description: "Worked on feature X",
      notes: "Additional context",
      billable: true,
      user: {
        id: 1,
        fullName: "John Doe",
        email: "john@example.com"
      },
      task: {
        id: 456,
        title: "Implement feature X",
        project: {
          id: 123,
          name: "Project Alpha"
        }
      }
    }
  ],
  meta: {
    total: 100,
    perPage: 50,
    currentPage: 1,
    lastPage: 2
  },
  summary: {
    totalHours: 120.5,
    billableHours: 100.0,
    nonBillableHours: 20.5,
    entryCount: 100
  },
  breakdown: {
    byProject: [
      {
        projectId: 123,
        projectName: "Project Alpha",
        totalHours: 80.0
      }
    ],
    byTime: [
      {
        period: "2025-01-15",
        totalHours: 8.0,
        billableHours: 7.5
      }
    ]
  }
}
```

---

## 🎨 Frontend Components

### List View
```typescript
import { TimeEntriesList } from "./pages/time-entries";

// Route: /tenants/:slug/time-entries
<Route path="time-entries" element={<TimeEntriesList />} />
```

### Create Form
```typescript
import { TimeEntryCreate } from "./pages/time-entries";

// Route: /tenants/:slug/time-entries/create
<Route path="time-entries/create" element={<TimeEntryCreate />} />
```

### Edit Form
```typescript
import { TimeEntryEdit } from "./pages/time-entries";

// Route: /tenants/:slug/time-entries/:id/edit
<Route path="time-entries/:id/edit" element={<TimeEntryEdit />} />
```

---

## 🔐 Authorization Rules

### Non-Admin Users
- ✅ Can view their own time entries
- ✅ Can create time entries for themselves
- ✅ Can edit their own time entries
- ✅ Can delete their own time entries
- ❌ Cannot view other users' entries
- ❌ Cannot edit other users' entries

### Admin/Owner Users
- ✅ Can view all time entries in tenant
- ✅ Can filter by any user
- ✅ Can edit any time entry
- ✅ Can delete any time entry
- ✅ Full access to all features

---

## 🚀 Common Use Cases

### 1. Display Time Entries for Current Week
```typescript
const { data } = useList({
  resource: "time-entries",
  filters: [
    { field: "view_mode", operator: "eq", value: "daily" },
    { field: "start_date", operator: "eq", value: dayjs().startOf('week').format('YYYY-MM-DD') },
    { field: "end_date", operator: "eq", value: dayjs().endOf('week').format('YYYY-MM-DD') },
  ],
});
```

### 2. Create Time Entry
```typescript
const { mutate } = useCreate();

mutate({
  resource: "time-entries",
  values: {
    project_id: 123,
    task_id: 456,
    date: "2025-01-15",
    start_time: "2025-01-15T09:00:00Z",
    end_time: "2025-01-15T17:00:00Z",
    description: "Worked on feature X",
    billable: true,
  },
});
```

### 3. Update Time Entry
```typescript
const { mutate } = useUpdate();

mutate({
  resource: "time-entries",
  id: 789,
  values: {
    description: "Updated description",
    billable: false,
  },
});
```

### 4. Delete Time Entry
```typescript
const { mutate } = useDelete();

mutate({
  resource: "time-entries",
  id: 789,
});
```

### 5. Filter by Project
```typescript
const { data } = useList({
  resource: "time-entries",
  filters: [
    { field: "project_id", operator: "eq", value: 123 },
    { field: "start_date", operator: "eq", value: "2025-01-01" },
    { field: "end_date", operator: "eq", value: "2025-01-31" },
  ],
});
```

---

## 🐛 Troubleshooting

### Issue: 404 Not Found
**Cause**: Endpoint doesn't exist or wrong URL  
**Solution**: Check route configuration in `start/routes.ts`

### Issue: 403 Forbidden
**Cause**: User doesn't have permission  
**Solution**: Check authorization logic, verify user role

### Issue: 400 Bad Request
**Cause**: Missing required fields or invalid data  
**Solution**: Check request payload, ensure all required fields are present

### Issue: 500 Internal Server Error
**Cause**: Server-side error  
**Solution**: Check backend logs, verify database connection

### Issue: Empty Response
**Cause**: No data matches filters  
**Solution**: Adjust filters, check date range

---

## 📚 Documentation Links

- **Backend Architecture**: `freelancer-hub-backend/docs/TIME_ENTRIES_ARCHITECTURE.md`
- **Frontend Guide**: `freelancer-hub-dashboard/docs/TIME_ENTRIES_FRONTEND_GUIDE.md`
- **Complete Summary**: `TIME_ENTRIES_REFACTORING_SUMMARY.md`

---

## 💡 Tips & Best Practices

1. **Always validate dates**: Ensure end time > start time
2. **Use server-side aggregation**: Don't calculate summaries client-side
3. **Leverage filtering**: Use query parameters for better performance
4. **Handle errors gracefully**: Show user-friendly error messages
5. **Test authorization**: Verify permissions for different user roles
6. **Mobile-first**: Design for mobile, enhance for desktop
7. **Optimize queries**: Use pagination for large datasets
8. **Cache wisely**: Cache project/task lists, not time entries

---

## 🎯 Quick Decision Tree

```
Need to work with time entries?
│
├─ Working with a specific task?
│  └─ Use task-scoped endpoints (/tasks/:taskId/time-entries)
│
├─ Need cross-project view?
│  └─ Use global endpoints (/time-entries)
│
├─ Need aggregations/analytics?
│  └─ Use global endpoints with view_mode parameter
│
└─ Starting/stopping timer?
   └─ Use task-scoped timer endpoints
```

---

**Last Updated**: 2025-01-08  
**Version**: 1.0.0

