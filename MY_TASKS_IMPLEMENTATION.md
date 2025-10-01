# My Tasks Feature Implementation

## Overview

This document describes the implementation of the "My Tasks" feature, inspired by ClickUp's personal task management functionality. The feature provides users with a centralized view of their tasks across all projects within a tenant.

## Features Implemented

### 1. **Two Main Filtered Views**

#### a) Today & Overdue (Default View)
- Shows tasks assigned to the current user
- Filters tasks that are:
  - Due today OR
  - Past their due date (overdue)
- Excludes completed tasks (status != 'done')
- Sorted by due date (ascending)

#### b) Assigned to Me
- Shows all tasks assigned to the current user
- Includes tasks regardless of due date
- Excludes completed tasks by default
- Cross-project visibility within the tenant

### 2. **Multiple View Modes**

The My Tasks feature supports three different view modes:

- **List View** (`/tenants/:slug/my-tasks`)
  - Table-based display with columns for task, status, priority, due date
  - Shows project name for each task
  - Statistics cards showing today, overdue, and total counts
  - Advanced filtering capabilities
  - Responsive design for mobile and desktop

- **Kanban View** (`/tenants/:slug/my-tasks/kanban`)
  - Drag-and-drop task management
  - Four columns: To Do, In Progress, Review, Done
  - Visual status updates
  - Project information on each card

- **Calendar View** (`/tenants/:slug/my-tasks/calendar`)
  - Monthly calendar display
  - Tasks shown on their due dates
  - Color-coded by priority
  - Click to navigate to task details

### 3. **Statistics Dashboard**

Each view includes summary statistics:
- **Today**: Count of tasks due today
- **Overdue**: Count of overdue tasks
- **Total**: Total tasks in current filter

## Backend Implementation

### API Endpoints

#### 1. Get My Tasks
```
GET /api/v1/my-tasks
```

**Query Parameters:**
- `filter`: 'assigned' | 'today_overdue' | 'all' (default: 'today_overdue')
- `status`: Filter by task status
- `priority`: Filter by priority
- `project_id`: Filter by specific project
- `_sort`: Sort field (default: 'due_date')
- `_order`: Sort order (default: 'ASC')
- `_start`, `_end`: Pagination

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Task title",
      "description": "Task description",
      "status": "in_progress",
      "priority": "high",
      "dueDate": "2025-01-15",
      "assignee": {
        "id": 1,
        "fullName": "John Doe"
      },
      "project": {
        "id": 1,
        "name": "Project Name"
      },
      "estimatedHours": 5,
      "actualHours": 2
    }
  ],
  "meta": {
    "total": 10,
    "perPage": 50,
    "currentPage": 1,
    "lastPage": 1,
    "todayCount": 3,
    "overdueCount": 2
  }
}
```

#### 2. Get My Tasks Summary
```
GET /api/v1/my-tasks/summary
```

**Response:**
```json
{
  "data": {
    "assigned": 15,
    "today": 3,
    "overdue": 2,
    "upcoming": 10,
    "highPriority": 5
  }
}
```

### Controller: `MyTasksController`

**Location:** `freelancer-hub-backend/app/controllers/my_tasks.ts`

**Key Methods:**
- `index()`: Fetches tasks based on filter criteria
- `summary()`: Returns task statistics

**Filtering Logic:**

1. **Base Query**: Tasks from projects in the current tenant
2. **Filter Application**:
   - `assigned`: `assignee_id = current_user.id`
   - `today_overdue`: 
     - `assignee_id = current_user.id`
     - `due_date <= today`
     - `status != 'done'`
     - `completed_at IS NULL`
   - `all`: All tasks user has access to in tenant

### Routes

**Location:** `freelancer-hub-backend/start/routes.ts`

```typescript
router.get('/my-tasks', [MyTasksController, 'index'])
router.get('/my-tasks/summary', [MyTasksController, 'summary'])
```

## Frontend Implementation

### Pages

#### 1. My Tasks List
**Location:** `freelancer-hub-dashboard/src/pages/my-tasks/list.tsx`

**Features:**
- Statistics cards (Today, Overdue, Total)
- Segmented control to switch between filters
- Advanced filtering panel
- Responsive table with task details
- Actions: View, Edit, Delete
- Navigation to other views (Kanban, Calendar)

#### 2. My Tasks Kanban
**Location:** `freelancer-hub-dashboard/src/pages/my-tasks/kanban.tsx`

**Features:**
- Drag-and-drop task management
- Four status columns
- Filter toggle (Today & Overdue / Assigned to Me)
- Task cards with project information
- Real-time status updates

#### 3. My Tasks Calendar
**Location:** `freelancer-hub-dashboard/src/pages/my-tasks/calendar.tsx`

**Features:**
- Monthly calendar view
- Tasks displayed on due dates
- Priority-based color coding
- Click to navigate to task details
- Filter toggle

### API Client Updates

**Location:** `freelancer-hub-dashboard/src/services/api/`

**New Methods:**
- `getMyTasks(params)`: Fetch my tasks with filters
- `getMyTasksSummary()`: Fetch task statistics

**New Types:**
- `MyTasksFilter`: Type for filter values
- `MyTasksResponse`: Response type with data and meta
- `MyTasksSummary`: Summary statistics type

**Updated Types:**
- `Task`: Added `project` and `completedAt` fields

### Routing

**Location:** `freelancer-hub-dashboard/src/App.tsx`

```typescript
<Route path="my-tasks">
  <Route index element={<MyTasksList />} />
  <Route path="kanban" element={<MyTasksKanban />} />
  <Route path="calendar" element={<MyTasksCalendar />} />
