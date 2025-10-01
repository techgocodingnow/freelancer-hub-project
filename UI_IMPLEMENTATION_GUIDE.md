# UI/UX Implementation Guide for Freelancer Hub
## Practical Code Examples & Component Patterns

---

## Table of Contents
1. [Command Palette Implementation](#1-command-palette)
2. [Enhanced Filtering System](#2-enhanced-filtering)
3. [Calendar View Component](#3-calendar-view)
4. [Timeline/Gantt View](#4-timeline-view)
5. [Bulk Actions System](#5-bulk-actions)
6. [Mobile-First Responsive Design](#6-responsive-design)
7. [Accessibility Patterns](#7-accessibility)
8. [Performance Optimizations](#8-performance)

---

## 1. Command Palette

### Implementation (Linear-inspired)

```typescript
// src/components/CommandPalette.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Input, List, Typography, Tag, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  SearchOutlined,
  PlusOutlined,
  FileOutlined,
  UserOutlined,
  SettingOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

interface Command {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  keywords: string[];
  action: () => void;
  category: 'navigation' | 'action' | 'create';
}

export const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // Define all available commands
  const commands: Command[] = useMemo(() => [
    {
      id: 'create-task',
      title: 'Create New Task',
      description: 'Add a new task to your project',
      icon: <PlusOutlined />,
      keywords: ['new', 'task', 'create', 'add'],
      action: () => navigate('/tasks/create'),
      category: 'create',
    },
    {
      id: 'create-project',
      title: 'Create New Project',
      description: 'Start a new project',
      icon: <FileOutlined />,
      keywords: ['new', 'project', 'create'],
      action: () => navigate('/projects/create'),
      category: 'create',
    },
    {
      id: 'go-tasks',
      title: 'Go to Tasks',
      icon: <FileOutlined />,
      keywords: ['tasks', 'go', 'navigate'],
      action: () => navigate('/tasks'),
      category: 'navigation',
    },
    {
      id: 'go-projects',
      title: 'Go to Projects',
      icon: <FileOutlined />,
      keywords: ['projects', 'go', 'navigate'],
      action: () => navigate('/projects'),
      category: 'navigation',
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: <SettingOutlined />,
      keywords: ['settings', 'preferences', 'config'],
      action: () => navigate('/settings'),
      category: 'navigation',
    },
  ], [navigate]);

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search) return commands;
    
    const searchLower = search.toLowerCase();
    return commands.filter(cmd =>
      cmd.title.toLowerCase().includes(searchLower) ||
      cmd.description?.toLowerCase().includes(searchLower) ||
      cmd.keywords.some(kw => kw.includes(searchLower))
    );
  }, [search, commands]);

  // Keyboard shortcut to open palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCommandSelect = (command: Command) => {
    command.action();
    setOpen(false);
    setSearch('');
  };

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      width={600}
      closable={false}
      bodyStyle={{ padding: 0 }}
      style={{ top: 100 }}
    >
      <Input
        size="large"
        placeholder="Type a command or search..."
        prefix={<SearchOutlined />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoFocus
        style={{ borderRadius: 0, border: 'none', borderBottom: '1px solid #f0f0f0' }}
      />
      
      <List
        dataSource={filteredCommands}
        style={{ maxHeight: 400, overflow: 'auto' }}
        renderItem={(command, index) => (
          <List.Item
            onClick={() => handleCommandSelect(command)}
            style={{
              cursor: 'pointer',
              padding: '12px 16px',
              backgroundColor: index === 0 ? '#f5f5f5' : 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Space>
              {command.icon}
              <div>
                <Text strong>{command.title}</Text>
                {command.description && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {command.description}
                    </Text>
                  </div>
                )}
              </div>
            </Space>
            <Tag>{command.category}</Tag>
          </List.Item>
        )}
        locale={{ emptyText: 'No commands found' }}
      />
      
      <div style={{ padding: '8px 16px', borderTop: '1px solid #f0f0f0', fontSize: 12, color: '#8c8c8c' }}>
        <Space split="•">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Close</span>
        </Space>
      </div>
    </Modal>
  );
};
```

### Usage

```typescript
// src/App.tsx
import { CommandPalette } from './components/CommandPalette';

function App() {
  return (
    <>
      <CommandPalette />
      {/* Rest of your app */}
    </>
  );
}
```

---

## 2. Enhanced Filtering System

### Advanced Filter Builder (Monday.com-inspired)

```typescript
// src/components/FilterBuilder.tsx
import React, { useState } from 'react';
import { Space, Select, Button, Input, DatePicker, Tag } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';

interface Filter {
  id: string;
  field: string;
  operator: string;
  value: any;
}

interface FilterBuilderProps {
  onFiltersChange: (filters: Filter[]) => void;
}

const FILTER_FIELDS = [
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Priority' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'dueDate', label: 'Due Date' },
  { value: 'createdAt', label: 'Created Date' },
];

const OPERATORS = {
  text: [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not Equals' },
  ],
  select: [
    { value: 'is', label: 'Is' },
    { value: 'isNot', label: 'Is Not' },
    { value: 'isAnyOf', label: 'Is Any Of' },
  ],
  date: [
    { value: 'is', label: 'Is' },
    { value: 'isBefore', label: 'Is Before' },
    { value: 'isAfter', label: 'Is After' },
    { value: 'isBetween', label: 'Is Between' },
  ],
};

export const FilterBuilder: React.FC<FilterBuilderProps> = ({ onFiltersChange }) => {
  const [filters, setFilters] = useState<Filter[]>([]);

  const addFilter = () => {
    const newFilter: Filter = {
      id: Date.now().toString(),
      field: 'status',
      operator: 'is',
      value: null,
    };
    const updated = [...filters, newFilter];
    setFilters(updated);
    onFiltersChange(updated);
  };

  const removeFilter = (id: string) => {
    const updated = filters.filter(f => f.id !== id);
    setFilters(updated);
    onFiltersChange(updated);
  };

  const updateFilter = (id: string, updates: Partial<Filter>) => {
    const updated = filters.map(f =>
      f.id === id ? { ...f, ...updates } : f
    );
    setFilters(updated);
    onFiltersChange(updated);
  };

  const renderValueInput = (filter: Filter) => {
    switch (filter.field) {
      case 'status':
        return (
          <Select
            style={{ width: 150 }}
            value={filter.value}
            onChange={(value) => updateFilter(filter.id, { value })}
            options={[
              { value: 'todo', label: 'To Do' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'review', label: 'Review' },
              { value: 'done', label: 'Done' },
            ]}
          />
        );
      
      case 'priority':
        return (
          <Select
            style={{ width: 150 }}
            value={filter.value}
            onChange={(value) => updateFilter(filter.id, { value })}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' },
            ]}
          />
        );
      
      case 'dueDate':
      case 'createdAt':
        return (
          <DatePicker
            value={filter.value}
            onChange={(date) => updateFilter(filter.id, { value: date })}
          />
        );
      
      default:
        return (
          <Input
            style={{ width: 150 }}
            value={filter.value}
            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
          />
        );
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {filters.map((filter) => (
        <Space key={filter.id}>
          <Select
            style={{ width: 120 }}
            value={filter.field}
            onChange={(value) => updateFilter(filter.id, { field: value })}
            options={FILTER_FIELDS}
          />
          
          <Select
            style={{ width: 120 }}
            value={filter.operator}
            onChange={(value) => updateFilter(filter.id, { operator: value })}
            options={OPERATORS.select}
          />
          
          {renderValueInput(filter)}
          
          <Button
            type="text"
            danger
            icon={<CloseOutlined />}
            onClick={() => removeFilter(filter.id)}
          />
        </Space>
      ))}
      
      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={addFilter}
        block
      >
        Add Filter
      </Button>
    </Space>
  );
};
```

---

## 3. Calendar View

### Full Calendar Implementation

```typescript
// src/pages/tasks/calendar.tsx
import React, { useState } from 'react';
import { Calendar, Badge, Modal, Typography, Space, Tag } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useList } from '@refinedev/core';

const { Title, Text } = Typography;

interface Task {
  id: number;
  title: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
}

export const TaskCalendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data } = useList<Task>({
    resource: 'tasks',
    pagination: { pageSize: 1000 },
  });

  const tasks = data?.data || [];

  const getTasksForDate = (date: Dayjs) => {
    return tasks.filter(task =>
      dayjs(task.dueDate).isSame(date, 'day')
    );
  };

  const getPriorityBadgeStatus = (priority: string) => {
    const statusMap: Record<string, any> = {
      urgent: 'error',
      high: 'warning',
      medium: 'processing',
      low: 'default',
    };
    return statusMap[priority] || 'default';
  };

  const dateCellRender = (value: Dayjs) => {
    const tasksForDay = getTasksForDate(value);
    
    if (tasksForDay.length === 0) return null;

    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {tasksForDay.slice(0, 3).map(task => (
          <li key={task.id} style={{ marginBottom: 2 }}>
            <Badge
              status={getPriorityBadgeStatus(task.priority)}
              text={
                <Text
                  ellipsis
                  style={{ fontSize: 11, maxWidth: 100 }}
                >
                  {task.title}
                </Text>
              }
            />
          </li>
        ))}
        {tasksForDay.length > 3 && (
          <li>
            <Text type="secondary" style={{ fontSize: 11 }}>
              +{tasksForDay.length - 3} more
            </Text>
          </li>
        )}
      </ul>
    );
  };

  const handleDateSelect = (date: Dayjs) => {
    const tasksForDay = getTasksForDate(date);
    if (tasksForDay.length > 0) {
      setSelectedDate(date);
      setModalOpen(true);
    }
  };

  const selectedTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Task Calendar</Title>
      
      <Calendar
        dateCellRender={dateCellRender}
        onSelect={handleDateSelect}
      />

      <Modal
        title={`Tasks for ${selectedDate?.format('MMMM D, YYYY')}`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {selectedTasks.map(task => (
            <div
              key={task.id}
              style={{
                padding: 12,
                border: '1px solid #f0f0f0',
                borderRadius: 4,
              }}
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong>{task.title}</Text>
                <Space>
                  <Tag color={getPriorityBadgeStatus(task.priority)}>
                    {task.priority}
                  </Tag>
                  <Tag>{task.status}</Tag>
                </Space>
              </Space>
            </div>
          ))}
        </Space>
      </Modal>
    </div>
  );
};
```

---

## 4. Timeline/Gantt View

### Basic Timeline Component

```typescript
// src/components/TaskTimeline.tsx
import React from 'react';
import { Timeline as AntTimeline, Card, Tag, Space, Typography } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

interface Task {
  id: number;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  createdAt: string;
}

interface TaskTimelineProps {
  tasks: Task[];
}

export const TaskTimeline: React.FC<TaskTimelineProps> = ({ tasks }) => {
  // Group tasks by date
  const groupedTasks = tasks.reduce((acc, task) => {
    const date = dayjs(task.dueDate).format('YYYY-MM-DD');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const sortedDates = Object.keys(groupedTasks).sort();

  return (
    <AntTimeline mode="left">
      {sortedDates.map(date => (
        <AntTimeline.Item
          key={date}
          label={dayjs(date).format('MMM D, YYYY')}
          dot={<ClockCircleOutlined />}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            {groupedTasks[date].map(task => (
              <Card
                key={task.id}
                size="small"
                hoverable
                style={{ width: 300 }}
              >
                <Space direction="vertical" size="small">
                  <Text strong>{task.title}</Text>
                  <Space>
                    <Tag color="blue">{task.status}</Tag>
                    <Tag color="orange">{task.priority}</Tag>
                  </Space>
                </Space>
              </Card>
            ))}
          </Space>
        </AntTimeline.Item>
      ))}
    </AntTimeline>
  );
};
```

---

## 5. Bulk Actions System

### Multi-Select with Bulk Operations

```typescript
// src/hooks/useBulkActions.ts
import { useState, useCallback } from 'react';
import { message } from 'antd';
import { useUpdate, useDelete } from '@refinedev/core';

export const useBulkActions = (resource: string) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const { mutate: update } = useUpdate();
  const { mutate: deleteMany } = useDelete();

  const bulkUpdate = useCallback(async (values: Record<string, any>) => {
    const promises = selectedIds.map(id =>
      new Promise((resolve, reject) => {
        update(
          { resource, id, values },
          {
            onSuccess: resolve,
            onError: reject,
          }
        );
      })
    );

    try {
      await Promise.all(promises);
      message.success(`Updated ${selectedIds.length} items`);
      setSelectedIds([]);
    } catch (error) {
      message.error('Failed to update some items');
    }
  }, [selectedIds, resource, update]);

  const bulkDelete = useCallback(async () => {
    const promises = selectedIds.map(id =>
      new Promise((resolve, reject) => {
        deleteMany(
          { resource, id },
          {
            onSuccess: resolve,
            onError: reject,
          }
        );
      })
    );

    try {
      await Promise.all(promises);
      message.success(`Deleted ${selectedIds.length} items`);
      setSelectedIds([]);
    } catch (error) {
      message.error('Failed to delete some items');
    }
  }, [selectedIds, resource, deleteMany]);

  return {
    selectedIds,
    setSelectedIds,
    bulkUpdate,
    bulkDelete,
    hasSelection: selectedIds.length > 0,
  };
};
```

### Bulk Actions Toolbar

```typescript
// src/components/BulkActionsToolbar.tsx
import React from 'react';
import { Space, Button, Select, Popconfirm } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: string) => void;
  onDelete: () => void;
  onClear: () => void;
}

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  onStatusChange,
  onPriorityChange,
  onDelete,
  onClear,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#fff',
        padding: '12px 24px',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
      }}
    >
      <Space size="middle">
        <span>{selectedCount} selected</span>
        
        <Select
          placeholder="Change status"
          style={{ width: 150 }}
          onChange={onStatusChange}
          options={[
            { value: 'todo', label: 'To Do' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'review', label: 'Review' },
            { value: 'done', label: 'Done' },
          ]}
        />
        
        <Select
          placeholder="Change priority"
          style={{ width: 150 }}
          onChange={onPriorityChange}
          options={[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'urgent', label: 'Urgent' },
          ]}
        />
        
        <Popconfirm
          title="Delete selected tasks?"
          onConfirm={onDelete}
          okText="Yes"
          cancelText="No"
        >
          <Button danger icon={<DeleteOutlined />}>
            Delete
          </Button>
        </Popconfirm>
        
        <Button onClick={onClear}>Clear Selection</Button>
      </Space>
    </div>
  );
};
```

---

## 6. Mobile-First Responsive Design

### Responsive Hook

```typescript
// src/hooks/useResponsive.ts
import { Grid } from 'antd';

const { useBreakpoint } = Grid;

export const useResponsive = () => {
  const screens = useBreakpoint();

  return {
    isMobile: screens.xs && !screens.sm,
    isTablet: screens.sm && !screens.md,
    isDesktop: screens.md,
    isLargeDesktop: screens.lg,
    screens,
  };
};
```

### Responsive Layout Component

```typescript
// src/components/ResponsiveTaskBoard.tsx
import React from 'react';
import { useResponsive } from '../hooks/useResponsive';
import { TaskKanban } from './TaskKanban';
import { TaskList } from './TaskList';

export const ResponsiveTaskBoard: React.FC = () => {
  const { isMobile } = useResponsive();

  // On mobile, show list view by default
  // On desktop, show kanban board
  return isMobile ? <TaskList /> : <TaskKanban />;
};
```

---

## 7. Accessibility Patterns

### Keyboard Navigation Hook

```typescript
// src/hooks/useKeyboardNavigation.ts
import { useEffect, useRef } from 'react';

interface UseKeyboardNavigationProps {
  items: any[];
  onSelect: (item: any) => void;
  enabled?: boolean;
}

export const useKeyboardNavigation = ({
  items,
  onSelect,
  enabled = true,
}: UseKeyboardNavigationProps) => {
  const selectedIndexRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          selectedIndexRef.current = Math.min(
            selectedIndexRef.current + 1,
            items.length - 1
          );
          break;
        
        case 'ArrowUp':
          e.preventDefault();
          selectedIndexRef.current = Math.max(
            selectedIndexRef.current - 1,
            0
          );
          break;
        
        case 'Enter':
          e.preventDefault();
          if (items[selectedIndexRef.current]) {
            onSelect(items[selectedIndexRef.current]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, onSelect, enabled]);

  return selectedIndexRef.current;
};
```

---

## 8. Performance Optimizations

### Virtualized List for Large Datasets

```typescript
// src/components/VirtualizedTaskList.tsx
import React from 'react';
import { List } from 'antd';
import { FixedSizeList } from 'react-window';

interface VirtualizedTaskListProps {
  tasks: any[];
  renderItem: (task: any) => React.ReactNode;
  itemHeight?: number;
}

export const VirtualizedTaskList: React.FC<VirtualizedTaskListProps> = ({
  tasks,
  renderItem,
  itemHeight = 80,
}) => {
  const Row = ({ index, style }: any) => (
    <div style={style}>
      {renderItem(tasks[index])}
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={tasks.length}
      itemSize={itemHeight}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

---

## Next Steps

1. **Integrate these components** into your existing codebase
2. **Test thoroughly** on different devices and screen sizes
3. **Gather user feedback** and iterate
4. **Monitor performance** metrics
5. **Continuously improve** based on usage patterns

For more details, refer to the main research document: `TASK_MANAGEMENT_UI_UX_RESEARCH.md`

