# Invoice Permissions and Email Enhancement Proposal

## Why

Currently, invoice viewing, PDF generation, and email sending endpoints lack proper role-based access control. Additionally, the email functionality does not support CC recipients, limiting communication flexibility when sending invoices to customers.

This change adds:
1. Role-based access control for invoice operations
2. CC email support when sending invoices
3. Clear permissions matrix for invoice features

## What Changes

### 1. Add Role-Based Permissions for Invoice Operations

**View Invoice (`GET /invoices/:id`)**
- Currently: No role restrictions (inherited auth only)
- Proposed: Admin and Owner roles can view all invoices; Members can only view invoices they created

**Export Invoice as PDF (`POST /invoices/:id/pdf`)**
- Currently: No role restrictions (inherited auth only)
- Proposed: Admin and Owner roles only

**Send Invoice Email (`POST /invoices/:id/send`)**
- Currently: No role restrictions (inherited auth only)
- Proposed: Admin and Owner roles only

### 2. Add CC Email Support

**Email Request Payload:**
```typescript
{
  email: string          // Primary recipient (customer email)
  ccEmails?: string[]    // Optional CC recipients
  subject?: string       // Optional custom subject line
  message?: string       // Optional custom message
}
```

**Backend Changes:**
- Update `send()` method in `InvoicesController` to accept `ccEmails` array
- Update `emailService.sendInvoiceEmail()` to support CC recipients
- Validate all email addresses (primary + CC)
- Update email template to indicate CC recipients

**Frontend Changes:**
- Update invoice send modal/form to include CC email input
- Support multiple CC emails (comma-separated or multi-select)
- Validate email format before submission

## Impact

**Affected specs:**
- `invoice-management` (new capability covering view/export/send operations)

**Affected code:**
- Backend:
  - `app/controllers/invoices.ts` - Add role checks to `show()`, `generatePdf()`, `send()` methods
  - `app/services/email_service.ts` - Add CC support to `sendInvoiceEmail()`
  - `app/validators/invoices.ts` - Add `sendInvoiceValidator` with email and ccEmails validation
- Frontend:
  - `src/pages/financials/invoice-detail.tsx` (if exists) - Add send invoice button
  - `src/components/invoice/SendInvoiceModal.tsx` (new) - Modal for sending with CC support
  - `src/services/api/api.ts` - Update `sendInvoice()` method signature

**Security considerations:**
- Prevents unauthorized users from viewing sensitive invoice data
- Restricts PDF export to authorized roles only
- Restricts invoice sending to authorized roles only
- Validates all email addresses to prevent email injection
- Rate limiting on email sending (prevent spam)

**Breaking changes:**
- None - adding restrictions to previously unrestricted endpoints
- Existing owner role users will maintain full access
- Members will have restricted access (view own invoices only)
