# Timesheets Approvals Feature

## Overview

A dedicated approvals management page has been added to the Timesheets feature, providing managers and admins with a centralized interface to review and approve/reject timesheets efficiently.

## ✅ Implemented Features

### 1. Dedicated Approvals Page

**Location:** `/tenants/:slug/timesheets/approvals`

**Access Control:**

- Visible only to users with `admin` or `owner` roles
- Auto-redirects non-admin users to main timesheets list
- Accessible from sidebar as submenu under "Timesheets" (admin only)

**Key Features:**

#### Statistics Dashboard

- **Pending Approvals Count** - Number of timesheets awaiting approval
- **Total Hours** - Sum of all hours in displayed timesheets
- **Billable Hours** - Sum of billable hours in displayed timesheets

#### Advanced Filtering

- **Status Filter** - Filter by submitted, approved, or rejected
- **User Filter** - Filter by specific user (searchable dropdown)
- **Date Range Filter** - Filter by week start/end dates

#### Timesheet List

- Displays all timesheets matching filter criteria
- Shows key information:
  - User name and email
  - Week range (start - end date)
  - Total hours
  - Billable hours
  - Submission date and time
  - Current status
- Sortable columns
- Pagination support (50 items per page)

#### Quick Actions

- **View** - Navigate to detailed timesheet view
- **Approve** - Quick approve with confirmation dialog
- **Reject** - Reject with required reason (modal form)

#### Bulk Operations

- **Row Selection** - Select multiple timesheets (only submitted ones)
- **Bulk Approve** - Approve multiple timesheets at once
- **Selection Counter** - Shows number of selected items
- **Clear Selection** - Deselect all items

### 2. User Experience Enhancements

**Responsive Design:**

- Mobile-optimized layout
- Simplified pagination on mobile
- Collapsible filters
- Touch-friendly buttons

**Visual Feedback:**

- Status tags with colors (processing, success, error)
- Loading states during API calls
- Success/error messages
- Confirmation dialogs for critical actions

**Navigation:**

- Accessible from sidebar under "Timesheets" → "Approvals"
- Back button to return to main timesheets list
- Breadcrumb-style navigation
- Direct links to timesheet details

### 3. Integration with Existing Features

**Backend Integration:**

- Uses existing approve/reject API endpoints
- Leverages existing authorization middleware
- Maintains audit trail through TimesheetApproval model

**Frontend Integration:**

- Follows existing Refine patterns
- Uses custom data provider
- Consistent with design system
- Reuses existing components

## 🔄 Workflow

### Manager/Admin Workflow

1. **Access Approvals Page**

   - Click "Timesheets" in sidebar, then click "Approvals" submenu
   - Or navigate directly to `/tenants/:slug/timesheets/approvals`

2. **Review Pending Timesheets**

   - View statistics dashboard
   - Apply filters to narrow down list
   - Review timesheet details

3. **Approve/Reject**

   - **Single Approval:**
     - Click "Approve" button
     - Confirm in dialog
   - **Single Rejection:**
     - Click "Reject" button
     - Enter rejection reason (required, min 10 chars)
     - Submit
   - **Bulk Approval:**
     - Select multiple timesheets using checkboxes
     - Click "Approve Selected"
     - Confirm bulk action

4. **View Details**
   - Click "View" to see full timesheet details
   - Review time entries
   - Check hours breakdown
   - Return to approvals list

### User Workflow

1. **Submit Timesheet**

   - Create/edit timesheet
   - Add time entries
   - Click "Submit for Approval"

2. **Wait for Approval**

   - Timesheet status changes to "Submitted"
   - Cannot edit while in submitted status

3. **Receive Decision**
   - **If Approved:**
     - Status changes to "Approved"
     - Timesheet locked (cannot edit)
   - **If Rejected:**
     - Status changes to "Rejected"
     - Rejection reason visible
     - Admin can reopen for editing

## 📊 Technical Implementation

### Frontend Components

**File:** `freelancer-hub-dashboard/src/pages/timesheets/approvals.tsx`

**Key Technologies:**

- React 19.1.0
- Ant Design 5.27.4
- Refine Core 5.0.3
- TypeScript

**Hooks Used:**

