import type { HttpContext } from '@adonisjs/core/http'
import Invoice from '#models/invoice'
import InvoiceItem from '#models/invoice_item'
import InvoiceProject from '#models/invoice_project'
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
   * Create a manual invoice (with optional multiple projects)
   * Supports backward compatibility with single projectId or new projectIds array
   */
  async store({ tenant, auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const data = await request.validateUsing(createInvoiceValidator)

    // Normalize input: convert old format to new format for consistency
    let projectConfigs: Array<{ projectId: number; hourlyRate: number }> = []

    if (data.projectIds && data.projectIds.length > 0) {
      // New format: multiple projects
      projectConfigs = data.projectIds
    } else if (data.projectId && data.hourlyRate) {
      // Old format: single project (backward compatibility)
      projectConfigs = [{ projectId: data.projectId, hourlyRate: data.hourlyRate }]
    }

    // Determine customer
    let customerId: number | null = data.customerId || null

    // If no customer provided, try to get from first project
    if (!customerId && projectConfigs.length > 0) {
      const firstProject = await Project.query()
        .where('id', projectConfigs[0].projectId)
        .where('tenant_id', tenant.id)
        .first()

      if (firstProject && firstProject.customerId) {
        customerId = firstProject.customerId
      }
    }

    if (!customerId) {
      return response.badRequest({
        error: 'Either customerId or a project with a customer must be provided',
      })
    }

    // Fetch customer
    const customer = await Customer.query()
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

    // Process each project and generate line items
    const invoiceProjectData: Array<{ projectId: number; hourlyRate: number }> = []

    for (const projectConfig of projectConfigs) {
      // Fetch project details
      const project = await Project.query()
        .where('id', projectConfig.projectId)
        .where('tenant_id', tenant.id)
        .first()

      if (!project) {
        return response.notFound({ error: `Project ${projectConfig.projectId} not found` })
      }

      invoiceProjectData.push({
        projectId: project.id,
        hourlyRate: projectConfig.hourlyRate,
      })

      // Fetch time entries for this project with member-specific rates
      // Join with project_members and users to get both project-specific and default hourly rates
      const timeEntriesQuery = db
        .from('time_entries')
        .join('tasks', 'time_entries.task_id', 'tasks.id')
        .join('users', 'time_entries.user_id', 'users.id')
        .leftJoin('project_members', function() {
          this.on('project_members.user_id', 'users.id')
            .andOn('project_members.project_id', 'tasks.project_id')
        })
        .where('tasks.project_id', project.id)
        .where('time_entries.billable', true)
        .where('time_entries.date', '>=', startDate.toSQLDate())
        .where('time_entries.date', '<=', endDate.toSQLDate())
        .select(
          'time_entries.user_id',
          'users.full_name as user_name',
          'users.hourly_rate as user_default_rate',
          'project_members.hourly_rate as project_specific_rate',
          db.raw('SUM(time_entries.duration_minutes) as total_minutes')
        )
        .groupBy(
          'time_entries.user_id',
          'users.full_name',
          'users.hourly_rate',
          'project_members.hourly_rate'
        )

      const timeEntries = await timeEntriesQuery

      // Generate line items per member for this project using rate resolution
      for (const entry of timeEntries) {
        const hours = Number(entry.total_minutes) / 60

        // Rate priority: project-specific > user default > invoice project rate
        const projectSpecificRate = entry.project_specific_rate ? Number(entry.project_specific_rate) : null
        const userDefaultRate = entry.user_default_rate ? Number(entry.user_default_rate) : null
        const effectiveRate = projectSpecificRate ?? userDefaultRate ?? projectConfig.hourlyRate

        allItems.push({
          description: `Work by ${entry.user_name} on ${project.name}`,
          quantity: Math.round(hours * 100) / 100,
          unit: 'hours',
          unitPrice: effectiveRate,
          amount: hours * effectiveRate,
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

    // Create invoice (keep projectId for backward compatibility with first project)
    const invoice = await Invoice.create({
      tenantId: tenant.id,
      userId: user.id,
      projectId: projectConfigs.length > 0 ? projectConfigs[0].projectId : null,
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

    // Create invoice_projects records
    for (const projectData of invoiceProjectData) {
      await InvoiceProject.create({
        invoiceId: invoice.id,
        projectId: projectData.projectId,
        hourlyRate: projectData.hourlyRate,
      })
    }

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
    await invoice.load('projects')
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
