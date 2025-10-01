# Phase 3 & 4.1/4.2 Architecture Overview

## System Architecture

### High-Level Component Hierarchy

```
App.tsx (Root)
├── ColorModeContextProvider
├── TenantProvider
├── RefineWithTenant
│   ├── Task Views
│   │   ├── TaskList (Enhanced)
│   │   ├── TaskKanban
│   │   ├── TaskCalendar
│   │   └── TaskTimeline
│   └── Other Routes
├── CommandPalette (Phase 1)
├── MobileBottomNav (Phase 3) ← NEW
└── MobileFAB (Phase 3) ← NEW
```

---

## Phase 3: Mobile Optimization Architecture

### Component Structure

```
┌─────────────────────────────────────────────────────────┐
│                    App.tsx (Root)                       │
│  ┌───────────────────────────────────────────────────┐ │
│  │  MobileBottomNav (Conditional: isMobile)          │ │
│  │  - Fixed bottom position                          │ │
│  │  - 4 navigation items                             │ │
│  │  - Active state tracking                          │ │
│  └───────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────┐ │
│  │  MobileFAB (Conditional: isMobile)                │ │
│  │  - Fixed bottom-right position                    │ │
│  │  - Quick task creation                            │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Hook Dependencies

```
useMediaQuery (Base Hook)
├── useIsMobile
├── useIsTablet
├── useIsDesktop
└── useIsTouchDevice

useSwipeGesture (Touch Detection)
└── Used by: SwipeableTaskCard
```

### Data Flow - Mobile Components

```
User Action (Touch/Tap)
    ↓
useMediaQuery → Detects device type
    ↓
Conditional Rendering
    ├─ Mobile: MobileBottomNav + MobileFAB
    └─ Desktop: Standard Navigation
    ↓
User Interaction
    ├─ Tap Nav Item → Navigate to view
    ├─ Tap FAB → Create task
    └─ Swipe Task → Show actions
```

---

## Phase 4.1: Advanced Filtering Architecture

### Component Structure

```
TaskList Page
├── Header
│   ├── Filter Button (with badge)
│   └── Views Button
├── FilterChips (Active filters display)
├── BulkActionsToolbar
├── Task Table (with favorites column)
├── AdvancedFilterPanel (Drawer)
│   ├── Search Input
│   ├── Status Select
│   ├── Priority Select
│   ├── Assignee Select
│   ├── Date Range Picker
│   ├── Hours Range Input
│   ├── Favorites Checkbox
│   ├── Saved Filters List
│   └── Actions (Save, Clear, Apply)
└── SavedViewsPanel (Drawer)
```

### Hook Dependencies

```
useAdvancedFilters
├── State: criteria, savedFilters
├── Methods: updateCriteria, saveFilter, loadFilter
├── Computed: refineFilters, activeFilterCount
└── Storage: localStorage (per project)

useSavedViewsEnhanced
├── State: views, currentViewId
├── Methods: createView, loadView, deleteView
├── Computed: defaultView, favoriteViews
└── Storage: localStorage (per project)

useFavorites
├── State: favorites (Set<number>)
├── Methods: toggleFavorite, isFavorite
├── Computed: favoriteCount
└── Storage: localStorage (per project)
```

### Data Flow - Filtering

```
User Opens Filter Panel
    ↓
useAdvancedFilters Hook
    ├─ Load saved filters from localStorage
    └─ Initialize criteria state
    ↓
User Selects Filters
    ↓
updateCriteria() called
    ↓
criteria state updated
    ↓
refineFilters computed (useMemo)
    ↓
Passed to useList hook
    ↓
API Request with filters
    ↓
Task List Updated
    ↓
FilterChips Display Active Filters
```

### Data Flow - Saved Filters

```
User Applies Filters
    ↓
User Clicks "Save Current Filter"
    ↓
saveFilter(name) called
    ↓
Create SavedFilter object
    ├─ id: timestamp
    ├─ name: user input
    ├─ criteria: current criteria
    └─ createdAt: ISO string
    ↓
