# Financials Feature Analysis - Hubstaff Integration

## Executive Summary

This document analyzes Hubstaff's Financials feature and outlines the implementation plan for a comprehensive financial management system in the freelancer-hub-project. The system will build upon existing Invoice and Payment models from Phase 2 and add payroll management, payment processing, and invoice management interfaces.

---

## 1. Hubstaff Financials Feature Analysis

### **Core Features Identified:**

#### **1.1 Payroll Management**
- **Automated Payroll Calculation:**
  - Calculate payments based on tracked hours
  - Support hourly rates per team member
  - Handle different pay periods (weekly, bi-weekly, monthly)
  - Apply overtime rules if configured
  
- **Payment Provider Integration:**
  - Wise (TransferWise) for international payments
  - PayPal for standard payments
  - Direct bank transfers
  - Manual payment recording
  
- **Batch Processing:**
  - Pay multiple team members at once
  - Review and approve before processing
  - Track batch status
  - Handle failures gracefully

#### **1.2 Payment Creation**
- **Payment Form:**
  - Select recipient(s)
  - Choose payment method
  - Specify amount (auto-calculated or manual)
  - Select date range for included hours
  - Add description/notes
  - Preview before submission
  
- **Smart Calculations:**
  - Auto-calculate from billable hours
  - Apply hourly rates
  - Handle currency conversion
  - Calculate fees
  
- **Payment Linking:**
  - Link to invoices
  - Link to time entries
  - Support partial payments
  - Track payment history

#### **1.3 Payment History**
- **Comprehensive List:**
  - All past payments
  - Filter by date, recipient, method, status
  - Search functionality
  - Export to CSV
  
- **Payment Details:**
  - Full transaction information
  - Linked time entries
  - Linked invoices
  - Status tracking
  - Receipt/confirmation download

#### **1.4 Invoice Management**
- **Invoice List:**
  - All invoices with status
  - Quick filters (paid, unpaid, overdue)
  - Bulk actions
  - Search and sort
  
- **Invoice Creation:**
  - From time entries (automated)
  - Manual creation
  - Customizable templates
  - Line item management
  - Tax and discount support
  
- **Invoice Actions:**
  - Send via email
  - Download PDF
  - Mark as paid
  - Record partial payments
  - Track payment status

---

## 2. Wise (TransferWise) API Integration

### **2.1 API Overview**

**Base URL:** `https://api.transferwise.com` (Production)  
**Sandbox URL:** `https://api.sandbox.transferwise.tech`

**Authentication:** API Token (Bearer token)

### **2.2 Key Endpoints**

#### **Create Transfer:**
```
POST /v1/transfers
```

**Request:**
```json
{
  "targetAccount": 12345,
  "quoteUuid": "quote-uuid",
  "customerTransactionId": "unique-id",
  "details": {
    "reference": "Payment for services",
    "transferPurpose": "verification.transfers.purpose.pay.bills",
    "sourceOfFunds": "verification.source.of.funds.salary"
  }
}
```

#### **Get Transfer Status:**
```
GET /v1/transfers/{transferId}
```

#### **Fund Transfer:**
```
POST /v3/profiles/{profileId}/transfers/{transferId}/payments
```

### **2.3 Integration Requirements**

**Environment Variables:**
- `WISE_API_KEY` - API token
- `WISE_PROFILE_ID` - Business profile ID
- `WISE_ENVIRONMENT` - 'sandbox' or 'production'

**Database Fields (Payment model):**
- `wiseTransferId` - Wise transfer ID
- `wiseQuoteId` - Quote ID
- `wiseStatus` - Transfer status
- `wiseFee` - Transfer fee
- `wiseRate` - Exchange rate
- `wiseReference` - Transfer reference

---

## 3. Data Model Extensions

### **3.1 PayrollBatch Model**

```typescript
{
  id: number
  tenantId: number
  batchNumber: string // "PAYROLL-00001"
  payPeriodStart: Date
  payPeriodEnd: Date
  status: 'draft' | 'pending' | 'processing' | 'completed' | 'failed'
  totalAmount: number
  currency: string
  paymentCount: number
  processedAt: Date | null
  createdBy: number
  notes: string | null
  createdAt: Date
  updatedAt: Date
}
```

**Relationships:**
- Has many Payments
- Belongs to Tenant
- Belongs to User (creator)

### **3.2 Payment Model Extensions**

**New Fields:**
```typescript
{
  // Existing fields...
  
  // Wise Integration
  wiseTransferId: string | null
  wiseQuoteId: string | null
  wiseStatus: string | null
  wiseFee: number | null
  wiseRate: number | null
  wiseReference: string | null
  
  // Payroll
  payrollBatchId: number | null
  
  // Time Entries
  timeEntryIds: number[] | null // JSON array
  
  // Additional
  currency: string // default 'USD'
  exchangeRate: number | null
  feeAmount: number | null
  netAmount: number // amount - feeAmount
}
```