</Route>
```

### Navigation

**Location:** `freelancer-hub-dashboard/src/components/RefineWithTenant.tsx`

Added "My Tasks" resource to the sidebar navigation:

```typescript
{
  name: "my-tasks",
  list: `/tenants/${slug}/my-tasks`,
  meta: {
    label: "My Tasks",
    canDelete: false,
    icon: "CheckSquareOutlined",
  },
}
```

## Design Decisions

### 1. Cross-Project Visibility
- **Decision**: Show tasks from all projects within the current tenant
- **Rationale**: Provides a comprehensive view of user's workload across all projects

### 2. Default Filter
- **Decision**: Default to "Today & Overdue" view
- **Rationale**: More actionable and focused on immediate priorities

### 3. Exclude Completed Tasks
- **Decision**: Exclude tasks with status='done' from Today & Overdue
- **Rationale**: Focus on actionable items, reduce clutter

### 4. Tenant Scoping
- **Decision**: Scope to current tenant only
- **Rationale**: Maintains data isolation and security in multi-tenant architecture

### 5. Navigation Placement
- **Decision**: Top-level menu item in sidebar
- **Rationale**: Easy access, separate from project-specific views

## Testing Checklist

- [ ] Backend API endpoints return correct data
- [ ] Filtering works correctly (assigned, today_overdue, all)
- [ ] Statistics are calculated accurately
- [ ] List view displays tasks correctly
- [ ] Kanban view allows drag-and-drop
- [ ] Calendar view shows tasks on correct dates
- [ ] Filter toggle works in all views
- [ ] Navigation between views works
- [ ] Mobile responsive design works
- [ ] Task actions (view, edit, delete) work
- [ ] Cross-project tasks are displayed
- [ ] Tenant isolation is maintained
- [ ] Pagination works correctly
- [ ] Sorting works correctly

## Future Enhancements

1. **Badge on Navigation**: Show count of overdue tasks
2. **Quick Actions**: Add task directly from My Tasks view
3. **Bulk Operations**: Select and update multiple tasks
4. **Saved Filters**: Save custom filter combinations
5. **Email Notifications**: Daily digest of overdue tasks
6. **Priority Sorting**: Sort by priority within date groups
7. **Subtasks Support**: Show subtask progress
8. **Time Tracking**: Quick time entry from My Tasks
9. **Search**: Full-text search across tasks
10. **Export**: Export task list to CSV/PDF

## Files Modified/Created

### Backend
- ✅ Created: `freelancer-hub-backend/app/controllers/my_tasks.ts`
- ✅ Modified: `freelancer-hub-backend/start/routes.ts`

### Frontend
- ✅ Created: `freelancer-hub-dashboard/src/pages/my-tasks/list.tsx`
- ✅ Created: `freelancer-hub-dashboard/src/pages/my-tasks/kanban.tsx`
- ✅ Created: `freelancer-hub-dashboard/src/pages/my-tasks/calendar.tsx`
- ✅ Created: `freelancer-hub-dashboard/src/pages/my-tasks/index.ts`
- ✅ Modified: `freelancer-hub-dashboard/src/services/api/types.ts`
- ✅ Modified: `freelancer-hub-dashboard/src/services/api/endpoint.ts`
- ✅ Modified: `freelancer-hub-dashboard/src/services/api/api.ts`
- ✅ Modified: `freelancer-hub-dashboard/src/App.tsx`
- ✅ Modified: `freelancer-hub-dashboard/src/components/RefineWithTenant.tsx`

## Usage

### Accessing My Tasks

1. Navigate to the application
2. Click "My Tasks" in the sidebar navigation
3. Default view shows "Today & Overdue" tasks
4. Toggle to "Assigned to Me" to see all assigned tasks
5. Switch between List, Kanban, and Calendar views using the buttons

### Filtering

1. Click the "Filters" button to open advanced filters
2. Filter by status, priority, or project
3. Filters persist across view changes
4. Clear filters to reset

### Managing Tasks

1. Click "View" or "Edit" to open task details
2. Drag tasks between columns in Kanban view
3. Click tasks in Calendar view to navigate to details
4. Delete tasks using the Delete button (with confirmation)

## Conclusion

The My Tasks feature provides a comprehensive, ClickUp-inspired personal task management system that integrates seamlessly with the existing multi-tenant architecture. It offers multiple view modes, powerful filtering, and cross-project visibility while maintaining proper data isolation and security.

