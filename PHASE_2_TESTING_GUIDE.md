# Phase 2 Testing Guide

## Overview
This guide provides comprehensive testing procedures for all Phase 2 features: Calendar View, Timeline View, Bulk Actions, and Enhanced Kanban Board.

---

## Prerequisites

### 1. Start the Development Server
```bash
cd freelancer-hub-dashboard
npm run dev
```

### 2. Ensure Backend is Running
Make sure the AdonisJS backend is running and accessible.

### 3. Test Data Setup
Create test tasks with:
- Various due dates (past, present, future)
- Different statuses (todo, in_progress, review, done)
- Different priorities (low, medium, high, urgent)
- Multiple assignees
- Some tasks with and without due dates

---

## Feature 1: Calendar View

### Access
Navigate to: `/tenants/{slug}/projects/{projectId}/tasks/calendar`

Or click "Calendar View" button from List or Kanban views.

### Test Cases

#### TC-CAL-01: Calendar Loads Successfully
- [ ] Calendar displays without errors
- [ ] Tasks with due dates appear on correct dates
- [ ] Tasks without due dates are not shown
- [ ] Loading spinner shows while fetching data
- [ ] Default view is "Month"

#### TC-CAL-02: View Switching
- [ ] Click "Month" button → Shows monthly calendar
- [ ] Click "Week" button → Shows weekly calendar
- [ ] Click "Day" button → Shows daily calendar
- [ ] Click "Agenda" button → Shows agenda list
- [ ] Active view button is highlighted (primary color)

#### TC-CAL-03: Navigation
- [ ] Click left arrow → Goes to previous period
- [ ] Click right arrow → Goes to next period
- [ ] Click "Today" button → Returns to current date
- [ ] Month/year label updates correctly
- [ ] Navigation works in all view modes

#### TC-CAL-04: Event Display
- [ ] Events show task title
- [ ] Events have colored left border (priority color)
- [ ] Events have subtle background (priority color with opacity)
- [ ] Multiple events on same day are stacked
- [ ] Long titles are truncated appropriately

#### TC-CAL-05: Event Interaction
- [ ] Click on event → Navigates to task edit page
- [ ] Correct task ID in URL
- [ ] Can navigate back to calendar
- [ ] Calendar state (view, date) is preserved

#### TC-CAL-06: Legend
- [ ] Legend shows all priority colors
- [ ] Colors match actual event colors
- [ ] Legend is visible at bottom of page

#### TC-CAL-07: View Navigation
- [ ] "List View" button → Navigates to list view
- [ ] "Kanban View" button → Navigates to kanban view
- [ ] Navigation preserves project context

#### TC-CAL-08: Responsive Design
- [ ] Calendar adapts to window resize
- [ ] Mobile view shows simplified layout
- [ ] Touch interactions work on mobile
- [ ] Buttons are touch-friendly (min 44px)

#### TC-CAL-09: Dark Mode
- [ ] Toggle dark mode
- [ ] Calendar background updates
- [ ] Event colors remain visible
- [ ] Text contrast is sufficient
- [ ] Toolbar styling updates

---

## Feature 2: Timeline View

### Access
Navigate to: `/tenants/{slug}/projects/{projectId}/tasks/timeline`

Or click "Timeline View" button from List, Kanban, or Calendar views.

### Test Cases

#### TC-TL-01: Timeline Loads Successfully
- [ ] Timeline displays without errors
- [ ] Tasks are grouped by due date
- [ ] Dates are sorted chronologically (oldest first)
- [ ] Loading spinner shows while fetching data
- [ ] Empty state shows when no tasks

#### TC-TL-02: Date Grouping
- [ ] Each date has a label (e.g., "Jan 15, 2025")
- [ ] Today's date is highlighted with blue color
- [ ] Today's date has "Today" badge
- [ ] Tasks under each date are displayed
- [ ] Multiple tasks per date are stacked

#### TC-TL-03: Task Cards
- [ ] Task ID and title are visible
- [ ] Description is shown (truncated if long)
- [ ] Status tag displays with correct color
- [ ] Priority tag displays with icon and color
- [ ] Estimated hours shown if available
- [ ] Assignee avatar and name shown if assigned
- [ ] Left border color matches priority

#### TC-TL-04: Task Interaction
- [ ] Click on task card → Navigates to edit page
- [ ] Hover shows pointer cursor
- [ ] Card has subtle hover effect
- [ ] Correct task ID in URL

#### TC-TL-05: Date Range Filtering
- [ ] Click on date range picker
- [ ] Select start and end dates
- [ ] Timeline updates to show only tasks in range
- [ ] Summary shows filtered count and date range
- [ ] "Clear Filter" button appears
- [ ] Click "Clear Filter" → Shows all tasks

#### TC-TL-06: Empty States
- [ ] No tasks → Shows "No tasks found" message
- [ ] Date filter with no results → Shows empty state
- [ ] Empty state is centered and styled

