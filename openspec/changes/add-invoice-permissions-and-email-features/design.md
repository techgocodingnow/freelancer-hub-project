# Invoice Permissions and Email Enhancement Design

## Architecture Overview

This change enhances the existing invoice system with role-based access control and improved email functionality. The design maintains backward compatibility while adding security through proper permission checks.

## Role Permission Matrix

| Operation | Owner | Admin | Member | Viewer |
|-----------|-------|-------|--------|--------|
| Create Invoice | ✅ | ✅ | ❌ | ❌ |
| View Invoice | ✅ All | ✅ All | ✅ Own only | ✅ All (read-only) |
| Export PDF | ✅ | ✅ | ❌ | ❌ |
| Send Email | ✅ | ✅ | ❌ | ❌ |
| Update Invoice | ✅ | ✅ | ❌ | ❌ |
| Delete Invoice | ✅ | ✅ | ❌ | ❌ |

### Rationale

- **Owner/Admin**: Full control over invoices (create, view all, export, send, update, delete)
- **Member**: Limited read access to invoices they created (useful for freelancers tracking their own invoices)
- **Viewer**: Read-only access to all invoices (useful for accountants or auditors)

## Permission Implementation Pattern

### Controller-Level Authorization

```typescript
// Example: Invoice show method with role-based access
async show({ tenant, auth, userRole, params, response }: HttpContext) {
  const user = auth.getUserOrFail()

  const invoice = await Invoice.query()
    .where('id', params.id)
    .where('tenant_id', tenant.id)
    .preload('user')
    .preload('customer')
    .preload('items')
    .first()

  if (!invoice) {
    return response.notFound({ error: 'Invoice not found' })
  }

  // Permission check: Admin/Owner can view all, Members can only view their own
  if (!userRole.isAdmin() && !userRole.isOwner()) {
    if (userRole.isMember() && invoice.userId !== user.id) {
      return response.forbidden({
        error: 'You can only view invoices you created'
      })
    } else if (!userRole.isMember()) {
      return response.forbidden({
        error: 'Insufficient permissions to view invoices'
      })
    }
  }

  return response.ok({ data: invoice })
}
```

### Reusable Permission Helpers

Consider adding permission helpers to the Role model:

```typescript
// app/models/role.ts additions
canViewAllInvoices(): boolean {
  return this.isAdmin() || this.isOwner() || this.isViewer()
}

canManageInvoices(): boolean {
  return this.isAdmin() || this.isOwner()
}

canExportInvoices(): boolean {
  return this.isAdmin() || this.isOwner()
}

canSendInvoices(): boolean {
  return this.isAdmin() || this.isOwner()
}
```

## CC Email Implementation

### Email Service Enhancement

```typescript
// app/services/email_service.ts
type SendInvoiceEmailOptions = {
  invoice: Invoice
  to: string
  cc?: string[]
  subject?: string
  message?: string
}

async sendInvoiceEmail(options: SendInvoiceEmailOptions): Promise<void> {
  const { invoice, to, cc = [], subject, message } = options

  // Validate all email addresses
  const allEmails = [to, ...cc]
  for (const email of allEmails) {
    if (!this.isValidEmail(email)) {
      throw new Error(`Invalid email address: ${email}`)
    }
  }

  // Generate PDF if not already generated
  if (!invoice.pdfUrl) {
    await pdfService.generateInvoicePDF(invoice)
  }

  // Prepare email content
  const defaultSubject = `Invoice ${invoice.invoiceNumber} from ${invoice.tenant.name}`
  const defaultMessage = `Please find attached invoice ${invoice.invoiceNumber}.`

  // Send email with CC support
  await mail.send((message) => {
    message
      .to(to)
      .cc(...cc)
      .from(process.env.MAIL_FROM_ADDRESS!)
      .subject(subject || defaultSubject)
      .htmlView('emails/invoice', {
        invoice,
        customMessage: message || defaultMessage,
      })
      .attach(invoice.pdfUrl!, {
        filename: `invoice-${invoice.invoiceNumber}.pdf`,
      })
  })

  // Update invoice status
  if (invoice.status === 'draft') {
    invoice.status = 'sent'
    invoice.sentAt = DateTime.now()
    await invoice.save()
  }
}
```

### Validation Schema

```typescript
// app/validators/invoices.ts
export const sendInvoiceValidator = vine.compile(
  vine.object({
    email: vine.string().email().trim(),
    ccEmails: vine.array(vine.string().email().trim()).optional(),
    subject: vine.string().trim().maxLength(255).optional(),
    message: vine.string().trim().maxLength(1000).optional(),
  })
)
```

### Rate Limiting

Add rate limiting to prevent email spam:

```typescript
// app/controllers/invoices.ts
import { throttle } from '@adonisjs/limiter/services/main'

async send({ tenant, params, request, response }: HttpContext) {
  // Rate limit: 10 emails per minute per tenant
  const key = `invoice-send:tenant:${tenant.id}`
  await throttle.attempt(key, 10, 60)

  // ... rest of implementation
}
```

## Frontend UI Design

### Send Invoice Modal