### **3.3 Invoice Model Extensions**

**New Fields:**
```typescript
{
  // Existing fields...
  
  // Email Tracking
  sentAt: Date | null
  sentTo: string | null
  emailCount: number // default 0
  lastEmailSentAt: Date | null
  
  // PDF
  pdfUrl: string | null
  pdfGeneratedAt: Date | null
  
  // Terms
  paymentTerms: string | null // "Net 30", "Due on receipt", etc.
  
  // Client Info
  clientName: string | null
  clientEmail: string | null
  clientAddress: string | null
}
```

---

## 4. Backend Implementation Plan

### **4.1 New Services**

#### **WiseService**
**File:** `app/services/wise_service.ts`

**Methods:**
- `createQuote(amount, sourceCurrency, targetCurrency)` - Get exchange rate quote
- `createRecipient(recipientData)` - Create recipient account
- `createTransfer(quoteId, recipientId, reference)` - Create transfer
- `fundTransfer(transferId)` - Fund the transfer
- `getTransferStatus(transferId)` - Check transfer status
- `cancelTransfer(transferId)` - Cancel pending transfer

#### **PayrollService**
**File:** `app/services/payroll_service.ts`

**Methods:**
- `calculatePayroll(userId, startDate, endDate)` - Calculate payment amount
- `createPayrollBatch(userIds, startDate, endDate)` - Create batch
- `processPayrollBatch(batchId)` - Process all payments in batch
- `getPayrollSummary(batchId)` - Get batch summary

#### **InvoiceService**
**File:** `app/services/invoice_service.ts`

**Methods:**
- `generatePDF(invoiceId)` - Generate PDF invoice
- `sendInvoiceEmail(invoiceId, recipientEmail)` - Send invoice via email
- `recordPayment(invoiceId, paymentData)` - Record payment against invoice
- `checkOverdue()` - Check and update overdue invoices

### **4.2 New Controllers**

#### **PayrollController**
**Endpoints:**
- `GET /payroll/batches` - List payroll batches
- `GET /payroll/batches/:id` - Get batch details
- `POST /payroll/batches` - Create new batch
- `POST /payroll/batches/:id/process` - Process batch
- `GET /payroll/calculate` - Calculate payroll for user/period
- `DELETE /payroll/batches/:id` - Delete draft batch

#### **FinancialsController**
**Endpoints:**
- `GET /financials/dashboard` - Financial dashboard data
- `GET /financials/summary` - Financial summary stats
- `POST /financials/payments/wise` - Create Wise payment
- `GET /financials/payments/wise/:id/status` - Check Wise payment status

---

## 5. Frontend Implementation Plan

### **5.1 Page Structure**

```
/tenants/:slug/financials/
  ├── /dashboard (Financial overview)
  ├── /payroll (Payroll management)
  ├── /payments/create (Create payment)
  ├── /payments/history (Past payments)
  └── /invoices (Invoice management)
      ├── /invoices/create (Create invoice)
      ├── /invoices/:id (View invoice)
      └── /invoices/:id/edit (Edit invoice)
```

### **5.2 Component Breakdown**

#### **Payroll Management Page**
**Components:**
- `PayrollBatchList` - List of payroll batches
- `PayrollBatchCard` - Individual batch card
- `CreatePayrollBatchModal` - Create new batch
- `PayrollCalculator` - Calculate payroll preview
- `PayrollSummary` - Batch summary statistics

#### **Create Payment Page**
**Components:**
- `PaymentForm` - Main payment creation form
- `RecipientSelector` - Select team member(s)
- `PaymentMethodSelector` - Choose payment method
- `AmountCalculator` - Calculate from hours or manual
- `PaymentPreview` - Preview before submission
- `WisePaymentForm` - Wise-specific fields

#### **Past Payments Page**
**Components:**
- `PaymentHistoryTable` - Paginated payment list
- `PaymentFilters` - Filter controls
- `PaymentDetailsModal` - View payment details
- `PaymentStatusBadge` - Status indicator
- `PaymentReceiptDownload` - Download receipt

#### **Invoices Management Page**
**Components:**
- `InvoiceList` - Invoice table
- `InvoiceFilters` - Filter controls
- `InvoiceCard` - Invoice card view
- `InvoiceForm` - Create/edit invoice
- `InvoicePreview` - Preview invoice
- `InvoiceActions` - Quick actions (send, download, etc.)
- `InvoiceStatusBadge` - Status indicator

---

## 6. UI/UX Patterns

### **6.1 Responsive Design**

**Mobile (< 768px):**
- Vertical forms
- Full-width inputs
- Stacked cards
- Simple tables with horizontal scroll
- Bottom sheet modals

**Tablet (768px - 992px):**
- 2-column forms
- Grid layouts
- Side-by-side previews

