import Invoice from '#models/invoice'
import Payment from '#models/payment'
import PayrollBatch from '#models/payroll_batch'
import { DateTime } from 'luxon'
import env from '#start/env'

/**
 * Email Service for sending invoices, receipts, and notifications
 * 
 * NOTE: This is a placeholder implementation. In production, you would use:
 * - nodemailer: For SMTP email sending
 * - SendGrid: For transactional emails
 * - AWS SES: For scalable email delivery
 * - Mailgun: For email API
 * 
 * For now, this service logs emails that would be sent
 */

export interface EmailOptions {
  to: string
  subject: string
  html: string
  attachments?: Array<{
    filename: string
    path: string
  }>
}

export class EmailService {
  private fromEmail: string
  private fromName: string

  constructor() {
    this.fromEmail = env.get('EMAIL_FROM', 'noreply@freelancerhub.com')
    this.fromName = env.get('EMAIL_FROM_NAME', 'Freelancer Hub')
  }

  /**
   * Send an email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    // In production, use nodemailer, SendGrid, etc.
    console.log('📧 Email would be sent:')
    console.log(`From: ${this.fromName} <${this.fromEmail}>`)
    console.log(`To: ${options.to}`)
    console.log(`Subject: ${options.subject}`)
    console.log('---')

    // Simulate email sending
    return true
  }

  /**
   * Send invoice email
   */
  async sendInvoiceEmail(invoice: Invoice, recipientEmail?: string): Promise<boolean> {
    await invoice.load('user', 'tenant')

    const to = recipientEmail || invoice.clientEmail || invoice.user?.email
    if (!to) {
      throw new Error('No recipient email address found')
    }

    const subject = `Invoice ${invoice.invoiceNumber} from ${invoice.tenant?.name || 'Freelancer Hub'}`
    const html = this.generateInvoiceEmailHTML(invoice)

    const sent = await this.sendEmail({
      to,
      subject,
      html,
      attachments: invoice.pdfUrl
        ? [
            {
              filename: `invoice-${invoice.invoiceNumber}.pdf`,
              path: invoice.pdfUrl,
            },
          ]
        : undefined,
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
    await payment.load('invoice', 'user', 'tenant')

    const to = payment.user?.email
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
    await batch.load('payments', 'tenant')

    const payment = batch.payments?.find((p) => p.userId === userId)
    if (!payment) {
      throw new Error('Payment not found for user')
    }

    await payment.load('user')

    const to = payment.user?.email
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
   * Generate invoice email HTML
   */
  private generateInvoiceEmailHTML(invoice: Invoice): string {
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
    .invoice-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #1890ff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Invoice from ${invoice.tenant?.name || 'Freelancer Hub'}</h1>
    </div>
    
    <div class="content">
      <p>Hello ${invoice.clientName || invoice.user?.fullName || 'there'},</p>
      
      <p>Please find attached your invoice for services rendered.</p>
      
      <div class="invoice-details">
        <h2>Invoice Details</h2>
        <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
        <p><strong>Issue Date:</strong> ${invoice.issueDate.toFormat('MMM dd, yyyy')}</p>
        <p><strong>Due Date:</strong> ${invoice.dueDate.toFormat('MMM dd, yyyy')}</p>
        <p><strong>Amount Due:</strong> $${(invoice.totalAmount - invoice.amountPaid).toFixed(2)} ${invoice.currency}</p>
        <p><strong>Payment Terms:</strong> ${invoice.paymentTerms || 'Net 30'}</p>
      </div>
      
      ${invoice.pdfUrl ? '<p>The invoice is attached as a PDF to this email.</p>' : ''}
      
      <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
      
      <p>Thank you for your business!</p>
    </div>
    
    <div class="footer">
      <p>${invoice.tenant?.name || 'Freelancer Hub'}</p>
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
      <h1>✓ Payment Received</h1>
    </div>
    
    <div class="content">
      <p>Hello ${payment.user?.fullName || 'there'},</p>
      
      <p>We have received your payment. Thank you!</p>
      
      <div class="payment-details">
        <h2>Payment Details</h2>
        <p><strong>Payment Number:</strong> ${payment.paymentNumber}</p>
        <p><strong>Payment Date:</strong> ${payment.paymentDate.toFormat('MMM dd, yyyy')}</p>
        <p><strong>Amount:</strong> $${payment.amount.toFixed(2)} ${payment.currency}</p>
        <p><strong>Payment Method:</strong> ${payment.paymentMethod.toUpperCase()}</p>
        ${payment.transactionId ? `<p><strong>Transaction ID:</strong> ${payment.transactionId}</p>` : ''}
      </div>
      
      <p>A receipt has been generated for your records.</p>
      
      <p>Thank you for your business!</p>
    </div>
    
    <div class="footer">
      <p>${payment.tenant?.name || 'Freelancer Hub'}</p>
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
      <p>Hello ${payment.user?.fullName || 'there'},</p>
      
      <p>Your payroll payment has been processed.</p>
      
      <div class="payroll-details">
        <h2>Payment Details</h2>
        <p><strong>Batch Number:</strong> ${batch.batchNumber}</p>
        <p><strong>Pay Period:</strong> ${batch.payPeriodStart.toFormat('MMM dd')} - ${batch.payPeriodEnd.toFormat('MMM dd, yyyy')}</p>
        <p><strong>Payment Number:</strong> ${payment.paymentNumber}</p>
        <p><strong>Amount:</strong> $${payment.amount.toFixed(2)} ${payment.currency}</p>
        <p><strong>Payment Method:</strong> ${payment.paymentMethod.toUpperCase()}</p>
        <p><strong>Status:</strong> ${payment.status.toUpperCase()}</p>
      </div>
      
      <p>The payment will be processed according to your payment method.</p>
      
      <p>If you have any questions, please contact your administrator.</p>
    </div>
    
    <div class="footer">
      <p>${batch.tenant?.name || 'Freelancer Hub'}</p>
      <p>This is an automated email. Please do not reply to this message.</p>
    </div>
  </div>
</body>
</html>
    `
  }
}

export default new EmailService()

