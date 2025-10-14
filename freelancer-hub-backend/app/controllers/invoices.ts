import type { HttpContext } from '@adonisjs/core/http'
import Invoice from '#models/invoice'
import InvoiceItem from '#models/invoice_item'
import TimeEntry from '#models/time_entry'
import Customer from '#models/customer'
import Project from '#models/project'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import pdfService from '#services/pdf_service'
import emailService from '#services/email_service'
import { createInvoiceValidator } from '#validators/invoices'

export default class InvoicesController {
  /**
   * List all invoices for a tenant
   */
  async index({ tenant, request, response }: HttpContext) {
    const page = request.input('_start', 0) / request.input('_end', 10) + 1 || 1
    const perPage = request.input('_end', 10) - request.input('_start', 0) || 10

    const query = Invoice.query()
      .where('tenant_id', tenant.id)
      .preload('user')
      .preload('project')
      .preload('customer')
      .preload('items')
      .preload('payments')

    // Filters
    const userId = request.input('user_id')
    const projectId = request.input('project_id')
    const status = request.input('status')
    const startDate = request.input('start_date')
    const endDate = request.input('end_date')

    if (userId) {
      query.where('user_id', userId)
    }
    if (projectId) {
      query.where('project_id', projectId)
    }
    if (status) {
      query.where('status', status)
    }
    if (startDate) {
      query.where('issue_date', '>=', startDate)
    }
    if (endDate) {
      query.where('issue_date', '<=', endDate)
    }

    // Sorting
    const sort = request.input('_sort', 'issue_date')
    const order = request.input('_order', 'DESC')
    query.orderBy(sort, order)

    const invoices = await query.paginate(page, perPage)
    return response.ok(invoices.serialize())
  }

  /**
   * Get a single invoice
   */
  async show({ tenant, params, response }: HttpContext) {
    const invoice = await Invoice.query()
      .where('id', params.id)
      .where('tenant_id', tenant.id)
      .preload('user')
      .preload('project')
      .preload('customer')
      .preload('items', (query) => {
        query.preload('timeEntry')
      })
      .preload('payments')
      .first()

    if (!invoice) {
      return response.notFound({ error: 'Invoice not found' })
    }

    return response.ok(invoice)
  }

