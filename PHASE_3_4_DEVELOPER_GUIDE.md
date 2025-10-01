# Phase 3 & 4.1/4.2 Developer Guide

## Overview

Technical guide for developers working with Phase 3 (Mobile Optimization) and Phase 4.1/4.2 (Advanced Filtering, Saved Views, Favorites) features.

---

## Architecture Overview

### State Management (Zustand)

**NEW:** The application now uses Zustand for centralized state management.

```
┌─────────────────────────────────────────┐
│         Zustand Stores                  │
│  ┌─────────────────────────────────┐   │
│  │  filterStore (Global)           │   │
│  │  viewStore (Per-Project)        │   │
│  │  favoriteStore (Per-Project)    │   │
│  │  uiStore (Global)               │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
         │
         ├─ Persist Middleware (localStorage)
         ├─ Selectors (Optimized re-renders)
         └─ Wrapper Hooks (Backward compatibility)
```

### Phase 3: Mobile Optimization

```
┌─────────────────────────────────────────┐
│           App.tsx (Root)                │
│  ┌─────────────────────────────────┐   │
│  │  MobileBottomNav (Global)       │   │
│  │  MobileFAB (Global)             │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
         │
         ├─ useMediaQuery (Breakpoints)
         ├─ useSwipeGesture (Touch)
         └─ SwipeableTaskCard (Component)
```

### Phase 4.1/4.2: Filtering & Views

```
┌─────────────────────────────────────────┐
│         Task List Page                  │
│  ┌─────────────────────────────────┐   │
│  │  AdvancedFilterPanel            │   │
│  │  FilterChips                    │   │
│  │  SavedViewsPanel                │   │
│  │  Task Table (with Favorites)    │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
         │
         ├─ useAdvancedFilters (Zustand wrapper)
         ├─ useSavedViewsEnhanced (Zustand wrapper)
         ├─ useFavorites (Zustand wrapper)
         └─ useUIStore (Direct Zustand)
```

---

## Phase 3: Mobile Optimization

### 1. useMediaQuery Hook

**Purpose:** Detect responsive breakpoints and device capabilities

**Implementation:**

```typescript
// src/hooks/useMediaQuery.ts
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
};

// Convenience hooks
export const useIsMobile = () =>
  useMediaQuery(`(max-width: ${tokens.breakpoints.md}px)`);

export const useIsTablet = () =>
  useMediaQuery(
    `(min-width: ${tokens.breakpoints.md}px) and (max-width: ${tokens.breakpoints.lg}px)`
  );

export const useIsDesktop = () =>
  useMediaQuery(`(min-width: ${tokens.breakpoints.lg}px)`);

export const useIsTouchDevice = () =>
  useMediaQuery("(hover: none) and (pointer: coarse)");
```

**Usage:**

```typescript
import { useIsMobile, useIsTouchDevice } from "../../hooks/useMediaQuery";

const MyComponent = () => {
  const isMobile = useIsMobile();
  const isTouch = useIsTouchDevice();

  return (
    <div>
      {isMobile ? <MobileView /> : <DesktopView />}
      {isTouch && <TouchOptimizedControls />}
    </div>
  );
};
```

**Best Practices:**

- Use semantic hooks (`useIsMobile`) instead of raw `useMediaQuery`
- Avoid excessive re-renders by memoizing components
- Test on real devices, not just browser DevTools

---

### 2. useSwipeGesture Hook

**Purpose:** Detect swipe gestures on touch devices

**Implementation:**

```typescript
// src/hooks/useSwipeGesture.ts
interface SwipeInput {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  minSwipeDistance?: number;
}

export const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  minSwipeDistance = 50,
}: SwipeInput) => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(
    null
  );

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const deltaX = e.changedTouches[0].clientX - touchStart.x;
    const deltaY = e.changedTouches[0].clientY - touchStart.y;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) onSwipeRight?.();
        else onSwipeLeft?.();
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > minSwipeDistance) {
        if (deltaY > 0) onSwipeDown?.();
        else onSwipeUp?.();
      }
    }

    setTouchStart(null);
  };

  return { onTouchStart, onTouchMove: () => {}, onTouchEnd };
};
```

