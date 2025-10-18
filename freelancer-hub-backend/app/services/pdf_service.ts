import Invoice from '#models/invoice'
import Payment from '#models/payment'
import PayrollBatch from '#models/payroll_batch'
import puppeteer from 'puppeteer'
import { DateTime } from 'luxon'

/**
 * PDF Service for generating invoices, receipts, and reports using Puppeteer
 */

export class PdfService {
  /**
   * Generate invoice PDF as buffer
   */
  async generateInvoicePDF(invoice: Invoice): Promise<Buffer> {
    // Load all necessary relationships
    await invoice.load('tenant')
    await invoice.load('customer')
    await invoice.load('items')
    await invoice.load('payments')
    await invoice.load('projects')

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
    await payment.load('invoice')
    await payment.load('tenant')
    await payment.load('user')

    const html = this.generateReceiptHTML(payment)

    // In production, convert HTML to PDF
    const pdfUrl = `/pdfs/receipts/receipt-${payment.paymentNumber}.pdf`

    return pdfUrl
  }

  /**
   * Generate payroll report PDF
   */
  async generatePayrollReport(batch: PayrollBatch): Promise<string> {
    await batch.load('payments')
    await batch.load('creator')
    await batch.load('tenant')

    const html = this.generatePayrollHTML(batch)

    // In production, convert HTML to PDF
    const pdfUrl = `/pdfs/payroll/payroll-${batch.batchNumber}.pdf`

    return pdfUrl
  }

  /**
   * Generate invoice HTML template following industry-standard format
   */
  private generateInvoiceHTML(invoice: Invoice): string {
    const formatCurrency = (amount: number) =>
      `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

    const balanceDue = invoice.totalAmount - invoice.amountPaid
    const isOverdue = invoice.dueDate < DateTime.now() && balanceDue > 0

    const itemsHtml =
      invoice.items && invoice.items.length > 0
        ? invoice.items
            .map(
              (item) => `
        <tr>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">${this.escapeHtml(item.description)}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.unitPrice)}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${formatCurrency(item.amount)}</td>
        </tr>
      `
            )
            .join('')
        : `<tr><td colspan="4" style="padding: 20px; text-align: center; color: #9ca3af;">No line items</td></tr>`

    const projectsHtml =
      invoice.projects && invoice.projects.length > 0
        ? `
        <div style="margin-bottom: 24px; padding: 16px; background-color: #f9fafb; border-left: 3px solid #3b82f6; border-radius: 4px;">
          <div style="font-weight: 600; font-size: 14px; color: #374151; margin-bottom: 8px;">Projects</div>
          <div style="font-size: 14px; color: #6b7280;">
            ${invoice.projects.map((project) => this.escapeHtml(project.name)).join(' • ')}
          </div>
        </div>
      `
        : ''

    const paymentsHtml =
      invoice.payments && invoice.payments.length > 0
        ? `
        <div style="margin-top: 40px; page-break-inside: avoid;">
          <div style="font-weight: 600; font-size: 16px; color: #111827; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">
            Payment History
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #e5e7eb; font-weight: 600; color: #374151;">Date</th>
                <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #e5e7eb; font-weight: 600; color: #374151;">Payment Method</th>
                <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #e5e7eb; font-weight: 600; color: #374151;">Reference</th>
                <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #e5e7eb; font-weight: 600; color: #374151;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.payments
                .map(
                  (payment) => `
                <tr>
                  <td style="padding: 10px 8px; border-bottom: 1px solid #f3f4f6;">${payment.paymentDate.toFormat('MMM dd, yyyy')}</td>
                  <td style="padding: 10px 8px; border-bottom: 1px solid #f3f4f6;">${this.escapeHtml(payment.paymentMethod.replace('_', ' '))}</td>
                  <td style="padding: 10px 8px; border-bottom: 1px solid #f3f4f6;">${this.escapeHtml(payment.transactionId || '-')}</td>
                  <td style="padding: 10px 8px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 600;">${formatCurrency(payment.amount)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `
        : ''

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${this.escapeHtml(invoice.invoiceNumber)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #1f2937;
      background-color: #ffffff;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 0;
    }

    /* Header Section */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 24px;
      border-bottom: 3px solid #111827;
    }

    .header-left h1 {
      font-size: 42px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 4px;
      letter-spacing: -0.5px;
    }

    .company-name {
      font-size: 18px;
      font-weight: 600;
      color: #4b5563;
    }

    .header-right {
      text-align: right;
    }

    .invoice-number {
      font-size: 16px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 8px;
    }

    .invoice-dates {
      font-size: 13px;
      color: #6b7280;
      line-height: 1.8;
    }

    .invoice-dates strong {
      color: #374151;
      font-weight: 600;
    }

    .status-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 16px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 8px;
    }

