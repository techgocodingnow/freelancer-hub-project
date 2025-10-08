# Time Entries Architecture

## Overview

The time entries feature has been refactored to use a **unified controller approach** that handles both task-scoped and global time entry operations. This eliminates code duplication and provides a consistent API experience.

## Design Decision: Unified Controller

### Why One Controller Instead of Two?

**Previous Approach (Rejected):**
- `TimeEntriesController` - Task-scoped operations (`/tasks/:taskId/time-entries`)
- `TimeEntriesManagementController` - Global operations (`/time-entries`)

**Problems with Dual Controllers:**
1. **Code Duplication**: Similar CRUD logic in two places
2. **Inconsistent Validation**: Two places to maintain validation rules
3. **Maintenance Burden**: Bug fixes need to be applied twice
4. **API Confusion**: Developers need to know which endpoint to use

**Current Approach (Implemented):**
- Single `TimeEntriesController` that intelligently handles both task-scoped and global requests
- Routes determine the context, controller adapts behavior accordingly

### Benefits of Unified Approach:
✅ **Single Source of Truth**: All time entry logic in one place  
✅ **Consistent Behavior**: Same validation, error handling, and business logic  
✅ **Easier Maintenance**: One controller to update and test  
✅ **Clearer API**: Simpler for frontend developers to understand  
✅ **DRY Principle**: Don't Repeat Yourself  

## API Endpoints

### Task-Scoped Endpoints (Existing)
These endpoints are used when working within the context of a specific task:

```
GET    /api/v1/tasks/:taskId/time-entries       - List entries for a task
POST   /api/v1/tasks/:taskId/time-entries       - Create entry for a task
PUT    /api/v1/tasks/:taskId/time-entries/:id   - Update entry
PATCH  /api/v1/tasks/:taskId/time-entries/:id   - Update entry
DELETE /api/v1/tasks/:taskId/time-entries/:id   - Delete entry
POST   /api/v1/tasks/:taskId/time-entries/start - Start timer for task
POST   /api/v1/tasks/:taskId/time-entries/stop  - Stop timer for task
```

**Use Cases:**
- User is viewing a task and wants to log time
- User is working on a task and starts/stops timer
- Task detail page showing time entries for that task

### Global Endpoints (New)
These endpoints are used for timesheet-style management across all tasks/projects:

```
GET    /api/v1/time-entries           - List all entries with filtering
POST   /api/v1/time-entries           - Create entry (requires task_id in body)
PUT    /api/v1/time-entries/:id       - Update entry
PATCH  /api/v1/time-entries/:id       - Update entry
DELETE /api/v1/time-entries/:id       - Delete entry
GET    /api/v1/time-entries/active    - Get active timer
```

**Use Cases:**
- Timesheet view showing all time entries
- Daily/weekly time entry reports
- Retrospective time entry logging
- Time entry management dashboard

## Controller Implementation

### How It Works

The `TimeEntriesController` uses a **context detection pattern**:

```typescript
async index(ctx: HttpContext) {
  const isTaskScoped = !!ctx.params.taskId
  
  if (isTaskScoped) {
    return this.indexForTask(ctx)
  } else {
    return this.indexGlobal(ctx)
  }
}
```

### Method Breakdown

#### 1. `index()` - List Time Entries
- **Task-Scoped**: Returns entries for specific task
- **Global**: Returns all entries with filtering, aggregation, and daily/weekly grouping

#### 2. `store()` - Create Time Entry
- **Task-Scoped**: Uses `taskId` from URL params
- **Global**: Requires `project_id` and `task_id` in request body, validates both

#### 3. `update()` - Update Time Entry
- **Task-Scoped**: Verifies task ownership first, then finds entry
- **Global**: Finds entry and verifies tenant ownership through task->project relationship
- **Authorization**: Users can only edit their own entries (admins can edit any)

#### 4. `destroy()` - Delete Time Entry
- **Task-Scoped**: Verifies task ownership first, then finds entry
- **Global**: Finds entry and verifies tenant ownership through task->project relationship
- **Authorization**: Users can only delete their own entries (admins can delete any)

#### 5. `start()` / `stop()` - Timer Operations
- Only available as task-scoped endpoints
- Used for real-time time tracking

#### 6. `active()` - Get Active Timer
- Global endpoint (no task context needed)
- Returns currently running timer for authenticated user

## Global Endpoint Features

