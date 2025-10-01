# Visual Design Specifications
## Freelancer Hub - Design System Reference

---

## Quick Reference

### Color Palette

```css
/* Primary Colors */
--primary-blue: #1890ff;
--primary-blue-hover: #40a9ff;
--primary-blue-active: #096dd9;

/* Status Colors */
--status-todo: #8c8c8c;
--status-in-progress: #1890ff;
--status-review: #faad14;
--status-done: #52c41a;

/* Priority Colors */
--priority-urgent: #ff4d4f;
--priority-high: #fa8c16;
--priority-medium: #1890ff;
--priority-low: #d9d9d9;

/* Semantic Colors */
--success: #52c41a;
--warning: #faad14;
--error: #ff4d4f;
--info: #1890ff;

/* Neutral Grays */
--gray-1: #ffffff;
--gray-2: #fafafa;
--gray-3: #f5f5f5;
--gray-4: #f0f0f0;
--gray-5: #d9d9d9;
--gray-6: #bfbfbf;
--gray-7: #8c8c8c;
--gray-8: #595959;
--gray-9: #434343;
--gray-10: #262626;
--gray-11: #1f1f1f;
--gray-12: #141414;

/* Dark Mode */
--dark-bg-1: #141414;
--dark-bg-2: #1f1f1f;
--dark-bg-3: #262626;
--dark-text-1: #ffffff;
--dark-text-2: #d9d9d9;
--dark-text-3: #8c8c8c;
```

### Typography Scale

```css
/* Font Families */
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
--font-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;

/* Font Sizes */
--text-xs: 11px;    /* Small labels, metadata */
--text-sm: 12px;    /* Secondary text */
--text-md: 14px;    /* Body text, default */
--text-lg: 16px;    /* Emphasized text */
--text-xl: 18px;    /* Subheadings */
--text-2xl: 20px;   /* Section titles */
--text-3xl: 24px;   /* Page titles */
--text-4xl: 30px;   /* Hero text */

/* Font Weights */
--weight-normal: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;

/* Line Heights */
--leading-tight: 1.2;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### Spacing System (8px Grid)

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
```

### Border Radius

```css
--radius-sm: 2px;
--radius-md: 4px;
--radius-lg: 6px;
--radius-xl: 8px;
--radius-2xl: 12px;
--radius-full: 9999px;
```

### Shadows

```css
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

### Transitions

```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-normal: 300ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 500ms cubic-bezier(0.4, 0, 0.2, 1);

/* Easing Functions */
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

---

## Component Specifications

### Task Card

```typescript
// Visual Specifications
{
  width: '100%',
  minHeight: '120px',
  padding: '12px',
  borderRadius: '6px',
  border: '1px solid #f0f0f0',
  borderLeft: '4px solid [priority-color]',
  backgroundColor: '#ffffff',
  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  
  // Hover State
  '&:hover': {
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    transform: 'translateY(-2px)',
    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  // Active/Dragging State
  '&:active': {
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    cursor: 'grabbing',
  }
}
```

### Kanban Column

```typescript
{
  width: '300px',
  minHeight: '500px',
  padding: '16px',
  backgroundColor: '#fafafa',
  borderRadius: '8px',
  
  // Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '2px solid [status-color]',
  },
  
  // Title
  title: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#262626',
  },
  
  // Count Badge
  count: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#8c8c8c',
    backgroundColor: '#f0f0f0',
    padding: '2px 8px',
    borderRadius: '12px',
  }
}
```

### Table Row

```typescript
{
  height: '48px',
  padding: '12px 16px',
  borderBottom: '1px solid #f0f0f0',
  
  // Hover State
  '&:hover': {
    backgroundColor: '#fafafa',
    cursor: 'pointer',
  },
  
  // Selected State
  '&.selected': {
    backgroundColor: '#e6f7ff',
  },
  
  // Overdue Row
  '&.overdue': {
    backgroundColor: '#fff1f0',
  }
}
```

### Button Styles

