# invoice-management Specification Delta

## ADDED Requirements

### Requirement: Role-Based Invoice Viewing

The system SHALL restrict invoice viewing based on user roles within the tenant.

#### Scenario: Owner can view all invoices
- **WHEN** user with owner role requests to view an invoice
- **THEN** invoice details are returned regardless of who created it
- **AND** all related data (customer, items, payments) are included

#### Scenario: Admin can view all invoices
- **WHEN** user with admin role requests to view an invoice
- **THEN** invoice details are returned regardless of who created it
- **AND** all related data (customer, items, payments) are included

#### Scenario: Member can view own invoices only
- **WHEN** user with member role requests to view an invoice they created
- **THEN** invoice details are returned with all related data

#### Scenario: Member cannot view others' invoices
- **WHEN** user with member role requests to view an invoice created by another user
- **THEN** 403 Forbidden error is returned
- **AND** error message states "You can only view invoices you created"

#### Scenario: Viewer can view all invoices
- **WHEN** user with viewer role requests to view an invoice
- **THEN** invoice details are returned regardless of who created it
- **AND** all related data is included (read-only access)

#### Scenario: Unauthenticated access denied
- **WHEN** unauthenticated user attempts to view an invoice
- **THEN** 401 Unauthorized error is returned

### Requirement: Role-Based PDF Export

The system SHALL restrict invoice PDF export to authorized roles only.

#### Scenario: Owner can export invoice PDF
- **WHEN** user with owner role requests to export invoice as PDF
- **THEN** PDF is generated and URL is returned
- **AND** invoice.pdfUrl field is updated with generated PDF path

#### Scenario: Admin can export invoice PDF
- **WHEN** user with admin role requests to export invoice as PDF
- **THEN** PDF is generated and URL is returned
- **AND** invoice.pdfUrl field is updated with generated PDF path

#### Scenario: Member cannot export PDF
- **WHEN** user with member role attempts to export invoice as PDF
- **THEN** 403 Forbidden error is returned
- **AND** error message states "Insufficient permissions to export invoices"

#### Scenario: Viewer cannot export PDF
- **WHEN** user with viewer role attempts to export invoice as PDF
- **THEN** 403 Forbidden error is returned
- **AND** error message states "Insufficient permissions to export invoices"

#### Scenario: PDF generation success
- **WHEN** authorized user exports invoice as PDF
- **THEN** PDF contains invoice number, customer details, line items, and totals
- **AND** PDF is formatted according to tenant branding (if configured)
- **AND** PDF is stored in persistent storage

### Requirement: Role-Based Email Sending

The system SHALL restrict invoice email sending to authorized roles only.

#### Scenario: Owner can send invoice email
- **WHEN** user with owner role requests to send invoice via email
- **THEN** email is sent to specified recipient
- **AND** invoice status is updated to 'sent' if it was 'draft'
- **AND** sent_at timestamp is recorded

#### Scenario: Admin can send invoice email
- **WHEN** user with admin role requests to send invoice via email
- **THEN** email is sent to specified recipient
- **AND** invoice status is updated to 'sent' if it was 'draft'

#### Scenario: Member cannot send invoice email
- **WHEN** user with member role attempts to send invoice via email
- **THEN** 403 Forbidden error is returned
- **AND** error message states "Insufficient permissions to send invoices"

#### Scenario: Viewer cannot send invoice email
- **WHEN** user with viewer role attempts to send invoice via email
- **THEN** 403 Forbidden error is returned
- **AND** error message states "Insufficient permissions to send invoices"

### Requirement: CC Email Support

The system SHALL support sending invoices to multiple recipients using CC (carbon copy).

#### Scenario: Send invoice with CC recipients
- **WHEN** authorized user sends invoice with CC email addresses
- **THEN** primary recipient receives invoice email
- **AND** all CC recipients receive the same invoice email
- **AND** email header shows all CC recipients

#### Scenario: Validate CC email addresses
- **WHEN** user provides invalid CC email address
- **THEN** 400 Bad Request error is returned
- **AND** error message indicates which email address is invalid

#### Scenario: Limit CC recipients
- **WHEN** user provides more than 10 CC email addresses
- **THEN** 400 Bad Request error is returned
- **AND** error message states "Maximum 10 CC recipients allowed"

#### Scenario: Send invoice without CC
- **WHEN** user sends invoice without providing CC email addresses
- **THEN** email is sent to primary recipient only
- **AND** no CC header is included in email

