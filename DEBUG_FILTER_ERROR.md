# Debug: "rawData.some is not a function" Error

## Quick Fix Steps

### Step 1: Clear Browser Cache and localStorage

**Open Browser Console** (F12 or Cmd+Option+I) and run:

```javascript
// Clear all localStorage
localStorage.clear();

// Or specifically clear the filter data
localStorage.removeItem('advanced_filters');

// Reload the page
location.reload();
```

### Step 2: Verify Correct URL

The development server is running on **`http://localhost:5174`** (not 5173).

Make sure you're accessing:
```
http://localhost:5174/tenants/acme-corp/my-tasks
```

NOT:
```
http://localhost:5173/tenants/acme-corp/my-tasks  ❌ Wrong port!
```

### Step 3: Check localStorage Data

Before clearing, inspect what's in localStorage:

```javascript
// In browser console
const filterData = localStorage.getItem('advanced_filters');
console.log('Filter Data:', filterData);

if (filterData) {
  const parsed = JSON.parse(filterData);
  console.log('Parsed:', parsed);
  console.log('Criteria:', parsed.state?.criteria);
  console.log('Status type:', typeof parsed.state?.criteria?.status);
  console.log('Status value:', parsed.state?.criteria?.status);
  console.log('Is array?:', Array.isArray(parsed.state?.criteria?.status));
}
```

### Step 4: Force Normalization

If the error persists, manually fix the localStorage data:

```javascript
// In browser console
const filterData = localStorage.getItem('advanced_filters');
if (filterData) {
  const parsed = JSON.parse(filterData);
  
  // Normalize the criteria
  if (parsed.state && parsed.state.criteria) {
    const criteria = parsed.state.criteria;
    
    // Fix status
    if (criteria.status && !Array.isArray(criteria.status)) {
      criteria.status = [criteria.status];
    } else if (!criteria.status) {
      criteria.status = [];
    }
    
    // Fix priority
    if (criteria.priority && !Array.isArray(criteria.priority)) {
      criteria.priority = [criteria.priority];
    } else if (!criteria.priority) {
      criteria.priority = [];
    }
    
    // Fix assigneeId
    if (criteria.assigneeId && !Array.isArray(criteria.assigneeId)) {
      criteria.assigneeId = [criteria.assigneeId];
    } else if (!criteria.assigneeId) {
      criteria.assigneeId = [];
    }
    
    // Save back
    localStorage.setItem('advanced_filters', JSON.stringify(parsed));
    console.log('Fixed localStorage data');
  }
}

// Reload
location.reload();
```

## Debugging the Error

### Get Full Stack Trace

In browser console, when the error occurs:

```javascript
// The error should show a stack trace
// Look for the exact line number and component
```

### Check Component Props

Add this temporarily to `AdvancedFilterPanel.tsx` after line 59:

```tsx
console.log('AdvancedFilterPanel props:', {
  criteria,
  normalizedCriteria,
  status: criteria?.status,
  statusType: typeof criteria?.status,
  statusIsArray: Array.isArray(criteria?.status),
});
```

### Check Store State

In browser console:

```javascript
// Access the Zustand store directly
const filterStore = window.__ZUSTAND_DEVTOOLS_STORE__;

// Or check via React DevTools
// Look for useFilterStore hook in components
```

## Common Causes

### 1. Old localStorage Data

**Problem**: Data saved before the normalization fix
**Solution**: Clear localStorage

### 2. Wrong Port

**Problem**: Accessing old server instance on port 5173
**Solution**: Use port 5174

### 3. Browser Cache

**Problem**: Old JavaScript bundle cached
**Solution**: Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

### 4. Multiple Browser Tabs

**Problem**: Multiple tabs with different versions
**Solution**: Close all tabs, reopen one

## Verification Steps

After applying fixes:

1. **Clear localStorage**
   ```javascript
   localStorage.clear();
   ```

2. **Hard refresh browser**
   - Chrome/Edge: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   - Firefox: Cmd+Shift+R (Mac) or Ctrl+F5 (Windows)
   - Safari: Cmd+Option+R

3. **Navigate to My Tasks**
   ```
   http://localhost:5174/tenants/acme-corp/my-tasks
   ```

4. **Check console for errors**
   - Should be no errors
   - Should see normalized data

5. **Open filter panel**
   - Click "Filters" button
   - Panel should open without errors

## If Error Still Persists

### Check if AdvancedFilterPanel is Even Being Rendered

The error might be happening elsewhere. Check if there are other Select components with `mode="multiple"`:

```bash
# Search for other Select components
grep -r "mode=\"multiple\"" freelancer-hub-dashboard/src --include="*.tsx"
```

### Check the Exact Error Location

The error message shows:
```
chunk-ZJE66QKZ.js?v=4752d875:85026
```

This is minified code. To see the actual source:

1. Open browser DevTools
2. Go to Sources tab
3. Enable "Pause on exceptions"
4. Reload the page
5. When it breaks, check the call stack

### Alternative: Use React DevTools

1. Install React DevTools extension
2. Open DevTools → Components tab
3. Find `AdvancedFilterPanel` component
4. Inspect props
5. Check if `criteria` has correct structure

## Expected Data Structure

### Correct criteria object:

```javascript
{
  status: [],           // Empty array or ["todo", "done"]
  priority: [],         // Empty array or ["high", "urgent"]
  assigneeId: [],       // Empty array or [1, 2, 3]
  searchText: "",       // String or undefined
  dueDateFrom: "",      // String or undefined
  dueDateTo: "",        // String or undefined
  estimatedHoursMin: undefined,  // Number or undefined
  estimatedHoursMax: undefined,  // Number or undefined
  isFavorite: false     // Boolean or undefined
}
```

### Incorrect criteria (causes error):

```javascript
{
  status: "todo",       // ❌ Single value instead of array
  priority: null,       // ❌ Null instead of array
  assigneeId: undefined // ❌ Undefined instead of array
}
```

## Emergency Workaround

If nothing else works, temporarily disable the filter panel:

In `freelancer-hub-dashboard/src/pages/my-tasks/list.tsx`:

```tsx
{/* Temporarily comment out */}
{/* <AdvancedFilterPanel
  open={filterPanelOpen}
  onClose={() => setFilterPanelOpen(false)}
  criteria={advancedFilters.criteria}
  onCriteriaChange={advancedFilters.updateCriteria}
  onClear={advancedFilters.clearCriteria}
  savedFilters={advancedFilters.savedFilters}
  onSaveFilter={advancedFilters.saveFilter}
  onLoadFilter={advancedFilters.loadFilter}
  onDeleteFilter={advancedFilters.deleteFilter}
/> */}
```

This will let you use the page while we debug further.

## Contact Information

If the error persists after all these steps, please provide:

1. **Full error stack trace** from browser console
2. **localStorage data** (run the inspection script above)
3. **Browser and version** you're using
4. **Screenshot** of the error in DevTools

---

**Most Likely Solution**: Clear localStorage and use correct port (5174)

