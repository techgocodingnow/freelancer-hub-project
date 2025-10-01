import Invoice from '#models/invoice'
import Payment from '#models/payment'
import PayrollBatch from '#models/payroll_batch'
import { DateTime } from 'luxon'

/**
 * PDF Service for generating invoices, receipts, and reports
 * 
 * NOTE: This is a placeholder implementation. In production, you would use:
 * - puppeteer: For HTML to PDF conversion
 * - pdfkit: For programmatic PDF generation
 * - jsPDF: For client-side PDF generation
 * 
 * For now, this service generates HTML that can be converted to PDF
 */

export class PdfService {
  /**
   * Generate invoice PDF
   */
  async generateInvoicePDF(invoice: Invoice): Promise<string> {
    await invoice.load('user', 'tenant')

    const html = this.generateInvoiceHTML(invoice)

    // In production, convert HTML to PDF using puppeteer or similar
    // For now, return a placeholder URL
    const pdfUrl = `/pdfs/invoices/invoice-${invoice.invoiceNumber}.pdf`

    // Update invoice with PDF info
    invoice.pdfUrl = pdfUrl
    invoice.pdfGeneratedAt = DateTime.now()
    await invoice.save()

    return pdfUrl
  }

  /**
   * Generate payment receipt PDF
   */
  async generatePaymentReceipt(payment: Payment): Promise<string> {
    await payment.load('invoice', 'user', 'tenant')

    const html = this.generateReceiptHTML(payment)

    // In production, convert HTML to PDF
    const pdfUrl = `/pdfs/receipts/receipt-${payment.paymentNumber}.pdf`

    return pdfUrl
  }

  /**
   * Generate payroll report PDF
   */
  async generatePayrollReport(batch: PayrollBatch): Promise<string> {
    await batch.load('payments', 'creator', 'tenant')

    const html = this.generatePayrollHTML(batch)

    // In production, convert HTML to PDF
    const pdfUrl = `/pdfs/payroll/payroll-${batch.batchNumber}.pdf`

    return pdfUrl
  }