**Desktop (> 992px):**
- Multi-column layouts
- Side-by-side form + preview
- Full-featured tables
- Modal dialogs

### **6.2 Color Coding**

**Payment Status:**
- Pending: Orange (#faad14)
- Processing: Blue (#1890ff)
- Completed: Green (#52c41a)
- Failed: Red (#ff4d4f)
- Cancelled: Gray (#8c8c8c)

**Invoice Status:**
- Draft: Gray (#8c8c8c)
- Sent: Blue (#1890ff)
- Paid: Green (#52c41a)
- Overdue: Red (#ff4d4f)
- Cancelled: Gray (#d9d9d9)

### **6.3 User Flows**

#### **Create Payroll Flow:**
1. Navigate to Payroll page
2. Click "Create Payroll Batch"
3. Select pay period (start/end dates)
4. Select team members (or all)
5. Review calculated amounts
6. Adjust if needed
7. Preview batch
8. Submit for processing
9. Confirm and process payments

#### **Create Payment Flow:**
1. Navigate to Create Payment
2. Select recipient
3. Choose payment method (Wise)
4. Select date range or enter manual amount
5. Review calculated amount
6. Add notes/reference
7. Preview payment details
8. Submit payment
9. Track status

#### **Invoice Flow:**
1. Navigate to Invoices
2. Click "Create Invoice" or "Generate from Time"
3. Fill invoice details
4. Add line items
5. Apply tax/discount
6. Preview invoice
7. Save as draft or send immediately
8. Track payment status
9. Record payments when received

---

## 7. Security Considerations

### **7.1 Authentication & Authorization**
- Require admin/owner role for financial operations
- Implement 2FA for payment processing
- Audit log all financial transactions
- Rate limiting on payment endpoints

### **7.2 Data Protection**
- Encrypt sensitive financial data at rest
- Use HTTPS for all API calls
- Sanitize all inputs
- Validate amounts and calculations server-side

### **7.3 Wise Integration Security**
- Store API keys in environment variables
- Use sandbox for development/testing
- Implement webhook verification
- Handle API errors gracefully
- Log all Wise API interactions

---

## 8. Implementation Phases

### **Phase 1: Database & Models** (Day 1)
- Create migrations for new models
- Extend existing models
- Create model relationships
- Add validation rules

### **Phase 2: Backend Services** (Days 2-3)
- Implement WiseService
- Implement PayrollService
- Implement InvoiceService
- Create controllers
- Add routes
- Write tests

### **Phase 3: Frontend - Payroll** (Day 4)
- Create Payroll page
- Implement batch creation
- Add payroll calculator
- Test responsive design

### **Phase 4: Frontend - Payments** (Day 5)
- Create Payment creation page
- Create Payment history page
- Implement Wise integration UI
- Test payment flows

### **Phase 5: Frontend - Invoices** (Days 6-7)
- Create Invoice list page
- Create Invoice form
- Implement PDF generation
- Add email functionality
- Test invoice workflows

### **Phase 6: Testing & Polish** (Day 8)
- End-to-end testing
- Fix bugs
- Optimize performance
- Update documentation

---

## 9. Success Metrics

### **Functional Requirements:**
- ✅ Create and process payroll batches
- ✅ Integrate with Wise API (sandbox)
- ✅ Create and track payments
- ✅ Manage invoices (CRUD)
- ✅ Generate PDF invoices
- ✅ Send invoices via email
- ✅ Record payments against invoices
- ✅ Track payment status
- ✅ Export financial data

### **Technical Requirements:**
- ✅ Build passes with no TypeScript errors
- ✅ All pages responsive (mobile, tablet, desktop)
- ✅ Dark mode compatible
- ✅ Proper tenant isolation
- ✅ Audit logging implemented
- ✅ Security best practices followed

---

## 10. Future Enhancements

### **Phase 2 Features:**
- PayPal integration
- Stripe integration
- Recurring invoices
- Invoice templates
- Multi-currency support
- Tax calculation automation
- Expense tracking
- Financial reports (P&L, Balance Sheet)
- Budget forecasting
- Payment reminders
- Late fees automation

---

## Summary

This analysis provides a comprehensive blueprint for implementing a Hubstaff-inspired financial management system. The implementation will:

1. Build upon existing Invoice and Payment models
2. Add Wise API integration for international payments
3. Implement payroll batch processing
4. Create 4 new frontend pages with full responsive design
5. Maintain security and compliance standards
6. Provide a complete financial management solution

**Estimated Timeline:** 8 days  
**Complexity:** High  
**Dependencies:** Wise API account, Email service (e.g., SendGrid)

**Next Steps:**
1. Set up Wise sandbox account
2. Create database migrations
3. Implement backend services
4. Build frontend pages
5. Test end-to-end workflows
6. Deploy and monitor


