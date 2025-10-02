# Timesheets Feature - Research & Implementation Plan

**Status: ✅ IMPLEMENTATION COMPLETE**

- ✅ Backend: Complete (migrations, models, validators, controller, routes)
- ✅ Frontend: Complete (list, create, edit, show pages)
- ✅ Integration: Complete (Refine resources, routing, navigation)
- ✅ Testing: Ready for manual testing

See `TIMESHEETS_IMPLEMENTATION_SUMMARY.md` for detailed implementation summary.

---

## Research Summary: Hubstaff Timesheet Features

### Key Features Identified

#### 1. **Timesheet Views**

Hubstaff provides three main timesheet views:

**Daily View (View & Edit)**

- Shows exact start/stop times for each time entry
- Displays daily total hours tracked
- Shows which projects time was tracked against
- Indicates idle time and manual time additions
- Allows inline editing of time entries

**Weekly View**

- Displays total hours per day in a weekly grid
- Shows breakdown by project
- Displays weekly totals
- Supports inline editing
- Provides quick overview of weekly patterns

**Calendar View**

- Individual user timesheets in calendar format
- Click on entries to edit or remove time
- Visual representation of work patterns
- Easy navigation between dates

#### 2. **Timesheet Approval Workflow**

**Statuses:**

- **Open** - Pay period not yet concluded, timesheet not submitted
- **Submitted** - Submitted by user, pending approval/denial
- **Approved** - Approved and ready for payroll
- **Denied** - Rejected, will not run to payroll

**Approval Features:**

- Manual review and approval by owner/manager
- Works with automatic payroll feature
- Configurable pay periods (weekly, bi-weekly, twice per month, monthly)
- Approval interface shows:
  - User name
  - Pay period dates
  - Regular and overtime hours
  - Total hours
  - Average activity level
  - Screenshot count
  - Submission date
  - Timesheet status

**Actions Available:**

- View timesheet details
- Approve timesheet
- Deny timesheet (with rejection reason)
- Bulk approve/deny

#### 3. **Filtering & Search**

- Filter by user/member
- Filter by source (how time was tracked)
- Filter by timezone
- Filter by date range
- Filter by project
- Filter by status (for approvals)

#### 4. **Time Entry Management**

- Add time entries manually
- Edit existing time entries
- Delete time entries
- Inline editing capabilities
- Bulk operations support

#### 5. **Integration with Payroll**

- Automatic payroll processing after approval
- Pay period configuration
- Regular vs overtime hours tracking
- Payment schedules based on pay period type

### UI/UX Patterns Observed

1. **Table-Based Layout** - Primary view uses tables with clear columns
2. **Status Indicators** - Color-coded tags for timesheet status
3. **Action Menus** - Dropdown menus for actions (View, Edit, Approve, Deny)
4. **Filters at Top** - Filter controls positioned at top of screen
5. **Summary Statistics** - Display totals, averages, and key metrics
6. **Modal/Drawer for Details** - Detailed views open in modals or drawers
7. **Inline Editing** - Click to edit time entries directly in table
8. **Responsive Design** - Mobile-friendly with simplified views

---

## Implementation Plan

### Phase 1: Database Schema & Backend API

#### Database Migrations

**1. Update `time_entries` table:**

```sql
ALTER TABLE time_entries ADD COLUMN timesheet_id INTEGER REFERENCES timesheets(id);
ALTER TABLE time_entries ADD COLUMN is_billable BOOLEAN DEFAULT true;
ALTER TABLE time_entries ADD COLUMN notes TEXT;
```

**2. Create `timesheets` table:**

```sql
CREATE TABLE timesheets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'draft', -- draft, submitted, pending_approval, approved, rejected
  total_hours DECIMAL(10,2) DEFAULT 0,
  billable_hours DECIMAL(10,2) DEFAULT 0,
  regular_hours DECIMAL(10,2) DEFAULT 0,
  overtime_hours DECIMAL(10,2) DEFAULT 0,
  submitted_at TIMESTAMP,
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP,
  approver_id INTEGER REFERENCES users(id),
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_timesheets_user_id ON timesheets(user_id);
CREATE INDEX idx_timesheets_tenant_id ON timesheets(tenant_id);
CREATE INDEX idx_timesheets_status ON timesheets(status);
CREATE INDEX idx_timesheets_week_start ON timesheets(week_start_date);
CREATE UNIQUE INDEX idx_timesheets_user_week ON timesheets(user_id, week_start_date);
```