**Usage:**

```typescript
const swipeHandlers = useSwipeGesture({
  onSwipeLeft: () => console.log("Swiped left"),
  onSwipeRight: () => console.log("Swiped right"),
  minSwipeDistance: 50,
});

<div {...swipeHandlers}>Swipeable content</div>;
```

**Best Practices:**

- Set appropriate `minSwipeDistance` (50-100px recommended)
- Prevent default scroll behavior if needed
- Provide visual feedback during swipe
- Test on various devices (iOS, Android)

---

### 3. MobileBottomNav Component

**Purpose:** Bottom navigation bar for mobile devices

**Key Features:**

- Fixed positioning with safe area insets
- Active view highlighting
- Touch-friendly 44x44px targets
- Auto-hides on desktop

**Implementation Highlights:**

```typescript
const MobileBottomNav = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const go = useGo();

  if (!isMobile) return null; // Hide on desktop

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "60px",
        paddingBottom: "env(safe-area-inset-bottom)", // Notch support
        zIndex: tokens.zIndex.modal,
      }}
    >
      {/* Navigation items */}
    </div>
  );
};
```

**Customization:**

- Modify `navItems` array to add/remove views
- Adjust colors via design tokens
- Change icon set if needed

---

### 4. SwipeableTaskCard Component

**Purpose:** Task card with swipe-to-action gestures

**State Management:**

```typescript
const [isActionsVisible, setIsActionsVisible] = useState(false);
const [translateX, setTranslateX] = useState(0);

const swipeHandlers = useSwipeGesture({
  onSwipeLeft: () => setIsActionsVisible(true),
  onSwipeRight: () => setIsActionsVisible(false),
});
```

**Animation:**

```typescript
<div
  style={{
    transform: `translateX(${isActionsVisible ? -120 : 0}px)`,
    transition: "transform 0.3s ease",
  }}
>
  {/* Task content */}
</div>
```

**Best Practices:**

- Keep action buttons simple (2-3 max)
- Use clear icons and colors
- Provide haptic feedback on mobile (if available)
- Test swipe sensitivity

---

## Phase 4.1: Advanced Filtering

### 1. useAdvancedFilters Hook

**Purpose:** Manage complex filtering logic with multiple criteria

**State Structure:**

```typescript
interface FilterCriteria {
  status?: string[];
  priority?: string[];
  assigneeId?: number[];
  dueDateFrom?: string;
  dueDateTo?: string;
  estimatedHoursMin?: number;
  estimatedHoursMax?: number;
  searchText?: string;
  tags?: string[];
  isFavorite?: boolean;
}
```

**Converting to Refine Filters:**

```typescript
const toRefineFilters = (criteria: FilterCriteria): CrudFilters => {
  const filters: CrudFilters = [];

  if (criteria.status && criteria.status.length > 0) {
    filters.push({
      field: "status",
      operator: "in" as const,
      value: criteria.status,
    });
  }

  // ... more filters

  return filters;
};
```

**Usage:**

```typescript
const advancedFilters = useAdvancedFilters();

const { data } = useList({
  resource: "tasks",
  filters: advancedFilters.refineFilters, // Auto-converts criteria
});

// Update criteria
advancedFilters.updateCriteria({ status: ["todo", "in_progress"] });

// Save filter
advancedFilters.saveFilter("My Filter");

// Load filter
advancedFilters.loadFilter(filterId);
```

**Best Practices:**

- Use `as const` for operator types
- Validate criteria before applying
- Debounce search text input
- Persist to localStorage for user convenience

---

### 2. AdvancedFilterPanel Component

**Purpose:** UI for configuring advanced filters

**Props Interface:**

```typescript
interface AdvancedFilterPanelProps {
  open: boolean;
  onClose: () => void;
  criteria: FilterCriteria;
  onCriteriaChange: (criteria: Partial<FilterCriteria>) => void;
  onClear: () => void;
  savedFilters: SavedFilter[];
  onSaveFilter: (name: string) => void;
  onLoadFilter: (filterId: string) => void;
  onDeleteFilter: (filterId: string) => void;
  users?: Array<{ id: number; fullName: string }>;
}
```