  /**
   * Create a manual invoice (with optional project-based time entries)
   */
  async store({ tenant, auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const data = await request.validateUsing(createInvoiceValidator)

    let customer: Customer | null = null
    let project: Project | null = null
    let projectId: number | null = null
    let customerId: number | null = null

    // Handle project-based invoice
    if (data.projectId) {
      project = await Project.query()
        .where('id', data.projectId)
        .where('tenant_id', tenant.id)
        .preload('customer')
        .first()

      if (!project) {
        return response.notFound({ error: 'Project not found' })
      }

      projectId = project.id

      // Use project's customer if no customerId provided
      if (data.customerId) {
        customerId = data.customerId
      } else if (project.customerId) {
        customerId = project.customerId
      }
    } else if (data.customerId) {
      customerId = data.customerId
    }

    // Fetch customer details
    if (!customerId) {
      return response.badRequest({
        error: 'Either customerId or a project with a customer must be provided',
      })
    }

    customer = await Customer.query()
      .where('id', customerId)
      .where('tenant_id', tenant.id)
      .first()

    if (!customer) {
      return response.notFound({ error: 'Customer not found' })
    }

    // Calculate date range from duration
    const now = DateTime.now()
    let startDate: DateTime
    let endDate: DateTime

    switch (data.duration) {
      case '1week':
        startDate = now
        endDate = now.plus({ days: 7 })
        break
      case '2weeks':
        startDate = now
        endDate = now.plus({ days: 14 })
        break
      case '1month':
        startDate = now
        endDate = now.plus({ days: 30 })
        break
    }

    const allItems: Array<{
      description: string
      quantity: number
      unit: string
      unitPrice: number
      amount: number
    }> = []

    // If project selected, fetch time entries and generate line items per member
    if (projectId && data.hourlyRate) {
      const timeEntriesQuery = db
        .from('time_entries')
        .join('tasks', 'time_entries.task_id', 'tasks.id')
        .join('users', 'time_entries.user_id', 'users.id')
        .where('tasks.project_id', projectId)
        .where('time_entries.billable', true)
        .where('time_entries.date', '>=', startDate.toSQLDate())
        .where('time_entries.date', '<=', endDate.toSQLDate())
        .select(
          'time_entries.user_id',
          'users.full_name as user_name',
          db.raw('SUM(time_entries.duration_minutes) as total_minutes')
        )
        .groupBy('time_entries.user_id', 'users.full_name')

      const timeEntries = await timeEntriesQuery

      // Generate line items per member
      for (const entry of timeEntries) {
        const hours = Number(entry.total_minutes) / 60
        allItems.push({
          description: `Work by ${entry.user_name}`,
          quantity: Math.round(hours * 100) / 100, // Round to 2 decimals
          unit: 'hours',
          unitPrice: data.hourlyRate,
          amount: hours * data.hourlyRate,
        })
      }
    }

    // Add manual line items
    for (const item of data.items) {
      allItems.push({
        description: item.description,
        quantity: item.quantity,
        unit: 'unit',
        unitPrice: item.unitPrice,
        amount: item.quantity * item.unitPrice,
      })
    }

    // Calculate totals
    const subtotal = allItems.reduce((sum, item) => sum + item.amount, 0)
    const taxRate = 0
    const taxAmount = 0
    const discountAmount = 0
    const totalAmount = subtotal + taxAmount - discountAmount

    // Generate invoice number
    const invoiceCount = await Invoice.query().where('tenant_id', tenant.id).count('* as total')
    const invoiceNumber = `INV-${String(Number(invoiceCount[0].$extras.total) + 1).padStart(5, '0')}`

    // Prepare client info
    const clientAddress = [
      customer.addressLine1,
      customer.addressLine2,
      customer.city,
      customer.state,
      customer.postalCode,
      customer.country,
    ]
      .filter(Boolean)
      .join(', ')

    // Create invoice
    const invoice = await Invoice.create({
      tenantId: tenant.id,
      userId: user.id,
      projectId,
      customerId: customer.id,
      invoiceNumber,
      status: 'draft',
      issueDate: DateTime.now(),
      dueDate: DateTime.now().plus({ days: 30 }),
      subtotal,
      taxRate,
      taxAmount,
      discountAmount,
      totalAmount,
      amountPaid: 0,
      currency: 'USD',
      clientName: customer.name,
      clientEmail: data.toEmail || customer.email,
      clientAddress: clientAddress || null,
      sentTo: data.toEmail || customer.email,
    })

    // Create invoice items
    for (const item of allItems) {
      await InvoiceItem.create({
        invoiceId: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        amount: item.amount,
      })
    }

    // Load relationships
    await invoice.load('user')
    await invoice.load('customer')
    if (projectId) {
      await invoice.load('project')
    }
    await invoice.load('items')

    return response.created({ data: invoice })
  }

  /**
   * Generate invoice from time entries
   */
  async generateFromTimeEntries({ tenant, auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const {
      userId,
      projectId,
      startDate,
      endDate,
      hourlyRate,
      taxRate = 0,
      discountAmount = 0,
      notes,
    } = request.only([
      'userId',
      'projectId',
      'startDate',
      'endDate',
      'hourlyRate',
      'taxRate',
      'discountAmount',
      'notes',
    ])

    // Fetch billable time entries
    const timeEntries = await TimeEntry.query()
      .join('tasks', 'time_entries.task_id', 'tasks.id')
      .join('projects', 'tasks.project_id', 'projects.id')
      .where('projects.tenant_id', tenant.id)
      .where('time_entries.billable', true)
      .where('time_entries.user_id', userId)
      .where('time_entries.date', '>=', startDate)
      .where('time_entries.date', '<=', endDate)
      .if(projectId, (query) => {
        query.where('projects.id', projectId)
      })
      .select('time_entries.*')

    if (timeEntries.length === 0) {
      return response.badRequest({
        error: 'No billable time entries found for the specified period',
      })
    }

    // Calculate totals
    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.durationMinutes / 60, 0)
    const subtotal = totalHours * hourlyRate
    const taxAmount = subtotal * (taxRate / 100)
    const totalAmount = subtotal + taxAmount - discountAmount

    // Generate invoice number
    const invoiceCount = await Invoice.query().where('tenant_id', tenant.id).count('* as total')
    const invoiceNumber = `INV-${String(Number(invoiceCount[0].$extras.total) + 1).padStart(5, '0')}`

    // Get customer from project if available
    let customerId = null
    let clientName = null
    let clientEmail = null
    let clientAddress = null

    if (projectId) {
      const project = await db
        .from('projects')
        .leftJoin('customers', 'projects.customer_id', 'customers.id')
        .where('projects.id', projectId)
        .select('customers.*')
        .first()

      if (project) {
        customerId = project.id
        clientName = project.name
        clientEmail = project.email
        clientAddress = [
          project.address_line1,
          project.address_line2,
          project.city,
          project.state,
          project.postal_code,
          project.country,
        ]
          .filter(Boolean)
          .join(', ')
      }
    }

    // Create invoice
    const invoice = await Invoice.create({
      tenantId: tenant.id,
      userId,
      projectId: projectId || null,
      customerId,
      invoiceNumber,
      status: 'draft',
      issueDate: DateTime.now(),
      dueDate: DateTime.now().plus({ days: 30 }),
      subtotal,
      taxRate,
      taxAmount,
      discountAmount,
      totalAmount,
      amountPaid: 0,
      notes,
      currency: 'USD',
      clientName,
      clientEmail,
      clientAddress,
    })

    // Create invoice items from time entries
    for (const entry of timeEntries) {
      await InvoiceItem.create({
        invoiceId: invoice.id,
        timeEntryId: entry.id,
        description: `Time entry on ${entry.date.toFormat('yyyy-MM-dd')}`,
        quantity: entry.durationMinutes / 60,
        unit: 'hours',
        unitPrice: hourlyRate,
        amount: (entry.durationMinutes / 60) * hourlyRate,
      })
    }

    // Load relationships
    await invoice.load('user')
    await invoice.load('project')
    await invoice.load('customer')
    await invoice.load('items')

    return response.created({ data: invoice })
  }

  /**
   * Update invoice status
   */
  async updateStatus({ tenant, params, request, response }: HttpContext) {
    const invoice = await Invoice.query()
      .where('id', params.id)
      .where('tenant_id', tenant.id)
      .first()

    if (!invoice) {
      return response.notFound({ error: 'Invoice not found' })
    }

    const { status } = request.only(['status'])

    invoice.status = status

    if (status === 'paid' && !invoice.paidDate) {
      invoice.paidDate = DateTime.now()
    }

    await invoice.save()

    return response.ok({ data: invoice })
  }

  /**
   * Delete invoice
   */
  async destroy({ tenant, params, response }: HttpContext) {
    const invoice = await Invoice.query()
      .where('id', params.id)
      .where('tenant_id', tenant.id)
      .first()

    if (!invoice) {
      return response.notFound({ error: 'Invoice not found' })
    }

    await invoice.delete()

    return response.noContent()
  }

  /**
   * Send invoice via email
   */
  async send({ tenant, params, request, response }: HttpContext) {
    const invoice = await Invoice.query()
      .where('id', params.id)
      .where('tenant_id', tenant.id)
      .firstOrFail()

    const recipientEmail = request.input('email')

    try {
      // Generate PDF if not already generated
      if (!invoice.pdfUrl) {
        await pdfService.generateInvoicePDF(invoice)
      }

      // Send email
      await emailService.sendInvoiceEmail(invoice, recipientEmail)

      // Update status to sent if it was draft
      if (invoice.status === 'draft') {
        invoice.status = 'sent'
        await invoice.save()
      }

      await invoice.refresh()
      await invoice.load('user')

      return response.ok({
        data: invoice,
        message: 'Invoice sent successfully',
      })
    } catch (error) {
      return response.badRequest({
        error: 'Failed to send invoice',
        details: error.message,
      })
    }
  }

  /**
   * Generate PDF for invoice
   */
  async generatePdf({ tenant, params, response }: HttpContext) {
    const invoice = await Invoice.query()
      .where('id', params.id)
      .where('tenant_id', tenant.id)
      .firstOrFail()

    try {
      const pdfUrl = await pdfService.generateInvoicePDF(invoice)

      await invoice.refresh()
      await invoice.load('user')

      return response.ok({
        data: invoice,
        pdfUrl,
        message: 'PDF generated successfully',
      })
    } catch (error) {
      return response.badRequest({
        error: 'Failed to generate PDF',
        details: error.message,
      })
    }
  }
}
