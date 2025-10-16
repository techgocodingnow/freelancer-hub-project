# Implementation Tasks

## 1. Backend - Role Model Enhancements
- [x] 1.1 Add `canViewAllInvoices()` helper method to Role model
- [x] 1.2 Add `canManageInvoices()` helper method to Role model
- [x] 1.3 Add `canExportInvoices()` helper method to Role model
- [x] 1.4 Add `canSendInvoices()` helper method to Role model
- [ ] 1.5 Write unit tests for new role helper methods

## 2. Backend - Invoice Controller Permission Checks
- [x] 2.1 Add role-based permission check to `show()` method
- [x] 2.2 Implement member-only-own-invoices logic in `show()` method
- [x] 2.3 Add role-based permission check to `generatePdf()` method (admin/owner only)
- [x] 2.4 Add role-based permission check to `send()` method (admin/owner only)
- [x] 2.5 Add proper error responses for permission denied (403 Forbidden)
- [ ] 2.6 Update existing functional tests to include permission scenarios

## 3. Backend - Email Service CC Support
- [x] 3.1 Update `sendInvoiceEmail()` method signature to accept `SendInvoiceEmailOptions` type
- [x] 3.2 Add email validation helper `isValidEmail()` in email service
- [x] 3.3 Implement CC recipient support in email sending logic
- [x] 3.4 Add email address validation for primary and CC emails
- [x] 3.5 Implement 10 CC recipient limit check
- [x] 3.6 Update email template to show CC recipients in header
- [ ] 3.7 Write unit tests for CC email functionality

## 4. Backend - Validators
- [x] 4.1 Create `sendInvoiceValidator` with email, ccEmails, subject, message fields
- [x] 4.2 Add email format validation for primary email (required)
- [x] 4.3 Add email format validation for CC emails (optional array)
- [x] 4.4 Add subject length validation (max 255 characters, optional)
- [x] 4.5 Add message length validation (max 1000 characters, optional)
- [x] 4.6 Add custom validation for comma-separated CC emails
- [ ] 4.7 Write validator tests covering all validation rules

## 5. Backend - Rate Limiting
- [ ] 5.1 Install/configure rate limiting library if not already present
- [ ] 5.2 Add per-tenant rate limiting to `send()` method (10/min)
- [ ] 5.3 Add per-user rate limiting to `send()` method (5/min)
- [ ] 5.4 Add proper error response for rate limit exceeded (429)
- [ ] 5.5 Test rate limiting behavior in functional tests

## 6. Backend - Invoice Controller Email Enhancements
- [x] 6.1 Update `send()` method to use `sendInvoiceValidator`
- [x] 6.2 Extract ccEmails from request and parse into array
- [x] 6.3 Pass ccEmails to `emailService.sendInvoiceEmail()`
- [x] 6.4 Pass optional subject and message to email service
- [x] 6.5 Update response to include sent recipients count
- [x] 6.6 Add error handling for email sending failures
- [x] 6.7 Update sent_at timestamp when email is sent

## 7. Backend - Invoice Model Updates
- [x] 7.1 Add `sentAt` datetime field to Invoice model (if not exists)
- [x] 7.2 Update invoice migration to add sent_at column
- [x] 7.3 Update invoice serialization to include sentAt field

## 8. Backend - Testing
- [ ] 8.1 Write functional tests for permission-based invoice viewing
- [ ] 8.2 Write functional tests for member-only-own-invoices restriction
- [ ] 8.3 Write functional tests for PDF export permissions
- [ ] 8.4 Write functional tests for email sending permissions
- [ ] 8.5 Write functional tests for CC email sending
- [ ] 8.6 Write functional tests for custom subject and message
- [ ] 8.7 Write functional tests for rate limiting
- [ ] 8.8 Write functional tests for email validation errors
- [ ] 8.9 Test cross-tenant access is properly denied

## 9. Frontend - API Client Updates
- [x] 9.1 Update `sendInvoice()` method signature to accept SendInvoiceRequest type
- [x] 9.2 Add TypeScript type for SendInvoiceRequest (email, ccEmails, subject, message)
- [x] 9.3 Add TypeScript type for SendInvoiceResponse
- [x] 9.4 Update endpoint definition in endpoint.ts if needed