**Responsive Behavior:**

```typescript
const isMobile = useIsMobile();

<Drawer
  placement={isMobile ? "bottom" : "right"}
  width={isMobile ? "100%" : 400}
  height={isMobile ? "80%" : undefined}
>
  {/* Filter controls */}
</Drawer>;
```

**Best Practices:**

- Group related filters together
- Provide clear labels and placeholders
- Show active filter count
- Allow clearing individual filters

---

### 3. FilterChips Component

**Purpose:** Visual representation of active filters

**Dynamic Chip Generation:**

```typescript
const chips: Array<{ key: keyof FilterCriteria; label: string }> = [];

if (criteria.status && criteria.status.length > 0) {
  chips.push({
    key: "status",
    label: `Status: ${criteria.status.join(", ")}`,
  });
}

// ... more chips

return (
  <Space wrap>
    {chips.map((chip) => (
      <Tag key={chip.key} closable onClose={() => onRemove(chip.key)}>
        {chip.label}
      </Tag>
    ))}
  </Space>
);
```

**Best Practices:**

- Keep chip text concise
- Use consistent formatting
- Provide "Clear all" option
- Auto-hide when no filters

---

## Phase 4.2: Saved Views & Favorites

### 1. useSavedViewsEnhanced Hook

**Purpose:** Manage complete view configurations

**View Configuration:**

```typescript
interface ViewConfiguration {
  id: string;
  name: string;
  viewType: "list" | "kanban" | "calendar" | "timeline";
  filters: FilterCriteria;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  displaySettings?: {
    visibleColumns?: string[];
    columnOrder?: string[];
    kanbanCollapsed?: string[];
  };
  isDefault?: boolean;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}
```

**Creating a View:**

```typescript
const savedViews = useSavedViewsEnhanced(projectId);

const viewId = savedViews.createView({
  name: "My Active Tasks",
  viewType: "list",
  filters: advancedFilters.criteria,
  sortField: "dueDate",
  sortOrder: "asc",
});
```

**Loading a View:**

```typescript
const view = savedViews.loadView(viewId);
if (view) {
  advancedFilters.updateCriteria(view.filters);
  // Apply sort, display settings, etc.
}
```

**Best Practices:**

- Use project-specific storage keys
- Validate view configuration before saving
- Handle missing/corrupted data gracefully
- Provide migration path for schema changes

---

### 2. useFavorites Hook

**Purpose:** Simple favorite task management

**Implementation:**

```typescript
const favorites = useFavorites(projectId);

// Toggle favorite
favorites.toggleFavorite(taskId);

// Check if favorite
const isFav = favorites.isFavorite(taskId);

// Get all favorites
const favIds = favorites.getFavoriteIds();
```

**Integration with Filtering:**

```typescript
// Filter by favorites
advancedFilters.updateCriteria({ isFavorite: true });

// Or manually filter
const favoriteTasks = tasks.filter((task) => favorites.isFavorite(task.id));
```

**Best Practices:**

- Use Set for O(1) lookups
- Persist to localStorage
- Sync with backend (optional)
- Handle large favorite lists efficiently

---

## Integration Patterns

### Pattern 1: Combining Hooks

```typescript
const TaskListPage = () => {
  const { projectId } = useParams();
  const isMobile = useIsMobile();

  // Filtering
  const advancedFilters = useAdvancedFilters();

  // Views
  const savedViews = useSavedViewsEnhanced(projectId);

  // Favorites
  const favorites = useFavorites(projectId);

  // Data fetching
  const { data } = useList({
    resource: `projects/${projectId}/tasks`,
    filters: advancedFilters.refineFilters,
  });

  return <div>{/* UI components */}</div>;
};
```

### Pattern 2: Responsive Components

```typescript
const ResponsiveComponent = () => {
  const isMobile = useIsMobile();

  return isMobile ? (
    <MobileLayout>
      <MobileSpecificFeatures />
    </MobileLayout>
  ) : (
    <DesktopLayout>
      <DesktopSpecificFeatures />
    </DesktopLayout>
  );
};
```

