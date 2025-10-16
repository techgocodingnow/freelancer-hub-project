# Invoice Generation Proposal

## Why

Enable tenant owners to generate invoices for customers by automatically calculating billable hours across multiple projects and team members. This streamlines the billing process by eliminating manual line item entry and reducing errors in time-to-invoice calculations.

## What Changes

- Add invoice creation form with customer selection, date range picker, and multi-project selector
- Implement automatic line item generation based on selected projects and date range
- Calculate billable hours per team member from time entries within the specified date range
- Generate invoice line items with format: "Project Name - Developer Name" as description
- Auto-populate unit price from project member hourly rate
- Auto-calculate quantity as total billable hours contributed by each member
- Auto-calculate amount as quantity × unit price
- Support suggested date ranges (this month, last month, this quarter, custom range)
- Link time entries to invoice items for traceability

## Impact

- **Affected specs:** `invoice-generation` (new capability)
- **Affected code:**
  - Backend:
    - `app/controllers/invoices_controller.ts` - Add invoice generation endpoint
    - `app/services/invoice_service.ts` - Business logic for auto-calculation
    - `app/validators/invoice_validator.ts` - Validation for creation request
    - `app/models/invoice_item.ts` - Add project member tracking fields
  - Frontend:
    - `src/pages/invoices/create.tsx` - Invoice creation form
    - `src/components/invoice/CustomerSelector.tsx` - Customer dropdown
    - `src/components/invoice/ProjectSelector.tsx` - Multi-project selector
    - `src/components/invoice/DateRangePicker.tsx` - Date range with presets
    - `src/components/invoice/LineItemsPreview.tsx` - Preview auto-generated items
  - Database:
    - May need migration to add `project_member_id` to invoice_items table for better tracking
