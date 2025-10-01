# Phase 2 User Guide

## Welcome to the New Task Management Features! 🎉

This guide will help you get started with the four new powerful features added in Phase 2.

---

## Table of Contents
1. [Calendar View](#calendar-view)
2. [Timeline View](#timeline-view)
3. [Bulk Actions](#bulk-actions)
4. [Enhanced Kanban Board](#enhanced-kanban-board)

---

## Calendar View 📅

### What is it?
The Calendar View displays your tasks on a visual calendar, making it easy to see what's due when and plan your work across days, weeks, and months.

### How to Access
1. Navigate to any project's task list
2. Click the **"Calendar View"** button in the top right
3. Or go directly to: `/tenants/[your-tenant]/projects/[project-id]/tasks/calendar`

### How to Use

#### Switching Views
- **Month View:** See the entire month at a glance
- **Week View:** Focus on a single week
- **Day View:** Detailed view of a single day
- **Agenda View:** List of upcoming tasks

Click the view buttons in the toolbar to switch between them.

#### Navigating Dates
- **Previous/Next:** Click the arrow buttons to move backward or forward
- **Today:** Click the "Today" button to jump to the current date

#### Understanding Task Colors
Tasks are color-coded by priority:
- 🔴 **Red border:** Urgent priority
- 🟠 **Orange border:** High priority
- 🔵 **Blue border:** Medium priority
- ⚪ **Gray border:** Low priority

#### Interacting with Tasks
- **Click any task** to open it and make edits
- Tasks without due dates won't appear on the calendar

### Tips
- Use Month view for long-term planning
- Use Week view for weekly planning
- Use Day view when you need to focus on today's tasks
- Use Agenda view for a simple list of upcoming deadlines

---

## Timeline View ⏱️

### What is it?
The Timeline View shows your tasks in chronological order, grouped by due date. It's perfect for seeing the sequence of work and identifying what's coming up.

### How to Access
1. Navigate to any project's task list
2. Click the **"Timeline View"** button in the top right
3. Or go directly to: `/tenants/[your-tenant]/projects/[project-id]/tasks/timeline`

### How to Use

#### Understanding the Timeline
- Tasks are grouped by their due date
- Today's date is highlighted in **blue** with a "Today" badge
- Each task card shows:
  - Task ID and title
  - Description (if available)
  - Status (To Do, In Progress, Review, Done)
  - Priority (Low, Medium, High, Urgent)
  - Estimated hours
  - Assignee (if assigned)

#### Filtering by Date Range
1. Click the **date range picker** at the top
2. Select a start date and end date
3. The timeline will show only tasks due within that range
4. Click **"Clear Filter"** to see all tasks again

#### Interacting with Tasks
- **Click any task card** to open it and make edits
- The card will highlight on hover

### Tips
- Use the timeline to see the flow of work over time
- Filter by date range to focus on a specific sprint or milestone
- Look for gaps in the timeline to identify free time
- Check for clustering to identify potential bottlenecks

---

## Bulk Actions 🔄

### What is it?
Bulk Actions let you perform operations on multiple tasks at once, saving you time when you need to update, assign, or delete several tasks.

### How to Access
Bulk Actions are available in the **List View** (the default task view).

### How to Use

#### Selecting Tasks
1. Go to the task list
2. Check the boxes next to the tasks you want to select
3. Or click the checkbox in the table header to select all tasks
4. A blue toolbar will appear showing how many tasks are selected

#### Available Actions

##### Update Status
1. Select one or more tasks
2. Click the **"Update Status"** dropdown
3. Choose a status: To Do, In Progress, Review, or Done
4. All selected tasks will be updated

##### Update Priority
1. Select one or more tasks
2. Click the **"Update Priority"** dropdown
3. Choose a priority: Low, Medium, High, or Urgent
4. All selected tasks will be updated

##### Assign to User
1. Select one or more tasks
2. Click the **"Assign to..."** dropdown
3. Search for or select a user
4. All selected tasks will be assigned to that user

##### Delete Tasks
1. Select one or more tasks
2. Click the **"Delete"** button
3. Confirm the deletion in the popup
4. All selected tasks will be permanently deleted

#### Clearing Selection
- Click the **"Clear"** button in the toolbar
- Or uncheck all the checkboxes manually

### Tips
- Use bulk status updates to move multiple tasks through your workflow at once
- Bulk assign tasks when redistributing work among team members
- Be careful with bulk delete - it's permanent!
- The toolbar shows a loading state while operations are in progress

---

## Enhanced Kanban Board 🎯

### What is it?
The Kanban Board has been improved with better visual feedback, collapsible columns, and optional work-in-progress (WIP) limits.

### How to Access
1. Navigate to any project's task list
2. Click the **"Kanban View"** button in the top right
3. Or go directly to: `/tenants/[your-tenant]/projects/[project-id]/tasks/kanban`

### New Features

#### Task Count Badges
Each column header now shows a badge with the number of tasks in that column. This helps you see at a glance how work is distributed.

#### Collapse/Expand Columns
1. Click the **up/down arrow** button in any column header
2. The column will collapse, hiding all tasks
3. A message shows how many tasks are hidden
4. Click the button again to expand the column

**Why use this?**
- Focus on specific columns by collapsing others
- Reduce visual clutter
- Make more room for the columns you're working on

#### Drop Zone Highlighting
When you drag a task:
- The column you're hovering over will **highlight**
- The border becomes **dashed**
- The background color changes slightly
- The column expands to show you can drop there

This makes it crystal clear where your task will land!

#### WIP Limits (Optional)
If your team has configured WIP limits:
- Each column shows its limit (e.g., "Limit: 5")
- The badge turns **red** when you exceed the limit
- This is a visual reminder to finish work before starting new tasks

**Note:** WIP limits are soft limits - you can still add tasks, but you'll see a warning.

### How to Use

#### Moving Tasks
1. **Click and hold** on a task card
2. **Drag** it to a different column
3. **Drop** it in the new column
4. The task's status will automatically update

#### Filtering Tasks
Use the filters at the top to:
- Filter by assignee
- Filter by priority

#### Creating New Tasks
Click the **"New Task"** button in the top right.

### Tips
- Collapse columns you're not actively working on
- Watch for red WIP limit warnings - they indicate you might be taking on too much at once
- Use the visual drop zone feedback to ensure you're dropping tasks in the right column
- Combine filters to focus on specific work (e.g., "High priority tasks assigned to me")

---

## Switching Between Views

All task views now have quick navigation buttons:

- **List View** → Table with bulk actions
- **Kanban View** → Drag-and-drop board
- **Calendar View** → Visual calendar
- **Timeline View** → Chronological timeline

**Pro Tip:** Use different views for different purposes:
- **Planning:** Calendar View
- **Execution:** Kanban View
- **Tracking:** Timeline View
- **Bulk Updates:** List View

---

## Keyboard Shortcuts

### Global
- **Cmd+K** (Mac) or **Ctrl+K** (Windows): Open command palette

### Calendar View
- **Arrow Keys:** Navigate between dates
- **Enter:** Select highlighted event
- **Escape:** Close event details

### List View
- **Tab:** Navigate between elements
- **Space:** Toggle checkbox selection
- **Enter:** Open selected task

---

## Mobile Usage

All views are optimized for mobile devices:

### Calendar View
- Swipe left/right to navigate months
- Tap events to view details
- Use the view switcher for different perspectives

### Timeline View
- Scroll vertically through dates
- Tap task cards to edit
- Use the date picker for filtering

### Bulk Actions
- Long-press to select tasks
- Tap the toolbar actions
- Confirm deletions with the modal

### Kanban Board
- Touch and drag to move tasks
- Tap column headers to collapse/expand
- Swipe to scroll horizontally

---

## Common Questions

### Q: Why don't I see all my tasks in the Calendar View?
**A:** Only tasks with due dates appear on the calendar. Tasks without due dates won't be shown.

### Q: Can I undo a bulk delete?
**A:** No, bulk delete is permanent. Always double-check your selection before confirming.

### Q: What happens if I exceed a WIP limit?
**A:** WIP limits are visual warnings only. You can still add tasks, but the red indicator suggests you should finish existing work first.

### Q: Can I customize the calendar colors?
**A:** The colors are based on task priority and are consistent across the app. This ensures everyone sees the same visual indicators.

### Q: How do I export my timeline?
**A:** Export functionality is planned for Phase 4. For now, you can take screenshots or manually copy task information.

---

## Getting Help

If you encounter issues:

1. **Check the browser console** for error messages
2. **Refresh the page** to see if it resolves the issue
3. **Try a different view** to see if the problem persists
4. **Contact your administrator** with:
   - What you were trying to do
   - What happened instead
   - Any error messages you saw
   - Screenshots if possible

---

## What's Next?

### Coming in Phase 3 (Mobile Optimization)
- Improved mobile layouts
- Touch gestures
- Swipe actions
- Bottom navigation

### Coming in Phase 4 (Polish & Performance)
- Advanced filtering
- Saved views
- More keyboard shortcuts
- Export functionality
- User onboarding

---

## Feedback

We'd love to hear your thoughts on these new features!

**What's working well?**
**What could be improved?**
**What features would you like to see next?**

Share your feedback with your team lead or administrator.

---

**Enjoy the new features and happy task managing! 🚀**

---

**Last Updated:** 2025-09-30  
**Version:** Phase 2 (Advanced Features)