### Pattern 3: Conditional Rendering

```typescript
// Only render on mobile
{
  isMobile && <MobileBottomNav />;
}

// Only render on desktop
{
  !isMobile && <DesktopSidebar />;
}

// Render different props
<Drawer
  placement={isMobile ? "bottom" : "right"}
  width={isMobile ? "100%" : 400}
/>;
```

---

## Performance Optimization

### 1. Memoization

```typescript
// Memoize expensive computations
const filteredTasks = useMemo(() => {
  return tasks.filter(task => /* filter logic */);
}, [tasks, filters]);

// Memoize callbacks
const handleFilterChange = useCallback((criteria) => {
  advancedFilters.updateCriteria(criteria);
}, [advancedFilters]);
```

### 2. Debouncing

```typescript
// Debounce search input
const [searchText, setSearchText] = useState("");

useEffect(() => {
  const timer = setTimeout(() => {
    advancedFilters.updateCriteria({ searchText });
  }, 300);

  return () => clearTimeout(timer);
}, [searchText]);
```

### 3. Lazy Loading

```typescript
// Lazy load heavy components
const AdvancedFilterPanel = lazy(
  () => import("./components/filters/AdvancedFilterPanel")
);

<Suspense fallback={<Spin />}>
  <AdvancedFilterPanel />
</Suspense>;
```

---

## Testing

### Unit Tests

```typescript
// Test useAdvancedFilters hook
describe("useAdvancedFilters", () => {
  it("should convert criteria to Refine filters", () => {
    const { result } = renderHook(() => useAdvancedFilters());

    act(() => {
      result.current.updateCriteria({ status: ["todo"] });
    });

    expect(result.current.refineFilters).toEqual([
      { field: "status", operator: "in", value: ["todo"] },
    ]);
  });
});
```

### Integration Tests

```typescript
// Test filter panel integration
describe("AdvancedFilterPanel", () => {
  it("should apply filters when clicking Apply", () => {
    const onCriteriaChange = jest.fn();

    render(
      <AdvancedFilterPanel
        open={true}
        onCriteriaChange={onCriteriaChange}
        // ... other props
      />
    );

    // Select status filter
    fireEvent.click(screen.getByText("To Do"));

    // Click Apply
    fireEvent.click(screen.getByText("Apply Filters"));

    expect(onCriteriaChange).toHaveBeenCalledWith({
      status: ["todo"],
    });
  });
});
```

---

## Troubleshooting

### Issue: Mobile components not showing

**Solution:**

- Check `useIsMobile()` hook is working
- Verify breakpoint values in `tokens.breakpoints`
- Test in browser DevTools mobile mode
- Check z-index conflicts

### Issue: Filters not applying

**Solution:**

- Verify `refineFilters` conversion is correct
- Check operator types use `as const`
- Ensure `useList` receives filters prop
- Check backend API supports filter operators

### Issue: LocalStorage quota exceeded

**Solution:**

- Implement data cleanup for old entries
- Compress data before storing
- Move to backend storage for large datasets
- Provide user option to clear storage

---

## Best Practices Summary

1. **Mobile-First:** Design for mobile, enhance for desktop
2. **Touch Targets:** Minimum 44x44px for all interactive elements
3. **Performance:** Memoize, debounce, lazy load
4. **Accessibility:** ARIA labels, keyboard navigation, focus management
5. **Type Safety:** Use TypeScript strictly, avoid `any`
6. **Testing:** Unit tests for hooks, integration tests for components
7. **Documentation:** Comment complex logic, update docs
8. **Error Handling:** Graceful degradation, user-friendly messages

---

## Resources

- [Ant Design Documentation](https://ant.design/)
- [Refine Documentation](https://refine.dev/)
- [React Hook Best Practices](https://react.dev/reference/react)
- [Mobile Web Best Practices](https://web.dev/mobile/)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Last Updated:** 2025-09-30  
**Version:** 1.0  
**Maintainer:** Development Team
