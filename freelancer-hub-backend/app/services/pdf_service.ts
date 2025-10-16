import Invoice from '#models/invoice'
import Payment from '#models/payment'
import PayrollBatch from '#models/payroll_batch'
import { DateTime } from 'luxon'
import puppeteer from 'puppeteer'

/**
 * PDF Service for generating invoices, receipts, and reports using Puppeteer
 */

export class PdfService {
  /**
   * Generate invoice PDF as buffer
   */
  async generateInvoicePDF(invoice: Invoice): Promise<Buffer> {
    // Load all necessary relationships
    await invoice.load('tenant', 'customer', 'items', 'payments', 'projects')

    const html = this.generateInvoiceHTML(invoice)

    // Convert HTML to PDF using Puppeteer
    const pdfBuffer = await this.convertHtmlToPdf(html)

    return pdfBuffer
  }

  /**
   * Convert HTML to PDF using Puppeteer
   */
  private async convertHtmlToPdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    try {
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0' })

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      })

      return Buffer.from(pdfBuffer)
    } finally {
      await browser.close()
    }
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
    const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

    const itemsHtml = invoice.items && invoice.items.length > 0
      ? invoice.items.map((item) => `
        <tr>
          <td>${this.escapeHtml(item.description)}</td>
          <td style="text-align: center;">${item.quantity} ${item.unit || ''}</td>
          <td style="text-align: right;">${formatCurrency(item.unitPrice)}</td>
          <td style="text-align: right;">${formatCurrency(item.amount)}</td>
        </tr>
      `).join('')
      : `<tr><td colspan="4" style="text-align: center; color: #888;">No line items</td></tr>`

    const projectsHtml = invoice.projects && invoice.projects.length > 0
      ? `
        <div style="margin-bottom: 20px;">
          <h3 style="margin-bottom: 10px;">Projects:</h3>
          <ul style="margin: 0; padding-left: 20px;">
            ${invoice.projects.map((project) => `<li>${this.escapeHtml(project.name)}</li>`).join('')}
          </ul>
        </div>
      `
      : ''

    const paymentsHtml = invoice.payments && invoice.payments.length > 0
      ? `
        <div style="margin-top: 30px; margin-bottom: 20px;">
          <h3 style="margin-bottom: 10px;">Payment History:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Date</th>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Method</th>
                <th style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.payments.map((payment) => `
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${payment.paymentDate.toFormat('MMM dd, yyyy')}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${payment.paymentMethod.replace('_', ' ')}</td>
                  <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">${formatCurrency(payment.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `
      : ''

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    .container { max-width: 800px; margin: 0 auto; }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #333;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 32px;
      font-weight: bold;
    }
    .header .company {
      font-size: 18px;
      color: #666;
    }
    .section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .section-col {
      flex: 1;
    }
    .section-col h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      text-transform: uppercase;
      color: #666;
    }
    .section-col p {
      margin: 4px 0;
      line-height: 1.5;
    }
    .invoice-meta {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 30px;
    }
    .invoice-meta p {
      margin: 8px 0;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .status-draft { background: #f3f4f6; color: #6b7280; }
    .status-sent { background: #dbeafe; color: #1e40af; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-overdue { background: #fee2e2; color: #991b1b; }
    .status-cancelled { background: #f3f4f6; color: #6b7280; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    thead tr {
      background-color: #f5f5f5;
      border-bottom: 2px solid #ddd;
    }
    th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      color: #666;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #eee;
    }
    .totals {
      margin-top: 30px;
      text-align: right;
    }
    .totals-row {
      display: flex;
      justify-content: flex-end;
      padding: 8px 0;
    }
    .totals-label {
      width: 200px;
      text-align: right;
      padding-right: 20px;
      font-weight: 500;
    }
    .totals-value {
      width: 150px;
      text-align: right;
    }
    .totals-row.total {
      border-top: 2px solid #333;
      margin-top: 10px;
      padding-top: 15px;
      font-size: 18px;
      font-weight: bold;
    }
    .totals-row.balance-due {
      font-size: 16px;
      font-weight: bold;
      color: #059669;
    }
    .notes {
      margin-top: 40px;
      padding: 20px;
      background: #f9fafb;
      border-left: 4px solid #3b82f6;
      border-radius: 4px;
    }
    .notes h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
    }
    .notes p {
      margin: 0;
      line-height: 1.6;
      white-space: pre-wrap;
    }
    .footer {
      margin-top: 50px;
      text-align: center;
      color: #888;
      font-size: 14px;
      border-top: 1px solid #eee;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>INVOICE</h1>
      <div class="company">${this.escapeHtml(invoice.tenant?.name || 'Company Name')}</div>
    </div>

    <div class="invoice-meta">
      <p><strong>Invoice Number:</strong> ${this.escapeHtml(invoice.invoiceNumber)}</p>
      <p><strong>Issue Date:</strong> ${invoice.issueDate.toFormat('MMMM dd, yyyy')}</p>
      <p><strong>Due Date:</strong> ${invoice.dueDate.toFormat('MMMM dd, yyyy')}</p>
      <p><strong>Status:</strong> <span class="status-badge status-${invoice.status}">${invoice.status.toUpperCase()}</span></p>
    </div>

    <div class="section">
      <div class="section-col">
        <h3>Bill To</h3>
        <p><strong>${this.escapeHtml(invoice.clientName || invoice.customer?.name || 'Client')}</strong></p>
        ${invoice.clientEmail || invoice.customer?.email ? `<p>${this.escapeHtml(invoice.clientEmail || invoice.customer?.email || '')}</p>` : ''}
        ${invoice.clientAddress ? `<p>${this.escapeHtml(invoice.clientAddress)}</p>` : ''}
      </div>
      <div class="section-col">
        <h3>From</h3>
        <p><strong>${this.escapeHtml(invoice.tenant?.name || 'Company')}</strong></p>
      </div>
    </div>

    ${projectsHtml}

    <table>
      <thead>
        <tr>
          <th style="width: 50%;">Description</th>
          <th style="width: 15%; text-align: center;">Quantity</th>
          <th style="width: 17.5%; text-align: right;">Rate</th>
          <th style="width: 17.5%; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row">
        <div class="totals-label">Subtotal:</div>
        <div class="totals-value">${formatCurrency(invoice.subtotal)}</div>
      </div>
      ${invoice.taxRate > 0 ? `
      <div class="totals-row">
        <div class="totals-label">Tax (${invoice.taxRate}%):</div>
        <div class="totals-value">${formatCurrency(invoice.taxAmount)}</div>
      </div>
      ` : ''}
      ${invoice.discountAmount > 0 ? `
      <div class="totals-row">
        <div class="totals-label">Discount:</div>
        <div class="totals-value">-${formatCurrency(invoice.discountAmount)}</div>
      </div>
      ` : ''}
      <div class="totals-row total">
        <div class="totals-label">Total:</div>
        <div class="totals-value">${formatCurrency(invoice.totalAmount)} ${invoice.currency}</div>
      </div>
      ${invoice.amountPaid > 0 ? `
      <div class="totals-row">
        <div class="totals-label">Amount Paid:</div>
        <div class="totals-value">${formatCurrency(invoice.amountPaid)}</div>
      </div>
      ` : ''}
      <div class="totals-row balance-due">
        <div class="totals-label">Balance Due:</div>
        <div class="totals-value">${formatCurrency(invoice.totalAmount - invoice.amountPaid)}</div>
      </div>
    </div>

    ${paymentsHtml}

    ${invoice.notes ? `
    <div class="notes">
      <h3>Notes</h3>
      <p>${this.escapeHtml(invoice.notes)}</p>
    </div>
    ` : ''}

    ${invoice.paymentTerms ? `
    <div class="notes">
      <h3>Payment Terms</h3>
      <p>${this.escapeHtml(invoice.paymentTerms)}</p>
    </div>
    ` : ''}

    <div class="footer">
      <p>Thank you for your business!</p>
    </div>
  </div>
</body>
</html>
    `
  }

  /**
   * Escape HTML to prevent injection
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

