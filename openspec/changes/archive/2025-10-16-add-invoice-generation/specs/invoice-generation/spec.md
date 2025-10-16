# Invoice Generation Specification

## ADDED Requirements

### Requirement: Customer Selection
The system SHALL provide a dropdown to select a customer from the current tenant's customer list when creating an invoice.

#### Scenario: Display active customers
- **WHEN** owner opens invoice creation form
- **THEN** dropdown displays all customers belonging to the current tenant
- **AND** customers are sorted alphabetically by name

#### Scenario: Customer is required
- **WHEN** owner attempts to create invoice without selecting a customer
- **THEN** validation error is displayed
- **AND** invoice creation is blocked

### Requirement: Date Range Selection
The system SHALL allow owners to select a date range for filtering billable time entries, with suggested presets and custom range support.

#### Scenario: Suggested duration presets
- **WHEN** owner opens date range selector
- **THEN** suggested options are displayed: "This Month", "Last Month", "This Quarter", "Last Quarter", "Custom Range"

#### Scenario: This month preset
- **WHEN** owner selects "This Month"
- **THEN** date range is set from first day of current month to last day of current month

#### Scenario: Last month preset
- **WHEN** owner selects "Last Month"
- **THEN** date range is set from first day of previous month to last day of previous month

#### Scenario: This quarter preset
- **WHEN** owner selects "This Quarter"
- **THEN** date range is set from first day of current quarter to last day of current quarter

#### Scenario: Custom range selection
- **WHEN** owner selects "Custom Range"
- **THEN** date picker is displayed allowing selection of any start and end dates
- **AND** end date must be greater than or equal to start date

#### Scenario: Date range validation
- **WHEN** owner selects end date before start date
- **THEN** validation error is displayed
- **AND** invoice creation is blocked

### Requirement: Multi-Project Selection
The system SHALL allow owners to select multiple projects from a dropdown when creating an invoice.

#### Scenario: Display tenant projects
- **WHEN** owner opens project selector
- **THEN** dropdown displays all projects belonging to the current tenant
- **AND** projects are sorted alphabetically by name

#### Scenario: Select multiple projects
- **WHEN** owner selects multiple projects from dropdown
- **THEN** all selected projects are displayed as tags
- **AND** each tag has a remove option

#### Scenario: Remove selected project
- **WHEN** owner clicks remove on a project tag
- **THEN** project is removed from selection
- **AND** associated line items are removed from preview

#### Scenario: At least one project required
- **WHEN** owner attempts to create invoice without selecting any project
- **THEN** validation error is displayed
- **AND** invoice creation is blocked

### Requirement: Automatic Line Item Generation
The system SHALL automatically generate invoice line items based on selected projects, date range, and billable time entries.

#### Scenario: Generate items per project member
- **WHEN** owner selects projects and date range
- **THEN** system queries all time entries for selected projects within date range
- **AND** time entries are grouped by project and user
- **AND** one line item is created per project-user combination with billable hours

#### Scenario: Line item description format
- **WHEN** line item is generated for a project member
- **THEN** description is formatted as "{Project Name} - {Developer Full Name}"

#### Scenario: Line item unit price from project member rate
- **WHEN** line item is generated for a project member
- **THEN** unit price is set to the hourly rate from project_members table
- **AND** if project member has no hourly rate, line item is skipped with warning

#### Scenario: Line item quantity from time entries
- **WHEN** line item is generated for a project member
- **THEN** quantity is calculated as total billable hours (sum of durationMinutes / 60)
- **AND** only time entries with billable = true are included
- **AND** quantity is rounded to 2 decimal places

#### Scenario: Line item amount calculation
- **WHEN** line item is generated
- **THEN** amount is calculated as quantity × unit price
- **AND** amount is rounded to 2 decimal places

#### Scenario: No billable hours in range
- **WHEN** selected projects have no billable time entries in date range
- **THEN** warning message is displayed
- **AND** no line items are generated
- **AND** invoice creation is blocked

#### Scenario: Filter only billable entries
- **WHEN** generating line items
- **THEN** only time entries with billable = true are included
- **AND** non-billable time entries are excluded

### Requirement: Line Items Preview
The system SHALL display a preview of auto-generated line items before invoice creation.

#### Scenario: Display preview after project selection
- **WHEN** owner selects at least one project and date range
- **THEN** line items preview is displayed immediately
- **AND** preview shows description, quantity (hours), unit price, and amount for each item

#### Scenario: Update preview on selection change
- **WHEN** owner changes project selection or date range
- **THEN** line items preview is recalculated and updated automatically

#### Scenario: Display totals in preview
- **WHEN** line items preview is displayed
- **THEN** subtotal is shown as sum of all line item amounts
- **AND** tax amount is calculated based on tax rate (if applicable)
- **AND** total amount is shown as subtotal + tax - discount

### Requirement: Invoice Persistence
The system SHALL save the invoice with generated line items and maintain traceability to time entries.

#### Scenario: Create invoice with line items
- **WHEN** owner submits invoice creation form
- **THEN** invoice record is created with status 'draft'
- **AND** all line items are created and linked to invoice
- **AND** invoice is linked to selected projects via invoice_projects table
- **AND** invoice is linked to selected customer

#### Scenario: Link line items to time entries
- **WHEN** line item is created
- **THEN** system stores reference to all contributing time entry IDs
- **AND** time entries can be traced back from invoice item

#### Scenario: Set invoice metadata
- **WHEN** invoice is created
- **THEN** issue_date is set to current date
- **AND** due_date is set based on payment terms (default 30 days)
- **AND** invoice_number is auto-generated sequentially per tenant
- **AND** subtotal, tax_amount, total_amount are calculated from line items

### Requirement: Validation and Error Handling
The system SHALL validate all inputs and provide clear error messages for invalid states.

#### Scenario: Project member without hourly rate
- **WHEN** generating line items for project member without hourly rate
- **THEN** warning is displayed: "Project member {name} on {project} has no hourly rate set"
- **AND** line item for that member is skipped
- **AND** other line items are generated normally

#### Scenario: Empty time entries for project member
- **WHEN** project member has no billable time entries in date range
- **THEN** no line item is generated for that member
- **AND** no error is displayed (normal case)

#### Scenario: Tenant isolation
- **WHEN** generating invoice
- **THEN** only customers from current tenant are selectable
- **AND** only projects from current tenant are selectable
- **AND** only time entries from current tenant are included

### Requirement: User Permissions
The system SHALL restrict invoice creation to tenant owners only.

#### Scenario: Owner can create invoices
- **WHEN** user with owner role accesses invoice creation
- **THEN** full form is displayed with all capabilities

#### Scenario: Non-owner access denied
- **WHEN** user without owner role attempts to access invoice creation
- **THEN** 403 Forbidden error is returned
- **AND** error message states "Only tenant owners can create invoices"