**3. Create `timesheet_approvals` table (audit trail):**

```sql
CREATE TABLE timesheet_approvals (
  id SERIAL PRIMARY KEY,
  timesheet_id INTEGER NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
  approver_id INTEGER NOT NULL REFERENCES users(id),
  action VARCHAR(50) NOT NULL, -- approved, rejected, reopened
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_timesheet_approvals_timesheet_id ON timesheet_approvals(timesheet_id);
```

#### Backend API Endpoints (`TimesheetsController.ts`)

```typescript
// List timesheets with pagination and filtering
GET /api/v1/timesheets
Query params: status, user_id, week_start_date, week_end_date, page, limit

// Get single timesheet with all time entries
GET /api/v1/timesheets/:id

// Create new timesheet (auto-generated from time entries)
POST /api/v1/timesheets

// Update timesheet (edit time entries)
PUT /api/v1/timesheets/:id

// Submit timesheet for approval
POST /api/v1/timesheets/:id/submit

// Approve timesheet (admin/manager only)
POST /api/v1/timesheets/:id/approve

// Reject timesheet with reason (admin/manager only)
POST /api/v1/timesheets/:id/reject

// Reopen timesheet (move back to draft)
POST /api/v1/timesheets/:id/reopen

// Get timesheet summary statistics
GET /api/v1/timesheets/summary
```

#### Response Format (AdonisJS Standard)

```json
{
  "data": [
    {
      "id": 1,
      "userId": 5,
      "userName": "John Doe",
      "weekStartDate": "2025-01-06",
      "weekEndDate": "2025-01-12",
      "status": "submitted",
      "totalHours": 40.5,
      "billableHours": 38.0,
      "regularHours": 40.0,
      "overtimeHours": 0.5,
      "submittedAt": "2025-01-13T10:00:00Z",
      "approvedAt": null,
      "approverId": null,
      "approverName": null,
      "rejectionReason": null,
      "timeEntries": [
        {
          "id": 101,
          "date": "2025-01-06",
          "startTime": "09:00:00",
          "endTime": "17:00:00",
          "duration": 8.0,
          "projectId": 10,
          "projectName": "Project Alpha",
          "taskId": 50,
          "taskTitle": "Feature Development",
          "isBillable": true,
          "notes": "Worked on authentication module"
        }
      ]
    }
  ],
  "meta": {
    "total": 25,
    "perPage": 10,
    "currentPage": 1,
    "lastPage": 3
  }
}
```

#### Validators

**`timesheets.ts`:**

```typescript
export const submitTimesheetValidator = vine.compile(
  vine.object({
    weekStartDate: vine.date(),
    weekEndDate: vine.date(),
  })
);

export const approveTimesheetValidator = vine.compile(
  vine.object({
    notes: vine.string().optional(),
  })
);

export const rejectTimesheetValidator = vine.compile(
  vine.object({
    reason: vine.string().minLength(10).maxLength(500),
  })
);

export const updateTimesheetValidator = vine.compile(
  vine.object({
    timeEntries: vine.array(
      vine.object({
        id: vine.number().optional(),
        date: vine.date(),
        startTime: vine.string(),
        endTime: vine.string(),
        projectId: vine.number(),
        taskId: vine.number().optional(),
        isBillable: vine.boolean().optional(),
        notes: vine.string().optional(),
      })
    ),
  })
);
```

---

### Phase 2: Frontend Implementation

#### File Structure

