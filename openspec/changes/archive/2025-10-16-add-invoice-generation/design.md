# Invoice Generation - Design Document

## Context

Currently, the application has invoice, invoice_item, and invoice_project models in place, but there's no automated way to generate invoices from tracked time. Users must manually create invoice items, which is error-prone and time-consuming. This feature automates the process by calculating billable hours from time entries and generating line items based on project member hourly rates.

**Stakeholders:**
- Freelancers and agency owners who need to bill clients
- Team members whose time is being billed
- Customers receiving invoices

**Constraints:**
- Must maintain multi-tenant data isolation
- Must support per-project member hourly rates
- Must handle cases where project members lack hourly rates
- Must be performant for large datasets (many time entries)

## Goals / Non-Goals

**Goals:**
- Automate invoice line item generation from time entries
- Reduce manual data entry and calculation errors
- Provide clear traceability from invoice items back to time entries
- Support flexible date range selection with common presets
- Allow multiple projects per invoice for consolidated billing

**Non-Goals:**
- Invoice templates and PDF generation (existing feature)
- Email sending (existing feature)
- Payment processing (existing feature)
- Recurring invoices or subscriptions
- Time entry approval workflow (separate concern)
- Multi-currency support (use existing currency field)

## Decisions

### Decision 1: Server-Side Line Item Calculation
**What:** Calculate line items on the backend during invoice creation, not client-side.

**Why:**
- Ensures data consistency and accuracy
- Single source of truth for calculations
- Simpler to test calculation logic in isolation
- Prevents client-side tampering with amounts
- Reduces payload size (send project IDs, not all time entries)

**Alternatives considered:**
- Client-side calculation with preview: Rejected due to security concerns and potential inconsistency
- Separate preview endpoint: Adds complexity without significant benefit; calculation is fast enough to do on creation

### Decision 2: Link Time Entries to Invoice Items via Junction Table
**What:** Create `invoice_item_time_entries` junction table to maintain many-to-many relationship.

**Why:**
- One invoice item may aggregate multiple time entries
- Provides full traceability for auditing
- Allows reconstructing invoice item calculations
- Supports future features like editing/recalculating invoices

**Schema:**
```sql
CREATE TABLE invoice_item_time_entries (
  id SERIAL PRIMARY KEY,
  invoice_item_id INTEGER NOT NULL REFERENCES invoice_items(id) ON DELETE CASCADE,
  time_entry_id INTEGER NOT NULL REFERENCES time_entries(id) ON DELETE RESTRICT,
  created_at TIMESTAMP NOT NULL,
  UNIQUE(invoice_item_id, time_entry_id)
);
```

**Alternatives considered:**
- Store time_entry_id array in invoice_item: Rejected due to poor relational design
- No tracking: Rejected due to lack of auditability

### Decision 3: Add project_member_id to Invoice Items
**What:** Add `project_member_id` column to `invoice_items` table.

**Why:**
- Captures which project member's rate was used
- Provides context for line item description
- Enables reporting on revenue per team member
- Handles cases where project member hourly rate changes later

**Migration:**
```sql
ALTER TABLE invoice_items
ADD COLUMN project_member_id INTEGER REFERENCES project_members(id) ON DELETE SET NULL;
```

### Decision 4: One Line Item Per Project-Member Combination
**What:** Generate one invoice line item for each unique project + team member combination.

**Why:**
- Clear itemization showing who worked on what
- Matches common invoicing practices
- Easier to review and audit
- Supports different hourly rates per member

**Format:**
- Description: "{Project Name} - {Developer Full Name}"
- Quantity: Total hours (sum of billable time entries / 60)
- Unit Price: Project member hourly rate
- Amount: Quantity × Unit Price

**Alternatives considered:**
- One item per project (all members aggregated): Rejected - loses visibility into team contributions
- One item per time entry: Rejected - too granular, cluttered invoices

### Decision 5: Skip Members Without Hourly Rates with Warning
**What:** If project member has no hourly rate set, skip their time entries and display warning.

**Why:**
- Prevents creating $0 line items
- Alerts user to data quality issue
- Allows partial invoice creation for members with rates
- User can fix rates and regenerate invoice

**Warning message:** "Project member {name} on {project} has no hourly rate set. Their time entries were excluded from this invoice."

**Alternatives considered:**
- Block entire invoice creation: Rejected - too strict, prevents partial billing
- Create $0 items: Rejected - confusing for customers

### Decision 6: Date Range Presets for Common Billing Cycles
**What:** Provide preset options: This Month, Last Month, This Quarter, Last Quarter, Custom Range.

**Why:**
- Most billing follows monthly or quarterly cycles
- Reduces manual date selection errors
- Faster workflow for common cases
- Custom range still available for flexibility