### Filtering Options
```typescript
// Query parameters
{
  view_mode: 'daily' | 'weekly',  // Grouping mode
  project_id: number,              // Filter by project
  user_id: number,                 // Filter by user (admin only)
  start_date: string,              // ISO date
  end_date: string,                // ISO date
  billable: boolean,               // Filter billable/non-billable
  _sort: string,                   // Sort field
  _order: 'ASC' | 'DESC'          // Sort order
}
```

### Response Format
```typescript
{
  data: TimeEntry[],              // Array of time entries
  meta: {
    total: number,
    perPage: number,
    currentPage: number,
    lastPage: number
  },
  summary: {
    totalHours: number,
    billableHours: number,
    nonBillableHours: number,
    entryCount: number
  },
  breakdown: {
    byProject: [{
      projectId: number,
      projectName: string,
      totalHours: number
    }],
    byTime: [{
      period: string,              // Date or week start
      totalHours: number,
      billableHours: number
    }]
  }
}
```

## Authorization Rules

### Non-Admin Users
- Can only view their own time entries
- Can only create time entries for themselves
- Can only edit/delete their own time entries

### Admin/Owner Users
- Can view all time entries in their tenant
- Can filter by any user
- Can edit/delete any time entry in their tenant

## Security Considerations

### Tenant Isolation
All operations verify tenant ownership through the project relationship:
```typescript
// Task-scoped: Verify task belongs to tenant
const task = await Task.query()
  .where('id', params.taskId)
  .preload('project', (query) => {
    query.where('tenant_id', tenant.id)
  })
  .first()

// Global: Verify time entry belongs to tenant
const timeEntry = await TimeEntry.query()
  .where('id', params.id)
  .preload('task', (taskQuery) => {
    taskQuery.preload('project', (projectQuery) => {
      projectQuery.where('tenant_id', tenant.id)
    })
  })
  .first()
```

### User Authorization
```typescript
// Check if user is admin/owner
const tenantUser = await TenantUser.query()
  .where('tenant_id', tenant.id)
  .where('user_id', user.id)
  .preload('role')
  .firstOrFail()

const isAdmin = ['admin', 'owner'].includes(tenantUser.role.name)

// Enforce ownership for non-admins
if (!isAdmin && timeEntry.userId !== user.id) {
  return response.forbidden({ error: 'You can only edit your own time entries' })
}
```

## Migration Guide

### For Frontend Developers

**Before (if you were using the old approach):**
```typescript
// Had to use different endpoints
const taskEntries = await api.get(`/tasks/${taskId}/time-entries`)
const allEntries = await api.get(`/timesheets/time-entries`)
```

**After (unified approach):**
```typescript
// Task-scoped (no change)
const taskEntries = await api.get(`/tasks/${taskId}/time-entries`)

// Global with filtering
const allEntries = await api.get(`/time-entries`, {
  params: {
    view_mode: 'weekly',
    start_date: '2025-01-01',
    end_date: '2025-01-31',
    project_id: 123
  }
})

// Create time entry globally
const newEntry = await api.post(`/time-entries`, {
  project_id: 123,
  task_id: 456,
  date: '2025-01-15',
  start_time: '2025-01-15T09:00:00Z',
  end_time: '2025-01-15T17:00:00Z',
  description: 'Worked on feature X',
  billable: true
})
```

## Testing Recommendations

### Unit Tests
- Test task-scoped operations
- Test global operations
- Test authorization rules (admin vs non-admin)
- Test tenant isolation
- Test filtering and aggregation

### Integration Tests
- Test complete workflows (create, update, delete)
- Test timer operations
- Test cross-project time entry queries
- Test permission boundaries

### Example Test Cases
```typescript
// Test 1: Non-admin cannot view other users' entries
// Test 2: Admin can view all entries with user filter
// Test 3: Task-scoped creation validates task ownership
// Test 4: Global creation validates both project and task
// Test 5: Weekly grouping returns correct aggregations
// Test 6: Tenant isolation prevents cross-tenant access
```

## Future Enhancements

### Potential Improvements
1. **Bulk Operations**: Add endpoints for bulk create/update/delete
2. **Export**: Add CSV/Excel export for time entries
3. **Templates**: Allow saving time entry templates
4. **Approval Workflow**: Integrate with timesheet approval process
5. **Analytics**: Add more detailed analytics and insights
6. **Recurring Entries**: Support for recurring time entries

## Conclusion

The unified controller approach provides a clean, maintainable solution for time entry management. It eliminates code duplication while providing both task-scoped and global operations through a single, well-tested controller.

**Key Takeaway**: One controller, multiple contexts, consistent behavior.

