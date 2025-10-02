import type { HttpContext } from '@adonisjs/core/http'
import PayrollBatch from '#models/payroll_batch'
import Payment from '#models/payment'
import payrollService from '#services/payroll_service'
import { DateTime } from 'luxon'

export default class PayrollController {
  /**
   * List all payroll batches for a tenant
   */
  async index({ tenant, request, response }: HttpContext) {
    const page = request.input('_start', 0) / request.input('_end', 10) + 1 || 1
    const perPage = request.input('_end', 10) - request.input('_start', 0) || 10

    const query = PayrollBatch.query()
      .where('tenant_id', tenant.id)
      .preload('creator')
      .preload('payments', (paymentQuery) => {
        paymentQuery.preload('invoice', (invoiceQuery) => {
          invoiceQuery.preload('user')
        })
      })

    // Filters
    const status = request.input('status')
    const startDate = request.input('start_date')
    const endDate = request.input('end_date')

    if (status) {
      query.where('status', status)
    }
    if (startDate) {
      query.where('pay_period_start', '>=', startDate)
    }
    if (endDate) {
      query.where('pay_period_end', '<=', endDate)
    }

    // Sorting
    const sort = request.input('_sort', 'created_at')
    const order = request.input('_order', 'DESC')
    query.orderBy(sort, order)

    const batches = await query.paginate(page, perPage)

    return response.ok(batches.serialize())
  }

  /**
   * Get a single payroll batch
   */
  async show({ tenant, params, response }: HttpContext) {
    const batch = await PayrollBatch.query()
      .where('id', params.id)
      .where('tenant_id', tenant.id)
      .preload('creator')
      .preload('payments', (paymentQuery) => {
        paymentQuery.preload('invoice', (invoiceQuery) => {
          invoiceQuery.preload('user').preload('project')
        })
      })
      .first()

    if (!batch) {
      return response.notFound({ error: 'Payroll batch not found' })
    }

    // Get summary
    const summary = await payrollService.getBatchSummary(batch.id)

    return response.ok({ ...batch.toJSON(), summary })
  }

  /**
   * Calculate payroll (preview before creating batch)
   */
  async calculate({ tenant, request, response }: HttpContext) {
    const { startDate, endDate, userIds } = request.only(['startDate', 'endDate', 'userIds'])

    if (!startDate || !endDate) {
      return response.badRequest({ error: 'Start date and end date are required' })
    }

    let summary
    if (userIds && userIds.length > 0) {
      summary = await payrollService.calculateForUsers(userIds, tenant.id, startDate, endDate)
    } else {
      summary = await payrollService.calculateForAllUsers(tenant.id, startDate, endDate)
    }

    return response.ok({ data: summary })
  }