```typescript
// src/components/invoice/SendInvoiceModal.tsx
type SendInvoiceModalProps = {
  invoice: Invoice
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const SendInvoiceModal: React.FC<SendInvoiceModalProps> = ({
  invoice,
  open,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (values: {
    email: string
    ccEmails?: string
    subject?: string
    message?: string
  }) => {
    setLoading(true)
    try {
      const ccEmailsArray = values.ccEmails
        ? values.ccEmails.split(',').map(email => email.trim())
        : []

      await Api.sendInvoice(invoice.id, {
        email: values.email,
        ccEmails: ccEmailsArray,
        subject: values.subject,
        message: values.message,
      })

      notification.success({ message: 'Invoice sent successfully' })
      onSuccess()
      onClose()
    } catch (error) {
      notification.error({ message: getErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={`Send Invoice ${invoice.invoiceNumber}`}
      footer={null}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Recipient Email"
          name="email"
          initialValue={invoice.customer?.email}
          rules={[
            { required: true, message: 'Please enter recipient email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input placeholder="customer@example.com" />
        </Form.Item>

        <Form.Item
          label="CC Emails (comma-separated)"
          name="ccEmails"
          rules={[
            {
              pattern: /^[\w\.-]+@[\w\.-]+\.\w+(\s*,\s*[\w\.-]+@[\w\.-]+\.\w+)*$/,
              message: 'Please enter valid comma-separated email addresses',
            },
          ]}
        >
          <Input placeholder="email1@example.com, email2@example.com" />
        </Form.Item>

        <Form.Item label="Subject (optional)" name="subject">
          <Input placeholder={`Invoice ${invoice.invoiceNumber}`} />
        </Form.Item>

        <Form.Item label="Message (optional)" name="message">
          <TextArea
            rows={4}
            placeholder="Add a personal message to include in the email..."
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              Send Invoice
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  )
}
```

## Security Considerations

### Email Validation

- Validate all email addresses (primary + CC) using proper email regex
- Limit number of CC recipients (max 10 to prevent abuse)
- Check for email injection attempts (newlines, CRLF)

### Rate Limiting

- Per-tenant rate limiting: 10 emails per minute
- Per-user rate limiting: 5 emails per minute
- Global rate limiting: 100 emails per minute (system-wide)

### Permission Checks

- All invoice operations must check `userRole` from HttpContext
- Members can only view their own invoices
- Only Admin/Owner can export PDF or send emails
- Tenant isolation must be maintained (all queries filter by `tenant_id`)

### Audit Logging

Consider adding audit logs for sensitive operations:

```typescript
// After sending invoice
await AuditLog.create({
  tenantId: tenant.id,
  userId: user.id,
  action: 'invoice_sent',
  resourceType: 'invoice',
  resourceId: invoice.id,
  metadata: {
    to: options.email,
    cc: options.ccEmails,
    invoiceNumber: invoice.invoiceNumber,
  },
})
```

## Testing Strategy

### Backend Tests

1. **Permission Tests** - `tests/functional/invoices/permissions.spec.ts`
   - Test each role's access to view/export/send operations
   - Test Member can only view own invoices
   - Test unauthorized access returns 403

2. **Email Tests** - `tests/unit/services/email_service.spec.ts`
   - Test email with CC recipients
   - Test email validation
   - Test rate limiting
   - Test custom subject and message

3. **Integration Tests** - `tests/functional/invoices/email.spec.ts`
   - Test full send invoice flow
   - Test PDF generation before email
   - Test status update after sending

### Frontend Tests

1. **Component Tests** - `src/components/invoice/SendInvoiceModal.test.tsx`
   - Test form validation
   - Test CC email parsing
   - Test submission with and without optional fields

2. **Integration Tests**
   - Test permission-based UI rendering (show/hide send button based on role)
   - Test successful invoice send flow
   - Test error handling

## Migration Path

### Phase 1: Add Permission Checks (Non-Breaking)

1. Add role helper methods to `Role` model
2. Update `show()`, `generatePdf()`, `send()` methods with permission checks
3. Deploy backend changes
4. Monitor for permission errors

### Phase 2: Add CC Email Support

1. Update `sendInvoiceValidator` with CC fields
2. Update `emailService.sendInvoiceEmail()` with CC support
3. Update frontend API client
4. Deploy backend and frontend together

### Phase 3: Add UI Enhancements

1. Create `SendInvoiceModal` component
2. Add send button to invoice detail page
3. Add role-based UI restrictions (hide buttons for unauthorized roles)

## Trade-offs and Decisions

### Decision: Member View Permissions

**Option A**: Members can view all invoices (current behavior)
**Option B**: Members can only view invoices they created
**Option C**: Members cannot view any invoices

**Chosen**: Option B
**Rationale**: Balances security with usability. Freelancers/members should be able to track their own invoices without accessing others' financial data.

### Decision: CC Email Limit

**Option A**: Unlimited CC recipients
**Option B**: Limit to 5 CC recipients
**Option C**: Limit to 10 CC recipients

**Chosen**: Option C (10 CC recipients)
**Rationale**: Provides flexibility for legitimate use cases (multiple stakeholders) while preventing abuse. Most invoice emails need 1-3 CCs, 10 provides headroom.

### Decision: Rate Limiting Strategy

**Option A**: Per-user only
**Option B**: Per-tenant only
**Option C**: Both per-user and per-tenant

**Chosen**: Option C (Both)
**Rationale**: Prevents both individual abuse and tenant-level spam. Per-tenant limits protect system resources, per-user limits prevent individual bad actors.

## Future Enhancements

1. **Email Templates**: Allow tenants to customize invoice email templates
2. **BCC Support**: Add BCC field for blind carbon copies
3. **Scheduled Sending**: Schedule invoice emails for future dates
4. **Email Tracking**: Track when emails are opened/clicked
5. **Bulk Send**: Send multiple invoices in one operation
6. **Email Preferences**: Allow customers to opt-in/out of invoice emails