## 10. Frontend - SendInvoiceModal Component
- [x] 10.1 Create `src/components/invoice/SendInvoiceModal.tsx` component
- [x] 10.2 Add form with email, ccEmails, subject, message fields
- [x] 10.3 Implement email validation for primary email (required)
- [x] 10.4 Implement CC email validation (comma-separated, optional)
- [x] 10.5 Add character limit displays for subject (255) and message (1000)
- [x] 10.6 Add loading state during email sending
- [x] 10.7 Add success notification on successful send
- [x] 10.8 Add error notification with error message
- [x] 10.9 Prepopulate primary email with customer email
- [x] 10.10 Clear form and close modal on success
- [ ] 10.11 Write React Testing Library tests for modal

## 11. Frontend - Invoice Detail Page Integration
- [x] 11.1 Find/create invoice detail page component
- [x] 11.2 Add "Send Invoice" button to invoice detail page
- [x] 11.3 Add "Export PDF" button to invoice detail page
- [ ] 11.4 Implement role-based button visibility (hide for members/viewers)
- [x] 11.5 Add SendInvoiceModal to invoice detail page
- [x] 11.6 Connect "Send Invoice" button to open modal
- [x] 11.7 Refresh invoice data after successful send
- [x] 11.8 Show invoice status badge (draft, sent, paid)

## 12. Frontend - Permission-Based UI
- [ ] 12.1 Create hook `useInvoicePermissions()` to check user role
- [ ] 12.2 Hide/show "Send Invoice" button based on permissions
- [ ] 12.3 Hide/show "Export PDF" button based on permissions
- [ ] 12.4 Show read-only view for viewer role
- [ ] 12.5 Add permission tooltips explaining why buttons are disabled
- [ ] 12.6 Test UI behavior for each role (owner, admin, member, viewer)

## 13. Frontend - Email Validation Helpers
- [ ] 13.1 Create `validateEmail()` helper function
- [ ] 13.2 Create `parseCCEmails()` helper to split comma-separated emails
- [ ] 13.3 Create `formatEmailList()` helper for display
- [ ] 13.4 Write unit tests for email helpers

## 14. Documentation
- [ ] 14.1 Update API documentation for `POST /invoices/:id/send` endpoint
- [ ] 14.2 Document new request payload schema (email, ccEmails, subject, message)
- [ ] 14.3 Document permission requirements for each invoice endpoint
- [ ] 14.4 Add permission matrix to README or docs
- [ ] 14.5 Update CLAUDE.md with permission patterns discovered

## 15. Database Migration
- [ ] 15.1 Create migration to add `sent_at` column to invoices table (if not exists)
- [ ] 15.2 Run migration in development environment
- [ ] 15.3 Test migration rollback

## 16. Email Template Updates
- [x] 16.1 Review existing invoice email template
- [x] 16.2 Update template to support custom message parameter
- [x] 16.3 Ensure PDF attachment is included in template
- [x] 16.4 Test email rendering with CC recipients
- [ ] 16.5 Test email rendering with custom subject and message

## 17. Testing & Quality
- [ ] 17.1 Run all backend tests and ensure 100% pass rate
- [ ] 17.2 Run all frontend tests
- [ ] 17.3 Run TypeScript type checking on both codebases
- [ ] 17.4 Manual testing: View invoice as owner (should see all)
- [ ] 17.5 Manual testing: View invoice as member (should see own only)
- [ ] 17.6 Manual testing: Export PDF as admin (should work)
- [ ] 17.7 Manual testing: Export PDF as member (should fail with 403)
- [ ] 17.8 Manual testing: Send email as owner with CC
- [ ] 17.9 Manual testing: Send email with custom subject and message
- [ ] 17.10 Manual testing: Test rate limiting by sending many emails quickly
- [ ] 17.11 Manual testing: Test email validation errors
- [ ] 17.12 Manual testing: Verify cross-tenant access is denied

## 18. Security Review
- [ ] 18.1 Review permission checks in all invoice endpoints
- [ ] 18.2 Review email validation logic for injection vulnerabilities
- [ ] 18.3 Review rate limiting configuration
- [ ] 18.4 Review tenant isolation in all queries
- [ ] 18.5 Test with security tools (SQL injection, XSS, etc.)

## 19. Deployment Preparation
- [ ] 19.1 Update environment variables documentation (MAIL_FROM_ADDRESS)
- [ ] 19.2 Prepare database migration script
- [ ] 19.3 Prepare rollback plan
- [ ] 19.4 Update release notes with permission changes
- [ ] 19.5 Create user communication about new permissions model