  /**
   * Generate invoice HTML template
   */
  private generateInvoiceHTML(invoice: Invoice): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { text-align: center; margin-bottom: 40px; }
    .invoice-details { margin-bottom: 30px; }
    .client-info { margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f5f5f5; }
    .totals { text-align: right; }
    .total-row { font-weight: bold; font-size: 18px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>INVOICE</h1>
    <p>${invoice.tenant?.name || 'Company Name'}</p>
  </div>

  <div class="invoice-details">
    <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
    <p><strong>Issue Date:</strong> ${invoice.issueDate.toFormat('MMM dd, yyyy')}</p>
    <p><strong>Due Date:</strong> ${invoice.dueDate.toFormat('MMM dd, yyyy')}</p>
    <p><strong>Status:</strong> ${invoice.status.toUpperCase()}</p>
  </div>

  <div class="client-info">
    <h3>Bill To:</h3>
    <p><strong>${invoice.clientName || invoice.user?.fullName || 'Client'}</strong></p>
    <p>${invoice.clientEmail || invoice.user?.email || ''}</p>
    ${invoice.clientAddress ? `<p>${invoice.clientAddress}</p>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Quantity</th>
        <th>Rate</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Services Rendered</td>
        <td>1</td>
        <td>$${invoice.subtotal.toFixed(2)}</td>
        <td>$${invoice.subtotal.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <p>Subtotal: $${invoice.subtotal.toFixed(2)}</p>
    <p>Tax (${invoice.taxRate}%): $${invoice.taxAmount.toFixed(2)}</p>
    <p>Discount: -$${invoice.discountAmount.toFixed(2)}</p>
    <p class="total-row">Total: $${invoice.totalAmount.toFixed(2)} ${invoice.currency}</p>
    <p>Amount Paid: $${invoice.amountPaid.toFixed(2)}</p>
    <p class="total-row">Balance Due: $${(invoice.totalAmount - invoice.amountPaid).toFixed(2)}</p>
  </div>

  ${invoice.notes ? `<div><p><strong>Notes:</strong></p><p>${invoice.notes}</p></div>` : ''}

  <div style="margin-top: 50px; text-align: center; color: #888;">
    <p>Thank you for your business!</p>
  </div>
</body>
</html>
    `
  }

  /**
   * Generate receipt HTML template
   */
  private generateReceiptHTML(payment: Payment): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt ${payment.paymentNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { text-align: center; margin-bottom: 40px; }
    .receipt-details { margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f5f5f5; }
  </style>
</head>
<body>
  <div class="header">
    <h1>PAYMENT RECEIPT</h1>
    <p>${payment.tenant?.name || 'Company Name'}</p>
  </div>

  <div class="receipt-details">
    <p><strong>Receipt Number:</strong> ${payment.paymentNumber}</p>
    <p><strong>Payment Date:</strong> ${payment.paymentDate.toFormat('MMM dd, yyyy')}</p>
    <p><strong>Payment Method:</strong> ${payment.paymentMethod.toUpperCase()}</p>
    <p><strong>Status:</strong> ${payment.status.toUpperCase()}</p>
    ${payment.transactionId ? `<p><strong>Transaction ID:</strong> ${payment.transactionId}</p>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Payment Amount</td>
        <td>$${payment.amount.toFixed(2)} ${payment.currency}</td>
      </tr>
      ${payment.feeAmount > 0 ? `<tr><td>Processing Fee</td><td>$${payment.feeAmount.toFixed(2)}</td></tr>` : ''}
      <tr>
        <td><strong>Net Amount</strong></td>
        <td><strong>$${payment.netAmount.toFixed(2)}</strong></td>
      </tr>
    </tbody>
  </table>

  ${payment.notes ? `<div><p><strong>Notes:</strong></p><p>${payment.notes}</p></div>` : ''}

  <div style="margin-top: 50px; text-align: center; color: #888;">
    <p>Thank you for your payment!</p>
  </div>
</body>
</html>
    `
  }

  /**
   * Generate payroll HTML template
   */
  private generatePayrollHTML(batch: PayrollBatch): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payroll Report ${batch.batchNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { text-align: center; margin-bottom: 40px; }
    .batch-details { margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f5f5f5; }
    .totals { text-align: right; font-weight: bold; font-size: 18px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>PAYROLL REPORT</h1>
    <p>${batch.tenant?.name || 'Company Name'}</p>
  </div>

  <div class="batch-details">
    <p><strong>Batch Number:</strong> ${batch.batchNumber}</p>
    <p><strong>Pay Period:</strong> ${batch.payPeriodStart.toFormat('MMM dd')} - ${batch.payPeriodEnd.toFormat('MMM dd, yyyy')}</p>
    <p><strong>Status:</strong> ${batch.status.toUpperCase()}</p>
    <p><strong>Created By:</strong> ${batch.creator?.fullName || 'Unknown'}</p>
    ${batch.processedAt ? `<p><strong>Processed At:</strong> ${batch.processedAt.toFormat('MMM dd, yyyy HH:mm')}</p>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Employee</th>
        <th>Payment #</th>
        <th>Amount</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${batch.payments?.map((payment) => `
        <tr>
          <td>${payment.user?.fullName || 'Unknown'}</td>
          <td>${payment.paymentNumber}</td>
          <td>$${payment.amount.toFixed(2)}</td>
          <td>${payment.status.toUpperCase()}</td>
        </tr>
      `).join('') || '<tr><td colspan="4">No payments</td></tr>'}
    </tbody>
  </table>

  <div class="totals">
    <p>Total Payments: ${batch.paymentCount}</p>
    <p>Total Amount: $${batch.totalAmount.toFixed(2)} ${batch.currency}</p>
  </div>

  ${batch.notes ? `<div><p><strong>Notes:</strong></p><p>${batch.notes}</p></div>` : ''}
</body>
</html>
    `
  }
}

export default new PdfService()