**Implementation:**
```typescript
const DATE_RANGE_PRESETS = {
  THIS_MONTH: { start: startOfMonth(today), end: endOfMonth(today) },
  LAST_MONTH: { start: startOfMonth(subMonths(today, 1)), end: endOfMonth(subMonths(today, 1)) },
  THIS_QUARTER: { start: startOfQuarter(today), end: endOfQuarter(today) },
  LAST_QUARTER: { start: startOfQuarter(subQuarters(today, 1)), end: endOfQuarter(subQuarters(today, 1)) },
  CUSTOM: null, // User provides dates
};
```

### Decision 7: Owner-Only Permission
**What:** Restrict invoice creation to tenant owners only.

**Why:**
- Invoicing is sensitive financial operation
- Prevents unauthorized billing
- Aligns with typical business hierarchy
- Can be relaxed later if needed

**Implementation:**
- Check `user.role === 'owner'` in controller
- Return 403 Forbidden for non-owners
- Frontend hides create button for non-owners

## Risks / Trade-offs

### Risk: Large Time Entry Datasets
**Impact:** Queries may be slow for projects with thousands of time entries.

**Mitigation:**
- Add database indexes on `time_entries.date`, `time_entries.billable`, `task.project_id`
- Use eager loading to avoid N+1 queries
- Consider pagination or warnings for very large date ranges
- Monitor query performance in production

### Risk: Race Conditions on Invoice Number Generation
**Impact:** Two simultaneous invoice creations could generate duplicate invoice numbers.

**Mitigation:**
- Use database transactions with row-level locking
- Query max invoice number with `FOR UPDATE` before generating next
- Add unique constraint on `(tenant_id, invoice_number)` in database
- Handle duplicate key errors gracefully with retry

### Risk: Changing Hourly Rates
**Impact:** If project member hourly rate changes after invoice creation, historical invoices may seem incorrect.

**Mitigation:**
- Store `project_member_id` in invoice_item to reference original rate
- Invoice item stores `unit_price` (snapshot of rate at time of invoice)
- Project member hourly rate changes don't affect existing invoices
- Supports auditing and explanation if questioned

### Trade-off: No Real-Time Preview
**Impact:** Users don't see line items until they submit the form.

**Justification:**
- Calculation is fast enough to do on form submission
- Reduces backend API calls
- Simpler implementation without preview endpoint
- Can add preview later if users request it

## Migration Plan

### Step 1: Database Changes
1. Create migration for `project_member_id` column on `invoice_items`
2. Create migration for `invoice_item_time_entries` junction table
3. Run migrations in development and test environments
4. Verify migrations are reversible with proper `down()` methods

### Step 2: Backend Implementation (TDD)
1. Write tests for `InvoiceService` pure functions
2. Implement service functions to pass tests
3. Write tests for `InvoicesController.store()` endpoint
4. Implement controller to pass tests
5. Write functional tests for API endpoint
6. Ensure 100% test coverage

### Step 3: Frontend Implementation (TDD)
1. Write tests for components (CustomerSelector, ProjectSelector, etc.)
2. Implement components to pass tests
3. Write tests for invoice creation page
4. Implement page to pass tests
5. Integrate with Refine data provider

### Step 4: Testing & Validation
1. Run full test suite (backend + frontend)
2. Manual testing of all scenarios
3. Test with production-like data volumes
4. Performance testing for large time entry sets
5. Cross-browser testing (Chrome, Firefox, Safari)

### Step 5: Deployment
1. Deploy backend with migrations to staging
2. Deploy frontend to staging
3. Smoke test in staging environment
4. Deploy to production during low-traffic window
5. Monitor error rates and performance

### Rollback Plan
- Database migrations are reversible via `down()` methods
- Feature can be disabled by removing route or adding feature flag
- Existing invoice creation (if any) remains unaffected
- No data loss risk as feature only creates new records

## Open Questions

1. **Should we support editing/recalculating invoices after creation?**
   - Decision: Out of scope for initial implementation
   - Users can delete draft invoices and recreate if needed
   - Can be added as future enhancement

2. **Should we allow manual adjustment of auto-generated line items?**
   - Decision: No for initial version - invoice is auto-generated snapshot
   - Users can edit invoice after creation using existing edit functionality
   - Keeps initial implementation simpler

3. **Should we track which time entries have been invoiced to prevent double-billing?**
   - Decision: Yes, via `invoice_item_time_entries` junction table
   - Frontend can filter out already-invoiced time entries in future iteration
   - For now, user is responsible for selecting correct date range

4. **Should we support hourly rate overrides at invoice creation time?**
   - Decision: No for initial version
   - User should update project member hourly rate if needed, then create invoice
   - Can be added as future enhancement if requested