```typescript
// Primary Button
{
  height: '32px',
  padding: '4px 15px',
  fontSize: '14px',
  fontWeight: 500,
  borderRadius: '6px',
  backgroundColor: '#1890ff',
  color: '#ffffff',
  border: 'none',
  
  '&:hover': {
    backgroundColor: '#40a9ff',
  },
  
  '&:active': {
    backgroundColor: '#096dd9',
  }
}

// Secondary Button
{
  backgroundColor: 'transparent',
  color: '#1890ff',
  border: '1px solid #d9d9d9',
  
  '&:hover': {
    color: '#40a9ff',
    borderColor: '#40a9ff',
  }
}

// Danger Button
{
  backgroundColor: '#ff4d4f',
  color: '#ffffff',
  
  '&:hover': {
    backgroundColor: '#ff7875',
  }
}
```

### Tag/Badge Styles

```typescript
// Priority Tags
{
  urgent: {
    backgroundColor: '#fff1f0',
    color: '#ff4d4f',
    border: '1px solid #ffccc7',
  },
  high: {
    backgroundColor: '#fff7e6',
    color: '#fa8c16',
    border: '1px solid #ffd591',
  },
  medium: {
    backgroundColor: '#e6f7ff',
    color: '#1890ff',
    border: '1px solid #91d5ff',
  },
  low: {
    backgroundColor: '#fafafa',
    color: '#8c8c8c',
    border: '1px solid #d9d9d9',
  }
}

// Status Tags
{
  todo: {
    backgroundColor: '#fafafa',
    color: '#595959',
  },
  in_progress: {
    backgroundColor: '#e6f7ff',
    color: '#1890ff',
  },
  review: {
    backgroundColor: '#fffbe6',
    color: '#faad14',
  },
  done: {
    backgroundColor: '#f6ffed',
    color: '#52c41a',
  }
}
```

---

## Layout Specifications

### Page Layout

```typescript
{
  // Container
  maxWidth: '1440px',
  margin: '0 auto',
  padding: '24px',
  
  // Header
  header: {
    height: '64px',
    padding: '0 24px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #f0f0f0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  
  // Sidebar
  sidebar: {
    width: '240px',
    backgroundColor: '#fafafa',
    borderRight: '1px solid #f0f0f0',
    padding: '24px 16px',
  },
  
  // Main Content
  main: {
    flex: 1,
    padding: '24px',
    minHeight: 'calc(100vh - 64px)',
  }
}
```

### Grid System

```typescript
// Kanban Board Grid
{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '16px',
  
  // Responsive
  '@media (max-width: 768px)': {
    gridTemplateColumns: '1fr',
  }
}

// Card Grid
{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '16px',
}
```

---

## Responsive Breakpoints

```typescript
const breakpoints = {
  xs: '480px',   // Mobile
  sm: '576px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '992px',   // Desktop
  xl: '1200px',  // Large desktop
  xxl: '1600px', // Extra large
};

// Usage in media queries
@media (max-width: 768px) {
  // Tablet and mobile styles
}

@media (min-width: 769px) and (max-width: 1199px) {
  // Desktop styles
}

@media (min-width: 1200px) {
  // Large desktop styles
}
```

---

## Icon Usage Guidelines

### Icon Sizes

```typescript
{
  xs: '12px',  // Inline with small text
  sm: '14px',  // Inline with body text
  md: '16px',  // Default, buttons
  lg: '20px',  // Headers, emphasis
  xl: '24px',  // Large buttons, features
  '2xl': '32px', // Hero sections
}
```

### Common Icons (Ant Design)

```typescript
import {
  // Actions
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
  
  // Navigation
  ArrowLeftOutlined,
  ArrowRightOutlined,
  MenuOutlined,
  HomeOutlined,
  
  // Status
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  
  // Task Management
  FlagOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  TeamOutlined,
  
  // Views
  AppstoreOutlined,
  UnorderedListOutlined,
  TableOutlined,
  
  // Misc
  SearchOutlined,
  FilterOutlined,
  SettingOutlined,
  MoreOutlined,
} from '@ant-design/icons';
```

---

## Animation Guidelines

### Micro-interactions

```typescript
// Hover Effects
{
  transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  }
}

// Click/Active Effects
{
  '&:active': {
    transform: 'scale(0.98)',
    transition: 'transform 100ms',
  }
}

// Loading States
{
  '@keyframes pulse': {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 },
  },
  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
}

// Slide In
{
  '@keyframes slideIn': {
    from: {
      transform: 'translateX(-100%)',
      opacity: 0,
    },
    to: {
      transform: 'translateX(0)',
      opacity: 1,
    },
  },
  animation: 'slideIn 300ms cubic-bezier(0.4, 0, 0.2, 1)',
}
```

