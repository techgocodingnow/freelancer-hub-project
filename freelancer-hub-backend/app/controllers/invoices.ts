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
import {
  createInvoiceValidator,
  generateInvoiceValidator,
  sendInvoiceValidator,
  updateInvoiceValidator,
} from '#validators/invoices'
import invoiceService from '#services/invoice_service'

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
  async show({ tenant, auth, userRole, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

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

    // Permission check: Admin/Owner/Viewer can view all, Members can only view their own
    if (!userRole.canViewAllInvoices()) {
      if (userRole.isMember() && invoice.userId !== user.id) {
        return response.forbidden({
          error: 'You can only view invoices you created',
        })
      } else if (!userRole.isMember()) {
        return response.forbidden({
          error: 'Insufficient permissions to view invoices',
        })
      }
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
    let projectConfigs: Array<{ projectId: number }> = []

    if (data.projectIds && data.projectIds.length > 0) {
      // New format: multiple projects
      projectConfigs = data.projectIds
    } else if (data.projectId) {
      // Old format: single project (backward compatibility)
      projectConfigs = [{ projectId: data.projectId }]
    }

    // Validate: must have either projects or manual items
    const hasProjects = projectConfigs.length > 0
    const hasItems = data.items && data.items.length > 0

    if (!hasProjects && !hasItems) {
      return response.badRequest({
        error: 'Either projects or manual items must be provided',
      })
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

    // Calculate date range from duration or custom dates
    const now = DateTime.now()
    let startDate: DateTime = now.minus({ days: 30 }) // Default fallback
    let endDate: DateTime = now // Default fallback

    if (data.startDate && data.endDate) {
      // Use custom date range
      startDate = DateTime.fromJSDate(data.startDate)
      endDate = DateTime.fromJSDate(data.endDate)
    } else if (data.duration) {
      // Use predefined duration (backward from today)
      switch (data.duration) {
        case '1week':
          startDate = now.minus({ days: 7 })
          endDate = now
          break
        case '2weeks':
          startDate = now.minus({ days: 14 })
          endDate = now
          break
        case '1month':
          startDate = now.minus({ days: 30 })
          endDate = now
          break
        case '3months':
          startDate = now.minus({ days: 90 })
          endDate = now
          break
        case '6months':
          startDate = now.minus({ days: 180 })
          endDate = now
          break
        case '1year':
          startDate = now.minus({ days: 365 })
          endDate = now
          break
        default:
          startDate = now.minus({ days: 30 })
          endDate = now
      }
    } else {
      // Default to 1 month if nothing specified
      startDate = now.minus({ days: 30 })
      endDate = now
    }

    const allItems: Array<{
      description: string
      quantity: number
      unit: string
      unitPrice: number
      amount: number
    }> = []

    // Process each project and generate line items
    const invoiceProjectData: Array<{ projectId: number }> = []

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
      })

      // Fetch time entries for this project with member-specific rates
      // Join with project_members and users to get both project-specific and default hourly rates
      const timeEntriesQuery = db
        .from('time_entries')
        .join('tasks', 'time_entries.task_id', 'tasks.id')
        .join('users', 'time_entries.user_id', 'users.id')
        .leftJoin('project_members', function () {
          this.on('project_members.user_id', 'users.id').andOn(
            'project_members.project_id',
            'tasks.project_id'
          )
        })
        .where('tasks.project_id', project.id)
        .where('time_entries.billable', true)
        .where('time_entries.date', '>=', startDate.toISODate()!)
        .where('time_entries.date', '<=', endDate.toISODate()!)
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

        // Rate priority: project-specific > user default > 0 fallback
        const projectSpecificRate = entry.project_specific_rate
          ? Number(entry.project_specific_rate)
          : null
        const userDefaultRate = entry.user_default_rate ? Number(entry.user_default_rate) : null
        const effectiveRate = projectSpecificRate ?? userDefaultRate ?? 0

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
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        allItems.push({
          description: item.description,
          quantity: item.quantity,
          unit: 'unit',
          unitPrice: item.unitPrice,
          amount: item.quantity * item.unitPrice,
        })
      }
    }

    // Calculate totals
    const subtotal = allItems.reduce((sum, item) => sum + item.amount, 0)

    // Calculate tax
    let taxRate = 0
    let taxAmount = 0
    if (data.taxRate !== undefined) {
      taxRate = data.taxRate
      taxAmount = subtotal * (taxRate / 100)
    } else if (data.taxAmount !== undefined) {
      taxAmount = data.taxAmount
    }

    // Calculate discount
    let discountAmount = 0
    if (data.discountRate !== undefined) {
      discountAmount = subtotal * (data.discountRate / 100)
    } else if (data.discountAmount !== undefined) {
      discountAmount = data.discountAmount
    }

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

    // Determine issue and due dates
    const issueDate = data.issueDate ? DateTime.fromJSDate(data.issueDate) : DateTime.now()
    const dueDate = data.dueDate ? DateTime.fromJSDate(data.dueDate) : issueDate.plus({ days: 30 })

    // Create invoice (keep projectId for backward compatibility with first project)
    const invoice = await Invoice.create({
      tenantId: tenant.id,
      userId: user.id,
      projectId: projectConfigs.length > 0 ? projectConfigs[0].projectId : null,
      customerId: customer.id,
      invoiceNumber,
      status: 'draft',
      issueDate,
      dueDate,
      subtotal,
      taxRate,
      taxAmount,
      discountAmount,
      totalAmount,
      amountPaid: 0,
      notes: data.notes || null,
      currency: 'USD',
      clientName: customer.name,
      clientEmail: customer.email,
      clientAddress: clientAddress || null,
      sentTo: customer.email,
    })

    // Create invoice_projects records
    for (const projectData of invoiceProjectData) {
      await InvoiceProject.create({
        invoiceId: invoice.id,
        projectId: projectData.projectId,
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
   * Update an existing invoice
   * Only draft invoices can be updated
   */
  async update({ tenant, auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const data = await request.validateUsing(updateInvoiceValidator)

    // Load existing invoice
    const invoice = await Invoice.query()
      .where('id', params.id)
      .where('tenant_id', tenant.id)
      .preload('items')
      .preload('projects')
      .first()

    if (!invoice) {
      return response.notFound({ error: 'Invoice not found' })
    }

    // Only draft invoices can be edited
    if (invoice.status !== 'draft') {
      return response.badRequest({
        error: 'Only draft invoices can be edited',
      })
    }

    // Normalize input: convert old format to new format for consistency
    let projectConfigs: Array<{ projectId: number }> = []

    if (data.projectIds && data.projectIds.length > 0) {
      // New format: multiple projects
      projectConfigs = data.projectIds
    } else if (data.projectId) {
      // Old format: single project (backward compatibility)
      projectConfigs = [{ projectId: data.projectId }]
    }

    // Determine customer (use existing if not provided)
    let customerId: number | null = data.customerId || invoice.customerId

    // If no customer provided and projects changed, try to get from first project
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
        error: 'Customer ID is required',
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

    // Calculate date range if provided
    const now = DateTime.now()
    let startDate: DateTime | null = null
    let endDate: DateTime | null = null

    if (data.startDate && data.endDate) {
      // Use custom date range
      startDate = DateTime.fromJSDate(data.startDate)
      endDate = DateTime.fromJSDate(data.endDate)
    } else if (data.duration) {
      // Use predefined duration (backward from today)
      switch (data.duration) {
        case '1week':
          startDate = now.minus({ days: 7 })
          endDate = now
          break
        case '2weeks':
          startDate = now.minus({ days: 14 })
          endDate = now
          break
        case '1month':
          startDate = now.minus({ days: 30 })
          endDate = now
          break
        case '3months':
          startDate = now.minus({ days: 90 })
          endDate = now
          break
        case '6months':
          startDate = now.minus({ days: 180 })
          endDate = now
          break
        case '1year':
          startDate = now.minus({ days: 365 })
          endDate = now
          break
      }
    }

    const allItems: Array<{
      description: string
      quantity: number
      unit: string
      unitPrice: number
      amount: number
    }> = []

    const invoiceProjectData: Array<{ projectId: number }> = []

    // Process each project and generate line items (same logic as store)
    for (const projectConfig of projectConfigs) {
      const project = await Project.query()
        .where('id', projectConfig.projectId)
        .where('tenant_id', tenant.id)
        .first()

      if (!project) {
        return response.notFound({ error: `Project ${projectConfig.projectId} not found` })
      }

      invoiceProjectData.push({
        projectId: project.id,
      })

      // Fetch time entries for this project with member-specific rates (if date range provided)
      if (startDate && endDate) {
        const timeEntriesQuery = db
          .from('time_entries')
          .join('tasks', 'time_entries.task_id', 'tasks.id')
          .join('users', 'time_entries.user_id', 'users.id')
          .leftJoin('project_members', function () {
            this.on('project_members.user_id', 'users.id').andOn(
              'project_members.project_id',
              'tasks.project_id'
            )
          })
          .where('tasks.project_id', project.id)
          .where('time_entries.billable', true)
          .where('time_entries.date', '>=', startDate.toISODate()!)
          .where('time_entries.date', '<=', endDate.toISODate()!)
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

          // Rate priority: project-specific > user default > 0 fallback
          const projectSpecificRate = entry.project_specific_rate
            ? Number(entry.project_specific_rate)
            : null
          const userDefaultRate = entry.user_default_rate ? Number(entry.user_default_rate) : null
          const effectiveRate = projectSpecificRate ?? userDefaultRate ?? 0

          allItems.push({
            description: `Work by ${entry.user_name} on ${project.name}`,
            quantity: Math.round(hours * 100) / 100,
            unit: 'hours',
            unitPrice: effectiveRate,
            amount: hours * effectiveRate,
          })
        }
      }
    }

    // Add manual line items
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        allItems.push({
          description: item.description,
          quantity: item.quantity,
          unit: 'unit',
          unitPrice: item.unitPrice,
          amount: item.quantity * item.unitPrice,
        })
      }
    }

    // Calculate totals
    const subtotal = allItems.reduce((sum, item) => sum + item.amount, 0)

    // Calculate tax
    let taxRate = invoice.taxRate
    let taxAmount = invoice.taxAmount
    if (data.taxRate !== undefined) {
      taxRate = data.taxRate
      taxAmount = subtotal * (taxRate / 100)
    } else if (data.taxAmount !== undefined) {
      taxAmount = data.taxAmount
    }

    // Calculate discount
    let discountAmount = invoice.discountAmount
    if (data.discountRate !== undefined) {
      discountAmount = subtotal * (data.discountRate / 100)
    } else if (data.discountAmount !== undefined) {
      discountAmount = data.discountAmount
    }

    const totalAmount = subtotal + taxAmount - discountAmount

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

    // Determine issue and due dates
    const issueDate = data.issueDate ? DateTime.fromJSDate(data.issueDate) : invoice.issueDate
    const dueDate = data.dueDate ? DateTime.fromJSDate(data.dueDate) : invoice.dueDate

    // Use transaction to update invoice and related records
    const trx = await db.transaction()

    try {
      // Update invoice
      invoice.customerId = customer.id
      invoice.projectId = projectConfigs.length > 0 ? projectConfigs[0].projectId : null
      invoice.issueDate = issueDate
      invoice.dueDate = dueDate
      invoice.subtotal = subtotal
      invoice.taxRate = taxRate
      invoice.taxAmount = taxAmount
      invoice.discountAmount = discountAmount
      invoice.totalAmount = totalAmount
      invoice.notes = data.notes !== undefined ? data.notes : invoice.notes
      invoice.clientName = customer.name
      invoice.clientEmail = customer.email
      invoice.clientAddress = clientAddress || null
      invoice.sentTo = customer.email

      await invoice.useTransaction(trx).save()

      // Delete existing invoice_projects relationships
      await trx.from('invoice_projects').where('invoice_id', invoice.id).delete()

      // Create new invoice_projects records
      for (const projectData of invoiceProjectData) {
        await InvoiceProject.create(
          {
            invoiceId: invoice.id,
            projectId: projectData.projectId,
          },
          { client: trx }
        )
      }

      // Delete existing invoice items
      await trx.from('invoice_items').where('invoice_id', invoice.id).delete()

      // Create new invoice items
      for (const item of allItems) {
        await InvoiceItem.create(
          {
            invoiceId: invoice.id,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            amount: item.amount,
          },
          { client: trx }
        )
      }

      await trx.commit()

      // Load relationships
      await invoice.load('user')
      await invoice.load('customer')
      await invoice.load('projects')
      await invoice.load('items')

      return response.ok({ data: invoice })
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  /**
   * Generate invoice from time entries with automatic line item calculation
   * Supports multiple projects and per-member hourly rates
   */
  async generate({ tenant, auth, userRole, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    if (!userRole.isOwner()) {
      return response.forbidden({
        error: 'Only tenant owners can generate invoices',
      })
    }

    const data = await request.validateUsing(generateInvoiceValidator)

    const customer = await Customer.query()
      .where('id', data.customerId)
      .where('tenant_id', tenant.id)
      .first()

    if (!customer) {
      return response.notFound({ error: 'Customer not found' })
    }

    for (const projectId of data.projectIds) {
      const project = await Project.query()
        .where('id', projectId)
        .where('tenant_id', tenant.id)
        .first()

      if (!project) {
        return response.notFound({ error: `Project with ID ${projectId} not found` })
      }
    }

    const result = await invoiceService.generateLineItems({
      customerId: data.customerId,
      projectIds: data.projectIds,
      startDate: DateTime.fromJSDate(data.startDate),
      endDate: DateTime.fromJSDate(data.endDate),
      tenantId: tenant.id,
      taxRate: data.taxRate,
      discountAmount: data.discountAmount,
    })

    if (result.lineItems.length === 0) {
      return response.badRequest({
        error: 'No billable time entries found for the specified projects and date range',
        warnings: result.warnings,
      })
    }

    const trx = await db.transaction()

    try {
      const invoiceNumber = await invoiceService.generateInvoiceNumber(tenant.id)

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

      const issueDate = DateTime.now()
      const dueDate = issueDate.plus({ days: 30 })

      const invoice = await Invoice.create(
        {
          tenantId: tenant.id,
          userId: user.id,
          customerId: customer.id,
          projectId: data.projectIds[0],
          invoiceNumber,
          status: 'draft',
          issueDate,
          dueDate,
          subtotal: result.subtotal,
          taxRate: data.taxRate || 0,
          taxAmount: result.taxAmount,
          discountAmount: result.discountAmount,
          totalAmount: result.total,
          amountPaid: 0,
          notes: data.notes || null,
          paymentTerms: data.paymentTerms || null,
          currency: 'USD',
          clientName: customer.name,
          clientEmail: customer.email,
          clientAddress: clientAddress || null,
          sentTo: customer.email,
        },
        { client: trx }
      )

      for (const projectId of data.projectIds) {
        await InvoiceProject.create(
          {
            invoiceId: invoice.id,
            projectId,
          },
          { client: trx }
        )
      }

      for (const lineItem of result.lineItems) {
        const invoiceItem = await InvoiceItem.create(
          {
            invoiceId: invoice.id,
            projectMemberId: lineItem.projectMemberId,
            description: lineItem.description,
            quantity: lineItem.quantity,
            unit: lineItem.unit,
            unitPrice: lineItem.unitPrice,
            amount: lineItem.amount,
          },
          { client: trx }
        )

        for (const timeEntryId of lineItem.timeEntryIds) {
          await trx.table('invoice_item_time_entries').insert({
            invoice_item_id: invoiceItem.id,
            time_entry_id: timeEntryId,
            created_at: DateTime.now().toSQL(),
          })
        }
      }

      await trx.commit()

      await invoice.load('user')
      await invoice.load('customer')
      await invoice.load('projects')
      await invoice.load('items', (query) => {
        query.preload('projectMember', (memberQuery) => {
          memberQuery.preload('user')
        })
      })

      return response.created({
        data: invoice,
        warnings: result.warnings,
      })
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  /**
   * Generate invoice from time entries
   */
  async generateFromTimeEntries({ tenant, request, response }: HttpContext) {
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
   * Send invoice via email with CC support and custom content
   */
  async send({ tenant, userRole, params, request, response }: HttpContext) {
    // Permission check: Only Admin/Owner can send invoices
    if (!userRole.canSendInvoices()) {
      return response.forbidden({
        error: 'Insufficient permissions to send invoices',
      })
    }

    const invoice = await Invoice.query()
      .where('id', params.id)
      .where('tenant_id', tenant.id)
      .firstOrFail()

    const data = await request.validateUsing(sendInvoiceValidator)

    try {
      // Generate PDF if not already generated
      if (!invoice.pdfUrl) {
        await pdfService.generateInvoicePDF(invoice)
      }

      // Send email with new options pattern
      await emailService.sendInvoiceEmail({
        invoice,
        to: data.email,
        cc: data.ccEmails,
        subject: data.subject,
        message: data.message,
      })

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
  async generatePdf({ tenant, userRole, params, response }: HttpContext) {
    // Permission check: Only tenant owners can export PDFs
    if (!userRole.isOwner()) {
      return response.forbidden({
        error: 'Only tenant owners can export invoices',
      })
    }

    const invoice = await Invoice.query()
      .where('id', params.id)
      .where('tenant_id', tenant.id)
      .firstOrFail()

    try {
      const pdfBuffer = await pdfService.generateInvoicePDF(invoice)

      // Set response headers for PDF download
      response.header('Content-Type', 'application/pdf')
      response.header(
        'Content-Disposition',
        `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`
      )
      response.header('Content-Length', pdfBuffer.length.toString())

      // Stream PDF buffer directly to response
      return response.send(pdfBuffer)
    } catch (error) {
      return response.internalServerError({
        error: 'Failed to generate PDF',
        details: error.message,
      })
    }
  }
}