#### TC-TL-07: Summary
- [ ] Shows total task count
- [ ] Updates when filter applied
- [ ] Shows date range when filtered
- [ ] Formatting is correct

#### TC-TL-08: View Navigation
- [ ] "List View" button → Navigates to list view
- [ ] "Kanban View" button → Navigates to kanban view
- [ ] "Calendar View" button → Navigates to calendar view
- [ ] Navigation preserves project context

#### TC-TL-09: Responsive Design
- [ ] Timeline adapts to window resize
- [ ] Mobile view shows simplified cards
- [ ] Date labels remain visible
- [ ] Touch interactions work

#### TC-TL-10: Dark Mode
- [ ] Toggle dark mode
- [ ] Timeline background updates
- [ ] Card backgrounds update
- [ ] Text contrast is sufficient
- [ ] Timeline dots update color

---

## Feature 3: Bulk Actions

### Access
Navigate to: `/tenants/{slug}/projects/{projectId}/tasks` (List View)

### Test Cases

#### TC-BA-01: Selection
- [ ] Checkboxes appear in table
- [ ] Click checkbox → Selects task
- [ ] Click again → Deselects task
- [ ] Select all checkbox in header works
- [ ] Deselect all checkbox in header works
- [ ] Selection count updates in toolbar

#### TC-BA-02: Toolbar Visibility
- [ ] Toolbar hidden when no selection
- [ ] Toolbar appears when 1+ tasks selected
- [ ] Toolbar is sticky at top
- [ ] Toolbar shows selection count
- [ ] "Clear" button is visible

#### TC-BA-03: Clear Selection
- [ ] Click "Clear" button
- [ ] All checkboxes deselect
- [ ] Toolbar disappears
- [ ] Selection count resets to 0

#### TC-BA-04: Bulk Update Status
- [ ] Select 2+ tasks
- [ ] Click "Update Status" dropdown
- [ ] Select a status (e.g., "In Progress")
- [ ] Loading message appears
- [ ] Success message shows
- [ ] Tasks update in table
- [ ] Selection clears automatically
- [ ] Toolbar disappears

#### TC-BA-05: Bulk Update Priority
- [ ] Select 2+ tasks
- [ ] Click "Update Priority" dropdown
- [ ] Select a priority (e.g., "High")
- [ ] Loading message appears
- [ ] Success message shows
- [ ] Tasks update in table
- [ ] Selection clears automatically

#### TC-BA-06: Bulk Assign
- [ ] Select 2+ tasks
- [ ] Click "Assign to..." dropdown
- [ ] Search for user (if many users)
- [ ] Select a user
- [ ] Loading message appears
- [ ] Success message shows
- [ ] Tasks update in table
- [ ] Assignee column shows new assignee

#### TC-BA-07: Bulk Delete
- [ ] Select 2+ tasks
- [ ] Click "Delete" button
- [ ] Confirmation modal appears
- [ ] Modal shows count (e.g., "Delete 3 task(s)?")
- [ ] Click "Cancel" → Modal closes, no deletion
- [ ] Click "Yes, Delete" → Tasks are deleted
- [ ] Success message shows
- [ ] Tasks removed from table
- [ ] Selection clears

#### TC-BA-08: Error Handling
- [ ] Disconnect network
- [ ] Try bulk operation
- [ ] Error message appears
- [ ] Selection remains
- [ ] Can retry operation

#### TC-BA-09: Loading States
- [ ] During bulk operation, all controls disabled
- [ ] Loading spinner or message visible
- [ ] Cannot start another operation
- [ ] UI re-enables after completion

#### TC-BA-10: Edge Cases
- [ ] Select 0 tasks → Warning message
- [ ] Select 1 task → Operation works
- [ ] Select all tasks → Operation works
- [ ] Select tasks, navigate away, come back → Selection cleared

---

## Feature 4: Enhanced Kanban Board

### Access
Navigate to: `/tenants/{slug}/projects/{projectId}/tasks/kanban`

### Test Cases

#### TC-KB-01: Column Enhancements
- [ ] Each column shows task count badge
- [ ] Badge color matches column color
- [ ] Badge shows "0" when empty
- [ ] Collapse/expand button visible in header

#### TC-KB-02: Collapse/Expand
- [ ] Click collapse button (up arrow)
- [ ] Column collapses, tasks hidden
- [ ] Shows "X task(s) hidden" message
- [ ] Button changes to down arrow
- [ ] Click expand button → Column expands
- [ ] Tasks reappear
- [ ] State is independent per column

#### TC-KB-03: Drop Zone Highlighting
- [ ] Drag a task card
- [ ] Hover over a column
- [ ] Column background changes (subtle color)
- [ ] Column border becomes dashed
- [ ] Box shadow increases
- [ ] Minimum height expands
- [ ] Move away → Highlighting disappears

#### TC-KB-04: Drag Animations
- [ ] Drag task → Smooth pickup animation
- [ ] Dragging → Card follows cursor
- [ ] Drop → Smooth drop animation
- [ ] Card settles into position
- [ ] Other cards shift smoothly