- `useList` - Fetch timesheets with filters
- `useCustomMutation` - Approve/reject actions
- `useGetIdentity` - Check user role
- `useGo` - Navigation
- `useState` - Local state management

**State Management:**

- Filter states (status, user, date range)
- Selected rows for bulk actions
- Modal visibility
- Form data

### API Endpoints Used

- `GET /api/v1/timesheets` - List timesheets with filters
- `POST /api/v1/timesheets/:id/approve` - Approve timesheet
- `POST /api/v1/timesheets/:id/reject` - Reject timesheet

### Authorization

- Role-based access control (admin/owner only)
- Tenant-scoped data
- Backend validation on all actions

## 🚀 Future Enhancements

### High Priority

1. **Notification System**

   - Email notifications when timesheets are submitted
   - In-app notifications for pending approvals
   - Reminder notifications for overdue approvals
   - User notifications on approve/reject

2. **Approval Comments**

   - Add optional comments when approving
   - View comment history
   - Thread-based discussions

3. **Advanced Filtering**
   - Filter by project
   - Filter by hours range
   - Filter by submission date
   - Save filter presets

### Medium Priority

4. **Bulk Reject**

   - Reject multiple timesheets with same reason
   - Individual reasons for each rejection

5. **Export Functionality**

   - Export approved timesheets to CSV/Excel
   - Export for payroll processing
   - Custom date range exports

6. **Approval Workflow**

   - Multi-level approval (e.g., manager → director)
   - Conditional approval rules
   - Auto-approval for certain criteria

7. **Analytics Dashboard**
   - Approval rate metrics
   - Average approval time
   - User submission patterns
   - Hours trends

### Low Priority

8. **Approval Templates**

   - Pre-defined rejection reasons
   - Quick response templates
   - Custom message templates

9. **Delegation**

   - Delegate approval authority
   - Temporary approvers
   - Approval groups

10. **Integration with Payroll**
    - Link approved timesheets to payroll batches
    - Auto-create payroll entries
    - Payroll export formats

## 📝 Usage Examples

### Example 1: Approve All Timesheets for a User

1. Navigate to Approvals page
2. Select user from "Filter by user" dropdown
3. Select all submitted timesheets using checkboxes
4. Click "Approve Selected"
5. Confirm bulk approval

### Example 2: Reject Timesheet with Reason

1. Find timesheet in list
2. Click "Reject" button
3. Enter reason: "Please add more details to time entries for Project X"
4. Click "Reject"
5. User receives notification with reason

### Example 3: Review Before Approving

1. Find timesheet in list
2. Click "View" to see details
3. Review time entries and hours
4. Click "Approve" button in detail view
5. Confirm approval

## 🧪 Testing Checklist

### Functional Testing

- [ ] Admin can access approvals page
- [ ] Non-admin is redirected
- [ ] Statistics display correctly
- [ ] Filters work properly
- [ ] Single approve works
- [ ] Single reject works with reason
- [ ] Bulk approve works
- [ ] Row selection works
- [ ] Navigation works
- [ ] Pagination works

### UI/UX Testing

- [ ] Responsive on mobile
- [ ] Responsive on tablet
- [ ] Responsive on desktop
- [ ] Loading states display
- [ ] Error messages display
- [ ] Success messages display
- [ ] Confirmation dialogs work
- [ ] Modal forms work

### Integration Testing

- [ ] API calls succeed
- [ ] Authorization enforced
- [ ] Audit trail created
- [ ] Data refreshes after actions
- [ ] Filters persist during session

## 📚 Related Documentation

- `TIMESHEETS_FEATURE_RESEARCH_AND_PLAN.md` - Original research and planning
- `TIMESHEETS_IMPLEMENTATION_SUMMARY.md` - Complete implementation summary
- Backend API documentation at `/docs` endpoint

## 🎯 Summary

The Approvals page provides a powerful, user-friendly interface for managers to efficiently review and approve timesheets. Key benefits include:

- **Centralized Management** - All pending approvals in one place
- **Bulk Operations** - Approve multiple timesheets quickly
- **Advanced Filtering** - Find specific timesheets easily
- **Audit Trail** - All actions tracked and logged
- **Responsive Design** - Works on all devices
- **Role-Based Access** - Secure and controlled

This feature significantly improves the timesheet approval workflow and reduces the time managers spend on administrative tasks.