Add to savedFilters array
    ↓
Persist to localStorage
    ↓
Display in Saved Filters List
```

---

## Phase 4.2: Saved Views & Favorites Architecture

### Component Structure

```
SavedViewsPanel (Drawer)
├── Empty State (if no views)
├── Views List
│   └── For each view:
│       ├── View Name
│       ├── Tags (type, default, active)
│       ├── Star Button (favorite toggle)
│       └── Actions
│           ├── Load
│           ├── Set Default
│           ├── Duplicate
│           └── Delete
└── View Metadata (updated date)
```

### Data Flow - Saved Views

```
User Configures View
    ├─ Apply filters
    ├─ Set sort order
    └─ Adjust display settings
    ↓
User Saves View
    ↓
createView() called
    ↓
Create ViewConfiguration object
    ├─ id: timestamp
    ├─ name: user input
    ├─ viewType: current view
    ├─ filters: current criteria
    ├─ sortField: current sort
    ├─ sortOrder: current order
    ├─ displaySettings: current settings
    └─ timestamps
    ↓
Add to views array
    ↓
Persist to localStorage
    ↓
Display in Views Panel
```

### Data Flow - Loading Views

```
User Clicks "Load" on Saved View
    ↓
loadView(viewId) called
    ↓
Find view in views array
    ↓
Set currentViewId
    ↓
Return ViewConfiguration
    ↓
Apply to UI
    ├─ updateCriteria(view.filters)
    ├─ Set sort order
    └─ Apply display settings
    ↓
Task List Updates
```

### Data Flow - Favorites

```
User Clicks Star Icon
    ↓
toggleFavorite(taskId) called
    ↓
Check if taskId in favorites Set
    ├─ If yes: Remove from Set
    └─ If no: Add to Set
    ↓
Update favorites state
    ↓
Persist to localStorage
    ↓
UI Updates
    ├─ Star icon changes (outline ↔ filled)
    └─ favoriteCount updates
```

---

## State Management

### Local State (Component-level)

```typescript
// TaskList Component
const [filterPanelOpen, setFilterPanelOpen] = useState(false);
const [viewsPanelOpen, setViewsPanelOpen] = useState(false);
```

### Hook State (Shared via hooks)

```typescript
// useAdvancedFilters
const [criteria, setCriteria] = useState<FilterCriteria>({});
const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);

// useSavedViewsEnhanced
const [views, setViews] = useState<ViewConfiguration[]>([]);
const [currentViewId, setCurrentViewId] = useState<string | null>(null);

// useFavorites
const [favorites, setFavorites] = useState<Set<number>>(new Set());
```

### Persistent State (localStorage)

```typescript
// Storage Keys
'advanced_filters' → SavedFilter[]
'saved_views_enhanced_{projectId}' → ViewConfiguration[]
'favorite_tasks_{projectId}' → number[]
```

---

## API Integration

### Refine Integration

```typescript
// Task List with Filters
const { data } = useList<Task>({
  resource: `projects/${projectId}/tasks`,
  pagination: { pageSize: 50 },
  filters: advancedFilters.refineFilters, // ← Converted from criteria
});

// Filter Conversion
const toRefineFilters = (criteria: FilterCriteria): CrudFilters => {
  const filters: CrudFilters = [];
  
  if (criteria.status?.length > 0) {
    filters.push({
      field: 'status',
      operator: 'in' as const,
      value: criteria.status,
    });
  }
  
  // ... more conversions
  
  return filters;
};
```

---

## Responsive Behavior

### Breakpoint System

```typescript
// From tokens.breakpoints
xs: 480px   // Extra small (mobile portrait)
sm: 576px   // Small (mobile landscape)
md: 768px   // Medium (tablet portrait) ← Mobile/Desktop threshold
lg: 1024px  // Large (tablet landscape)
xl: 1280px  // Extra large (desktop)
```

### Conditional Rendering

```typescript
// Mobile-only components
{isMobile && <MobileBottomNav />}
{isMobile && <MobileFAB />}