### Drag and Drop Animations

```typescript
{
  // Dragging Item
  dragging: {
    opacity: 0.5,
    cursor: 'grabbing',
    transform: 'rotate(3deg)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
  },
  
  // Drop Zone
  dropZone: {
    backgroundColor: '#e6f7ff',
    border: '2px dashed #1890ff',
    transition: 'all 200ms',
  },
  
  // Drop Animation
  dropped: {
    '@keyframes drop': {
      '0%': { transform: 'scale(1.1)' },
      '50%': { transform: 'scale(0.95)' },
      '100%': { transform: 'scale(1)' },
    },
    animation: 'drop 300ms cubic-bezier(0.4, 0, 0.2, 1)',
  }
}
```

---

## Accessibility Specifications

### Focus States

```css
/* Keyboard Focus */
*:focus-visible {
  outline: 2px solid #1890ff;
  outline-offset: 2px;
  border-radius: 4px;
}

/* Remove default outline */
*:focus {
  outline: none;
}

/* Focus within containers */
.container:focus-within {
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.2);
}
```

### Color Contrast Ratios

```
Minimum contrast ratios (WCAG AA):
- Normal text: 4.5:1
- Large text (18px+): 3:1
- UI components: 3:1

Examples:
✅ #1890ff on #ffffff = 4.54:1 (Pass)
✅ #262626 on #ffffff = 12.63:1 (Pass)
✅ #52c41a on #ffffff = 3.04:1 (Pass for large text)
❌ #d9d9d9 on #ffffff = 1.42:1 (Fail)
```

### Touch Targets

```typescript
{
  // Minimum touch target size
  minWidth: '44px',
  minHeight: '44px',
  
  // Spacing between targets
  margin: '8px',
  
  // Mobile-specific
  '@media (max-width: 768px)': {
    minWidth: '48px',
    minHeight: '48px',
  }
}
```

---

## Dark Mode Specifications

### Color Adjustments

```css
/* Dark Mode Palette */
[data-theme='dark'] {
  --bg-primary: #141414;
  --bg-secondary: #1f1f1f;
  --bg-tertiary: #262626;
  
  --text-primary: #ffffff;
  --text-secondary: #d9d9d9;
  --text-tertiary: #8c8c8c;
  
  --border-color: #434343;
  
  /* Adjust component colors */
  --card-bg: #1f1f1f;
  --card-border: #434343;
  
  /* Reduce shadow intensity */
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
}
```

---

## Print Styles

```css
@media print {
  /* Hide UI elements */
  .no-print,
  header,
  nav,
  .sidebar,
  button {
    display: none !important;
  }
  
  /* Optimize for print */
  body {
    font-size: 12pt;
    line-height: 1.5;
    color: #000;
    background: #fff;
  }
  
  /* Page breaks */
  .task-card {
    page-break-inside: avoid;
  }
  
  /* Remove shadows and backgrounds */
  * {
    box-shadow: none !important;
    background: transparent !important;
  }
}
```

---

## Performance Guidelines

### CSS Best Practices

```css
/* Use CSS containment for performance */
.task-card {
  contain: layout style paint;
}

/* Use will-change sparingly */
.draggable:hover {
  will-change: transform;
}

/* Optimize animations */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Image Optimization

```typescript
{
  // Avatar images
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover',
    loading: 'lazy',
  },
  
  // Thumbnail images
  thumbnail: {
    width: '120px',
    height: '80px',
    objectFit: 'cover',
    loading: 'lazy',
  }
}
```

---

## Quick Implementation Checklist

- [ ] Set up design tokens in theme configuration
- [ ] Implement color system with status and priority colors
- [ ] Configure typography scale
- [ ] Set up spacing system (8px grid)
- [ ] Add shadow and border radius utilities
- [ ] Configure transitions and animations
- [ ] Implement dark mode toggle
- [ ] Add responsive breakpoints
- [ ] Ensure accessibility (focus states, ARIA labels)
- [ ] Optimize for performance (lazy loading, code splitting)
- [ ] Test on multiple devices and browsers
- [ ] Validate color contrast ratios
- [ ] Add print styles
- [ ] Document component variations

---

**For complete implementation details, see:**
- `TASK_MANAGEMENT_UI_UX_RESEARCH.md` - Full platform analysis
- `UI_IMPLEMENTATION_GUIDE.md` - Code examples and patterns

