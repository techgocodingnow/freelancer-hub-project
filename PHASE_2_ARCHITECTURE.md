# Phase 2 Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Freelancer Hub Dashboard                     │
│                      (React + TypeScript)                        │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│  Phase 1      │      │  Phase 2      │      │  Existing     │
│  Foundation   │      │  Advanced     │      │  Features     │
└───────────────┘      └───────────────┘      └───────────────┘
        │                        │                        │
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│ Design System │      │ Calendar View │      │ Projects      │
│ - Tokens      │      │ Timeline View │      │ Users         │
│ - Colors      │      │ Bulk Actions  │      │ Auth          │
│ - Typography  │      │ Enhanced KB   │      │ Timer         │
└───────────────┘      └───────────────┘      └───────────────┘
```

---

## Component Hierarchy

```
App.tsx
│
├── Routes
│   ├── /tenants/:slug/projects/:id/tasks
│   │   │
│   │   ├── [index] → TaskList (List View)
│   │   │   ├── BulkActionsToolbar ← NEW
│   │   │   ├── Table with rowSelection ← ENHANCED
│   │   │   └── View Navigation Buttons ← NEW
│   │   │
│   │   ├── /kanban → TaskKanban (Kanban View)
│   │   │   ├── DroppableColumn ← ENHANCED
│   │   │   │   ├── Collapse/Expand ← NEW
│   │   │   │   ├── WIP Limits ← NEW
│   │   │   │   └── Drop Highlighting ← NEW
│   │   │   ├── TaskCard
│   │   │   └── View Navigation Buttons ← NEW
│   │   │
│   │   ├── /calendar → TaskCalendar ← NEW
│   │   │   ├── react-big-calendar
│   │   │   ├── Custom Toolbar
│   │   │   ├── Event Styling
│   │   │   └── View Navigation Buttons
│   │   │
│   │   ├── /timeline → TaskTimeline ← NEW
│   │   │   ├── Ant Design Timeline
│   │   │   ├── Date Range Filter
│   │   │   ├── Task Cards
│   │   │   └── View Navigation Buttons
│   │   │
│   │   ├── /create → TaskCreate
│   │   └── /:id/edit → TaskEdit
│   │
│   └── ... other routes
│
└── CommandPalette (Phase 1)
```

---

## Data Flow

### Calendar View
```
TaskCalendar Component
    │
    ├─→ useList<Task>() [Refine Hook]
    │       │
    │       └─→ GET /projects/:id/tasks
    │               │
    │               └─→ Backend API
    │
    ├─→ useMemo: Transform tasks to events
    │       │
    │       └─→ Filter tasks with dueDate
    │           └─→ Map to CalendarEvent format
    │
    ├─→ Calendar Component [react-big-calendar]
    │       │
    │       ├─→ eventPropGetter: Apply priority colors
    │       ├─→ onSelectEvent: Navigate to edit
    │       └─→ Custom Toolbar: Navigation controls
    │
    └─→ View Navigation Buttons
```

### Timeline View
```
TaskTimeline Component
    │
    ├─→ useList<Task>() [Refine Hook]
    │       │
    │       └─→ GET /projects/:id/tasks?sort=dueDate:asc
    │               │
    │               └─→ Backend API
    │
    ├─→ Date Range Filter State
    │       │
    │       └─→ Filter tasks by date range
    │
    ├─→ useMemo: Group tasks by date
    │       │
    │       └─→ { '2025-01-15': [task1, task2], ... }
    │
    ├─→ Timeline Component [Ant Design]
    │       │
    │       └─→ Timeline.Item for each date
    │               │
    │               └─→ Task Cards
    │
    └─→ View Navigation Buttons
```

### Bulk Actions
```
TaskList Component
    │
    ├─→ useBulkActions() [Custom Hook]
    │       │
    │       ├─→ Selection State Management
    │       │   ├─→ selectedIds: number[]
    │       │   ├─→ toggleSelection()
    │       │   ├─→ selectAll()
    │       │   └─→ clearSelection()
    │       │
    │       └─→ Bulk Operations
    │           ├─→ bulkUpdateStatus()
    │           │   └─→ Promise.all([
    │           │       useUpdate(task1),
    │           │       useUpdate(task2),
    │           │       ...
    │           │   ])
    │           │
    │           ├─→ bulkUpdatePriority()
    │           ├─→ bulkAssign()
    │           └─→ bulkDelete()
    │
    ├─→ BulkActionsToolbar Component
    │       │
    │       ├─→ Selection Count Display
    │       ├─→ Action Dropdowns
    │       └─→ Delete Button with Confirmation
    │
    └─→ Table with rowSelection
            │
            └─→ Checkboxes for multi-select
```

### Enhanced Kanban
```
TaskKanban Component
    │
    ├─→ DndContext [dnd-kit]
    │       │
    │       ├─→ onDragStart: Set activeId
    │       ├─→ onDragEnd: Update task status
    │       │       │
    │       │       └─→ useUpdate() → PATCH /tasks/:id
    │       │
    │       └─→ Columns
    │           │
    │           └─→ DroppableColumn (Enhanced)
    │               │
    │               ├─→ useDroppable() [dnd-kit]
    │               │   └─→ isOver state
    │               │
    │               ├─→ Collapse/Expand State
    │               │   └─→ useState(false)
    │               │
    │               ├─→ WIP Limit Check
    │               │   └─→ count > wipLimit
    │               │
    │               └─→ Visual Feedback
    │                   ├─→ Drop zone highlighting
    │                   ├─→ Smooth transitions
    │                   └─→ Task count badge
    │
    └─→ View Navigation Buttons
```

---

## State Management

### Local State (useState)
```typescript
// Calendar View
const [view, setView] = useState<View>('month');
const [date, setDate] = useState(new Date());