// Desktop-only features
{!isMobile && (
  <>
    <Button icon={<FilterOutlined />}>Filters</Button>
    <Button icon={<EyeOutlined />}>Views</Button>
  </>
)}

// Responsive props
<Drawer
  placement={isMobile ? 'bottom' : 'right'}
  width={isMobile ? '100%' : 400}
  height={isMobile ? '80%' : undefined}
/>
```

---

## Performance Optimizations

### Memoization

```typescript
// Expensive computations
const refineFilters = useMemo(
  () => toRefineFilters(criteria),
  [criteria]
);

const activeFilterCount = useMemo(() => {
  // Count active filters
}, [criteria]);
```

### Callbacks

```typescript
// Prevent re-creation on every render
const handleFilterChange = useCallback((newCriteria) => {
  updateCriteria(newCriteria);
}, [updateCriteria]);
```

### Conditional Loading

```typescript
// Only render when needed
{filterPanelOpen && <AdvancedFilterPanel />}
{viewsPanelOpen && <SavedViewsPanel />}
```

---

## Error Handling

### LocalStorage Errors

```typescript
try {
  localStorage.setItem(key, JSON.stringify(data));
} catch (error) {
  console.error('Failed to save to localStorage:', error);
  // Fallback: Use in-memory storage
}
```

### Missing Data

```typescript
// Graceful degradation
const stored = localStorage.getItem(key);
const data = stored ? JSON.parse(stored) : []; // Default to empty array
```

### Invalid View Configuration

```typescript
const loadView = (viewId: string) => {
  const view = views.find(v => v.id === viewId);
  if (!view) {
    console.warn('View not found:', viewId);
    return null;
  }
  return view;
};
```

---

## Security Considerations

### LocalStorage Data

- ✅ No sensitive data stored
- ✅ Project-scoped storage keys
- ✅ User-specific data only
- ✅ No authentication tokens

### Input Validation

```typescript
// Validate filter criteria
if (criteria.estimatedHoursMin !== undefined && 
    criteria.estimatedHoursMin < 0) {
  console.warn('Invalid hours value');
  return;
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// Test hooks in isolation
describe('useAdvancedFilters', () => {
  it('should convert criteria to Refine filters', () => {
    // Test implementation
  });
});
```

### Integration Tests

```typescript
// Test component integration
describe('AdvancedFilterPanel', () => {
  it('should apply filters when clicking Apply', () => {
    // Test implementation
  });
});
```

### E2E Tests

```typescript
// Test user workflows
describe('Filter Workflow', () => {
  it('should save and load filters', () => {
    // Test implementation
  });
});
```

---

## Deployment Considerations

### Build Output

```bash
# Production build
npm run build

# Output
dist/
├── assets/
│   ├── index-[hash].js      # Main bundle
│   ├── vendor-[hash].js     # Dependencies
│   └── mobile-[hash].js     # Mobile components (code-split)
└── index.html
```

### Environment Variables

```bash
# Required
VITE_API_BASE_URL=https://api.example.com

# Optional
VITE_ENABLE_MOBILE_FEATURES=true
VITE_ENABLE_ADVANCED_FILTERS=true
```

---

## Monitoring & Analytics

### Performance Metrics

- Filter application time
- View load time
- LocalStorage usage
- Component render count

### User Metrics

- Mobile vs desktop usage
- Most-used filters
- Most-loaded views
- Favorite task count

---

## Future Enhancements

### Planned Improvements

1. **Backend Sync**
   - Sync saved filters/views across devices
   - Cloud storage for favorites

2. **Advanced Features**
   - Custom filter operators (AND/OR logic)
   - Filter templates
   - Shared views (team collaboration)

3. **Performance**
   - Virtual scrolling for large lists
   - Optimistic updates
   - Background sync

---

**Last Updated:** 2025-09-30  
**Version:** 1.0  
**Status:** Production Ready