```
freelancer-hub-dashboard/src/
├── pages/
│   └── timesheets/
│       ├── index.ts
│       ├── list.tsx          # Main timesheet list view
│       ├── edit.tsx          # Edit/detail view with time entries
│       ├── weekly.tsx        # Weekly grid view
│       └── calendar.tsx      # Calendar view
├── components/
│   └── timesheets/
│       ├── TimesheetCard.tsx           # Summary card component
│       ├── TimesheetStatusTag.tsx      # Status indicator
│       ├── TimeEntryRow.tsx            # Editable time entry row
│       ├── ApprovalModal.tsx           # Approval/rejection interface
│       ├── TimesheetFilters.tsx        # Filter panel
│       └── TimesheetSummary.tsx        # Statistics summary
└── stores/
    └── timesheetStore.ts     # Zustand store for UI state
```

#### Resource Definition (`RefineWithTenant.tsx`)

```typescript
{
  name: "timesheets",
  list: `/tenants/${slug}/timesheets`,
  edit: `/tenants/${slug}/timesheets/:id/edit`,
  meta: {
    label: "Timesheets",
    icon: <ClockCircleOutlined />,
    canDelete: false,
  },
}
```

---

## Responsive Design Specifications

### Mobile (< 768px)

- **List View**: Card layout instead of table
- **Filters**: Bottom sheet or collapsible panel
- **Time Entries**: Stacked vertically, one per card
- **Actions**: Full-width buttons
- **Modals**: Full-screen overlays
- **Touch Targets**: Minimum 44px height

### Tablet (768px - 992px)

- **List View**: Simplified table with horizontal scroll
- **Filters**: Inline with reduced options
- **Time Entries**: Two-column grid
- **Modals**: Medium-sized drawers

### Desktop (> 992px)

- **List View**: Full table with all columns
- **Filters**: Inline filter bar
- **Time Entries**: Full weekly grid
- **Modals**: Side drawers or large modals
- **Hover States**: Tooltips and highlights

---

## Implementation Checklist

### Backend

- [ ] Create database migrations
- [ ] Create Timesheet model
- [ ] Create TimesheetApproval model
- [ ] Implement TimesheetsController
- [ ] Create validators
- [ ] Add routes
- [ ] Implement authorization (users can only edit their own, managers can approve)
- [ ] Write tests

### Frontend - List View

- [ ] Create list page component
- [ ] Implement table with columns (week, hours, status, actions)
- [ ] Add status filter (draft, submitted, approved, rejected)
- [ ] Add date range filter
- [ ] Add user filter (for managers)
- [ ] Implement pagination
- [ ] Add responsive card layout for mobile
- [ ] Add "Submit for Approval" action
- [ ] Add "Approve/Reject" actions (for managers)

### Frontend - Edit/Detail View

- [ ] Create edit page component
- [ ] Display time entries grouped by day
- [ ] Implement inline editing of time entries
- [ ] Add/remove time entry functionality
- [ ] Show timesheet summary (total hours, billable/non-billable)
- [ ] Add submit button
- [ ] Implement responsive layout
- [ ] Add validation

### Frontend - Approval Interface

- [ ] Create approval modal/drawer
- [ ] Display timesheet details
- [ ] Show all time entries
- [ ] Add approve button with confirmation
- [ ] Add reject button with reason textarea
- [ ] Display approval history
- [ ] Implement responsive design

### Integration

- [ ] Add to sidebar navigation
- [ ] Update routing
- [ ] Test with custom data provider
- [ ] Test pagination
- [ ] Test filtering
- [ ] Test approval workflow
- [ ] Test permissions

### Testing

- [ ] Test create/edit/submit workflow
- [ ] Test approval/rejection workflow
- [ ] Test permissions (users vs managers)
- [ ] Test responsive layouts
- [ ] Test error handling
- [ ] Test edge cases (empty states, validation errors)

---

## Next Steps

1. **Start with Backend**: Create migrations and models
2. **Build API Endpoints**: Implement controller with all CRUD operations
3. **Frontend List View**: Desktop-first, then make responsive
4. **Frontend Edit View**: Implement time entry editing
5. **Approval Interface**: Build approval workflow
6. **Testing & Refinement**: Comprehensive testing across all features

This implementation will provide a robust, Hubstaff-inspired timesheet system fully integrated with the Freelancer Hub application.