// Timeline View
const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);

// Bulk Actions
const [selectedIds, setSelectedIds] = useState<number[]>([]);
const [isProcessing, setIsProcessing] = useState(false);

// Enhanced Kanban
const [isCollapsed, setIsCollapsed] = useState(false);
const [activeId, setActiveId] = useState<number | null>(null);
```

### Server State (Refine Hooks)
```typescript
// Fetching tasks
const { result: data, query: { isLoading, refetch } } = useList<Task>({
  resource: `projects/${projectId}/tasks`,
  pagination: { pageSize: 1000 },
  filters: [...],
  sorters: [...],
});

// Updating tasks
const { mutate: updateTask } = useUpdate();

// Deleting tasks
const { mutate: deleteTask } = useDelete();
```

### Computed State (useMemo)
```typescript
// Calendar events
const events = useMemo(() => {
  return tasks
    .filter(task => task.dueDate)
    .map(task => ({
      id: task.id,
      title: task.title,
      start: new Date(task.dueDate),
      end: new Date(task.dueDate),
      resource: task,
    }));
}, [tasks]);

// Grouped tasks
const groupedTasks = useMemo(() => {
  const groups: GroupedTasks = {};
  tasks.forEach(task => {
    const dateKey = format(parseISO(task.dueDate), 'yyyy-MM-dd');
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(task);
  });
  return groups;
}, [tasks]);
```

---

## API Integration

### Endpoints Used

```
GET    /projects/:projectId/tasks
       - Fetch all tasks for a project
       - Used by: Calendar, Timeline, List, Kanban

PATCH  /projects/:projectId/tasks/:id
       - Update a single task
       - Used by: Bulk Actions (status, priority, assignee)
       - Used by: Kanban (drag-and-drop status change)

DELETE /projects/:projectId/tasks/:id
       - Delete a single task
       - Used by: Bulk Actions (delete)
```

### Request/Response Format

```typescript
// GET /projects/123/tasks
Response: {
  data: [
    {
      id: 1,
      title: "Task 1",
      description: "Description",
      status: "in_progress",
      priority: "high",
      dueDate: "2025-01-15",
      assignee: {
        id: 5,
        fullName: "John Doe"
      },
      estimatedHours: 8,
      actualHours: 4
    },
    // ... more tasks
  ]
}

// PATCH /projects/123/tasks/1
Request: {
  status: "done"
}
Response: {
  data: { /* updated task */ }
}

// DELETE /projects/123/tasks/1
Response: {
  data: { /* deleted task */ }
}
```

---

## Design Token Usage

```
src/theme/
│
├── colors.ts
│   ├── priority: { urgent, high, medium, low }
│   ├── status: { todo, in_progress, review, done }
│   └── semantic: { success, error, warning, info }
│
├── typography.ts
│   ├── fontFamily: { sans, mono }
│   ├── fontSize: { xs, sm, md, lg, xl, ... }
│   └── fontWeight: { normal, medium, semibold, bold }
│
├── spacing.ts
│   └── 8px grid: { 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24 }
│
├── tokens.ts
│   ├── borderRadius: { sm, md, lg, xl }
│   ├── shadows: { sm, md, lg, xl }
│   ├── transitions: { fast, normal, slow }
│   ├── easing: { easeInOut, easeOut, easeIn }
│   ├── zIndex: { dropdown, sticky, modal, tooltip }
│   └── breakpoints: { xs, sm, md, lg, xl }
│
└── index.ts
    ├── getPriorityColor(priority)
    ├── getStatusColor(status)
    └── getDueDateColor(dueDate)
```

---

## Performance Optimizations

### 1. Memoization
```typescript
// Expensive computations cached
const events = useMemo(() => transformTasksToEvents(tasks), [tasks]);
const groupedTasks = useMemo(() => groupByDate(tasks), [tasks]);
```

### 2. Callback Optimization
```typescript
// Prevent unnecessary re-renders
const handleClick = useCallback((id: number) => {
  navigate(`/tasks/${id}/edit`);
}, [navigate]);
```

### 3. Batch Operations
```typescript
// Parallel execution instead of sequential
await Promise.all(selectedIds.map(id => updateTask(id, values)));
```

### 4. Lazy Rendering
```typescript
// Collapsed columns don't render children
{!isCollapsed && <div>{children}</div>}
```

---

## Security Considerations

### 1. Multi-Tenancy
- All routes include tenant slug: `/tenants/:slug/...`
- Backend validates tenant access for all operations

### 2. Authorization
- Bulk operations respect user permissions
- Backend validates each operation individually

### 3. Input Validation
- TypeScript ensures type safety
- Backend validates all inputs

### 4. XSS Prevention
- React escapes all user input by default
- No `dangerouslySetInnerHTML` used

---

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome  | 90+     | ✅ Full Support |
| Firefox | 88+     | ✅ Full Support |
| Safari  | 14+     | ✅ Full Support |
| Edge    | 90+     | ✅ Full Support |
| Mobile Safari | iOS 14+ | ✅ Full Support |
| Mobile Chrome | Android 90+ | ✅ Full Support |

---

## Accessibility (WCAG AA)

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Tab order is logical
- Focus indicators are visible

### Screen Readers
- ARIA labels on all buttons
- Semantic HTML structure
- Status messages announced

### Color Contrast
- Text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements distinguishable

---

## Future Enhancements

### Phase 3 (Mobile Optimization)
- Touch gestures for kanban
- Mobile-specific layouts
- Swipe actions
- Bottom navigation

### Phase 4 (Polish & Performance)
- Virtual scrolling for large lists
- Optimistic updates
- Offline support
- Real-time collaboration

---

**Last Updated:** 2025-09-30  
**Phase:** 2 (Advanced Features)  
**Status:** Complete

