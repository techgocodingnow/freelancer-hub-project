# Phase 2 Developer Guide

## Quick Reference for Phase 2 Features

This guide provides code examples and usage patterns for developers working with Phase 2 features.

---

## Table of Contents
1. [Calendar View](#calendar-view)
2. [Timeline View](#timeline-view)
3. [Bulk Actions](#bulk-actions)
4. [Enhanced Kanban](#enhanced-kanban)
5. [Common Patterns](#common-patterns)

---

## Calendar View

### Basic Usage

```typescript
import { TaskCalendar } from './pages/tasks/calendar';

// In your route configuration
<Route path="calendar" element={<TaskCalendar />} />
```

### Customizing Event Colors

The calendar uses `getPriorityColor()` from the theme system:

```typescript
import { getPriorityColor, getStatusColor } from '../../theme';

const eventStyleGetter = (event: CalendarEvent) => {
  const task = event.resource;
  const priorityColor = getPriorityColor(task.priority);
  
  return {
    style: {
      backgroundColor: `${priorityColor}20`, // 20% opacity
      borderLeft: `4px solid ${priorityColor}`,
      color: tokens.colors.text.primary,
    },
  };
};
```

### Adding Custom Views

To add a custom view (e.g., "Work Week"):

```typescript
import { Views } from 'react-big-calendar';

<Calendar
  views={['month', 'week', 'day', 'agenda', 'work_week']}
  view={view}
  onView={setView}
  // ... other props
/>
```

### Filtering Calendar Events

```typescript
const filteredEvents = useMemo(() => {
  return events.filter(event => {
    // Example: Only show high priority tasks
    return event.resource.priority === 'high';
  });
}, [events]);
```

---

## Timeline View

### Basic Usage

```typescript
import { TaskTimeline } from './pages/tasks/timeline';

// In your route configuration
<Route path="timeline" element={<TaskTimeline />} />
```

### Custom Date Grouping

The timeline groups tasks by due date. To customize grouping:

```typescript
// Group by week instead of day
const groupedTasks = useMemo(() => {
  const groups: GroupedTasks = {};
  
  filteredTasks.forEach((task) => {
    if (!task.dueDate) return;
    
    const weekStart = startOfWeek(parseISO(task.dueDate));
    const weekKey = format(weekStart, 'yyyy-MM-dd');
    
    if (!groups[weekKey]) {
      groups[weekKey] = [];
    }
    groups[weekKey].push(task);
  });
  
  return groups;
}, [filteredTasks]);
```

### Adding Export Functionality

To export timeline data:

```typescript
import { saveAs } from 'file-saver';

const exportTimeline = () => {
  const data = sortedDates.map(date => ({
    date,
    tasks: groupedTasks[date].map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
    })),
  }));
  
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  saveAs(blob, 'timeline-export.json');
};
```

---

## Bulk Actions

### Basic Usage

```typescript
import { useBulkActions } from '../../hooks/useBulkActions';
import { BulkActionsToolbar } from '../../components/tasks/BulkActionsToolbar';

const MyComponent = () => {
  const bulkActions = useBulkActions({
    resource: `projects/${projectId}/tasks`,
    onSuccess: refetch,
    onError: (error) => console.error(error),
  });
  
  return (
    <>
      <BulkActionsToolbar
        selectedCount={bulkActions.selectedCount}
        isProcessing={bulkActions.isProcessing}
        onClearSelection={bulkActions.clearSelection}
        onUpdateStatus={bulkActions.bulkUpdateStatus}
        onUpdatePriority={bulkActions.bulkUpdatePriority}
        onAssign={bulkActions.bulkAssign}
        onDelete={bulkActions.bulkDelete}
        users={users}
      />
      
      <Table
        rowSelection={{
          selectedRowKeys: bulkActions.selectedIds,
          onChange: (keys) => bulkActions.selectAll(keys as number[]),
        }}
        // ... other props
      />
    </>
  );
};
```

### Custom Bulk Operations

To add a custom bulk operation:

```typescript
// In useBulkActions.ts
const bulkArchive = useCallback(async () => {
  if (selectedIds.length === 0) {
    message.warning('No tasks selected');
    return;
  }
  
  setIsProcessing(true);
  const hideLoading = message.loading(`Archiving ${selectedIds.length} task(s)...`, 0);
  
  try {
    const promises = selectedIds.map((id) =>
      new Promise((resolve, reject) => {
        updateTask(
          {
            resource: options.resource,
            id,
            values: { archived: true },
          },
          {
            onSuccess: resolve,
            onError: reject,
          }
        );
      })
    );
    
    await Promise.all(promises);
    hideLoading();
    message.success(`Successfully archived ${selectedIds.length} task(s)`);
    clearSelection();
    options.onSuccess?.();
  } catch (error: any) {
    hideLoading();
    message.error(error?.message || 'Failed to archive tasks');
    options.onError?.(error);
  } finally {
    setIsProcessing(false);
  }
}, [selectedIds, updateTask, options, clearSelection]);

// Return in hook
return {
  // ... existing returns
  bulkArchive,
};
```

### Adding to Toolbar

```typescript
// In BulkActionsToolbar.tsx
<Button
  icon={<InboxOutlined />}
  onClick={onArchive}
  disabled={isProcessing}
>
  Archive
</Button>
```

---

## Enhanced Kanban

### Using WIP Limits

```typescript
import { DroppableColumn } from '../../components/tasks/DroppableColumn';

<DroppableColumn
  id="in_progress"
  title="In Progress"
  count={inProgressTasks.length}
  color="#1890ff"
  wipLimit={5} // Set WIP limit
>
  {/* Task cards */}
</DroppableColumn>
```

### Customizing Drop Zone Feedback

Edit `DroppableColumn.tsx`:

```typescript
<Card
  style={{
    backgroundColor: isOver 
      ? `${color}25` // Increase opacity for stronger feedback
      : tokens.colors.background.paper,
    border: isOver 
      ? `3px dashed ${color}` // Thicker border
      : `1px solid ${tokens.colors.border.default}`,
    // ... other styles
  }}
>
```

### Adding Column Actions

```typescript
// In DroppableColumn.tsx header
<div style={{ display: 'flex', gap: tokens.spacing[2] }}>
  <Button
    type="text"
    size="small"
    icon={<SettingOutlined />}
    onClick={() => handleColumnSettings(id)}
  />
  <Button
    type="text"
    size="small"
    icon={isCollapsed ? <DownOutlined /> : <UpOutlined />}
    onClick={() => setIsCollapsed(!isCollapsed)}
  />
</div>
```

---

## Common Patterns

### Fetching Tasks with Filters

```typescript
const { result: data, query: { isLoading, refetch } } = useList<Task>({
  resource: `projects/${projectId}/tasks`,
  pagination: {
    pageSize: 1000,
  },
  filters: [
    { field: 'status', operator: 'eq' as const, value: 'in_progress' },
    { field: 'priority', operator: 'in' as const, value: ['high', 'urgent'] },
  ],
  sorters: [
    { field: 'dueDate', order: 'asc' },
  ],
});
```

### Navigation Between Views

```typescript
import { useGo } from '@refinedev/core';
import { useTenantSlug } from '../../contexts/tenant';

const go = useGo();
const tenantSlug = useTenantSlug();

// Navigate to calendar view
go({
  to: `/tenants/${tenantSlug}/projects/${projectId}/tasks/calendar`,
  type: 'push',
});

// Navigate to timeline view
go({
  to: `/tenants/${tenantSlug}/projects/${projectId}/tasks/timeline`,
  type: 'push',
});
```

### Using Design Tokens

```typescript
import { tokens, getPriorityColor, getStatusColor } from '../../theme';

// Colors
const bgColor = tokens.colors.background.paper;
const textColor = tokens.colors.text.primary;
const priorityColor = getPriorityColor('high'); // #fa8c16
const statusColor = getStatusColor('in_progress'); // #1890ff

// Spacing
const padding = tokens.spacing[4]; // 16px
const margin = tokens.spacing[6]; // 24px

// Typography
const fontSize = tokens.typography.fontSize.md; // 14px
const fontWeight = tokens.typography.fontWeight.semibold; // 600

// Effects
const shadow = tokens.shadows.md;
const transition = tokens.transitions.normal; // 300ms
const borderRadius = tokens.borderRadius.lg; // 12px
```

### Error Handling

```typescript
try {
  await someAsyncOperation();
  message.success('Operation completed successfully');
} catch (error: any) {
  console.error('Operation failed:', error);
  message.error(error?.message || 'An error occurred');
}
```

### Loading States

```typescript
const [isLoading, setIsLoading] = useState(false);

const handleAction = async () => {
  setIsLoading(true);
  const hideLoading = message.loading('Processing...', 0);
  
  try {
    await someAsyncOperation();
    hideLoading();
    message.success('Success!');
  } catch (error) {
    hideLoading();
    message.error('Failed!');
  } finally {
    setIsLoading(false);
  }
};
```

### Memoization for Performance

```typescript
// Expensive computation
const processedData = useMemo(() => {
  return tasks.map(task => ({
    ...task,
    formattedDate: format(parseISO(task.dueDate), 'MMM dd, yyyy'),
  }));
}, [tasks]);

// Event handlers
const handleClick = useCallback((id: number) => {
  console.log('Clicked:', id);
}, []);
```

---

## TypeScript Tips

### Extending Task Interface

```typescript
// In your component file
interface ExtendedTask extends Task {
  customField: string;
  calculatedValue: number;
}

const tasks = data?.data as ExtendedTask[];
```

### Type-Safe Event Handlers

```typescript
const handleStatusChange = (status: Task['status']) => {
  // status is typed as 'todo' | 'in_progress' | 'review' | 'done'
  bulkActions.bulkUpdateStatus(status);
};
```

### Generic Components

```typescript
interface GenericListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function GenericList<T>({ items, renderItem }: GenericListProps<T>) {
  return <>{items.map(renderItem)}</>;
}
```

---

## Debugging Tips

### Enable React DevTools Profiler

```bash
# In development
npm run dev
# Open React DevTools → Profiler tab
# Record interactions to find performance bottlenecks
```

### Log Refine Queries

```typescript
const { result: data, query } = useList<Task>({
  resource: `projects/${projectId}/tasks`,
  // ... config
});

console.log('Query status:', query.status);
console.log('Query data:', query.data);
console.log('Query error:', query.error);
```

### Debug Bulk Actions

```typescript
const bulkActions = useBulkActions({
  resource: `projects/${projectId}/tasks`,
  onSuccess: () => {
    console.log('Bulk action succeeded');
    refetch();
  },
  onError: (error) => {
    console.error('Bulk action failed:', error);
  },
});

console.log('Selected IDs:', bulkActions.selectedIds);
console.log('Is processing:', bulkActions.isProcessing);
```

---

## Best Practices

1. **Always use design tokens** instead of hardcoded values
2. **Memoize expensive computations** with `useMemo`
3. **Memoize callbacks** with `useCallback`
4. **Handle loading and error states** for all async operations
5. **Use TypeScript strictly** - avoid `any` when possible
6. **Test in both light and dark modes**
7. **Test responsive behavior** at different screen sizes
8. **Add ARIA labels** for accessibility
9. **Use semantic HTML** (proper heading hierarchy)
10. **Keep components focused** - single responsibility principle

---

## Resources

- [React Big Calendar Docs](https://jquense.github.io/react-big-calendar/)
- [date-fns Docs](https://date-fns.org/)
- [Ant Design Components](https://ant.design/components/overview/)
- [Refine Hooks](https://refine.dev/docs/api-reference/core/hooks/)
- [DnD Kit Docs](https://docs.dndkit.com/)

---

## Support

For questions or issues:
1. Check the testing guide for common problems
2. Review the implementation summary for architecture details
3. Consult the UI/UX research document for design decisions
4. Check browser console for errors
5. Use React DevTools to inspect component state

---

**Last Updated:** 2025-09-30  
**Phase:** 2 (Advanced Features)