  /**
   * Create a new payroll batch
   */
  async store({ tenant, auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { startDate, endDate, userIds, notes } = request.only([
      'startDate',
      'endDate',
      'userIds',
      'notes',
    ])

    if (!startDate || !endDate) {
      return response.badRequest({ error: 'Start date and end date are required' })
    }

    // Calculate payroll
    let summary
    if (userIds && userIds.length > 0) {
      summary = await payrollService.calculateForUsers(userIds, tenant.id, startDate, endDate)
    } else {
      summary = await payrollService.calculateForAllUsers(tenant.id, startDate, endDate)
    }

    if (summary.calculations.length === 0) {
      return response.badRequest({ error: 'No billable hours found for the selected period' })
    }

    // Generate batch number
    const batchCount = await PayrollBatch.query().where('tenant_id', tenant.id).count('* as total')
    const batchNumber = `PAYROLL-${String(Number(batchCount[0].$extras.total) + 1).padStart(5, '0')}`

    // Create batch
    const batch = await PayrollBatch.create({
      tenantId: tenant.id,
      createdBy: user.id,
      batchNumber,
      payPeriodStart: DateTime.fromISO(startDate),
      payPeriodEnd: DateTime.fromISO(endDate),
      status: 'draft',
      totalAmount: summary.totalAmount,
      currency: 'USD',
      paymentCount: summary.calculations.length,
      notes,
    })

    // Create payments for each user
    for (const calculation of summary.calculations) {
      // Generate payment number
      const paymentCount = await Payment.query().where('tenant_id', tenant.id).count('* as total')
      const paymentNumber = `PAY-${String(Number(paymentCount[0].$extras.total) + 1).padStart(5, '0')}`

      // Find or create invoice for this user
      const invoice = await this.findOrCreateInvoice(
        tenant.id,
        calculation.userId,
        startDate,
        endDate,
        calculation
      )

      await Payment.create({
        invoiceId: invoice.id,
        tenantId: tenant.id,
        paymentNumber,
        amount: calculation.totalAmount,
        currency: 'USD',
        exchangeRate: null,
        feeAmount: 0,
        netAmount: calculation.totalAmount,
        paymentDate: DateTime.now(),
        paymentMethod: 'bank_transfer',
        status: 'pending',
        payrollBatchId: batch.id,
        timeEntryIds: calculation.timeEntryIds,
        notes: `Payroll for ${DateTime.fromISO(startDate).toFormat('MMM dd')} - ${DateTime.fromISO(endDate).toFormat('MMM dd, yyyy')}`,
      })
    }

    // Load relationships
    await batch.load('payments')
    await batch.load('creator')

    return response.created({ data: batch })
  }

  /**
   * Process a payroll batch (mark as processing/completed)
   */
  async process({ tenant, params, response }: HttpContext) {
    const batch = await PayrollBatch.query()
      .where('id', params.id)
      .where('tenant_id', tenant.id)
      .first()

    if (!batch) {
      return response.notFound({ error: 'Payroll batch not found' })
    }

    if (batch.status !== 'draft' && batch.status !== 'pending') {
      return response.badRequest({ error: 'Batch cannot be processed in current status' })
    }

    // Update batch status
    batch.status = 'processing'
    await batch.save()

    // In a real implementation, this would trigger payment processing
    // For now, we'll just mark payments as completed
    await Payment.query().where('payroll_batch_id', batch.id).update({ status: 'completed' })

    // Update batch to completed
    batch.status = 'completed'
    batch.processedAt = DateTime.now()
    await batch.save()

    await batch.load('payments')

    return response.ok({ data: batch })
  }

  /**
   * Delete a payroll batch (only if draft)
   */
  async destroy({ tenant, params, response }: HttpContext) {
    const batch = await PayrollBatch.query()
      .where('id', params.id)
      .where('tenant_id', tenant.id)
      .first()

    if (!batch) {
      return response.notFound({ error: 'Payroll batch not found' })
    }

    if (batch.status !== 'draft') {
      return response.badRequest({ error: 'Only draft batches can be deleted' })
    }

    // Delete associated payments
    await Payment.query().where('payroll_batch_id', batch.id).delete()

    await batch.delete()

    return response.noContent()
  }

  /**
   * Helper: Find or create invoice for payroll
   */
  private async findOrCreateInvoice(
    tenantId: number,
    userId: number,
    startDate: string,
    endDate: string,
    calculation: any
  ) {
    const Invoice = (await import('#models/invoice')).default

    // Try to find existing draft invoice for this period
    let invoice = await Invoice.query()
      .where('tenant_id', tenantId)
      .where('user_id', userId)
      .where('status', 'draft')
      .where('issue_date', '>=', startDate)
      .where('issue_date', '<=', endDate)
      .first()

    if (!invoice) {
      // Generate invoice number
      const invoiceCount = await Invoice.query().where('tenant_id', tenantId).count('* as total')
      const invoiceNumber = `INV-${String(Number(invoiceCount[0].$extras.total) + 1).padStart(5, '0')}`

      // Create new invoice
      invoice = await Invoice.create({
        tenantId,
        userId,
        invoiceNumber,
        status: 'draft',
        issueDate: DateTime.now(),
        dueDate: DateTime.now().plus({ days: 30 }),
        subtotal: calculation.totalAmount,
        taxRate: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: calculation.totalAmount,
        amountPaid: 0,
        currency: 'USD',
        notes: `Payroll invoice for ${DateTime.fromISO(startDate).toFormat('MMM dd')} - ${DateTime.fromISO(endDate).toFormat('MMM dd, yyyy')}`,
        emailCount: 0,
      })
    }

    return invoice
  }
}