#### Scenario: CC email formatting
- **WHEN** user provides CC emails with whitespace
- **THEN** system trims whitespace from email addresses
- **AND** validates each email after trimming

### Requirement: Custom Email Content

The system SHALL allow users to customize email subject and message when sending invoices.

#### Scenario: Send with custom subject
- **WHEN** user provides custom subject line
- **THEN** email is sent with provided subject
- **AND** invoice number is appended if not already in subject

#### Scenario: Send with default subject
- **WHEN** user does not provide custom subject
- **THEN** email subject is "Invoice {invoiceNumber} from {tenantName}"

#### Scenario: Send with custom message
- **WHEN** user provides custom message
- **THEN** custom message is included in email body above invoice details

#### Scenario: Send with default message
- **WHEN** user does not provide custom message
- **THEN** default message "Please find attached invoice {invoiceNumber}" is used

#### Scenario: Message length validation
- **WHEN** user provides message longer than 1000 characters
- **THEN** 400 Bad Request error is returned
- **AND** error message states "Message must not exceed 1000 characters"

### Requirement: Email Validation and Security

The system SHALL validate all email addresses and prevent email abuse.

#### Scenario: Validate primary recipient email
- **WHEN** user provides invalid primary email address
- **THEN** 400 Bad Request error is returned
- **AND** error message indicates invalid email format

#### Scenario: Prevent email injection
- **WHEN** user provides email address with newline characters
- **THEN** 400 Bad Request error is returned
- **AND** error message states "Invalid email address"

#### Scenario: Rate limiting per tenant
- **WHEN** tenant exceeds 10 invoice emails per minute
- **THEN** 429 Too Many Requests error is returned
- **AND** error message states "Email rate limit exceeded, please try again later"

#### Scenario: Rate limiting per user
- **WHEN** user exceeds 5 invoice emails per minute
- **THEN** 429 Too Many Requests error is returned
- **AND** error message states "Email rate limit exceeded, please try again later"

#### Scenario: PDF attachment required
- **WHEN** sending invoice email
- **THEN** PDF must be generated before email is sent
- **AND** PDF is attached to email
- **AND** PDF filename is "invoice-{invoiceNumber}.pdf"

### Requirement: Invoice Status Updates

The system SHALL update invoice status when emails are sent successfully.

#### Scenario: Update draft to sent
- **WHEN** invoice with 'draft' status is sent via email
- **THEN** invoice status is updated to 'sent'
- **AND** sent_at timestamp is set to current datetime

#### Scenario: Do not update non-draft invoices
- **WHEN** invoice with 'sent' or 'paid' status is sent again
- **THEN** invoice status remains unchanged
- **AND** sent_at timestamp is not updated

#### Scenario: Record email history
- **WHEN** invoice email is sent successfully
- **THEN** system records recipient email addresses
- **AND** system records CC email addresses (if any)
- **AND** system records sent timestamp

### Requirement: Tenant Isolation

The system SHALL maintain strict tenant isolation for all invoice operations.

#### Scenario: Cross-tenant invoice access denied
- **WHEN** user attempts to view invoice from different tenant
- **THEN** 404 Not Found error is returned
- **AND** no information about invoice existence is leaked

#### Scenario: Cross-tenant PDF export denied
- **WHEN** user attempts to export PDF for invoice from different tenant
- **THEN** 404 Not Found error is returned

#### Scenario: Cross-tenant email sending denied
- **WHEN** user attempts to send email for invoice from different tenant
- **THEN** 404 Not Found error is returned

## MODIFIED Requirements

### Requirement: Invoice Retrieval

The system SHALL enforce role-based access control when retrieving invoice details.

**CHANGED**: Added role-based permission checks to invoice viewing operations.

**Previous behavior**: Any authenticated user in the tenant could view any invoice.

**New behavior**: Invoice viewing is restricted based on user role:
- Owner/Admin: Can view all invoices in the tenant
- Member: Can only view invoices they personally created
- Viewer: Can view all invoices in the tenant (read-only access)

#### Scenario: Maintain backward compatibility for owners
- **WHEN** owner user views an invoice (same as before)
- **THEN** invoice is returned with all details
- **AND** no behavior change from previous version

#### Scenario: Maintain backward compatibility for admins
- **WHEN** admin user views an invoice (same as before)
- **THEN** invoice is returned with all details
- **AND** no behavior change from previous version

#### Scenario: New restriction for members
- **WHEN** member user attempts to view invoice created by another user
- **THEN** 403 Forbidden error is returned
- **AND** error message states "You can only view invoices you created"
- **NOTE**: This is a new restriction that did not exist before