#### TC-KB-05: WIP Limits (Optional)
If WIP limits are configured:
- [ ] Column shows limit (e.g., "Limit: 5")
- [ ] Badge turns red when limit exceeded
- [ ] Limit text turns red
- [ ] Can still add tasks (soft limit)
- [ ] Visual warning is clear

#### TC-KB-06: Styling Improvements
- [ ] Columns have rounded corners
- [ ] Columns have subtle shadows
- [ ] Hover increases shadow depth
- [ ] Transitions are smooth (300ms)
- [ ] Colors use design tokens

#### TC-KB-07: View Navigation
- [ ] "List View" button → Navigates to list view
- [ ] "Calendar View" button → Navigates to calendar view
- [ ] "Timeline View" button → Navigates to timeline view
- [ ] Navigation preserves project context

#### TC-KB-08: Responsive Design
- [ ] Columns stack on mobile
- [ ] Horizontal scroll on tablet
- [ ] Touch drag works on mobile
- [ ] Buttons are touch-friendly

#### TC-KB-09: Dark Mode
- [ ] Toggle dark mode
- [ ] Column backgrounds update
- [ ] Card backgrounds update
- [ ] Border colors update
- [ ] Text contrast is sufficient

---

## Cross-Feature Testing

### CF-01: View Switching Flow
- [ ] List → Kanban → Calendar → Timeline → List
- [ ] All views load correctly
- [ ] Data is consistent across views
- [ ] No errors in console
- [ ] Navigation buttons work in all views

### CF-02: Data Consistency
- [ ] Create task in one view
- [ ] Switch to another view
- [ ] New task appears
- [ ] Update task in one view
- [ ] Switch to another view
- [ ] Changes are reflected

### CF-03: Filter Persistence
- [ ] Apply filter in list view
- [ ] Switch to kanban
- [ ] Filter is NOT persisted (expected)
- [ ] Each view has independent filters

### CF-04: Theme Consistency
- [ ] All views use same color palette
- [ ] Priority colors consistent
- [ ] Status colors consistent
- [ ] Spacing is consistent
- [ ] Typography is consistent

---

## Performance Testing

### P-01: Large Dataset
- [ ] Create 100+ tasks
- [ ] Calendar loads in <2 seconds
- [ ] Timeline loads in <2 seconds
- [ ] Kanban loads in <2 seconds
- [ ] List loads in <2 seconds
- [ ] No lag when interacting

### P-02: Bulk Operations
- [ ] Select 50+ tasks
- [ ] Bulk update completes in <5 seconds
- [ ] UI remains responsive
- [ ] No browser freeze

### P-03: Memory Leaks
- [ ] Switch between views 20+ times
- [ ] Check browser memory usage
- [ ] Memory should stabilize
- [ ] No continuous growth

---

## Accessibility Testing

### A-01: Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Focus indicators are visible
- [ ] Enter/Space activate buttons
- [ ] Escape closes modals
- [ ] Arrow keys work in calendar

### A-02: Screen Reader
- [ ] Use screen reader (NVDA, JAWS, VoiceOver)
- [ ] All buttons have labels
- [ ] Form fields have labels
- [ ] Status messages are announced
- [ ] Headings are properly structured

### A-03: Color Contrast
- [ ] Use contrast checker tool
- [ ] All text meets WCAG AA (4.5:1)
- [ ] Large text meets WCAG AA (3:1)
- [ ] Interactive elements are distinguishable

---

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## Common Issues & Solutions

### Issue: Calendar events not showing
**Solution:** Check that tasks have valid `dueDate` values

### Issue: Bulk actions not working
**Solution:** Ensure tasks are selected and backend is accessible

### Issue: Timeline shows no tasks
**Solution:** Check date range filter, clear if applied

### Issue: Kanban drag not working
**Solution:** Check browser console for errors, ensure @dnd-kit is installed

### Issue: Dark mode colors incorrect
**Solution:** Clear browser cache, check theme tokens

---

## Reporting Issues

When reporting issues, include:
1. Feature name (Calendar, Timeline, Bulk Actions, Kanban)
2. Test case ID (e.g., TC-CAL-05)
3. Steps to reproduce
4. Expected behavior
5. Actual behavior
6. Browser and version
7. Screenshots/video if applicable
8. Console errors

---

## Sign-Off Checklist

Before marking Phase 2 as complete:
- [ ] All Calendar test cases pass
- [ ] All Timeline test cases pass
- [ ] All Bulk Actions test cases pass
- [ ] All Enhanced Kanban test cases pass
- [ ] Cross-feature tests pass
- [ ] Performance is acceptable
- [ ] Accessibility requirements met
- [ ] Browser compatibility confirmed
- [ ] Documentation is complete
- [ ] No critical bugs remain

---

**Testing Date:** _____________  
**Tester Name:** _____________  
**Status:** [ ] Pass [ ] Fail [ ] Needs Review