    .status-draft { background-color: #f3f4f6; color: #6b7280; }
    .status-sent { background-color: #dbeafe; color: #1e40af; }
    .status-paid { background-color: #d1fae5; color: #065f46; }
    .status-overdue { background-color: #fee2e2; color: #991b1b; }
    .status-cancelled { background-color: #f3f4f6; color: #6b7280; text-decoration: line-through; }

    /* Billing Information */
    .billing-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 32px;
      gap: 40px;
    }

    .billing-party {
      flex: 1;
      padding: 20px;
      background-color: #f9fafb;
      border-radius: 8px;
    }

    .billing-party h3 {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #6b7280;
      margin-bottom: 12px;
    }

    .billing-party .party-name {
      font-size: 16px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 6px;
    }

    .billing-party .party-details {
      font-size: 13px;
      color: #6b7280;
      line-height: 1.7;
    }

    /* Line Items Table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 32px;
      page-break-inside: avoid;
    }

    .items-table thead {
      background-color: #111827;
      color: #ffffff;
    }

    .items-table thead th {
      padding: 14px 12px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .items-table thead th:nth-child(2),
    .items-table thead th:nth-child(3),
    .items-table thead th:nth-child(4) {
      text-align: right;
    }

    .items-table tbody td {
      padding: 14px 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
      color: #374151;
    }

    .items-table tbody tr:last-child td {
      border-bottom: 2px solid #e5e7eb;
    }

    /* Totals Section */
    .totals-section {
      margin-left: auto;
      width: 350px;
      margin-top: 24px;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 14px;
    }

    .totals-row.subtotal {
      color: #6b7280;
    }

    .totals-row.total {
      border-top: 2px solid #111827;
      margin-top: 8px;
      padding-top: 16px;
      font-size: 18px;
      font-weight: 700;
      color: #111827;
    }

    .totals-row.balance-due {
      background-color: ${isOverdue ? '#fee2e2' : '#f0fdf4'};
      padding: 16px;
      margin-top: 12px;
      border-radius: 8px;
      font-size: 20px;
      font-weight: 700;
      color: ${isOverdue ? '#991b1b' : '#065f46'};
    }

    .totals-row.amount-paid {
      color: #059669;
      font-weight: 600;
    }

    /* Notes Section */
    .notes-section {
      margin-top: 40px;
      padding: 20px;
      background-color: #f9fafb;
      border-left: 4px solid #3b82f6;
      border-radius: 4px;
      page-break-inside: avoid;
    }

    .notes-section h3 {
      font-size: 14px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .notes-section p {
      font-size: 13px;
      color: #4b5563;
      line-height: 1.7;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    /* Footer */
    .footer {
      margin-top: 60px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 13px;
    }

    /* Print Styles */
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .page-break {
        page-break-before: always;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <h1>INVOICE</h1>
        <div class="company-name">${this.escapeHtml(invoice.tenant?.name || 'Company Name')}</div>
      </div>
      <div class="header-right">
        <div class="invoice-number">#${this.escapeHtml(invoice.invoiceNumber)}</div>
        <div class="invoice-dates">
          <div><strong>Issue Date:</strong> ${invoice.issueDate.toFormat('MMM dd, yyyy')}</div>
          <div><strong>Due Date:</strong> ${invoice.dueDate.toFormat('MMM dd, yyyy')}</div>
        </div>
        <span class="status-badge status-${invoice.status}">${invoice.status.toUpperCase()}</span>
      </div>
    </div>

    <!-- Billing Information -->
    <div class="billing-section">
      <div class="billing-party">
        <h3>Bill To</h3>
        <div class="party-name">${this.escapeHtml(invoice.clientName || invoice.customer?.name || 'Client')}</div>
        <div class="party-details">
          ${invoice.clientEmail || invoice.customer?.email ? `<div>${this.escapeHtml(invoice.clientEmail || invoice.customer?.email || '')}</div>` : ''}
          ${invoice.clientAddress ? `<div>${this.escapeHtml(invoice.clientAddress)}</div>` : ''}
        </div>
      </div>
      <div class="billing-party">
        <h3>From</h3>
        <div class="party-name">${this.escapeHtml(invoice.tenant?.name || 'Company Name')}</div>
      </div>
    </div>

    <!-- Projects -->
    ${projectsHtml}

    <!-- Line Items -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 50%;">Description</th>
          <th style="width: 15%; text-align: center;">Qty</th>
          <th style="width: 17.5%; text-align: right;">Rate</th>
          <th style="width: 17.5%; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals-section">
      <div class="totals-row subtotal">
        <span>Subtotal</span>
        <span>${formatCurrency(invoice.subtotal)}</span>
      </div>
      ${
        invoice.taxRate > 0
          ? `
      <div class="totals-row subtotal">
        <span>Tax (${invoice.taxRate}%)</span>
        <span>${formatCurrency(invoice.taxAmount)}</span>
      </div>
      `
          : ''
      }
      ${
        invoice.discountAmount > 0
          ? `
      <div class="totals-row subtotal">
        <span>Discount</span>
        <span>-${formatCurrency(invoice.discountAmount)}</span>
      </div>
      `
          : ''
      }
      <div class="totals-row total">
        <span>Total</span>
        <span>${formatCurrency(invoice.totalAmount)} ${invoice.currency}</span>
      </div>
      ${
        invoice.amountPaid > 0
          ? `
      <div class="totals-row amount-paid">
        <span>Amount Paid</span>
        <span>${formatCurrency(invoice.amountPaid)}</span>
      </div>
      `
          : ''
      }
      <div class="totals-row balance-due">
        <span>${isOverdue ? 'OVERDUE' : 'Balance Due'}</span>
        <span>${formatCurrency(balanceDue)}</span>
      </div>
    </div>

    <!-- Payment History -->
    ${paymentsHtml}

    <!-- Notes -->
    ${
      invoice.notes
        ? `
    <div class="notes-section">
      <h3>Notes</h3>
      <p>${this.escapeHtml(invoice.notes)}</p>
    </div>
    `
        : ''
    }

    <!-- Payment Terms -->
    ${
      invoice.paymentTerms
        ? `
    <div class="notes-section">
      <h3>Payment Terms</h3>
      <p>${this.escapeHtml(invoice.paymentTerms)}</p>
    </div>
    `
        : ''
    }

    <!-- Footer -->
    <div class="footer">
      <p>Thank you for your business!</p>
      ${invoice.sentTo ? `<p>Questions? Contact us at ${this.escapeHtml(invoice.sentTo)}</p>` : ''}
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
      ${
        batch.payments
          ?.map(
            (payment) => `
        <tr>
          <td>${payment.user?.fullName || 'Unknown'}</td>
          <td>${payment.paymentNumber}</td>
          <td>$${payment.amount.toFixed(2)}</td>
          <td>${payment.status.toUpperCase()}</td>
        </tr>
      `
          )
          .join('') || '<tr><td colspan="4">No payments</td></tr>'
      }
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
