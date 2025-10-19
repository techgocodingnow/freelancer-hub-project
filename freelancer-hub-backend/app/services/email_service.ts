import Invoice from '#models/invoice'
import Payment from '#models/payment'
import PayrollBatch from '#models/payroll_batch'
import Invitation from '#models/invitation'
import { DateTime } from 'luxon'
import env from '#start/env'
import { Resend } from 'resend'
import storageService from '#services/storage_service'

/**
 * Email Service for sending invoices, receipts, and notifications using Resend
 */

export interface EmailOptions {
  to: string
  cc?: string[]
  subject: string
  html: string
  attachments?: Array<{
    filename: string
    path?: string
    content?: any
  }>
}

export interface SendInvoiceEmailOptions {
  invoice: Invoice
  to: string
  cc?: string[]
  subject?: string
  message?: string
}

export class EmailService {
  private fromEmail: string
  private fromName: string
  private resend: Resend | null

  constructor() {
    this.fromEmail = env.get('EMAIL_FROM')
    this.fromName = env.get('EMAIL_FROM_NAME')

    const apiKey = env.get('RESEND_API_KEY')
    this.resend = apiKey ? new Resend(apiKey) : null
  }

  /**
   * Send an email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    // Validate primary email before attempting to send
    if (!this.isValidEmail(options.to)) {
      throw new Error(`Invalid email address: ${options.to}`)
    }

    // Validate CC emails
    if (options.cc && options.cc.length > 10) {
      throw new Error('Maximum 10 CC recipients allowed')
    }

    if (options.cc) {
      for (const email of options.cc) {
        if (!this.isValidEmail(email)) {
          throw new Error(`Invalid CC email address: ${email}`)
        }
      }
    }

    // If Resend is not configured, fall back to console logging
    if (!this.resend) {
      console.log('📧 Email would be sent (Resend not configured):')
      console.log(`From: ${this.fromName} <${this.fromEmail}>`)
      console.log(`To: ${options.to}`)
      if (options.cc && options.cc.length > 0) {
        console.log(`CC: ${options.cc.join(', ')}`)
      }
      console.log(`Subject: ${options.subject}`)
      console.log('---')
      return true
    }

    try {
      await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: options.to,
        cc: options.cc && options.cc.length > 0 ? options.cc : undefined,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments,
      })
      return true
    } catch (error) {
      console.error('Failed to send email via Resend:', error)
      return false
    }
  }

  /**
   * Validate email address format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && !email.includes('\n') && !email.includes('\r')
  }

  /**
   * Escape HTML special characters to prevent XSS
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }
    return text.replace(/[&<>"']/g, (m) => map[m])
  }

  /**
   * Send invoice email with CC support and custom content
   */
  async sendInvoiceEmail(options: SendInvoiceEmailOptions): Promise<boolean> {
    const { invoice, to, cc = [], subject, message } = options

    await invoice.load('user')
    await invoice.load('tenant')

    // Use custom subject or default
    const defaultSubject = `Invoice ${invoice.invoiceNumber} from ${invoice.tenant?.name || 'Freelancer Hub'}`
    const emailSubject = subject || defaultSubject

    // Generate HTML with custom message if provided
    const html = this.generateInvoiceEmailHTML(invoice, message)

    let attachments: Array<{ filename: string; content: any }> | undefined

    // Handle PDF attachment from B2 storage
    if (invoice.pdfKey && storageService.isConfigured()) {
      // Download PDF from B2 to temporary file
      const pdfBuffer = await storageService.downloadPDF(invoice.pdfKey)
      attachments = [
        {
          filename: `invoice-${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
        },
      ]
    }

    const sent = await this.sendEmail({
      to,
      cc: cc.length > 0 ? cc : undefined,
      subject: emailSubject,
      html,
      attachments,
    })

    if (sent) {
      // Update invoice email tracking
      invoice.sentAt = DateTime.now()
      invoice.sentTo = to
      invoice.emailCount = (invoice.emailCount || 0) + 1
      invoice.lastEmailSentAt = DateTime.now()
      await invoice.save()
    }

    return sent
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(payment: Payment): Promise<boolean> {
    await payment.load('invoice')
    await payment.load('tenant')

    const to = payment.invoice.user?.email
    if (!to) {
      throw new Error('No recipient email address found')
    }

    const subject = `Payment Confirmation - ${payment.paymentNumber}`
    const html = this.generatePaymentConfirmationHTML(payment)

    return await this.sendEmail({
      to,
      subject,
      html,
    })
  }

  /**
   * Send payroll notification email
   */
  async sendPayrollNotification(batch: PayrollBatch, userId: number): Promise<boolean> {
    await batch.load('payments')
    await batch.load('tenant')

    const payment = batch.payments?.find((p) => p.invoice?.userId === userId)
    if (!payment) {
      throw new Error('Payment not found for user')
    }

    const to = payment.invoice.user?.email
    if (!to) {
      throw new Error('No recipient email address found')
    }

    const subject = `Payroll Payment - ${batch.batchNumber}`
    const html = this.generatePayrollNotificationHTML(batch, payment)

    return await this.sendEmail({
      to,
      subject,
      html,
    })
  }

  /**
   * Send invitation email
   */
  async sendInvitationEmail(invitation: Invitation, baseUrl: string): Promise<boolean> {
    await invitation.load('tenant')
    await invitation.load('role')
    await invitation.load('inviter')
    await invitation.load('project')

    const to = invitation.email
    const tenantName = invitation.tenant?.name || 'Freelancer Hub'
    const inviterName = invitation.inviter?.fullName || invitation.inviter?.email || 'A team member'
    const roleName = invitation.role?.name || 'member'
    const projectName = invitation.project?.name

    const subject = projectName
      ? `You've been invited to join ${projectName} on ${tenantName}`
      : `You've been invited to join ${tenantName}`

    const html = this.generateInvitationEmailHTML(
      invitation,
      baseUrl,
      tenantName,
      inviterName,
      roleName,
      projectName
    )

    return await this.sendEmail({
      to,
      subject,
      html,
    })
  }

  /**
   * Generate invoice email HTML
   */
  private generateInvoiceEmailHTML(invoice: Invoice, customMessage?: string): string {
    // Escape all user-controlled content
    const tenantName = this.escapeHtml(invoice.tenant?.name || 'Freelancer Hub')
    const clientName = this.escapeHtml(invoice.clientName || invoice.user?.fullName || 'there')
    const invoiceNumber = this.escapeHtml(invoice.invoiceNumber)
    const currency = this.escapeHtml(invoice.currency)
    const paymentTerms = this.escapeHtml(invoice.paymentTerms || 'Net 30')
    const escapedCustomMessage = customMessage ? this.escapeHtml(customMessage) : undefined

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1890ff; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f5f5f5; }
    .custom-message { background-color: #e6f7ff; border-left: 4px solid #1890ff; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .invoice-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #1890ff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Invoice from ${tenantName}</h1>
    </div>

    <div class="content">
      <p>Hello ${clientName},</p>

      ${escapedCustomMessage ? `<div class="custom-message">${escapedCustomMessage}</div>` : '<p>Please find attached your invoice for services rendered.</p>'}

      <div class="invoice-details">
        <h2>Invoice Details</h2>
        <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
        <p><strong>Issue Date:</strong> ${invoice.issueDate.toFormat('MMM dd, yyyy')}</p>
        <p><strong>Due Date:</strong> ${invoice.dueDate.toFormat('MMM dd, yyyy')}</p>
        <p><strong>Amount Due:</strong> $${(invoice.totalAmount - invoice.amountPaid).toFixed(2)} ${currency}</p>
        <p><strong>Payment Terms:</strong> ${paymentTerms}</p>
      </div>

      ${invoice.pdfUrl ? '<p>The invoice is attached as a PDF to this email.</p>' : ''}

      <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>

      <p>Thank you for your business!</p>
    </div>

    <div class="footer">
      <p>${tenantName}</p>
      <p>This is an automated email. Please do not reply to this message.</p>
    </div>
  </div>
</body>
</html>
    `
  }

  /**
   * Generate payment confirmation email HTML
   */
  private generatePaymentConfirmationHTML(payment: Payment): string {
    // Escape all user-controlled content
    const userName = this.escapeHtml(payment.user?.fullName || 'there')
    const paymentNumber = this.escapeHtml(payment.paymentNumber)
    const currency = this.escapeHtml(payment.currency)
    const paymentMethod = this.escapeHtml(payment.paymentMethod.toUpperCase())
    const transactionId = payment.transactionId ? this.escapeHtml(payment.transactionId) : undefined
    const tenantName = this.escapeHtml(payment.tenant?.name || 'Freelancer Hub')

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #52c41a; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f5f5f5; }
    .payment-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Received</h1>
    </div>

    <div class="content">
      <p>Hello ${userName},</p>

      <p>We have received your payment. Thank you!</p>

      <div class="payment-details">
        <h2>Payment Details</h2>
        <p><strong>Payment Number:</strong> ${paymentNumber}</p>
        <p><strong>Payment Date:</strong> ${payment.paymentDate.toFormat('MMM dd, yyyy')}</p>
        <p><strong>Amount:</strong> $${payment.amount.toFixed(2)} ${currency}</p>
        <p><strong>Payment Method:</strong> ${paymentMethod}</p>
        ${transactionId ? `<p><strong>Transaction ID:</strong> ${transactionId}</p>` : ''}
      </div>

      <p>A receipt has been generated for your records.</p>

      <p>Thank you for your business!</p>
    </div>

    <div class="footer">
      <p>${tenantName}</p>
      <p>This is an automated email. Please do not reply to this message.</p>
    </div>
  </div>
</body>
</html>
    `
  }

  /**
   * Generate payroll notification email HTML
   */
  private generatePayrollNotificationHTML(batch: PayrollBatch, payment: Payment): string {
    // Escape all user-controlled content
    const userName = this.escapeHtml(payment.user?.fullName || 'there')
    const batchNumber = this.escapeHtml(batch.batchNumber)
    const paymentNumber = this.escapeHtml(payment.paymentNumber)
    const currency = this.escapeHtml(payment.currency)
    const paymentMethod = this.escapeHtml(payment.paymentMethod.toUpperCase())
    const status = this.escapeHtml(payment.status.toUpperCase())
    const tenantName = this.escapeHtml(batch.tenant?.name || 'Freelancer Hub')

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1890ff; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f5f5f5; }
    .payroll-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payroll Payment Notification</h1>
    </div>

    <div class="content">
      <p>Hello ${userName},</p>

      <p>Your payroll payment has been processed.</p>

      <div class="payroll-details">
        <h2>Payment Details</h2>
        <p><strong>Batch Number:</strong> ${batchNumber}</p>
        <p><strong>Pay Period:</strong> ${batch.payPeriodStart.toFormat('MMM dd')} - ${batch.payPeriodEnd.toFormat('MMM dd, yyyy')}</p>
        <p><strong>Payment Number:</strong> ${paymentNumber}</p>
        <p><strong>Amount:</strong> $${payment.amount.toFixed(2)} ${currency}</p>
        <p><strong>Payment Method:</strong> ${paymentMethod}</p>
        <p><strong>Status:</strong> ${status}</p>
      </div>

      <p>The payment will be processed according to your payment method.</p>

      <p>If you have any questions, please contact your administrator.</p>
    </div>

    <div class="footer">
      <p>${tenantName}</p>
      <p>This is an automated email. Please do not reply to this message.</p>
    </div>
  </div>
</body>
</html>
    `
  }

  /**
   * Generate HTML email template for invitation
   */
  private generateInvitationEmailHTML(
    invitation: Invitation,
    baseUrl: string,
    tenantName: string,
    inviterName: string,
    roleName: string,
    projectName?: string
  ): string {
    const registrationUrl = invitation.getRegistrationUrl(baseUrl)
    const expiresAt = invitation.expiresAt.toFormat('MMM dd, yyyy')

    // Escape all user-controlled content
    const escapedTenantName = this.escapeHtml(tenantName)
    const escapedInviterName = this.escapeHtml(inviterName)
    const escapedRoleName = this.escapeHtml(roleName)
    const escapedProjectName = projectName ? this.escapeHtml(projectName) : undefined
    const escapedRegistrationUrl = this.escapeHtml(registrationUrl)

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to ${escapedTenantName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .content { padding: 30px; }
    .invitation-details { background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .invitation-details p { margin: 8px 0; }
    .cta-button { display: inline-block; background: #667eea; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .cta-button:hover { background: #5568d3; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px; color: #856404; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>You're Invited!</h1>
    </div>

    <div class="content">
      <p>Hello,</p>

      <p><strong>${escapedInviterName}</strong> has invited you to join ${escapedProjectName ? `the project <strong>${escapedProjectName}</strong> on` : ''} <strong>${escapedTenantName}</strong> as a <strong>${escapedRoleName}</strong>.</p>

      <div class="invitation-details">
        <h2 style="margin-top: 0; font-size: 18px;">Invitation Details</h2>
        <p><strong>Organization:</strong> ${escapedTenantName}</p>
        ${escapedProjectName ? `<p><strong>Project:</strong> ${escapedProjectName}</p>` : ''}
        <p><strong>Role:</strong> ${escapedRoleName.charAt(0).toUpperCase() + escapedRoleName.slice(1)}</p>
        <p><strong>Invited by:</strong> ${escapedInviterName}</p>
        <p><strong>Expires:</strong> ${expiresAt}</p>
      </div>

      <p>Click the button below to accept the invitation and create your account:</p>

      <div style="text-align: center;">
        <a href="${registrationUrl}" class="cta-button">Accept Invitation</a>
      </div>

      <div class="warning">
        <strong>Important:</strong> This invitation link will expire on ${expiresAt}. Please complete your registration before this date.
      </div>

      <p>If you're unable to click the button, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #667eea;">${escapedRegistrationUrl}</p>

      <p>If you weren't expecting this invitation or believe it was sent in error, you can safely ignore this email.</p>
    </div>

    <div class="footer">
      <p>${escapedTenantName}</p>
      <p>This is an automated email. Please do not reply to this message.</p>
    </div>
  </div>
</body>
</html>
    `
  }
}

export default new EmailService()
